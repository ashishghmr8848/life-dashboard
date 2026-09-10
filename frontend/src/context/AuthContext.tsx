import { createContext, type ReactNode, useContext, useEffect, useState } from "react"
import { authApi, onUnauthorized, setAuthToken } from "@/lib/api"
import type { LoginInput, RegisterInput, User } from "@/lib/types"

const TOKEN_STORAGE_KEY = "life-dashboard:token"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (payload: LoginInput) => Promise<void>
  register: (payload: RegisterInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // localStorage unavailable (private mode, etc.) - session just won't persist across reloads
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  function logout() {
    setAuthToken(null)
    storeToken(null)
    setUser(null)
  }

  // Bootstrap the session from a previously stored token, and react to the API
  // client reporting a 401 (expired/invalid token) at any point later.
  useEffect(() => {
    onUnauthorized(logout)

    const token = readStoredToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    setAuthToken(token)
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        setAuthToken(null)
        storeToken(null)
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login(payload: LoginInput) {
    const result = await authApi.login(payload)
    setAuthToken(result.access_token)
    storeToken(result.access_token)
    setUser(result.user)
  }

  async function register(payload: RegisterInput) {
    const result = await authApi.register(payload)
    setAuthToken(result.access_token)
    storeToken(result.access_token)
    setUser(result.user)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
