import { useState } from "react";
import { MessageSquare, Search, MoreVertical, Eye, MessageCircle, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const tickets = [
  { id: 1, subject: "Payment issue with invoice INV-2025-003", company: "Swift Logistics", user: "John Smith", priority: "High", status: "Open", createdDate: "2025-03-14 09:30", lastUpdate: "2 hours ago", category: "Billing" },
  { id: 2, subject: "Cannot access mechanic dashboard", company: "Fast Freight Co", user: "Sarah Williams", priority: "Medium", status: "In Progress", createdDate: "2025-03-13 14:15", lastUpdate: "5 hours ago", category: "Technical" },
  { id: 3, subject: "Request to add new mechanic to account", company: "Global Transport", user: "David Brown", priority: "Low", status: "Open", createdDate: "2025-03-13 11:00", lastUpdate: "1 day ago", category: "Account" },
  { id: 4, subject: "Service quality complaint", company: "City Movers", user: "Emma Davis", priority: "High", status: "Open", createdDate: "2025-03-12 16:45", lastUpdate: "2 days ago", category: "Service" },
  { id: 5, subject: "How to schedule recurring maintenance", company: "Swift Logistics", user: "John Smith", priority: "Low", status: "Resolved", createdDate: "2025-03-10 10:20", lastUpdate: "4 days ago", category: "General" },
  { id: 6, subject: "Discount code not working", company: "Fast Freight Co", user: "Mike Chen", priority: "Medium", status: "In Progress", createdDate: "2025-03-09 13:50", lastUpdate: "5 days ago", category: "Billing" },
];

export function Support() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const toggleDropdown = (id: number) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleAction = (action: string, id: number) => {
    console.log(`Action: ${action} on ticket: ${id}`);
    setOpenDropdown(null);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openCount = tickets.filter(t => t.status === "Open").length;
  const inProgressCount = tickets.filter(t => t.status === "In Progress").length;
  const resolvedCount = tickets.filter(t => t.status === "Resolved").length;
  const highPriorityCount = tickets.filter(t => t.priority === "High" && t.status !== "Resolved").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-yellow-100 text-yellow-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open": return <AlertCircle className="text-yellow-600" size={20} />;
      case "In Progress": return <Clock className="text-blue-600" size={20} />;
      case "Resolved": return <CheckCircle className="text-green-600" size={20} />;
      default: return <MessageSquare className="text-gray-600" size={20} />;
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage customer support and help requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Open Tickets</p>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{openCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">In Progress</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{inProgressCount}</p>
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
            <p className="text-sm text-gray-600">High Priority</p>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{highPriorityCount}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by subject, company, or user..."
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
            <option value="In Progress">In Progress</option>
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

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(ticket.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">#{ticket.id} - {ticket.subject}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span><strong>Company:</strong> {ticket.company}</span>
                      <span>•</span>
                      <span><strong>User:</strong> {ticket.user}</span>
                      <span>•</span>
                      <span><strong>Category:</strong> {ticket.category}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {ticket.createdDate}</span>
                      <span>•</span>
                      <span>Last update: {ticket.lastUpdate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <div className="relative">
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={() => toggleDropdown(ticket.id)}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openDropdown === ticket.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenDropdown(null)}
                        />
                        
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          <div className="py-1">
                            <button 
                              onClick={() => handleAction("view", ticket.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye size={16} />
                              <span>View Details</span>
                            </button>
                            
                            <button 
                              onClick={() => handleAction("reply", ticket.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <MessageCircle size={16} />
                              <span>Reply to Ticket</span>
                            </button>

                            <div className="border-t border-gray-200 my-1"></div>

                            <button 
                              onClick={() => handleAction("resolve", ticket.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle size={16} />
                              <span>Mark as Resolved</span>
                            </button>

                            <button 
                              onClick={() => handleAction("close", ticket.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              <XCircle size={16} />
                              <span>Close Ticket</span>
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
