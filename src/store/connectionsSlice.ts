import type { StateCreator } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { WidgetStore } from './useStore'

export interface WidgetConnection {
  id: string
  fromWidgetId: string
  toWidgetId: string
}

export interface ConnectionsSlice {
  connections: WidgetConnection[]
  addConnection: (fromWidgetId: string, toWidgetId: string) => void
  removeConnection: (id: string) => void
  getConnectionTargets: (widgetId: string) => string[]
}

export const createConnectionsSlice: StateCreator<WidgetStore, [], [], ConnectionsSlice> = (
  set,
  get
) => ({
  connections: [],

  addConnection: (fromWidgetId, toWidgetId) => {
    const id = uuidv4()
    const connection: WidgetConnection = { id, fromWidgetId, toWidgetId }
    set((s) => ({ connections: [...s.connections, connection] }))
  },

  removeConnection: (id) => {
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }))
  },

  getConnectionTargets: (widgetId) => {
    return get()
      .connections.filter((c) => c.fromWidgetId === widgetId)
      .map((c) => c.toWidgetId)
  },
})
