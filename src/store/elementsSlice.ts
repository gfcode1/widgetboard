import type { StateCreator } from 'zustand'
import type { WidgetStore } from './useStore'
import type { GroupElement, TextElement, ArrowElement, ShapeElement, CanvasElement } from '../types'

export const GROUP_PADDING = 24
export const GROUP_TITLE_HEIGHT = 40
export const GROUP_MIN_WIDTH = 200
export const GROUP_MIN_HEIGHT = 100

export interface ElementsSlice {
  canvasElements: CanvasElement[]
  selectedElementId: string | null
  addGroup: (group: Omit<GroupElement, 'id' | 'zIndex' | 'type' | 'relativeWidgets'>) => string
  updateGroup: (id: string, updates: Partial<GroupElement>) => void
  removeGroup: (id: string) => void
  addWidgetToGroup: (
    groupId: string,
    widgetId: string,
    relX: number,
    relY: number,
    targetBoardId?: string
  ) => void
  removeWidgetFromGroup: (groupId: string, widgetId: string) => void
  removeWidgetFromGroupRel: (
    groupId: string,
    widgetId: string,
    targetBoardId?: string
  ) => { absX: number; absY: number } | null
  moveWidgetToGroup: (
    widgetId: string,
    groupId: string,
    relX: number,
    relY: number,
    targetBoardId?: string
  ) => void
  moveWidgetFromGroup: (widgetId: string, targetBoardId?: string) => void
  updateGroupAutoResize: (groupId: string) => void
  moveGroupWithWidgets: (groupId: string, dx: number, dy: number) => void
  ungroup: (groupId: string) => void
  addText: (text: Omit<TextElement, 'id' | 'zIndex' | 'type'>) => string
  updateText: (id: string, updates: Partial<TextElement>) => void
  removeText: (id: string) => void
  addArrow: (arrow: Omit<ArrowElement, 'id' | 'zIndex' | 'type'>) => string
  updateArrow: (id: string, updates: Partial<ArrowElement>) => void
  removeArrow: (id: string) => void
  addShape: (shape: Omit<ShapeElement, 'id' | 'zIndex' | 'type'>) => string
  updateShape: (id: string, updates: Partial<ShapeElement>) => void
  removeShape: (id: string) => void
  setSelectedElement: (id: string | null) => void
  removeSelectedElement: () => void
  moveElement: (id: string, x: number, y: number) => void
  getMaxZIndex: () => number
  getCanvasElementsForBoard: (boardId: string) => CanvasElement[]
}

let elementIdCounter = 0
function generateElementId(): string {
  elementIdCounter++
  return `element-${Date.now()}-${elementIdCounter}`
}

const GROUP_COLORS = [
  'rgba(139, 92, 246, 0.08)',
  'rgba(59, 130, 246, 0.08)',
  'rgba(16, 185, 129, 0.08)',
  'rgba(245, 158, 11, 0.08)',
  'rgba(239, 68, 68, 0.08)',
]

