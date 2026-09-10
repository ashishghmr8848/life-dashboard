import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { subscriptionsApi } from "@/lib/api"
import type { SubscriptionInput } from "@/lib/types"

export function useSubscriptions(activeOnly = false) {
  return useQuery({
    queryKey: ["subscriptions", { activeOnly }],
    queryFn: () => subscriptionsApi.list(activeOnly),
  })
}

export function useSubscriptionMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] })

  const create = useMutation({
    mutationFn: (payload: SubscriptionInput) => subscriptionsApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SubscriptionInput> }) =>
      subscriptionsApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => subscriptionsApi.remove(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
