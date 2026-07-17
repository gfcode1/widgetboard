import { useCallback, useMemo } from 'react'
import { useStore } from '../store/useStore'

export function useWidgetConnection(widgetId: string) {
  const connections = useStore((s) => s.connections)
  const addConnection = useStore((s) => s.addConnection)
  const removeConnection = useStore((s) => s.removeConnection)
  const stores = useStore((s) => s.boards)
  const currentBoardId = useStore((s) => s.currentBoardId)

  const targetIds = useMemo(
    () => connections.filter((c) => c.fromWidgetId === widgetId).map((c) => c.toWidgetId),
    [connections, widgetId]
  )

  const sourceIds = useMemo(
    () => connections.filter((c) => c.toWidgetId === widgetId).map((c) => c.fromWidgetId),
    [connections, widgetId]
  )

  const connectedWidgets = useMemo(() => {
    const boardId = currentBoardId ?? 'root'
    const boardWidgets = stores[boardId] ?? []
    return targetIds.map((id) => boardWidgets.find((w) => w.id === id)).filter(Boolean)
  }, [targetIds, stores, currentBoardId])

  const connectTo = useCallback(
    (targetWidgetId: string) => {
      if (targetIds.includes(targetWidgetId)) return
      if (targetWidgetId === widgetId) return
      addConnection(widgetId, targetWidgetId)
    },
    [widgetId, targetIds, addConnection]
  )

  const disconnect = useCallback(
    (targetWidgetId: string) => {
      const conn = connections.find(
        (c) => c.fromWidgetId === widgetId && c.toWidgetId === targetWidgetId
      )
      if (conn) removeConnection(conn.id)
    },
    [widgetId, connections, removeConnection]
  )

  return {
    targetIds,
    sourceIds,
    connectedWidgets,
    connectTo,
    disconnect,
  }
}
