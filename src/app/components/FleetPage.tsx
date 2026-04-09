import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gauge,
  LoaderCircle,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  TruckIcon,
  X,
} from "lucide-react";
import { getAdminAccessToken, getApiBaseUrl } from "../lib/auth";

type FleetTruck = {
  _id?: string;
  id?: string;
  make?: string;
  model?: string;
  plateNumber?: string;
  year?: number | string;
  mileage?: string | number;
  status?: string;
  driver?: string;
  lastService?: string;
  nextService?: string;
  location?: string;
};

type FleetCompany = {
  _id?: string;
  id?: string;
  name?: string;
  logo?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  activeFleet?: number;
  totalFleet?: number;
  status?: string;
  trucks?: FleetTruck[];
};

type FleetStats = {
  totalCompanies: number;
  totalFleet: number;
  activeTrucks: number;
  suspendedCompanies: number;
};

type FleetMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type CompanyForm = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
};

type TruckForm = {
  make: string;
  model: string;
  plateNumber: string;
  year: string;
  mileage: string;
  status: string;
  driver: string;
  location: string;
  lastService: string;
  nextService: string;
};

const emptyStats: FleetStats = {
  totalCompanies: 0,
  totalFleet: 0,
  activeTrucks: 0,
  suspendedCompanies: 0,
};

const emptyMeta: FleetMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const emptyCompanyForm: CompanyForm = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
};

const emptyTruckForm: TruckForm = {
  make: "",
  model: "",
  plateNumber: "",
  year: "",
  mileage: "",
  status: "ACTIVE",
  driver: "",
  location: "",
  lastService: "",
  nextService: "",
};

function getId<T extends { _id?: string; id?: string }>(item: T) {
  return item._id || item.id || "";
}

