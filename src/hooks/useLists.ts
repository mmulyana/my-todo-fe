import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import { patch, tempId, useOptimistic } from './optimistic'
import { TODOS_KEY } from './useTodos'
import type { List, Todo } from '../types'

export const LISTS_KEY = ['lists'] as const

export function useLists() {
  return useQuery({ queryKey: LISTS_KEY, queryFn: api.fetchLists })
}

export function useCreateList() {
  return useOptimistic<{ name: string; projectId?: string | null }>(
    [LISTS_KEY],
    (input) => api.createList(input.name, input.projectId),
    (qc, input) =>
      patch<List>(qc, LISTS_KEY, (lists) => [
        ...lists,
        {
          id: tempId(),
          name: input.name,
          projectId: input.projectId ?? null,
        },
      ]),
  )
}

export function useUpdateList() {
  return useOptimistic<{ id: string; name?: string; projectId?: string | null }>(
    [LISTS_KEY],
    ({ id, ...patchFields }) => api.updateList(id, patchFields),
    (qc, { id, ...patchFields }) =>
      patch<List>(qc, LISTS_KEY, (lists) =>
        lists.map((l) => (l.id === id ? { ...l, ...patchFields } : l)),
      ),
  )
}

export function useDeleteList() {
  return useOptimistic<string>(
    [LISTS_KEY, TODOS_KEY],
    (id) => api.removeList(id),
    (qc, id) => {
      patch<List>(qc, LISTS_KEY, (lists) => lists.filter((l) => l.id !== id))
      patch<Todo>(qc, TODOS_KEY, (todos) =>
        todos.map((t) => (t.listId === id ? { ...t, listId: null } : t)),
      )
    },
  )
}
