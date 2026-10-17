import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** Route guard: wrap protected routes with `<Route element={<RequireAuth />}>`. */
export function RequireAuth({ operatorOnly = false }: { operatorOnly?: boolean }) {
  const { isAuthenticated, isOperator } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (operatorOnly && !isOperator) return <Navigate to="/" replace />;
  return <Outlet />;
}
