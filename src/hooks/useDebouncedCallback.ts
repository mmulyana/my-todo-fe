import { useCallback, useEffect, useRef } from 'react'


export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: [...Args, AbortSignal]) => void,
  delay: number,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const controllerRef = useRef<AbortController | undefined>(undefined)

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current)
    controllerRef.current?.abort()
  }, [])

  useEffect(() => cancel, [cancel])

  const debounced = useCallback(
    (...args: Args) => {
      clearTimeout(timeoutRef.current)
      controllerRef.current?.abort()
      timeoutRef.current = setTimeout(() => {
        const controller = new AbortController()
        controllerRef.current = controller
        callbackRef.current(...args, controller.signal)
      }, delay)
    },
    [delay],
  )

  return [debounced, cancel] as const
}