export const createElementsSlice: StateCreator<WidgetStore, [], [], ElementsSlice> = (
  set,
  get
) => ({
  canvasElements: [],
  selectedElementId: null,

  getMaxZIndex: () => {
    const elements = get().canvasElements
    if (elements.length === 0) return 1
    return Math.max(...elements.map((e) => e.zIndex)) + 1
  },

  getCanvasElementsForBoard: (boardId) => {
    return get().canvasElements.filter((e) => e.boardId === boardId)
  },

  addGroup: (group) => {
    const id = generateElementId()
    const zIndex = get().getMaxZIndex()
    const newGroup: GroupElement = {
      ...group,
      id,
      zIndex,
      type: 'group',
      relativeWidgets: {},
      widgetIds: [],
    }
    set((s) => ({ canvasElements: [...s.canvasElements, newGroup] }))
    get().forcePushHistory()
    return id
  },

  updateGroup: (id, updates) => {
    set((s) => ({
      canvasElements: s.canvasElements.map((e) =>
        e.id === id && e.type === 'group' ? { ...e, ...updates } : e
      ),
    }))
    get().forcePushHistory()
  },

  removeGroup: (id) => {
    const state = get()
    const group = state.canvasElements.find((e) => e.id === id && e.type === 'group') as
      GroupElement | undefined

    if (group) {
      // Free all widgets: convert relative coords back to absolute
      const boardId = group.boardId
      const widgetIds = Object.keys(group.relativeWidgets)

      set((s) => ({
        boards: {
          ...s.boards,
          [boardId]: (s.boards[boardId] ?? []).map((w) => {
            const rel = group.relativeWidgets[w.id]
            if (rel) {
              return { ...w, x: group.x + rel.relX, y: group.y + rel.relY }
            }
            return w
          }),
        },
        canvasElements: s.canvasElements.filter((e) => e.id !== id),
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
      }))
    } else {
      set((s) => ({
        canvasElements: s.canvasElements.filter((e) => e.id !== id),
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
      }))
    }
    get().forcePushHistory()
  },

  addWidgetToGroup: (groupId, widgetId, relX, relY, targetBoardId) => {
    set((s) => {
      const boardId = targetBoardId ?? s.currentBoardId ?? 'root'
      const widgets = s.boards[boardId] ?? []
      const widget = widgets.find((w) => w.id === widgetId)
      if (!widget) return s

      const group = s.canvasElements.find((e) => e.id === groupId && e.type === 'group') as
        GroupElement | undefined
      if (!group) return s

      const absX = group.x + relX
      const absY = group.y + relY

      return {
        boards: {
          ...s.boards,
          [boardId]: widgets.map((w) => (w.id === widgetId ? { ...w, x: absX, y: absY } : w)),
        },
        canvasElements: s.canvasElements.map((e) => {
          if (e.id === groupId && e.type === 'group') {
            return {
              ...e,
              widgetIds: [...e.widgetIds.filter((id) => id !== widgetId), widgetId],
              relativeWidgets: {
                ...e.relativeWidgets,
                [widgetId]: { relX, relY },
              },
            }
          }
          return e
        }),
      }
    })
    get().forcePushHistory()
  },

  removeWidgetFromGroup: (groupId, widgetId) => {
    set((s) => ({
      canvasElements: s.canvasElements.map((e) => {
        if (e.id === groupId && e.type === 'group') {
          const { [widgetId]: _, ...rest } = e.relativeWidgets
          return {
            ...e,
            widgetIds: e.widgetIds.filter((id) => id !== widgetId),
            relativeWidgets: rest,
          }
        }
        return e
      }),
    }))
    get().forcePushHistory()
  },

  removeWidgetFromGroupRel: (groupId, widgetId, targetBoardId) => {
    const state = get()
    const boardId = targetBoardId ?? state.currentBoardId ?? 'root'
    const group = state.canvasElements.find((e) => e.id === groupId && e.type === 'group') as
      GroupElement | undefined
    if (!group) return null

    const rel = group.relativeWidgets[widgetId]
    if (!rel) return null

    const absX = group.x + rel.relX
    const absY = group.y + rel.relY

    set((s) => {
      const { [widgetId]: _, ...restRel } = group.relativeWidgets
      return {
        boards: {
          ...s.boards,
          [boardId]: (s.boards[boardId] ?? []).map((w) =>
            w.id === widgetId ? { ...w, x: absX, y: absY } : w
          ),
        },
        canvasElements: s.canvasElements.map((e) => {
          if (e.id === groupId && e.type === 'group') {
            return {
              ...e,
              widgetIds: e.widgetIds.filter((id) => id !== widgetId),
              relativeWidgets: restRel,
            }
          }
          return e
        }),
      }
    })
    get().forcePushHistory()

    return { absX, absY }
  },

  moveWidgetToGroup: (widgetId, groupId, relX, relY, targetBoardId) => {
    // Remove from previous group if any
    const state = get()
    const prevGroup = state.canvasElements.find(
      (e) => e.type === 'group' && e.widgetIds.includes(widgetId)
    ) as GroupElement | undefined
    if (prevGroup) {
      // Just remove the association, don't move the widget
      get().removeWidgetFromGroup(prevGroup.id, widgetId)
    }

    // Add to new group
    get().addWidgetToGroup(groupId, widgetId, relX, relY, targetBoardId)
  },

  moveWidgetFromGroup: (widgetId, targetBoardId) => {
    const state = get()
    const group = state.canvasElements.find(
      (e) => e.type === 'group' && e.widgetIds.includes(widgetId)
    ) as GroupElement | undefined
    if (!group) return

    get().removeWidgetFromGroupRel(group.id, widgetId, targetBoardId)
  },

  updateGroupAutoResize: (groupId) => {
    set((s) => {
      const group = s.canvasElements.find((e) => e.id === groupId && e.type === 'group') as
        GroupElement | undefined
      if (!group) return s

      const entries = Object.entries(group.relativeWidgets)
      if (entries.length === 0) return s

      const boardId = group.boardId
      const widgets = s.boards[boardId] ?? []

      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      for (const [wid, rel] of entries) {
        const widget = widgets.find((w) => w.id === wid)
        if (!widget) continue
        minX = Math.min(minX, rel.relX)
        minY = Math.min(minY, rel.relY)
        maxX = Math.max(maxX, rel.relX + widget.width)
        maxY = Math.max(maxY, rel.relY + widget.height)
      }

      if (minX === Infinity) return s

      const newWidth = Math.max(GROUP_MIN_WIDTH, maxX - minX + GROUP_PADDING * 2)
      const newHeight = Math.max(GROUP_MIN_HEIGHT, maxY - minY + GROUP_PADDING + GROUP_TITLE_HEIGHT)

      return {
        canvasElements: s.canvasElements.map((e) => {
          if (e.id === groupId && e.type === 'group') {
            return { ...e, width: newWidth, height: newHeight }
          }
          return e
        }),
      }
    })
    get().forcePushHistory()
  },

  moveGroupWithWidgets: (groupId, dx, dy) => {
    set((s) => {
      const group = s.canvasElements.find((e) => e.id === groupId && e.type === 'group') as
        GroupElement | undefined
      if (!group) return s

      const boardId = group.boardId
      const widgetIds = Object.keys(group.relativeWidgets)

      return {
        canvasElements: s.canvasElements.map((e) => {
          if (e.id === groupId && e.type === 'group') {
            return { ...e, x: e.x + dx, y: e.y + dy }
          }
          return e
        }),
        boards: {
          ...s.boards,
          [boardId]: (s.boards[boardId] ?? []).map((w) => {
            if (widgetIds.includes(w.id)) {
              return { ...w, x: w.x + dx, y: w.y + dy }
            }
            return w
          }),
        },
      }
    })
    get().forcePushHistory()
  },

  ungroup: (groupId) => {
    const state = get()
    const group = state.canvasElements.find((e) => e.id === groupId && e.type === 'group') as
      GroupElement | undefined
    if (!group) return

    const boardId = group.boardId

    set((s) => ({
      boards: {
        ...s.boards,
        [boardId]: (s.boards[boardId] ?? []).map((w) => {
          const rel = group.relativeWidgets[w.id]
          if (rel) {
            return { ...w, x: group.x + rel.relX, y: group.y + rel.relY }
          }
          return w
        }),
      },
      canvasElements: s.canvasElements.filter((e) => e.id !== groupId),
      selectedElementId: s.selectedElementId === groupId ? null : s.selectedElementId,
    }))
    get().forcePushHistory()
  },

  addText: (text) => {
    const id = generateElementId()
    const zIndex = get().getMaxZIndex()
    const newText: TextElement = { ...text, id, zIndex, type: 'text' }
    set((s) => ({ canvasElements: [...s.canvasElements, newText] }))
    get().forcePushHistory()
    return id
  },

  updateText: (id, updates) => {
    set((s) => ({
      canvasElements: s.canvasElements.map((e) =>
        e.id === id && e.type === 'text' ? { ...e, ...updates } : e
      ),
    }))
    get().forcePushHistory()
  },

  removeText: (id) => {
    set((s) => ({
      canvasElements: s.canvasElements.filter((e) => e.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }))
    get().forcePushHistory()
  },

  addArrow: (arrow) => {
    const id = generateElementId()
    const zIndex = get().getMaxZIndex()
    const newArrow: ArrowElement = { ...arrow, id, zIndex, type: 'arrow' }
    set((s) => ({ canvasElements: [...s.canvasElements, newArrow] }))
    get().forcePushHistory()
    return id
  },

  updateArrow: (id, updates) => {
    set((s) => ({
      canvasElements: s.canvasElements.map((e) =>
        e.id === id && e.type === 'arrow' ? { ...e, ...updates } : e
      ),
    }))
    get().forcePushHistory()
  },

  removeArrow: (id) => {
    set((s) => ({
      canvasElements: s.canvasElements.filter((e) => e.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }))
    get().forcePushHistory()
  },

  addShape: (shape) => {
    const id = generateElementId()
    const zIndex = get().getMaxZIndex()
    const newShape: ShapeElement = { ...shape, id, zIndex, type: 'shape' }
    set((s) => ({ canvasElements: [...s.canvasElements, newShape] }))
    get().forcePushHistory()
    return id
  },

  updateShape: (id, updates) => {
    set((s) => ({
      canvasElements: s.canvasElements.map((e) =>
        e.id === id && e.type === 'shape' ? { ...e, ...updates } : e
      ),
    }))
    get().forcePushHistory()
  },

  removeShape: (id) => {
    set((s) => ({
      canvasElements: s.canvasElements.filter((e) => e.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }))
    get().forcePushHistory()
  },

  setSelectedElement: (id) => {
    set({ selectedElementId: id })
  },

  removeSelectedElement: () => {
    const { selectedElementId } = get()
    if (!selectedElementId) return
    const element = get().canvasElements.find((e) => e.id === selectedElementId)
    if (!element) return
    switch (element.type) {
      case 'group':
        get().removeGroup(selectedElementId)
        break
      case 'text':
        get().removeText(selectedElementId)
        break
      case 'arrow':
        get().removeArrow(selectedElementId)
        break
      case 'shape':
        get().removeShape(selectedElementId)
        break
    }
  },

  moveElement: (id, x, y) => {
    const state = get()
    const element = state.canvasElements.find((e) => e.id === id)
    if (!element) return

    if (element.type === 'group') {
      const dx = x - element.x
      const dy = y - element.y
      get().moveGroupWithWidgets(id, dx, dy)
      return
    }

    set((s) => ({
      canvasElements: s.canvasElements.map((e) => {
        if (e.id === id) {
          if (e.type === 'arrow') {
            const dx2 = x - e.startX
            const dy2 = y - e.startY
            return { ...e, startX: x, startY: y, endX: e.endX + dx2, endY: e.endY + dy2 }
          }
          return { ...e, x, y }
        }
        return e
      }),
    }))
    get().forcePushHistory()
  },
})

export { GROUP_COLORS }
