import React, { useEffect, useState } from "react";
import {
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
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
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type FinancialInvoiceItem = {
  _id: string;
  invoiceNo: string;
  company: string | null;
  service: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: "PAID" | "PENDING" | "OVERDUE" | string;
  date: string | null;
};

type FinancialApiResponse = {
  status: string;
  message: string;
  data: {
    cards: {
      totalRevenue: number;
      pendingPayments: number;
      overdueAmount: number;
      totalInvoices: number;
    };
    items: FinancialInvoiceItem[];
  };
};

type UsersApiResponse = {
  status: string;
  message: string;
  data: {
    items: Array<{
      _id: string;
      name: string;
      email: string;
      role: string;
      company: string | null;
    }>;
  };
};

type AdminUserOption = {
  _id: string;
  label: string;
  role: string;
};

type ServiceRequestOption = {
  _id: string;
  requestId: string;
  label: string;
  amount: number | null;
  description: string;
  fleetId: string | null;
  mechanicId: string | null;
};

type ServiceRequestsApiResponse = {
  status: string;
  message: string;
  data: {
    items: Array<{
      _id: string;
      requestId: string;
      fleetId?: string | null;
      issue: { title: string; description: string };
      assignedTo: { _id: string; name: string | null } | null;
      amount: number | null;
    }>;
  };
};

const formatMoney = (value: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string | null) => {
  if (!value) return "Not issued";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "OVERDUE":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export function Financial() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cards, setCards] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    overdueAmount: 0,
    totalInvoices: 0,
  });
  const [invoices, setInvoices] = useState<FinancialInvoiceItem[]>([]);
  const [fleetOptions, setFleetOptions] = useState<AdminUserOption[]>([]);
  const [mechanicOptions, setMechanicOptions] = useState<AdminUserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [invoiceFleetId, setInvoiceFleetId] = useState<string>("");
  const [invoiceMechanicId, setInvoiceMechanicId] = useState<string>("");
  const [invoiceJobId, setInvoiceJobId] = useState<string>("");
  const [jobOptions, setJobOptions] = useState<ServiceRequestOption[]>([]);
  const [jobOptionsLoading, setJobOptionsLoading] = useState(false);
  const [invoiceSubtotal, setInvoiceSubtotal] = useState("250");
  const [invoiceDescription, setInvoiceDescription] = useState(
    "Admin created invoice"
  );

  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
  const [invoiceDetailsItem, setInvoiceDetailsItem] =
    useState<FinancialInvoiceItem | null>(null);

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const fetchFinancial = async () => {
    if (!accessToken) {
      setError("Your admin session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const response = await fetch(
        `${apiBaseUrl}/admin/financial${params.toString() ? `?${params}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const payload = (await response.json()) as FinancialApiResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load financial overview.");
      }

      setCards(payload.data.cards);
      setInvoices(payload.data.items || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load financial overview."
      );
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOptions = async () => {
    if (!accessToken) return;

    try {
      const [fleetRes, mechanicRes] = await Promise.all([
        fetch(`${apiBaseUrl}/admin/users?role=COMPANIES&limit=100`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${apiBaseUrl}/admin/users?role=TECHNICIANS&limit=100`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const fleetPayload = (await fleetRes.json()) as UsersApiResponse;
      const mechanicPayload = (await mechanicRes.json()) as UsersApiResponse;

      if (fleetRes.ok) {
        setFleetOptions(
          fleetPayload.data.items.map((item) => ({
            _id: item._id,
            label: item.name || item.email,
            role: item.role,
          }))
        );
      }

      if (mechanicRes.ok) {
        setMechanicOptions(
          mechanicPayload.data.items.map((item) => ({
            _id: item._id,
            label: item.name || item.email,
            role: item.role,
          }))
        );
      }
    } catch {
      // Keep silent here; the page can still function without preload helpers.
    }
  };

  const handleJobSelection = (
    jobId: string,
    options: ServiceRequestOption[] = jobOptions
  ) => {
    setInvoiceJobId(jobId);
    const job = options.find((item) => item._id === jobId);
    if (!job) return;
    if (job.mechanicId) {
      setInvoiceMechanicId(job.mechanicId);
    }
    if (job.amount != null && job.amount > 0) {
      setInvoiceSubtotal(String(job.amount));
    }
    setInvoiceDescription(job.description);
  };

  const fetchJobOptions = async (fleetId: string, mechanicId?: string) => {
    if (!accessToken || !fleetId) {
      setJobOptions([]);
      return;
    }

    setJobOptionsLoading(true);
    try {
      const params = new URLSearchParams({
        fleetId,
        invoiceEligible: "true",
        limit: "100",
      });
      const response = await fetch(
        `${apiBaseUrl}/admin/service-requests?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const payload = (await response.json()) as ServiceRequestsApiResponse & {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message || "Unable to load service requests.");
      }

      let items = payload.data.items || [];
      if (mechanicId) {
        const filtered = items.filter((item) => item.assignedTo?._id === mechanicId);
        if (filtered.length > 0) {
          items = filtered;
        }
      }

      const options = items.map((item) => {
        const tech = item.assignedTo?.name?.trim();
        const techSuffix = tech ? ` · ${tech}` : "";
        return {
          _id: item._id,
          requestId: item.requestId,
          label: `${item.requestId} — ${item.issue.title}${techSuffix}`,
          amount: item.amount,
          description: `${item.requestId} - ${item.issue.title}`,
          fleetId: item.fleetId || fleetId,
          mechanicId: item.assignedTo?._id || "",
        };
      });
      setJobOptions(options);
      if (options.length === 1) {
        handleJobSelection(options[0]._id, options);
      }
    } catch {
      setJobOptions([]);
    } finally {
      setJobOptionsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchFinancial();
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    void fetchUserOptions();
  }, []);

  useEffect(() => {
    if (!createInvoiceOpen) return;
    const fleetId = invoiceFleetId || fleetOptions[0]?._id || "";
    const mechanicId = invoiceMechanicId || mechanicOptions[0]?._id || "";
    if (!fleetId) {
      setJobOptions([]);
      return;
    }
    void fetchJobOptions(fleetId, mechanicId || undefined);
  }, [
    createInvoiceOpen,
    invoiceFleetId,
    invoiceMechanicId,
    fleetOptions.length,
    mechanicOptions.length,
  ]);

  const handleExport = async () => {
    if (!accessToken) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const params = new URLSearchParams({ format: "CSV" });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const response = await fetch(
        `${apiBaseUrl}/admin/financial/export?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message || "Unable to export financial report.");
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/csv")) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStamp = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `financial-report-${dateStamp}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setFeedback("Financial report exported.");
      } else {
        const payload = (await response.json()) as { message?: string };
        setFeedback(payload.message || "Financial export prepared.");
      }
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Unable to export financial report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateInvoiceForm = () => {
    setInvoiceFleetId(fleetOptions[0]?._id || "");
    setInvoiceMechanicId(mechanicOptions[0]?._id || "");
    setInvoiceJobId("");
    setJobOptions([]);
    setInvoiceSubtotal("250");
    setInvoiceDescription("Admin created invoice");
  };

  const handleCreateInvoice = async () => {
    if (!accessToken) return;

    const fleetId = invoiceFleetId || fleetOptions[0]?._id || "";
    const mechanicId = invoiceMechanicId || mechanicOptions[0]?._id || "";
    const jobId = invoiceJobId || jobOptions[0]?._id || "";

    if (!fleetId) {
      setError("Select a fleet company.");
      return;
    }

    if (!jobId) {
      setError(
        "Select a service request (job). Jobs must be assigned, in progress or completed, and not already invoiced. Use Service Requests to assign a technician if needed."
      );
      return;
    }

    const selectedJob = jobOptions.find((item) => item._id === jobId);
    const resolvedMechanicId =
      selectedJob?.mechanicId || mechanicId;
    if (!resolvedMechanicId) {
      setError(
        "The selected job has no assigned technician. Assign a mechanic in Service Requests first."
      );
      return;
    }

    const subtotalRaw = invoiceSubtotal.trim();
    if (!subtotalRaw) {
      setError("Subtotal is required.");
      return;
    }
    const subtotal = Number(subtotalRaw);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      setError("Subtotal must be a number greater than 0.");
      return;
    }

    const description = invoiceDescription.trim() || "Admin created invoice";

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/admin/financial/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          jobId,
          fleetId,
          mechanicId: resolvedMechanicId,
          subtotal,
          description,
          currency: "GBP",
        }),
      });

      const payload = (await response.json()) as {
        status: string;
        message?: string;
        data?: {
          invoiceNo?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to create invoice.");
      }

      setFeedback(
        `Invoice ${payload.data?.invoiceNo || "created"} successfully.`
      );
      setCreateInvoiceOpen(false);
      resetCreateInvoiceForm();
      await fetchFinancial();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create invoice."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewInvoice = (invoice: FinancialInvoiceItem) => {
    setInvoiceDetailsItem(invoice);
    setInvoiceDetailsOpen(true);
  };

  return (
    <div>
      <Dialog
        open={createInvoiceOpen}
        onOpenChange={(nextOpen) => {
          setCreateInvoiceOpen(nextOpen);
          if (!nextOpen) resetCreateInvoiceForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
            <DialogDescription>
              Create a manual admin invoice linked to a service request (job), fleet
              company, and technician.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fleet company</Label>
                <Select
                  value={invoiceFleetId || fleetOptions[0]?._id || ""}
                  onValueChange={(v) => {
                    setInvoiceFleetId(v);
                    setInvoiceJobId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fleet company" />
                  </SelectTrigger>
                  <SelectContent>
                    {fleetOptions.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Technician</Label>
                <Select
                  value={invoiceMechanicId || mechanicOptions[0]?._id || ""}
                  onValueChange={(v) => {
                    setInvoiceMechanicId(v);
                    setInvoiceJobId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {mechanicOptions.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service request (job)</Label>
              <Select
                value={invoiceJobId || jobOptions[0]?._id || ""}
                onValueChange={(v) => handleJobSelection(v)}
                disabled={jobOptionsLoading || jobOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      jobOptionsLoading
                        ? "Loading service requests..."
                        : jobOptions.length
                        ? "Select service request"
                        : "No eligible jobs for this fleet and technician"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {jobOptions.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {jobOptionsLoading
                  ? "Loading jobs for this fleet..."
                  : jobOptions.length
                  ? "Pick the service request to invoice. Technician is filled from the job."
                  : "No eligible jobs for this fleet. The job must be assigned to a technician, in progress or completed, and not already invoiced. Assign a mechanic under Service Requests, or complete the job in the mobile app first."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Subtotal (GBP)</Label>
                <Input
                  value={invoiceSubtotal}
                  onChange={(e) => setInvoiceSubtotal(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateInvoiceOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30"
              onClick={() => void handleCreateInvoice()}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={invoiceDetailsOpen}
        onOpenChange={(nextOpen) => {
          setInvoiceDetailsOpen(nextOpen);
          if (!nextOpen) setInvoiceDetailsItem(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Invoice details</DialogTitle>
            <DialogDescription>Review this invoice summary.</DialogDescription>
          </DialogHeader>

          {invoiceDetailsItem ? (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Invoice</span>
                <span className="font-medium text-gray-900">
                  {invoiceDetailsItem.invoiceNo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Company</span>
                <span className="font-medium text-gray-900">
                  {invoiceDetailsItem.company || "Unknown fleet"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900">
                  {invoiceDetailsItem.service || "No service linked"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium text-gray-900">
                  {formatMoney(
                    invoiceDetailsItem.amount,
                    invoiceDetailsItem.currency
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                    invoiceDetailsItem.status
                  )}`}
                >
                  {invoiceDetailsItem.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Payment method</span>
                <span className="font-medium text-gray-900">
                  {invoiceDetailsItem.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(invoiceDetailsItem.date)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
              No invoice selected.
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setInvoiceDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Management
          </h1>
          <p className="mt-1 text-gray-600">
            Track invoice flow, revenue exposure, and admin-created billing records
          </p>
        </div>

        <div className="mt-4 flex gap-3 md:mt-0">
          <Button
            variant="outline"
            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            onClick={() => void handleExport()}
            disabled={submitting}
          >
            <Download size={20} />
            Export Report
          </Button>

          <Button
            className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30"
            onClick={() => setCreateInvoiceOpen(true)}
            disabled={submitting}
          >
            <Plus size={18} />
            Create Invoice
          </Button>
        </div>
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
            <p className="text-sm text-gray-600">Total Revenue</p>
            <div className="rounded-lg bg-green-100 p-2">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatMoney(cards.totalRevenue)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>Paid and issued invoice total</span>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Pending Payments</p>
            <div className="rounded-lg bg-yellow-100 p-2">
              <CreditCard className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatMoney(cards.pendingPayments)}
          </p>
          <p className="mt-2 text-sm text-gray-500">Invoices still awaiting settlement</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Overdue Amount</p>
            <div className="rounded-lg bg-red-100 p-2">
              <TrendingDown className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatMoney(cards.overdueAmount)}
          </p>
          <p className="mt-2 text-sm text-gray-500">Issued invoices older than 14 days</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <div className="rounded-lg bg-blue-100 p-2">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{cards.totalInvoices}</p>
          <p className="mt-2 text-sm text-gray-500">Current filtered invoice count</p>
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
              placeholder="Search by invoice number..."
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
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
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
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No invoices matched this filter yet.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNo}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {invoice.company || "Unknown fleet"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {invoice.service || "No linked service"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatMoney(invoice.amount, invoice.currency)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {invoice.paymentMethod}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status === "PAID"
                          ? "Paid"
                          : invoice.status === "PENDING"
                          ? "Pending"
                          : invoice.status === "OVERDUE"
                          ? "Overdue"
                          : invoice.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <button
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye size={14} />
                        View
                      </button>
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
