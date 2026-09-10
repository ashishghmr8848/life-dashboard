import { type ReactNode, useState } from "react"
import { NavLink } from "react-router-dom"
import clsx from "clsx"
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Repeat,
  ShieldCheck,
  Sun,
  Target,
  Wallet,
  X,
} from "lucide-react"
import { useTheme } from "@/lib/theme"
import { useAuth } from "@/context/AuthContext"

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transactions", icon: Wallet, end: false },
  { to: "/subscriptions", label: "Subscriptions", icon: Repeat, end: false },
  { to: "/goals", label: "Goals", icon: Target, end: false },
  { to: "/plans", label: "Plans", icon: ClipboardList, end: false },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const options: { value: "light" | "dark" | "system"; icon: ReactNode; label: string }[] = [
    { value: "light", icon: <Sun className="h-3.5 w-3.5" />, label: "Light" },
    { value: "dark", icon: <Moon className="h-3.5 w-3.5" />, label: "Dark" },
  ]
  return (
    <div className="flex items-center gap-1 rounded-lg bg-[var(--surface-sunken)] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          aria-label={opt.label}
          title={opt.label}
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
            theme === opt.value
              ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          )}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navItems = user?.is_admin
    ? [...NAV_ITEMS, { to: "/admin", label: "Admin", icon: ShieldCheck, end: false }]
    : NAV_ITEMS

  return (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">
          <Wallet className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)]">Life Dashboard</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent-wash)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="flex items-center gap-2 border-t border-[var(--border-hairline)] px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-xs font-semibold text-[var(--text-secondary)]">
            {(user.full_name || user.email)[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {user.full_name || user.email}
            </p>
            {user.full_name && <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>}
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-xs text-[var(--text-muted)]">Theme</span>
        <ThemeToggle />
      </div>
    </>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[var(--border-hairline)] bg-[var(--surface-card)] md:flex">
        <NavContent />
      </aside>

      {/* Mobile topbar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--surface-card)] px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">
            <Wallet className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Life Dashboard</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[var(--surface-card)] shadow-lg">
            <div className="flex justify-end px-3 pt-3">
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-h-full flex-1 pt-14 md:ml-60 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  )
}
