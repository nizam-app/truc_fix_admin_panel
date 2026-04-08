import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  MoreVertical,
  Phone,
  Shield,
  Ban,
  UserX,
  Eye,
  Edit,
  Building2,
  Users as UsersIcon,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { getAdminAccessToken, getApiBaseUrl } from "../lib/auth";

type UserItem = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  joinDate?: string;
  company?: string | null;
  activity?: {
    kind?: string;
    value?: number;
  } | null;
};

type UserStats = {
  totalCompanies: number;
  totalMembers: number;
  activeTechnicians: number;
  activeDrivers: number;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type UserFormState = {
  name: string;
  email: string;
  phone: string;
  role: string;
};

const defaultStats: UserStats = {
  totalCompanies: 0,
  totalMembers: 0,
  activeTechnicians: 0,
  activeDrivers: 0,
};

const defaultMeta: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const emptyForm: UserFormState = {
  name: "",
  email: "",
  phone: "",
  role: "COMPANY",
};

function getUserId(user: UserItem) {
  return user._id || user.id || "";
}

function formatLabel(value?: string, fallback = "Unknown") {
  if (!value) {
    return fallback;
  }

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRoleBadgeClass(role?: string) {
  switch (role) {
    case "COMPANY":
      return "bg-purple-100 text-purple-700";
    case "TECHNICIAN":
      return "bg-blue-100 text-blue-700";
    case "DRIVER":
      return "bg-orange-100 text-orange-700";
    case "ADMIN":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusBadgeClass(status?: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "SUSPENDED":
      return "bg-red-100 text-red-700";
    case "PENDING_REVIEW":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatActivity(activity?: UserItem["activity"]) {
  if (!activity?.kind) {
    return "N/A";
  }

  const value = activity.value ?? 0;
  const label = activity.kind.toLowerCase();
  return `${value} ${label}`;
}

function formatJoinDate(value?: string) {
  if (!value) {
    return "N/A";
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

async function requestUsers(path: string, options: RequestInit = {}) {
  const token = getAdminAccessToken();

  if (!token) {
    throw new Error("Admin access token not found in localStorage.");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.error || `Request failed with status ${response.status}`,
    );
  }

  return payload;
}

export function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formState, setFormState] = useState<UserFormState>(emptyForm);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.set("search", searchTerm);
      }
      if (roleFilter !== "ALL") {
        params.set("role", roleFilter);
      }
      params.set("page", String(currentPage));
      params.set("limit", String(limit));

      const payload = await requestUsers(`/admin/users?${params.toString()}`);

      setUsers(Array.isArray(payload?.data?.items) ? payload.data.items : []);
      setStats({
        totalCompanies: payload?.data?.stats?.totalCompanies ?? 0,
        totalMembers: payload?.data?.stats?.totalMembers ?? 0,
        activeTechnicians: payload?.data?.stats?.activeTechnicians ?? 0,
        activeDrivers: payload?.data?.stats?.activeDrivers ?? 0,
      });
      setMeta({
        page: payload?.meta?.page ?? currentPage,
        limit: payload?.meta?.limit ?? limit,
        total: payload?.meta?.total ?? 0,
        totalPages: payload?.meta?.totalPages ?? 1,
      });
    } catch (error) {
      setUsers([]);
      setStats(defaultStats);
      setMeta(defaultMeta);
      setErrorMessage(error instanceof Error ? error.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, currentPage, limit]);

  const roleOptions = useMemo(
    () => [
      { label: "All Roles", value: "ALL" },
      { label: "Companies", value: "COMPANY" },
      { label: "Technicians", value: "TECHNICIAN" },
      { label: "Drivers", value: "DRIVER" },
      { label: "Admins", value: "ADMIN" },
    ],
    [],
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setFormState(emptyForm);
    setIsCreateOpen(true);
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setFormState({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "COMPANY",
    });
    setIsCreateOpen(true);
    setOpenDropdown(null);
  };

  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingUser(null);
    setFormState(emptyForm);
  };

  const submitForm = async () => {
    setIsSubmittingForm(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const body = JSON.stringify(formState);

      if (editingUser) {
        await requestUsers(`/admin/users/${getUserId(editingUser)}`, {
          method: "PATCH",
          body,
        });
        setSuccessMessage("User updated successfully.");
      } else {
        await requestUsers("/admin/users", {
          method: "POST",
          body,
        });
        setSuccessMessage("User created successfully.");
      }

      closeModal();
      await fetchUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit user form.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const updateStatus = async (user: UserItem) => {
    const userId = getUserId(user);
    const nextStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

    setActionLoadingId(userId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await requestUsers(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setSuccessMessage(`User status updated to ${formatLabel(nextStatus)}.`);
      setOpenDropdown(null);
      await fetchUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update user status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const viewProfile = (user: UserItem) => {
    window.alert(
      `Name: ${user.name || "N/A"}\nEmail: ${user.email || "N/A"}\nPhone: ${user.phone || "N/A"}\nRole: ${formatLabel(
        user.role,
      )}\nStatus: ${formatLabel(user.status)}\nCompany: ${user.company || "N/A"}\nActivity: ${formatActivity(
        user.activity,
      )}`,
    );
    setOpenDropdown(null);
  };

  const isEmpty = !isLoading && users.length === 0;

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage companies, drivers, and technicians</p>
        </div>
        <button
          className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={openCreateModal}
        >
          <UserPlus size={20} />
          Add New User/Company
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Companies</p>
            <Building2 className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Members</p>
            <UsersIcon className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Technicians</p>
            <Shield className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeTechnicians}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Drivers</p>
            <UsersIcon className="text-orange-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeDrivers}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, company..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <LoaderCircle className="animate-spin" size={18} />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No users found for the current filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const userId = getUserId(user);
                  return (
                    <tr key={userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {(user.name || "U")
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name || "Unknown User"}</div>
                            <div className="text-sm text-gray-500">{user.email || "No email"}</div>
                            {user.company && <div className="text-sm text-gray-500">{user.company}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Phone size={14} className="text-gray-400" />
                          {user.phone || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                          {formatLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
                          {formatLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatJoinDate(user.joinDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatActivity(user.activity)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="relative">
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded text-xs font-medium transition-colors"
                            onClick={() => setOpenDropdown(openDropdown === userId ? null : userId)}
                            disabled={actionLoadingId === userId}
                          >
                            {actionLoadingId === userId ? <LoaderCircle className="animate-spin" size={14} /> : <MoreVertical size={14} />}
                            <span>Options</span>
                          </button>

                          {openDropdown === userId && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                <div className="py-1">
                                  <button
                                    onClick={() => viewProfile(user)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Eye size={16} />
                                    <span>View Profile</span>
                                  </button>
                                  <button
                                    onClick={() => openEditModal(user)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit size={16} />
                                    <span>Edit Details</span>
                                  </button>
                                  <button
                                    onClick={() => updateStatus(user)}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-orange-50 ${
                                      user.status === "SUSPENDED" ? "text-green-700" : "text-orange-700"
                                    }`}
                                  >
                                    {user.status === "SUSPENDED" ? <UserX size={16} /> : <Ban size={16} />}
                                    <span>{user.status === "SUSPENDED" ? "Activate User" : "Suspend User"}</span>
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
            Showing page {meta.page} of {Math.max(meta.totalPages, 1)} with {meta.total} total user
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

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingUser ? "Edit User / Company" : "Add New User / Company"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {editingUser ? "Update the selected record." : "Create a new admin-managed user or company."}
                </p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-2 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={formState.phone}
                  onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formState.role}
                  onChange={(event) => setFormState((current) => ({ ...current, role: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="COMPANY">Company</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="DRIVER">Driver</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                disabled={isSubmittingForm}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmittingForm ? "Saving..." : editingUser ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
