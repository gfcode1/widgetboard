import { useEffect, useState } from 'react'

let globalTick = new Date()
const listeners = new Set<() => void>()

function tick() {
  globalTick = new Date()
  for (const fn of listeners) fn()
}

let intervalId: ReturnType<typeof setInterval> | null = null

function ensureRunning() {
  if (intervalId === null) {
    intervalId = setInterval(tick, 1000)
  }
}

function stopIfIdle() {
  if (listeners.size === 0 && intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export function useGlobalTick(): Date {
  const [tickState, setTick] = useState(globalTick)

  useEffect(() => {
    const listener = () => setTick(new Date(globalTick.getTime()))
    listeners.add(listener)
    // Sync immediately in case tick happened between render and effect
    setTick(new Date(globalTick.getTime()))
    ensureRunning()
    return () => {
      listeners.delete(listener)
      stopIfIdle()
    }
  }, [])

  // During render, if globalTick is newer than local state, use global
  // This keeps StrictMode double-mount safe without tearing
  return tickState.getTime() >= globalTick.getTime() ? tickState : globalTick
}
