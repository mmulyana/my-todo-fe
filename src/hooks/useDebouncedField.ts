import { useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from './useDebouncedCallback'

export function useDebouncedField(
  value: string,
  onCommit: (value: string, signal: AbortSignal) => void,
  delay = 400,
) {
  const [draft, setDraft] = useState(value)
  const lastCommittedRef = useRef(value)

  useEffect(() => {
    if (value !== lastCommittedRef.current) {
      lastCommittedRef.current = value
      setDraft(value)
    }
  }, [value])

  const [debouncedCommit] = useDebouncedCallback(
    (next: string, signal: AbortSignal) => {
      lastCommittedRef.current = next
      onCommit(next, signal)
    },
    delay,
  )

  const onChange = (next: string) => {
    setDraft(next)
    debouncedCommit(next)
  }

  return [draft, onChange] as const
}
