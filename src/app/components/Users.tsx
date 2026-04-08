import { useState } from "react";
import { Search, UserPlus, MoreVertical, Mail, Phone, Shield, Ban, Trash2, UserX, Eye, Edit, Key, MessageSquare, ClipboardList, History, UserCog, ChevronDown, ChevronRight, Building2, Users as UsersIcon } from "lucide-react";
import React from "react";

const companies = [
  {
    id: 1,
    name: "Swift Logistics",
    email: "contact@swiftlogistics.com",
    phone: "+1 234 567 8900",
    role: "Company",
    status: "Active",
    joinDate: "2024-09-15",
    totalFleet: 25,
    mechanics: [
      { id: 101, name: "Mike Johnson", email: "mike.j@swiftlogistics.com", phone: "+1 234 567 8903", role: "Technician", status: "Active", joinDate: "2024-11-10", completedJobs: 89 },
      { id: 102, name: "Sarah Davis", email: "sarah.d@swiftlogistics.com", phone: "+1 234 567 8906", role: "Technician", status: "Active", joinDate: "2024-12-01", completedJobs: 67 },
      { id: 103, name: "Tom Wilson", email: "tom.w@swiftlogistics.com", phone: "+1 234 567 8909", role: "Driver", status: "Active", joinDate: "2024-10-20", totalTrips: 234 },
      { id: 104, name: "Emma Brown", email: "emma.b@swiftlogistics.com", phone: "+1 234 567 8912", role: "Driver", status: "Active", joinDate: "2024-11-05", totalTrips: 189 },
    ]
  },
  {
    id: 2,
    name: "Fast Freight Co",
    email: "info@fastfreight.com",
    phone: "+1 234 567 8901",
    role: "Company",
    status: "Active",
    joinDate: "2024-10-20",
    totalFleet: 18,
    mechanics: [
      { id: 201, name: "Lisa Anderson", email: "lisa.a@fastfreight.com", phone: "+1 234 567 8904", role: "Technician", status: "Active", joinDate: "2024-12-05", completedJobs: 78 },
      { id: 202, name: "James Miller", email: "james.m@fastfreight.com", phone: "+1 234 567 8907", role: "Driver", status: "Active", joinDate: "2024-11-15", totalTrips: 156 },
    ]
  },
  {
    id: 3,
    name: "Global Transport",
    email: "contact@globaltransport.com",
    phone: "+1 234 567 8902",
    role: "Company",
    status: "Active",
    joinDate: "2024-11-01",
    totalFleet: 32,
    mechanics: [
      { id: 301, name: "Robert Garcia", email: "robert.g@globaltransport.com", phone: "+1 234 567 8908", role: "Technician", status: "Active", joinDate: "2024-11-10", completedJobs: 54 },
      { id: 302, name: "Jennifer Lee", email: "jennifer.l@globaltransport.com", phone: "+1 234 567 8910", role: "Technician", status: "Suspended", joinDate: "2024-12-01", completedJobs: 32 },
      { id: 303, name: "David Martinez", email: "david.m@globaltransport.com", phone: "+1 234 567 8911", role: "Driver", status: "Active", joinDate: "2024-10-15", totalTrips: 278 },
    ]
  },
  {
    id: 4,
    name: "City Movers",
    email: "admin@citymovers.com",
    phone: "+1 234 567 8905",
    role: "Company",
    status: "Suspended",
    joinDate: "2025-01-10",
    totalFleet: 12,
    mechanics: [
      { id: 401, name: "Kevin White", email: "kevin.w@citymovers.com", phone: "+1 234 567 8913", role: "Technician", status: "Active", joinDate: "2025-01-12", completedJobs: 23 },
    ]
  },
];

// Independent users not part of any company
const independentUsers = [
  { id: 501, name: "Alex Turner", email: "alex.turner@independent.com", phone: "+1 234 567 8920", role: "Technician", status: "Active", joinDate: "2025-02-01", completedJobs: 12 },
  { id: 502, name: "Maria Rodriguez", email: "maria.r@independent.com", phone: "+1 234 567 8921", role: "Driver", status: "Active", joinDate: "2025-01-20", totalTrips: 45 },
];

