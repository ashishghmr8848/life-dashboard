import { format } from "date-fns"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

/**
 * Today's date as YYYY-MM-DD in the *local* timezone. `new Date().toISOString()`
 * converts to UTC first, so near midnight it can silently roll to the wrong day
 * (e.g. 11pm Central is already 4am UTC the next day) - always use this instead
 * for date-only fields.
 */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd")
}

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

export function transactionTypeLabel(type: "debit" | "credit"): string {
  return type === "credit" ? "Income" : "Expense"
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

export interface Delta {
  text: string
  tone: "good" | "critical" | "neutral"
}

/**
 * Signed % change of `current` vs `previous`, colored by whether the *direction*
 * of change is favorable (e.g. spend going up is unfavorable, income going up is).
 * Returns null when there's nothing meaningful to compare (both zero).
 */
export function computeDelta(current: number, previous: number, upIsGood: boolean): Delta | null {
  if (previous === 0) {
    if (current === 0) return null
    return { text: "New", tone: "neutral" }
  }
  const percent = ((current - previous) / Math.abs(previous)) * 100
  if (Math.abs(percent) < 0.5) return { text: "Flat", tone: "neutral" }
  const up = percent > 0
  const favorable = up === upIsGood
  return {
    text: `${up ? "▲" : "▼"} ${Math.abs(percent).toFixed(0)}%`,
    tone: favorable ? "good" : "critical",
  }
}
