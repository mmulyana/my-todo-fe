import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import { patch, tempId, useOptimistic } from './optimistic'
import { LISTS_KEY } from './useLists'
import { TODOS_KEY } from './useTodos'
import type { List, Project, Todo } from '../types'

export const PROJECTS_KEY = ['projects'] as const

export function useProjects() {
  return useQuery({ queryKey: PROJECTS_KEY, queryFn: api.fetchProjects })
}

export function useCreateProject() {
  return useOptimistic<{
    name: string
    description?: string | null
    parentId?: string | null
    code?: string | null
  }>(
    [PROJECTS_KEY],
    (input) => api.createProject(input.name, input.description, input.parentId, input.code),
    (qc, input) =>
      patch<Project>(qc, PROJECTS_KEY, (projects) => [
        ...projects,
        {
          id: tempId(),
          name: input.name,
          description: input.description ?? null,
          parentId: input.parentId ?? null,
          code: input.code ?? null
        },
      ]),
  )
}

export function useDeleteProject() {
  return useOptimistic<string>(
    [PROJECTS_KEY, LISTS_KEY, TODOS_KEY],
    (id) => api.removeProject(id),
    (qc, id) => {
      patch<Project>(qc, PROJECTS_KEY, (projects) =>
        projects
          .filter((p) => p.id !== id)
          .map((p) => (p.parentId === id ? { ...p, parentId: null } : p)),
      )
      patch<List>(qc, LISTS_KEY, (lists) =>
        lists.map((l) => (l.projectId === id ? { ...l, projectId: null } : l)),
      )
      patch<Todo>(qc, TODOS_KEY, (todos) =>
        todos.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
      )
    },
  )
}

export function useUpdateProject() {
  return useOptimistic<{
    id: string
    name?: string
    description?: string | null
    parentId?: string | null
    code?: string | null
  }>(
    [PROJECTS_KEY],
    ({ id, ...patchFields }) => api.updateProject(id, patchFields),
    (qc, { id, ...patchFields }) =>
      patch<Project>(qc, PROJECTS_KEY, (projects) =>
        projects.map((p) => (p.id === id ? { ...p, ...patchFields } : p)),
      ),
  )
}
