import type { StateCreator } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Widget, WidgetType } from '../types'
import type { WidgetStore } from './useStore'
import { ROOT_BOARD_ID } from './useStore'
import { snapToGrid, findNonOverlappingPosition, defaultContent, defaultSize } from './utils'

function getActiveBoardId(state: WidgetStore): string {
  return state.currentBoardId ?? ROOT_BOARD_ID
}

function getWidgetsForBoard(boards: Record<string, Widget[]>, boardId: string): Widget[] {
  return boards[boardId] ?? []
}

export interface WidgetSlice {
  addWidget: (
    type: WidgetType,
    screenX: number,
    screenY: number,
    containerRect: DOMRect,
    targetBoardId?: string
  ) => void
  updateWidget: (id: string, data: Partial<Widget>, targetBoardId?: string) => void
  removeWidget: (id: string, targetBoardId?: string) => void
  moveWidget: (id: string, x: number, y: number, targetBoardId?: string) => void
  resizeWidget: (id: string, width: number, height: number, targetBoardId?: string) => void
  resizeWidgetWithPosition: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    targetBoardId?: string
  ) => void
  duplicateWidget: (id: string, targetBoardId?: string) => void
  toggleLockWidget: (id: string, targetBoardId?: string) => void
  bringToFront: (id: string, targetBoardId?: string) => void
  sendToBack: (id: string, targetBoardId?: string) => void
}

export const createWidgetSlice: StateCreator<WidgetStore, [], [], WidgetSlice> = (set, get) => ({
  addWidget: (type, screenX, screenY, containerRect, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    const canvasX = (screenX - containerRect.left - state.canvasOffset.x) / state.canvasScale
    const canvasY = (screenY - containerRect.top - state.canvasOffset.y) / state.canvasScale
    const id = uuidv4()
    const size = defaultSize(type)
    let x = canvasX - size.width / 2
    let y = canvasY - size.height / 2

    if (state.snapEnabled) {
      x = snapToGrid(x)
      y = snapToGrid(y)
    }

    const boardWidgets = getWidgetsForBoard(state.boards, boardId)

    if (state.collisionEnabled) {
      const tempWidget: Widget = {
        id,
        type,
        x,
        y,
        ...size,
        content: defaultContent(type),
        locked: false,
      }
      const pos = findNonOverlappingPosition(tempWidget, boardWidgets, x, y, state.snapEnabled)
      x = pos.x
      y = pos.y
    }

    const newWidget: Widget = {
      id,
      type,
      x,
      y,
      ...size,
      content: defaultContent(type),
      locked: false,
    }
    set((prevState) => ({
      boards: {
        ...prevState.boards,
        [boardId]: [...(prevState.boards[boardId] ?? []), newWidget],
      },
    }))
    get().forcePushHistory()
  },

  updateWidget: (id, data, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: (s.boards[boardId] ?? []).map((w) => (w.id === id ? { ...w, ...data } : w)),
      },
    }))
    get().pushHistory()
  },

  removeWidget: (id, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: (s.boards[boardId] ?? []).filter((w) => w.id !== id),
      },
    }))
    get().forcePushHistory()
  },

  moveWidget: (id, x, y, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    const boardWidgets = getWidgetsForBoard(state.boards, boardId)
    const widget = boardWidgets.find((w) => w.id === id)
    if (widget?.locked) return

    const finalX = state.snapEnabled ? snapToGrid(x) : x
    const finalY = state.snapEnabled ? snapToGrid(y) : y

    let resolvedX = finalX
    let resolvedY = finalY

    if (state.collisionEnabled && widget) {
      const tempWidget = { ...widget }
      const pos = findNonOverlappingPosition(
        tempWidget,
        boardWidgets,
        finalX,
        finalY,
        state.snapEnabled
      )
      resolvedX = pos.x
      resolvedY = pos.y
    }

    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: (s.boards[boardId] ?? []).map((w) =>
          w.id === id ? { ...w, x: resolvedX, y: resolvedY } : w
        ),
      },
    }))
    get().forcePushHistory()
  },

  resizeWidget: (id, width, height, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    const widget = getWidgetsForBoard(state.boards, boardId).find((w) => w.id === id)
    if (widget?.locked) return

    const finalW = state.snapEnabled ? snapToGrid(Math.max(150, width)) : Math.max(150, width)
    const finalH = state.snapEnabled ? snapToGrid(Math.max(80, height)) : Math.max(80, height)
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: (s.boards[boardId] ?? []).map((w) =>
          w.id === id ? { ...w, width: finalW, height: finalH } : w
        ),
      },
    }))
    get().forcePushHistory()
  },

  resizeWidgetWithPosition: (id, x, y, width, height, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    const widget = getWidgetsForBoard(state.boards, boardId).find((w) => w.id === id)
    if (widget?.locked) return

    const finalW = state.snapEnabled ? snapToGrid(Math.max(150, width)) : Math.max(150, width)
    const finalH = state.snapEnabled ? snapToGrid(Math.max(80, height)) : Math.max(80, height)
    const finalX = state.snapEnabled ? snapToGrid(x) : x
    const finalY = state.snapEnabled ? snapToGrid(y) : y
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: (s.boards[boardId] ?? []).map((w) =>
          w.id === id ? { ...w, x: finalX, y: finalY, width: finalW, height: finalH } : w
        ),
      },
    }))
  },

  duplicateWidget: (id, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    const widget = getWidgetsForBoard(state.boards, boardId).find((w) => w.id === id)
    if (!widget) return
    const newId = uuidv4()
    const newX = widget.x + 30
    const newY = widget.y + 30
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: [...(s.boards[boardId] ?? []), { ...widget, id: newId, x: newX, y: newY }],
      },
    }))
    get().forcePushHistory()
  },

  toggleLockWidget: (id, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: (s.boards[boardId] ?? []).map((w) =>
          w.id === id ? { ...w, locked: !w.locked } : w
        ),
      },
    }))
    get().forcePushHistory()
  },

  bringToFront: (id, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    set((s) => {
      const widgets = s.boards[boardId] ?? []
      const idx = widgets.findIndex((w) => w.id === id)
      if (idx === -1 || idx === widgets.length - 1) return s
      const widget = widgets[idx]!
      const rest = widgets.filter((w) => w.id !== id)
      return {
        boards: { ...s.boards, [boardId]: [...rest, widget] },
      }
    })
    get().forcePushHistory()
  },

  sendToBack: (id, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? getActiveBoardId(state)
    set((s) => {
      const widgets = s.boards[boardId] ?? []
      const idx = widgets.findIndex((w) => w.id === id)
      if (idx <= 0) return s
      const widget = widgets[idx]!
      const rest = widgets.filter((w) => w.id !== id)
      return {
        boards: { ...s.boards, [boardId]: [widget, ...rest] },
      }
    })
    get().forcePushHistory()
  },
})
