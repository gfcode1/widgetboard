import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcut } from '../useKeyboardShortcut'

describe('useKeyboardShortcut', () => {
  it('calls handler on matching key', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('a', handler))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls handler with Ctrl+Z combo', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('Ctrl+z', handler))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler when not matching', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('a', handler))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }))
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('does not call handler when disabled', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('a', handler, { enabled: false }))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('handles Escape shortcut', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('Escape', handler))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
