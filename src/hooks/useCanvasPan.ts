import { useState, useCallback, useRef } from 'react'
import { useStore } from '../store/useStore'
import { useCanvasInertia } from './useCanvasInertia'

export function useCanvasPan(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  cancelAnimation: () => void
) {
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const { startInertia, cancelInertia } = useCanvasInertia()

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        (e.button === 0 || e.button === 1) &&
        (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true')
      ) {
        cancelAnimation()
        cancelInertia()
        const { canvasOffset } = useStore.getState()
        setIsPanning(true)
        hasMoved.current = false
        panStartRef.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y }
        lastMoveRef.current = { x: e.clientX, y: e.clientY, t: performance.now() }
        velocityRef.current = { x: 0, y: 0 }
        if (e.button === 1) e.preventDefault()
      }
    },
    [canvasRef, cancelAnimation, cancelInertia]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        hasMoved.current = true
        const { canvasScale } = useStore.getState()
        const now = performance.now()
        const dt = now - lastMoveRef.current.t
        if (dt > 0) {
          velocityRef.current = {
            x: ((e.clientX - lastMoveRef.current.x) / dt) * 16,
            y: ((e.clientY - lastMoveRef.current.y) / dt) * 16,
          }
        }
        lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now }

        setCanvasTransform(
          {
            x: e.clientX - panStartRef.current.x,
            y: e.clientY - panStartRef.current.y,
          },
          canvasScale
        )
      }
    },
    [isPanning, setCanvasTransform]
  )

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      const { x: vx, y: vy } = velocityRef.current
      if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
        startInertia(vx, vy, (dx, dy) => {
          const state = useStore.getState()
          setCanvasTransform(
            { x: state.canvasOffset.x + dx, y: state.canvasOffset.y + dy },
            state.canvasScale
          )
        })
      }
    }
    setIsPanning(false)
  }, [isPanning, setCanvasTransform, startInertia])

  return {
    isPanning,
    hasMoved,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
