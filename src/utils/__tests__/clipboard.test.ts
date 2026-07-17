import { describe, it, expect, vi, afterEach } from 'vitest'
import { copyToClipboard } from '../clipboard'

const originalNavigator = globalThis.navigator

describe('copyToClipboard', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, writable: true })
  })

  it('calls navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
    })

    const result = await copyToClipboard('test')
    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith('test')
  })

  it('falls back to execCommand when clipboard API fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
    })

    const execCommand = vi.fn().mockReturnValue(true)
    const origExec = document.execCommand
    document.execCommand = execCommand

    try {
      const result = await copyToClipboard('fallback')
      expect(result).toBe(true)
      expect(execCommand).toHaveBeenCalledWith('copy')
    } finally {
      document.execCommand = origExec
    }
  })

  it('returns false when both methods fail', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
    })

    const origExec = document.execCommand
    document.execCommand = vi.fn().mockImplementation(() => {
      throw new Error('not supported')
    })

    try {
      const result = await copyToClipboard('fail')
      expect(result).toBe(false)
    } finally {
      document.execCommand = origExec
    }
  })
})
