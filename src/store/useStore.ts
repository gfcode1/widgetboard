import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Widget } from '../types'
import { createCanvasSlice, type CanvasSlice } from './canvasSlice'
import { createHistorySlice, type HistorySlice } from './historySlice'
import { createSelectionSlice, type SelectionSlice } from './selectionSlice'
import { createBoardSlice, type BoardSlice } from './boardSlice'
import { createWidgetSlice, type WidgetSlice } from './widgetSlice'
import { createExportSlice, type ExportSlice } from './exportSlice'
import { createElementsSlice, type ElementsSlice } from './elementsSlice'

export type BoardsState = Record<string, Widget[]>

export type WidgetStore = CanvasSlice & HistorySlice & SelectionSlice & BoardSlice & WidgetSlice & ExportSlice & ElementsSlice

const ROOT_BOARD_ID = 'root'

function migrateOldFormat(data: Record<string, unknown>): BoardsState {
  if (data.version === 1 && Array.isArray(data.widgets)) {
    return { [ROOT_BOARD_ID]: data.widgets as Widget[] }
  }
  if (data.boards && typeof data.boards === 'object') {
    return data.boards as BoardsState
  }
  return { [ROOT_BOARD_ID]: [] }
}

export const useStore = create<WidgetStore>()(
  persist(
    (...a) => ({
      ...createCanvasSlice(...a),
      ...createHistorySlice(...a),
      ...createSelectionSlice(...a),
      ...createBoardSlice(...a),
      ...createWidgetSlice(...a),
      ...createExportSlice(...a),
      ...createElementsSlice(...a),
    }),
    {
      name: 'widgetboard-v3',
      version: 4,
      migrate: (persisted: unknown, version: number | undefined) => {
        const data = persisted as Record<string, unknown>
        if (version === undefined || version < 2) {
          const boards = migrateOldFormat(data)
          return {
            ...data,
            boards,
            currentBoardId: null,
            navigationStack: [],
            canvasElements: [],
          } as Partial<WidgetStore>
        }
        if (version < 3) {
          return {
            ...data,
            canvasElements: [],
          } as Partial<WidgetStore>
        }
        if (version < 4) {
          const elements = Array.isArray(data.canvasElements)
            ? (data.canvasElements as Array<Record<string, unknown>>).map(el => ({
                ...el,
                boardId: el.boardId ?? 'root',
              }))
            : []
          return {
            ...data,
            canvasElements: elements,
          } as Partial<WidgetStore>
        }
        return data as Partial<WidgetStore>
      },
      partialize: (state) => ({
        boards: state.boards,
        snapEnabled: state.snapEnabled,
        collisionEnabled: state.collisionEnabled,
        canvasElements: state.canvasElements,
      }),
    }
  )
)

export { ROOT_BOARD_ID }
