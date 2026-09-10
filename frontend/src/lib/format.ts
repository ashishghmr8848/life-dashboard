const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number | string, compact = false): string {
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return "—"
  return (compact ? compactCurrencyFormatter : currencyFormatter).format(num)
}

export function formatDate(value: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—"
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" })
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null
  const target = new Date(`${value}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = target.getTime() - today.getTime()
  return Math.round(diffMs / 86_400_000)
}

export function relativeDueLabel(value: string | null | undefined): string {
  const days = daysUntil(value)
  if (days === null) return "—"
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return "Due today"
  if (days === 1) return "Due tomorrow"
  return `Due in ${days}d`
}

export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ")
}

// Fixed categorical slot order - never cycled arbitrarily per-render.
// Categories are assigned a slot the first time they're seen (stable via sort).
const CATEGORY_SLOTS = [
  "var(--cat-1)",
  "var(--cat-2)",
  "var(--cat-3)",
  "var(--cat-4)",
  "var(--cat-5)",
  "var(--cat-6)",
  "var(--cat-7)",
  "var(--cat-8)",
]

export function categoryColor(index: number): string {
  return CATEGORY_SLOTS[index % CATEGORY_SLOTS.length]
}
