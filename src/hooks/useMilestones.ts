import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import { patch, tempId, useOptimistic } from './optimistic'
import { TODOS_KEY } from './useTodos'
import type { Milestone, Todo } from '../types'

export const MILESTONES_KEY = ['milestones'] as const

export function useMilestones(projectId?: string) {
  return useQuery({
    queryKey: [...MILESTONES_KEY, projectId ?? null],
    queryFn: () => api.fetchMilestones(projectId),
    enabled: Boolean(projectId),
  })
}

export function useCreateMilestone() {
  return useOptimistic<{
    name: string
    projectId?: string | null
    dueDate?: string | null
  }>(
    [MILESTONES_KEY],
    (input) => api.createMilestone(input.name, input.projectId, input.dueDate),
    (qc, input) =>
      patch<Milestone>(qc, MILESTONES_KEY, (milestones) => [
        ...milestones,
        {
          id: tempId(),
          name: input.name,
          description: null,
          projectId: input.projectId ?? null,
          dueDate: input.dueDate ?? null,
        },
      ]),
  )
}

export function useUpdateMilestone() {
  return useOptimistic<{
    id: string
    name?: string
    description?: string | null
    dueDate?: string | null
    projectId?: string | null
    signal?: AbortSignal
  }>(
    [MILESTONES_KEY],
    ({ id, signal, ...patchFields }) =>
      api.updateMilestone(id, patchFields, signal),
    (qc, vars) =>
      patch<Milestone>(qc, MILESTONES_KEY, (milestones) =>
        milestones.map((m) =>
          m.id === vars.id
            ? {
                ...m,
                ...(vars.name !== undefined ? { name: vars.name } : {}),
                ...(vars.dueDate !== undefined ? { dueDate: vars.dueDate } : {}),
                ...(vars.projectId !== undefined
                  ? { projectId: vars.projectId }
                  : {}),
              }
            : m,
        ),
      ),
  )
}

export function useDeleteMilestone() {
  return useOptimistic<string>(
    [MILESTONES_KEY, TODOS_KEY],
    (id) => api.removeMilestone(id),
    (qc, id) => {
      patch<Milestone>(qc, MILESTONES_KEY, (milestones) =>
        milestones.filter((m) => m.id !== id),
      )
      patch<Todo>(qc, TODOS_KEY, (todos) =>
        todos.map((t) => (t.milestoneId === id ? { ...t, milestoneId: null } : t)),
      )
    },
  )
}
