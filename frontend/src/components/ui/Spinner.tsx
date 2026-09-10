import clsx from "clsx"

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-[var(--text-muted)]",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  )
}
