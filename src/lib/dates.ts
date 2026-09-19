export function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toISODate(d)
}

export function nextWeekISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
  return toISODate(d)
}

export function isOverdue(iso: string): boolean {
  return iso < todayISO()
}

export function formatDue(iso: string): string {
  if (iso === todayISO()) return 'Today'
  if (iso === tomorrowISO()) return 'Tomorrow'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (iso === toISODate(yesterday)) return 'Yesterday'

  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: sameYear ? undefined : 'numeric',
  })
}

export function formatDueRelative(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const now = new Date()
  const dueDay = Date.UTC(year, month - 1, day)
  const currentDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const difference = Math.round((dueDay - currentDay) / 86_400_000)

  if (difference === 0) return 'Today'
  if (difference === 1) return 'Tomorrow'
  if (difference === -1) return 'Yesterday'

  return new Intl.RelativeTimeFormat(undefined, { numeric: 'always' }).format(
    difference,
    'day',
  )
}

export function formatCreated(timestamp: string | number): string {
  const date = new Date(timestamp)
  const iso = toISODate(date)
  if (iso === todayISO()) return 'Created today'
  return `Created on ${date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })}`
}
