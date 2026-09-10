import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { eachDayOfInterval, format, parseISO } from "date-fns"
import { ArrowDownRight, ArrowUpRight, CheckCircle2, PiggyBank, Plus, Repeat, Scale, Target, Wallet } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardHeader } from "@/components/ui/Card"
import { StatTile } from "@/components/ui/StatTile"
import { Badge } from "@/components/ui/Badge"
import { Meter } from "@/components/ui/Meter"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageSpinner } from "@/components/ui/Spinner"
import { Button } from "@/components/ui/Button"
import { CategoryBarChart } from "@/components/charts/CategoryBarChart"
import { SpendTrendChart, type DailySpend } from "@/components/charts/SpendTrendChart"
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal"
import { useAuth } from "@/context/AuthContext"
import { useTransactions } from "@/hooks/useTransactions"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { useGoals } from "@/hooks/useGoals"
import { useLogSubscriptionCharge } from "@/hooks/useLogSubscriptionCharge"
import { computeDelta, daysUntil, formatCurrency, relativeDueLabel, titleCase } from "@/lib/format"
import { getPeriodRange, PERIOD_OPTIONS, type PeriodKey } from "@/lib/period"
import type { CategorySummary, Transaction, TransactionType } from "@/lib/types"

const MONTHLY_MULTIPLIER: Record<string, number> = {
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
}

function summarizePeriod(rows: Transaction[]) {
  let spend = 0
  let income = 0
  for (const t of rows) {
    const amount = Number(t.amount)
    if (t.type === "debit") spend += amount
    else income += amount
  }
  return { spend, income, net: income - spend }
}

function PeriodSelector({ value, onChange }: { value: PeriodKey; onChange: (key: PeriodKey) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-[var(--surface-sunken)] p-1">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={
            "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors " +
            (value === opt.key
              ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.full_name?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Welcome back, ${firstName}` : "Dashboard"

  const [period, setPeriod] = useState<PeriodKey>("this-month")
  const [quickAdd, setQuickAdd] = useState<TransactionType | null>(null)
  const range = useMemo(() => getPeriodRange(period), [period])

  const currentTx = useTransactions({ start_date: range.start, end_date: range.end })
  const previousTx = useTransactions({ start_date: range.prevStart, end_date: range.prevEnd })
  const recentTx = useTransactions()
  const subs = useSubscriptions(true)
  const { logCharge, loggingId } = useLogSubscriptionCharge()
  const goals = useGoals()

  const current = useMemo(() => summarizePeriod(currentTx.data ?? []), [currentTx.data])
  const previous = useMemo(() => summarizePeriod(previousTx.data ?? []), [previousTx.data])

  const categorySummary = useMemo(() => {
    const byCategory = new Map<string, number>()
    for (const t of currentTx.data ?? []) {
      if (t.type !== "debit") continue
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + Number(t.amount))
    }
    const rows: CategorySummary[] = Array.from(byCategory, ([category, total]) => ({ category, total }))
    return rows
  }, [currentTx.data])

  const dailyTrend = useMemo<DailySpend[]>(() => {
    const byDate = new Map<string, number>()
    for (const t of currentTx.data ?? []) {
      if (t.type !== "debit") continue
      byDate.set(t.occurred_on, (byDate.get(t.occurred_on) ?? 0) + Number(t.amount))
    }
    return eachDayOfInterval({ start: parseISO(range.start), end: parseISO(range.end) }).map((d) => {
      const key = format(d, "yyyy-MM-dd")
      return { date: key, total: byDate.get(key) ?? 0 }
    })
  }, [currentTx.data, range.start, range.end])

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

  const isLoading =
    currentTx.isLoading || previousTx.isLoading || recentTx.isLoading || subs.isLoading || goals.isLoading

  if (isLoading) {
    return (
      <>
        <PageHeader title={greeting} description="Your money, subscriptions, and goals at a glance." />
        <PageSpinner />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={greeting}
        description="Your money, subscriptions, and goals at a glance."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector value={period} onChange={setPeriod} />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={<ArrowUpRight className="h-4 w-4" />}
                onClick={() => setQuickAdd("credit")}
              >
                Add income
              </Button>
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setQuickAdd("debit")}>
                Add expense
              </Button>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile
          label="Spend"
          value={formatCurrency(current.spend)}
          icon={<ArrowDownRight />}
          tone="critical"
          delta={computeDelta(current.spend, previous.spend, false)}
          hint={`vs ${formatCurrency(previous.spend)} prior period`}
        />
        <StatTile
          label="Income"
          value={formatCurrency(current.income)}
          icon={<ArrowUpRight />}
          tone="good"
          delta={computeDelta(current.income, previous.income, true)}
          hint={`vs ${formatCurrency(previous.income)} prior period`}
        />
        <StatTile
          label="Net"
          value={formatCurrency(current.net)}
          icon={<Scale />}
          tone={current.net >= 0 ? "good" : "critical"}
          delta={computeDelta(current.net, previous.net, true)}
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
          hint={
            goalsProgress
              ? `${formatCurrency(goalsProgress.current)} of ${formatCurrency(goalsProgress.target)}`
              : "No goals yet"
          }
          icon={<Target />}
        />
      </div>

      <Card className="mt-4">
        <CardHeader title="Daily spend" subtitle={range.label} />
        <div className="px-5 pb-5 pt-4">
          <SpendTrendChart data={dailyTrend} />
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Spending by category" subtitle={`${range.label}, debits only`} />
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
                    <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{titleCase(s.billing_cycle)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                            {formatCurrency(s.amount)}
                          </p>
                          <Badge tone={tone} className="mt-1 normal-case">
                            {relativeDueLabel(s.next_due_date)}
                          </Badge>
                        </div>
                        <button
                          aria-label={`Log ${s.name} charge`}
                          title="Log charge — counts toward spend"
                          disabled={loggingId === s.id}
                          onClick={() => logCharge(s)}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--status-good)]/10 hover:text-[var(--status-good-text)] disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
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
                        {t.occurred_on}
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

      <TransactionFormModal
        open={quickAdd !== null}
        onClose={() => setQuickAdd(null)}
        defaultType={quickAdd ?? "debit"}
      />
    </>
  )
}
