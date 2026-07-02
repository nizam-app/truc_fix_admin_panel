import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  Search,
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

type AdminDispute = {
  _id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  amount: number;
  currency: string;
  company: {
    _id: string;
    companyName: string | null;
    email: string | null;
  } | null;
  customerName: string | null;
  mechanic: {
    _id: string;
    displayName: string | null;
    email: string | null;
  } | null;
  serviceLabel: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

type DisputesResponse = {
  status: string;
  message: string;
  data: {
    items: AdminDispute[];
    stats: {
      open: number;
      inReview: number;
      resolved: number;
      amountAtRisk: number;
    };
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const formatPriority = (priority: string) =>
  priority.charAt(0) + priority.slice(1).toLowerCase();

const formatStatus = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatAmount = (amount: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-red-100 text-red-800";
    case "IN_REVIEW":
      return "bg-yellow-100 text-yellow-800";
    case "RESOLVED":
      return "bg-green-100 text-green-800";
    case "CLOSED":
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-slate-100 text-slate-800";
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
      return "bg-slate-100 text-slate-800";
  }
};

export function Disputes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [stats, setStats] = useState({
    open: 0,
    inReview: 0,
    resolved: 0,
    amountAtRisk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<
    "VIEW" | "RESPOND" | "RESOLVE" | "CLOSE"
  >("VIEW");
  const [activeDispute, setActiveDispute] = useState<AdminDispute | null>(null);
  const [dialogNote, setDialogNote] = useState("");

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "All Status" },
      { value: "OPEN", label: "Open" },
      { value: "IN_REVIEW", label: "In Review" },
      { value: "RESOLVED", label: "Resolved" },
      { value: "CLOSED", label: "Closed" },
    ],
    []
  );

  const fetchDisputes = async () => {
    if (!accessToken) {
      setLoading(false);
      setError("Your admin session has expired. Please sign in again.");
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
        `${apiBaseUrl}/admin/disputes?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const payload = (await response.json()) as DisputesResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load disputes.");
      }

      setDisputes(payload.data.items || []);
      setStats(
        payload.data.stats || {
          open: 0,
          inReview: 0,
          resolved: 0,
          amountAtRisk: 0,
        }
      );
    } catch (fetchError) {
      setDisputes([]);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load disputes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchDisputes();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, statusFilter, priorityFilter]);

  const updateDispute = async (
    disputeId: string,
    payload: Record<string, unknown>,
    successMessage: string
  ) => {
    if (!accessToken) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await adminFetch(`/admin/disputes/${disputeId}`, {
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
        throw new Error(result.message || "Unable to update dispute.");
      }

      setFeedback(successMessage);
      setOpenDropdown(null);
      await fetchDisputes();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update dispute."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (dispute: AdminDispute) => {
    setActiveDispute(dispute);
    setDialogMode("VIEW");
    setDialogNote("");
    setDialogOpen(true);
    setOpenDropdown(null);
  };

  const handleRespond = async (dispute: AdminDispute) => {
    setActiveDispute(dispute);
    setDialogMode("RESPOND");
    setDialogNote("Admin review note added to the dispute record.");
    setDialogOpen(true);
  };

  const handleMarkInReview = async (dispute: AdminDispute) => {
    await updateDispute(
      dispute._id,
      { status: "IN_REVIEW" },
      "Dispute moved to in review."
    );
  };

  const handleResolve = async (dispute: AdminDispute) => {
    setActiveDispute(dispute);
    setDialogMode("RESOLVE");
    setDialogNote("Resolved by admin operations after review.");
    setDialogOpen(true);
  };

  const handleReject = async (dispute: AdminDispute) => {
    setActiveDispute(dispute);
    setDialogMode("CLOSE");
    setDialogNote("Closed after review by admin operations.");
    setDialogOpen(true);
  };

  const submitDialogAction = async () => {
    if (!activeDispute) return;
    const note = dialogNote.trim();

    if (dialogMode === "RESPOND") {
      if (!note) {
        setError("Response note is required.");
        return;
      }
      await updateDispute(
        activeDispute._id,
        { notes: note },
        "Response note added to the dispute."
      );
    }

    if (dialogMode === "RESOLVE") {
      await updateDispute(
        activeDispute._id,
        { status: "RESOLVED", notes: note || undefined },
        "Dispute marked as resolved."
      );
    }

    if (dialogMode === "CLOSE") {
      await updateDispute(
        activeDispute._id,
        { status: "CLOSED", notes: note || undefined },
        "Dispute closed."
      );
    }

    setDialogOpen(false);
    setActiveDispute(null);
    setDialogMode("VIEW");
    setDialogNote("");
  };

  return (
    <div>
      <Dialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          setDialogOpen(nextOpen);
          if (!nextOpen) {
            setActiveDispute(null);
            setDialogMode("VIEW");
            setDialogNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "VIEW"
                ? "Dispute details"
                : dialogMode === "RESPOND"
                ? "Respond to dispute"
                : dialogMode === "RESOLVE"
                ? "Resolve dispute"
                : "Close dispute"}
            </DialogTitle>
            <DialogDescription>
              {activeDispute
                ? `#${activeDispute._id.slice(-6)} · ${activeDispute.title}`
                : "No dispute selected."}
            </DialogDescription>
          </DialogHeader>

          {activeDispute ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`${getStatusColor(activeDispute.status)} border-transparent`}
                >
                  {formatStatus(activeDispute.status)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`${getPriorityColor(activeDispute.priority)} border-transparent`}
                >
                  {formatPriority(activeDispute.priority)}
                </Badge>
                <span className="text-xs text-gray-500">
                  Created {formatFullDate(activeDispute.createdAt)}
                </span>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs font-medium text-gray-500">Summary</p>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-gray-900">Company:</span>{" "}
                    {activeDispute.company?.companyName ||
                      activeDispute.company?.email ||
                      "Unknown company"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Customer:</span>{" "}
                    {activeDispute.customerName || "Unknown customer"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Mechanic:</span>{" "}
                    {activeDispute.mechanic?.displayName ||
                      activeDispute.mechanic?.email ||
                      "Unassigned"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Service:</span>{" "}
                    {activeDispute.serviceLabel || "Not linked"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Reason:</span>{" "}
                    {activeDispute.reason || "Not specified"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Amount:</span>{" "}
                    {formatAmount(activeDispute.amount, activeDispute.currency)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs font-medium text-gray-500">Description</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                  {activeDispute.description || "No dispute description was provided."}
                </p>
              </div>

              {dialogMode !== "VIEW" ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {dialogMode === "RESPOND"
                      ? "Response note"
                      : dialogMode === "RESOLVE"
                      ? "Resolution note (optional)"
                      : "Closing note (optional)"}
                  </p>
                  <Textarea
                    value={dialogNote}
                    onChange={(e) => setDialogNote(e.target.value)}
                    placeholder="Write a note for this dispute..."
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
              No dispute selected.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Close
            </Button>
            {dialogMode !== "VIEW" ? (
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30"
                onClick={() => void submitDialogAction()}
                disabled={submitting || !activeDispute}
              >
                {submitting
                  ? "Saving..."
                  : dialogMode === "RESPOND"
                  ? "Add note"
                  : dialogMode === "RESOLVE"
                  ? "Resolve"
                  : "Close dispute"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution</h1>
        <p className="mt-1 text-gray-600">
          Handle service disputes, billing questions, and refund reviews
        </p>
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
            <p className="text-sm text-gray-600">Open Disputes</p>
            <div className="rounded-lg bg-red-100 p-2">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.open}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">In Review</p>
            <div className="rounded-lg bg-yellow-100 p-2">
              <RefreshCw className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.inReview}</p>
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
            <p className="text-sm text-gray-600">Amount at Risk</p>
            <div className="rounded-lg bg-purple-100 p-2">
              <AlertTriangle className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatAmount(stats.amountAtRisk)}
          </p>
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
              placeholder="Search by title, company, customer, or service..."
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
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
            Loading disputes...
          </div>
        ) : disputes.length === 0 ? (
          <div className="rounded-lg bg-white p-10 text-center text-sm text-gray-500 shadow">
            No disputes matched this filter yet.
          </div>
        ) : (
          disputes.map((dispute) => (
            <div
              key={dispute._id}
              className="rounded-lg bg-white shadow transition-shadow hover:shadow-md"
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="mt-1">
                      <AlertTriangle className="text-red-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          #{dispute._id.slice(-6)} - {dispute.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(
                            dispute.priority
                          )}`}
                        >
                          {formatPriority(dispute.priority)}
                        </span>
                      </div>

                      <p className="mb-3 text-sm text-gray-600">
                        {dispute.description || "No dispute description was added."}
                      </p>

                      <div className="mb-3 grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <strong>Company:</strong>{" "}
                          {dispute.company?.companyName ||
                            dispute.company?.email ||
                            "Unknown company"}
                        </div>
                        <div>
                          <strong>Customer:</strong>{" "}
                          {dispute.customerName || "Unknown customer"}
                        </div>
                        <div>
                          <strong>Mechanic:</strong>{" "}
                          {dispute.mechanic?.displayName ||
                            dispute.mechanic?.email ||
                            "Unassigned"}
                        </div>
                        <div>
                          <strong>Service:</strong>{" "}
                          {dispute.serviceLabel || "Not linked"}
                        </div>
                        <div>
                          <strong>Amount:</strong>{" "}
                          {formatAmount(dispute.amount, dispute.currency)}
                        </div>
                        <div>
                          <strong>Reason:</strong>{" "}
                          {dispute.reason || "Not specified"}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Created: {formatFullDate(dispute.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        dispute.status
                      )}`}
                    >
                      {formatStatus(dispute.status)}
                    </span>
                    <div className="relative">
                      <button
                        className="rounded p-1 hover:bg-gray-100"
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === dispute._id ? null : dispute._id
                          )
                        }
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openDropdown === dispute._id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenDropdown(null)}
                          />

                          <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                            <div className="py-1">
                              <button
                                onClick={() => handleView(dispute)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye size={16} />
                                <span>View Details</span>
                              </button>

                              <button
                                onClick={() => void handleRespond(dispute)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={submitting}
                              >
                                <MessageCircle size={16} />
                                <span>Respond to Dispute</span>
                              </button>

                              <div className="my-1 border-t border-gray-200" />

                              {dispute.status !== "IN_REVIEW" ? (
                                <button
                                  onClick={() => void handleMarkInReview(dispute)}
                                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  disabled={submitting}
                                >
                                  <RefreshCw size={16} />
                                  <span>Mark In Review</span>
                                </button>
                              ) : null}

                              {dispute.status !== "RESOLVED" &&
                              dispute.status !== "CLOSED" ? (
                                <button
                                  onClick={() => void handleResolve(dispute)}
                                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  disabled={submitting}
                                >
                                  <CheckCircle size={16} />
                                  <span>Mark as Resolved</span>
                                </button>
                              ) : null}

                              {dispute.status !== "CLOSED" ? (
                                <button
                                  onClick={() => void handleReject(dispute)}
                                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  disabled={submitting}
                                >
                                  <XCircle size={16} />
                                  <span>Reject Dispute</span>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
