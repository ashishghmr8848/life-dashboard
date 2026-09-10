import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { plansApi } from "@/lib/api"
import type { PlanInput } from "@/lib/types"

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => plansApi.list(),
  })
}

export function usePlanMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["plans"] })

  const create = useMutation({
    mutationFn: (payload: PlanInput) => plansApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PlanInput> }) =>
      plansApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => plansApi.remove(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
