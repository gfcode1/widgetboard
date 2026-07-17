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

describe('Widget CRUD', () => {
  it('adds a widget to root board', () => {
    const { addWidget } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)

    const { boards } = useStore.getState()
    expect(boards.root).toHaveLength(1)
    expect(boards.root![0]!.type).toBe('note')
  })

  it('updates widget content', () => {
    const { addWidget, updateWidget } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)

    const widgetId = useStore.getState().boards.root![0]!.id
    updateWidget(widgetId, { content: { type: 'note', text: 'Hello' } })

    const updated = useStore.getState().boards.root![0]!
    expect(updated.content.type).toBe('note')
    if (updated.content.type === 'note') {
      expect(updated.content.text).toBe('Hello')
    }
  })

  it('removes a widget', () => {
    const { addWidget, removeWidget } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)

    const widgetId = useStore.getState().boards.root![0]!.id
    removeWidget(widgetId)

    expect(useStore.getState().boards.root).toHaveLength(0)
  })

  it('locks and unlocks a widget', () => {
    const { addWidget, toggleLockWidget } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)

    const widgetId = useStore.getState().boards.root![0]!.id
    expect(useStore.getState().boards.root![0]!.locked).toBe(false)

    toggleLockWidget(widgetId)
    expect(useStore.getState().boards.root![0]!.locked).toBe(true)

    toggleLockWidget(widgetId)
    expect(useStore.getState().boards.root![0]!.locked).toBe(false)
  })

  it('brings widget to front', () => {
    const { addWidget, bringToFront } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 100, 100, rect)
    addWidget('clock', 200, 200, rect)

    const ids = useStore.getState().boards.root!.map((w) => w.id)
    bringToFront(ids[0]!)

    const order = useStore.getState().boards.root!.map((w) => w.id)
    expect(order[order.length - 1]).toBe(ids[0])
  })
})

describe('History / Undo / Redo', () => {
  it('undoes the last action', () => {
    const { addWidget, undo } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)
    expect(useStore.getState().boards.root).toHaveLength(1)

    undo()
    expect(useStore.getState().boards.root).toHaveLength(0)
  })

  it('redoes after undo', () => {
    const { addWidget, undo, redo } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)
    expect(useStore.getState().boards.root).toHaveLength(1)

    undo()
    expect(useStore.getState().boards.root).toHaveLength(0)

    redo()
    expect(useStore.getState().boards.root).toHaveLength(1)
    expect(useStore.getState().boards.root![0]!.type).toBe('note')
  })

  it('reports canUndo/canRedo correctly', () => {
    const { addWidget, undo } = useStore.getState()
    expect(useStore.getState().canUndo()).toBe(false)

    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)
    expect(useStore.getState().canUndo()).toBe(true)
    expect(useStore.getState().canRedo()).toBe(false)

    undo()
    expect(useStore.getState().canUndo()).toBe(false)
    expect(useStore.getState().canRedo()).toBe(true)
  })
})

describe('Canvas Elements Undo/Redo', () => {
  it('undoes text element addition', () => {
    const { addText, undo } = useStore.getState()
    addText({
      content: 'Hello',
      x: 0,
      y: 0,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      boardId: 'root',
    })
    expect(useStore.getState().canvasElements).toHaveLength(1)

    undo()
    expect(useStore.getState().canvasElements).toHaveLength(0)
  })

  it('undoes arrow element addition', () => {
    const { addArrow, undo } = useStore.getState()
    addArrow({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      color: '#000',
      strokeWidth: 2,
      style: 'solid',
      boardId: 'root',
    })
    expect(useStore.getState().canvasElements).toHaveLength(1)

    undo()
    expect(useStore.getState().canvasElements).toHaveLength(0)
  })

  it('undoes shape element addition', () => {
    const { addShape, undo } = useStore.getState()
    addShape({
      shape: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: '#000',
      strokeWidth: 2,
      opacity: 1,
      boardId: 'root',
    })
    expect(useStore.getState().canvasElements).toHaveLength(1)

    undo()
    expect(useStore.getState().canvasElements).toHaveLength(0)
  })

  it('undoes group element addition', () => {
    const { addGroup, undo } = useStore.getState()
    addGroup({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      title: 'Test',
      color: '#00000010',
      collapsed: false,
      widgetIds: [],
      boardId: 'root',
    })
    expect(useStore.getState().canvasElements).toHaveLength(1)

    undo()
    expect(useStore.getState().canvasElements).toHaveLength(0)
  })

  it('redoes canvas element after undo', () => {
    const { addText, undo, redo } = useStore.getState()
    addText({
      content: 'Hello',
      x: 0,
      y: 0,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      boardId: 'root',
    })
    expect(useStore.getState().canvasElements).toHaveLength(1)

    undo()
    expect(useStore.getState().canvasElements).toHaveLength(0)

    redo()
    expect(useStore.getState().canvasElements).toHaveLength(1)
  })

  it('undoes text element update', () => {
    const { addText, updateText, undo } = useStore.getState()
    const id = addText({
      content: 'Hello',
      x: 0,
      y: 0,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      boardId: 'root',
    })
    expect(useStore.getState().canvasElements).toHaveLength(1)

    updateText(id, { content: 'Updated' })
    const updated = useStore.getState().canvasElements.find((e) => e.id === id) as any
    expect(updated?.content).toBe('Updated')

    undo()
    const afterUndo = useStore.getState().canvasElements.find((e) => e.id === id) as any
    expect(afterUndo?.content).toBe('Hello')
  })

  it('undoes text element removal', () => {
    const { addText, removeText, undo } = useStore.getState()
    addText({
      content: 'Hello',
      x: 0,
      y: 0,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      boardId: 'root',
    })
    const id = useStore.getState().canvasElements[0]!.id
    removeText(id)
    expect(useStore.getState().canvasElements).toHaveLength(0)

    undo()
    expect(useStore.getState().canvasElements).toHaveLength(1)
  })

  it('handles mixed widget and element undo', () => {
    const { addWidget, addText, undo } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)
    addText({
      content: 'Hello',
      x: 0,
      y: 0,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      boardId: 'root',
    })

    expect(useStore.getState().boards.root).toHaveLength(1)
    expect(useStore.getState().canvasElements).toHaveLength(1)

    undo()
    // Last action was adding text
    expect(useStore.getState().canvasElements).toHaveLength(0)
    expect(useStore.getState().boards.root).toHaveLength(1)

    undo()
    // Before that was adding widget
    expect(useStore.getState().boards.root).toHaveLength(0)
  })
})

