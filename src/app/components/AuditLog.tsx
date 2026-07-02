import React, { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Edit,
  Filter,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
import { adminFetch } from "../apiClient";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Separator } from "./ui/separator";

type AuditLogItem = {
  _id: string;
  userLabel: string;
  action: string;
  target?: string;
  category?: string;
  ipAddress?: string;
  createdAt: string;
};

type AuditLogsResponse = {
  status: string;
  message: string;
  data: {
    items: AuditLogItem[];
    stats: {
      totalActions: number;
      today: number;
      thisWeek: number;
      activeAdmins: number;
    };
  };
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getActionIcon = (action: string) => {
  if (/(Suspended|Removed|Deleted|Closed)/i.test(action)) {
    return <Trash2 className="text-red-600" size={16} />;
  }
  if (/(Created|Added|Approved)/i.test(action)) {
    return <UserPlus className="text-green-600" size={16} />;
  }
  if (/(Edited|Updated|Marked|Assigned)/i.test(action)) {
    return <Edit className="text-blue-600" size={16} />;
  }
  if (/(Processed|Invoice|Payment|Payout)/i.test(action)) {
    return <DollarSign className="text-purple-600" size={16} />;
  }
  return <Edit className="text-gray-600" size={16} />;
};

const getCategoryColor = (category?: string) => {
  switch ((category || "").toUpperCase()) {
    case "USER MANAGEMENT":
    case "USERS":
      return "bg-blue-100 text-blue-800";
    case "FINANCIAL":
    case "PAYMENTS":
      return "bg-green-100 text-green-800";
    case "SERVICE MANAGEMENT":
    case "SERVICES":
      return "bg-purple-100 text-purple-800";
    case "FLEET MANAGEMENT":
    case "FLEET":
      return "bg-orange-100 text-orange-800";
    case "PROMOTIONS":
      return "bg-pink-100 text-pink-800";
    case "SUPPORT":
      return "bg-yellow-100 text-yellow-800";
    case "NOTIFICATIONS":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const weekAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL_TIME");
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState({
    totalActions: 0,
    today: 0,
    thisWeek: 0,
    activeAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeLog, setActiveLog] = useState<AuditLogItem | null>(null);

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    const seededSearch = sessionStorage.getItem("truckfix_admin_audit_search");
    if (seededSearch) {
      setSearchTerm(seededSearch);
      sessionStorage.removeItem("truckfix_admin_audit_search");
    }
  }, []);

  const fetchAuditLogs = async () => {
    if (!accessToken) {
      setLoading(false);
      setError("Your admin session has expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);

      const response = await adminFetch(`/admin/audit-log?${params.toString()}`, { method: "GET" });

      const payload = (await response.json()) as AuditLogsResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load audit logs.");
      }

      setItems(payload.data.items || []);
      setStats(
        payload.data.stats || {
          totalActions: 0,
          today: 0,
          thisWeek: 0,
          activeAdmins: 0,
        }
      );
    } catch (fetchError) {
      setItems([]);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchAuditLogs();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, categoryFilter]);

  const filteredItems = useMemo(() => {
    if (dateFilter === "ALL_TIME") return items;

    const today = startOfToday();
    const thisWeek = weekAgo();

    return items.filter((item) => {
      const createdAt = new Date(item.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;

      if (dateFilter === "TODAY") {
        return createdAt >= today;
      }
      if (dateFilter === "THIS_WEEK") {
        return createdAt >= thisWeek;
      }
      if (dateFilter === "THIS_MONTH") {
        const now = new Date();
        return (
          createdAt.getFullYear() === now.getFullYear() &&
          createdAt.getMonth() === now.getMonth()
        );
      }
      return true;
    });
  }, [items, dateFilter]);

  return (
    <div>
      <Dialog
        open={detailOpen}
        onOpenChange={(nextOpen) => {
          setDetailOpen(nextOpen);
          if (!nextOpen) setActiveLog(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Audit log entry</DialogTitle>
            <DialogDescription>Full details for this action.</DialogDescription>
          </DialogHeader>

          {activeLog ? (
            <div className="grid gap-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`${getCategoryColor(activeLog.category)} border-transparent`}
                >
                  {activeLog.category || "General"}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDateTime(activeLog.createdAt)}
                </span>
              </div>

              <Separator />

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">User</span>
                  <span className="font-medium text-gray-900">
                    {activeLog.userLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Action</span>
                  <span className="font-medium text-gray-900">
                    {activeLog.action}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Target</span>
                  <span className="font-medium text-gray-900">
                    {activeLog.target || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">IP address</span>
                  <span className="font-medium text-gray-900">
                    {activeLog.ipAddress || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
              No log entry selected.
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-gray-600">
          Track administrative actions, compliance history, and operational changes
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Actions</p>
            <div className="rounded-lg bg-blue-100 p-2">
              <Shield className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalActions}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Today</p>
            <div className="rounded-lg bg-green-100 p-2">
              <Shield className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.today}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">This Week</p>
            <div className="rounded-lg bg-purple-100 p-2">
              <Shield className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Active Admins</p>
            <div className="rounded-lg bg-orange-100 p-2">
              <User className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeAdmins}</p>
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
              placeholder="Search by action, target, category, or user..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Users">Users</option>
              <option value="Financial">Financial</option>
              <option value="Services">Services</option>
              <option value="Fleet">Fleet</option>
              <option value="Promotions">Promotions</option>
              <option value="Support">Support</option>
              <option value="Notifications">Notifications</option>
              <option value="Settings">Settings</option>
            </select>
          </div>
          <select
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          >
            <option value="ALL_TIME">All Time</option>
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    className="px-6 py-10 text-center text-sm text-gray-500"
                    colSpan={6}
                  >
                    Loading audit logs...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-10 text-center text-sm text-gray-500"
                    colSpan={6}
                  >
                    No audit log entries matched this filter yet.
                  </td>
                </tr>
              ) : (
                filteredItems.map((log) => (
                  <tr
                    key={log._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setActiveLog(log);
                      setDetailOpen(true);
                    }}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {log.userLabel}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm text-gray-900">{log.action}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {log.target || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`${getCategoryColor(log.category)} border-transparent`}
                      >
                        {log.category || "General"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {log.ipAddress || "Unknown"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
