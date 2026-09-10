import type { ReactNode } from "react"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && (
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)] [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      {description && <p className="max-w-xs text-xs text-[var(--text-muted)]">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