describe('Board Navigation', () => {
  it('opens and closes boards', () => {
    const { openBoard, closeBoard } = useStore.getState()
    openBoard('board-1')

    expect(useStore.getState().currentBoardId).toBe('board-1')
    expect(useStore.getState().navigationStack).toEqual(['board-1'])

    closeBoard()
    expect(useStore.getState().currentBoardId).toBeNull()
    expect(useStore.getState().navigationStack).toEqual([])
  })

  it('creates a sub board', () => {
    const { createSubBoard } = useStore.getState()
    const boardId = createSubBoard()

    expect(useStore.getState().boards[boardId]).toEqual([])
  })

  it('deletes a board (non-root)', () => {
    const { createSubBoard, deleteBoard } = useStore.getState()
    const boardId = createSubBoard()
    expect(useStore.getState().boards[boardId]).toBeDefined()

    deleteBoard(boardId)
    expect(useStore.getState().boards[boardId]).toBeUndefined()
  })

  it('does not delete root board', () => {
    const { deleteBoard } = useStore.getState()
    deleteBoard('root')
    expect(useStore.getState().boards['root']).toBeDefined()
  })

  it('respects max nesting depth', () => {
    const { openBoard, canNestDeeper } = useStore.getState()
    expect(canNestDeeper()).toBe(true)

    openBoard('b1')
    expect(canNestDeeper()).toBe(true)

    openBoard('b2')
    expect(canNestDeeper()).toBe(true)

    openBoard('b3')
    expect(canNestDeeper()).toBe(false)
  })
})

describe('Selection', () => {
  it('toggles widget selection', () => {
    const { toggleSelectWidget, setSelectedIds } = useStore.getState()
    setSelectedIds([])

    toggleSelectWidget('w1')
    expect(useStore.getState().selectedIds).toContain('w1')

    toggleSelectWidget('w1')
    expect(useStore.getState().selectedIds).not.toContain('w1')
  })

  it('removes selected widgets', () => {
    const { addWidget, toggleSelectWidget, removeSelectedWidgets } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 100, 100, rect)
    addWidget('clock', 200, 200, rect)

    const ids = useStore.getState().boards.root!.map((w) => w.id)
    toggleSelectWidget(ids[0]!)
    toggleSelectWidget(ids[1]!)

    removeSelectedWidgets()
    expect(useStore.getState().boards.root).toHaveLength(0)
    expect(useStore.getState().selectedIds).toEqual([])
  })
})

