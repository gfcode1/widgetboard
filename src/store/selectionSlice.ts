import type { StateCreator } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Widget } from '../types'
import type { WidgetStore } from './useStore'
import { ROOT_BOARD_ID } from './useStore'
import { snapToGrid } from './utils'

function getActiveBoardId(state: WidgetStore): string {
  return state.currentBoardId ?? ROOT_BOARD_ID
}

export interface SelectionSlice {
  selectedIds: string[]
  selectedWidgetId: string | null
  setSelectedIds: (ids: string[]) => void
  setSelectedWidgetId: (id: string | null) => void
  toggleSelectWidget: (id: string) => void
  clearSelection: () => void
  moveSelectedWidgets: (dx: number, dy: number) => void
  removeSelectedWidgets: () => void
  duplicateSelectedWidgets: () => void
}

export const createSelectionSlice: StateCreator<WidgetStore, [], [], SelectionSlice> = (
  set,
  get
) => ({
  selectedIds: [],
  selectedWidgetId: null,

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setSelectedWidgetId: (id) => set({ selectedWidgetId: id }),

  toggleSelectWidget: (id) =>
    set((s) => {
      const exists = s.selectedIds.includes(id)
      return {
        selectedIds: exists ? s.selectedIds.filter((i) => i !== id) : [...s.selectedIds, id],
      }
    }),

  clearSelection: () => set({ selectedWidgetId: null, selectedIds: [] }),

  moveSelectedWidgets: (dx, dy) => {
    const state = get()
    const boardId = getActiveBoardId(state)
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: (s.boards[boardId] ?? []).map((w) =>
          s.selectedIds.includes(w.id) && !w.locked
            ? {
                ...w,
                x: state.snapEnabled ? snapToGrid(w.x + dx) : w.x + dx,
                y: state.snapEnabled ? snapToGrid(w.y + dy) : w.y + dy,
              }
            : w
        ),
      },
    }))
    get().forcePushHistory()
  },

  removeSelectedWidgets: () => {
    const state = get()
    if (state.selectedIds.length === 0) return
    const boardId = getActiveBoardId(state)
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: (s.boards[boardId] ?? []).filter((w) => !s.selectedIds.includes(w.id)),
      },
      selectedIds: [],
    }))
    get().forcePushHistory()
  },

  duplicateSelectedWidgets: () => {
    const state = get()
    if (state.selectedIds.length === 0) return
    const boardId = getActiveBoardId(state)
    const boardWidgets = state.boards[boardId] ?? []
    const newWidgets: Widget[] = []
    for (const id of state.selectedIds) {
      const widget = boardWidgets.find((w) => w.id === id)
      if (widget) {
        newWidgets.push({
          ...widget,
          id: uuidv4(),
          x: widget.x + 30,
          y: widget.y + 30,
        })
      }
    }
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: [...(s.boards[boardId] ?? []), ...newWidgets],
      },
    }))
    get().forcePushHistory()
  },
})
