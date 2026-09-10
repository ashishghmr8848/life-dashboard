import axios from "axios"
import type {
  CategorySummary,
  Goal,
  GoalInput,
  Plan,
  PlanInput,
  Subscription,
  SubscriptionInput,
  Transaction,
  TransactionInput,
} from "./types"

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000"

export const api = axios.create({
  baseURL: API_BASE_URL,
})

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