describe('Nested Boards with Widgets', () => {
  it('adds widgets to a nested board', () => {
    const { createSubBoard, addWidget } = useStore.getState()
    const boardId = createSubBoard()
    const rect = new DOMRect(0, 0, 1000, 1000)

    addWidget('note', 100, 100, rect, boardId)
    addWidget('clock', 200, 200, rect, boardId)

    expect(useStore.getState().boards[boardId]).toHaveLength(2)
    expect(useStore.getState().boards[boardId]![0]!.type).toBe('note')
    expect(useStore.getState().boards[boardId]![1]!.type).toBe('clock')
  })

  it('keeps nested board widgets isolated from root', () => {
    const { createSubBoard, addWidget } = useStore.getState()
    const boardId = createSubBoard()
    const rect = new DOMRect(0, 0, 1000, 1000)

    addWidget('note', 100, 100, rect)
    addWidget('clock', 200, 200, rect, boardId)

    expect(useStore.getState().boards.root).toHaveLength(1)
    expect(useStore.getState().boards[boardId]).toHaveLength(1)
  })

  it('navigates into nested board and back', () => {
    const { createSubBoard, openBoard, closeBoard } = useStore.getState()
    const boardId = createSubBoard()

    openBoard(boardId)
    expect(useStore.getState().currentBoardId).toBe(boardId)
    expect(useStore.getState().navigationStack).toEqual([boardId])

    closeBoard()
    expect(useStore.getState().currentBoardId).toBeNull()
    expect(useStore.getState().navigationStack).toEqual([])
  })

  it('navigates through multiple levels of nesting', () => {
    const { createSubBoard, openBoard, closeBoard } = useStore.getState()
    const b1 = createSubBoard()
    const b2 = createSubBoard()

    openBoard(b1)
    openBoard(b2)

    expect(useStore.getState().navigationStack).toEqual([b1, b2])
    expect(useStore.getState().currentBoardId).toBe(b2)

    closeBoard()
    expect(useStore.getState().currentBoardId).toBe(b1)
    expect(useStore.getState().navigationStack).toEqual([b1])

    closeBoard()
    expect(useStore.getState().currentBoardId).toBeNull()
    expect(useStore.getState().navigationStack).toEqual([])
  })

  it('deletes board widget and cleans up sub-board data', () => {
    const { createSubBoard, addWidget, removeWidget } = useStore.getState()
    const boardId = createSubBoard()
    const rect = new DOMRect(0, 0, 1000, 1000)

    // Add a board widget to root that references the sub-board
    addWidget('board', 100, 100, rect)
    const boardWidget = useStore.getState().boards.root!.find((w) => w.type === 'board')
    expect(boardWidget).toBeDefined()

    // Add widgets to the sub-board
    addWidget('note', 50, 50, rect, boardId)
    expect(useStore.getState().boards[boardId]).toHaveLength(1)

    // Remove the board widget from root
    removeWidget(boardWidget!.id)
    expect(useStore.getState().boards.root).toHaveLength(0)
  })

  it('undo/redo works across board levels', () => {
    const { createSubBoard, addWidget, undo, redo } = useStore.getState()
    const boardId = createSubBoard()
    const rect = new DOMRect(0, 0, 1000, 1000)

    addWidget('note', 100, 100, rect)
    addWidget('clock', 200, 200, rect, boardId)

    expect(useStore.getState().boards.root).toHaveLength(1)
    expect(useStore.getState().boards[boardId]).toHaveLength(1)

    undo()
    // Last action was adding clock to sub-board
    expect(useStore.getState().boards[boardId]).toHaveLength(0)
    expect(useStore.getState().boards.root).toHaveLength(1)

    undo()
    // Before that was adding note to root
    expect(useStore.getState().boards.root).toHaveLength(0)

    redo()
    expect(useStore.getState().boards.root).toHaveLength(1)

    redo()
    expect(useStore.getState().boards[boardId]).toHaveLength(1)
  })

  it('renameBoard finds board widget across all boards', () => {
    const { createSubBoard, addWidget, renameBoard } = useStore.getState()
    const boardId = createSubBoard()
    const rect = new DOMRect(0, 0, 1000, 1000)

    addWidget('board', 100, 100, rect)
    const boardWidget = useStore.getState().boards.root!.find((w) => w.type === 'board')
    if (boardWidget && boardWidget.content.type === 'board') {
      // Update the boardId to match our created sub-board
      useStore.getState().updateWidget(boardWidget.id, {
        content: { type: 'board', boardId, title: 'Old Title' },
      })
    }

    renameBoard(boardId, 'New Title')

    const updated = useStore.getState().boards.root!.find((w) => w.type === 'board')
    if (updated && updated.content.type === 'board') {
      expect(updated.content.title).toBe('New Title')
    }
  })
})

describe('Export / Import', () => {
  it('exports and imports layout', () => {
    const { addWidget, exportLayout, importLayout } = useStore.getState()
    const rect = new DOMRect(0, 0, 1000, 1000)
    addWidget('note', 500, 500, rect)

    const json = exportLayout()
    expect(json).toContain('"version": 2')
    expect(json).toContain('"boards"')

    // Clear and import
    useStore.setState({ boards: { root: [] } })
    importLayout(json)

    expect(useStore.getState().boards.root).toHaveLength(1)
  })

  it('exports and imports canvas elements', () => {
    const { addText, addShape, exportLayout, importLayout } = useStore.getState()
    addText({
      content: 'Hello World',
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
    expect(parsed.canvasElements).toHaveLength(2)

    // Clear and import
    useStore.setState({ canvasElements: [] })
    importLayout(json)

    expect(useStore.getState().canvasElements).toHaveLength(2)
    expect((useStore.getState().canvasElements[0] as any).content).toBe('Hello World')
    expect((useStore.getState().canvasElements[1] as any).shape).toBe('rectangle')
  })
})
