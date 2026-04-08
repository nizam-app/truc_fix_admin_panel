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
  AlertCircle,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAdminAccessToken, getApiBaseUrl } from "../lib/auth";

type ServiceRequestItem = {
  _id: string;
  requestId: string;
  truckDetails?: {
    registration?: string;
    label?: string;
    type?: string;
  };
  driver?: {
    name?: string;
    phone?: string;
    companyName?: string;
  };
  issue?: {
    title?: string;
    description?: string;
    type?: string;
  };
  priority?: {
    value?: string;
    label?: string;
  };
  status?: {
    value?: string;
    label?: string;
    tone?: string;
    raw?: string;
  };
  assignedTo?: {
    _id?: string;
    name?: string;
    phone?: string;
  } | null;
  amount?: number;
  currency?: string;
  quoteCount?: number;
  postedAt?: string;
  updatedAt?: string;
};

type ServiceRequestStats = {
  totalRequests: number;
  pending: number;
  inProgress: number;
  completed: number;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const defaultStats: ServiceRequestStats = {
  totalRequests: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
};

const defaultMeta: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

function normalizeLabel(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRequestTime(value?: string) {
  if (!value) {
    return "N/A";
  }

  if (value.includes("ago")) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getPriorityBadgeClass(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-700";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700";
    case "LOW":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusBadgeClass(status: string, tone?: string) {
  if (tone === "blue" || status === "IN_PROGRESS") {
    return "bg-blue-100 text-blue-700";
  }

  switch (status) {
    case "PENDING":
      return "bg-orange-100 text-orange-700";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

async function updateServiceRequest(jobId: string, body: Record<string, string>) {
  const token = getAdminAccessToken();

  if (!token) {
    throw new Error("Admin access token not found in localStorage.");
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/service-requests/${jobId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Service request update failed with status ${response.status}`;
    throw new Error(String(message));
  }

  return payload;
}

export function ServiceRequests() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [stats, setStats] = useState<ServiceRequestStats>(defaultStats);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchRequests = async () => {
    const token = getAdminAccessToken();

    if (!token) {
      setErrorMessage("Admin access token not found in localStorage.");
      setRequests([]);
      setStats(defaultStats);
      setMeta(defaultMeta);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.set("search", searchTerm);
      }
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (priorityFilter !== "ALL") {
        params.set("priority", priorityFilter);
      }
      params.set("page", String(currentPage));
      params.set("limit", String(limit));

      const query = params.toString();
      const response = await fetch(
        `${getApiBaseUrl()}/admin/service-requests${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            `Service requests fetch failed with status ${response.status}`,
        );
      }

      setRequests(Array.isArray(payload?.data?.items) ? payload.data.items : []);
      setStats({
        totalRequests: payload?.data?.stats?.totalRequests ?? 0,
        pending: payload?.data?.stats?.pending ?? 0,
        inProgress: payload?.data?.stats?.inProgress ?? 0,
        completed: payload?.data?.stats?.completed ?? 0,
      });
      setMeta({
        page: payload?.meta?.page ?? currentPage,
        limit: payload?.meta?.limit ?? limit,
        total: payload?.meta?.total ?? 0,
        totalPages: payload?.meta?.totalPages ?? 1,
      });
    } catch (error) {
      console.error("Failed to load service requests:", error);
      setRequests([]);
      setStats(defaultStats);
      setMeta(defaultMeta);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load service requests right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [searchTerm, statusFilter, priorityFilter, currentPage, limit]);

  const statusOptions = useMemo(
    () => [
      { label: "All Status", value: "ALL" },
      { label: "Pending", value: "PENDING" },
      { label: "In Progress", value: "IN_PROGRESS" },
      { label: "Completed", value: "COMPLETED" },
      { label: "Cancelled", value: "CANCELLED" },
    ],
    [],
  );

  const priorityOptions = useMemo(
    () => [
      { label: "All Priority", value: "ALL" },
      { label: "High", value: "HIGH" },
      { label: "Medium", value: "MEDIUM" },
      { label: "Low", value: "LOW" },
    ],
    [],
  );

  const handleStatCardClick = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const toggleDropdown = (requestId: string) => {
    setOpenDropdown(openDropdown === requestId ? null : requestId);
  };

  const handleUpdate = async (jobId: string, body: Record<string, string>, successText: string) => {
    setActionLoadingId(jobId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateServiceRequest(jobId, body);
      setSuccessMessage(successText);
      setOpenDropdown(null);
      await fetchRequests();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update the service request.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAssignMechanic = async (jobId: string) => {
    const assignedMechanicId = window.prompt("Enter mechanic user ID to assign or reassign:");

    if (!assignedMechanicId) {
      return;
    }

    await handleUpdate(
      jobId,
      { assignedMechanicId: assignedMechanicId.trim() },
      "Mechanic assignment updated.",
    );
  };

  const handleAction = async (action: string, request: ServiceRequestItem) => {
    switch (action) {
      case "view":
        window.alert(
          `Request ${request.requestId}\n\nTruck: ${request.truckDetails?.label || "N/A"}\nDriver: ${
            request.driver?.name || "N/A"
          }\nIssue: ${request.issue?.title || "N/A"}\nDescription: ${
            request.issue?.description || "No description"
          }`,
        );
        setOpenDropdown(null);
        return;
      case "complete":
        await handleUpdate(request._id, { status: "COMPLETED" }, "Request marked as completed.");
        return;
      case "cancel":
        await handleUpdate(request._id, { status: "CANCELLED" }, "Request cancelled.");
        return;
      case "priority-high":
        await handleUpdate(request._id, { urgency: "HIGH" }, "Priority updated to high.");
        return;
      case "priority-medium":
        await handleUpdate(request._id, { urgency: "MEDIUM" }, "Priority updated to medium.");
        return;
      case "priority-low":
        await handleUpdate(request._id, { urgency: "LOW" }, "Priority updated to low.");
        return;
      case "assign":
        await handleAssignMechanic(request._id);
        return;
      default:
        setOpenDropdown(null);
        window.alert("This action is not wired yet because the backend endpoint was not provided.");
    }
  };

  const isEmpty = !isLoading && requests.length === 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Service Requests</h1>
        <p className="text-gray-600 mt-1">Manage all truck service and repair requests</p>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by ID, truck, driver, or issue..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              onClick={() => setShowMoreFilters((current) => !current)}
            >
              <Filter size={20} />
              More Filters
            </button>
          </div>
        </div>

        {showMoreFilters && (
          <div className="mt-4 grid gap-4 border-t border-gray-200 pt-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Priority</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Rows per page</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleStatCardClick("ALL")}
        >
          <p className="text-sm text-gray-600">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
        </div>
        <div
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleStatCardClick("PENDING")}
        >
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
        </div>
        <div
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleStatCardClick("IN_PROGRESS")}
        >
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleStatCardClick("COMPLETED")}
        >
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <LoaderCircle className="animate-spin" size={18} />
                      Loading service requests...
                    </div>
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
                    No service requests found for the current filters.
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  const priorityValue = request.priority?.value || "UNKNOWN";
                  const statusValue = request.status?.value || "UNKNOWN";

                  return (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.requestId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.truckDetails?.label || "Truck details unavailable"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.truckDetails?.registration || request.truckDetails?.type || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{request.driver?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{request.driver?.companyName || ""}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{request.issue?.title || "N/A"}</div>
                        <div className="text-sm text-gray-500">{request.issue?.description || ""}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeClass(priorityValue)}`}
                        >
                          {request.priority?.label || normalizeLabel(priorityValue, "Unknown")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                            statusValue,
                            request.status?.tone,
                          )}`}
                        >
                          {request.status?.label || normalizeLabel(statusValue, "Unknown")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.assignedTo?.name || "Not assigned"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRequestTime(request.updatedAt || request.postedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="relative">
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            onClick={() => toggleDropdown(request._id)}
                            title="More Options"
                            disabled={actionLoadingId === request._id}
                          >
                            {actionLoadingId === request._id ? (
                              <LoaderCircle className="animate-spin" size={16} />
                            ) : (
                              <MoreVertical size={16} />
                            )}
                          </button>

                          {openDropdown === request._id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />

                              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleAction("view", request)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Eye size={16} />
                                    <span>View Details</span>
                                  </button>

                                  <button
                                    onClick={() => handleAction("assign", request)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <UserPlus size={16} />
                                    <span>Assign Mechanic ID</span>
                                  </button>

                                  <button
                                    onClick={() => handleAction("priority-high", request)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <AlertCircle size={16} />
                                    <span>Set Priority: High</span>
                                  </button>

                                  <button
                                    onClick={() => handleAction("priority-medium", request)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit size={16} />
                                    <span>Set Priority: Medium</span>
                                  </button>

                                  <button
                                    onClick={() => handleAction("priority-low", request)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit size={16} />
                                    <span>Set Priority: Low</span>
                                  </button>

                                  <div className="border-t border-gray-200 my-1" />

                                  <button
                                    onClick={() => handleAction("complete", request)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle size={16} />
                                    <span>Mark as Completed</span>
                                  </button>

                                  <button
                                    onClick={() => handleAction("cancel", request)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle size={16} />
                                    <span>Cancel Request</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>
            Showing page {meta.page} of {Math.max(meta.totalPages, 1)} with {meta.total} total request
            {meta.total === 1 ? "" : "s"}.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage <= 1 || isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              onClick={() => setCurrentPage((page) => Math.min(page + 1, Math.max(meta.totalPages, 1)))}
              disabled={currentPage >= meta.totalPages || isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
