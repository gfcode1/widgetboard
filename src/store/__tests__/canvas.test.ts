import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../useStore'

beforeEach(() => {
  useStore.setState({
    boards: { root: [] },
    currentBoardId: null,
    navigationStack: [],
    history: [{ boards: { root: [] }, canvasElements: [], connections: [] }],
    historyIndex: 0,
    selectedIds: [],
    lastPushTime: 0,
    canvasElements: [],
    selectedElementId: null,
    canvasOffset: { x: 0, y: 0 },
    canvasScale: 0.4,
    snapEnabled: true,
    collisionEnabled: true,
  })
})

describe('canvasSlice', () => {
  it('sets canvas transform', () => {
    const { setCanvasTransform } = useStore.getState()
    setCanvasTransform({ x: 100, y: 200 }, 0.8)
    expect(useStore.getState().canvasOffset).toEqual({ x: 100, y: 200 })
    expect(useStore.getState().canvasScale).toBe(0.8)
  })

  it('toggles snap', () => {
    const { toggleSnap } = useStore.getState()
    expect(useStore.getState().snapEnabled).toBe(true)
    toggleSnap()
    expect(useStore.getState().snapEnabled).toBe(false)
    toggleSnap()
    expect(useStore.getState().snapEnabled).toBe(true)
  })

  it('toggles collision', () => {
    const { toggleCollision } = useStore.getState()
    expect(useStore.getState().collisionEnabled).toBe(true)
    toggleCollision()
    expect(useStore.getState().collisionEnabled).toBe(false)
    toggleCollision()
    expect(useStore.getState().collisionEnabled).toBe(true)
  })
})
