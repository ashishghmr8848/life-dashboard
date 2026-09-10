export type TransactionType = "debit" | "credit"
export type BillingCycle = "weekly" | "monthly" | "yearly"

export interface Transaction {
  id: string
  amount: string // Decimal serialized as string by the API
  type: TransactionType
  category: string
  note: string | null
  occurred_on: string // ISO date
  is_subscription_charge: boolean
  subscription_id: string | null
  created_at: string
}

export interface TransactionInput {
  amount: number
  type: TransactionType
  category: string
  note?: string | null
  occurred_on: string
  is_subscription_charge?: boolean
  subscription_id?: string | null
}

export interface Subscription {
  id: string
  name: string
  amount: string
  billing_cycle: BillingCycle
  next_due_date: string
  active: boolean
  created_at: string
}

export interface SubscriptionInput {
  name: string
  amount: number
  billing_cycle: BillingCycle
  next_due_date: string
  active?: boolean
}

export interface Goal {
  id: string
  name: string
  target_amount: string
  current_amount: string
  target_date: string | null
  created_at: string
}

export interface GoalInput {
  name: string
  target_amount: number
  current_amount?: number
  target_date?: string | null
}

export interface Plan {
  id: string
  title: string
  description: string | null
  linked_date: string | null
  created_at: string
}

export interface PlanInput {
  title: string
  description?: string | null
  linked_date?: string | null
}

export interface CategorySummary {
  category: string
  total: number
}

export interface User {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface RegisterInput {
  email: string
  password: string
  full_name: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AdminUserSummary {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  is_active: boolean
  created_at: string
  transaction_count: number
  total_spend: number
  total_income: number
  subscription_count: number
  active_subscription_monthly_cost: number
  goal_count: number
  plan_count: number
}

export interface AdminUserDetail {
  user: User
  transactions: Transaction[]
  subscriptions: Subscription[]
  goals: Goal[]
  plans: Plan[]
}
