import { Navigate } from "react-router";
import { isAdminAuthenticated } from "../auth";
import { Layout } from "./Layout";

export function ProtectedLayout() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}
