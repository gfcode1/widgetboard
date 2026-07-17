import { useRef, useCallback } from 'react'

export function useCanvasInertia() {
  const cancelRef = useRef<(() => void) | null>(null)

  const startInertia = useCallback(
    (
      vx: number,
      vy: number,
      onUpdate: (dx: number, dy: number) => void,
      friction = 0.92,
      minVelocity = 0.5
    ) => {
      cancelRef.current?.()

      let rafId: number
      let cvx = vx
      let cvy = vy

      const step = () => {
        cvx *= friction
        cvy *= friction
        if (Math.abs(cvx) < minVelocity && Math.abs(cvy) < minVelocity) return
        onUpdate(cvx, cvy)
        rafId = requestAnimationFrame(step)
      }

      rafId = requestAnimationFrame(step)
      cancelRef.current = () => cancelAnimationFrame(rafId)
    },
    []
  )

  const cancelInertia = useCallback(() => {
    cancelRef.current?.()
    cancelRef.current = null
  }, [])

  return { startInertia, cancelInertia }
}
