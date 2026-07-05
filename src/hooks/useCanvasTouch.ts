import { useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'

export function useCanvasTouch(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const canvasScale = useStore((s) => s.canvasScale)
  const canvasOffset = useStore((s) => s.canvasOffset)
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)

  const touchRef = useRef({
    lastTouchCount: 0,
    pinchStartDist: 0,
    pinchStartScale: 0.4,
    pinchStartOffset: { x: 0, y: 0 },
    panTouchId: null as number | null,
    panStartX: 0,
    panStartY: 0,
  })

  const getDistance = (t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) => {
    const dx = t1.clientX - t2.clientX
    const dy = t1.clientY - t2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!(e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true')) return

      const touches = e.touches
      touchRef.current.lastTouchCount = touches.length

      if (touches.length === 1) {
        touchRef.current.panTouchId = touches[0].identifier
        touchRef.current.panStartX = touches[0].clientX - canvasOffset.x
        touchRef.current.panStartY = touches[0].clientY - canvasOffset.y
      } else if (touches.length === 2) {
        touchRef.current.pinchStartDist = getDistance(touches[0], touches[1])
        touchRef.current.pinchStartScale = canvasScale
        touchRef.current.pinchStartOffset = { ...canvasOffset }
      }
    },
    [canvasOffset, canvasScale, canvasRef]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const touches = e.touches

      if (touches.length === 1 && touchRef.current.panTouchId !== null) {
        const touch = touches[0]
        setCanvasTransform(
          {
            x: touch.clientX - touchRef.current.panStartX,
            y: touch.clientY - touchRef.current.panStartY,
          },
          canvasScale
        )
      } else if (touches.length === 2) {
        if (!canvasRef.current) return
        const rect = canvasRef.current.getBoundingClientRect()
        const dist = getDistance(touches[0], touches[1])
        const ratio = dist / touchRef.current.pinchStartDist
        // Dampen pinch ratio for slower, more controlled zoom
        const dampenedRatio = Math.pow(ratio, 0.7)
        const newScale = Math.min(2, Math.max(0.1, touchRef.current.pinchStartScale * dampenedRatio))

        const cx = (touches[0].clientX + touches[1].clientX) / 2 - rect.left
        const cy = (touches[0].clientY + touches[1].clientY) / 2 - rect.top

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
    [canvasScale, setCanvasTransform, canvasRef]
  )

  const handleTouchEnd = useCallback(() => {
    touchRef.current.panTouchId = null
  }, [])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
