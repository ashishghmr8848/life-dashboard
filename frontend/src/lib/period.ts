import { addMonths, addWeeks, addYears, differenceInCalendarDays, format, parseISO, startOfMonth, subDays } from "date-fns"
import type { BillingCycle } from "./types"

export type PeriodKey = "this-month" | "last-30" | "last-90"

export interface PeriodRange {
  key: PeriodKey
  label: string
  start: string // ISO date, inclusive
  end: string // ISO date, inclusive (today)
  prevStart: string
  prevEnd: string
}

const iso = (d: Date) => format(d, "yyyy-MM-dd")

export function getPeriodRange(key: PeriodKey): PeriodRange {
  const today = new Date()
  let start: Date
  let label: string

  switch (key) {
    case "last-30":
      start = subDays(today, 29)
      label = "Last 30 days"
      break
    case "last-90":
      start = subDays(today, 89)
      label = "Last 90 days"
      break
    case "this-month":
    default:
      start = startOfMonth(today)
      label = "This month"
      break
  }

  const lengthDays = differenceInCalendarDays(today, start) + 1
  const prevEnd = subDays(start, 1)
  const prevStart = subDays(prevEnd, lengthDays - 1)

  return {
    key,
    label,
    start: iso(start),
    end: iso(today),
    prevStart: iso(prevStart),
    prevEnd: iso(prevEnd),
  }
}

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "this-month", label: "This month" },
  { key: "last-30", label: "Last 30 days" },
  { key: "last-90", label: "Last 90 days" },
]

/** The next billing date after `dateISO`, stepped by one billing cycle. */
export function advanceByBillingCycle(dateISO: string, cycle: BillingCycle): string {
  const d = parseISO(dateISO)
  const next = cycle === "weekly" ? addWeeks(d, 1) : cycle === "yearly" ? addYears(d, 1) : addMonths(d, 1)
  return iso(next)
}
