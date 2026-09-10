import type { ReactNode } from "react"
import clsx from "clsx"
import { Card } from "./Card"
import type { Delta } from "@/lib/format"

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: "neutral" | "good" | "critical"
  delta?: Delta | null
}

const deltaToneClasses: Record<Delta["tone"], string> = {
  good: "text-[var(--status-good-text)]",
  critical: "text-[var(--status-critical)]",
  neutral: "text-[var(--text-muted)]",
}

export function StatTile({ label, value, hint, icon, tone = "neutral", delta }: StatTileProps) {
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
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={clsx(
            "text-2xl font-semibold",
            tone === "good" && "text-[var(--status-good-text)]",
            tone === "critical" && "text-[var(--status-critical)]",
            tone === "neutral" && "text-[var(--text-primary)]",
          )}
        >
          {value}
        </span>
        {delta && (
          <span className={clsx("text-xs font-medium", deltaToneClasses[delta.tone])}>
            {delta.text}
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-[var(--text-muted)]">{hint}</div>}
    </Card>
  )
}
