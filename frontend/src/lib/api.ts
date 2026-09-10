import axios from "axios"
import type {
  AdminUserDetail,
  AdminUserSummary,
  AuthResponse,
  CategorySummary,
  Goal,
  GoalInput,
  LoginInput,
  Plan,
  PlanInput,
  RegisterInput,
  Subscription,
  SubscriptionInput,
  Transaction,
  TransactionInput,
  User,
} from "./types"

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000"

export const api = axios.create({
  baseURL: API_BASE_URL,
})

// ---- Auth token plumbing ----
// AuthContext owns the token's lifecycle (state + localStorage); this module just
// needs a place to read it from for every outgoing request, and a way to tell
// AuthContext "the server just rejected this token" without importing React here.

let authToken: string | null = null
let unauthorizedHandler: (() => void) | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.set("Authorization", `Bearer ${authToken}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

// ---- Auth ----

export const authApi = {
  register: async (payload: RegisterInput) => {
    const { data } = await api.post<AuthResponse>("/auth/register", payload)
    return data
  },
  login: async (payload: LoginInput) => {
    // The backend's /auth/login is an OAuth2 password-flow endpoint, which per spec
    // takes form-encoded "username" (we use it as email) and "password" - not JSON.
    const form = new URLSearchParams()
    form.set("username", payload.email)
    form.set("password", payload.password)
    const { data } = await api.post<AuthResponse>("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    return data
  },
  me: async () => {
    const { data } = await api.get<User>("/auth/me")
    return data
  },
}

// ---- Admin ----

export const adminApi = {
  listUsers: async () => {
    const { data } = await api.get<AdminUserSummary[]>("/admin/users")
    return data
  },
  getUserDetail: async (userId: string) => {
    const { data } = await api.get<AdminUserDetail>(`/admin/users/${userId}`)
    return data
  },
  updateUser: async (userId: string, payload: { is_active?: boolean; is_admin?: boolean }) => {
    const { data } = await api.patch<User>(`/admin/users/${userId}`, payload)
    return data
  },
}

// ---- Transactions ----

export interface TransactionFilters {
  category?: string
  start_date?: string
  end_date?: string
}

export const transactionsApi = {
  list: async (filters: TransactionFilters = {}) => {
    const { data } = await api.get<Transaction[]>("/transactions", { params: filters })
    return data
  },
  summary: async (filters: TransactionFilters = {}) => {
    const { data } = await api.get<CategorySummary[]>("/transactions/summary", {
      params: filters,
    })
    return data
  },
  create: async (payload: TransactionInput) => {
    const { data } = await api.post<Transaction>("/transactions", payload)
    return data
  },
  update: async (id: string, payload: Partial<TransactionInput>) => {
    const { data } = await api.patch<Transaction>(`/transactions/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    await api.delete(`/transactions/${id}`)
  },
}

// ---- Subscriptions ----

export const subscriptionsApi = {
  list: async (activeOnly = false) => {
    const { data } = await api.get<Subscription[]>("/subscriptions", {
      params: { active_only: activeOnly },
    })
    return data
  },
  create: async (payload: SubscriptionInput) => {
    const { data } = await api.post<Subscription>("/subscriptions", payload)
    return data
  },
  update: async (id: string, payload: Partial<SubscriptionInput>) => {
    const { data } = await api.patch<Subscription>(`/subscriptions/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    await api.delete(`/subscriptions/${id}`)
  },
}

// ---- Goals ----

export const goalsApi = {
  list: async () => {
    const { data } = await api.get<Goal[]>("/goals")
    return data
  },
  create: async (payload: GoalInput) => {
    const { data } = await api.post<Goal>("/goals", payload)
    return data
  },
  update: async (id: string, payload: Partial<GoalInput>) => {
    const { data } = await api.patch<Goal>(`/goals/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    await api.delete(`/goals/${id}`)
  },
}

// ---- Plans ----

export const plansApi = {
  list: async () => {
    const { data } = await api.get<Plan[]>("/plans")
    return data
  },
  create: async (payload: PlanInput) => {
    const { data } = await api.post<Plan>("/plans", payload)
    return data
  },
  update: async (id: string, payload: Partial<PlanInput>) => {
    const { data } = await api.patch<Plan>(`/plans/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    await api.delete(`/plans/${id}`)
  },
}
