import { tool, type PageAgentCore } from 'page-agent'
import { z } from 'zod/v4'
import { v4 as uuidv4 } from 'uuid'
import { useStore, ROOT_BOARD_ID } from '../store/useStore'
import { WIDGET_MAP } from '../widgets/registry'
import type { WidgetType } from '../types'

const WIDGET_TYPES = Object.keys(WIDGET_MAP) as WidgetType[]

export const widgetboardTools = {
  list_widget_types: tool({
    description:
      'List all available widget types you can add to the WidgetBoard canvas. Returns type name, label, and description.',
    inputSchema: z.object({}),
    execute: async function (this: PageAgentCore, _input, ctx) {
      ctx.signal.throwIfAborted()
      const types = WIDGET_TYPES.map((t) => ({
        type: t,
        label: WIDGET_MAP[t].label,
        description: WIDGET_MAP[t].description,
      }))
      return JSON.stringify(types)
    },
  }),

  list_widgets: tool({
    description:
      'List all widgets currently on the board canvas. Returns their id, type, position (x, y), size (width, height), and locked status.',
    inputSchema: z.object({}),
    execute: async function (this: PageAgentCore, _input, ctx) {
      ctx.signal.throwIfAborted()
      const state = useStore.getState()
      const boardId = state.currentBoardId ?? ROOT_BOARD_ID
      const widgets = (state.boards[boardId] ?? []).map((w) => ({
        id: w.id,
        type: w.type,
        x: w.x,
        y: w.y,
        width: w.width,
        height: w.height,
        locked: w.locked ?? false,
      }))
      if (widgets.length === 0) {
        return 'The canvas is empty. No widgets found.'
      }
      return JSON.stringify(widgets)
    },
  }),

  add_widget: tool({
    description:
      'Add a new widget to the WidgetBoard canvas. Use list_widget_types first to see valid type names. The widget will be placed at a free position if no coordinates are given.',
    inputSchema: z.object({
      type: z.enum(WIDGET_TYPES as [string, ...string[]]),
      x: z.number().optional().describe('X position on canvas. If omitted, auto-placed.'),
      y: z.number().optional().describe('Y position on canvas. If omitted, auto-placed.'),
    }),
    execute: async function (this: PageAgentCore, input, ctx) {
      ctx.signal.throwIfAborted()
      const state = useStore.getState()
      const boardId = state.currentBoardId ?? ROOT_BOARD_ID
      const boardWidgets = state.boards[boardId] ?? []
      const widgetType = input.type as WidgetType
      const meta = WIDGET_MAP[widgetType]

      // Determine position
      let x = input.x ?? 100 + Math.random() * 400
      let y = input.y ?? 100 + Math.random() * 300

      // Find non-overlapping position
      const GRID = 20
      const snap = (v: number) => Math.round(v / GRID) * GRID
      x = snap(x)
      y = snap(y)

      const test = { x, y, width: meta.defaultWidth, height: meta.defaultHeight }
      const hasOverlap = boardWidgets.some(
        (w) =>
          test.x < w.x + w.width &&
          test.x + test.width > w.x &&
          test.y < w.y + w.height &&
          test.y + test.height > w.y
      )
      if (hasOverlap) {
        for (let step = 1; step <= 30; step++) {
          for (const [dx, dy] of [
            [step, 0], [-step, 0], [0, step], [0, -step],
            [step, step], [-step, step], [step, -step], [-step, -step],
          ]) {
            const cx = snap(x + dx * GRID)
            const cy = snap(y + dy * GRID)
            const candidate = { x: cx, y: cy, width: meta.defaultWidth, height: meta.defaultHeight }
            const overlap = boardWidgets.some(
              (w) =>
                candidate.x < w.x + w.width &&
                candidate.x + candidate.width > w.x &&
                candidate.y < w.y + w.height &&
                candidate.y + candidate.height > w.y
            )
            if (!overlap) {
              x = cx
              y = cy
              break
            }
          }
        }
      }

      // Use addWidget with a fake screen position by manipulating store directly
      const id = uuidv4()
      const newWidget = {
        id,
        type: widgetType,
        x,
        y,
        width: meta.defaultWidth,
        height: meta.defaultHeight,
        content: meta.defaultContent(),
        locked: false,
      }

      state.forcePushHistory()
      useStore.setState((s) => ({
        boards: {
          ...s.boards,
          [boardId]: [...(s.boards[boardId] ?? []), newWidget],
        },
      }))

      return `Added ${meta.label} widget (id: ${id}) at position (${x}, ${y}) on the canvas.`
    },
  }),

  remove_widget: tool({
    description:
      'Remove a widget from the canvas by its id. Use list_widgets to find the id first.',
    inputSchema: z.object({
      id: z.string().describe('The widget id to remove'),
    }),
    execute: async function (this: PageAgentCore, input, ctx) {
      ctx.signal.throwIfAborted()
      const state = useStore.getState()
      const boardId = state.currentBoardId ?? ROOT_BOARD_ID
      const widget = (state.boards[boardId] ?? []).find((w) => w.id === input.id)
      if (!widget) {
        return `Widget with id "${input.id}" not found on the current board.`
      }
      state.removeWidget(input.id)
      return `Removed ${widget.type} widget (id: ${input.id}).`
    },
  }),

  move_widget: tool({
    description:
      'Move a widget to a new position on the canvas by its id.',
    inputSchema: z.object({
      id: z.string().describe('The widget id to move'),
      x: z.number().describe('New X position'),
      y: z.number().describe('New Y position'),
    }),
    execute: async function (this: PageAgentCore, input, ctx) {
      ctx.signal.throwIfAborted()
      const state = useStore.getState()
      const boardId = state.currentBoardId ?? ROOT_BOARD_ID
      const widget = (state.boards[boardId] ?? []).find((w) => w.id === input.id)
      if (!widget) {
        return `Widget with id "${input.id}" not found.`
      }
      if (widget.locked) {
        return `Widget "${input.id}" is locked and cannot be moved.`
      }
      state.moveWidget(input.id, input.x, input.y)
      return `Moved ${widget.type} widget to (${input.x}, ${input.y}).`
    },
  }),

  update_widget: tool({
    description:
      'Update the content of a widget. Use list_widgets to find the id, then provide the new content fields.',
    inputSchema: z.object({
      id: z.string().describe('The widget id to update'),
      content: z.record(z.string(), z.any()).describe('Partial content fields to update'),
    }),
    execute: async function (this: PageAgentCore, input, ctx) {
      ctx.signal.throwIfAborted()
      const state = useStore.getState()
      const boardId = state.currentBoardId ?? ROOT_BOARD_ID
      const widget = (state.boards[boardId] ?? []).find((w) => w.id === input.id)
      if (!widget) {
        return `Widget with id "${input.id}" not found.`
      }
      const newContent = { ...widget.content, ...input.content }
      state.updateWidget(input.id, { content: newContent as any })
      return `Updated ${widget.type} widget (id: ${input.id}).`
    },
  }),

  undo: tool({
    description: 'Undo the last action on the WidgetBoard.',
    inputSchema: z.object({}),
    execute: async function (this: PageAgentCore, _input, ctx) {
      ctx.signal.throwIfAborted()
      const state = useStore.getState()
      state.undo()
      return 'Undone last action.'
    },
  }),

  redo: tool({
    description: 'Redo the last undone action on the WidgetBoard.',
    inputSchema: z.object({}),
    execute: async function (this: PageAgentCore, _input, ctx) {
      ctx.signal.throwIfAborted()
      const state = useStore.getState()
      state.redo()
      return 'Redone last action.'
    },
  }),
}
