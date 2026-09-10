import { useState } from "react"
import { useSubscriptionMutations } from "./useSubscriptions"
import { useTransactionMutations } from "./useTransactions"
import { todayISO } from "@/lib/format"
import { advanceByBillingCycle } from "@/lib/period"
import type { Subscription } from "@/lib/types"

/**
 * Records that a subscription's charge actually went through: adds a linked
 * expense transaction (so it counts toward Spend) and rolls the subscription's
 * next due date forward by one billing cycle.
 */
export function useLogSubscriptionCharge() {
  const { update } = useSubscriptionMutations()
  const { create } = useTransactionMutations()
  const [loggingId, setLoggingId] = useState<string | null>(null)

  async function logCharge(s: Subscription) {
    setLoggingId(s.id)
    try {
      const today = todayISO()
      // Date the transaction to when it was actually due if that's already past
      // (an accurate overdue record), otherwise to today - never to a future due
      // date, which would fall outside every period filter (all bounded by today)
      // and make the charge look like it never happened. ISO yyyy-MM-dd strings
      // compare lexicographically, so a plain string comparison is safe here.
      const occurredOn = s.next_due_date <= today ? s.next_due_date : today
      await create.mutateAsync({
        amount: Number(s.amount),
        type: "debit",
        category: "subscription",
        note: s.name,
        occurred_on: occurredOn,
        is_subscription_charge: true,
        subscription_id: s.id,
      })
      await update.mutateAsync({
        id: s.id,
        payload: { next_due_date: advanceByBillingCycle(s.next_due_date, s.billing_cycle) },
      })
    } finally {
      setLoggingId(null)
    }
  }

  return { logCharge, loggingId }
}
