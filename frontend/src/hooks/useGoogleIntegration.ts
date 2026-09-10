import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { integrationsApi } from "@/lib/api"

export function useGoogleStatus() {
  return useQuery({
    queryKey: ["integrations", "google", "status"],
    queryFn: () => integrationsApi.googleStatus(),
  })
}

export function useGoogleIntegrationMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["integrations", "google"] })

  const connect = useMutation({
    mutationFn: () => integrationsApi.googleConnect(),
    onSuccess: (authorizationUrl) => {
      window.location.href = authorizationUrl
    },
  })

  const disconnect = useMutation({
    mutationFn: () => integrationsApi.googleDisconnect(),
    onSuccess: invalidate,
  })

  const sync = useMutation({
    mutationFn: () => integrationsApi.googleSync(),
  })

  return { connect, disconnect, sync }
}
