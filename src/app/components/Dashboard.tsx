import { useEffect, useMemo, useState } from "react";
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
import { getStoredAdminSession } from "../auth";
import { adminFetchJson } from "../apiClient";

type DashboardApiResponse = {
  status: string;
  message: string;
  data: {
    cards: {
      totalRevenue: number;
      activeUsers: number;
      serviceRequests: number;
      fleetSize: number;
    };
    revenueOverview: Array<{
      month: string;
      revenue: number;
    }>;
    serviceStatusDistribution: Array<{
      label: string;
      value: number;
    }>;
    recentServiceRequests: Array<{
      _id: string;
      requestId: string;
      truck: string;
      issue: string;
      status: string;
      rawStatus: string;
      time: string | null;
    }>;
  };
};

type DashboardData = DashboardApiResponse["data"];

const defaultDashboardData: DashboardData = {
  cards: {
    totalRevenue: 0,
    activeUsers: 0,
    serviceRequests: 0,
    fleetSize: 0,
  },
  revenueOverview: [],
  serviceStatusDistribution: [],
  recentServiceRequests: [],
};

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-GB");

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const session = getStoredAdminSession();

      if (!session?.accessToken) {
        if (isMounted) {
          setErrorMessage("Admin session missing. Please sign in again.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const payload = await adminFetchJson<DashboardApiResponse>(
          "/admin/dashboard",
          { method: "GET" },
          "Unable to load dashboard data."
        );

        if (isMounted) setDashboardData(payload.data);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load dashboard data."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const statsCards = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: currencyFormatter.format(dashboardData.cards.totalRevenue || 0),
        change: "Live",
        icon: DollarSign,
        color: "bg-green-500",
      },
      {
        title: "Active Users",
        value: numberFormatter.format(dashboardData.cards.activeUsers || 0),
        change: "Live",
        icon: Users,
        color: "bg-blue-500",
      },
      {
        title: "Service Requests",
        value: numberFormatter.format(dashboardData.cards.serviceRequests || 0),
        change: "Live",
        icon: Wrench,
        color: "bg-orange-500",
      },
      {
        title: "Fleet Size",
        value: numberFormatter.format(dashboardData.cards.fleetSize || 0),
        change: "Live",
        icon: TrendingUp,
        color: "bg-purple-500",
      },
    ],
    [dashboardData.cards]
  );

  const recentServices = dashboardData.recentServiceRequests.map((service) => ({
    id: service._id,
    requestId: service.requestId,
    truck: service.truck,
    issue: service.issue,
    status: service.status,
    time: service.time || "Just now",
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="text-green-500" size={18} />;
      case "IN_PROGRESS":
        return <Clock className="text-blue-500" size={18} />;
      case "PENDING":
        return <AlertCircle className="text-orange-500" size={18} />;
      case "CANCELLED":
        return <AlertCircle className="text-red-500" size={18} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) =>
    status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back to Truckfix Admin Panel</p>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <span className="text-green-600 text-sm font-semibold">{stat.change}</span>
            </div>
            <h3 className="text-gray-600 text-sm">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {isLoading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.revenueOverview}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => currencyFormatter.format(value || 0)}
              />
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Service Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.serviceStatusDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
              {recentServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {service.requestId}
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
                      <span className="text-sm text-gray-600">
                        {getStatusLabel(service.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.time}
                  </td>
                </tr>
              ))}
              {!isLoading && recentServices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No recent service requests available yet.
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
