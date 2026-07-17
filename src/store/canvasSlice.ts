import type { StateCreator } from 'zustand'
import type { WidgetStore } from './useStore'

const BOUNDS = { minX: -10000, maxX: 10000, minY: -10000, maxY: 10000 }

export interface CanvasSlice {
  canvasOffset: { x: number; y: number }
  canvasScale: number
  snapEnabled: boolean
  collisionEnabled: boolean
  editMode: boolean
  setCanvasTransform: (offset: { x: number; y: number }, scale: number) => void
  toggleSnap: () => void
  toggleCollision: () => void
  toggleEditMode: () => void
  setEditMode: (mode: boolean) => void
}

export const createCanvasSlice: StateCreator<WidgetStore, [], [], CanvasSlice> = (set) => ({
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 0.4,
  snapEnabled: true,
  collisionEnabled: true,
  editMode: true,

  setCanvasTransform: (offset, scale) =>
    set({
      canvasOffset: {
        x: Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, offset.x)),
        y: Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, offset.y)),
      },
      canvasScale: scale,
    }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  toggleCollision: () => set((s) => ({ collisionEnabled: !s.collisionEnabled })),
  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),
  setEditMode: (mode) => set({ editMode: mode }),
})
