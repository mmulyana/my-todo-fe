import { atom } from 'jotai'
import type { TimeEntry } from '../types'

export type TimerTodo = NonNullable<TimeEntry['todo']>

// note: the timer bar draft lives in atoms so its parts stay separate components without lifting state

export const timerQueryAtom = atom('')

export const timerPendingTodoAtom = atom<TimerTodo | null>(null)

export const timerProjectIdAtom = atom('')
export const timerListIdAtom = atom('')

export const timerCreatingAtom = atom(false)

export const resetTimerDraftAtom = atom(null, (_get, set) => {
  set(timerQueryAtom, '')
  set(timerPendingTodoAtom, null)
})
