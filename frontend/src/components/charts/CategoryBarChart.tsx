import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { TooltipContentProps } from "recharts"
import { categoryColor, formatCurrency } from "@/lib/format"
import { titleCase } from "@/lib/format"
import type { CategorySummary } from "@/lib/types"
import { EmptyState } from "@/components/ui/EmptyState"
import { PieChart as PieChartIcon } from "lucide-react"

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  const datum = row.payload as CategorySummary
  return (
    <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-card)] px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-[var(--text-primary)]">{titleCase(datum.category)}</div>
      <div className="mt-0.5 text-[var(--text-secondary)] tabular-nums">
        {formatCurrency(Number(row.value))}
      </div>
    </div>
  )
}

export function CategoryBarChart({ data }: { data: CategorySummary[] }) {
  if (!data.length) {
    return (
      <EmptyState
        icon={<PieChartIcon />}
        title="No spending yet"
        description="Transactions will show up here grouped by category."
      />
    )
  }

  const sorted = [...data].sort((a, b) => b.total - a.total).slice(0, 8)
  const rowHeight = 34
  const height = Math.max(sorted.length * rowHeight, 120)

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="category"
            width={110}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => titleCase(v)}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          />
          <Tooltip content={ChartTooltip} cursor={{ fill: "var(--surface-sunken)" }} />
          <Bar dataKey="total" radius={4} maxBarSize={18}>
            {sorted.map((entry, index) => (
              <Cell key={entry.category} fill={categoryColor(index)} />
            ))}
            <LabelList
              dataKey="total"
              position="right"
              formatter={(v) => formatCurrency(Number(v), true)}
              style={{ fill: "var(--text-secondary)", fontSize: 12, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
