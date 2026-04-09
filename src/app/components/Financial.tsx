import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  LoaderCircle,
  MoreVertical,
  Search,
  Send,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { getAdminAccessToken, getApiBaseUrl } from "../lib/auth";

type FinancialStats = {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  totalInvoices: number;
  pendingCount: number;
  overdueCount: number;
};

type Invoice = {
  _id?: string;
  id?: string;
  invoiceNumber?: string;
  company?: string;
  service?: string;
  amount?: number;
  currency?: string;
  status?: string;
  date?: string;
  paymentMethod?: string;
};

type InvoiceForm = {
  invoiceNumber: string;
  company: string;
  service: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  status: string;
  date: string;
};

const emptyStats: FinancialStats = {
  totalRevenue: 0,
  pendingAmount: 0,
  overdueAmount: 0,
  totalInvoices: 0,
  pendingCount: 0,
  overdueCount: 0,
};

const emptyForm: InvoiceForm = {
  invoiceNumber: "",
  company: "",
  service: "",
  amount: "",
  currency: "GBP",
  paymentMethod: "Credit Card",
  status: "PENDING",
  date: "",
};

function getId<T extends { _id?: string; id?: string }>(item: T) {
  return item._id || item.id || "";
}

function financialRequest(path: string, options: RequestInit = {}) {
  const token = getAdminAccessToken();
  if (!token) {
    throw new Error("Admin access token not found in localStorage.");
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  }).then(async (response) => {
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        payload?.message || payload?.error || `Request failed with status ${response.status}`,
      );
    }
    return payload;
  });
}

