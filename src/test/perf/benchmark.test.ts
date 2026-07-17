import { describe, it, expect } from 'vitest'
import { useStore } from '../../store/useStore'
import { ROOT_BOARD_ID } from '../../store/useStore'
import { snapToGrid, findNonOverlappingPosition, defaultSize } from '../../store/utils'
import type { Widget } from '../../types'
import { v4 as uuidv4 } from 'uuid'

function makeWidget(x: number, y: number): Widget {
  return {
    id: uuidv4(),
    type: 'note',
    x,
    y,
    width: defaultSize('note').width,
    height: defaultSize('note').height,
    locked: false,
    content: { type: 'note', text: 'bench' },
  }
}

describe('Performance Benchmarks', () => {
  describe('Widget CRUD on large boards', () => {
    it('adds 100 widgets under 200ms', () => {
      const widgets: Widget[] = Array.from({ length: 100 }, (_, i) => makeWidget(i * 50, 0))

      useStore.setState({
        boards: { [ROOT_BOARD_ID]: [] },
        currentBoardId: null,
        navigationStack: [],
        canvasElements: [],
        history: [{ boards: { [ROOT_BOARD_ID]: [] }, canvasElements: [], connections: [] }],
        historyIndex: 0,
        editMode: true,
        snapEnabled: false,
        collisionEnabled: false,
        lastPushTime: 0,
      } as never)

      const start = performance.now()
      useStore.setState({
        boards: { [ROOT_BOARD_ID]: widgets },
      })
      useStore.getState().forcePushHistory()
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(200)
      expect(useStore.getState().boards[ROOT_BOARD_ID] ?? []).toHaveLength(100)
    })

    it('undo on a board with 200 widgets under 50ms', () => {
      const widgets: Widget[] = Array.from({ length: 200 }, (_, i) => makeWidget(i * 30, 0))

      useStore.setState({
        boards: { [ROOT_BOARD_ID]: widgets },
        currentBoardId: null,
        navigationStack: [],
        canvasElements: [],
        history: [{ boards: { [ROOT_BOARD_ID]: widgets }, canvasElements: [], connections: [] }],
        historyIndex: 0,
        editMode: true,
        snapEnabled: false,
        collisionEnabled: false,
        lastPushTime: 0,
      } as never)

      const store = useStore.getState()
      store.forcePushHistory()

      // Remove half the widgets
      const reduced = widgets.slice(0, 100)
      useStore.setState({
        boards: { [ROOT_BOARD_ID]: reduced },
      })
      store.forcePushHistory()

      const start = performance.now()
      store.undo()
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(50)
      expect(useStore.getState().boards[ROOT_BOARD_ID] ?? []).toHaveLength(200)
    })

    it('snapToGrid is fast', () => {
      const start = performance.now()
      for (let i = 0; i < 10000; i++) {
        snapToGrid(i * 7.3)
      }
      expect(performance.now() - start).toBeLessThan(10)
    })

    it('findNonOverlappingPosition converges', () => {
      const boardWidgets: Widget[] = [makeWidget(0, 0), makeWidget(400, 0), makeWidget(800, 0)]

      const testWidget = makeWidget(0, 0)
      const pos = findNonOverlappingPosition(testWidget, boardWidgets, 0, 0, false)

      const hasOverlap = boardWidgets.some(
        (w) =>
          pos.x < w.x + w.width &&
          pos.x + testWidget.width > w.x &&
          pos.y < w.y + w.height &&
          pos.y + testWidget.height > w.y
      )
      expect(hasOverlap).toBe(false)
    })
  })
})
