import clsx from "clsx"

interface MeterProps {
  value: number // 0-100
  tone?: "accent" | "good" | "warning" | "critical"
  className?: string
}

const toneVar: Record<NonNullable<MeterProps["tone"]>, string> = {
  accent: "var(--accent)",
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}

export function Meter({ value, tone = "accent", className }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={clsx("h-2 w-full overflow-hidden rounded-full", className)}
      style={{ background: "var(--surface-sunken)" }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%`, background: toneVar[tone] }}
      />
    </div>
  )
}
