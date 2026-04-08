import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { ServiceRequests } from "./components/ServiceRequests";
import { UsersGrouped } from "./components/UsersGrouped";
import { Trucks } from "./components/Trucks";
import { Financial } from "./components/Financial";
import { ServiceCatalog } from "./components/ServiceCatalog";
import { Tracking } from "./components/Tracking";
import { Promotions } from "./components/Promotions";
import { Support } from "./components/Support";
import { Disputes } from "./components/Disputes";
import { AuditLog } from "./components/AuditLog";
import { Reports } from "./components/Reports";
import { Reviews } from "./components/Reviews";
import { Notifications } from "./components/Notifications";
import { Settings } from "./components/Settings";
import { NotFound } from "./components/NotFound";
import { isAuthenticated } from "./lib/auth";

function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "services", Component: ServiceRequests },
          { path: "users", Component: UsersGrouped },
          { path: "trucks", Component: Trucks },
          { path: "financial", Component: Financial },
          { path: "catalog", Component: ServiceCatalog },
          { path: "tracking", Component: Tracking },
          { path: "promotions", Component: Promotions },
          { path: "support", Component: Support },
          { path: "disputes", Component: Disputes },
          { path: "audit", Component: AuditLog },
          { path: "reports", Component: Reports },
          { path: "reviews", Component: Reviews },
          { path: "notifications", Component: Notifications },
          { path: "settings", Component: Settings },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
