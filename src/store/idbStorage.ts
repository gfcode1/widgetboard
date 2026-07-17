import type { StateStorage } from 'zustand/middleware'
import { getBoardData, setBoardData, deleteBoardData, clearAllData } from '../utils/dataStore'
import { ROOT_BOARD_ID } from './constants'

interface PersistedState {
  state: {
    boards?: Record<string, unknown>
    canvasElements?: unknown[]
    history?: unknown[]
    canvasOffset?: { x: number; y: number }
    canvasScale?: number
    currentBoardId?: string | null
    navigationStack?: string[]
    historyIndex?: number
    lastPushTime?: number
    editMode?: boolean
    snapEnabled?: boolean
    collisionEnabled?: boolean
    selectedIds?: string[]
    selectedWidgetId?: string | null
    selectedElementId?: string | null
  }
  version: number
}

async function saveBoardsToIDB(boards: Record<string, unknown> | undefined): Promise<void> {
  if (!boards) return
  const entries = Object.entries(boards)
  await Promise.all(entries.map(([id, data]) => setBoardData(id, data)))
}

async function loadBoardsFromIDB(): Promise<Record<string, unknown>> {
  const boards: Record<string, unknown> = {}
  try {
    const dbRequest = indexedDB.open('widgetboard-data', 1)
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(dbRequest.result)
      dbRequest.onerror = () => reject(dbRequest.error)
    })
    const tx = db.transaction('boards', 'readonly')
    const store = tx.objectStore('boards')
    const keys = await new Promise<string[]>((resolve, reject) => {
      const req = store.getAllKeys()
      req.onsuccess = () => resolve(req.result as string[])
      req.onerror = () => reject(req.error)
    })
    await Promise.all(
      keys.map(async (key) => {
        boards[key] = await getBoardData(key)
      })
    )
  } catch {
    // IndexedDB not available, fallback to empty
  }
  return boards
}

export function createIDBStorage(): StateStorage {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const raw = localStorage.getItem(name)
      if (!raw) return null

      try {
        const parsed = JSON.parse(raw) as PersistedState

        if (parsed.state?.boards) {
          const idbBoards = await loadBoardsFromIDB()
          if (Object.keys(idbBoards).length > 0) {
            parsed.state.boards = idbBoards
          }
        }

        return JSON.stringify(parsed)
      } catch {
        return raw
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const parsed = JSON.parse(value) as PersistedState

        if (parsed.state?.boards) {
          const { boards, ...rest } = parsed.state
          const lightState = JSON.stringify({ ...parsed, state: rest })

          try {
            const existingRaw = localStorage.getItem(name)
            if (existingRaw) {
              const existing = JSON.parse(existingRaw) as PersistedState
              const oldBoards = existing.state?.boards ?? {}

              // Delete removed boards
              const newKeys = Object.keys(boards as Record<string, unknown>)
              for (const key of Object.keys(oldBoards)) {
                if (!newKeys.includes(key) && key !== ROOT_BOARD_ID) {
                  await deleteBoardData(key)
                }
              }
            }
          } catch {}

          await saveBoardsToIDB(boards as Record<string, unknown>)
          localStorage.setItem(name, lightState)
        } else {
          localStorage.setItem(name, value)
        }
      } catch {
        localStorage.setItem(name, value)
      }
    },

    removeItem: async (name: string): Promise<void> => {
      localStorage.removeItem(name)
      try {
        await clearAllData()
      } catch {}
    },
  }
}