function titleCase(value?: string, fallback = "Unknown") {
  if (!value) {
    return fallback;
  }

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatMileage(value?: string | number) {
  if (value === undefined || value === null || value === "") {
    return "N/A";
  }

  if (typeof value === "number") {
    return `${new Intl.NumberFormat("en-GB").format(value)} km`;
  }

  return value;
}

function companyInitials(name?: string) {
  if (!name) {
    return "TF";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function truckStatusClass(status?: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "IN_SERVICE":
      return "bg-orange-100 text-orange-700";
    case "INACTIVE":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function companyStatusClass(status?: string) {
  return status === "SUSPENDED"
    ? "bg-red-100 text-red-700"
    : "bg-green-100 text-green-700";
}

async function fleetRequest(path: string, options: RequestInit = {}) {
  const token = getAdminAccessToken();

  if (!token) {
    throw new Error("Admin access token not found in localStorage.");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.error || `Request failed with status ${response.status}`,
    );
  }

  return payload;
}

function normalizeTruck(item: any): FleetTruck {
  return {
    _id: item?._id,
    id: item?.id,
    make: item?.make,
    model: item?.model,
    plateNumber: item?.plateNumber ?? item?.plate_number,
    year: item?.year,
    mileage: item?.mileage,
    status: item?.status,
    driver: item?.driver ?? item?.driverName,
    lastService: item?.lastService ?? item?.last_service,
    nextService: item?.nextService ?? item?.next_service,
    location: item?.location,
  };
}

function normalizeCompany(item: any): FleetCompany {
  const embeddedTrucks = Array.isArray(item?.trucks)
    ? item.trucks.map(normalizeTruck)
    : Array.isArray(item?.fleet)
    ? item.fleet.map(normalizeTruck)
    : [];

  return {
    _id: item?._id,
    id: item?.id,
    name: item?.name ?? item?.companyName,
    logo: item?.logo,
    contactPerson: item?.contactPerson ?? item?.contact_person,
    email: item?.email,
    phone: item?.phone,
    activeFleet: item?.activeFleet ?? item?.active_fleet ?? item?.activeTrucks,
    totalFleet: item?.totalFleet ?? item?.total_fleet ?? item?.totalTrucks,
    status: item?.status,
    trucks: embeddedTrucks,
  };
}

export function FleetPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [companies, setCompanies] = useState<FleetCompany[]>([]);
  const [stats, setStats] = useState<FleetStats>(emptyStats);
  const [meta, setMeta] = useState<FleetMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [companyTrucks, setCompanyTrucks] = useState<Record<string, FleetTruck[]>>({});
  const [companyLoading, setCompanyLoading] = useState<Record<string, boolean>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<FleetCompany | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm);
  const [truckModalCompany, setTruckModalCompany] = useState<FleetCompany | null>(null);
  const [truckForm, setTruckForm] = useState<TruckForm>(emptyTruckForm);
  const [viewer, setViewer] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        id: getId(company),
        name: company.name || "Unnamed Company",
      })),
    [companies],
  );

  const fetchFleet = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (searchTerm) params.set("search", searchTerm);
      if (selectedCompany) params.set("companyId", selectedCompany);

      const payload = await fleetRequest(`/admin/fleet?${params.toString()}`);
      const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.data?.companies)
        ? payload.data.companies
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

      const normalizedCompanies = items.map(normalizeCompany);
      setCompanies(normalizedCompanies);
      setMeta({
        page: payload?.meta?.page ?? page,
        limit: payload?.meta?.limit ?? limit,
        total: payload?.meta?.total ?? normalizedCompanies.length,
        totalPages: payload?.meta?.totalPages ?? 1,
      });

      const embeddedStats = payload?.data?.stats;
      const computedStats = normalizedCompanies.reduce(
        (accumulator, company) => {
          const trucks = company.trucks || [];
          const totalFleet =
            Number(company.totalFleet ?? trucks.length) || trucks.length;
          const activeFleet =
            Number(
              company.activeFleet ??
                trucks.filter((truck) => truck.status === "ACTIVE").length,
            ) || trucks.filter((truck) => truck.status === "ACTIVE").length;

          accumulator.totalCompanies += 1;
          accumulator.totalFleet += totalFleet;
          accumulator.activeTrucks += activeFleet;
          if (company.status === "SUSPENDED") {
            accumulator.suspendedCompanies += 1;
          }
          return accumulator;
        },
        { ...emptyStats },
      );

      setStats({
        totalCompanies: embeddedStats?.totalCompanies ?? computedStats.totalCompanies,
        totalFleet: embeddedStats?.totalFleet ?? computedStats.totalFleet,
        activeTrucks: embeddedStats?.activeTrucks ?? computedStats.activeTrucks,
        suspendedCompanies:
          embeddedStats?.suspendedCompanies ?? computedStats.suspendedCompanies,
      });

      const nextTruckMap: Record<string, FleetTruck[]> = {};
      normalizedCompanies.forEach((company) => {
        const companyId = getId(company);
        if ((company.trucks || []).length > 0) {
          nextTruckMap[companyId] = company.trucks || [];
        }
      });
      setCompanyTrucks((current) => ({ ...current, ...nextTruckMap }));
    } catch (error) {
      setCompanies([]);
      setStats(emptyStats);
      setMeta(emptyMeta);
      setErrorMessage(error instanceof Error ? error.message : "Unable to load fleet.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, [searchTerm, selectedCompany, page, limit]);

  const loadCompanyFleet = async (company: FleetCompany, force = false) => {
    const companyId = getId(company);
    if (!companyId || (!force && companyTrucks[companyId])) return;

    setCompanyLoading((current) => ({ ...current, [companyId]: true }));
    try {
      const payload = await fleetRequest(`/admin/companies/${companyId}/fleet`);
      const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.data?.trucks)
        ? payload.data.trucks
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setCompanyTrucks((current) => ({
        ...current,
        [companyId]: items.map(normalizeTruck),
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load company fleet.",
      );
    } finally {
      setCompanyLoading((current) => ({ ...current, [companyId]: false }));
    }
  };

  const toggleCompany = async (company: FleetCompany) => {
    const companyId = getId(company);
    const nextExpanded = !expanded[companyId];
    setExpanded((current) => ({ ...current, [companyId]: nextExpanded }));
    if (nextExpanded) {
      await loadCompanyFleet(company);
    }
  };

  const openCreateCompany = () => {
    setEditingCompany(null);
    setCompanyForm(emptyCompanyForm);
    setCompanyModalOpen(true);
  };

  const openEditCompany = (company: FleetCompany) => {
    setEditingCompany(company);
    setCompanyForm({
      name: company.name || "",
      contactPerson: company.contactPerson || "",
      email: company.email || "",
      phone: company.phone || "",
    });
    setCompanyModalOpen(true);
    setOpenMenu(null);
  };

  const submitCompany = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const path = editingCompany
        ? `/admin/companies/${getId(editingCompany)}`
        : "/admin/companies";
      const method = editingCompany ? "PATCH" : "POST";
      await fleetRequest(path, { method, body: JSON.stringify(companyForm) });
      setSuccessMessage(
        editingCompany ? "Company updated successfully." : "Company created successfully.",
      );
      setCompanyModalOpen(false);
      await fetchFleet();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save company.");
    }
  };

  const openAddTruck = (company: FleetCompany) => {
    setTruckModalCompany(company);
    setTruckForm(emptyTruckForm);
    setOpenMenu(null);
  };

  const submitTruck = async () => {
    if (!truckModalCompany) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await fleetRequest(`/admin/companies/${getId(truckModalCompany)}/fleet`, {
        method: "POST",
        body: JSON.stringify(truckForm),
      });
      setSuccessMessage("Truck added to fleet successfully.");
      setTruckModalCompany(null);
      await loadCompanyFleet(truckModalCompany, true);
      await fetchFleet();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add truck.");
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

  const viewTruckDetails = async (truck: FleetTruck) => {
    await withBusy(getId(truck), async () => {
      const payload = await fleetRequest(`/admin/fleet/${getId(truck)}`);
      setViewer({ title: "Truck Details", body: JSON.stringify(payload, null, 2) });
    });
  };

  const editTruck = async (truck: FleetTruck, company: FleetCompany) => {
    const nextLocation = window.prompt("Update truck location:", truck.location || "");
    if (nextLocation === null) return;

    await withBusy(getId(truck), async () => {
      await fleetRequest(`/admin/fleet/${getId(truck)}`, {
        method: "PATCH",
        body: JSON.stringify({
          location: nextLocation,
          driver: truck.driver,
          lastService: truck.lastService,
          nextService: truck.nextService,
        }),
      });
      setSuccessMessage("Truck updated successfully.");
      await loadCompanyFleet(company, true);
      await fetchFleet();
    });
  };

  const updateCompanyStatus = async (company: FleetCompany) => {
    const nextStatus = company.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    await withBusy(getId(company), async () => {
      await fleetRequest(`/admin/companies/${getId(company)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setSuccessMessage(`Company status updated to ${titleCase(nextStatus)}.`);
      setOpenMenu(null);
      await fetchFleet();
    });
  };

  const removeCompany = async (company: FleetCompany) => {
    if (!window.confirm(`Remove ${company.name || "this company"}?`)) return;

    await withBusy(getId(company), async () => {
      await fleetRequest(`/admin/companies/${getId(company)}`, { method: "DELETE" });
      setSuccessMessage("Company removed successfully.");
      setOpenMenu(null);
      await fetchFleet();
    });
  };

  const updateTruckStatus = async (truck: FleetTruck, company: FleetCompany) => {
    const nextStatus =
      truck.status === "ACTIVE"
        ? "IN_SERVICE"
        : truck.status === "IN_SERVICE"
        ? "INACTIVE"
        : "ACTIVE";

    await withBusy(getId(truck), async () => {
      await fleetRequest(`/admin/fleet/${getId(truck)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setSuccessMessage(`Truck status updated to ${titleCase(nextStatus)}.`);
      await loadCompanyFleet(company, true);
      await fetchFleet();
    });
  };

  const removeTruck = async (truck: FleetTruck, company: FleetCompany) => {
    if (!window.confirm(`Remove ${truck.make || "this truck"} ${truck.model || ""}?`)) return;

    await withBusy(getId(truck), async () => {
      await fleetRequest(`/admin/fleet/${getId(truck)}`, { method: "DELETE" });
      setSuccessMessage("Truck removed successfully.");
      await loadCompanyFleet(company, true);
      await fetchFleet();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fleet Management by Company</h1>
          <p className="mt-2 text-base text-slate-600">Monitor fleets organized by company</p>
        </div>

        <button
          type="button"
          onClick={openCreateCompany}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add New Company
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by company name, truck make, model, or plate number..."
              className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            />
          </label>

          <select
            value={selectedCompany}
            onChange={(event) => {
              setSelectedCompany(event.target.value);
              setPage(1);
            }}
            className="h-14 min-w-56 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500"
          >
            <option value="">All Companies</option>
            {companyOptions.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Companies", value: stats.totalCompanies, tone: "text-slate-900" },
          { label: "Total Fleet", value: stats.totalFleet, tone: "text-slate-900" },
          { label: "Active Trucks", value: stats.activeTrucks, tone: "text-green-600" },
          { label: "Suspended Companies", value: stats.suspendedCompanies, tone: "text-red-600" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm"
          >
            <p className="text-sm text-slate-600">{card.label}</p>
            <p className={`mt-3 text-4xl font-bold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </section>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading fleet data...
          </div>
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <TruckIcon className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-xl font-semibold text-slate-900">No fleet data found</h2>
          <p className="mt-2 text-sm text-slate-500">
            Try adjusting your search or create a new company to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {companies.map((company) => {
            const companyId = getId(company);
            const isExpanded = Boolean(expanded[companyId]);
            const trucks = companyTrucks[companyId] ?? company.trucks ?? [];
            const isCompanyBusy = busyId === companyId;
            const companyGradient =
              company.status === "SUSPENDED"
                ? "from-slate-500 to-slate-600"
                : "from-blue-600 to-blue-700";

            return (
              <section
                key={companyId}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
              >
                <div
                  className={`bg-gradient-to-r ${companyGradient} px-6 py-6 text-white`}
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-blue-600">
                        {companyInitials(company.name)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-3xl font-bold">
                            {company.name || "Unnamed Company"}
                          </h2>
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${companyStatusClass(
                              company.status,
                            )}`}
                          >
                            {titleCase(company.status, "Active")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-blue-50">
                          {[company.contactPerson, company.email, company.phone]
                            .filter(Boolean)
                            .join(" • ") || "No company contact details available"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                      <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                        <p className="text-4xl font-bold">
                          {company.totalFleet ?? trucks.length ?? 0}
                        </p>
                        <p className="text-sm text-blue-50">Total Trucks</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                        <p className="text-4xl font-bold">
                          {company.activeFleet ??
                            trucks.filter((truck) => truck.status === "ACTIVE").length}
                        </p>
                        <p className="text-sm text-blue-50">Active</p>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu((current) => (current === companyId ? null : companyId))
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 transition hover:bg-slate-100"
                        >
                          {isCompanyBusy ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-5 w-5" />
                          )}
                        </button>

                        {openMenu === companyId ? (
                          <div className="absolute right-0 top-12 z-20 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                            <button
                              type="button"
                              onClick={() =>
                                setViewer({
                                  title: company.name || "Company Profile",
                                  body: JSON.stringify(company, null, 2),
                                })
                              }
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              View Company Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCompany(company)}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit Company Details
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await loadCompanyFleet(company, true);
                                setExpanded((current) => ({ ...current, [companyId]: true }));
                                setOpenMenu(null);
                              }}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              View Fleet
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const payload = await fleetRequest(
                                  `/admin/fleet?companyId=${companyId}&page=1&limit=100`,
                                );
                                setViewer({
                                  title: `${company.name || "Company"} Fleet`,
                                  body: JSON.stringify(payload, null, 2),
                                });
                                setOpenMenu(null);
                              }}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              Manage Members
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await withBusy(companyId, async () => {
                                  await fleetRequest(`/admin/companies/${companyId}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ resetPassword: true }),
                                  });
                                  setSuccessMessage("Reset password action sent.");
                                  setOpenMenu(null);
                                });
                              }}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              Reset Password
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setViewer({
                                  title: `${company.name || "Company"} Activity History`,
                                  body: JSON.stringify(company, null, 2),
                                })
                              }
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              View Activity History
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const message = window.prompt("Message to company:");
                                if (message === null || !message.trim()) return;
                                withBusy(companyId, async () => {
                                  await fleetRequest(`/admin/companies/${companyId}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ message }),
                                  });
                                  setSuccessMessage("Message action sent.");
                                  setOpenMenu(null);
                                });
                              }}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              Send Message
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCompanyStatus(company)}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-orange-600 transition hover:bg-orange-50"
                            >
                              {company.status === "SUSPENDED"
                                ? "Activate Company"
                                : "Suspend Company"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCompany(company)}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                            >
                              Remove Company
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCompany(company)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 transition hover:bg-slate-100"
                      >
                        <ChevronDown
                          className={`h-5 w-5 transition ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="space-y-6 px-6 py-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-3xl font-bold text-slate-900">Fleet Vehicles</h3>
                      <button
                        type="button"
                        onClick={() => openAddTruck(company)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Truck to Fleet
                      </button>
                    </div>

                    {companyLoading[companyId] ? (
                      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3 text-slate-600">
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Loading company fleet...
                        </div>
                      </div>
                    ) : trucks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                        No trucks found for this company yet.
                      </div>
                    ) : (
                      <div className="grid gap-5 xl:grid-cols-3">
                        {trucks.map((truck) => {
                          const truckId = getId(truck);
                          return (
                            <article
                              key={truckId}
                              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-4 px-5 py-5">
                                <div className="flex items-start gap-4">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    <TruckIcon className="h-6 w-6" />
                                  </div>

                                  <div>
                                    <h4 className="text-2xl font-bold text-slate-900">
                                      {[truck.make, truck.model].filter(Boolean).join(" ") ||
                                        "Unnamed Truck"}
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                      {truck.plateNumber || "No plate number"}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`rounded-full px-3 py-1 text-sm font-semibold ${truckStatusClass(
                                    truck.status,
                                  )}`}
                                >
                                  {titleCase(truck.status, "Unknown")}
                                </span>
                              </div>

                              <div className="space-y-3 px-5 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Gauge className="h-4 w-4" />
                                  <span>{formatMileage(truck.mileage)}</span>
                                  <span>•</span>
                                  <span>{truck.year || "N/A"}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{truck.location || "Unknown location"}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Next: {formatDate(truck.nextService)}</span>
                                </div>
                              </div>

                              <div className="mt-4 border-t border-slate-200 px-5 py-4">
                                <p className="text-sm text-slate-500">Driver</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">
                                  {truck.driver || "Unassigned"}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 border-t border-slate-200 px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() => viewTruckDetails(truck)}
                                  className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
                                >
                                  View Details →
                                </button>
                                <button
                                  type="button"
                                  onClick={() => editTruck(truck, company)}
                                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateTruckStatus(truck, company)}
                                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                >
                                  Change Status
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeTruck(truck, company)}
                                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                >
                                  Remove
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          Page {meta.page} of {meta.totalPages} • {meta.total} total records
        </div>

        <div className="flex items-center gap-3">
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() =>
              setPage((current) => Math.min(meta.totalPages || 1, current + 1))
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {companyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingCompany ? "Edit Company" : "Add New Company"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingCompany
                    ? "Update company details below."
                    : "Create a new fleet company."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompanyModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={companyForm.name}
                onChange={(event) =>
                  setCompanyForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Company name"
                className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-500"
              />
              <input
                value={companyForm.contactPerson}
                onChange={(event) =>
                  setCompanyForm((current) => ({
                    ...current,
                    contactPerson: event.target.value,
                  }))
                }
                placeholder="Contact person"
                className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-500"
              />
              <input
                value={companyForm.email}
                onChange={(event) =>
                  setCompanyForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="Email address"
                className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-500"
              />
              <input
                value={companyForm.phone}
                onChange={(event) =>
                  setCompanyForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="Phone number"
                className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCompanyModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCompany}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {editingCompany ? "Save Changes" : "Create Company"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {truckModalCompany ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Add Truck to Fleet</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a truck for {truckModalCompany.name || "this company"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTruckModalCompany(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["make", "Make"],
                ["model", "Model"],
                ["plateNumber", "Plate number"],
                ["year", "Year"],
                ["mileage", "Mileage"],
                ["driver", "Driver"],
                ["location", "Location"],
                ["lastService", "Last service date"],
                ["nextService", "Next service date"],
              ].map(([key, label]) => (
                <input
                  key={key}
                  value={truckForm[key as keyof TruckForm]}
                  onChange={(event) =>
                    setTruckForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={label}
                  className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-500"
                />
              ))}

              <select
                value={truckForm.status}
                onChange={(event) =>
                  setTruckForm((current) => ({ ...current, status: event.target.value }))
                }
                className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="IN_SERVICE">In Service</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTruckModalCompany(null)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitTruck}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Add Truck
              </button>
            </div>
          </div>
        </div>
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
