import { describe, it, expect } from 'vitest'
import {
  getTodayDate,
  isToday,
  isTomorrow,
  isOverdue,
  getLast7Days,
  getDayShortNames,
  formatDateTime,
} from '../date'

describe('getTodayDate', () => {
  it('returns ISO date string format', () => {
    const today = getTodayDate()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(getTodayDate())).toBe(true)
  })

  it('returns false for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]!
    expect(isToday(dateStr)).toBe(false)
  })
})

describe('isTomorrow', () => {
  it('returns true for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]!
    expect(isTomorrow(dateStr)).toBe(true)
  })

  it('returns false for today', () => {
    expect(isTomorrow(getTodayDate())).toBe(false)
  })
})

describe('isOverdue', () => {
  it('returns true for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]!
    expect(isOverdue(dateStr)).toBe(true)
  })

  it('returns false for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]!
    expect(isOverdue(dateStr)).toBe(false)
  })

  it('returns false for today', () => {
    expect(isOverdue(getTodayDate())).toBe(false)
  })
})

describe('getLast7Days', () => {
  it('returns 7 days', () => {
    const today = '2024-06-15'
    const days = getLast7Days(today)
    expect(days).toHaveLength(7)
    expect(days[0]).toBe('2024-06-09')
    expect(days[6]).toBe('2024-06-15')
  })

  it('returns each day in ISO format', () => {
    const days = getLast7Days('2024-01-07')
    for (const day of days) {
      expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('getDayShortNames', () => {
  it('returns 7 short names', () => {
    const names = getDayShortNames('2024-06-15')
    expect(names).toHaveLength(7)
  })

  it('returns strings of max 2 characters', () => {
    const names = getDayShortNames('2024-06-15')
    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(2)
    }
  })
})

describe('formatDateTime', () => {
  it('handles valid timezone', () => {
    const now = new Date('2024-06-15T12:00:00Z')
    const result = formatDateTime('UTC', now, { hour: '2-digit', minute: '2-digit' })
    expect(result).toBeTruthy()
  })

  it('returns fallback for invalid timezone', () => {
    const now = new Date('2024-06-15T12:00:00Z')
    expect(formatDateTime('Invalid/Timezone', now, {})).toBe('--:--:--')
  })
})
