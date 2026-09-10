import { Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import Dashboard from "@/pages/Dashboard"
import Transactions from "@/pages/Transactions"
import Subscriptions from "@/pages/Subscriptions"
import Goals from "@/pages/Goals"
import Plans from "@/pages/Plans"

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/plans" element={<Plans />} />
      </Routes>
    </AppShell>
  )
}
