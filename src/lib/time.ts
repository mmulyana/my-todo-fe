import { format, isToday, isYesterday, isSameYear } from 'date-fns'
import type { TimeEntry } from '../types'

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function entrySeconds(entry: TimeEntry, now: number): number {
  const end = entry.endedAt ? new Date(entry.endedAt).getTime() : now
  return Math.max(0, (end - new Date(entry.startedAt).getTime()) / 1000)
}

export function formatClock(iso: string): string {
  return format(new Date(iso), 'HH:mm')
}

export function formatDayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, isSameYear(date, new Date()) ? 'EEE, d MMM' : 'EEE, d MMM yyyy')
}

export function withClock(iso: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const date = new Date(iso)
  date.setHours(h, m, 0, 0)
  return date.toISOString()
}
