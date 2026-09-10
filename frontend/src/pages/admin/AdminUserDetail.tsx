import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ClipboardList, PiggyBank, Repeat, Wallet } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardHeader } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Meter } from "@/components/ui/Meter"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageSpinner } from "@/components/ui/Spinner"
import { StatTile } from "@/components/ui/StatTile"
import { useAdminUserDetail } from "@/hooks/useAdmin"
import { formatCurrency, formatDate, relativeDueLabel, titleCase, transactionTypeLabel } from "@/lib/format"

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const { data, isLoading } = useAdminUserDetail(userId)

  const totals = useMemo(() => {
    if (!data) return { spend: 0, income: 0 }
    let spend = 0
    let income = 0
    for (const t of data.transactions) {
      if (t.type === "debit") spend += Number(t.amount)
      else income += Number(t.amount)
    }
    return { spend, income }
  }, [data])

  if (isLoading) {
    return (
      <>
        <PageHeader title="Account detail" />
        <PageSpinner />
      </>
    )
  }

  if (!data) {
    return (
      <>
        <PageHeader title="Account detail" />
        <Card>
          <EmptyState icon={<Wallet />} title="Account not found" />
        </Card>
      </>
    )
  }

  const { user } = data

  return (
    <>
      <Link
        to="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        All accounts
      </Link>

      <PageHeader
        title={user.full_name || user.email}
        description={`${user.email} · joined ${formatDate(user.created_at)} · read-only admin view`}
        action={
          <div className="flex gap-2">
            <Badge tone={user.is_admin ? "accent" : "neutral"}>{user.is_admin ? "Admin" : "User"}</Badge>
            <Badge tone={user.is_active ? "good" : "critical"}>{user.is_active ? "Active" : "Disabled"}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="All-time spend" value={formatCurrency(totals.spend)} tone="critical" />
        <StatTile label="All-time income" value={formatCurrency(totals.income)} tone="good" />
        <StatTile label="Subscriptions" value={data.subscriptions.length} icon={<Repeat />} />
        <StatTile label="Goals" value={data.goals.length} icon={<PiggyBank />} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Transactions" subtitle={`${data.transactions.length} total`} />
          <div className="px-5 pb-5 pt-3">
            {!data.transactions.length ? (
              <EmptyState icon={<Wallet />} title="No transactions" />
            ) : (
              <ul className="divide-y divide-[var(--border-hairline)]">
                {data.transactions.slice(0, 10).map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{titleCase(t.category)}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatDate(t.occurred_on)} · {transactionTypeLabel(t.type)}
                        {t.note ? ` · ${t.note}` : ""}
                      </p>
                    </div>
                    <span
                      className={
                        "text-sm font-semibold tabular-nums " +
                        (t.type === "debit" ? "text-[var(--status-critical)]" : "text-[var(--status-good-text)]")
                      }
                    >
                      {t.type === "debit" ? "−" : "+"}
                      {formatCurrency(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Subscriptions" subtitle={`${data.subscriptions.length} total`} />
          <div className="px-5 pb-5 pt-3">
            {!data.subscriptions.length ? (
              <EmptyState icon={<Repeat />} title="No subscriptions" />
            ) : (
              <ul className="divide-y divide-[var(--border-hairline)]">
                {data.subscriptions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{titleCase(s.billing_cycle)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                        {formatCurrency(s.amount)}
                      </p>
                      <Badge tone={s.active ? "neutral" : "critical"} className="mt-1 normal-case">
                        {s.active ? relativeDueLabel(s.next_due_date) : "Paused"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Goals" subtitle={`${data.goals.length} total`} />
          <div className="px-5 pb-5 pt-3">
            {!data.goals.length ? (
              <EmptyState icon={<PiggyBank />} title="No goals" />
            ) : (
              <ul className="flex flex-col gap-4">
                {data.goals.map((g) => {
                  const pct =
                    Number(g.target_amount) > 0 ? (Number(g.current_amount) / Number(g.target_amount)) * 100 : 0
                  return (
                    <li key={g.id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--text-primary)]">{g.name}</span>
                        <span className="tabular-nums text-[var(--text-muted)]">{pct.toFixed(0)}%</span>
                      </div>
                      <Meter value={pct} tone={pct >= 100 ? "good" : "accent"} />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Plans" subtitle={`${data.plans.length} total`} />
          <div className="px-5 pb-5 pt-3">
            {!data.plans.length ? (
              <EmptyState icon={<ClipboardList />} title="No plans" />
            ) : (
              <ul className="divide-y divide-[var(--border-hairline)]">
                {data.plans.map((p) => (
                  <li key={p.id} className="py-2.5">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{p.title}</p>
                    {p.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-muted)]">{p.description}</p>
                    )}
                    {p.linked_date && (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDate(p.linked_date)}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
