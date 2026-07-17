import type { StateCreator } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Widget } from '../types'
import type { WidgetStore } from './useStore'
import { ROOT_BOARD_ID } from './useStore'

const MAX_NESTING_DEPTH = 3

type BoardsState = Record<string, Widget[]>

export interface BoardSlice {
  boards: BoardsState
  currentBoardId: string | null
  navigationStack: string[]
  openBoard: (boardId: string) => void
  closeBoard: () => void
  createSubBoard: () => string
  deleteBoard: (boardId: string) => void
  renameBoard: (boardId: string, title: string) => void
  canNestDeeper: () => boolean
}

export const createBoardSlice: StateCreator<WidgetStore, [], [], BoardSlice> = (set, get) => ({
  boards: { [ROOT_BOARD_ID]: [] },
  currentBoardId: null,
  navigationStack: [],

  openBoard: (boardId) => {
    const { navigationStack } = get()
    set({
      currentBoardId: boardId,
      navigationStack: [...navigationStack, boardId],
      selectedIds: [],
    })
  },

  closeBoard: () => {
    const { navigationStack } = get()
    const newStack = navigationStack.slice(0, -1)
    const parentId = newStack.length > 0 ? newStack[newStack.length - 1] : null
    set({
      currentBoardId: parentId,
      navigationStack: newStack,
      selectedIds: [],
    })
  },

  createSubBoard: () => {
    const boardId = uuidv4()
    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: [],
      },
    }))
    get().forcePushHistory()
    return boardId
  },

  deleteBoard: (boardId) => {
    if (boardId === ROOT_BOARD_ID) return
    set((s) => {
      const { [boardId]: _removed, ...rest } = s.boards
      const cleaned: BoardsState = {}
      for (const [bid, widgets] of Object.entries(rest)) {
        cleaned[bid] = widgets.filter((w) => {
          if (w.type === 'board' && w.content.type === 'board' && w.content.boardId === boardId) {
            return false
          }
          return true
        })
      }
      return { boards: cleaned }
    })
    get().forcePushHistory()
  },

  renameBoard: (boardId, title) => {
    const state = get()
    for (const [bid, widgets] of Object.entries(state.boards)) {
      const boardWidget = widgets.find(
        (w) => w.type === 'board' && w.content.type === 'board' && w.content.boardId === boardId
      )
      if (boardWidget && boardWidget.content.type === 'board') {
        set((s) => ({
          boards: {
            ...s.boards,
            [bid]: (s.boards[bid] ?? []).map((w) =>
              w.id === boardWidget.id ? { ...w, content: { ...w.content, title } } : w
            ),
          },
        }))
        get().forcePushHistory()
        return
      }
    }
  },

  canNestDeeper: () => {
    return get().navigationStack.length < MAX_NESTING_DEPTH
  },
})
