import { useEffect, useState } from 'react'

let globalTick = new Date()
let listeners: Array<() => void> = []

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

export function useGlobalTick(): Date {
  const [, setTick] = useState(globalTick)

  useEffect(() => {
    const listener = () => setTick(new Date())
    listeners.push(listener)
    ensureRunning()
    return () => {
      listeners = listeners.filter((fn) => fn !== listener)
    }
  }, [])

  return globalTick
}
