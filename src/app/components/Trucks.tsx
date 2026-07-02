import React, { useEffect, useState } from "react";
import {
  Ban,
  Calendar,
  ChevronDown,
  ChevronUp,
  Gauge,
  MapPin,
  Plus,
  Search,
  Trash2,
  TruckIcon,
  UserX,
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
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

type FleetVehicle = {
  _id: string;
  registration: string;
  make: string | null;
  model: string | null;
  year: number | null;
  status: "ACTIVE" | "INACTIVE" | string;
};

type FleetCompany = {
  _id: string;
  companyName: string;
  companyStatus: string;
  contact: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  counts: {
    totalTrucks: number;
    activeTrucks: number;
  };
  vehicles: FleetVehicle[];
};

type AdminFleetApiResponse = {
  status: string;
  message: string;
  data: {
    items: FleetCompany[];
    stats: {
      totalCompanies: number;
      totalFleet: number;
      activeTrucks: number;
      suspendedCompanies: number;
    };
  };
};

const statusOptions = [
  { label: "All companies", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
];

const getCompanyStatusBadge = (status: string) =>
  status === "SUSPENDED"
    ? "bg-red-100 text-red-700"
    : "bg-green-100 text-green-700";

const getVehicleStatusBadge = (status: string) =>
  status === "ACTIVE"
    ? "bg-green-100 text-green-700"
    : "bg-slate-100 text-slate-700";

const initialsFromName = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const vehicleDisplayTitle = (vehicle: FleetVehicle) => {
  const title = [vehicle.make, vehicle.model].filter(Boolean).join(" ").trim();
  return title || "Fleet vehicle";
};

export function Trucks() {
  const { confirm, prompt } = useAdminDialog();
  const [companies, setCompanies] = useState<FleetCompany[]>([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalFleet: 0,
    activeTrucks: 0,
    suspendedCompanies: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [createCompanyEmail, setCreateCompanyEmail] = useState("");
  const [createCompanyPassword, setCreateCompanyPassword] = useState("");
  const [createCompanyName, setCreateCompanyName] = useState("");
  const [createCompanyContactName, setCreateCompanyContactName] = useState("");
  const [createCompanyContactRole, setCreateCompanyContactRole] = useState("");
  const [createCompanyPhone, setCreateCompanyPhone] = useState("");
  const [createCompanyRegNumber, setCreateCompanyRegNumber] = useState("");
  const [createCompanyVatNumber, setCreateCompanyVatNumber] = useState("");
  const [createCompanyFleetSize, setCreateCompanyFleetSize] = useState("");
  const [createCompanyBillingAddress, setCreateCompanyBillingAddress] =
    useState("");

  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addVehicleCompany, setAddVehicleCompany] =
    useState<FleetCompany | null>(null);
  const [addVehicleRegistration, setAddVehicleRegistration] = useState("");
  const [addVehicleType, setAddVehicleType] = useState("");
  const [addVehicleMake, setAddVehicleMake] = useState("");
  const [addVehicleModel, setAddVehicleModel] = useState("");
  const [addVehicleYear, setAddVehicleYear] = useState("");
  const [addVehicleVin, setAddVehicleVin] = useState("");

  const [vehicleDetailsOpen, setVehicleDetailsOpen] = useState(false);
  const [vehicleDetailsCompany, setVehicleDetailsCompany] =
    useState<FleetCompany | null>(null);
  const [vehicleDetailsVehicle, setVehicleDetailsVehicle] =
    useState<FleetVehicle | null>(null);

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    const seededSearch = sessionStorage.getItem("truckfix_admin_fleet_search");
    if (seededSearch) {
      setSearchTerm(seededSearch);
      sessionStorage.removeItem("truckfix_admin_fleet_search");
    }
  }, []);

  const fetchFleet = async () => {
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
        `${apiBaseUrl}/admin/fleet${params.toString() ? `?${params}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const payload = (await response.json()) as AdminFleetApiResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load fleet companies.");
      }

      setCompanies(payload.data.items || []);
      setStats(
        payload.data.stats || {
          totalCompanies: 0,
          totalFleet: 0,
          activeTrucks: 0,
          suspendedCompanies: 0,
        }
      );
      setExpandedCompanies((current) => {
        const next = current.filter((id) =>
          payload.data.items.some((item) => item._id === id)
        );
        if (next.length > 0) return next;
        if (payload.data.items[0]?._id) return [payload.data.items[0]._id];
        return [];
      });
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load fleet companies."
      );
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchFleet();
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [searchTerm, statusFilter]);

  const toggleCompany = (companyId: string) => {
    setExpandedCompanies((current) =>
      current.includes(companyId)
        ? current.filter((id) => id !== companyId)
        : [...current, companyId]
    );
  };

  const resetCreateCompanyForm = () => {
    setCreateCompanyEmail("");
    setCreateCompanyPassword("");
    setCreateCompanyName("");
    setCreateCompanyContactName("");
    setCreateCompanyContactRole("");
    setCreateCompanyPhone("");
    setCreateCompanyRegNumber("");
    setCreateCompanyVatNumber("");
    setCreateCompanyFleetSize("");
    setCreateCompanyBillingAddress("");
  };

  const handleCreateCompany = async () => {
    if (!accessToken) return;
    const email = createCompanyEmail.trim().toLowerCase();
    const password = createCompanyPassword.trim();
    const companyName = createCompanyName.trim();

    if (!email) {
      setError("Email is required.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }
    if (!companyName) {
      setError("Company name is required.");
      return;
    }

    const contactName = createCompanyContactName.trim();
    const contactRole = createCompanyContactRole.trim();
    const phone = createCompanyPhone.trim();
    const regNumber = createCompanyRegNumber.trim();
    const vatNumber = createCompanyVatNumber.trim();
    const fleetSize = createCompanyFleetSize.trim();
    const billingAddress = createCompanyBillingAddress.trim();

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/admin/fleet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email,
          password,
          companyName,
          contactName,
          contactRole,
          phone,
          regNumber,
          vatNumber,
          fleetSize,
          billingAddress,
        }),
      });

      const payload = (await response.json()) as {
        status: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to create fleet company.");
      }

      setFeedback("Fleet company created successfully.");
      setCreateCompanyOpen(false);
      resetCreateCompanyForm();
      await fetchFleet();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create fleet company."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCompanyStatus = async (
    company: FleetCompany,
    nextStatus: "ACTIVE" | "SUSPENDED"
  ) => {
    if (!accessToken) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/admin/fleet/${company._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json()) as {
        status: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to update fleet company.");
      }

      setFeedback(
        nextStatus === "ACTIVE"
          ? "Fleet company activated."
          : "Fleet company suspended."
      );
      await fetchFleet();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update fleet company."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCompany = async (company: FleetCompany) => {
    if (!accessToken) return;

    const confirmed = await confirm({
      title: "Remove fleet company",
      message: `Remove ${company.companyName}?\n\nThis will delete the fleet company account.\nIt will fail if the company still has linked jobs, vehicles, or members.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/admin/fleet/${company._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to remove fleet company.");
      }

      setFeedback("Fleet company removed.");
      await fetchFleet();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove fleet company."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetAddVehicleForm = () => {
    setAddVehicleRegistration("");
    setAddVehicleType("");
    setAddVehicleMake("");
    setAddVehicleModel("");
    setAddVehicleYear("");
    setAddVehicleVin("");
  };

  const handleAddVehicle = async (company: FleetCompany) => {
    if (!accessToken) return;
    const registration = addVehicleRegistration.trim();
    if (!registration) {
      setError("Vehicle registration is required.");
      return;
    }

    const type = addVehicleType.trim();
    const make = addVehicleMake.trim();
    const model = addVehicleModel.trim();
    const yearRaw = addVehicleYear.trim();
    const vin = addVehicleVin.trim();

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/admin/fleet/${company._id}/vehicles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            registration,
            type,
            make,
            model,
            year: yearRaw ? Number(yearRaw) : undefined,
            vin,
            isActive: true,
          }),
        }
      );

      const payload = (await response.json()) as {
        status: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to add vehicle.");
      }

      setFeedback(`Vehicle added to ${company.companyName}.`);
      setAddVehicleOpen(false);
      setAddVehicleCompany(null);
      resetAddVehicleForm();
      setExpandedCompanies((current) =>
        current.includes(company._id) ? current : [...current, company._id]
      );
      await fetchFleet();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to add vehicle."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVehicle = async (
    company: FleetCompany,
    vehicle: FleetVehicle
  ) => {
    if (!accessToken) return;

    const registrationRaw = await prompt({
      title: "Update vehicle",
      label: "Registration",
      defaultValue: vehicle.registration,
    });
    if (registrationRaw === null) return;
    const registration = registrationRaw.trim() || vehicle.registration;

    const typeRaw = await prompt({
      title: "Update vehicle",
      label: "Vehicle type",
      defaultValue: vehicle.type || "",
    });
    if (typeRaw === null) return;
    const type = typeRaw.trim();

    const makeRaw = await prompt({
      title: "Update vehicle",
      label: "Make",
      defaultValue: vehicle.make || "",
    });
    if (makeRaw === null) return;
    const make = makeRaw.trim() || vehicle.make;

    const modelRaw = await prompt({
      title: "Update vehicle",
      label: "Model",
      defaultValue: vehicle.model || "",
    });
    if (modelRaw === null) return;
    const model = modelRaw.trim() || vehicle.model;

    const yearRawInput = await prompt({
      title: "Update vehicle",
      label: "Year",
      defaultValue: vehicle.year ? String(vehicle.year) : "",
    });
    if (yearRawInput === null) return;
    const yearRaw = yearRawInput.trim();

    const currentActive = vehicle.status === "ACTIVE";
    const keepActive = await confirm({
      title: "Vehicle status",
      message: currentActive
        ? "Keep this vehicle active? Choose Cancel to mark inactive."
        : "Mark this vehicle active? Choose Cancel to keep inactive.",
      confirmLabel: currentActive ? "Keep active" : "Mark active",
      cancelLabel: currentActive ? "Mark inactive" : "Keep inactive",
    });

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/admin/fleet/${company._id}/vehicles/${vehicle._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            registration,
            type,
            make,
            model,
            year: yearRaw ? Number(yearRaw) : undefined,
            isActive: currentActive ? keepActive : keepActive,
          }),
        }
      );

      const payload = (await response.json()) as {
        status: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to update vehicle.");
      }

      setFeedback(`Vehicle ${registration} updated.`);
      await fetchFleet();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update vehicle."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewVehicle = (company: FleetCompany, vehicle: FleetVehicle) => {
    setVehicleDetailsCompany(company);
    setVehicleDetailsVehicle(vehicle);
    setVehicleDetailsOpen(true);
  };

  return (
    <div>
      <Dialog
        open={createCompanyOpen}
        onOpenChange={(nextOpen) => {
          setCreateCompanyOpen(nextOpen);
          if (!nextOpen) resetCreateCompanyForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create fleet company</DialogTitle>
            <DialogDescription>
              Create a new fleet company account and set a temporary password.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <Input
                  value={createCompanyEmail}
                  onChange={(e) => setCreateCompanyEmail(e.target.value)}
                  placeholder="fleet@company.com"
                  inputMode="email"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Temporary password</Label>
                <Input
                  type="password"
                  value={createCompanyPassword}
                  onChange={(e) => setCreateCompanyPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <p className="mb-4 text-sm font-semibold text-gray-900">
                Company details
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Company name</Label>
                  <Input
                    value={createCompanyName}
                    onChange={(e) => setCreateCompanyName(e.target.value)}
                    placeholder="Logistix Transport"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact name</Label>
                  <Input
                    value={createCompanyContactName}
                    onChange={(e) => setCreateCompanyContactName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact role</Label>
                  <Input
                    value={createCompanyContactRole}
                    onChange={(e) => setCreateCompanyContactRole(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={createCompanyPhone}
                    onChange={(e) => setCreateCompanyPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fleet size</Label>
                  <Input
                    value={createCompanyFleetSize}
                    onChange={(e) => setCreateCompanyFleetSize(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registration number</Label>
                  <Input
                    value={createCompanyRegNumber}
                    onChange={(e) => setCreateCompanyRegNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>VAT number</Label>
                  <Input
                    value={createCompanyVatNumber}
                    onChange={(e) => setCreateCompanyVatNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Billing address</Label>
                  <Textarea
                    value={createCompanyBillingAddress}
                    onChange={(e) => setCreateCompanyBillingAddress(e.target.value)}
                    placeholder="Street, city, postcode"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateCompanyOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30"
              onClick={() => void handleCreateCompany()}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addVehicleOpen}
        onOpenChange={(nextOpen) => {
          setAddVehicleOpen(nextOpen);
          if (!nextOpen) {
            setAddVehicleCompany(null);
            resetAddVehicleForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add truck to fleet</DialogTitle>
            <DialogDescription>
              {addVehicleCompany
                ? `Add a vehicle to ${addVehicleCompany.companyName}.`
                : "Add a vehicle to the selected fleet company."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Registration</Label>
                <Input
                  value={addVehicleRegistration}
                  onChange={(e) => setAddVehicleRegistration(e.target.value)}
                  placeholder="ABC123"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  value={addVehicleType}
                  onChange={(e) => setAddVehicleType(e.target.value)}
                  placeholder="Truck / Trailer"
                />
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Input
                  value={addVehicleMake}
                  onChange={(e) => setAddVehicleMake(e.target.value)}
                  placeholder="Volvo"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={addVehicleModel}
                  onChange={(e) => setAddVehicleModel(e.target.value)}
                  placeholder="FH16"
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  value={addVehicleYear}
                  onChange={(e) => setAddVehicleYear(e.target.value)}
                  inputMode="numeric"
                  placeholder="2023"
                />
              </div>
              <div className="space-y-2">
                <Label>VIN (optional)</Label>
                <Input
                  value={addVehicleVin}
                  onChange={(e) => setAddVehicleVin(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddVehicleOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30"
              onClick={() => {
                if (!addVehicleCompany) return;
                void handleAddVehicle(addVehicleCompany);
              }}
              disabled={submitting || !addVehicleCompany}
            >
              {submitting ? "Adding..." : "Add truck"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={vehicleDetailsOpen}
        onOpenChange={(nextOpen) => {
          setVehicleDetailsOpen(nextOpen);
          if (!nextOpen) {
            setVehicleDetailsCompany(null);
            setVehicleDetailsVehicle(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Vehicle details</DialogTitle>
            <DialogDescription>
              View key information for this fleet vehicle.
            </DialogDescription>
          </DialogHeader>

          {vehicleDetailsVehicle && vehicleDetailsCompany ? (
            <div className="grid gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <TruckIcon className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-gray-900">
                        {vehicleDisplayTitle(vehicleDetailsVehicle)}
                      </p>
                      <Badge
                        variant={
                          vehicleDetailsVehicle.status === "ACTIVE"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          vehicleDetailsVehicle.status === "ACTIVE"
                            ? "bg-green-100 text-green-700 border-transparent"
                            : "bg-slate-100 text-slate-700 border-transparent"
                        }
                      >
                        {vehicleDetailsVehicle.status === "ACTIVE"
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Registration:{" "}
                      <span className="font-medium text-gray-900">
                        {vehicleDetailsVehicle.registration}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Company:{" "}
                      <span className="font-medium text-gray-900">
                        {vehicleDetailsCompany.companyName}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs font-medium text-gray-500">Year</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {vehicleDetailsVehicle.year ?? "Not set"}
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs font-medium text-gray-500">Make</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {vehicleDetailsVehicle.make || "Not set"}
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs font-medium text-gray-500">Model</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {vehicleDetailsVehicle.model || "Not set"}
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs font-medium text-gray-500">Status</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {vehicleDetailsVehicle.status === "ACTIVE"
                      ? "Active"
                      : "Inactive"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
              No vehicle selected.
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVehicleDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Fleet Management by Company
          </h1>
          <p className="mt-1 text-gray-600">
            Monitor fleet companies, review active vehicles, and keep truck records
            current
          </p>
        </div>
        <Button
          className="mt-4 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30 md:mt-0"
          onClick={() => setCreateCompanyOpen(true)}
          disabled={submitting}
        >
          <Plus size={20} />
          Add New Company
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

      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by company name, email, phone, or registration..."
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
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Total Companies</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Total Fleet</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalFleet}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Active Trucks</p>
          <p className="text-2xl font-bold text-green-600">{stats.activeTrucks}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Suspended Companies</p>
          <p className="text-2xl font-bold text-red-600">
            {stats.suspendedCompanies}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="rounded-lg bg-white p-10 text-center text-sm text-gray-500 shadow">
            Loading fleet companies...
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-lg bg-white p-10 text-center text-sm text-gray-500 shadow">
            No fleet companies matched this search yet.
          </div>
        ) : (
          companies.map((company) => {
            const isExpanded = expandedCompanies.includes(company._id);

            return (
              <div
                key={company._id}
                className="overflow-hidden rounded-lg bg-white shadow"
              >
                <div
                  className={`cursor-pointer p-6 text-white transition-opacity hover:opacity-95 ${
                    company.companyStatus === "SUSPENDED"
                      ? "bg-slate-700"
                      : "bg-blue-600"
                  }`}
                  onClick={() => toggleCompany(company._id)}
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-700">
                        {initialsFromName(company.companyName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-bold">
                            {company.companyName}
                          </h2>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${getCompanyStatusBadge(
                              company.companyStatus
                            )}`}
                          >
                            {company.companyStatus === "SUSPENDED"
                              ? "Suspended"
                              : "Active"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-blue-100">
                          {company.contact.name || "No contact set"} ·{" "}
                          {company.contact.email || "No email"} ·{" "}
                          {company.contact.phone || "No phone"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold">
                          {company.counts.totalTrucks}
                        </p>
                        <p className="text-sm text-blue-100">Total Trucks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">
                          {company.counts.activeTrucks}
                        </p>
                        <p className="text-sm text-blue-100">Active</p>
                      </div>

                      <div
                        className="flex items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          className="rounded-lg bg-white/20 p-2 transition-colors hover:bg-white/30"
                          title={
                            company.companyStatus === "SUSPENDED"
                              ? "Activate company"
                              : "Suspend company"
                          }
                          onClick={() =>
                            void handleUpdateCompanyStatus(
                              company,
                              company.companyStatus === "SUSPENDED"
                                ? "ACTIVE"
                                : "SUSPENDED"
                            )
                          }
                        >
                          {company.companyStatus === "SUSPENDED" ? (
                            <UserX size={20} />
                          ) : (
                            <Ban size={20} />
                          )}
                        </button>
                        <button
                          className="rounded-lg bg-white/20 p-2 transition-colors hover:bg-white/30 disabled:opacity-60"
                          title="Remove company"
                          onClick={() => void handleRemoveCompany(company)}
                          disabled={submitting}
                        >
                          <Trash2 size={20} />
                        </button>

                        {isExpanded ? (
                          <ChevronUp size={24} />
                        ) : (
                          <ChevronDown size={24} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-gray-50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Fleet Vehicles
                      </h3>
                      <button
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => {
                          setAddVehicleCompany(company);
                          setAddVehicleOpen(true);
                        }}
                        disabled={submitting}
                      >
                        <Plus size={16} />
                        Add Truck to Fleet
                      </button>
                    </div>

                    {company.vehicles.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-gray-500">
                        No vehicles are attached to this fleet yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {company.vehicles.map((vehicle) => (
                          <div
                            key={vehicle._id}
                            className="rounded-lg bg-white shadow transition-shadow hover:shadow-lg"
                          >
                            <div className="p-4">
                              <div className="mb-3 flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="rounded-lg bg-blue-100 p-2">
                                    <TruckIcon className="text-blue-600" size={20} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      {vehicleDisplayTitle(vehicle)}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                      {vehicle.registration}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${getVehicleStatusBadge(
                                    vehicle.status
                                  )}`}
                                >
                                  {vehicle.status === "ACTIVE" ? "Active" : "Inactive"}
                                </span>
                              </div>

                              <div className="mb-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Gauge size={14} />
                                  <span>
                                    {vehicle.year ? `${vehicle.year}` : "Year not set"}
                                  </span>
                                  <span className="text-gray-400">·</span>
                                  <span>{vehicle.make || "Make not set"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <MapPin size={14} />
                                  <span>{company.companyName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Calendar size={14} />
                                  <span>
                                    Type: {vehicle.model || vehicle.make || "Standard"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-b-lg border-t bg-gray-50 px-4 py-2">
                              <button
                                className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                onClick={() => handleViewVehicle(company, vehicle)}
                              >
                                View Details →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
