import type { ReactNode } from "react"
import clsx from "clsx"
import { Card } from "./Card"

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: "neutral" | "good" | "critical"
}

export function StatTile({ label, value, hint, icon, tone = "neutral" }: StatTileProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </span>
        {icon && (
          <span className="text-[var(--text-muted)] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        )}
      </div>
      <div
        className={clsx(
          "mt-2 text-2xl font-semibold tabular-nums",
          tone === "good" && "text-[var(--status-good-text)]",
          tone === "critical" && "text-[var(--status-critical)]",
          tone === "neutral" && "text-[var(--text-primary)]",
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-[var(--text-muted)]">{hint}</div>}
    </Card>
  )
}
