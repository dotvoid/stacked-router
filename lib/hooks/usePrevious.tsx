import { useRef, useEffect } from 'react'

/*
 * Hook to maintain previous state on rerender
 */
export function usePrevious<T>(value: T): T | null {
  const ref = useRef<T>(null)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
