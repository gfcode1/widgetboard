import { describe, it, expect } from 'vitest'
import { snapToGrid, checkCollision, findNonOverlappingPosition } from '../utils'
import type { Widget } from '../../types'

describe('snapToGrid', () => {
  it('snaps to nearest grid point', () => {
    expect(snapToGrid(0)).toBe(0)
    expect(snapToGrid(10)).toBe(20) // 10 rounds up to 20
    expect(snapToGrid(5)).toBe(0)   // 5 rounds down to 0
    expect(snapToGrid(15)).toBe(20)
    expect(snapToGrid(25)).toBe(20)
    expect(snapToGrid(30)).toBe(40)
    expect(snapToGrid(-5)).toBe(-0) // -0.25 rounds to -0 in JS
    expect(snapToGrid(-15)).toBe(-20)
  })
})

describe('checkCollision', () => {
  it('detects overlapping widgets', () => {
    const a: Widget = { id: '1', type: 'note', x: 0, y: 0, width: 100, height: 100, content: { type: 'note', text: '' } }
    const b: Widget = { id: '2', type: 'note', x: 50, y: 50, width: 100, height: 100, content: { type: 'note', text: '' } }
    expect(checkCollision(a, b)).toBe(true)
  })

  it('detects non-overlapping widgets', () => {
    const a: Widget = { id: '1', type: 'note', x: 0, y: 0, width: 100, height: 100, content: { type: 'note', text: '' } }
    const b: Widget = { id: '2', type: 'note', x: 200, y: 200, width: 100, height: 100, content: { type: 'note', text: '' } }
    expect(checkCollision(a, b)).toBe(false)
  })

  it('detects adjacent (non-overlapping) widgets', () => {
    const a: Widget = { id: '1', type: 'note', x: 0, y: 0, width: 100, height: 100, content: { type: 'note', text: '' } }
    const b: Widget = { id: '2', type: 'note', x: 100, y: 0, width: 100, height: 100, content: { type: 'note', text: '' } }
    expect(checkCollision(a, b)).toBe(false)
  })

  it('detects containment', () => {
    const a: Widget = { id: '1', type: 'note', x: 0, y: 0, width: 200, height: 200, content: { type: 'note', text: '' } }
    const b: Widget = { id: '2', type: 'note', x: 50, y: 50, width: 50, height: 50, content: { type: 'note', text: '' } }
    expect(checkCollision(a, b)).toBe(true)
  })
})

describe('findNonOverlappingPosition', () => {
  it('returns proposed position if no collision', () => {
    const widget: Widget = { id: '1', type: 'note', x: 0, y: 0, width: 100, height: 100, content: { type: 'note', text: '' } }
    const others: Widget[] = []
    const result = findNonOverlappingPosition(widget, others, 300, 300, false)
    expect(result).toEqual({ x: 300, y: 300 })
  })

  it('finds non-overlapping position when collision exists', () => {
    const widget: Widget = { id: '1', type: 'note', x: 0, y: 0, width: 100, height: 100, content: { type: 'note', text: '' } }
    const others: Widget[] = [
      { id: '2', type: 'note', x: 0, y: 0, width: 100, height: 100, content: { type: 'note', text: '' } },
    ]
    const result = findNonOverlappingPosition(widget, others, 0, 0, false)
    // Should find a position that doesn't overlap — at least one axis should differ
    const hasMoved = result.x !== 0 || result.y !== 0
    expect(hasMoved).toBe(true)
  })
})
