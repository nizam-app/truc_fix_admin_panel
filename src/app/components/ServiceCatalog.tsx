import { useState } from "react";
import { Search, Plus, MoreVertical, Eye, Edit, Trash2, Copy, DollarSign, Clock, Wrench, CircleDot, Battery, Key, Zap as Lightning, Thermometer, Disc, Fuel, Truck, Lock, ClipboardList } from "lucide-react";

const services = [
  { 
    id: 1, 
    name: "Flat / Damaged Tyre", 
    category: "Roadside", 
    basePrice: 85, 
    duration: "30-45 min", 
    description: "Tyre replacement or repair for flat or damaged tyres",
    status: "Active", 
    bookings: 124,
    icon: "tire"
  },
  { 
    id: 2, 
    name: "Battery Failure / Jump Start", 
    category: "Electrical", 
    basePrice: 95, 
    duration: "20-30 min", 
    description: "Jump start service or battery replacement",
    status: "Active", 
    bookings: 156,
    icon: "battery"
  },
  { 
    id: 3, 
    name: "Engine Won't Start", 
    category: "Engine", 
    basePrice: 150, 
    duration: "1-2 hours", 
    description: "Diagnostics and repair for engine starting issues",
    status: "Active", 
    bookings: 89,
    icon: "key"
  },
  { 
    id: 4, 
    name: "Breakdown (Unknown Issue)", 
    category: "Emergency", 
    basePrice: 180, 
    duration: "1-3 hours", 
    description: "Emergency diagnostics for unknown vehicle issues",
    status: "Active", 
    bookings: 67,
    icon: "lightning"
  },
  { 
    id: 5, 
    name: "Overheating", 
    category: "Cooling", 
    basePrice: 220, 
    duration: "1-2 hours", 
    description: "Coolant system check and overheating repair",
    status: "Active", 
    bookings: 45,
    icon: "thermometer"
  },
  { 
    id: 6, 
    name: "Brake Problem", 
    category: "Brakes", 
    basePrice: 850, 
    duration: "2-3 hours", 
    description: "Brake system diagnostics and repair",
    status: "Active", 
    bookings: 78,
    icon: "disc"
  },
  { 
    id: 7, 
    name: "Electrical Issue", 
    category: "Electrical", 
    basePrice: 195, 
    duration: "1-2 hours", 
    description: "Electrical system diagnostics and repair",
    status: "Active", 
    bookings: 52,
    icon: "lightning"
  },
  { 
    id: 8, 
    name: "Fuel Issue (Wrong Fuel / Empty)", 
    category: "Fuel", 
    basePrice: 145, 
    duration: "30-60 min", 
    description: "Wrong fuel drain or emergency fuel delivery",
    status: "Active", 
    bookings: 34,
    icon: "fuel"
  },
  { 
    id: 9, 
    name: "Vehicle Recovery / Towing", 
    category: "Recovery", 
    basePrice: 350, 
    duration: "Varies", 
    description: "Vehicle recovery and towing service",
    status: "Active", 
    bookings: 91,
    icon: "truck"
  },
  { 
    id: 10, 
    name: "Diagnostic Check", 
    category: "Diagnostics", 
    basePrice: 120, 
    duration: "45-60 min", 
    description: "Comprehensive vehicle diagnostic check",
    status: "Active", 
    bookings: 103,
    icon: "wrench"
  },
  { 
    id: 11, 
    name: "Locked Out of Vehicle", 
    category: "Emergency", 
    basePrice: 75, 
    duration: "15-30 min", 
    description: "Emergency vehicle unlocking service",
    status: "Active", 
    bookings: 28,
    icon: "lock"
  },
  { 
    id: 12, 
    name: "Other (Describe in Notes)", 
    category: "Other", 
    basePrice: 100, 
    duration: "Varies", 
    description: "Custom service for issues not listed above",
    status: "Active", 
    bookings: 15,
    icon: "clipboard"
  },
];

export function ServiceCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const toggleDropdown = (id: number) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

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

  const handleAction = (action: string, id: number) => {
    console.log(`Action: ${action} on service: ${id}`);
    setOpenDropdown(null);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "All" || service.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const totalServices = services.length;
  const avgPrice = Math.round(services.reduce((sum, s) => sum + s.basePrice, 0) / services.length);
  const totalBookings = services.reduce((sum, s) => sum + s.bookings, 0);
  const categories = [...new Set(services.map(s => s.category))].length;

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Catalog</h1>
          <p className="text-gray-600 mt-1">Manage service types and base pricing</p>
        </div>
        <button className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          Add New Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Services</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalServices}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Base Price</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">£{avgPrice}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Categories</p>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{categories}</p>
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
            <option value="Roadside">Roadside</option>
            <option value="Electrical">Electrical</option>
            <option value="Engine">Engine</option>
            <option value="Emergency">Emergency</option>
            <option value="Cooling">Cooling</option>
            <option value="Brakes">Brakes</option>
            <option value="Fuel">Fuel</option>
            <option value="Recovery">Recovery</option>
            <option value="Diagnostics">Diagnostics</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 ${getIconBackground(service.icon)} rounded-lg`}>
                    {getServiceIcon(service.icon)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <span className="text-xs text-gray-500">{service.category}</span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={() => toggleDropdown(service.id)}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {openDropdown === service.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setOpenDropdown(null)}
                      />
                      
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                          <button 
                            onClick={() => handleAction("view", service.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye size={16} />
                            <span>View Details</span>
                          </button>
                          
                          <button 
                            onClick={() => handleAction("edit", service.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit size={16} />
                            <span>Edit Service</span>
                          </button>

                          <button 
                            onClick={() => handleAction("duplicate", service.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Copy size={16} />
                            <span>Duplicate</span>
                          </button>

                          <div className="border-t border-gray-200 my-1"></div>

                          <button 
                            onClick={() => handleAction("delete", service.id)}
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
              </div>

              <p className="text-sm text-gray-600 mb-4">{service.description}</p>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Base Price</p>
                  <p className="text-2xl font-bold text-gray-900">£{service.basePrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-semibold text-gray-700">{service.duration}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {service.status}
                </span>
                <span className="text-xs text-gray-500">{service.bookings} bookings</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}