import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, Download, Filter, Search, MoreVertical, Eye, Send, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

const transactions = [
  { id: 1, invoice: "INV-2025-001", company: "Swift Logistics", service: "Brake Replacement", amount: 850, status: "Paid", date: "2025-03-12", paymentMethod: "Credit Card" },
  { id: 2, invoice: "INV-2025-002", company: "Fast Freight Co", service: "Oil Change", amount: 120, status: "Pending", date: "2025-03-13", paymentMethod: "Bank Transfer" },
  { id: 3, invoice: "INV-2025-003", company: "Global Transport", service: "Engine Repair", amount: 2400, status: "Paid", date: "2025-03-13", paymentMethod: "Credit Card" },
  { id: 4, invoice: "INV-2025-004", company: "Swift Logistics", service: "Tire Replacement", amount: 600, status: "Paid", date: "2025-03-14", paymentMethod: "Cash" },
  { id: 5, invoice: "INV-2025-005", company: "City Movers", service: "Transmission Service", amount: 1500, status: "Overdue", date: "2025-03-10", paymentMethod: "Bank Transfer" },
  { id: 6, invoice: "INV-2025-006", company: "Fast Freight Co", service: "AC Repair", amount: 450, status: "Pending", date: "2025-03-14", paymentMethod: "Credit Card" },
];

export function Financial() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const toggleDropdown = (id: number) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleAction = (action: string, id: number) => {
    console.log(`Action: ${action} on transaction: ${id}`);
    setOpenDropdown(null);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.service.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = transactions.reduce((sum, t) => t.status === "Paid" ? sum + t.amount : sum, 0);
  const pendingAmount = transactions.reduce((sum, t) => t.status === "Pending" ? sum + t.amount : sum, 0);
  const overdueAmount = transactions.reduce((sum, t) => t.status === "Overdue" ? sum + t.amount : sum, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600 mt-1">Track payments, invoices, and revenue</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Download size={20} />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <FileText size={20} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">£{totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
            <TrendingUp size={16} />
            <span>+12.5% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Pending Payments</p>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CreditCard className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">£{pendingAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">{transactions.filter(t => t.status === "Pending").length} invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Overdue Amount</p>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">£{overdueAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">{transactions.filter(t => t.status === "Overdue").length} invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{transactions.length}</p>
          <p className="text-sm text-gray-500 mt-2">This month</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by invoice, company, or service..."
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
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{transaction.invoice}</span>
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
                      £{transaction.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="relative">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => toggleDropdown(transaction.id)}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openDropdown === transaction.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenDropdown(null)}
                          />
                          
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                            <div className="py-1">
                              <button 
                                onClick={() => handleAction("view", transaction.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye size={16} />
                                <span>View Invoice</span>
                              </button>
                              
                              <button 
                                onClick={() => handleAction("download", transaction.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Download size={16} />
                                <span>Download PDF</span>
                              </button>

                              <button 
                                onClick={() => handleAction("send", transaction.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Send size={16} />
                                <span>Send to Client</span>
                              </button>

                              <button 
                                onClick={() => handleAction("edit", transaction.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit size={16} />
                                <span>Edit Invoice</span>
                              </button>

                              <div className="border-t border-gray-200 my-1"></div>

                              {transaction.status === "Pending" && (
                                <button 
                                  onClick={() => handleAction("markPaid", transaction.id)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle size={16} />
                                  <span>Mark as Paid</span>
                                </button>
                              )}

                              <button 
                                onClick={() => handleAction("void", transaction.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <XCircle size={16} />
                                <span>Void Invoice</span>
                              </button>

                              <button 
                                onClick={() => handleAction("delete", transaction.id)}
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