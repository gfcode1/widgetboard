import type { StateCreator } from 'zustand'
import type { WidgetStore } from './useStore'
import type { GroupElement, TextElement, ArrowElement, ShapeElement, CanvasElement } from '../types'

export interface ElementsSlice {
  canvasElements: CanvasElement[]
  selectedElementId: string | null
  addGroup: (group: Omit<GroupElement, 'id' | 'zIndex'>) => string
  updateGroup: (id: string, updates: Partial<GroupElement>) => void
  removeGroup: (id: string) => void
  addWidgetToGroup: (groupId: string, widgetId: string) => void
  removeWidgetFromGroup: (groupId: string, widgetId: string) => void
  addText: (text: Omit<TextElement, 'id' | 'zIndex'>) => string
  updateText: (id: string, updates: Partial<TextElement>) => void
  removeText: (id: string) => void
  addArrow: (arrow: Omit<ArrowElement, 'id' | 'zIndex'>) => string
  updateArrow: (id: string, updates: Partial<ArrowElement>) => void
  removeArrow: (id: string) => void
  addShape: (shape: Omit<ShapeElement, 'id' | 'zIndex'>) => string
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

export const createElementsSlice: StateCreator<WidgetStore, [], [], ElementsSlice> = (set, get) => ({
  canvasElements: [],
  selectedElementId: null,

  getMaxZIndex: () => {
    const elements = get().canvasElements
    if (elements.length === 0) return 1
    return Math.max(...elements.map(e => e.zIndex)) + 1
  },

  getCanvasElementsForBoard: (boardId) => {
    return get().canvasElements.filter(e => e.boardId === boardId)
  },

  addGroup: (group) => {
    const id = generateElementId()
    const zIndex = get().getMaxZIndex()
    const newGroup: GroupElement = { ...group, id, zIndex }
    set((s) => ({ canvasElements: [...s.canvasElements, newGroup] }))
    return id
  },

  updateGroup: (id, updates) => {
    set((s) => ({
      canvasElements: s.canvasElements.map(e =>
        e.id === id && e.type === 'group' ? { ...e, ...updates } : e
      ),
    }))
  },

  removeGroup: (id) => {
    set((s) => ({
      canvasElements: s.canvasElements.filter(e => e.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }))
  },

  addWidgetToGroup: (groupId, widgetId) => {
    set((s) => ({
      canvasElements: s.canvasElements.map(e => {
        if (e.id === groupId && e.type === 'group') {
          return { ...e, widgetIds: [...e.widgetIds, widgetId] }
        }
        return e
      }),
    }))
  },

  removeWidgetFromGroup: (groupId, widgetId) => {
    set((s) => ({
      canvasElements: s.canvasElements.map(e => {
        if (e.id === groupId && e.type === 'group') {
          return { ...e, widgetIds: e.widgetIds.filter(id => id !== widgetId) }
        }
        return e
      }),
    }))
  },

  addText: (text) => {
    const id = generateElementId()
    const zIndex = get().getMaxZIndex()
    const newText: TextElement = { ...text, id, zIndex }
    set((s) => ({ canvasElements: [...s.canvasElements, newText] }))
    return id
  },

  updateText: (id, updates) => {
    set((s) => ({
      canvasElements: s.canvasElements.map(e =>
        e.id === id && e.type === 'text' ? { ...e, ...updates } : e
      ),
    }))
  },

  removeText: (id) => {
    set((s) => ({
      canvasElements: s.canvasElements.filter(e => e.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }))
  },

  addArrow: (arrow) => {
    const id = generateElementId()
    const zIndex = get().getMaxZIndex()
    const newArrow: ArrowElement = { ...arrow, id, zIndex }
    set((s) => ({ canvasElements: [...s.canvasElements, newArrow] }))
    return id
  },

  updateArrow: (id, updates) => {
    set((s) => ({
      canvasElements: s.canvasElements.map(e =>
        e.id === id && e.type === 'arrow' ? { ...e, ...updates } : e
      ),
    }))
  },

  removeArrow: (id) => {
    set((s) => ({
      canvasElements: s.canvasElements.filter(e => e.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }))
  },

  addShape: (shape) => {
    const id = generateElementId()
    const zIndex = get().getMaxZIndex()
    const newShape: ShapeElement = { ...shape, id, zIndex }
    set((s) => ({ canvasElements: [...s.canvasElements, newShape] }))
    return id
  },

  updateShape: (id, updates) => {
    set((s) => ({
      canvasElements: s.canvasElements.map(e =>
        e.id === id && e.type === 'shape' ? { ...e, ...updates } : e
      ),
    }))
  },

  removeShape: (id) => {
    set((s) => ({
      canvasElements: s.canvasElements.filter(e => e.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }))
  },

  setSelectedElement: (id) => {
    set({ selectedElementId: id })
  },

  removeSelectedElement: () => {
    const { selectedElementId } = get()
    if (!selectedElementId) return
    const element = get().canvasElements.find(e => e.id === selectedElementId)
    if (!element) return
    switch (element.type) {
      case 'group': get().removeGroup(selectedElementId); break
      case 'text': get().removeText(selectedElementId); break
      case 'arrow': get().removeArrow(selectedElementId); break
      case 'shape': get().removeShape(selectedElementId); break
    }
  },

  moveElement: (id, x, y) => {
    set((s) => ({
      canvasElements: s.canvasElements.map(e => {
        if (e.id === id) {
          if (e.type === 'arrow') {
            const dx = x - e.startX
            const dy = y - e.startY
            return { ...e, startX: x, startY: y, endX: e.endX + dx, endY: e.endY + dy }
          }
          return { ...e, x, y }
        }
        return e
      }),
    }))
  },
})

export { GROUP_COLORS }