function normalizeStatus(status?: string) {
  if (!status) return "Unknown";
  return status.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeInvoice(item: any): Invoice {
  return {
    _id: item?._id,
    id: item?.id,
    invoiceNumber: item?.invoiceNumber ?? item?.invoice ?? item?.number,
    company: item?.company ?? item?.companyName,
    service: item?.service ?? item?.serviceName,
    amount: Number(item?.amount ?? item?.total ?? 0),
    currency: item?.currency ?? "GBP",
    status: item?.status,
    date: item?.date ?? item?.createdAt ?? item?.issuedAt,
    paymentMethod: item?.paymentMethod ?? item?.method,
  };
}

function formatCurrency(amount?: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "GBP",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

export function Financial() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<FinancialStats>(emptyStats);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [viewer, setViewer] = useState<{ title: string; body: string } | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchFinancials = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const payload = await financialRequest(`/admin/financial?${params.toString()}`);
      const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.data?.invoices)
        ? payload.data.invoices
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      const normalized = items.map(normalizeInvoice);
      setInvoices(normalized);

      const apiStats = payload?.data?.stats ?? payload?.data?.cards;
      const computed = normalized.reduce(
        (acc, invoice) => {
          acc.totalInvoices += 1;
          if (invoice.status === "PAID") acc.totalRevenue += invoice.amount || 0;
          if (invoice.status === "PENDING") {
            acc.pendingAmount += invoice.amount || 0;
            acc.pendingCount += 1;
          }
          if (invoice.status === "OVERDUE") {
            acc.overdueAmount += invoice.amount || 0;
            acc.overdueCount += 1;
          }
          return acc;
        },
        { ...emptyStats },
      );

      setStats({
        totalRevenue: Number(apiStats?.totalRevenue ?? computed.totalRevenue),
        pendingAmount: Number(apiStats?.pendingAmount ?? computed.pendingAmount),
        overdueAmount: Number(apiStats?.overdueAmount ?? computed.overdueAmount),
        totalInvoices: Number(apiStats?.totalInvoices ?? computed.totalInvoices),
        pendingCount: Number(apiStats?.pendingCount ?? computed.pendingCount),
        overdueCount: Number(apiStats?.overdueCount ?? computed.overdueCount),
      });

      setTotalPages(Number(payload?.meta?.totalPages ?? 1));
      setTotalItems(Number(payload?.meta?.total ?? normalized.length));
    } catch (error) {
      setInvoices([]);
      setStats(emptyStats);
      setTotalPages(1);
      setTotalItems(0);
      setErrorMessage(error instanceof Error ? error.message : "Unable to load financial data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [page, limit, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "VOID":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const openCreateInvoice = () => {
    setEditingInvoice(null);
    setForm(emptyForm);
    setInvoiceModalOpen(true);
  };

  const openEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setForm({
      invoiceNumber: invoice.invoiceNumber || "",
      company: invoice.company || "",
      service: invoice.service || "",
      amount: String(invoice.amount || ""),
      currency: invoice.currency || "GBP",
      paymentMethod: invoice.paymentMethod || "Credit Card",
      status: invoice.status || "PENDING",
      date: formatDate(invoice.date),
    });
    setInvoiceModalOpen(true);
    setOpenDropdown(null);
  };

  const submitInvoice = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const path = editingInvoice
        ? `/admin/financial/invoices/${getId(editingInvoice)}`
        : "/admin/financial/invoices";
      const method = editingInvoice ? "PATCH" : "POST";
      await financialRequest(path, {
        method,
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount || 0),
        }),
      });
      setSuccessMessage(
        editingInvoice ? "Invoice updated successfully." : "Invoice created successfully.",
      );
      setInvoiceModalOpen(false);
      await fetchFinancials();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save invoice.");
    }
  };

  const withBusy = async (id: string, work: () => Promise<void>) => {
    setBusyId(id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await work();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const exportReport = async () => {
    await withBusy("export", async () => {
      const payload = await financialRequest("/admin/financial/export");
      setViewer({ title: "Export Report", body: JSON.stringify(payload, null, 2) });
      setSuccessMessage("Export report action completed.");
    });
  };

  const viewInvoice = async (invoice: Invoice) => {
    await withBusy(getId(invoice), async () => {
      const payload = await financialRequest(`/admin/financial/${getId(invoice)}`);
      setViewer({
        title: invoice.invoiceNumber || "Invoice Details",
        body: JSON.stringify(payload, null, 2),
      });
      setOpenDropdown(null);
    });
  };

  const downloadPdf = async (invoice: Invoice) => {
    await withBusy(getId(invoice), async () => {
      const payload = await financialRequest(`/admin/financial/${getId(invoice)}/pdf`);
      setViewer({
        title: `${invoice.invoiceNumber || "Invoice"} PDF`,
        body: JSON.stringify(payload, null, 2),
      });
      setSuccessMessage("PDF download action completed.");
      setOpenDropdown(null);
    });
  };

  const sendToClient = async (invoice: Invoice) => {
    await withBusy(getId(invoice), async () => {
      await financialRequest(`/admin/financial/${getId(invoice)}/send`, { method: "POST" });
      setSuccessMessage("Invoice sent to client.");
      setOpenDropdown(null);
    });
  };

  const updateInvoiceStatus = async (invoice: Invoice, status: string) => {
    await withBusy(getId(invoice), async () => {
      await financialRequest(`/admin/financial/invoices/${getId(invoice)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setSuccessMessage(`Invoice marked as ${normalizeStatus(status)}.`);
      setOpenDropdown(null);
      await fetchFinancials();
    });
  };

  const deleteInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`Delete ${invoice.invoiceNumber || "this invoice"}?`)) return;
    await withBusy(getId(invoice), async () => {
      await financialRequest(`/admin/financial/invoices/${getId(invoice)}`, {
        method: "DELETE",
      });
      setSuccessMessage("Invoice deleted successfully.");
      setOpenDropdown(null);
      await fetchFinancials();
    });
  };

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "All Status" },
      { value: "PAID", label: "Paid" },
      { value: "PENDING", label: "Pending" },
      { value: "OVERDUE", label: "Overdue" },
      { value: "VOID", label: "Void" },
    ],
    [],
  );

  const toggleInvoiceMenu = (invoice: Invoice, element: HTMLButtonElement) => {
    const invoiceId = getId(invoice);
    if (openDropdown === invoiceId) {
      setOpenDropdown(null);
      setMenuPosition(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const menuWidth = 224;
    const viewportWidth = window.innerWidth;
    const left = Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 16);

    setOpenDropdown(invoiceId);
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.max(16, left),
    });
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600 mt-1">Track payments, invoices, and revenue</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button
            type="button"
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Download size={20} />
            {busyId === "export" ? "Exporting..." : "Export Report"}
          </button>
          <button
            type="button"
            onClick={openCreateInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText size={20} />
            Create Invoice
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
            <TrendingUp size={16} />
            <span>Live revenue data</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Pending Payments</p>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CreditCard className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.pendingAmount)}
          </p>
          <p className="text-sm text-gray-500 mt-2">{stats.pendingCount} invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Overdue Amount</p>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.overdueAmount)}
          </p>
          <p className="text-sm text-gray-500 mt-2">{stats.overdueCount} invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalInvoices}</p>
          <p className="text-sm text-gray-500 mt-2">This month</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by invoice, company, or service..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <div className="flex items-center justify-center gap-3 text-gray-600">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Loading invoices...
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    No invoices found for the current filters.
                  </td>
                </tr>
              ) : invoices.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.invoiceNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status || "")}`}>
                      {normalizeStatus(transaction.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="relative">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(event) =>
                          toggleInvoiceMenu(transaction, event.currentTarget)
                        }
                      >
                        {busyId === getId(transaction) ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical size={16} />
                        )}
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-lg bg-white px-6 py-4 shadow sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages} • {totalItems} total invoices
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {invoiceModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingInvoice ? "Edit Invoice" : "Create Invoice"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingInvoice
                    ? "Update the invoice details below."
                    : "Create a new invoice for a company service."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["invoiceNumber", "Invoice number"],
                ["company", "Company"],
                ["service", "Service"],
                ["amount", "Amount"],
                ["currency", "Currency"],
                ["paymentMethod", "Payment method"],
                ["date", "Date (YYYY-MM-DD)"],
              ].map(([key, label]) => (
                <input
                  key={key}
                  value={form[key as keyof InvoiceForm]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={label}
                  className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-500"
                />
              ))}

              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="VOID">Void</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitInvoice}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {editingInvoice ? "Save Changes" : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {openDropdown && menuPosition ? (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => {
              setOpenDropdown(null);
              setMenuPosition(null);
            }}
          />
          <div
            className="fixed z-30 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="py-1">
              {(() => {
                const transaction = invoices.find((item) => getId(item) === openDropdown);
                if (!transaction) return null;

                return (
                  <>
                    <button
                      onClick={() => viewInvoice(transaction)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Eye size={16} />
                      <span>View Invoice</span>
                    </button>

                    <button
                      onClick={() => downloadPdf(transaction)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Download size={16} />
                      <span>Download PDF</span>
                    </button>

                    <button
                      onClick={() => sendToClient(transaction)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Send size={16} />
                      <span>Send to Client</span>
                    </button>

                    <button
                      onClick={() => openEditInvoice(transaction)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit size={16} />
                      <span>Edit Invoice</span>
                    </button>

                    <div className="my-1 border-t border-gray-200" />

                    {transaction.status === "PENDING" ? (
                      <button
                        onClick={() => updateInvoiceStatus(transaction, "PAID")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle size={16} />
                        <span>Mark as Paid</span>
                      </button>
                    ) : null}

                    <button
                      onClick={() => updateInvoiceStatus(transaction, "VOID")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <XCircle size={16} />
                      <span>Void Invoice</span>
                    </button>

                    <button
                      onClick={() => deleteInvoice(transaction)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      ) : null}

      {viewer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{viewer.title}</h2>
              <button
                type="button"
                onClick={() => setViewer(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <pre className="mt-6 max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
              {viewer.body}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
