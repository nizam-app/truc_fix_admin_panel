import { useState } from "react";
import { Shield, Search, Filter, Eye, User, Trash2, Edit, UserPlus, DollarSign } from "lucide-react";

const auditLogs = [
  { id: 1, user: "Admin", action: "Suspended User", target: "Jennifer Lee (Technician)", timestamp: "2025-03-14 10:35:22", ipAddress: "192.168.1.100", category: "User Management" },
  { id: 2, user: "Admin", action: "Created Invoice", target: "INV-2025-006 (£450)", timestamp: "2025-03-14 09:15:10", ipAddress: "192.168.1.100", category: "Financial" },
  { id: 3, user: "Admin", action: "Edited Service", target: "SRV-2025-045 (Brake Replacement)", timestamp: "2025-03-14 08:45:33", ipAddress: "192.168.1.100", category: "Service Management" },
  { id: 4, user: "Admin", action: "Added New Company", target: "Metro Logistics", timestamp: "2025-03-13 16:20:15", ipAddress: "192.168.1.100", category: "User Management" },
  { id: 5, user: "Admin", action: "Deleted Promotion", target: "SUMMER15 Discount Code", timestamp: "2025-03-13 14:10:50", ipAddress: "192.168.1.100", category: "Promotions" },
  { id: 6, user: "Admin", action: "Updated Fleet", target: "TRK-1001 (Swift Logistics)", timestamp: "2025-03-13 11:30:22", ipAddress: "192.168.1.100", category: "Fleet Management" },
  { id: 7, user: "Admin", action: "Processed Payout", target: "Mike Johnson (£3,800)", timestamp: "2025-03-12 15:45:10", ipAddress: "192.168.1.100", category: "Financial" },
  { id: 8, user: "Admin", action: "Removed User", target: "Peter Jackson (Driver)", timestamp: "2025-03-12 13:20:44", ipAddress: "192.168.1.100", category: "User Management" },
  { id: 9, user: "Admin", action: "Created Promotion", target: "SPRING25 (25% Off)", timestamp: "2025-03-11 10:15:30", ipAddress: "192.168.1.100", category: "Promotions" },
  { id: 10, user: "Admin", action: "Resolved Ticket", target: "#1234 (Payment Issue)", timestamp: "2025-03-10 16:40:12", ipAddress: "192.168.1.100", category: "Support" },
];

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "All" || log.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getActionIcon = (action: string) => {
    if (action.includes("Suspended") || action.includes("Removed") || action.includes("Deleted")) {
      return <Trash2 className="text-red-600" size={16} />;
    } else if (action.includes("Created") || action.includes("Added")) {
      return <UserPlus className="text-green-600" size={16} />;
    } else if (action.includes("Edited") || action.includes("Updated")) {
      return <Edit className="text-blue-600" size={16} />;
    } else if (action.includes("Processed") || action.includes("Invoice")) {
      return <DollarSign className="text-purple-600" size={16} />;
    }
    return <Eye className="text-gray-600" size={16} />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "User Management": return "bg-blue-100 text-blue-800";
      case "Financial": return "bg-green-100 text-green-800";
      case "Service Management": return "bg-purple-100 text-purple-800";
      case "Fleet Management": return "bg-orange-100 text-orange-800";
      case "Promotions": return "bg-pink-100 text-pink-800";
      case "Support": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Track all administrative actions and changes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Actions</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{auditLogs.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Today</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">3</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">This Week</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">10</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Admins</p>
            <div className="p-2 bg-orange-100 rounded-lg">
              <User className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">1</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by action, target, or user..."
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
            <option value="User Management">User Management</option>
            <option value="Financial">Financial</option>
            <option value="Service Management">Service Management</option>
            <option value="Fleet Management">Fleet Management</option>
            <option value="Promotions">Promotions</option>
            <option value="Support">Support</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="text-sm text-gray-900">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {log.target}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(log.category)}`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}