import { useState } from "react";
import { Tag, Plus, Search, MoreVertical, Eye, Edit, Copy, Trash2, ToggleLeft, ToggleRight, TrendingUp } from "lucide-react";

const promotions = [
  { id: 1, code: "SPRING25", discount: 25, type: "Percentage", minAmount: 500, usage: 45, limit: 100, expiryDate: "2025-04-30", status: "Active" },
  { id: 2, code: "FLEET50", discount: 50, type: "Fixed", minAmount: 1000, usage: 23, limit: 50, expiryDate: "2025-06-30", status: "Active" },
  { id: 3, code: "WINTER20", discount: 20, type: "Percentage", minAmount: 300, usage: 89, limit: 200, expiryDate: "2025-03-31", status: "Active" },
  { id: 4, code: "NEWCUST", discount: 100, type: "Fixed", minAmount: 0, usage: 12, limit: null, expiryDate: "2025-12-31", status: "Active" },
  { id: 5, code: "LOYAL30", discount: 30, type: "Percentage", minAmount: 800, usage: 34, limit: 75, expiryDate: "2025-05-31", status: "Active" },
  { id: 6, code: "EXPIRED10", discount: 10, type: "Percentage", minAmount: 200, usage: 156, limit: 200, expiryDate: "2025-02-28", status: "Expired" },
];

export function Promotions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const toggleDropdown = (id: number) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleAction = (action: string, id: number) => {
    console.log(`Action: ${action} on promotion: ${id}`);
    setOpenDropdown(null);
  };

  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || promo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = promotions.filter(p => p.status === "Active").length;
  const totalUsage = promotions.reduce((sum, p) => sum + p.usage, 0);
  const totalRevenue = 15600; // Mock data

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotions & Discounts</h1>
          <p className="text-gray-600 mt-1">Manage discount codes and special offers</p>
        </div>
        <button className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          Create Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Promotions</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <Tag className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Usage</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalUsage}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Revenue Impact</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">£{totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Discount</p>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Tag className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">22%</p>
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
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Inactive">Inactive</option>
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
              {filteredPromotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">{promo.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">
                      {promo.type === "Percentage" ? `${promo.discount}%` : `£${promo.discount}`}
                    </span>
                    <span className="ml-1 text-xs text-gray-500">({promo.type})</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {promo.minAmount > 0 ? `£${promo.minAmount}` : "No minimum"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{promo.usage}</span>
                      {promo.limit && (
                        <span className="text-xs text-gray-500">/ {promo.limit} limit</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {promo.expiryDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      promo.status === "Active" ? "bg-green-100 text-green-800" :
                      promo.status === "Expired" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {promo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="relative">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => toggleDropdown(promo.id)}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openDropdown === promo.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenDropdown(null)}
                          />
                          
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                            <div className="py-1">
                              <button 
                                onClick={() => handleAction("view", promo.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye size={16} />
                                <span>View Details</span>
                              </button>
                              
                              <button 
                                onClick={() => handleAction("edit", promo.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit size={16} />
                                <span>Edit Promotion</span>
                              </button>

                              <button 
                                onClick={() => handleAction("duplicate", promo.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Copy size={16} />
                                <span>Duplicate</span>
                              </button>

                              <div className="border-t border-gray-200 my-1"></div>

                              <button 
                                onClick={() => handleAction("toggle", promo.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {promo.status === "Active" ? (
                                  <>
                                    <ToggleLeft size={16} />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight size={16} />
                                    <span>Activate</span>
                                  </>
                                )}
                              </button>

                              <button 
                                onClick={() => handleAction("delete", promo.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
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