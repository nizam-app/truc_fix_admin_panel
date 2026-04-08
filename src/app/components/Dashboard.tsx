import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Wrench,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAdminAccessToken, getApiBaseUrl } from "../lib/auth";

type DashboardMetric = {
  title: string;
  value: string;
  change: string;
  icon: typeof DollarSign;
  color: string;
};

type RevenuePoint = {
  month: string;
  revenue: number;
};

type ServiceStatusPoint = {
  id: string;
  name: string;
  value: number;
};

type RecentService = {
  id: string;
  truck: string;
  issue: string;
  status: string;
  time: string;
};

type DashboardViewModel = {
  statsCards: DashboardMetric[];
  revenueData: RevenuePoint[];
  serviceData: ServiceStatusPoint[];
  recentServices: RecentService[];
};

const fallbackDashboard: DashboardViewModel = {
  statsCards: [
    {
      title: "Total Revenue",
      value: "£45,231",
      change: "Demo data",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Active Users",
      value: "2,345",
      change: "Demo data",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Service Requests",
      value: "189",
      change: "Demo data",
      icon: Wrench,
      color: "bg-orange-500",
    },
    {
      title: "Fleet Size",
      value: "847",
      change: "Demo data",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ],
  revenueData: [
    { month: "Jan", revenue: 12000 },
    { month: "Feb", revenue: 15000 },
    { month: "Mar", revenue: 18000 },
    { month: "Apr", revenue: 16000 },
    { month: "May", revenue: 22000 },
    { month: "Jun", revenue: 25000 },
  ],
  serviceData: [
    { id: "pending", name: "Pending", value: 45 },
    { id: "inprogress", name: "In Progress", value: 78 },
    { id: "completed", name: "Completed", value: 234 },
    { id: "cancelled", name: "Cancelled", value: 12 },
  ],
  recentServices: [
    {
      id: "SR-1234",
      truck: "Volvo FH16 - ABC123",
      issue: "Engine overheating",
      status: "In Progress",
      time: "2 hours ago",
    },
    {
      id: "SR-1235",
      truck: "Scania R500 - XYZ789",
      issue: "Brake inspection",
      status: "Pending",
      time: "4 hours ago",
    },
    {
      id: "SR-1236",
      truck: "MAN TGX - DEF456",
      issue: "Oil change",
      status: "Completed",
      time: "6 hours ago",
    },
    {
      id: "SR-1237",
      truck: "Mercedes Actros - GHI789",
      issue: "Transmission issue",
      status: "In Progress",
      time: "8 hours ago",
    },
  ],
};

function getNestedValue(source: any, paths: string[], fallback: any = undefined) {
  for (const path of paths) {
    const value = path.split(".").reduce((current: any, key) => current?.[key], source);
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return fallback;
}

function toNumber(value: any, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return fallback;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatMetricValue(title: string, value: number) {
  return title === "Total Revenue" ? formatCurrency(value) : formatNumber(value);
}

function formatChange(value: any) {
  if (value === undefined || value === null || value === "") {
    return "Live data";
  }

  if (typeof value === "number") {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value}%`;
  }

  return String(value);
}

function normalizeMonthLabel(value: any, index: number) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number" && value >= 1 && value <= 12) {
    return new Date(2000, value - 1, 1).toLocaleString("en-GB", { month: "short" });
  }

  return `Point ${index + 1}`;
}

function normalizeStatusLabel(value: any) {
  if (typeof value !== "string" || !value.trim()) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeRelativeTime(value: any) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "Recent";
}

function normalizeDashboardData(rawResponse: any): DashboardViewModel {
  const payload = rawResponse?.data ?? {};
  const cards = payload?.cards ?? {};

  const totalRevenue = toNumber(cards?.totalRevenue, 0);
  const activeUsers = toNumber(cards?.activeUsers, 0);
  const serviceRequests = toNumber(cards?.serviceRequests, 0);
  const fleetSize = toNumber(cards?.fleetSize, 0);

  const statsCards: DashboardMetric[] = [
    {
      title: "Total Revenue",
      value: formatMetricValue("Total Revenue", totalRevenue),
      change: "Live data",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Active Users",
      value: formatMetricValue("Active Users", activeUsers),
      change: "Live data",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Service Requests",
      value: formatMetricValue("Service Requests", serviceRequests),
      change: "Live data",
      icon: Wrench,
      color: "bg-orange-500",
    },
    {
      title: "Fleet Size",
      value: formatMetricValue("Fleet Size", fleetSize),
      change: "Live data",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  const rawRevenueData = Array.isArray(payload?.revenueOverview)
    ? payload.revenueOverview
    : [];

  const revenueData = Array.isArray(rawRevenueData) && rawRevenueData.length > 0
    ? rawRevenueData.map((item: any, index: number) => ({
        month: normalizeMonthLabel(
          item?.month ?? item?.label ?? item?.name ?? item?.period,
          index,
        ),
        revenue: toNumber(
          item?.revenue ?? item?.value ?? item?.amount ?? item?.total,
          0,
        ),
      }))
    : fallbackDashboard.revenueData;

  const rawServiceData = Array.isArray(payload?.serviceStatusDistribution)
    ? payload.serviceStatusDistribution
    : [];

  let serviceData: ServiceStatusPoint[] = fallbackDashboard.serviceData;

  if (Array.isArray(rawServiceData) && rawServiceData.length > 0) {
    serviceData = rawServiceData.map((item: any, index: number) => {
      const rawLabel = item?.label ?? item?.name ?? item?.status ?? `status_${index + 1}`;
      const label = normalizeStatusLabel(rawLabel);
      return {
        id: String(item?.id ?? rawLabel ?? index),
        name: label,
        value: toNumber(item?.value ?? item?.count ?? item?.total, 0),
      };
    });
  }

  const rawRecentServices = Array.isArray(payload?.recentServiceRequests)
    ? payload.recentServiceRequests
    : [];

  const recentServices = Array.isArray(rawRecentServices) && rawRecentServices.length > 0
    ? rawRecentServices.map((item: any, index: number) => ({
        id: String(item?.requestId ?? item?.request_id ?? item?.id ?? item?._id ?? `request-${index + 1}`),
        truck:
          (item?.truck ??
          item?.truckName ??
          item?.vehicle ??
          [item?.truck_model, item?.plateNumber ?? item?.plate_number]
            .filter(Boolean)
            .join(" - ")) ||
          "Truck details unavailable",
        issue: item?.issue ?? item?.problem ?? item?.title ?? "Issue details unavailable",
        status: normalizeStatusLabel(
          item?.status ??
          item?.rawStatus ??
          item?.requestStatus ??
          item?.request_status ??
          "Pending",
        ),
        time: normalizeRelativeTime(
          item?.time ?? item?.createdAt ?? item?.created_at ?? item?.updatedAt ?? item?.updated_at,
        ),
      }))
    : fallbackDashboard.recentServices;

  return {
    statsCards,
    revenueData,
    serviceData,
    recentServices,
  };
}

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardViewModel>(fallbackDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = async () => {
    const token = getAdminAccessToken();

    if (!token) {
      setDashboardData(fallbackDashboard);
      setErrorMessage("Admin access token not found in localStorage.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Dashboard request failed with status ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(normalizeDashboardData(data));
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
      setDashboardData(fallbackDashboard);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="text-green-500" size={18} />;
      case "In Progress":
        return <Clock className="text-blue-500" size={18} />;
      case "Pending":
        return <AlertCircle className="text-orange-500" size={18} />;
      case "Cancelled":
        return <AlertCircle className="text-red-500" size={18} />;
      default:
        return <AlertCircle className="text-gray-400" size={18} />;
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back to Truckfix Admin Panel</p>
        </div>
        <button
          onClick={loadDashboard}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 md:w-auto"
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errorMessage} Showing fallback demo data.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {dashboardData.statsCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <span className="text-green-600 text-sm font-semibold">
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.serviceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Service Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Service Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Truck
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recentServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {service.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {service.truck}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {service.issue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className="text-sm text-gray-600">{service.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
