import { useState } from "react";
import { Search, TruckIcon, Plus, MapPin, Calendar, Gauge, Building2, ChevronDown, ChevronUp, Ban, Trash2, UserX } from "lucide-react";

interface Company {
  id: number;
  name: string;
  logo: string;
  contactPerson: string;
  email: string;
  phone: string;
  activeFleet: number;
  totalFleet: number;
  status: string;
  trucks: Truck[];
}

interface Truck {
  id: number;
  make: string;
  model: string;
  plateNumber: string;
  year: number;
  mileage: string;
  status: string;
  driver: string;
  lastService: string;
  nextService: string;
  location: string;
}

const initialCompanies: Company[] = [
  {
    id: 1,
    name: "Swift Transport Inc.",
    logo: "ST",
    contactPerson: "Robert Johnson",
    email: "contact@swifttransport.com",
    phone: "+1 555 0101",
    activeFleet: 4,
    totalFleet: 5,
    status: "Active",
    trucks: [
      {
        id: 1,
        make: "Volvo",
        model: "FH16",
        plateNumber: "ABC123",
        year: 2022,
        mileage: "145,234 km",
        status: "Active",
        driver: "John Smith",
        lastService: "2026-02-28",
        nextService: "2026-04-28",
        location: "Los Angeles, CA",
      },
      {
        id: 2,
        make: "Scania",
        model: "R500",
        plateNumber: "XYZ789",
        year: 2023,
        mileage: "89,432 km",
        status: "Active",
        driver: "Sarah Williams",
        lastService: "2026-03-05",
        nextService: "2026-05-05",
        location: "San Francisco, CA",
      },
      {
        id: 3,
        make: "MAN",
        model: "TGX",
        plateNumber: "DEF456",
        year: 2021,
        mileage: "203,112 km",
        status: "In Service",
        driver: "David Brown",
        lastService: "2026-03-10",
        nextService: "2026-04-10",
        location: "Service Center A",
      },
      {
        id: 5,
        make: "Volvo",
        model: "FH16",
        plateNumber: "JKL012",
        year: 2022,
        mileage: "156,789 km",
        status: "Active",
        driver: "Michael Wilson",
        lastService: "2026-03-01",
        nextService: "2026-05-01",
        location: "Portland, OR",
      },
      {
        id: 6,
        make: "Scania",
        model: "R500",
        plateNumber: "MNO345",
        year: 2020,
        mileage: "287,654 km",
        status: "Inactive",
        driver: "Unassigned",
        lastService: "2026-01-20",
        nextService: "2026-03-20",
        location: "Depot B",
      },
    ],
  },
  {
    id: 2,
    name: "Nationwide Logistics",
    logo: "NL",
    contactPerson: "Jennifer Martinez",
    email: "info@nationwidelogistics.com",
    phone: "+1 555 0202",
    activeFleet: 3,
    totalFleet: 3,
    status: "Active",
    trucks: [
      {
        id: 7,
        make: "Mercedes",
        model: "Actros",
        plateNumber: "GHI789",
        year: 2023,
        mileage: "67,890 km",
        status: "Active",
        driver: "Emma Davis",
        lastService: "2026-02-15",
        nextService: "2026-04-15",
        location: "Seattle, WA",
      },
      {
        id: 8,
        make: "Volvo",
        model: "FH16",
        plateNumber: "PQR678",
        year: 2024,
        mileage: "34,567 km",
        status: "Active",
        driver: "Tom Anderson",
        lastService: "2026-03-08",
        nextService: "2026-05-08",
        location: "Denver, CO",
      },
      {
        id: 9,
        make: "Scania",
        model: "R450",
        plateNumber: "STU901",
        year: 2023,
        mileage: "98,765 km",
        status: "Active",
        driver: "Lisa Chen",
        lastService: "2026-02-25",
        nextService: "2026-04-25",
        location: "Chicago, IL",
      },
    ],
  },
  {
    id: 3,
    name: "Continental Freight",
    logo: "CF",
    contactPerson: "Marcus Williams",
    email: "support@continentalfreight.com",
    phone: "+1 555 0303",
    activeFleet: 2,
    totalFleet: 4,
    status: "Suspended",
    trucks: [
      {
        id: 10,
        make: "MAN",
        model: "TGS",
        plateNumber: "VWX234",
        year: 2022,
        mileage: "178,432 km",
        status: "Active",
        driver: "Carlos Rodriguez",
        lastService: "2026-03-02",
        nextService: "2026-05-02",
        location: "Houston, TX",
      },
      {
        id: 11,
        make: "Mercedes",
        model: "Arocs",
        plateNumber: "YZA567",
        year: 2021,
        mileage: "234,890 km",
        status: "In Service",
        driver: "James Peterson",
        lastService: "2026-03-12",
        nextService: "2026-04-12",
        location: "Service Center B",
      },
      {
        id: 12,
        make: "Volvo",
        model: "FM",
        plateNumber: "BCD890",
        year: 2023,
        mileage: "56,234 km",
        status: "Active",
        driver: "Sophie Turner",
        lastService: "2026-02-18",
        nextService: "2026-04-18",
        location: "Phoenix, AZ",
      },
      {
        id: 13,
        make: "Scania",
        model: "R500",
        plateNumber: "EFG123",
        year: 2020,
        mileage: "312,456 km",
        status: "Inactive",
        driver: "Unassigned",
        lastService: "2026-01-15",
        nextService: "2026-03-15",
        location: "Depot C",
      },
    ],
  },
];

