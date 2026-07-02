import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  DollarSign,
  Info,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
import { useAdminDialog } from "../adminDialog";
import { adminFetch, adminFetchJson } from "../apiClient";

type AdminNotification = {
  _id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  user: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  status: string;
  message: string;
  data: {
    items: AdminNotification[];
    stats: {
      total: number;
      unread: number;
      urgent: number;
      today: number;
    };
  };
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

const formatTypeLabel = (type: string) =>
  type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const deriveCategory = (type: string) => {
  const upper = type.toUpperCase();
  if (upper.includes("PAYMENT") || upper.includes("INVOICE") || upper.includes("BILL")) {
    return "Financial";
  }
  if (upper.includes("SERVICE") || upper.includes("JOB") || upper.includes("MECHANIC")) {
    return "Services";
  }
  if (upper.includes("USER") || upper.includes("ACCOUNT") || upper.includes("FLEET")) {
    return "Users";
  }
  if (upper.includes("ALERT") || upper.includes("WARNING") || upper.includes("SYSTEM")) {
    return "Alerts";
  }
  return "General";
};

const getTypeConfig = (type: string) => {
  const upper = type.toUpperCase();

  if (upper.includes("PAYMENT") || upper.includes("INVOICE") || upper.includes("BILL")) {
    return {
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
    };
  }

  if (upper.includes("SERVICE") || upper.includes("JOB") || upper.includes("MECHANIC")) {
    return {
      icon: Wrench,
      color: "bg-blue-100 text-blue-600",
    };
  }

  if (upper.includes("USER") || upper.includes("ACCOUNT") || upper.includes("FLEET")) {
    return {
      icon: Users,
      color: "bg-purple-100 text-purple-600",
    };
  }

  if (upper.includes("ALERT") || upper.includes("WARNING")) {
    return {
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
    };
  }

  if (upper.includes("SUCCESS") || upper.includes("COMPLETED")) {
    return {
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-600",
    };
  }

  return {
    icon: Info,
    color: "bg-slate-100 text-slate-600",
  };
};

export function Notifications() {
  const { confirm } = useAdminDialog();
  const [filter, setFilter] = useState("All");
  const [notificationsList, setNotificationsList] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    urgent: 0,
    today: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const filterTabs = useMemo(
    () => ["All", "Unread", "Services", "Financial", "Alerts", "Users", "General"],
    []
  );

  const fetchNotifications = async () => {
    if (!accessToken) {
      setLoading(false);
      setError("Your admin session has expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await adminFetchJson<NotificationsResponse & { message?: string }>(
        "/admin/notifications",
        { method: "GET" },
        "Unable to load notifications."
      );

      setNotificationsList(payload.data.items || []);
      setStats(
        payload.data.stats || {
          total: 0,
          unread: 0,
          urgent: 0,
          today: 0,
        }
      );
    } catch (fetchError) {
      setNotificationsList([]);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, []);

  const runMutation = async (
    request: () => Promise<Response>,
    successMessage: string
  ) => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await request();
      const payload = (await response.json()) as {
        status: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to update notification.");
      }

      setFeedback(successMessage);
      await fetchNotifications();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update notification."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!accessToken) return;

    await runMutation(
      () =>
        adminFetch(`/admin/notifications/${id}/read`, { method: "PATCH" }),
      "Notification marked as read."
    );
  };

  const markAllAsRead = async () => {
    if (!accessToken) return;

    await runMutation(
      () =>
        adminFetch(`/admin/notifications/read-all`, { method: "PATCH" }),
      "All notifications marked as read."
    );
  };

  const deleteNotification = async (id: string) => {
    if (!accessToken) return;
    if (
      !(await confirm({
        title: "Delete notification",
        message: "Delete this notification?",
        confirmLabel: "Delete",
        destructive: true,
      }))
    ) {
      return;
    }

    await runMutation(
      () =>
        adminFetch(`/admin/notifications/${id}`, { method: "DELETE" }),
      "Notification deleted."
    );
  };

  const filteredNotifications = notificationsList.filter((notification) => {
    if (filter === "All") return true;
    if (filter === "Unread") return !notification.isRead;
    return deriveCategory(notification.type) === filter;
  });

  const unreadCount = stats.unread;

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-gray-600">
            Stay updated with platform alerts, job events, and account activity
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => void markAllAsRead()}
            disabled={submitting}
            className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:mt-0"
          >
            <Check size={20} />
            Mark All as Read
          </button>
        )}
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
            <p className="text-sm text-gray-600">Total Notifications</p>
            <div className="rounded-lg bg-blue-100 p-2">
              <Bell className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Unread</p>
            <div className="rounded-lg bg-red-100 p-2">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.unread}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Urgent Alerts</p>
            <div className="rounded-lg bg-orange-100 p-2">
              <AlertTriangle className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.urgent}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Today</p>
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.today}</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white shadow">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 p-4">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                filter === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab}
              {tab === "Unread" && unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No notifications to display</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const typeConfig = getTypeConfig(notification.type);
              const category = deriveCategory(notification.type);
              const Icon = typeConfig.icon;

              return (
                <div
                  key={notification._id}
                  className={`p-4 transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${typeConfig.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-start justify-between">
                        <h3
                          className={`font-semibold ${
                            !notification.isRead ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <span className="ml-4 whitespace-nowrap text-xs text-gray-500">
                          {formatRelativeDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-gray-600">
                        {notification.body || "No additional details were provided."}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                          {category}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {formatTypeLabel(notification.type)}
                        </span>
                        {notification.user ? (
                          <span className="text-xs text-gray-500">
                            User: {notification.user}
                          </span>
                        ) : null}
                        {!notification.isRead && (
                          <button
                            onClick={() => void markAsRead(notification._id)}
                            disabled={submitting}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => void deleteNotification(notification._id)}
                          disabled={submitting}
                          className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
