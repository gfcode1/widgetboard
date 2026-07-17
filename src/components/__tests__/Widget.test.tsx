import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { DndContext } from '@dnd-kit/core'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Widget, WidgetContext, useWidgetContext } from '../Widget'
import type { Widget as WidgetType } from '../../types'
import { useStore } from '../../store/useStore'

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    }),
  }
})

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider defaultColorScheme="dark">
      <DndContext>{children}</DndContext>
    </MantineProvider>
  )
}

const baseWidget: WidgetType = {
  id: 'widget-1',
  type: 'note',
  x: 100,
  y: 200,
  width: 300,
  height: 200,
  locked: false,
  content: { type: 'note', text: 'Hello' },
}

beforeEach(() => {
  vi.stubGlobal('innerWidth', 1920)
  vi.stubGlobal('innerHeight', 1080)

  useStore.setState({
    boards: { root: [] },
    currentBoardId: null,
    navigationStack: [],
    history: [{ boards: { root: [] }, canvasElements: [], connections: [] }],
    historyIndex: 0,
    selectedIds: [],
    selectedWidgetId: null,
    selectedElementId: null,
    lastPushTime: 0,
    canvasElements: [],
    snapEnabled: true,
    collisionEnabled: true,
  })
})

describe('Widget', () => {
  it('renders on the canvas at the correct position', () => {
    render(
      <Widget
        widget={baseWidget}
        scale={1}
        isSelected={false}
        onSelect={vi.fn()}
        onContextMenu={vi.fn()}
      />,
      { wrapper: Wrapper }
    )
    const el = document.querySelector('[class*="wb-widget-card"]')
    expect(el).toBeInTheDocument()
  })

  it('renders the resize handles', () => {
    const { container } = render(
      <Widget
        widget={baseWidget}
        scale={1}
        isSelected={false}
        onSelect={vi.fn()}
        onContextMenu={vi.fn()}
      />,
      { wrapper: Wrapper }
    )
    const handles = container.querySelectorAll('.wb-resize-handle')
    expect(handles.length).toBe(6)
  })

  it('applies selected class when isSelected is true', () => {
    render(
      <Widget
        widget={baseWidget}
        scale={1}
        isSelected
        onSelect={vi.fn()}
        onContextMenu={vi.fn()}
      />,
      { wrapper: Wrapper }
    )
    const el = document.querySelector('.wb-widget-card--selected')
    expect(el).toBeInTheDocument()
  })

  it('does not apply selected class when isSelected is false', () => {
    render(
      <Widget
        widget={baseWidget}
        scale={1}
        isSelected={false}
        onSelect={vi.fn()}
        onContextMenu={vi.fn()}
      />,
      { wrapper: Wrapper }
    )
    expect(document.querySelector('.wb-widget-card--selected')).not.toBeInTheDocument()
  })
})

describe('WidgetContext', () => {
  it('provides widgetId and boardId through context', () => {
    function Consumer() {
      const ctx = useWidgetContext()
      return <span data-testid="ctx">{`${ctx.widgetId}/${ctx.boardId}`}</span>
    }
    render(
      <WidgetContext.Provider value={{ widgetId: 'w-1', boardId: 'board-2' }}>
        <Consumer />
      </WidgetContext.Provider>
    )
    expect(screen.getByTestId('ctx')).toHaveTextContent('w-1/board-2')
  })
})
