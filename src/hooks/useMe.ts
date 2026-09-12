import { useQuery } from '@tanstack/react-query'
import * as api from '../api'

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
