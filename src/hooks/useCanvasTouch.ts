import { useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { useCanvasInertia } from './useCanvasInertia'

export function useCanvasTouch(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  cancelAnimation: () => void,
  onDoubleTap?: (x: number, y: number) => void
) {
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)
  const { startInertia, cancelInertia } = useCanvasInertia()

  const touchRef = useRef({
    lastTouchCount: 0,
    pinchStartDist: 0,
    pinchStartScale: 0.4,
    pinchStartOffset: { x: 0, y: 0 },
    panTouchId: null as number | null,
    panStartX: 0,
    panStartY: 0,
    lastPanX: 0,
    lastPanY: 0,
    lastPanT: 0,
    velocityX: 0,
    velocityY: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
  })

  const getDistance = (
    t1: { clientX: number; clientY: number },
    t2: { clientX: number; clientY: number }
  ) => {
    const dx = t1.clientX - t2.clientX
    const dy = t1.clientY - t2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!(e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true'))
        return

      cancelAnimation()
      cancelInertia()

      const { canvasOffset, canvasScale } = useStore.getState()
      const touches = e.touches
      touchRef.current.lastTouchCount = touches.length

      if (touches.length === 1) {
        const touch = touches[0]!
        touchRef.current.panTouchId = touch.identifier
        touchRef.current.panStartX = touch.clientX - canvasOffset.x
        touchRef.current.panStartY = touch.clientY - canvasOffset.y
        touchRef.current.lastPanX = touch.clientX
        touchRef.current.lastPanY = touch.clientY
        touchRef.current.lastPanT = performance.now()
        touchRef.current.velocityX = 0
        touchRef.current.velocityY = 0

        const now = performance.now()
        const dt = now - touchRef.current.lastTapTime
        const ddx = touch.clientX - touchRef.current.lastTapX
        const ddy = touch.clientY - touchRef.current.lastTapY
        if (dt < 300 && Math.abs(ddx) < 30 && Math.abs(ddy) < 30) {
          onDoubleTap?.(touch.clientX, touch.clientY)
          touchRef.current.lastTapTime = 0
        } else {
          touchRef.current.lastTapTime = now
          touchRef.current.lastTapX = touch.clientX
          touchRef.current.lastTapY = touch.clientY
        }
      } else if (touches.length === 2) {
        touchRef.current.pinchStartDist = getDistance(touches[0]!, touches[1]!)
        touchRef.current.pinchStartScale = canvasScale
        touchRef.current.pinchStartOffset = { ...canvasOffset }
      }
    },
    [canvasRef, cancelAnimation, cancelInertia, onDoubleTap]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const touches = e.touches

      if (touches.length === 1 && touchRef.current.panTouchId !== null) {
        const touch = touches[0]!
        const now = performance.now()
        const dt = now - touchRef.current.lastPanT
        if (dt > 0) {
          touchRef.current.velocityX = ((touch.clientX - touchRef.current.lastPanX) / dt) * 16
          touchRef.current.velocityY = ((touch.clientY - touchRef.current.lastPanY) / dt) * 16
        }
        touchRef.current.lastPanX = touch.clientX
        touchRef.current.lastPanY = touch.clientY
        touchRef.current.lastPanT = now

        const { canvasScale } = useStore.getState()
        setCanvasTransform(
          {
            x: touch.clientX - touchRef.current.panStartX,
            y: touch.clientY - touchRef.current.panStartY,
          },
          canvasScale
        )
      } else if (touches.length === 2) {
        if (!canvasRef.current) return
        const { canvasScale: _cs } = useStore.getState()
        const rect = canvasRef.current.getBoundingClientRect()
        const dist = getDistance(touches[0]!, touches[1]!)
        const ratio = dist / touchRef.current.pinchStartDist
        const dampenedRatio = Math.pow(ratio, 0.7)
        const newScale = Math.min(
          2,
          Math.max(0.1, touchRef.current.pinchStartScale * dampenedRatio)
        )

        const cx = (touches[0]!.clientX + touches[1]!.clientX) / 2 - rect.left
        const cy = (touches[0]!.clientY + touches[1]!.clientY) / 2 - rect.top

        const scaleRatio = newScale / touchRef.current.pinchStartScale
        const startOff = touchRef.current.pinchStartOffset

        setCanvasTransform(
          {
            x: cx - (cx - startOff.x) * scaleRatio,
            y: cy - (cy - startOff.y) * scaleRatio,
          },
          newScale
        )
      }
    },
    [canvasRef, setCanvasTransform]
  )

  const handleTouchEnd = useCallback(() => {
    const { velocityX: vx, velocityY: vy } = touchRef.current
    if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
      startInertia(vx, vy, (dx, dy) => {
        const state = useStore.getState()
        setCanvasTransform(
          { x: state.canvasOffset.x + dx, y: state.canvasOffset.y + dy },
          state.canvasScale
        )
      })
    }
    touchRef.current.panTouchId = null
  }, [setCanvasTransform, startInertia])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
