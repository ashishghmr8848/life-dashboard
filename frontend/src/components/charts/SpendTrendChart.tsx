import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { TooltipContentProps } from "recharts"
import { formatCurrency, formatDate } from "@/lib/format"
import { EmptyState } from "@/components/ui/EmptyState"
import { TrendingUp } from "lucide-react"

export interface DailySpend {
  date: string // ISO date
  total: number
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  const datum = row.payload as DailySpend
  return (
    <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-card)] px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-[var(--text-primary)]">{formatDate(datum.date)}</div>
      <div className="mt-0.5 text-[var(--text-secondary)] tabular-nums">
        {formatCurrency(Number(row.value))}
      </div>
    </div>
  )
}

export function SpendTrendChart({ data }: { data: DailySpend[] }) {
  const hasSpend = data.some((d) => d.total > 0)

  if (!data.length || !hasSpend) {
    return (
      <EmptyState
        icon={<TrendingUp />}
        title="No spend to trend yet"
        description="Once you log a few debits, daily spend shows up here."
      />
    )
  }

  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="spendTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid-hairline)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
            tickFormatter={(v: string) => formatDate(v, { month: "short", day: "numeric" })}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#spendTrendFill)"
            activeDot={{ r: 4, stroke: "var(--surface-card)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
