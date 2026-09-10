import { Outlet, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AdminRoute } from "@/components/AdminRoute"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Dashboard from "@/pages/Dashboard"
import Transactions from "@/pages/Transactions"
import Subscriptions from "@/pages/Subscriptions"
import Goals from "@/pages/Goals"
import Plans from "@/pages/Plans"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminUserDetail from "@/pages/admin/AdminUserDetail"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <AppShell>
              <Outlet />
            </AppShell>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/plans" element={<Plans />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
