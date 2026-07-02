import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Ban,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  KeyRound,
  Mail,
  MoreVertical,
  Search,
  Send,
  Shield,
  Trash2,
  UserCircle2,
  UserPlus,
  Users as UsersIcon,
  Wrench,
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
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type AdminUserItem = {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "COMPANY" | "TECHNICIAN" | "ADMIN" | string;
  status: string;
  joinDate: string;
  company: string | null;
  memberCount?: number;
  activity:
    | {
        kind: string;
        value: number;
      }
    | null;
};

type AdminUserMember = {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  jobTitle: string | null;
  membershipStatus: string | null;
  joinedAt: string;
};

type AdminUsersApiResponse = {
  status: string;
  message: string;
  data: {
    items: AdminUserItem[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: {
      totalCompanies: number;
      totalMembers: number;
      activeTechnicians: number;
      activeDrivers?: number;
    };
  };
};

type AdminUserDetailResponse = {
  status: string;
  message: string;
  data: AdminUserItem & {
    fleetProfile?: Record<string, unknown> | null;
    mechanicProfile?: Record<string, unknown> | null;
    adminProfile?: Record<string, unknown> | null;
    companyMembership?: Record<string, unknown> | null;
  };
};

type AdminUserMembersResponse = {
  status: string;
  message: string;
  data: {
    company: {
      _id: string;
      companyName: string;
      email: string;
    };
    items: AdminUserMember[];
    stats: {
      total: number;
      active: number;
      pending: number;
    };
  };
};

type EditableUserDetail = {
  email: string;
  status?: string;
  companyName?: string;
  contactName?: string;
  contactRole?: string;
  phone?: string;
  regNumber?: string;
  vatNumber?: string;
  fleetSize?: string;
  billingAddress?: string;
  displayName?: string;
  businessName?: string;
  baseLocationText?: string;
  basePostcode?: string;
  hourlyRate?: number;
  emergencyRate?: number;
  callOutFee?: number;
  serviceRadiusMiles?: number;
  fullName?: string;
  phoneNumber?: string;
};

const roleFilterOptions = [
  { label: "All Roles", value: "ALL" },
  { label: "Companies", value: "COMPANY" },
  { label: "Technicians", value: "TECHNICIAN" },
  { label: "Admins", value: "ADMIN" },
];

const statusFilterOptions = [
  { label: "All Statuses", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Pending", value: "PENDING" },
];

const formatRoleLabel = (role: string) => {
  if (role === "COMPANY") return "Company";
  if (role === "TECHNICIAN") return "Technician";
  if (role === "ADMIN") return "Admin";
  return role.replace(/_/g, " ");
};

const formatStatusLabel = (status: string) =>
  status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");

const formatJoinDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getStatusBadge = (status: string) => {
  const baseClasses =
    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold";
  switch (status) {
    case "ACTIVE":
      return `${baseClasses} bg-green-100 text-green-700`;
    case "SUSPENDED":
      return `${baseClasses} bg-red-100 text-red-700`;
    case "PENDING":
    case "PENDING_REVIEW":
      return `${baseClasses} bg-amber-100 text-amber-700`;
    default:
      return `${baseClasses} bg-slate-100 text-slate-700`;
  }
};

const getRoleBadge = (role: string) => {
  const baseClasses =
    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold";
  switch (role) {
    case "COMPANY":
      return `${baseClasses} bg-blue-100 text-blue-700`;
    case "TECHNICIAN":
      return `${baseClasses} bg-violet-100 text-violet-700`;
    case "ADMIN":
      return `${baseClasses} bg-slate-900 text-white`;
    default:
      return `${baseClasses} bg-slate-100 text-slate-700`;
  }
};

const getActivityLabel = (item: AdminUserItem) => {
  if (!item.activity) return "No tracked activity";
  if (item.activity.kind === "trucks") return `${item.activity.value} trucks`;
  if (item.activity.kind === "jobs") return `${item.activity.value} jobs`;
  return `${item.activity.value} ${item.activity.kind}`;
};

const initialsFromName = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

export function Users() {
  const { alert, confirm, prompt } = useAdminDialog();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalMembers: 0,
    activeTechnicians: 0,
    activeDrivers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createRole, setCreateRole] = useState<"COMPANY" | "TECHNICIAN" | "ADMIN">(
    "COMPANY",
  );
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");

  // Technician fields
  const [techFullName, setTechFullName] = useState("");
  const [techBusinessName, setTechBusinessName] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [techBaseLocation, setTechBaseLocation] = useState("");
  const [techBasePostcode, setTechBasePostcode] = useState("");
  const [techHourlyRate, setTechHourlyRate] = useState("70");
  const [techEmergencyRate, setTechEmergencyRate] = useState("95");
  const [techCallOutFee, setTechCallOutFee] = useState("35");
  const [techRadiusMiles, setTechRadiusMiles] = useState("25");

  // Admin fields
  const [adminFullName, setAdminFullName] = useState("");
  const [adminPhoneNumber, setAdminPhoneNumber] = useState("");

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const fetchUsers = async () => {
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
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const response = await fetch(
        `${apiBaseUrl}/admin/users?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const payload = (await response.json()) as AdminUsersApiResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load users.");
      }

      setUsers(payload.data.items || []);
      setStats({
        totalCompanies: payload.data.stats.totalCompanies || 0,
        totalMembers: payload.data.stats.totalMembers || 0,
        activeTechnicians: payload.data.stats.activeTechnicians || 0,
        activeDrivers: payload.data.stats.activeDrivers || 0,
      });
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load admin users."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchUsers();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, roleFilter, statusFilter]);

  const companyUsers = useMemo(
    () => users.filter((item) => item.role === "COMPANY"),
    [users]
  );
  const nonCompanyUsers = useMemo(
    () => users.filter((item) => item.role !== "COMPANY"),
    [users]
  );

  const runRequest = async <T,>(
    path: string,
    options: RequestInit,
    fallbackMessage: string
  ): Promise<T> => {
    if (!accessToken) {
      throw new Error("Your admin session has expired. Please sign in again.");
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    const payload = (await response.json()) as T & { message?: string };
    if (!response.ok) {
      throw new Error(payload.message || fallbackMessage);
    }

    return payload;
  };

  const performStatusUpdate = async (userId: string, nextStatus: string) => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await runRequest(
        `/admin/users/${userId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
        "Unable to update user status."
      );

      setFeedback(
        nextStatus === "ACTIVE"
          ? "Account reactivated successfully."
          : "Account suspended successfully."
      );
      await fetchUsers();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update user status."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickEdit = async (user: AdminUserItem) => {
    const nextEmail = await prompt({
      title: "Edit user",
      label: "Email address",
      defaultValue: user.email,
      required: true,
    });
    if (nextEmail === null || !nextEmail.trim()) return;

    const payload: EditableUserDetail = {
      email: nextEmail.trim(),
    };

    if (user.role === "COMPANY") {
      const nextCompany = await prompt({
        title: "Edit company",
        label: "Company name",
        defaultValue: user.name,
      });
      if (nextCompany !== null) payload.companyName = nextCompany.trim();
      const nextPhone = await prompt({
        title: "Edit company",
        label: "Phone number",
        defaultValue: user.phone || "",
      });
      if (nextPhone !== null) payload.phone = nextPhone.trim();
    }

    if (user.role === "TECHNICIAN") {
      const nextDisplayName = await prompt({
        title: "Edit technician",
        label: "Technician name",
        defaultValue: user.name,
      });
      if (nextDisplayName !== null) payload.displayName = nextDisplayName.trim();
      const nextPhone = await prompt({
        title: "Edit technician",
        label: "Phone number",
        defaultValue: user.phone || "",
      });
      if (nextPhone !== null) payload.phone = nextPhone.trim();
    }

    if (user.role === "ADMIN") {
      const nextFullName = await prompt({
        title: "Edit admin",
        label: "Full name",
        defaultValue: user.name,
      });
      if (nextFullName !== null) payload.fullName = nextFullName.trim();
      const nextPhone = await prompt({
        title: "Edit admin",
        label: "Phone number",
        defaultValue: user.phone || "",
      });
      if (nextPhone !== null) payload.phoneNumber = nextPhone.trim();
    }

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await runRequest(
        `/admin/users/${user._id}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        "Unable to update user."
      );

      setFeedback(
        user.role === "COMPANY"
          ? "Company details updated."
          : "User details updated."
      );
      await fetchUsers();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update user."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateRole("COMPANY");
    setCreateEmail("");
    setCreatePassword("");
    setCompanyName("");
    setContactName("");
    setContactRole("");
    setCompanyPhone("");
    setTechFullName("");
    setTechBusinessName("");
    setTechPhone("");
    setTechBaseLocation("");
    setTechBasePostcode("");
    setTechHourlyRate("70");
    setTechEmergencyRate("95");
    setTechCallOutFee("35");
    setTechRadiusMiles("25");
    setAdminFullName("");
    setAdminPhoneNumber("");
  };

  const handleSubmitCreateUser = async () => {
    const email = createEmail.trim().toLowerCase();
    const password = createPassword.trim();

    if (!email) {
      setError("Email is required.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }

    const payload: Record<string, unknown> = {
      role: createRole,
      email,
      password,
    };

    if (createRole === "COMPANY") {
      payload.companyName = companyName.trim();
      payload.contactName = contactName.trim();
      payload.contactRole = contactRole.trim();
      payload.phone = companyPhone.trim();
    }

    if (createRole === "TECHNICIAN") {
      payload.fullName = techFullName.trim();
      payload.businessName = techBusinessName.trim();
      payload.phone = techPhone.trim();
      payload.baseLocationText = techBaseLocation.trim();
      payload.basePostcode = techBasePostcode.trim();

      const hourlyRate = Number(techHourlyRate);
      const emergencyRate = Number(techEmergencyRate);
      const callOutFee = Number(techCallOutFee);
      const radius = Number(techRadiusMiles);
      if (Number.isFinite(hourlyRate)) payload.hourlyRate = hourlyRate;
      if (Number.isFinite(emergencyRate)) payload.emergencyRate = emergencyRate;
      if (Number.isFinite(callOutFee)) payload.callOutFee = callOutFee;
      if (Number.isFinite(radius)) payload.serviceRadiusMiles = radius;
    }

    if (createRole === "ADMIN") {
      payload.fullName = adminFullName.trim();
      payload.phoneNumber = adminPhoneNumber.trim();
    }

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await runRequest(
        "/admin/users",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "Unable to create user."
      );

      setFeedback("New user/company created successfully.");
      setCreateDialogOpen(false);
      resetCreateForm();
      await fetchUsers();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create user."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewProfile = async (user: AdminUserItem) => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const payload = await runRequest<AdminUserDetailResponse>(
        `/admin/users/${user._id}`,
        { method: "GET" },
        "Unable to load user profile."
      );

      const detail = payload.data;
      const lines = [
        `Name: ${detail.name}`,
        `Email: ${detail.email}`,
        `Phone: ${detail.phone || "Not set"}`,
        `Role: ${formatRoleLabel(detail.role)}`,
        `Status: ${formatStatusLabel(detail.status)}`,
        `Joined: ${formatJoinDate(detail.joinDate)}`,
        `Activity: ${getActivityLabel(detail)}`,
      ];

      if (detail.role === "COMPANY" && detail.fleetProfile) {
        lines.push(
          `Company: ${String(
            (detail.fleetProfile as Record<string, unknown>).companyName || ""
          )}`,
          `Contact: ${String(
            (detail.fleetProfile as Record<string, unknown>).contactName || ""
          )}`,
          `Registration: ${String(
            (detail.fleetProfile as Record<string, unknown>).regNumber || "Not set"
          )}`,
          `VAT: ${String(
            (detail.fleetProfile as Record<string, unknown>).vatNumber || "Not set"
          )}`,
          `Fleet size: ${String(
            (detail.fleetProfile as Record<string, unknown>).fleetSize || "Not set"
          )}`,
          `Members: ${detail.memberCount || 0}`
        );
      }

      if (detail.role === "TECHNICIAN" && detail.mechanicProfile) {
        lines.push(
          `Business: ${String(
            (detail.mechanicProfile as Record<string, unknown>).businessName || "Not set"
          )}`,
          `Base location: ${String(
            (detail.mechanicProfile as Record<string, unknown>).baseLocationText || "Not set"
          )}`
        );
      }

      await alert({
        title: detail.name,
        rows: linesToDialogRows(lines),
      });
    } catch (viewError) {
      setError(
        viewError instanceof Error
          ? viewError.message
          : "Unable to load user profile."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageMembers = async (user: AdminUserItem) => {
    if (user.role !== "COMPANY") return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const payload = await runRequest<AdminUserMembersResponse>(
        `/admin/users/${user._id}/members`,
        { method: "GET" },
        "Unable to load company members."
      );

      const lines = [
        `${payload.data.company.companyName} members`,
        `Total: ${payload.data.stats.total}`,
        `Active: ${payload.data.stats.active}`,
        `Pending: ${payload.data.stats.pending}`,
        "",
      ];

      if (!payload.data.items.length) {
        lines.push("No company members found yet.");
      } else {
        payload.data.items.forEach((member) => {
          lines.push(
            `${member.name} • ${formatRoleLabel(member.role)} • ${formatStatusLabel(
              member.status
            )} • ${member.email}`
          );
        });
      }

      await alert({
        title: `${payload.data.company.companyName} members`,
        body: lines.join("\n"),
      });
    } catch (membersError) {
      setError(
        membersError instanceof Error
          ? membersError.message
          : "Unable to load company members."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (user: AdminUserItem) => {
    const nextPassword = await prompt({
      title: "Reset password",
      label: "New temporary password",
      description: `Set a new temporary password for ${user.email}`,
      defaultValue: "Pass1234!",
      required: true,
    });
    if (nextPassword === null || !nextPassword.trim()) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await runRequest(
        `/admin/users/${user._id}/reset-password`,
        {
          method: "POST",
          body: JSON.stringify({ newPassword: nextPassword.trim() }),
        },
        "Unable to reset password."
      );

      setFeedback("Temporary password updated successfully.");
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to reset password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (user: AdminUserItem) => {
    const title = await prompt({
      title: "Send message",
      label: "Message title",
      defaultValue: "Admin follow-up",
    });
    if (title === null) return;
    const body = await prompt({
      title: "Send message",
      label: "Message body",
      defaultValue: `Hello ${user.name}, this is a follow-up from the TruckFix admin team.`,
      multiline: true,
      required: true,
    });
    if (body === null || !body.trim()) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await runRequest(
        `/admin/users/${user._id}/message`,
        {
          method: "POST",
          body: JSON.stringify({ title: title.trim(), body: body.trim() }),
        },
        "Unable to send message."
      );

      setFeedback("Admin message sent successfully.");
    } catch (messageError) {
      setError(
        messageError instanceof Error
          ? messageError.message
          : "Unable to send message."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: AdminUserItem) => {
    const confirmed = await confirm({
      title: "Remove account",
      message: `Remove ${user.role === "COMPANY" ? "company" : "user"} ${user.name}? This cannot be undone.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await runRequest(
        `/admin/users/${user._id}`,
        { method: "DELETE" },
        "Unable to remove this account."
      );

      setFeedback(
        user.role === "COMPANY"
          ? "Company removed successfully."
          : "User removed successfully."
      );
      await fetchUsers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to remove this account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewFleet = (user: AdminUserItem) => {
    const seed = user.company || user.name;
    sessionStorage.setItem("truckfix_admin_fleet_search", seed);
    navigate("/trucks");
  };

  const handleViewActivityHistory = (user: AdminUserItem) => {
    sessionStorage.setItem("truckfix_admin_audit_search", user.email);
    navigate("/audit");
  };

  const renderRoleIcon = (role: string) => {
    if (role === "COMPANY") return <Building2 size={18} className="text-blue-600" />;
    if (role === "TECHNICIAN")
      return <Wrench size={18} className="text-violet-600" />;
    return <Shield size={18} className="text-slate-700" />;
  };

  const renderUserRow = (user: AdminUserItem) => {
    const isCompany = user.role === "COMPANY";
    const isSuspended = user.status === "SUSPENDED";

    return (
      <tr key={user._id} className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              onClick={() => void handleViewProfile(user)}
              title={isCompany ? "View company profile" : "View user profile"}
            >
              <ChevronRight size={16} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 font-semibold text-blue-700">
              {isCompany ? (
                renderRoleIcon(user.role)
              ) : (
                initialsFromName(user.name || user.email)
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {user.name}
                </span>
                {isCompany && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {user.memberCount || 0} members
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Mail size={13} />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          {user.phone || "Phone not set"}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <span className={getRoleBadge(user.role)}>{formatRoleLabel(user.role)}</span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <span className={getStatusBadge(user.status)}>
            {formatStatusLabel(user.status)}
          </span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatJoinDate(user.joinDate)}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          {getActivityLabel(user)}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100">
                <MoreVertical size={14} />
                <span>Options</span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-60">
              <DropdownMenuItem onClick={() => void handleViewProfile(user)}>
                <UserCircle2 size={16} />
                <span>{isCompany ? "View Company Profile" : "View Summary"}</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => void handleQuickEdit(user)}>
                <CheckCircle2 size={16} />
                <span>{isCompany ? "Edit Company Details" : "Quick Edit"}</span>
              </DropdownMenuItem>

              {isCompany && (
                <>
                  <DropdownMenuItem onClick={() => handleViewFleet(user)}>
                    <ArrowRight size={16} />
                    <span>View Fleet ({user.activity?.value || 0})</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => void handleManageMembers(user)}>
                    <UsersIcon size={16} />
                    <span>Manage Members ({user.memberCount || 0})</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem onClick={() => void handleResetPassword(user)}>
                <KeyRound size={16} />
                <span>Reset Password</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleViewActivityHistory(user)}>
                <Clock3 size={16} />
                <span>View Activity History</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => void handleSendMessage(user)}>
                <Send size={16} />
                <span>Send Message</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isSuspended ? (
                <DropdownMenuItem
                  onClick={() => void performStatusUpdate(user._id, "ACTIVE")}
                  className="text-green-700 focus:text-green-700"
                >
                  <CheckCircle2 size={16} />
                  <span>{isCompany ? "Activate Company" : "Activate User"}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => void performStatusUpdate(user._id, "SUSPENDED")}
                  className="text-orange-700 focus:text-orange-700"
                >
                  <Ban size={16} />
                  <span>{isCompany ? "Suspend Company" : "Suspend User"}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => void handleDeleteUser(user)}
                className="text-red-700 focus:text-red-700"
              >
                <Trash2 size={16} />
                <span>{isCompany ? "Remove Company" : "Remove User"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-gray-600">
            Manage companies, drivers, technicians, and admin access from one place
          </p>
        </div>

        <Dialog
          open={createDialogOpen}
          onOpenChange={(nextOpen) => {
            setCreateDialogOpen(nextOpen);
            if (!nextOpen) resetCreateForm();
          }}
        >
          <Button
            className="mt-4 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30 md:mt-0"
            onClick={() => setCreateDialogOpen(true)}
            disabled={submitting}
          >
            <UserPlus size={20} />
            Add New User/Company
          </Button>

          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create new user</DialogTitle>
              <DialogDescription>
                Add a company, technician, or admin account. A temporary password will be set for the user.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={createRole}
                    onValueChange={(v) =>
                      setCreateRole(v as "COMPANY" | "TECHNICIAN" | "ADMIN")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPANY">Company</SelectItem>
                      <SelectItem value="TECHNICIAN">Technician</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Email</Label>
                  <Input
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="name@company.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Temporary password</Label>
                  <Input
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex items-end text-xs text-muted-foreground">
                  Used for first login.
                </div>
              </div>

              {createRole === "COMPANY" ? (
                <div className="rounded-lg border bg-white p-4">
                  <p className="mb-4 text-sm font-semibold text-gray-900">Company details</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Company name</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact name</Label>
                      <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact role</Label>
                      <Input value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
                    </div>
                  </div>
                </div>
              ) : null}

              {createRole === "TECHNICIAN" ? (
                <div className="rounded-lg border bg-white p-4">
                  <p className="mb-4 text-sm font-semibold text-gray-900">Technician details</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full name</Label>
                      <Input value={techFullName} onChange={(e) => setTechFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Business name</Label>
                      <Input value={techBusinessName} onChange={(e) => setTechBusinessName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={techPhone} onChange={(e) => setTechPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Base postcode</Label>
                      <Input value={techBasePostcode} onChange={(e) => setTechBasePostcode(e.target.value)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Base location</Label>
                      <Input value={techBaseLocation} onChange={(e) => setTechBaseLocation(e.target.value)} />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Hourly rate</Label>
                      <Input value={techHourlyRate} onChange={(e) => setTechHourlyRate(e.target.value)} inputMode="numeric" />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency rate</Label>
                      <Input value={techEmergencyRate} onChange={(e) => setTechEmergencyRate(e.target.value)} inputMode="numeric" />
                    </div>
                    <div className="space-y-2">
                      <Label>Call-out fee</Label>
                      <Input value={techCallOutFee} onChange={(e) => setTechCallOutFee(e.target.value)} inputMode="numeric" />
                    </div>
                    <div className="space-y-2">
                      <Label>Radius (mi)</Label>
                      <Input value={techRadiusMiles} onChange={(e) => setTechRadiusMiles(e.target.value)} inputMode="numeric" />
                    </div>
                  </div>
                </div>
              ) : null}

              {createRole === "ADMIN" ? (
                <div className="rounded-lg border bg-white p-4">
                  <p className="mb-4 text-sm font-semibold text-gray-900">Admin details</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full name</Label>
                      <Input value={adminFullName} onChange={(e) => setAdminFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone number</Label>
                      <Input value={adminPhoneNumber} onChange={(e) => setAdminPhoneNumber(e.target.value)} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30"
                onClick={() => void handleSubmitCreateUser()}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create user"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <p className="text-sm text-gray-600">Total Companies</p>
            <Building2 className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Members</p>
            <UsersIcon className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Active Technicians</p>
            <Wrench className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.activeTechnicians}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Active Drivers</p>
            <UserCircle2 className="text-orange-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeDrivers}</p>
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
              placeholder="Search by name, email, company..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {roleFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No users matched this search yet.
                  </td>
                </tr>
              ) : (
                <>
                  {companyUsers.map(renderUserRow)}
                  {nonCompanyUsers.length > 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        Independent Users
                      </td>
                    </tr>
                  )}
                  {nonCompanyUsers.map(renderUserRow)}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
