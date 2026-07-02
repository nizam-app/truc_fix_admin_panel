import React, { useEffect, useState } from "react";
import {
  BarChart3,
  DollarSign,
  Download,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
import { adminFetch } from "../apiClient";

type ReportsPayload = {
  reportType: string;
  summary: {
    totalRevenue: number;
    totalServices: number;
    activeCompanies: number;
    avgServiceValue: number;
  };
  monthlyRevenueTrend: {
    month: string;
    revenue: number;
    services: number;
  }[];
  topServices: {
    name: string;
    count: number;
    revenue: number;
  }[];
  topCompanies: {
    companyName: string;
    services: number;
    revenue: number;
  }[];
  mechanicPerformance: {
    mechanicName: string;
    services: number;
    rating: number;
    revenue: number;
  }[];
  exportFormat: string;
};

type ReportsResponse = {
  status: string;
  message: string;
  data: ReportsPayload;
};

type ExportResponse = {
  status: string;
  message: string;
  data: {
    generatedAt: string;
    format: string;
    report: ReportsPayload;
    downloadUrl: string | null;
  };
};

const formatMoney = (value: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

const reportTypeOptions = [
  "REVENUE",
  "SERVICE PERFORMANCE",
  "MECHANIC PERFORMANCE",
  "CUSTOMER ANALYSIS",
  "PARTS USAGE",
];

// Backend currently supports a real downloadable export only for CSV.
const exportFormats = ["CSV"];

const dateRangeOptions = [
  "TODAY",
  "THIS_WEEK",
  "THIS_MONTH",
  "LAST_MONTH",
  "LAST_3_MONTHS",
  "THIS_YEAR",
];

export function Reports() {
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [reportType, setReportType] = useState("REVENUE");
  const [exportFormat, setExportFormat] = useState("CSV");
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const fetchReports = async () => {
    if (!accessToken) {
      setLoading(false);
      setError("Your admin session has expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: reportType,
        range: dateRange,
        format: exportFormat,
      });

      const response = await adminFetch(`/admin/reports?${params.toString()}`, { method: "GET" });

      const payload = (await response.json()) as ReportsResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load reports.");
      }

      setData(payload.data);
    } catch (fetchError) {
      setData(null);
      setError(
        fetchError instanceof Error ? fetchError.message : "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, [dateRange, reportType, exportFormat]);

  const handleExport = async () => {
    if (!accessToken) return;

    setExporting(true);
    setError(null);
    setFeedback(null);

    try {
      const params = new URLSearchParams({
        type: reportType,
        range: dateRange,
        format: exportFormat,
      });

      const response = await adminFetch(`/admin/reports/export?${params.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message || "Unable to prepare report export.");
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/csv")) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStamp = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `admin-report-${reportType.toLowerCase().replace(/\s+/g, "-")}-${dateStamp}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setFeedback("Report exported.");
      } else {
        const payload = (await response.json()) as ExportResponse & { message?: string };
        if (payload.data.downloadUrl) {
          window.open(payload.data.downloadUrl, "_blank", "noopener,noreferrer");
          setFeedback(`Report export started (${payload.data.format}).`);
        } else {
          setFeedback(payload.message || "Report export prepared.");
        }
      }
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Unable to prepare report export."
      );
    } finally {
      setExporting(false);
    }
  };

  const revenueMax = Math.max(
    ...(data?.monthlyRevenueTrend.map((item) => item.revenue) || [1])
  );

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-gray-600">
            View platform revenue, service performance, and company activity
          </p>
        </div>
        <button
          className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:mt-0"
          onClick={() => void handleExport()}
          disabled={exporting}
        >
          <Download size={20} />
          {exporting ? "Preparing..." : "Export Report"}
        </button>
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

      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
            >
              {dateRangeOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Report Type
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
            >
              {reportTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Export Format
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={exportFormat}
              onChange={(event) => setExportFormat(event.target.value)}
            >
              {exportFormats.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg bg-white p-10 text-center text-sm text-gray-500 shadow">
          Loading report data...
        </div>
      ) : !data ? (
        <div className="rounded-lg bg-white p-10 text-center text-sm text-gray-500 shadow">
          Report data is unavailable right now.
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <div className="rounded-lg bg-green-100 p-2">
                  <DollarSign className="text-green-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatMoney(data.summary.totalRevenue)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                <TrendingUp size={16} />
                <span>Invoice-backed total</span>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-600">Total Services</p>
                <div className="rounded-lg bg-blue-100 p-2">
                  <Wrench className="text-blue-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {data.summary.totalServices}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-blue-600">
                <TrendingUp size={16} />
                <span>Jobs tracked in system</span>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-600">Active Companies</p>
                <div className="rounded-lg bg-purple-100 p-2">
                  <Users className="text-purple-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {data.summary.activeCompanies}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-purple-600">
                <TrendingUp size={16} />
                <span>Fleet accounts currently active</span>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-600">Avg Service Value</p>
                <div className="rounded-lg bg-orange-100 p-2">
                  <BarChart3 className="text-orange-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatMoney(data.summary.avgServiceValue)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-orange-600">
                <TrendingUp size={16} />
                <span>Average invoice total</span>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Monthly Revenue Trend
              </h3>
              <div className="space-y-4">
                {data.monthlyRevenueTrend.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No monthly revenue points are available yet.
                  </p>
                ) : (
                  data.monthlyRevenueTrend.map((point) => (
                    <div key={point.month}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {point.month}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatMoney(point.revenue)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${Math.max(
                              8,
                              (point.revenue / revenueMax) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {point.services} services
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Top Services
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">
                        Service
                      </th>
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">
                        Count
                      </th>
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topServices.map((service) => (
                      <tr key={service.name} className="border-b border-gray-100">
                        <td className="py-3 text-sm text-gray-900">{service.name}</td>
                        <td className="py-3 text-sm text-gray-600">{service.count}</td>
                        <td className="py-3 text-sm font-semibold text-gray-900">
                          {formatMoney(service.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Top Companies
              </h3>
              <div className="space-y-4">
                {data.topCompanies.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No top company data is available yet.
                  </p>
                ) : (
                  data.topCompanies.map((company) => (
                    <div
                      key={`${company.companyName}-${company.revenue}`}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {company.companyName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {company.services} services
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatMoney(company.revenue)}
                        </p>
                        <p className="text-xs text-gray-500">Total revenue</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Mechanic Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">
                        Mechanic
                      </th>
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">
                        Services
                      </th>
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">
                        Rating
                      </th>
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.mechanicPerformance.map((mechanic) => (
                      <tr
                        key={`${mechanic.mechanicName}-${mechanic.services}`}
                        className="border-b border-gray-100"
                      >
                        <td className="py-3 text-sm text-gray-900">
                          {mechanic.mechanicName}
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {mechanic.services}
                        </td>
                        <td className="py-3">
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                            {mechanic.rating.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-semibold text-gray-900">
                          {formatMoney(mechanic.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
