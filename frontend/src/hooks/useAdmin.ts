import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.listUsers(),
  })
}

export function useAdminUserDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => adminApi.getUserDetail(userId as string),
    enabled: !!userId,
  })
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string
      payload: { is_active?: boolean; is_admin?: boolean }
    }) => adminApi.updateUser(userId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  })
}
