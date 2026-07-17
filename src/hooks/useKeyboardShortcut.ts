import { useEffect, useCallback } from 'react'

type KeyCombo = string

interface UseKeyboardShortcutOptions {
  enabled?: boolean
  target?: 'window' | 'document'
}

export function useKeyboardShortcut(
  key: KeyCombo,
  handler: () => void,
  options: UseKeyboardShortcutOptions = {}
): void {
  const { enabled = true, target = 'window' } = options

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      const normalizeKey = (k: string) => {
        const map: Record<string, string> = {
          ctrl: 'Control',
          cmd: 'Meta',
          meta: 'Meta',
          esc: 'Escape',
          space: ' ',
          enter: 'Enter',
          backspace: 'Backspace',
          del: 'Delete',
          up: 'ArrowUp',
          down: 'ArrowDown',
          left: 'ArrowLeft',
          right: 'ArrowRight',
        }
        return map[k.toLowerCase()] ?? k
      }

      const targetElement = e.target as HTMLElement
      if (
        targetElement.tagName === 'INPUT' ||
        targetElement.tagName === 'TEXTAREA' ||
        targetElement.tagName === 'SELECT' ||
        targetElement.isContentEditable
      ) {
        if (key !== 'Escape') return
      }

      const parts = key.split('+').map(normalizeKey)
      const mainKey = parts.pop()?.toLowerCase() ?? ''

      const ctrl = parts.includes('Control')
      const shift = parts.includes('Shift')
      const alt = parts.includes('Alt')
      const meta = parts.includes('Meta')

      const matchesMods =
        (!ctrl || e.ctrlKey) && (!shift || e.shiftKey) && (!alt || e.altKey) && (!meta || e.metaKey)

      if (matchesMods && e.key.toLowerCase() === mainKey) {
        e.preventDefault()
        handler()
      }
    },
    [key, handler, enabled]
  )

  useEffect(() => {
    const el = target === 'document' ? document : window
    el.addEventListener('keydown', handleKeyDown as EventListener)
    return () => el.removeEventListener('keydown', handleKeyDown as EventListener)
  }, [handleKeyDown, target])
}
