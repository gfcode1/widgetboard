import { useMemo, useCallback, useRef } from 'react'
import { Paper } from '@mantine/core'
import { useStore, ROOT_BOARD_ID } from '../store/useStore'

const MINIMAP_SIZE = 120
const MINIMAP_PADDING = 10

export function Minimap() {
  const widgets = useStore((s) => s.boards[s.currentBoardId ?? ROOT_BOARD_ID] ?? [])
  const canvasScale = useStore((s) => s.canvasScale)
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)
  const canvasRef = useRef<HTMLDivElement>(null)

  const bounds = useMemo(() => {
    if (widgets.length === 0) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const w of widgets) {
      minX = Math.min(minX, w.x)
      minY = Math.min(minY, w.y)
      maxX = Math.max(maxX, w.x + w.width)
      maxY = Math.max(maxY, w.y + w.height)
    }
    return { minX: minX - 50, minY: minY - 50, maxX: maxX + 50, maxY: maxY + 50 }
  }, [widgets])

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
    }))
  }, [widgets, bounds])

  const handleClick = useCallback((e: React.MouseEvent) => {
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

    // Get viewport size
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
  }, [bounds, canvasScale, setCanvasTransform])

  if (widgets.length === 0) return null

  return (
    <Paper
      ref={canvasRef}
      radius="md"
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
            fill="var(--wb-accent)"
            opacity={0.5}
          />
        ))}
      </svg>
    </Paper>
  )
}

export default Minimap
