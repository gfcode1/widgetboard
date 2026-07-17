import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../../store/useStore'
import type { WidgetType } from '../../types'

describe('widgetboardTools', () => {
  beforeEach(() => {
    useStore.setState({
      boards: { root: [] },
      currentBoardId: null,
      navigationStack: [],
      canvasElements: [],
      history: [{ boards: { root: [] }, canvasElements: [], connections: [] }],
      historyIndex: 0,
      canvasOffset: { x: 0, y: 0 },
      canvasScale: 1,
      snapEnabled: false,
      collisionEnabled: false,
      editMode: true,
      selectedIds: [],
      selectedWidgetId: null,
      selectedElementId: null,
      lastPushTime: 0,
    })
  })

  describe('add_widget', () => {
    it('adds a widget to the root board', async () => {
      const { widgetboardTools } = await import('../../tools/widgetboardTools')

      const ctx = { signal: { throwIfAborted: () => {} } as AbortSignal }

      await widgetboardTools.add_widget.execute.call(
        { signal: ctx.signal } as never,
        { type: 'note' as WidgetType, x: 100, y: 200 },
        ctx
      )

      const widgets = useStore.getState().boards['root'] ?? []
      expect(widgets.length).toBe(1)
      expect(widgets[0]!.type).toBe('note')
    })
  })

  describe('list_widgets', () => {
    it('returns empty message when no widgets', async () => {
      const { widgetboardTools } = await import('../../tools/widgetboardTools')

      const ctx = { signal: { throwIfAborted: () => {} } as AbortSignal }

      const result = await widgetboardTools.list_widgets.execute.call(
        { signal: ctx.signal } as never,
        {},
        ctx
      )

      expect(result).toContain('empty')
    })
  })

  describe('list_widget_types', () => {
    it('returns all widget types', async () => {
      const { widgetboardTools } = await import('../../tools/widgetboardTools')

      const ctx = { signal: { throwIfAborted: () => {} } as AbortSignal }

      const result = await widgetboardTools.list_widget_types.execute.call(
        { signal: ctx.signal } as never,
        {},
        ctx
      )

      const types = JSON.parse(result) as Array<{ type: string }>
      expect(types.length).toBeGreaterThan(5)
    })
  })

  describe('remove_widget', () => {
    it('removes an existing widget', async () => {
      const { widgetboardTools } = await import('../../tools/widgetboardTools')

      const ctx = { signal: { throwIfAborted: () => {} } as AbortSignal }

      await widgetboardTools.add_widget.execute.call(
        { signal: ctx.signal } as never,
        { type: 'note' as WidgetType, x: 0, y: 0 },
        ctx
      )

      const widgets = useStore.getState().boards['root'] ?? []
      const widgetId = widgets[0]!.id

      await widgetboardTools.remove_widget.execute.call(
        { signal: ctx.signal } as never,
        { id: widgetId },
        ctx
      )

      expect(useStore.getState().boards['root'] ?? []).toHaveLength(0)
    })
  })

  describe('undo / redo', () => {
    it('can undo add_widget operation', async () => {
      const { widgetboardTools } = await import('../../tools/widgetboardTools')

      const ctx = { signal: { throwIfAborted: () => {} } as AbortSignal }

      await widgetboardTools.add_widget.execute.call(
        { signal: ctx.signal } as never,
        { type: 'note' as WidgetType, x: 0, y: 0 },
        ctx
      )

      expect(useStore.getState().boards['root'] ?? []).toHaveLength(1)

      await widgetboardTools.undo.execute.call({ signal: ctx.signal } as never, {}, ctx)

      expect(useStore.getState().boards['root'] ?? []).toHaveLength(0)
    })
  })
})
