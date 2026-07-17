import type { StateCreator } from 'zustand'
import type { Widget, CanvasElement } from '../types'
import type { WidgetStore } from './useStore'
import type { WidgetConnection } from './connectionsSlice'

type BoardsState = Record<string, Widget[]>

interface HistorySnapshot {
  boards: BoardsState
  canvasElements: CanvasElement[]
  connections: WidgetConnection[]
}

const MAX_HISTORY = 50
const HISTORY_THROTTLE_MS = 300

export interface HistorySlice {
  history: HistorySnapshot[]
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
  history: [{ boards: { root: [] }, canvasElements: [], connections: [] }],
  historyIndex: 0,
  lastPushTime: 0,

  pushHistory: () => {
    const { boards, canvasElements, connections, history, historyIndex, lastPushTime } = get()
    const now = Date.now()
    if (now - lastPushTime < HISTORY_THROTTLE_MS) return
    const snapshot: HistorySnapshot = {
      boards: structuredClone(boards),
      canvasElements: structuredClone(canvasElements),
      connections: structuredClone(connections),
    }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(snapshot)
    if (newHistory.length > MAX_HISTORY) newHistory.shift()
    set({ history: newHistory, historyIndex: newHistory.length - 1, lastPushTime: now })
  },

  forcePushHistory: () => {
    const { boards, canvasElements, connections, history, historyIndex } = get()
    const snapshot: HistorySnapshot = {
      boards: structuredClone(boards),
      canvasElements: structuredClone(canvasElements),
      connections: structuredClone(connections),
    }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(snapshot)
    if (newHistory.length > MAX_HISTORY) newHistory.shift()
    set({ history: newHistory, historyIndex: newHistory.length - 1, lastPushTime: Date.now() })
  },

  undo: () => {
    const { historyIndex, history } = get()
    if (historyIndex <= 0) return
    const prev = history[historyIndex - 1]!
    set({
      boards: prev.boards,
      canvasElements: prev.canvasElements,
      connections: prev.connections,
      historyIndex: historyIndex - 1,
    })
  },

  redo: () => {
    const { historyIndex, history } = get()
    if (historyIndex >= history.length - 1) return
    const next = history[historyIndex + 1]!
    set({
      boards: next.boards,
      canvasElements: next.canvasElements,
      connections: next.connections,
      historyIndex: historyIndex + 1,
    })
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
})
