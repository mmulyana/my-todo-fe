import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'

export const API_TOKENS_KEY = ['apiTokens'] as const

export function useApiTokens() {
  return useQuery({ queryKey: API_TOKENS_KEY, queryFn: api.fetchApiTokens })
}

// note: sengaja ga pake useOptimistic karena plaintext token harus dari response
export function useCreateApiToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, expiresInDays }: { name: string; expiresInDays?: number | null }) =>
      api.createApiToken(name, expiresInDays),
    onSuccess: () => qc.invalidateQueries({ queryKey: API_TOKENS_KEY }),
  })
}

export function useRevokeApiToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.revokeApiToken(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: API_TOKENS_KEY }),
  })
}
