import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { goalsApi } from "@/lib/api"
import type { GoalInput } from "@/lib/types"

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.list(),
  })
}

export function useGoalMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["goals"] })

  const create = useMutation({
    mutationFn: (payload: GoalInput) => goalsApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GoalInput> }) =>
      goalsApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => goalsApi.remove(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
