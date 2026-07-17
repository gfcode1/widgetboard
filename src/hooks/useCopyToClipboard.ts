import { useState, useCallback, useRef, useEffect } from 'react'
import { copyToClipboard } from '../utils/clipboard'

interface UseCopyToClipboardReturn {
  copied: boolean
  copy: (text: string) => void
}

export function useCopyToClipboard(resetMs: number = 1500): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const copy = useCallback(
    (text: string) => {
      copyToClipboard(text)
        .then((success) => {
          if (success) {
            setCopied(true)
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => setCopied(false), resetMs)
          }
        })
        .catch(() => {})
    },
    [resetMs]
  )

  return { copied, copy }
}
