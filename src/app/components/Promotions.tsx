import React, { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Edit,
  Eye,
  MoreVertical,
  Plus,
  Search,
  Tag,
  TrendingUp,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
import { useAdminDialog } from "../adminDialog";
import { adminFetch } from "../apiClient";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type PromotionItem = {
  _id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED" | string;
  discountValue: number;
  minAmount: number;
  currency: string;
  usageCount: number;
  usageLimit: number | null;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | string;
  expiresAt: string | null;
  createdAt?: string;
};

type PromotionsApiResponse = {
  status: string;
  message: string;
  data: {
    items: PromotionItem[];
    stats: {
      activePromotions: number;
      totalUsage: number;
      avgDiscount: number;
    };
  };
};

const formatDate = (value: string | null) => {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export function Promotions() {
  const { confirm } = useAdminDialog();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [items, setItems] = useState<PromotionItem[]>([]);
  const [stats, setStats] = useState({
    activePromotions: 0,
    totalUsage: 0,
    avgDiscount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PromotionItem | null>(null);

  const [formCode, setFormCode] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [formDiscountValue, setFormDiscountValue] = useState("10");
  const [formMinAmount, setFormMinAmount] = useState("0");
  const [formUsageLimit, setFormUsageLimit] = useState("100");
  const [formExpiresAt, setFormExpiresAt] = useState<string>(""); // yyyy-mm-dd
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE" | "EXPIRED">(
    "ACTIVE"
  );

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const statusOptions = useMemo(
    () => [
      { value: "All", label: "All Status" },
      { value: "ACTIVE", label: "Active" },
      { value: "INACTIVE", label: "Inactive" },
      { value: "EXPIRED", label: "Expired" },
    ],
    []
  );

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") return "bg-green-100 text-green-800 border-transparent";
    if (status === "EXPIRED") return "bg-red-100 text-red-800 border-transparent";
    if (status === "INACTIVE") return "bg-slate-100 text-slate-700 border-transparent";
    return "bg-slate-100 text-slate-700 border-transparent";
  };

  const fetchPromotions = async () => {
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
      if (statusFilter !== "All") params.set("status", statusFilter);

      const response = await fetch(
        `${apiBaseUrl}/admin/promotions${params.toString() ? `?${params}` : ""}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const payload = (await response.json()) as PromotionsApiResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load promotions.");
      }

      const normalizedItems = (payload.data.items || []).map((item) => ({
        ...item,
        status: `${item.status || ""}`.trim().toUpperCase(),
        discountType: `${item.discountType || ""}`.trim().toUpperCase(),
        code: `${item.code || ""}`.trim().toUpperCase(),
      }));

      setItems(normalizedItems);
      setStats(
        payload.data.stats || { activePromotions: 0, totalUsage: 0, avgDiscount: 0 }
      );
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : "Unable to load promotions."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchPromotions(), 200);
    return () => window.clearTimeout(timeout);
  }, [searchTerm, statusFilter]);

  const resetForm = () => {
    setFormCode("");
    setFormDiscountType("PERCENTAGE");
    setFormDiscountValue("10");
    setFormMinAmount("0");
    setFormUsageLimit("100");
    setFormExpiresAt("");
    setFormStatus("ACTIVE");
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (item: PromotionItem) => {
    setActiveItem(item);
    setFormCode(item.code || "");
    setFormDiscountType((item.discountType as any) === "FIXED" ? "FIXED" : "PERCENTAGE");
    setFormDiscountValue(String(item.discountValue ?? 0));
    setFormMinAmount(String(item.minAmount ?? 0));
    setFormUsageLimit(item.usageLimit !== null && item.usageLimit !== undefined ? String(item.usageLimit) : "100");
    setFormExpiresAt(item.expiresAt ? String(item.expiresAt).slice(0, 10) : "");
    setFormStatus((item.status as any) || "ACTIVE");
    setEditOpen(true);
  };

  const openDetails = (item: PromotionItem) => {
    setActiveItem(item);
    setDetailsOpen(true);
  };

  const submitCreate = async () => {
    if (!accessToken) return;
    const code = formCode.trim().toUpperCase();
    const discountValue = Number(formDiscountValue);
    const minAmount = Number(formMinAmount);
    const usageLimit = Number(formUsageLimit);
    if (!code) return setError("Promo code is required.");
    if (!Number.isFinite(discountValue) || discountValue <= 0)
      return setError("Discount value must be greater than 0.");
    if (!Number.isFinite(minAmount) || minAmount < 0)
      return setError("Min amount must be 0 or greater.");
    if (!Number.isFinite(usageLimit) || usageLimit < 1)
      return setError("Usage limit must be at least 1.");

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await adminFetch(`/admin/promotions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code,
          discountType: formDiscountType,
          discountValue,
          minAmount,
          currency: "GBP",
          usageLimit,
          status: formStatus,
          expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Unable to create promotion.");

      setFeedback("Promotion created successfully.");
      setCreateOpen(false);
      resetForm();
      await fetchPromotions();
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Unable to create promotion."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!accessToken || !activeItem?._id) return;
    const code = formCode.trim().toUpperCase();
    const discountValue = Number(formDiscountValue);
    const minAmount = Number(formMinAmount);
    const usageLimit = Number(formUsageLimit);
    if (!code) return setError("Promo code is required.");
    if (!Number.isFinite(discountValue) || discountValue <= 0)
      return setError("Discount value must be greater than 0.");
    if (!Number.isFinite(minAmount) || minAmount < 0)
      return setError("Min amount must be 0 or greater.");
    if (!Number.isFinite(usageLimit) || usageLimit < 1)
      return setError("Usage limit must be at least 1.");

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await adminFetch(`/admin/promotions/${activeItem._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code,
          discountType: formDiscountType,
          discountValue,
          minAmount,
          usageLimit,
          status: formStatus,
          expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Unable to update promotion.");

      setFeedback("Promotion updated successfully.");
      setEditOpen(false);
      setActiveItem(null);
      resetForm();
      await fetchPromotions();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Unable to update promotion."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (item: PromotionItem) => {
    if (!accessToken) return;
    const nextStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await adminFetch(`/admin/promotions/${item._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Unable to update promotion.");

      setFeedback(nextStatus === "ACTIVE" ? "Promotion activated." : "Promotion deactivated.");
      await fetchPromotions();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : "Unable to update promotion."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deletePromotion = async (item: PromotionItem) => {
    if (!accessToken) return;
    const confirmed = await confirm({
      title: "Delete promotion",
      message: `Delete promotion ${item.code}?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await adminFetch(`/admin/promotions/${item._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Unable to delete promotion.");
      }

      setFeedback("Promotion deleted.");
      await fetchPromotions();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete promotion."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Dialog open={createOpen} onOpenChange={(next) => { setCreateOpen(next); if (!next) resetForm(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create promotion</DialogTitle>
            <DialogDescription>Create a discount code and rules.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Promo code</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="SPRING25" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount type</Label>
                <Select value={formDiscountType} onValueChange={(v) => setFormDiscountType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount value</Label>
                <Input value={formDiscountValue} onChange={(e) => setFormDiscountValue(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Min amount (GBP)</Label>
                <Input value={formMinAmount} onChange={(e) => setFormMinAmount(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Usage limit</Label>
                <Input value={formUsageLimit} onChange={(e) => setFormUsageLimit(e.target.value)} inputMode="numeric" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Expiry date</Label>
                <Input type="date" value={formExpiresAt} onChange={(e) => setFormExpiresAt(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30"
              onClick={() => void submitCreate()}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(next) => { setEditOpen(next); if (!next) { setActiveItem(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit promotion</DialogTitle>
            <DialogDescription>Update discount settings.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Promo code</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount type</Label>
                <Select value={formDiscountType} onValueChange={(v) => setFormDiscountType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount value</Label>
                <Input value={formDiscountValue} onChange={(e) => setFormDiscountValue(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Min amount (GBP)</Label>
                <Input value={formMinAmount} onChange={(e) => setFormMinAmount(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Usage limit</Label>
                <Input value={formUsageLimit} onChange={(e) => setFormUsageLimit(e.target.value)} inputMode="numeric" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Expiry date</Label>
                <Input type="date" value={formExpiresAt} onChange={(e) => setFormExpiresAt(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30"
              onClick={() => void submitEdit()}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={(next) => { setDetailsOpen(next); if (!next) setActiveItem(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Promotion details</DialogTitle>
            <DialogDescription>Review this promotion summary.</DialogDescription>
          </DialogHeader>
          {activeItem ? (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Code</span>
                <span className="font-medium text-gray-900">{activeItem.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-gray-900">
                  {activeItem.discountType === "PERCENTAGE"
                    ? `${activeItem.discountValue}%`
                    : `£${activeItem.discountValue}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Min amount</span>
                <span className="font-medium text-gray-900">
                  {activeItem.minAmount > 0 ? `£${activeItem.minAmount}` : "No minimum"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Usage</span>
                <span className="font-medium text-gray-900">
                  {activeItem.usageCount}
                  {activeItem.usageLimit ? ` / ${activeItem.usageLimit}` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Expiry</span>
                <span className="font-medium text-gray-900">{formatDate(activeItem.expiresAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant="secondary" className={getStatusBadge(activeItem.status)}>
                  {activeItem.status}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
              No promotion selected.
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotions & Discounts</h1>
          <p className="text-gray-600 mt-1">Manage discount codes and special offers</p>
        </div>
        <Button
          className="mt-4 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30 md:mt-0"
          onClick={openCreate}
          disabled={submitting}
        >
          <Plus size={20} />
          Create Promotion
        </Button>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Promotions</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <Tag className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activePromotions}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Usage</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsage}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Revenue Impact</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">£0</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Discount</p>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Tag className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avgDiscount}%</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by promotion code..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promo Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={7}>
                    Loading promotions...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={7}>
                    No promotions matched your filters yet.
                  </td>
                </tr>
              ) : (
              items.map((promo) => (
                <tr key={promo._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">{promo.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">
                      {promo.discountType === "PERCENTAGE"
                        ? `${promo.discountValue}%`
                        : `£${promo.discountValue}`}
                    </span>
                    <span className="ml-1 text-xs text-gray-500">
                      ({promo.discountType === "PERCENTAGE" ? "Percentage" : "Fixed"})
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {promo.minAmount > 0 ? `£${promo.minAmount}` : "No minimum"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{promo.usageCount}</span>
                      {promo.usageLimit ? (
                        <span className="text-xs text-gray-500">/ {promo.usageLimit} limit</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(promo.expiresAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className={getStatusBadge(promo.status)}>
                      {promo.status === "ACTIVE"
                        ? "Active"
                        : promo.status === "INACTIVE"
                        ? "Inactive"
                        : promo.status === "EXPIRED"
                        ? "Expired"
                        : promo.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetails(promo)}>
                          <Eye size={16} />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(promo)}>
                          <Edit size={16} />
                          Edit promotion
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setFormCode(`${promo.code}-COPY`);
                            setFormDiscountType(
                              promo.discountType === "FIXED" ? "FIXED" : "PERCENTAGE"
                            );
                            setFormDiscountValue(String(promo.discountValue ?? 0));
                            setFormMinAmount(String(promo.minAmount ?? 0));
                            setFormUsageLimit(
                              promo.usageLimit ? String(promo.usageLimit) : "100"
                            );
                            setFormExpiresAt(promo.expiresAt ? String(promo.expiresAt).slice(0, 10) : "");
                            setFormStatus("INACTIVE");
                            setCreateOpen(true);
                          }}
                        >
                          <Copy size={16} />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => void toggleStatus(promo)}
                          variant="destructive"
                        >
                          <Tag size={16} />
                          {promo.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => void deletePromotion(promo)}
                      variant="destructive"
                    >
                      <span className="text-destructive">Delete</span>
                    </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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