import { useState } from "react";
import { MapPin, Navigation, Clock, CheckCircle, AlertCircle, User, Truck } from "lucide-react";

const activeMechanics = [
  { id: 1, name: "Mike Johnson", location: "Downtown", lat: 40.7580, lng: -73.9855, status: "On Job", job: "Brake Replacement", truck: "TRK-1001", eta: "15 min" },
  { id: 2, name: "Lisa Anderson", location: "North Side", lat: 40.7680, lng: -73.9655, status: "En Route", job: "Oil Change", truck: "TRK-2045", eta: "8 min" },
  { id: 3, name: "Tom Wilson", location: "East Side", lat: 40.7480, lng: -73.9555, status: "Available", job: null, truck: null, eta: null },
  { id: 4, name: "Sarah Davis", location: "Downtown", lat: 40.7520, lng: -73.9755, status: "On Job", job: "Engine Repair", truck: "TRK-1002", eta: "45 min" },
];

const serviceUpdates = [
  { id: 1, time: "2 min ago", mechanic: "Mike Johnson", update: "Started brake replacement", status: "in-progress" },
  { id: 2, time: "5 min ago", mechanic: "Lisa Anderson", update: "Arrived at location", status: "arrived" },
  { id: 3, time: "12 min ago", mechanic: "Sarah Davis", update: "Engine diagnostics complete", status: "in-progress" },
  { id: 4, time: "18 min ago", mechanic: "Tom Wilson", update: "Service completed successfully", status: "completed" },
  { id: 5, time: "25 min ago", mechanic: "Mike Johnson", update: "En route to service location", status: "en-route" },
];

export function Tracking() {
  const [selectedMechanic, setSelectedMechanic] = useState<number | null>(1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Job": return "bg-blue-100 text-blue-800";
      case "En Route": return "bg-yellow-100 text-yellow-800";
      case "Available": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUpdateIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="text-green-600" size={16} />;
      case "in-progress": return <Clock className="text-blue-600" size={16} />;
      case "arrived": return <MapPin className="text-purple-600" size={16} />;
      case "en-route": return <Navigation className="text-yellow-600" size={16} />;
      default: return <AlertCircle className="text-gray-600" size={16} />;
    }
  };

  const onJobCount = activeMechanics.filter(m => m.status === "On Job").length;
  const enRouteCount = activeMechanics.filter(m => m.status === "En Route").length;
  const availableCount = activeMechanics.filter(m => m.status === "Available").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Real-time Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor mechanic locations and service status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Mechanics</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeMechanics.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">On Job</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{onJobCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">En Route</p>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Navigation className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{enRouteCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Available</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{availableCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Live Map</h3>
          </div>
          <div className="p-4">
            {/* Placeholder for map - would integrate Google Maps or similar */}
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
              {/* Map background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50"></div>
              
              {/* Mechanic markers */}
              {activeMechanics.map((mechanic, index) => (
                <div
                  key={mechanic.id}
                  className={`absolute cursor-pointer transition-transform hover:scale-110 ${
                    selectedMechanic === mechanic.id ? 'z-10 scale-110' : ''
                  }`}
                  style={{
                    left: `${20 + index * 20}%`,
                    top: `${30 + index * 15}%`,
                  }}
                  onClick={() => setSelectedMechanic(mechanic.id)}
                >
                  <div className="relative">
                    <MapPin 
                      size={32} 
                      className={mechanic.status === "On Job" ? "text-blue-600" : mechanic.status === "En Route" ? "text-yellow-600" : "text-green-600"}
                      fill="currentColor"
                    />
                    {selectedMechanic === mechanic.id && (
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 w-48 border border-gray-200">
                        <p className="font-semibold text-sm text-gray-900">{mechanic.name}</p>
                        <p className="text-xs text-gray-600">{mechanic.location}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(mechanic.status)}`}>
                          {mechanic.status}
                        </span>
                        {mechanic.job && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700">{mechanic.job}</p>
                            <p className="text-xs text-gray-500">{mechanic.truck}</p>
                            {mechanic.eta && <p className="text-xs text-blue-600 mt-1">ETA: {mechanic.eta}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Legend:</p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-blue-600" fill="currentColor" />
                    <span>On Job</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-yellow-600" fill="currentColor" />
                    <span>En Route</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-green-600" fill="currentColor" />
                    <span>Available</span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm">🗺️ Interactive map view</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mechanics List & Updates */}
        <div className="space-y-6">
          {/* Active Mechanics */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Active Mechanics</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {activeMechanics.map((mechanic) => (
                <div
                  key={mechanic.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedMechanic === mechanic.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMechanic(mechanic.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                        {mechanic.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{mechanic.name}</p>
                        <p className="text-xs text-gray-500">{mechanic.location}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(mechanic.status)}`}>
                      {mechanic.status}
                    </span>
                  </div>
                  {mechanic.job && (
                    <div className="ml-10 text-xs text-gray-600">
                      <p className="font-medium">{mechanic.job}</p>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Truck size={12} />
                        <span>{mechanic.truck}</span>
                      </div>
                      {mechanic.eta && (
                        <div className="flex items-center gap-1 text-blue-600 mt-1">
                          <Clock size={12} />
                          <span>ETA: {mechanic.eta}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Updates */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Updates</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {serviceUpdates.map((update) => (
                <div key={update.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getUpdateIcon(update.status)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{update.mechanic}</p>
                      <p className="text-sm text-gray-600">{update.update}</p>
                      <p className="text-xs text-gray-500 mt-1">{update.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
