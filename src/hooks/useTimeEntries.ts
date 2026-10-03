import { useEffect, useState } from 'react'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import * as api from '../api'
import { patch, tempId, useOptimistic } from './optimistic'
import type { TimeEntry } from '../types'

export const TIME_ENTRIES_KEY = ['time-entries'] as const
// note: separate key from the list so patch() on the list never touches the running object
export const RUNNING_TIME_ENTRY_KEY = ['running-time-entry'] as const

const KEYS = [TIME_ENTRIES_KEY, RUNNING_TIME_ENTRY_KEY]

export function useTimeEntries(from: string, to?: string) {
  return useQuery({
    queryKey: [...TIME_ENTRIES_KEY, from, to],
    queryFn: () => api.fetchTimeEntries(from, to),
    placeholderData: (prev) => prev,
  })
}

export function useRunningTimeEntry() {
  return useQuery({
    queryKey: RUNNING_TIME_ENTRY_KEY,
    queryFn: api.fetchRunningTimeEntry,
  })
}

export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

function stopRunning(qc: QueryClient, endedAt: string) {
  const running = qc.getQueryData<TimeEntry | null>(RUNNING_TIME_ENTRY_KEY)
  if (!running) return
  patch<TimeEntry>(qc, TIME_ENTRIES_KEY, (entries) => [
    { ...running, endedAt },
    ...entries.filter((e) => e.id !== running.id),
  ])
  qc.setQueryData(RUNNING_TIME_ENTRY_KEY, null)
}

export function useStartTimer() {
  return useOptimistic<{
    todo?: TimeEntry['todo']
    description?: string
  }>(
    KEYS,
    ({ todo, description }) =>
      api.startTimeEntry({ todoId: todo?.id ?? null, description }),
    (qc, { todo, description }) => {
      const now = new Date().toISOString()
      stopRunning(qc, now)
      qc.setQueryData<TimeEntry>(RUNNING_TIME_ENTRY_KEY, {
        id: tempId(),
        description: description ?? '',
        startedAt: now,
        endedAt: null,
        todoId: todo?.id ?? null,
        todo: todo ?? null,
      })
    },
  )
}

export function useStopTimer() {
  return useOptimistic<void>(
    KEYS,
    () => api.stopTimeEntry(),
    (qc) => stopRunning(qc, new Date().toISOString()),
  )
}

export function useUpdateTimeEntry() {
  return useOptimistic<{
    id: string
    todo?: TimeEntry['todo']
    startedAt?: string
    endedAt?: string
  }>(
    KEYS,
    ({ id, todo, startedAt, endedAt }) =>
      api.updateTimeEntry(id, {
        ...(todo !== undefined ? { todoId: todo?.id ?? null } : {}),
        startedAt,
        endedAt,
      }),
    (qc, { id, todo, startedAt, endedAt }) => {
      const apply = (e: TimeEntry): TimeEntry =>
        e.id !== id
          ? e
          : {
              ...e,
              ...(todo !== undefined ? { todo, todoId: todo?.id ?? null } : {}),
              ...(startedAt ? { startedAt } : {}),
              ...(endedAt ? { endedAt } : {}),
            }
      patch<TimeEntry>(qc, TIME_ENTRIES_KEY, (entries) => entries.map(apply))
      qc.setQueryData<TimeEntry | null>(
        RUNNING_TIME_ENTRY_KEY,
        (running) => running && apply(running),
      )
    },
  )
}

export function useDeleteTimeEntry() {
  return useOptimistic<string>(
    KEYS,
    (id) => api.removeTimeEntry(id),
    (qc, id) => {
      patch<TimeEntry>(qc, TIME_ENTRIES_KEY, (entries) =>
        entries.filter((e) => e.id !== id),
      )
      qc.setQueryData<TimeEntry | null>(RUNNING_TIME_ENTRY_KEY, (running) =>
        running?.id === id ? null : running,
      )
    },
  )
}
