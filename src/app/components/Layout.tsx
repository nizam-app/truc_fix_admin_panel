import { Outlet, NavLink, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  Wrench, 
  Users as UsersIcon, 
  Truck, 
  Settings as SettingsIcon,
  Menu,
  X,
  DollarSign,
  BarChart3,
  Star,
  Bell,
  MapPin,
  Tag,
  MessageSquare,
  Shield,
  AlertTriangle,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { clearAuthData, getStoredAdminUser } from "../lib/auth";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const adminUser = getStoredAdminUser<{ name?: string; fullName?: string; email?: string }>();

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/services", label: "Service Requests", icon: Wrench },
    { to: "/users", label: "Users", icon: UsersIcon },
    { to: "/trucks", label: "Fleet", icon: Truck },
    { to: "/financial", label: "Financial", icon: DollarSign },
    { to: "/catalog", label: "Service Catalog", icon: Wrench },
    { to: "/tracking", label: "Live Tracking", icon: MapPin },
    { to: "/promotions", label: "Promotions", icon: Tag },
    { to: "/support", label: "Support", icon: MessageSquare },
    { to: "/disputes", label: "Disputes", icon: AlertTriangle },
    { to: "/audit", label: "Audit Log", icon: Shield },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/reviews", label: "Reviews", icon: Star },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  const adminDisplayName = adminUser?.name || adminUser?.fullName || "Admin User";
  const adminEmail = adminUser?.email || "admin@truckfix.com";

  const handleLogout = () => {
    clearAuthData();
    setSidebarOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white w-64 transform transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col p-6">
          <div className="flex items-center gap-2 mb-8">
            <Truck className="text-blue-400" size={32} />
            <h1 className="text-xl font-bold">Truckfix Admin</h1>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">{adminDisplayName}</p>
            <p className="mt-1 text-xs text-gray-400">{adminEmail}</p>
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
