import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

/** Nested inside ProtectedRoute, so `user` is always set by the time this renders. */
export function AdminRoute() {
  const { user } = useAuth()
  if (!user?.is_admin) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
