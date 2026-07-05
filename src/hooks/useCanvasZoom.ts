import { useCallback, useEffect } from 'react'
import { useStore } from '../store/useStore'

export function useCanvasZoom(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const canvasScale = useStore((s) => s.canvasScale)
  const canvasOffset = useStore((s) => s.canvasOffset)
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Mouse wheel: deltaY ≥ 50 → fixed step (50% slower than before)
      // Trackpad: deltaY < 50 → proportional to actual delta for smooth zoom
      const absDelta = Math.abs(e.deltaY)
      let delta: number
      if (absDelta >= 50) {
        delta = e.deltaY > 0 ? -0.04 : 0.04
      } else {
        delta = -e.deltaY * 0.004
      }
      const newScale = Math.min(2, Math.max(0.1, canvasScale + delta))
      const ratio = newScale / canvasScale

      setCanvasTransform(
        {
          x: mouseX - (mouseX - canvasOffset.x) * ratio,
          y: mouseY - (mouseY - canvasOffset.y) * ratio,
        },
        newScale
      )
    },
    [canvasScale, canvasOffset, setCanvasTransform, canvasRef]
  )

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [canvasRef, handleWheel])

  const centerCanvas = useCallback(() => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setCanvasTransform(
      { x: rect.width / 2, y: rect.height / 2 },
      0.6
    )
  }, [setCanvasTransform, canvasRef])

  return {
    centerCanvas,
  }
}
