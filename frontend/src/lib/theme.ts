import { useCallback, useEffect, useState } from "react"

export type ThemePreference = "light" | "dark" | "system"

const STORAGE_KEY = "life-dashboard:theme"

function applyTheme(pref: ThemePreference) {
  const root = document.documentElement
  if (pref === "system") {
    root.removeAttribute("data-theme")
  } else {
    root.setAttribute("data-theme", pref)
  }
}

function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") return stored
  } catch {
    // localStorage unavailable (private mode, etc.) - fall through to default
  }
  return "system"
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((pref: ThemePreference) => {
    setThemeState(pref)
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      // ignore
    }
  }, [])

  return { theme, setTheme }
}
