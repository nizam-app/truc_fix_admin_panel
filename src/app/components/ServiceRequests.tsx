import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  UserPlus,
  DollarSign,
  MessageSquare,
  Calendar,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
import { linesToDialogRows, useAdminDialog } from "../adminDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type ServiceRequestItem = {
  _id: string;
  requestId: string;
  truckDetails: {
    registration: string | null;
    label: string;
    type: string | null;
  };
  driver: {
    name: string | null;
    phone: string | null;
    companyName: string | null;
  };
  issue: {
    title: string;
    description: string;
    type: string;
  };
  priority: {
    value: string;
    label: string;
  };
  status: {
    value: string;
    label: string;
    tone: string;
    raw: string;
  };
  assignedTo: {
    _id: string;
    name: string | null;
    phone: string | null;
  } | null;
  amount: number | null;
  currency: string;
  quoteCount: number;
  postedAt: string;
  updatedAt: string;
};

type ServiceRequestStats = {
  totalRequests: number;
  pending: number;
  inProgress: number;
  completed: number;
};

type ServiceRequestsApiResponse = {
  status: string;
  message: string;
  data: {
    items: ServiceRequestItem[];
    stats: ServiceRequestStats;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ServiceRequestDetailApiResponse = {
  status: string;
  message: string;
  data: ServiceRequestItem & {
    mode: string;
    scheduledFor: string | null;
    availabilityWindow: {
      from?: string;
      to?: string;
    } | null;
    location: {
      address?: string;
      coordinates?: [number, number];
    } | null;
    photos: string[];
    completionSummary: string | null;
  };
};

type AdminUsersApiResponse = {
  status: string;
  message: string;
  data: {
    items: Array<{
      _id: string;
      name: string;
      email: string;
      role: string;
      status: string;
    }>;
  };
};

const defaultStats: ServiceRequestStats = {
  totalRequests: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
};

const statusOptions = [
  { label: "All Status", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const priorityOptions = ["All", "Low", "Medium", "High", "Critical"];

const statusApiMap: Record<string, string> = {
  Pending: "PENDING",
  "In Progress": "IN_PROGRESS",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
};

const getStatusLabel = (status: string) =>
  status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function ServiceRequests() {
  const { alert, confirm, prompt } = useAdminDialog();
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [stats, setStats] = useState<ServiceRequestStats>(defaultStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mechanics, setMechanics] = useState<Array<{ _id: string; name: string }>>([]);

  const fetchServiceRequests = async () => {
    const session = getStoredAdminSession();
    if (!session?.accessToken) {
      setErrorMessage("Admin session missing. Please sign in again.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (statusFilter !== "All") params.set("status", statusApiMap[statusFilter]);
      if (priorityFilter !== "All") params.set("priority", priorityFilter.toUpperCase());
      params.set("limit", "100");

      const response = await fetch(
        `${getApiBaseUrl()}/admin/service-requests?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      const payload = (await response.json()) as ServiceRequestsApiResponse;

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load service requests.");
      }

      setItems(payload.data.items || []);
      setStats(payload.data.stats || defaultStats);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load service requests."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchServiceRequests();
    }, searchTerm ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const fetchMechanics = async () => {
    if (mechanics.length) return mechanics;

    const session = getStoredAdminSession();
    if (!session?.accessToken) {
      throw new Error("Admin session missing. Please sign in again.");
    }

    const response = await fetch(
      `${getApiBaseUrl()}/admin/users?role=TECHNICIANS&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    const payload = (await response.json()) as AdminUsersApiResponse;
    if (!response.ok) {
      throw new Error(payload?.message || "Unable to load mechanics.");
    }

    const nextMechanics = (payload.data.items || []).map((mechanic) => ({
      _id: mechanic._id,
      name: mechanic.name || mechanic.email,
    }));
    setMechanics(nextMechanics);
    return nextMechanics;
  };

  const patchServiceRequest = async (
    jobId: string,
    body: Record<string, unknown>,
    successText: string
  ) => {
    const session = getStoredAdminSession();
    if (!session?.accessToken) {
      setErrorMessage("Admin session missing. Please sign in again.");
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`${getApiBaseUrl()}/admin/service-requests/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to update service request.");
      }

      setSuccessMessage(successText);
      await fetchServiceRequests();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update service request."
      );
    }
  };

  const sendAdminRequest = async (
    path: string,
    options: RequestInit,
    fallbackMessage: string
  ) => {
    const session = getStoredAdminSession();
    if (!session?.accessToken) {
      throw new Error("Admin session missing. Please sign in again.");
    }

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        ...(options.headers || {}),
      },
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || fallbackMessage);
    }

    return payload;
  };

  const handleMoreFilters = () => {
    setShowPriorityFilter((current) => !current);
  };

  const handleStatCardClick = (status: string) => {
    setStatusFilter(status);
  };

  const handleAction = async (action: string, request: ServiceRequestItem) => {
    if (action === "complete") {
      if (
        !(await confirm({
          title: "Complete request",
          message: `Mark ${request.requestId} as completed?`,
          confirmLabel: "Mark completed",
        }))
      ) {
        return;
      }
      await patchServiceRequest(request._id, { status: "COMPLETED" }, "Request marked as completed.");
      return;
    }

    if (action === "cancel") {
      if (
        !(await confirm({
          title: "Cancel request",
          message: `Cancel ${request.requestId}?`,
          confirmLabel: "Cancel request",
          destructive: true,
        }))
      ) {
        return;
      }
      await patchServiceRequest(request._id, { status: "CANCELLED" }, "Request cancelled.");
      return;
    }

    if (action === "priority") {
      const nextPriorityRaw = await prompt({
        title: "Update priority",
        label: "Priority",
        description: "Enter LOW, MEDIUM, HIGH, or CRITICAL",
        defaultValue: request.priority.value,
        required: true,
      });
      if (nextPriorityRaw === null) return;
      const nextPriority = nextPriorityRaw.trim().toUpperCase();
      if (!nextPriority) return;

      await patchServiceRequest(
        request._id,
        { priority: nextPriority },
        "Priority updated."
      );
      return;
    }

    if (action === "assign") {
      try {
        const availableMechanics = await fetchMechanics();
        const helperText = availableMechanics
          .slice(0, 10)
          .map((mechanic) => `${mechanic.name} :: ${mechanic._id}`)
          .join("\n");

        const input = await prompt({
          title: "Assign mechanic",
          label: "Mechanic ID",
          description: `Paste a mechanic ID to assign. Leave blank to unassign.\n\n${helperText}`,
          defaultValue: request.assignedTo?._id || "",
          multiline: true,
        });

        if (input === null) return;

        await patchServiceRequest(
          request._id,
          { assignedMechanicId: input.trim() || null },
          input.trim() ? "Mechanic assigned." : "Mechanic unassigned."
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load mechanics."
        );
      }
      return;
    }

    try {
      if (action === "view") {
        const payload = (await sendAdminRequest(
          `/admin/service-requests/${request._id}`,
          { method: "GET" },
          "Unable to load request details."
        )) as ServiceRequestDetailApiResponse;

        const details = payload.data;
        await alert({
          title: details.requestId,
          rows: linesToDialogRows([
            `Truck: ${details.truckDetails.label}`,
            `Issue: ${details.issue.title}`,
            `Status: ${getStatusLabel(details.status.value)}`,
            `Priority: ${details.priority.label}`,
            `Location: ${details.location?.address || "Not set"}`,
            `Mode: ${details.mode}`,
            `Scheduled: ${details.scheduledFor || "Not scheduled"}`,
          ]),
        });
        return;
      }

      if (action === "edit") {
        const nextTitle = await prompt({
          title: "Edit request",
          label: "Title",
          defaultValue: request.issue.title,
        });
        if (nextTitle === null) return;
        const nextDescription = await prompt({
          title: "Edit request",
          label: "Description",
          defaultValue: request.issue.description || request.issue.title,
          multiline: true,
        });
        if (nextDescription === null) return;

        await patchServiceRequest(
          request._id,
          {
            title: nextTitle.trim(),
            description: nextDescription.trim(),
          },
          "Service request updated."
        );
        return;
      }

      if (action === "reschedule") {
        const from = await prompt({
          title: "Reschedule",
          label: "Scheduled start",
          description: "ISO format: YYYY-MM-DDTHH:mm",
          placeholder: "2026-05-17T09:00",
        });
        if (from === null) return;

        const to = await prompt({
          title: "Reschedule",
          label: "Scheduled end (optional)",
          description: "ISO format: YYYY-MM-DDTHH:mm",
          placeholder: "2026-05-17T17:00",
        });
        if (to === null) return;

        await patchServiceRequest(
          request._id,
          {
            mode: "SCHEDULABLE",
            scheduledFor: from || null,
            availabilityWindow: {
              from: from || null,
              to: to || null,
            },
          },
          "Service request rescheduled."
        );
        return;
      }

      if (action === "message") {
        const text = await prompt({
          title: "Send message",
          label: "Message",
          multiline: true,
          required: true,
        });
        if (text === null || !text.trim()) return;

        await sendAdminRequest(
          `/admin/service-requests/${request._id}/message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: text.trim() }),
          },
          "Unable to send service request message."
        );
        setSuccessMessage("Message sent.");
        return;
      }

      if (action === "invoice") {
        const amount = await prompt({
          title: "Generate invoice",
          label: "Invoice subtotal",
          defaultValue: request.amount ? `${request.amount}` : "",
          required: true,
        });
        if (amount === null || !amount.trim()) return;

        await sendAdminRequest(
          `/admin/service-requests/${request._id}/invoice`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subtotal: Number(amount),
            }),
          },
          "Unable to generate invoice."
        );
        setSuccessMessage("Invoice generated.");
        return;
      }

      if (action === "delete") {
        if (
          !(await confirm({
            title: "Delete request",
            message: `Delete ${request.requestId}? This cannot be undone.`,
            confirmLabel: "Delete",
            destructive: true,
          }))
        ) {
          return;
        }

        await sendAdminRequest(
          `/admin/service-requests/${request._id}`,
          {
            method: "DELETE",
          },
          "Unable to delete service request."
        );
        setSuccessMessage("Service request deleted.");
        await fetchServiceRequests();
        return;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to process request action."
      );
      return;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "HIGH":
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-orange-100 text-orange-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tableRows = useMemo(
    () =>
      items.map((request) => ({
        ...request,
        driverName: request.driver.companyName || request.driver.name || "Unknown",
        assignedToLabel: request.assignedTo?.name || "Not assigned",
      })),
    [items]
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Service Requests</h1>
        <p className="text-gray-600 mt-1">Manage all truck service and repair requests</p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by ID, truck, driver, or issue..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {showPriorityFilter ? (
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All Priorities" : option}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              onClick={handleMoreFilters}
            >
              <Filter size={20} />
              {showPriorityFilter ? "Hide Filters" : "More Filters"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleStatCardClick("All")}
        >
          <p className="text-sm text-gray-600">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">
            {isLoading ? "..." : stats.totalRequests}
          </p>
        </div>
        <div
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleStatCardClick("Pending")}
        >
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-orange-600">
            {isLoading ? "..." : stats.pending}
          </p>
        </div>
        <div
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleStatCardClick("In Progress")}
        >
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {isLoading ? "..." : stats.inProgress}
          </p>
        </div>
        <div
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleStatCardClick("Completed")}
        >
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {isLoading ? "..." : stats.completed}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Truck Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableRows.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.requestId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.truckDetails.label}</div>
                    <div className="text-sm text-gray-500">
                      {request.truckDetails.registration || request.truckDetails.type || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.driverName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.issue.description || request.issue.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                        request.priority.value
                      )}`}
                    >
                      {request.priority.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        request.status.value
                      )}`}
                    >
                      {getStatusLabel(request.status.value)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.assignedToLabel}
                  </td>
                  <td className="relative px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded p-1 hover:bg-gray-100" title="More Options">
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                        <DropdownMenuItem onClick={() => handleAction("view", request)}>
                          <Eye size={16} />
                          <span>View Details</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleAction("edit", request)}>
                          <Edit size={16} />
                          <span>Edit Request</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleAction("assign", request)}>
                          <UserPlus size={16} />
                          <span>Assign Mechanic</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleAction("reschedule", request)}>
                          <Calendar size={16} />
                          <span>Reschedule</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleAction("priority", request)}>
                          <AlertCircle size={16} />
                          <span>Change Priority</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => handleAction("message", request)}>
                          <MessageSquare size={16} />
                          <span>Send Message</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleAction("invoice", request)}>
                          <DollarSign size={16} />
                          <span>Generate Invoice</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleAction("complete", request)}
                          className="text-green-700 focus:bg-green-50 focus:text-green-700"
                        >
                          <CheckCircle size={16} />
                          <span>Mark as Completed</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleAction("cancel", request)}
                          className="text-red-700 focus:bg-red-50 focus:text-red-700"
                        >
                          <XCircle size={16} />
                          <span>Cancel Request</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleAction("delete", request)}
                          className="text-red-700 focus:bg-red-50 focus:text-red-700"
                        >
                          <Trash2 size={16} />
                          <span>Delete Request</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {!isLoading && tableRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    No service requests matched the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
