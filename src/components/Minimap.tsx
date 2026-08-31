import { useMemo, useCallback, useRef } from 'react'
import { Paper } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useStore, ROOT_BOARD_ID } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import type { Widget, WidgetType } from '../types'

const EMPTY_WIDGETS: Widget[] = []

const MINIMAP_SIZE = 120
const MINIMAP_PADDING = 10

const WIDGET_COLORS: Partial<Record<WidgetType, string>> = {
  note: 'var(--mantine-color-yellow-5)',
  todo: 'var(--mantine-color-green-5)',
  clock: 'var(--wb-accent)',
  pomodoro: 'var(--mantine-color-red-5)',
  calc: 'var(--mantine-color-orange-5)',
  weather: 'var(--mantine-color-blue-5)',
  sticky: 'var(--mantine-color-yellow-3)',
  quote: 'var(--mantine-color-teal-5)',
  calendar: 'var(--mantine-color-indigo-5)',
  habit: 'var(--mantine-color-pink-5)',
  expense: 'var(--mantine-color-red-5)',
}

export function Minimap() {
  const widgets = useStore(
    useShallow((s) => s.boards[s.currentBoardId ?? ROOT_BOARD_ID] ?? EMPTY_WIDGETS)
  )
  const canvasScale = useStore((s) => s.canvasScale)
  const canvasOffset = useStore((s) => s.canvasOffset)
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)
  const canvasRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const bounds = useMemo(() => {
    if (widgets.length === 0 || isMobile) return null
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const w of widgets) {
      minX = Math.min(minX, w.x)
      minY = Math.min(minY, w.y)
      maxX = Math.max(maxX, w.x + w.width)
      maxY = Math.max(maxY, w.y + w.height)
    }

    const viewportEl = document.querySelector('[data-canvas]')?.parentElement?.parentElement
    const vw = viewportEl?.clientWidth ?? window.innerWidth
    const vh = viewportEl?.clientHeight ?? window.innerHeight
    const viewportCX = (vw / 2 - canvasOffset.x) / canvasScale
    const viewportCY = (vh / 2 - canvasOffset.y) / canvasScale
    const viewportLeft = viewportCX - vw / 2 / canvasScale
    const viewportTop = viewportCY - vh / 2 / canvasScale
    const viewportRight = viewportCX + vw / 2 / canvasScale
    const viewportBottom = viewportCY + vh / 2 / canvasScale

    minX = Math.min(minX, viewportLeft) - 50
    minY = Math.min(minY, viewportTop) - 50
    maxX = Math.max(maxX, viewportRight) + 50
    maxY = Math.max(maxY, viewportBottom) + 50

    return { minX, minY, maxX, maxY, viewportLeft, viewportTop, viewportRight, viewportBottom }
  }, [widgets, canvasOffset, canvasScale, isMobile])

  const widgetRects = useMemo(() => {
    if (!bounds) return []
    const contentW = bounds.maxX - bounds.minX
    const contentH = bounds.maxY - bounds.minY
    if (contentW <= 0 || contentH <= 0) return []

    const scaleX = (MINIMAP_SIZE - MINIMAP_PADDING * 2) / contentW
    const scaleY = (MINIMAP_SIZE - MINIMAP_PADDING * 2) / contentH
    const scale = Math.min(scaleX, scaleY)

    return widgets.map((w) => ({
      id: w.id,
      x: (w.x - bounds.minX) * scale + MINIMAP_PADDING,
      y: (w.y - bounds.minY) * scale + MINIMAP_PADDING,
      width: Math.max(2, w.width * scale),
      height: Math.max(2, w.height * scale),
      type: w.type,
      color: WIDGET_COLORS[w.type] || 'var(--wb-accent)',
    }))
  }, [widgets, bounds])

  const viewportRect = useMemo(() => {
    if (!bounds) return null
    const contentW = bounds.maxX - bounds.minX
    const contentH = bounds.maxY - bounds.minY
    if (contentW <= 0 || contentH <= 0) return null

    const scaleX = (MINIMAP_SIZE - MINIMAP_PADDING * 2) / contentW
    const scaleY = (MINIMAP_SIZE - MINIMAP_PADDING * 2) / contentH
    const scale = Math.min(scaleX, scaleY)

    return {
      x: (bounds.viewportLeft - bounds.minX) * scale + MINIMAP_PADDING,
      y: (bounds.viewportTop - bounds.minY) * scale + MINIMAP_PADDING,
      w: (bounds.viewportRight - bounds.viewportLeft) * scale,
      h: (bounds.viewportBottom - bounds.viewportTop) * scale,
    }
  }, [bounds])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!bounds || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      const contentW = bounds.maxX - bounds.minX
      const contentH = bounds.maxY - bounds.minY
      const scaleX = (MINIMAP_SIZE - MINIMAP_PADDING * 2) / contentW
      const scaleY = (MINIMAP_SIZE - MINIMAP_PADDING * 2) / contentH
      const scale = Math.min(scaleX, scaleY)

      const canvasX = (clickX - MINIMAP_PADDING) / scale + bounds.minX
      const canvasY = (clickY - MINIMAP_PADDING) / scale + bounds.minY

      const viewportEl = document.querySelector('[data-canvas]')?.parentElement?.parentElement
      const viewportW = viewportEl?.clientWidth ?? window.innerWidth
      const viewportH = viewportEl?.clientHeight ?? window.innerHeight

      setCanvasTransform(
        {
          x: viewportW / 2 - canvasX * canvasScale,
          y: viewportH / 2 - canvasY * canvasScale,
        },
        canvasScale
      )
    },
    [bounds, canvasScale, setCanvasTransform]
  )

  if (widgets.length === 0) return null

  return (
    <Paper
      ref={canvasRef}
      radius="md"
      role="img"
      aria-label="Canvas minimap"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: MINIMAP_SIZE,
        height: MINIMAP_SIZE,
        backgroundColor: 'rgba(28, 26, 36, 0.9)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--wb-border)',
        boxShadow: 'var(--wb-shadow)',
        overflow: 'hidden',
        cursor: 'crosshair',
        zIndex: 15,
      }}
      onClick={handleClick}
    >
      <svg width={MINIMAP_SIZE} height={MINIMAP_SIZE}>
        {widgetRects.map((r) => (
          <rect
            key={r.id}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            rx={1}
            fill={r.color}
            opacity={0.5}
          />
        ))}
        {viewportRect && (
          <rect
            x={viewportRect.x}
            y={viewportRect.y}
            width={viewportRect.w}
            height={viewportRect.h}
            rx={1}
            fill="none"
            stroke="var(--mantine-color-blue-5)"
            strokeWidth={1}
            opacity={0.8}
          />
        )}
      </svg>
    </Paper>
  )
}

export default Minimap