export function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [expandedCompanies, setExpandedCompanies] = useState<number[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    userId: string | null;
    action: "suspend" | "remove" | null;
    userName: string;
    isCompany: boolean;
  }>({
    show: false,
    userId: null,
    action: null,
    userName: "",
    isCompany: false,
  });

  const toggleCompany = (companyId: number) => {
    setExpandedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const openConfirmModal = (userId: string, action: "suspend" | "remove", userName: string, isCompany: boolean = false) => {
    setConfirmModal({
      show: true,
      userId,
      action,
      userName,
      isCompany,
    });
    setOpenDropdown(null);
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      show: false,
      userId: null,
      action: null,
      userName: "",
      isCompany: false,
    });
  };

  const handleAction = (action: string, userId: string, userName: string, isCompany: boolean = false) => {
    if (action === "suspend" || action === "remove") {
      openConfirmModal(userId, action, userName, isCompany);
    } else {
      console.log(`Action: ${action} on ${isCompany ? 'company' : 'user'}: ${userId}`);
      setOpenDropdown(null);
      // Add your action logic here
    }
  };

  const handleAddNew = () => {
    console.log("Add new user/company clicked");
    alert("Add new user/company dialog would open here");
  };

  const confirmAction = () => {
    if (confirmModal.action === "suspend") {
      console.log(`Suspending ${confirmModal.isCompany ? 'company' : 'user'}: ${confirmModal.userId}`);
    } else if (confirmModal.action === "remove") {
      console.log(`Removing ${confirmModal.isCompany ? 'company' : 'user'}: ${confirmModal.userId}`);
    }
    closeConfirmModal();
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.mechanics.some(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesRole = roleFilter === "All" || roleFilter === "Company";
    
    return matchesSearch && matchesRole;
  });

  const filteredIndependentUsers = independentUsers.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
    if (status === "Active") {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else if (status === "Suspended") {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
    return `${baseClasses} bg-gray-100 text-gray-800`;
  };

  const renderUserRow = (user: any, isUnderCompany: boolean = false) => (
    <tr key={user.id} className={`hover:bg-gray-50 ${isUnderCompany ? 'bg-blue-50/30' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {isUnderCompany && <div className="w-8"></div>}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2 text-sm text-gray-900">
          <Phone size={14} className="text-gray-400" />
          {user.phone}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={getStatusBadge(user.status)}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.joinDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.role === "Technician" ? `${user.completedJobs} jobs` : `${user.totalTrips} trips`}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="relative">
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded text-xs font-medium transition-colors"
            onClick={() => toggleDropdown(`user-${user.id}`)}
          >
            <MoreVertical size={14} />
            <span>Options</span>
          </button>

          {openDropdown === `user-${user.id}` && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setOpenDropdown(null)}
              />
              
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="py-1">
                  <button 
                    onClick={() => handleAction("view", user.id.toString(), user.name)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Eye size={16} />
                    <span>View Profile</span>
                  </button>
                  
                  <button 
                    onClick={() => handleAction("edit", user.id.toString(), user.name)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit size={16} />
                    <span>Edit Details</span>
                  </button>

                  <button 
                    onClick={() => handleAction("role", user.id.toString(), user.name)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserCog size={16} />
                    <span>Change Role</span>
                  </button>

                  <button 
                    onClick={() => handleAction("password", user.id.toString(), user.name)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Key size={16} />
                    <span>Reset Password</span>
                  </button>

                  <div className="border-t border-gray-200 my-1"></div>

                  <button 
                    onClick={() => handleAction("activity", user.id.toString(), user.name)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <History size={16} />
                    <span>View Activity</span>
                  </button>

                  {user.role === "Technician" && (
                    <button 
                      onClick={() => handleAction("jobs", user.id.toString(), user.name)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ClipboardList size={16} />
                      <span>View Assigned Jobs</span>
                    </button>
                  )}

                  {user.role === "Driver" && (
                    <button 
                      onClick={() => handleAction("trips", user.id.toString(), user.name)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ClipboardList size={16} />
                      <span>View Trip History</span>
                    </button>
                  )}

                  <button 
                    onClick={() => handleAction("message", user.id.toString(), user.name)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <MessageSquare size={16} />
                    <span>Send Message</span>
                  </button>

                  <div className="border-t border-gray-200 my-1"></div>

                  <button 
                    onClick={() => handleAction("suspend", user.id.toString(), user.name)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-orange-50 ${
                      user.status === "Suspended" ? "text-green-700" : "text-orange-700"
                    }`}
                  >
                    {user.status === "Suspended" ? (
                      <>
                        <UserX size={16} />
                        <span>Activate User</span>
                      </>
                    ) : (
                      <>
                        <Ban size={16} />
                        <span>Suspend User</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => handleAction("remove", user.id.toString(), user.name)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    <span>Remove User</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderCompanyRow = (company: any) => {
    const isExpanded = expandedCompanies.includes(company.id);
    
    const rows = [
      <tr key={`company-${company.id}`} className="bg-gray-100 hover:bg-gray-200 font-medium">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => toggleCompany(company.id)}
              className="p-1 hover:bg-gray-300 rounded"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white">
              <Building2 size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                {company.name}
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-200 text-blue-800">
                  {company.mechanics.length} members
                </span>
              </div>
              <div className="text-sm text-gray-600">{company.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <Phone size={14} className="text-gray-400" />
            {company.phone}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            {company.role}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={getStatusBadge(company.status)}>
            {company.status}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {company.joinDate}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {company.totalFleet} trucks
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="relative">
            <button
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded text-xs font-medium transition-colors"
              onClick={() => toggleDropdown(`company-${company.id}`)}
            >
              <MoreVertical size={14} />
              <span>Options</span>
            </button>

            {openDropdown === `company-${company.id}` && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setOpenDropdown(null)}
                />
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-1">
                    <button 
                      onClick={() => handleAction("view", company.id.toString(), company.name, true)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Eye size={16} />
                      <span>View Company Profile</span>
                    </button>
                    
                    <button 
                      onClick={() => handleAction("edit", company.id.toString(), company.name, true)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit size={16} />
                      <span>Edit Company Details</span>
                    </button>

                    <button 
                      onClick={() => handleAction("fleet", company.id.toString(), company.name, true)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ClipboardList size={16} />
                      <span>View Fleet ({company.totalFleet})</span>
                    </button>

                    <button 
                      onClick={() => handleAction("members", company.id.toString(), company.name, true)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <UsersIcon size={16} />
                      <span>Manage Members ({company.mechanics.length})</span>
                    </button>

                    <button 
                      onClick={() => handleAction("password", company.id.toString(), company.name, true)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Key size={16} />
                      <span>Reset Password</span>
                    </button>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button 
                      onClick={() => handleAction("activity", company.id.toString(), company.name, true)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <History size={16} />
                      <span>View Activity History</span>
                    </button>

                    <button 
                      onClick={() => handleAction("message", company.id.toString(), company.name, true)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <MessageSquare size={16} />
                      <span>Send Message</span>
                    </button>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button 
                      onClick={() => handleAction("suspend", company.id.toString(), company.name, true)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-orange-50 ${
                        company.status === "Suspended" ? "text-green-700" : "text-orange-700"
                      }`}
                    >
                      {company.status === "Suspended" ? (
                        <>
                          <UserX size={16} />
                          <span>Activate Company</span>
                        </>
                      ) : (
                        <>
                          <Ban size={16} />
                          <span>Suspend Company</span>
                        </>
                      )}
                    </button>

                    <button 
                      onClick={() => handleAction("remove", company.id.toString(), company.name, true)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      <span>Remove Company</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </td>
      </tr>
    ];

    if (isExpanded) {
      company.mechanics.forEach((mechanic: any) => {
        rows.push(renderUserRow(mechanic, true));
      });
    }

    return rows;
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage companies, drivers, and technicians</p>
        </div>
        <button className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleAddNew}>
          <UserPlus size={20} />
          Add New User/Company
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Companies</p>
            <Building2 className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{companies.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Members</p>
            <UsersIcon className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {companies.reduce((sum, c) => sum + c.mechanics.length, 0) + independentUsers.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Technicians</p>
            <Shield className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {companies.reduce((sum, c) => sum + c.mechanics.filter(m => m.role === "Technician" && m.status === "Active").length, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Drivers</p>
            <UsersIcon className="text-orange-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {companies.reduce((sum, c) => sum + c.mechanics.filter(m => m.role === "Driver" && m.status === "Active").length, 0)}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, company..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Company">Companies</option>
            <option value="Technician">Technicians</option>
            <option value="Driver">Drivers</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Companies with expandable mechanics */}
              {filteredCompanies.map((company) => renderCompanyRow(company))}
              
              {/* Independent users */}
              {roleFilter !== "Company" && (
                <>
                  {filteredIndependentUsers.length > 0 && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase">
                        Independent Users
                      </td>
                    </tr>
                  )}
                  {filteredIndependentUsers.map((user) => renderUserRow(user))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm {confirmModal.action === "suspend" ? "Suspend" : "Remove"} {confirmModal.isCompany ? "Company" : "User"}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {confirmModal.action} <strong>{confirmModal.userName}</strong>?
              {confirmModal.isCompany && confirmModal.action === "remove" && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This will also remove all members and fleet associated with this company!
                </span>
              )}
              {confirmModal.isCompany && confirmModal.action === "suspend" && (
                <span className="block mt-2 text-orange-600 font-medium">
                  This will suspend the company and all its members!
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  confirmModal.action === "suspend"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmModal.action === "suspend" ? "Suspend" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}