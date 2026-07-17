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
  })
})

describe('store persistence', () => {
  it('exports and imports layout with canvas elements', () => {
    const { addText, addShape, exportLayout, importLayout } = useStore.getState()
    addText({
      content: 'Test',
      x: 10,
      y: 20,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      boardId: 'root',
    })
    addShape({
      shape: 'rectangle',
      x: 50,
      y: 60,
      width: 100,
      height: 80,
      fill: '#fff',
      stroke: '#000',
      strokeWidth: 2,
      opacity: 1,
      boardId: 'root',
    })

    const json = exportLayout()
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(2)
    expect(parsed.canvasElements).toHaveLength(2)

    // Clear and reimport
    useStore.setState({ canvasElements: [], boards: { root: [] } })
    importLayout(json)

    expect(useStore.getState().canvasElements).toHaveLength(2)
    expect(useStore.getState().boards.root).toHaveLength(0)
  })

  it('exports layout with boards', () => {
    const { addWidget, exportLayout, importLayout } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)

    const json = exportLayout()
    expect(json).toContain('"version": 2')
    expect(json).toContain('"boards"')

    useStore.setState({ boards: { root: [] } })
    importLayout(json)
    expect(useStore.getState().boards.root).toHaveLength(1)
  })

  it('handles invalid JSON gracefully', () => {
    const { importLayout } = useStore.getState()
    importLayout('not valid json')
    // Should not throw
    expect(useStore.getState().boards).toBeDefined()
  })

  it('handles missing boards in import', () => {
    const { importLayout } = useStore.getState()
    importLayout('{"version": 2}')
    // Should not throw
    expect(useStore.getState().boards).toBeDefined()
  })
})
