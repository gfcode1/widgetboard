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

describe('elementsSlice', () => {
  describe('groups', () => {
    it('adds a group', () => {
      const { addGroup } = useStore.getState()
      const id = addGroup({
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        title: 'Test Group',
        color: '#00000010',
        collapsed: false,
        widgetIds: [],
        boardId: 'root',
      })
      expect(useStore.getState().canvasElements).toHaveLength(1)
      expect(useStore.getState().canvasElements[0]!.id).toBe(id)
      expect(useStore.getState().canvasElements[0]!.type).toBe('group')
    })

    it('updates a group', () => {
      const { addGroup, updateGroup } = useStore.getState()
      const id = addGroup({
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        title: 'Test',
        color: '#00000010',
        collapsed: false,
        widgetIds: [],
        boardId: 'root',
      })
      updateGroup(id, { title: 'Updated Group' })
      expect((useStore.getState().canvasElements[0]! as any).title).toBe('Updated Group')
    })

    it('removes a group', () => {
      const { addGroup, removeGroup } = useStore.getState()
      const id = addGroup({
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        title: 'Test',
        color: '#00000010',
        collapsed: false,
        widgetIds: [],
        boardId: 'root',
      })
      expect(useStore.getState().canvasElements).toHaveLength(1)
      removeGroup(id)
      expect(useStore.getState().canvasElements).toHaveLength(0)
    })

    it('adds widget to group', () => {
      const { addGroup, addWidgetToGroup } = useStore.getState()
      // Set up a widget in the board
      useStore.setState({
        boards: {
          root: [
            {
              id: 'widget-1',
              type: 'note',
              x: 50,
              y: 50,
              width: 200,
              height: 150,
              content: { type: 'note', text: '' },
            },
          ],
        },
      })
      const id = addGroup({
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        title: 'Test',
        color: '#00000010',
        collapsed: false,
        widgetIds: [],
        boardId: 'root',
      })
      addWidgetToGroup(id, 'widget-1', 10, 10)
      expect((useStore.getState().canvasElements[0]! as any).widgetIds).toContain('widget-1')
      expect((useStore.getState().canvasElements[0]! as any).relativeWidgets['widget-1']).toEqual({
        relX: 10,
        relY: 10,
      })
    })

    it('removes widget from group', () => {
      const { addGroup, addWidgetToGroup, removeWidgetFromGroup } = useStore.getState()
      // Set up a widget in the board
      useStore.setState({
        boards: {
          root: [
            {
              id: 'widget-1',
              type: 'note',
              x: 50,
              y: 50,
              width: 200,
              height: 150,
              content: { type: 'note', text: '' },
            },
          ],
        },
      })
      const id = addGroup({
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        title: 'Test',
        color: '#00000010',
        collapsed: false,
        widgetIds: [],
        boardId: 'root',
      })
      addWidgetToGroup(id, 'widget-1', 10, 10)
      removeWidgetFromGroup(id, 'widget-1')
      expect((useStore.getState().canvasElements[0]! as any).widgetIds).toHaveLength(0)
      expect((useStore.getState().canvasElements[0]! as any).relativeWidgets).toEqual({})
    })
  })

  describe('texts', () => {
    it('adds text', () => {
      const { addText } = useStore.getState()
      const id = addText({
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
      expect(useStore.getState().canvasElements).toHaveLength(1)
      expect(useStore.getState().canvasElements[0]!.id).toBe(id)
      expect(useStore.getState().canvasElements[0]!.type).toBe('text')
    })

    it('updates text', () => {
      const { addText, updateText } = useStore.getState()
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
      updateText(id, { content: 'Updated' })
      expect((useStore.getState().canvasElements[0]! as any).content).toBe('Updated')
    })

    it('removes text', () => {
      const { addText, removeText } = useStore.getState()
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
      removeText(id)
      expect(useStore.getState().canvasElements).toHaveLength(0)
    })
  })

  describe('arrows', () => {
    it('adds arrow', () => {
      const { addArrow } = useStore.getState()
      const id = addArrow({
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
      expect(useStore.getState().canvasElements[0]!.id).toBe(id)
      expect(useStore.getState().canvasElements[0]!.type).toBe('arrow')
    })

    it('updates arrow', () => {
      const { addArrow, updateArrow } = useStore.getState()
      const id = addArrow({
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 100,
        color: '#000',
        strokeWidth: 2,
        style: 'solid',
        boardId: 'root',
      })
      updateArrow(id, { color: '#ff0000' })
      expect((useStore.getState().canvasElements[0]! as any).color).toBe('#ff0000')
    })

    it('removes arrow', () => {
      const { addArrow, removeArrow } = useStore.getState()
      const id = addArrow({
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
      removeArrow(id)
      expect(useStore.getState().canvasElements).toHaveLength(0)
    })
  })

  describe('shapes', () => {
    it('adds shape', () => {
      const { addShape } = useStore.getState()
      const id = addShape({
        shape: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        fill: '#fff',
        stroke: '#000',
        strokeWidth: 2,
        opacity: 1,
        boardId: 'root',
      })
      expect(useStore.getState().canvasElements).toHaveLength(1)
      expect(useStore.getState().canvasElements[0]!.id).toBe(id)
      expect(useStore.getState().canvasElements[0]!.type).toBe('shape')
    })

    it('updates shape', () => {
      const { addShape, updateShape } = useStore.getState()
      const id = addShape({
        shape: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        fill: '#fff',
        stroke: '#000',
        strokeWidth: 2,
        opacity: 1,
        boardId: 'root',
      })
      updateShape(id, { fill: '#ff0000' })
      expect((useStore.getState().canvasElements[0]! as any).fill).toBe('#ff0000')
    })

    it('removes shape', () => {
      const { addShape, removeShape } = useStore.getState()
      const id = addShape({
        shape: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        fill: '#fff',
        stroke: '#000',
        strokeWidth: 2,
        opacity: 1,
        boardId: 'root',
      })
      expect(useStore.getState().canvasElements).toHaveLength(1)
      removeShape(id)
      expect(useStore.getState().canvasElements).toHaveLength(0)
    })
  })

  describe('utility methods', () => {
    it('getMaxZIndex returns highest z-index', () => {
      const { addText, getMaxZIndex } = useStore.getState()
      expect(getMaxZIndex()).toBe(1)
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
      expect(getMaxZIndex()).toBe(2)
    })

    it('getCanvasElementsForBoard filters by boardId', () => {
      const { addText, getCanvasElementsForBoard } = useStore.getState()
      addText({
        content: 'Root',
        x: 0,
        y: 0,
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        boardId: 'root',
      })
      addText({
        content: 'Other',
        x: 0,
        y: 0,
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        boardId: 'other-board',
      })
      expect(getCanvasElementsForBoard('root')).toHaveLength(1)
      expect(getCanvasElementsForBoard('other-board')).toHaveLength(1)
      expect(getCanvasElementsForBoard('nonexistent')).toHaveLength(0)
    })

    it('moveElement updates coordinates', () => {
      const { addText, moveElement } = useStore.getState()
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
      moveElement(id, 50, 60)
      expect((useStore.getState().canvasElements[0]! as any).x).toBe(50)
      expect((useStore.getState().canvasElements[0]! as any).y).toBe(60)
    })
  })

  describe('undo/redo integration', () => {
    it('undoes addText', () => {
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

    it('redoes after undo', () => {
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
      undo()
      expect(useStore.getState().canvasElements).toHaveLength(0)
      redo()
      expect(useStore.getState().canvasElements).toHaveLength(1)
    })
  })
})
