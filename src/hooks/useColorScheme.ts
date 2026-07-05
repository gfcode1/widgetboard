import { useState, useEffect, useCallback } from 'react'

type ColorScheme = 'dark' | 'light'

const STORAGE_KEY = 'widgetboard-color-scheme'

export function useColorScheme() {
  const [scheme, setScheme] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-mantine-color-scheme', scheme)
    localStorage.setItem(STORAGE_KEY, scheme)
  }, [scheme])

  const toggle = useCallback(() => {
    setScheme((s) => (s === 'dark' ? 'light' : 'dark'))
  }, [])

  return { scheme, toggle }
}
