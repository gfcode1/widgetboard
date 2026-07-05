import type { StateCreator } from 'zustand'
import type { WidgetStore } from './useStore'

export interface CanvasSlice {
  canvasOffset: { x: number; y: number }
  canvasScale: number
  snapEnabled: boolean
  collisionEnabled: boolean
  setCanvasTransform: (offset: { x: number; y: number }, scale: number) => void
  toggleSnap: () => void
  toggleCollision: () => void
}

export const createCanvasSlice: StateCreator<WidgetStore, [], [], CanvasSlice> = (set) => ({
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 0.4,
  snapEnabled: true,
  collisionEnabled: true,

  setCanvasTransform: (offset, scale) => set({ canvasOffset: offset, canvasScale: scale }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  toggleCollision: () => set((s) => ({ collisionEnabled: !s.collisionEnabled })),
})
