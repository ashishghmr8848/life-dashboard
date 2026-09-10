import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { PageSpinner } from "@/components/ui/Spinner"

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)]">
        <PageSpinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
