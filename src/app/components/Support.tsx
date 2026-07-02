import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Search,
  Wrench,
  XCircle,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
import { adminFetch } from "../apiClient";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";

type SupportTicket = {
  _id: string;
  subject: string;
  message: string;
  category: string;
  status: {
    value: string;
    label: string;
    tone: string;
  };
  priority: string;
  user: {
    _id: string;
    email: string | null;
    companyName: string | null;
    displayName: string | null;
  } | null;
  assignedTo: {
    _id: string;
    email: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type SupportApiResponse = {
  status: string;
  message: string;
  data: {
    items: SupportTicket[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: {
      open: number;
      inProgress: number;
      resolved: number;
      highPriority: number;
    };
  };
};

const formatTicketPriority = (priority: string) =>
  priority.charAt(0) + priority.slice(1).toLowerCase();

const formatTicketStatus = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-yellow-100 text-yellow-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "RESOLVED":
      return "bg-green-100 text-green-800";
    case "CLOSED":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-800";
    case "MEDIUM":
      return "bg-orange-100 text-orange-800";
    case "LOW":
      return "bg-green-100 text-green-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "OPEN":
      return <AlertCircle className="text-yellow-600" size={20} />;
    case "IN_PROGRESS":
      return <Clock className="text-blue-600" size={20} />;
    case "RESOLVED":
      return <CheckCircle className="text-green-600" size={20} />;
    default:
      return <MessageSquare className="text-slate-600" size={20} />;
  }
};

const formatRelativeDate = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(Math.round(diffMs / 60000), 0);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} days ago`;
};

const formatFullDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function Support() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketAction, setTicketAction] = useState<
    "VIEW" | "START_WORK" | "RESOLVE" | "CLOSE"
  >("VIEW");
  const [ticketNote, setTicketNote] = useState("");

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const fetchTickets = async () => {
    if (!accessToken) {
      setError("Your admin session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "100" });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);

      const response = await fetch(
        `${apiBaseUrl}/admin/support?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const payload = (await response.json()) as SupportApiResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load support tickets.");
      }

      setTickets(payload.data.items || []);
      setStats(
        payload.data.stats || {
          open: 0,
          inProgress: 0,
          resolved: 0,
          highPriority: 0,
        }
      );
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load support tickets."
      );
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchTickets();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, statusFilter, priorityFilter]);

  const updateTicket = async (
    ticketId: string,
    payload: {
      status?: string;
      resolution?: string;
    },
    successMessage: string
  ) => {
    if (!accessToken) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await adminFetch(`/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        status: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message || "Unable to update support ticket.");
      }

      setFeedback(successMessage);
      await fetchTickets();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update support ticket."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setTicketAction("RESOLVE");
    setTicketNote("Resolved by admin support after review.");
    setTicketDialogOpen(true);
  };

  const handleClose = async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setTicketAction("CLOSE");
    setTicketNote("Closed by admin support.");
    setTicketDialogOpen(true);
  };

  const handleTakeOwnership = async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setTicketAction("START_WORK");
    setTicketNote("Admin support picked up this case.");
    setTicketDialogOpen(true);
  };

  const handleView = (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setTicketAction("VIEW");
    setTicketNote("");
    setTicketDialogOpen(true);
  };

  const submitTicketAction = async () => {
    if (!activeTicket) return;
    const note = ticketNote.trim();

    if (ticketAction === "RESOLVE") {
      if (!note) {
        setError("Resolution note is required to resolve a ticket.");
        return;
      }
      await updateTicket(
        activeTicket._id,
        { status: "RESOLVED", resolution: note },
        "Support ticket marked as resolved."
      );
    }

    if (ticketAction === "CLOSE") {
      await updateTicket(
        activeTicket._id,
        { status: "CLOSED", resolution: note || undefined },
        "Support ticket closed."
      );
    }

    if (ticketAction === "START_WORK") {
      await updateTicket(
        activeTicket._id,
        { status: "IN_PROGRESS", resolution: note || undefined },
        "Support ticket moved to in progress."
      );
    }

    setTicketDialogOpen(false);
    setActiveTicket(null);
    setTicketAction("VIEW");
    setTicketNote("");
  };

  return (
    <div>
      <Dialog
        open={ticketDialogOpen}
        onOpenChange={(nextOpen) => {
          setTicketDialogOpen(nextOpen);
          if (!nextOpen) {
            setActiveTicket(null);
            setTicketAction("VIEW");
            setTicketNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {ticketAction === "VIEW"
                ? "Support ticket"
                : ticketAction === "START_WORK"
                ? "Start work"
                : ticketAction === "RESOLVE"
                ? "Resolve ticket"
                : "Close ticket"}
            </DialogTitle>
            <DialogDescription>
              {activeTicket
                ? `#${activeTicket._id.slice(-6)} · ${activeTicket.subject}`
                : "No ticket selected."}
            </DialogDescription>
          </DialogHeader>

          {activeTicket ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`${getStatusColor(activeTicket.status.value)} border-transparent`}
                >
                  {formatTicketStatus(activeTicket.status.value)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`${getPriorityColor(activeTicket.priority)} border-transparent`}
                >
                  {formatTicketPriority(activeTicket.priority)}
                </Badge>
                <span className="text-xs text-gray-500">
                  Created {formatFullDate(activeTicket.createdAt)}
                </span>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs font-medium text-gray-500">User</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {activeTicket.user?.companyName ||
                    activeTicket.user?.displayName ||
                    activeTicket.user?.email ||
                    "Unknown user"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Category: {activeTicket.category} · Assigned:{" "}
                  {activeTicket.assignedTo?.email || "Unassigned"}
                </p>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs font-medium text-gray-500">Message</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                  {activeTicket.message}
                </p>
              </div>

              {ticketAction !== "VIEW" ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {ticketAction === "RESOLVE"
                      ? "Resolution note"
                      : "Internal note (optional)"}
                  </p>
                  <Textarea
                    value={ticketNote}
                    onChange={(e) => setTicketNote(e.target.value)}
                    placeholder={
                      ticketAction === "RESOLVE"
                        ? "Describe what was done to resolve the issue..."
                        : "Add an internal note for this update..."
                    }
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
              No ticket selected.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTicketDialogOpen(false)}
              disabled={submitting}
            >
              Close
            </Button>
            {ticketAction !== "VIEW" ? (
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30"
                onClick={() => void submitTicketAction()}
                disabled={submitting || !activeTicket}
              >
                {submitting
                  ? "Saving..."
                  : ticketAction === "START_WORK"
                  ? "Start work"
                  : ticketAction === "RESOLVE"
                  ? "Resolve"
                  : "Close ticket"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-1 text-gray-600">
            Manage billing, technical, and account help requests from fleets and
            mechanics
          </p>
        </div>
      </div>

      {(error || feedback) && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error || feedback}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Open Tickets</p>
            <div className="rounded-lg bg-yellow-100 p-2">
              <AlertCircle className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.open}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">In Progress</p>
            <div className="rounded-lg bg-blue-100 p-2">
              <Clock className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Resolved</p>
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">High Priority</p>
            <div className="rounded-lg bg-red-100 p-2">
              <AlertCircle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.highPriority}</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by subject, company, email, or user..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="ALL">All Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-lg bg-white p-10 text-center text-sm text-gray-500 shadow">
            Loading support tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-lg bg-white p-10 text-center text-sm text-gray-500 shadow">
            No support tickets matched this filter yet.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="rounded-lg bg-white shadow transition-shadow hover:shadow-md"
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="mt-1">{getStatusIcon(ticket.status.value)}</div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          #{ticket._id.slice(-6)} - {ticket.subject}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {formatTicketPriority(ticket.priority)}
                        </span>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>
                          <strong>User:</strong>{" "}
                          {ticket.user?.companyName ||
                            ticket.user?.displayName ||
                            ticket.user?.email ||
                            "Unknown user"}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Category:</strong> {ticket.category}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Assigned:</strong>{" "}
                          {ticket.assignedTo?.email || "Unassigned"}
                        </span>
                      </div>

                      <p className="mb-3 max-w-3xl text-sm text-gray-700">
                        {ticket.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span>Created: {formatFullDate(ticket.createdAt)}</span>
                        <span>•</span>
                        <span>Last update: {formatRelativeDate(ticket.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        ticket.status.value
                      )}`}
                    >
                      {formatTicketStatus(ticket.status.value)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-gray-50 text-gray-700 hover:bg-gray-100"
                    onClick={() => handleView(ticket)}
                  >
                    <Eye size={16} />
                    View Details
                  </Button>

                  {ticket.status.value !== "IN_PROGRESS" &&
                  ticket.status.value !== "RESOLVED" &&
                  ticket.status.value !== "CLOSED" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      onClick={() => void handleTakeOwnership(ticket)}
                      disabled={submitting}
                    >
                      <Wrench size={16} />
                      Start Work
                    </Button>
                  ) : null}

                  {ticket.status.value !== "RESOLVED" &&
                  ticket.status.value !== "CLOSED" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-green-50 text-green-700 hover:bg-green-100"
                      onClick={() => void handleResolve(ticket)}
                      disabled={submitting}
                    >
                      <CheckCircle size={16} />
                      Mark Resolved
                    </Button>
                  ) : null}

                  {ticket.status.value !== "CLOSED" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-red-50 text-red-700 hover:bg-red-100"
                      onClick={() => void handleClose(ticket)}
                      disabled={submitting}
                    >
                      <XCircle size={16} />
                      Close Ticket
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