export function Trucks() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<number[]>([1]);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    companyId: number | null;
    action: "suspend" | "remove" | null;
    companyName: string;
  }>({
    show: false,
    companyId: null,
    action: null,
    companyName: "",
  });

  const handleAddCompany = () => {
    console.log("Add new company clicked");
    alert("Add new company dialog would open here");
  };

  const handleAddTruck = (companyId: number, companyName: string) => {
    console.log(`Add truck to ${companyName} (ID: ${companyId})`);
    alert(`Add truck to ${companyName} dialog would open here`);
  };

  const handleViewTruckDetails = (truck: Truck, companyName: string) => {
    console.log(`View details for ${truck.make} ${truck.model} - ${truck.plateNumber}`);
    alert(`View details for ${truck.make} ${truck.model} (${truck.plateNumber}) from ${companyName}`);
  };

  const toggleCompany = (companyId: number) => {
    if (expandedCompanies.includes(companyId)) {
      setExpandedCompanies(expandedCompanies.filter(id => id !== companyId));
    } else {
      setExpandedCompanies([...expandedCompanies, companyId]);
    }
  };

  const handleSuspendCompany = (companyId: number) => {
    setCompanies(companies.map(company => 
      company.id === companyId 
        ? { ...company, status: company.status === "Suspended" ? "Active" : "Suspended" }
        : company
    ));
    setConfirmModal({ show: false, companyId: null, action: null, companyName: "" });
  };

  const handleRemoveCompany = (companyId: number) => {
    setCompanies(companies.filter(company => company.id !== companyId));
    setExpandedCompanies(expandedCompanies.filter(id => id !== companyId));
    setConfirmModal({ show: false, companyId: null, action: null, companyName: "" });
  };

  const openConfirmModal = (companyId: number, action: "suspend" | "remove", companyName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmModal({ show: true, companyId, action, companyName });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, companyId: null, action: null, companyName: "" });
  };

  const confirmAction = () => {
    if (confirmModal.action === "suspend" && confirmModal.companyId) {
      handleSuspendCompany(confirmModal.companyId);
    } else if (confirmModal.action === "remove" && confirmModal.companyId) {
      handleRemoveCompany(confirmModal.companyId);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    if (selectedCompany && company.id !== selectedCompany) return false;
    
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.trucks.some(truck => 
        truck.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.driver.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return matchesSearch;
  });

  const totalTrucks = companies.reduce((sum, company) => sum + company.totalFleet, 0);
  const totalActive = companies.reduce((sum, company) => 
    sum + company.trucks.filter(t => t.status === "Active").length, 0
  );
  const totalInService = companies.reduce((sum, company) => 
    sum + company.trucks.filter(t => t.status === "In Service").length, 0
  );
  const totalInactive = companies.reduce((sum, company) => 
    sum + company.trucks.filter(t => t.status === "Inactive").length, 0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "In Service":
        return "bg-orange-100 text-orange-800";
      case "Inactive":
      case "Suspended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCompanyStatusColor = (status: string) => {
    return status === "Suspended" 
      ? "bg-red-100 text-red-800" 
      : "bg-green-100 text-green-800";
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management by Company</h1>
          <p className="text-gray-600 mt-1">Monitor fleets organized by company</p>
        </div>
        <button className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleAddCompany}>
          <Plus size={20} />
          Add New Company
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by company name, truck make, model, or plate number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCompany || ""}
            onChange={(e) => setSelectedCompany(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Companies</p>
          <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Fleet</p>
          <p className="text-2xl font-bold text-gray-900">{totalTrucks}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active Trucks</p>
          <p className="text-2xl font-bold text-green-600">{totalActive}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Suspended Companies</p>
          <p className="text-2xl font-bold text-red-600">
            {companies.filter(c => c.status === "Suspended").length}
          </p>
        </div>
      </div>

      {/* Companies List */}
      <div className="space-y-6">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Company Header */}
            <div 
              className={`p-6 ${company.status === "Suspended" ? "bg-gradient-to-r from-gray-500 to-gray-600" : "bg-gradient-to-r from-blue-600 to-blue-700"} text-white cursor-pointer hover:opacity-90 transition-opacity`}
              onClick={() => toggleCompany(company.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white text-blue-600 flex items-center justify-center text-xl font-bold">
                    {company.logo}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold">{company.name}</h2>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCompanyStatusColor(company.status)}`}>
                        {company.status}
                      </span>
                    </div>
                    <p className="text-blue-100 text-sm mt-1">
                      {company.contactPerson} • {company.email} • {company.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{company.totalFleet}</p>
                    <p className="text-blue-100 text-sm">Total Trucks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{company.activeFleet}</p>
                    <p className="text-blue-100 text-sm">Active</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={(e) => openConfirmModal(company.id, "suspend", company.name, e)}
                      title={company.status === "Suspended" ? "Activate Company" : "Suspend Company"}
                    >
                      {company.status === "Suspended" ? (
                        <UserX size={20} />
                      ) : (
                        <Ban size={20} />
                      )}
                    </button>
                    <button 
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={(e) => openConfirmModal(company.id, "remove", company.name, e)}
                      title="Remove Company"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {expandedCompanies.includes(company.id) ? (
                    <ChevronUp size={24} />
                  ) : (
                    <ChevronDown size={24} />
                  )}
                </div>
              </div>
            </div>

            {/* Company Fleet - Expandable */}
            {expandedCompanies.includes(company.id) && (
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Fleet Vehicles</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm" onClick={() => handleAddTruck(company.id, company.name)}>
                    <Plus size={16} />
                    Add Truck to Fleet
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {company.trucks.map((truck) => (
                    <div key={truck.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <TruckIcon className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {truck.make} {truck.model}
                              </h4>
                              <p className="text-xs text-gray-500">{truck.plateNumber}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(truck.status)}`}>
                            {truck.status}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Gauge size={14} />
                            <span>{truck.mileage}</span>
                            <span className="text-gray-400">•</span>
                            <span>{truck.year}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin size={14} />
                            <span>{truck.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar size={14} />
                            <span>Next: {truck.nextService}</span>
                          </div>
                        </div>

                        {/* Driver */}
                        <div className="border-t pt-3">
                          <p className="text-xs text-gray-500 mb-1">Driver</p>
                          <p className="text-sm font-medium text-gray-900">{truck.driver}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t px-4 py-2 bg-gray-50 rounded-b-lg">
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium" onClick={() => handleViewTruckDetails(truck, company.name)}>
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${confirmModal.action === "remove" ? "bg-red-100" : "bg-orange-100"}`}>
                {confirmModal.action === "remove" ? (
                  <Trash2 className="text-red-600" size={24} />
                ) : (
                  <Ban className="text-orange-600" size={24} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmModal.action === "remove" ? "Remove Company" : "Suspend Company"}
                </h3>
                <p className="text-sm text-gray-500">This action requires confirmation</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {confirmModal.action === "remove" 
                ? `Are you sure you want to permanently remove "${confirmModal.companyName}" and all its fleet? This action cannot be undone.`
                : `Are you sure you want to ${companies.find(c => c.id === confirmModal.companyId)?.status === "Suspended" ? "activate" : "suspend"} "${confirmModal.companyName}"?`
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={confirmAction}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                  confirmModal.action === "remove" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {confirmModal.action === "remove" ? "Remove" : companies.find(c => c.id === confirmModal.companyId)?.status === "Suspended" ? "Activate" : "Suspend"}
              </button>
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}