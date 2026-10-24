import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import type { User } from '../types'

export const ME_KEY = ['me'] as const

const STALE_TIME = 5 * 60_000
const GC_TIME = 30 * 60_000

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: api.fetchMe,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

// note: sengaja tanpa optimistic, username bisa ditolak server (sudah dipakai)
function useMeMutation<TVars>(mutationFn: (vars: TVars) => Promise<User>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  })
}

export function useUpdateProfile() {
  return useMeMutation(api.updateProfile)
}

export function useUploadAvatar() {
  return useMeMutation((file: File) => api.uploadAvatar(file))
}

export function useRemoveAvatar() {
  return useMeMutation(() => api.removeAvatar())
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      api.changePassword(current, next),
  })
}
