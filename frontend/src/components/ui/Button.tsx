import type { ButtonHTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-110 active:brightness-95 shadow-sm",
  secondary:
    "bg-[var(--surface-sunken)] text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] border border-[var(--border-hairline)]",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]",
  danger: "bg-transparent text-[var(--status-critical)] hover:bg-[var(--status-critical)]/10",
}

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
