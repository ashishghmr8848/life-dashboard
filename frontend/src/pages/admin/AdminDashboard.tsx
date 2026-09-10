import { Link } from "react-router-dom"
import { ShieldCheck, Users } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { StatTile } from "@/components/ui/StatTile"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageSpinner } from "@/components/ui/Spinner"
import { useAdminUpdateUser, useAdminUsers } from "@/hooks/useAdmin"
import { useAuth } from "@/context/AuthContext"
import { formatCurrency, formatDate } from "@/lib/format"

export default function AdminDashboard() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading } = useAdminUsers()
  const updateUser = useAdminUpdateUser()

  const totals = (users ?? []).reduce(
    (acc, u) => ({
      spend: acc.spend + u.total_spend,
      income: acc.income + u.total_income,
      transactions: acc.transactions + u.transaction_count,
    }),
    { spend: 0, income: 0, transactions: 0 },
  )

  return (
    <>
      <PageHeader
        title="Admin"
        description="Every account on this instance, and what's in their dashboard."
      />

      {isLoading ? (
        <PageSpinner />
      ) : !users?.length ? (
        <Card>
          <EmptyState icon={<Users />} title="No accounts yet" />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Accounts" value={users.length} icon={<Users />} />
            <StatTile label="Total spend (all users)" value={formatCurrency(totals.spend)} icon={<ShieldCheck />} />
            <StatTile label="Total transactions" value={totals.transactions} />
          </div>

          <Card className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Transactions</th>
                    <th className="px-5 py-3 text-right font-medium">Spend</th>
                    <th className="px-5 py-3 text-right font-medium">Income</th>
                    <th className="px-5 py-3 text-right font-medium">Subs / mo</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-[var(--border-hairline)] last:border-0 hover:bg-[var(--surface-card-hover)]"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-[var(--text-primary)]">{u.full_name || u.email}</p>
                          {u.full_name && <p className="text-xs text-[var(--text-muted)]">{u.email}</p>}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            disabled={isSelf || updateUser.isPending}
                            onClick={() =>
                              updateUser.mutate({ userId: u.id, payload: { is_admin: !u.is_admin } })
                            }
                            title={isSelf ? "Can't change your own role" : u.is_admin ? "Revoke admin" : "Make admin"}
                            className="disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Badge tone={u.is_admin ? "accent" : "neutral"}>{u.is_admin ? "Admin" : "User"}</Badge>
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            disabled={isSelf || updateUser.isPending}
                            onClick={() =>
                              updateUser.mutate({ userId: u.id, payload: { is_active: !u.is_active } })
                            }
                            title={isSelf ? "Can't disable your own account" : u.is_active ? "Disable account" : "Re-enable account"}
                            className="disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Badge tone={u.is_active ? "good" : "critical"}>
                              {u.is_active ? "Active" : "Disabled"}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-[var(--text-secondary)]">
                          {u.transaction_count}
                        </td>
                        <td className="px-5 py-3 text-right font-medium tabular-nums text-[var(--status-critical)]">
                          {formatCurrency(u.total_spend)}
                        </td>
                        <td className="px-5 py-3 text-right font-medium tabular-nums text-[var(--status-good-text)]">
                          {formatCurrency(u.total_income)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-[var(--text-secondary)]">
                          {formatCurrency(u.active_subscription_monthly_cost)}
                        </td>
                        <td className="px-5 py-3 text-[var(--text-muted)]">{formatDate(u.created_at)}</td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  )
}
