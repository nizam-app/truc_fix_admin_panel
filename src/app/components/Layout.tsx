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
import { clearAdminSession, getStoredAdminSession } from "../auth";
import { adminFetch } from "../apiClient";
import { AdminDialogProvider } from "../adminDialog";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const session = getStoredAdminSession();
  const adminName =
    session?.user?.adminProfile?.fullName || session?.user?.email || "Admin";
  const accessToken = session?.accessToken;

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

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      // Best-effort server logout (token may already be invalid).
      if (accessToken) {
        await adminFetch("/auth/logout", { method: "POST" }, { retryOnUnauthorized: false });
      }
    } catch {
      // Intentionally ignored: local logout must still succeed.
    } finally {
      clearAdminSession();
      setSidebarOpen(false);
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  };

  return (
    <AdminDialogProvider>
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
          <div className="flex items-center gap-2 mb-8 shrink-0">
            <Truck className="text-blue-400" size={32} />
            <div>
              <h1 className="text-xl font-bold">Truckfix Admin</h1>
              <p className="text-xs text-gray-400">{adminName}</p>
            </div>
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto pr-1">
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

          <div className="mt-6 border-t border-gray-800 pt-6 shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-800 px-4 py-3 text-gray-300 transition hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={20} />
              <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
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
    </AdminDialogProvider>
  );
}
