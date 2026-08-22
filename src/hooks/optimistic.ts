import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query'

export function useOptimistic<TVars>(
  keys: readonly QueryKey[],
  mutationFn: (vars: TVars) => Promise<unknown>,
  apply: (qc: QueryClient, vars: TVars) => void,
) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async (vars: TVars) => {
      await Promise.all(keys.map((key) => qc.cancelQueries({ queryKey: key })))
      const snapshot = keys.flatMap((key) => qc.getQueriesData({ queryKey: key }))
      apply(qc, vars)
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSettled: () => {
      keys.forEach((key) => qc.invalidateQueries({ queryKey: key }))
    },
  })
}

export function patch<T>(
  qc: QueryClient,
  key: QueryKey,
  fn: (items: T[]) => T[],
) {
  qc.setQueriesData<T[]>({ queryKey: key }, (items) => items && fn(items))
}

export const tempId = () => `temp-${crypto.randomUUID()}`
