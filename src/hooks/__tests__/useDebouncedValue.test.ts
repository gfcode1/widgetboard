import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedValue } from '../useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('updates after delay', () => {
    const { result, rerender } = renderHook(
      ({ val }: { val: string }) => useDebouncedValue(val, 300),
      { initialProps: { val: 'hello' } }
    )

    rerender({ val: 'world' })
    expect(result.current).toBe('hello')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('world')
  })

  it('cancels previous timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ val }: { val: string }) => useDebouncedValue(val, 500),
      { initialProps: { val: 'a' } }
    )

    rerender({ val: 'b' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    rerender({ val: 'c' })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('c')
  })
})
