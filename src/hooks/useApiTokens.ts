import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'

export const API_TOKENS_KEY = ['apiTokens'] as const

export function useApiTokens() {
  return useQuery({ queryKey: API_TOKENS_KEY, queryFn: api.fetchApiTokens })
}

// Not built on useOptimistic (see hooks/optimistic.ts) - a token's plaintext
// only exists in this mutation's resolved value, so the caller needs
// mutation.data back, not a silently-patched cache entry.
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
