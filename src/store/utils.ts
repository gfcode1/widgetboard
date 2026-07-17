import type { Widget, WidgetType } from '../types'
import { WIDGET_MAP } from '../widgets/registry'

export const GRID_SIZE = 20

export function snapToGrid(v: number): number {
  return Math.round(v / GRID_SIZE) * GRID_SIZE
}

export function checkCollision(a: Widget, b: Widget): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  )
}

export function findNonOverlappingPosition(
  widget: Widget,
  allWidgets: Widget[],
  proposedX: number,
  proposedY: number,
  snapEnabled: boolean
): { x: number; y: number } {
  const others = allWidgets.filter((w) => w.id !== widget.id)
  if (others.length === 0) return { x: proposedX, y: proposedY }

  const snap = (v: number) => (snapEnabled ? snapToGrid(v) : v)
  const test = { ...widget, x: proposedX, y: proposedY }

  if (!others.some((other) => checkCollision(test, other))) {
    return { x: proposedX, y: proposedY }
  }

  for (let step = 1; step <= 50; step++) {
    const offsets = [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
      [step, step],
      [-step, step],
      [step, -step],
      [-step, -step],
    ]
    for (const [dx, dy] of offsets) {
      const testX = snap(proposedX + dx! * GRID_SIZE)
      const testY = snap(proposedY + dy! * GRID_SIZE)
      const candidate = { ...widget, x: testX, y: testY }
      if (!others.some((other) => checkCollision(candidate, other))) {
        return { x: testX, y: testY }
      }
    }
  }
  return { x: proposedX, y: proposedY }
}

export function defaultContent(type: WidgetType) {
  return WIDGET_MAP[type].defaultContent()
}

export function defaultSize(type: WidgetType): { width: number; height: number } {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const scale = isMobile ? 0.75 : 1
  const meta = WIDGET_MAP[type]
  return {
    width: Math.round(meta.defaultWidth * scale),
    height: Math.round(meta.defaultHeight * scale),
  }
}
