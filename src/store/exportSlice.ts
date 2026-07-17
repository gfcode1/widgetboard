import type { StateCreator } from 'zustand'
import type { Widget } from '../types'
import type { WidgetStore } from './useStore'
import { ROOT_BOARD_ID } from './useStore'

export interface ExportSlice {
  exportLayout: () => string
  importLayout: (json: string) => void
}

export const createExportSlice: StateCreator<WidgetStore, [], [], ExportSlice> = (set, get) => ({
  exportLayout: () => {
    const { boards, canvasElements } = get()
    return JSON.stringify({ version: 2, boards, canvasElements }, null, 2)
  },

  importLayout: (json) => {
    try {
      const data = JSON.parse(json)
      let boards: Record<string, Widget[]>
      if (data.version === 2 && data.boards && typeof data.boards === 'object') {
        boards = data.boards
      } else if (data.version === 1 && Array.isArray(data.widgets)) {
        boards = { [ROOT_BOARD_ID]: data.widgets }
      } else {
        console.error('Invalid layout JSON')
        return
      }
      const update: Partial<WidgetStore> = {
        boards,
        selectedIds: [],
        currentBoardId: null,
        navigationStack: [],
      }
      if (data.canvasElements && Array.isArray(data.canvasElements)) {
        update.canvasElements = data.canvasElements
      }
      set(update as WidgetStore)
      get().forcePushHistory()
    } catch {
      console.error('Invalid layout JSON')
    }
  },
})
