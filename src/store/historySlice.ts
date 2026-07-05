import type { StateCreator } from 'zustand'
import type { Widget } from '../types'
import type { WidgetStore } from './useStore'

type BoardsState = Record<string, Widget[]>

const MAX_HISTORY = 50
const HISTORY_THROTTLE_MS = 300

export interface HistorySlice {
  history: BoardsState[]
  historyIndex: number
  lastPushTime: number
  pushHistory: () => void
  forcePushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

export const createHistorySlice: StateCreator<WidgetStore, [], [], HistorySlice> = (set, get) => ({
  history: [{ root: [] }],
  historyIndex: 0,
  lastPushTime: 0,

  pushHistory: () => {
    const { boards, history, historyIndex, lastPushTime } = get()
    const now = Date.now()
    if (now - lastPushTime < HISTORY_THROTTLE_MS) return
    const snapshot = structuredClone(boards)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(snapshot)
    if (newHistory.length > MAX_HISTORY) newHistory.shift()
    set({ history: newHistory, historyIndex: newHistory.length - 1, lastPushTime: now })
  },

  forcePushHistory: () => {
    const { boards, history, historyIndex } = get()
    const snapshot = structuredClone(boards)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(snapshot)
    if (newHistory.length > MAX_HISTORY) newHistory.shift()
    set({ history: newHistory, historyIndex: newHistory.length - 1, lastPushTime: Date.now() })
  },

  undo: () => {
    const { historyIndex, history } = get()
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    set({ boards: structuredClone(history[newIndex]), historyIndex: newIndex })
  },

  redo: () => {
    const { historyIndex, history } = get()
    if (historyIndex >= history.length - 1) return
    const newIndex = historyIndex + 1
    set({ boards: structuredClone(history[newIndex]), historyIndex: newIndex })
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
})
