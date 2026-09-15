import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import { patch, tempId, useOptimistic } from './optimistic'
import type { DocumentContent, ProjectDocument } from '../types'

export const DOCUMENTS_KEY = ['documents'] as const

export function useDocuments(projectId: string) {
  return useQuery({
    queryKey: [...DOCUMENTS_KEY, projectId],
    queryFn: () => api.fetchDocuments(projectId),
  })
}

export function useDocument(id: string | null) {
  return useQuery({
    queryKey: [...DOCUMENTS_KEY, 'detail', id],
    queryFn: () => api.fetchDocument(id!),
    enabled: !!id,
  })
}

export function useCreateDocument() {
  return useOptimistic<{ title: string; projectId: string }>(
    [DOCUMENTS_KEY],
    (input) => api.createDocument(input.title, input.projectId),
    (qc, input) =>
      patch<ProjectDocument>(qc, [...DOCUMENTS_KEY, input.projectId], (documents) => [
        {
          id: tempId(),
          title: input.title,
          projectId: input.projectId,
          updatedAt: new Date().toISOString(),
        },
        ...documents,
      ]),
  )
}

export function useUpdateDocument() {
  return useOptimistic<{
    id: string
    projectId: string
    title?: string
    content?: DocumentContent
    signal?: AbortSignal
  }>(
    [DOCUMENTS_KEY],
    ({ id, signal, title, content }) =>
      api.updateDocument(
        id,
        {
          ...(title !== undefined ? { title } : {}),
          ...(content !== undefined ? { content } : {}),
        },
        signal,
      ),
    (qc, { id, projectId, title }) => {
      if (title === undefined) return
      patch<ProjectDocument>(qc, [...DOCUMENTS_KEY, projectId], (documents) =>
        documents.map((d) => (d.id === id ? { ...d, title } : d)),
      )
    },
  )
}

export function useDeleteDocument() {
  return useOptimistic<{ id: string; projectId: string }>(
    [DOCUMENTS_KEY],
    ({ id }) => api.removeDocument(id),
    (qc, { id, projectId }) =>
      patch<ProjectDocument>(qc, [...DOCUMENTS_KEY, projectId], (documents) =>
        documents.filter((d) => d.id !== id),
      ),
  )
}
