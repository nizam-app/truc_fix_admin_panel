import { useState } from "react";
import { AlertTriangle, Search, MoreVertical, Eye, MessageCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const disputes = [
  { 
    id: 1, 
    title: "Poor service quality - brake replacement", 
    company: "Swift Logistics", 
    customer: "John Smith",
    mechanic: "Tom Wilson",
    service: "Brake Replacement",
    amount: 850,
    reason: "Service Quality",
    status: "Open", 
    priority: "High",
    createdDate: "2025-03-14",
    description: "Customer claims brakes are still making noise after replacement"
  },
  { 
    id: 2, 
    title: "Incorrect charges on invoice", 
    company: "Fast Freight Co", 
    customer: "Sarah Williams",
    mechanic: "Mike Johnson",
    service: "Engine Repair",
    amount: 2400,
    reason: "Billing Issue",
    status: "In Review", 
    priority: "Medium",
    createdDate: "2025-03-13",
    description: "Customer disputes additional labor charges not discussed upfront"
  },
  { 
    id: 3, 
    title: "Service not completed as promised", 
    company: "Global Transport", 
    customer: "David Brown",
    mechanic: "Lisa Anderson",
    service: "AC Repair",
    amount: 450,
    reason: "Incomplete Service",
    status: "Open", 
    priority: "Medium",
    createdDate: "2025-03-12",
    description: "AC still not cooling properly after service"
  },
  { 
    id: 4, 
    title: "Refund request - service canceled", 
    company: "City Movers", 
    customer: "Emma Davis",
    mechanic: null,
    service: "Transmission Service",
    amount: 1500,
    reason: "Cancellation",
    status: "Resolved", 
    priority: "Low",
    createdDate: "2025-03-10",
    description: "Full refund issued for canceled appointment"
  },
  { 
    id: 5, 
    title: "Damage claim during service", 
    company: "Swift Logistics", 
    customer: "Michael Chen",
    mechanic: "Tom Wilson",
    service: "Oil Change",
    amount: 120,
    reason: "Property Damage",
    status: "In Review", 
    priority: "High",
    createdDate: "2025-03-09",
    description: "Customer claims mechanic damaged truck interior during service"
  },
];

export function Disputes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const toggleDropdown = (id: number) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleAction = (action: string, id: number) => {
    console.log(`Action: ${action} on dispute: ${id}`);
    setOpenDropdown(null);
  };

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch = 
      dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || dispute.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || dispute.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openCount = disputes.filter(d => d.status === "Open").length;
  const inReviewCount = disputes.filter(d => d.status === "In Review").length;
  const resolvedCount = disputes.filter(d => d.status === "Resolved").length;
  const totalAmount = disputes.filter(d => d.status !== "Resolved").reduce((sum, d) => sum + d.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-red-100 text-red-800";
      case "In Review": return "bg-yellow-100 text-yellow-800";
      case "Resolved": return "bg-green-100 text-green-800";
      case "Closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-orange-100 text-orange-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution</h1>
        <p className="text-gray-600 mt-1">Handle service disputes and refund requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Open Disputes</p>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{openCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">In Review</p>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <RefreshCw className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{inReviewCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Resolved</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{resolvedCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Amount at Risk</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertTriangle className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">£{totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by title, company, or customer..."
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
            <option value="Open">Open</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.map((dispute) => (
          <div key={dispute.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">#{dispute.id} - {dispute.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(dispute.priority)}`}>
                        {dispute.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{dispute.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div><strong>Company:</strong> {dispute.company}</div>
                      <div><strong>Customer:</strong> {dispute.customer}</div>
                      <div><strong>Service:</strong> {dispute.service}</div>
                      <div><strong>Mechanic:</strong> {dispute.mechanic || "N/A"}</div>
                      <div><strong>Amount:</strong> £{dispute.amount}</div>
                      <div><strong>Reason:</strong> {dispute.reason}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {dispute.createdDate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                    {dispute.status}
                  </span>
                  <div className="relative">
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={() => toggleDropdown(dispute.id)}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openDropdown === dispute.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenDropdown(null)}
                        />
                        
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          <div className="py-1">
                            <button 
                              onClick={() => handleAction("view", dispute.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye size={16} />
                              <span>View Details</span>
                            </button>
                            
                            <button 
                              onClick={() => handleAction("respond", dispute.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <MessageCircle size={16} />
                              <span>Respond to Dispute</span>
                            </button>

                            <div className="border-t border-gray-200 my-1"></div>

                            <button 
                              onClick={() => handleAction("review", dispute.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                            >
                              <RefreshCw size={16} />
                              <span>Mark In Review</span>
                            </button>

                            <button 
                              onClick={() => handleAction("resolve", dispute.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle size={16} />
                              <span>Mark as Resolved</span>
                            </button>

                            <button 
                              onClick={() => handleAction("reject", dispute.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              <XCircle size={16} />
                              <span>Reject Dispute</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}