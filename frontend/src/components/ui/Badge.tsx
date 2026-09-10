import type { HTMLAttributes } from "react"
import clsx from "clsx"

type Tone = "neutral" | "good" | "warning" | "serious" | "critical" | "accent"

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[var(--surface-sunken)] text-[var(--text-secondary)]",
  good: "bg-[var(--status-good)]/12 text-[var(--status-good-text)]",
  warning: "bg-[var(--status-warning)]/18 text-[color-mix(in_oklab,var(--status-warning)_75%,black)]",
  serious: "bg-[var(--status-serious)]/15 text-[var(--status-serious)]",
  critical: "bg-[var(--status-critical)]/12 text-[var(--status-critical)]",
  accent: "bg-[var(--accent-wash)] text-[var(--accent)]",
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  dot?: boolean
}

export function Badge({ tone = "neutral", dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
