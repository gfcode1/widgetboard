import { useState, useCallback, useRef } from 'react'
import { useStore } from '../store/useStore'

export function useCanvasPan(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const canvasOffset = useStore((s) => s.canvasOffset)
  const canvasScale = useStore((s) => s.canvasScale)
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
        setIsPanning(true)
        panStartRef.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y }
      }
    },
    [canvasOffset, canvasRef]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setCanvasTransform(
          {
            x: e.clientX - panStartRef.current.x,
            y: e.clientY - panStartRef.current.y,
          },
          canvasScale
        )
      }
    },
    [isPanning, canvasScale, setCanvasTransform]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  return {
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
