import { useState, useEffect, useCallback, useRef } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(nextValue))
        } catch {
          /* ignore quota errors */
        }
        return nextValue
      })
    },
    [key]
  )

  return [storedValue, setValue]
}

export function useLocalStorageRef(
  key: string,
  initialValue: string
): React.MutableRefObject<string> {
  const ref = useRef(load())

  function load(): string {
    try {
      return localStorage.getItem(key) ?? initialValue
    } catch {
      return initialValue
    }
  }

  useEffect(() => {
    const onStorage = () => {
      ref.current = load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return ref
}
