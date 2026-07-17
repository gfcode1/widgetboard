import { useCallback, useRef, useEffect } from 'react'

interface UseTimersReturn {
  addTimer: (fn: () => void, delay: number) => ReturnType<typeof setTimeout>
}

export function useTimers(): UseTimersReturn {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  const addTimer = useCallback((fn: () => void, delay: number) => {
    const timer = setTimeout(() => {
      fn()
      timersRef.current = timersRef.current.filter((t) => t !== timer)
    }, delay)
    timersRef.current.push(timer)
    return timer
  }, [])

  return { addTimer }
}
