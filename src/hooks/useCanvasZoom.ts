import { useCallback, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

export function useCanvasZoom(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)
  const animRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingRef = useRef<{ offsetX: number; offsetY: number; scale: number } | null>(null)

  const cancelAnimation = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [])

  const animateTo = useCallback(
    (targetOffset: { x: number; y: number }, targetScale: number, duration = 250) => {
      cancelAnimation()
      const state = useStore.getState()
      const startOffset = { ...state.canvasOffset }
      const startScale = state.canvasScale
      const startTime = performance.now()

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration)
        const eased = 1 - Math.pow(1 - t, 3)

        setCanvasTransform(
          {
            x: startOffset.x + (targetOffset.x - startOffset.x) * eased,
            y: startOffset.y + (targetOffset.y - startOffset.y) * eased,
          },
          startScale + (targetScale - startScale) * eased
        )

        if (t < 1) {
          animRef.current = requestAnimationFrame(step)
        } else {
          animRef.current = null
        }
      }

      animRef.current = requestAnimationFrame(step)
    },
    [setCanvasTransform, cancelAnimation]
  )

  const flushPending = useCallback(() => {
    if (pendingRef.current) {
      const { offsetX, offsetY, scale } = pendingRef.current
      pendingRef.current = null
      setCanvasTransform({ x: offsetX, y: offsetY }, scale)
    }
  }, [setCanvasTransform])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      if (!canvasRef.current) return

      const { canvasScale, canvasOffset } = useStore.getState()

      cancelAnimation()

      if (e.shiftKey) {
        const isPixelMode = e.deltaMode === 0
        const multiplier = isPixelMode ? 1 : 20
        setCanvasTransform(
          {
            x: canvasOffset.x - e.deltaY * multiplier,
            y: canvasOffset.y,
          },
          canvasScale
        )
        return
      }

      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const isPixelMode = e.deltaMode === 0
      const rawDelta = isPixelMode ? e.deltaY : Math.sign(e.deltaY) * 50
      const factor = Math.pow(0.999, rawDelta)
      const newScale = Math.min(2, Math.max(0.1, canvasScale * factor))

      if (newScale === canvasScale) return

      const ratio = newScale / canvasScale
      const offsetX = mouseX - (mouseX - canvasOffset.x) * ratio
      const offsetY = mouseY - (mouseY - canvasOffset.y) * ratio

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      pendingRef.current = { offsetX, offsetY, scale: newScale }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        flushPending()
      })
    },
    [canvasRef, cancelAnimation, setCanvasTransform, flushPending]
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
    animateTo({ x: rect.width / 2, y: rect.height / 2 }, 0.6)
  }, [animateTo, canvasRef])

  return {
    centerCanvas,
    animateTo,
    cancelAnimation,
  }
}
