import React, { useEffect, useMemo, useState } from "react";
import {
  Battery,
  CircleDot,
  Clock,
  Copy,
  Disc,
  DollarSign,
  Edit,
  Eye,
  Fuel,
  Key,
  Lock,
  MoreVertical,
  Plus,
  Search,
  Thermometer,
  Trash2,
  Truck,
  Wrench,
  Zap as Lightning,
  ClipboardList,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
import { useAdminDialog } from "../adminDialog";
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
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type ServiceCatalogItem = {
  _id: string;
  name: string;
  category: string;
  description?: string | null;
  basePrice?: number | null;
  currency?: string | null;
  durationLabel?: string | null;
  isActive?: boolean;
  bookingsCount?: number;
  createdAt?: string;
};

type ServiceCatalogApiResponse = {
  status: string;
  message: string;
  data: {
    items: ServiceCatalogItem[];
    stats: {
      totalServices: number;
      avgBasePrice: number;
      totalBookings: number;
      categories: number;
    };
  };
};

export function ServiceCatalog() {
  const { alert } = useAdminDialog();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [stats, setStats] = useState({
    totalServices: 0,
    avgBasePrice: 0,
    totalBookings: 0,
    categories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<ServiceCatalogItem | null>(null);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Roadside");
  const [formBasePrice, setFormBasePrice] = useState("85");
  const [formDuration, setFormDuration] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const getServiceIcon = (iconType: string) => {
    switch (iconType) {
      case "tire":
        return <CircleDot className="text-blue-600" size={24} />;
      case "battery":
        return <Battery className="text-green-600" size={24} />;
      case "key":
        return <Key className="text-yellow-600" size={24} />;
      case "lightning":
        return <Lightning className="text-purple-600" size={24} />;
      case "thermometer":
        return <Thermometer className="text-red-600" size={24} />;
      case "disc":
        return <Disc className="text-red-600" size={24} />;
      case "fuel":
        return <Fuel className="text-orange-600" size={24} />;
      case "truck":
        return <Truck className="text-blue-600" size={24} />;
      case "wrench":
        return <Wrench className="text-gray-600" size={24} />;
      case "lock":
        return <Lock className="text-yellow-600" size={24} />;
      case "clipboard":
        return <ClipboardList className="text-amber-500" size={24} />;
      default:
        return <Wrench className="text-blue-600" size={24} />;
    }
  };

  const getIconBackground = (iconType: string) => {
    switch (iconType) {
      case "tire":
        return "bg-blue-100";
      case "battery":
        return "bg-green-100";
      case "key":
        return "bg-yellow-100";
      case "lightning":
        return "bg-purple-100";
      case "thermometer":
        return "bg-red-100";
      case "disc":
        return "bg-red-100";
      case "fuel":
        return "bg-orange-100";
      case "truck":
        return "bg-blue-100";
      case "wrench":
        return "bg-gray-100";
      case "lock":
        return "bg-yellow-100";
      case "clipboard":
        return "bg-amber-100";
      default:
        return "bg-blue-100";
    }
  };

  const categoryOptions = useMemo(
    () => [
      "Roadside",
      "Electrical",
      "Engine",
      "Emergency",
      "Cooling",
      "Brakes",
      "Fuel",
      "Recovery",
      "Diagnostics",
      "Other",
    ],
    []
  );

  const iconTypeForCategory = (category: string) => {
    const normalized = category.trim().toLowerCase();
    if (normalized.includes("road")) return "tire";
    if (normalized.includes("elect")) return "battery";
    if (normalized.includes("engine")) return "key";
    if (normalized.includes("cool")) return "thermometer";
    if (normalized.includes("brake")) return "disc";
    if (normalized.includes("fuel")) return "fuel";
    if (normalized.includes("recover")) return "truck";
    if (normalized.includes("diagnos")) return "wrench";
    if (normalized.includes("emergen")) return "lightning";
    if (normalized.includes("lock")) return "lock";
    return "clipboard";
  };

  const fetchCatalog = async () => {
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
      if (categoryFilter !== "All") params.set("category", categoryFilter);

      const response = await fetch(
        `${apiBaseUrl}/admin/service-catalog${
          params.toString() ? `?${params}` : ""
        }`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const payload = (await response.json()) as ServiceCatalogApiResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load service catalog.");
      }

      setItems(payload.data.items || []);
      setStats(
        payload.data.stats || {
          totalServices: 0,
          avgBasePrice: 0,
          totalBookings: 0,
          categories: 0,
        }
      );
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load service catalog."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchCatalog();
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [searchTerm, categoryFilter]);

  const resetForm = () => {
    setFormName("");
    setFormCategory("Roadside");
    setFormBasePrice("85");
    setFormDuration("");
    setFormDescription("");
    setFormIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (item: ServiceCatalogItem) => {
    setEditItem(item);
    setFormName(item.name || "");
    setFormCategory(item.category || "Roadside");
    setFormBasePrice(
      item.basePrice !== null && item.basePrice !== undefined
        ? String(item.basePrice)
        : "0"
    );
    setFormDuration(item.durationLabel || "");
    setFormDescription(item.description || "");
    setFormIsActive(item.isActive ?? true);
    setEditOpen(true);
  };

  const submitCreate = async () => {
    if (!accessToken) return;
    const name = formName.trim();
    const category = formCategory.trim();
    const basePrice = Number(formBasePrice);
    if (!name) return setError("Service name is required.");
    if (!category) return setError("Category is required.");
    if (!Number.isFinite(basePrice) || basePrice < 0)
      return setError("Base price must be a valid number.");

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/admin/service-catalog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          category,
          description: formDescription.trim(),
          basePrice,
          currency: "GBP",
          durationLabel: formDuration.trim(),
          isActive: formIsActive,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Unable to create service.");
      }

      setFeedback("Service created successfully.");
      setCreateOpen(false);
      resetForm();
      await fetchCatalog();
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Unable to create service."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!accessToken || !editItem?._id) return;
    const name = formName.trim();
    const category = formCategory.trim();
    const basePrice = Number(formBasePrice);
    if (!name) return setError("Service name is required.");
    if (!category) return setError("Category is required.");
    if (!Number.isFinite(basePrice) || basePrice < 0)
      return setError("Base price must be a valid number.");

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/admin/service-catalog/${editItem._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name,
            category,
            description: formDescription.trim(),
            basePrice,
            durationLabel: formDuration.trim(),
            isActive: formIsActive,
          }),
        }
      );

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Unable to update service.");
      }

      setFeedback("Service updated successfully.");
      setEditOpen(false);
      setEditItem(null);
      resetForm();
      await fetchCatalog();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Unable to update service."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item: ServiceCatalogItem) => {
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch(
        `${apiBaseUrl}/admin/service-catalog/${item._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ isActive: !(item.isActive ?? true) }),
        }
      );
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Unable to update service.");
      }
      setFeedback(
        (item.isActive ?? true) ? "Service disabled." : "Service enabled."
      );
      await fetchCatalog();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : "Unable to update service."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Dialog
        open={createOpen}
        onOpenChange={(nextOpen) => {
          setCreateOpen(nextOpen);
          if (!nextOpen) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add new service</DialogTitle>
            <DialogDescription>
              Create a new service type and base pricing for bookings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Service name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base price (GBP)</Label>
                <Input
                  value={formBasePrice}
                  onChange={(e) => setFormBasePrice(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="e.g. 30-45 min"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description shown to users"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-white p-4 sm:col-span-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Active</p>
                  <p className="text-xs text-gray-500">
                    Inactive services won’t be bookable.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormIsActive((v) => !v)}
                >
                  {formIsActive ? "Enabled" : "Disabled"}
                </Button>
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
              {submitting ? "Creating..." : "Create service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          setEditOpen(nextOpen);
          if (!nextOpen) {
            setEditItem(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
            <DialogDescription>Update details and pricing.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Service name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base price (GBP)</Label>
                <Input
                  value={formBasePrice}
                  onChange={(e) => setFormBasePrice(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-white p-4 sm:col-span-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Active</p>
                  <p className="text-xs text-gray-500">
                    Inactive services won’t be bookable.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormIsActive((v) => !v)}
                >
                  {formIsActive ? "Enabled" : "Disabled"}
                </Button>
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

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Catalog</h1>
          <p className="text-gray-600 mt-1">Manage service types and base pricing</p>
        </div>
        <Button
          className="mt-4 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30 md:mt-0"
          onClick={openCreate}
          disabled={submitting}
        >
          <Plus size={20} />
          Add New Service
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
            <p className="text-sm text-gray-600">Total Services</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalServices}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Base Price</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            £{Math.round(stats.avgBasePrice)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Categories</p>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.categories}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full rounded-lg bg-white p-10 text-center text-sm text-gray-500 shadow">
            Loading services...
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full rounded-lg bg-white p-10 text-center text-sm text-gray-500 shadow">
            No services matched your filters yet.
          </div>
        ) : (
          items.map((service) => {
            const iconType = iconTypeForCategory(service.category);
            return (
          <div key={service._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 ${getIconBackground(iconType)} rounded-lg`}>
                    {getServiceIcon(iconType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <span className="text-xs text-gray-500">{service.category}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        void alert({
                          title: service.name,
                          message: service.description || "No description.",
                        })
                      }
                    >
                      <Eye size={16} />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(service)}>
                      <Edit size={16} />
                      Edit service
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setFormName(`${service.name} (copy)`);
                        setFormCategory(service.category);
                        setFormBasePrice(String(service.basePrice ?? 0));
                        setFormDuration(service.durationLabel || "");
                        setFormDescription(service.description || "");
                        setFormIsActive(service.isActive ?? true);
                        setCreateOpen(true);
                      }}
                    >
                      <Copy size={16} />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => void toggleActive(service)}
                      variant="destructive"
                    >
                      <Trash2 size={16} />
                      {service.isActive ?? true ? "Disable" : "Enable"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-gray-600 mb-4">{service.description}</p>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Base Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    £{Math.round(Number(service.basePrice ?? 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {service.durationLabel || "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <Badge
                  variant="secondary"
                  className={
                    (service.isActive ?? true)
                      ? "bg-green-100 text-green-800 border-transparent"
                      : "bg-slate-100 text-slate-700 border-transparent"
                  }
                >
                  {(service.isActive ?? true) ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-gray-500">
                  {service.bookingsCount ?? 0} bookings
                </span>
              </div>
            </div>
          </div>
          );
        })
        )}
      </div>
    </div>
  );
}