import { createBrowserRouter } from "react-router";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { Dashboard } from "./components/Dashboard";
import { ServiceRequests } from "./components/ServiceRequests";
import { Users } from "./components/Users";
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
import { AdminLogin } from "./components/AdminLogin";
import { ForgotPassword } from "./components/ForgotPassword";
import { ChangePassword } from "./components/ChangePassword";
import { ResetPassword } from "./components/ResetPassword";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: AdminLogin,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/change-password",
    Component: ChangePassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "services", Component: ServiceRequests },
      { path: "users", Component: Users },
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
]);
