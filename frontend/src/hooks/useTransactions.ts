import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type TransactionFilters, transactionsApi } from "@/lib/api"
import type { TransactionInput } from "@/lib/types"

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => transactionsApi.list(filters),
  })
}

export function useTransactionsSummary(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ["transactions", "summary", filters],
    queryFn: () => transactionsApi.summary(filters),
  })
}

export function useTransactionMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["transactions"] })

  const create = useMutation({
    mutationFn: (payload: TransactionInput) => transactionsApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TransactionInput> }) =>
      transactionsApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
