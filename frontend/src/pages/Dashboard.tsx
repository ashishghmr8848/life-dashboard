import { useMemo } from "react"
import { Link } from "react-router-dom"
import { endOfMonth, startOfMonth } from "date-fns"
import { ArrowDownRight, ArrowUpRight, PiggyBank, Repeat, Target, Wallet } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardHeader } from "@/components/ui/Card"
import { StatTile } from "@/components/ui/StatTile"
import { Badge } from "@/components/ui/Badge"
import { Meter } from "@/components/ui/Meter"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageSpinner } from "@/components/ui/Spinner"
import { CategoryBarChart } from "@/components/charts/CategoryBarChart"
import { useTransactions } from "@/hooks/useTransactions"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { useGoals } from "@/hooks/useGoals"
import { formatCurrency, formatDate, relativeDueLabel, titleCase, daysUntil } from "@/lib/format"
import type { CategorySummary } from "@/lib/types"

const MONTHLY_MULTIPLIER: Record<string, number> = {
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
}

export default function Dashboard() {
  const monthStart = useMemo(() => startOfMonth(new Date()).toISOString().slice(0, 10), [])
  const monthEnd = useMemo(() => endOfMonth(new Date()).toISOString().slice(0, 10), [])

  const monthTx = useTransactions({ start_date: monthStart, end_date: monthEnd })
  const recentTx = useTransactions()
  const subs = useSubscriptions(true)
  const goals = useGoals()

  const { spend, income, categorySummary } = useMemo(() => {
    const rows = monthTx.data ?? []
    let spendTotal = 0
    let incomeTotal = 0
    const byCategory = new Map<string, number>()
    for (const t of rows) {
      const amount = Number(t.amount)
      if (t.type === "debit") {
        spendTotal += amount
        byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + amount)
      } else {
        incomeTotal += amount
      }
    }
    const categorySummary: CategorySummary[] = Array.from(byCategory, ([category, total]) => ({
      category,
      total,
    }))
    return { spend: spendTotal, income: incomeTotal, categorySummary }
  }, [monthTx.data])

  const monthlySubscriptionCost = useMemo(() => {
    return (subs.data ?? []).reduce((sum, s) => {
      return sum + Number(s.amount) * (MONTHLY_MULTIPLIER[s.billing_cycle] ?? 1)
    }, 0)
  }, [subs.data])

  const goalsProgress = useMemo(() => {
    const rows = goals.data ?? []
    if (!rows.length) return null
    const target = rows.reduce((sum, g) => sum + Number(g.target_amount), 0)
    const current = rows.reduce((sum, g) => sum + Number(g.current_amount), 0)
    return { target, current, pct: target > 0 ? (current / target) * 100 : 0 }
  }, [goals.data])

  const isLoading = monthTx.isLoading || recentTx.isLoading || subs.isLoading || goals.isLoading

  if (isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Your money, subscriptions, and goals at a glance." />
        <PageSpinner />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Your money, subscriptions, and goals at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Spend this month"
          value={formatCurrency(spend)}
          icon={<ArrowDownRight />}
          tone="critical"
        />
        <StatTile
          label="Income this month"
          value={formatCurrency(income)}
          icon={<ArrowUpRight />}
          tone="good"
        />
        <StatTile
          label="Subscriptions / mo"
          value={formatCurrency(monthlySubscriptionCost)}
          hint={`${subs.data?.length ?? 0} active`}
          icon={<Repeat />}
        />
        <StatTile
          label="Goals progress"
          value={goalsProgress ? `${goalsProgress.pct.toFixed(0)}%` : "—"}
          hint={goalsProgress ? `${formatCurrency(goalsProgress.current)} of ${formatCurrency(goalsProgress.target)}` : "No goals yet"}
          icon={<Target />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Spending by category" subtitle="This month, debits only" />
          <div className="px-5 pb-5 pt-4">
            <CategoryBarChart data={categorySummary} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Upcoming subscriptions"
            subtitle="Sorted by next charge"
            action={
              <Link to="/subscriptions" className="text-xs font-medium text-[var(--accent)] hover:underline">
                View all
              </Link>
            }
          />
          <div className="px-5 pb-5 pt-3">
            {!subs.data?.length ? (
              <EmptyState icon={<Repeat />} title="No active subscriptions" />
            ) : (
              <ul className="divide-y divide-[var(--border-hairline)]">
                {subs.data.slice(0, 5).map((s) => {
                  const days = daysUntil(s.next_due_date)
                  const tone = days !== null && days < 0 ? "critical" : days !== null && days <= 3 ? "warning" : "neutral"
                  return (
                    <li key={s.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{titleCase(s.billing_cycle)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                          {formatCurrency(s.amount)}
                        </p>
                        <Badge tone={tone} className="mt-1 normal-case">
                          {relativeDueLabel(s.next_due_date)}
                        </Badge>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent transactions"
            action={
              <Link to="/transactions" className="text-xs font-medium text-[var(--accent)] hover:underline">
                View all
              </Link>
            }
          />
          <div className="px-5 pb-5 pt-3">
            {!recentTx.data?.length ? (
              <EmptyState icon={<Wallet />} title="No transactions yet" />
            ) : (
              <ul className="divide-y divide-[var(--border-hairline)]">
                {recentTx.data.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {titleCase(t.category)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatDate(t.occurred_on)}
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

        <Card className="lg:col-span-2">
          <CardHeader
            title="Goals"
            action={
              <Link to="/goals" className="text-xs font-medium text-[var(--accent)] hover:underline">
                View all
              </Link>
            }
          />
          <div className="px-5 pb-5 pt-3">
            {!goals.data?.length ? (
              <EmptyState icon={<PiggyBank />} title="No goals yet" />
            ) : (
              <ul className="flex flex-col gap-4">
                {goals.data.slice(0, 4).map((g) => {
                  const pct = Number(g.target_amount) > 0 ? (Number(g.current_amount) / Number(g.target_amount)) * 100 : 0
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
      </div>
    </>
  )
}
