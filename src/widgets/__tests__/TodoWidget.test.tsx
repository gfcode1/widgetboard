import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect, vi } from 'vitest'
import { TodoWidget } from '../TodoWidget'
import { WidgetContext } from '../../components/Widget'
import type { Widget } from '../../types'

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
      <WidgetContext.Provider value={{ widgetId: 'test-id', boardId: 'root' }}>
        {children}
      </WidgetContext.Provider>
    </MantineProvider>
  )
}

function makeTodoWidget(
  items: Array<{
    id: string
    text: string
    done: boolean
    priority: 'low' | 'medium' | 'high'
    dueDate?: string
    subtasks: Array<{ id: string; text: string; done: boolean }>
  }>
): Widget {
  return {
    id: 't1',
    type: 'todo',
    x: 0,
    y: 0,
    width: 350,
    height: 400,
    locked: false,
    content: { type: 'todo' as const, items, filter: 'all' as const, sortBy: 'default' as const },
  } as Widget
}

describe('TodoWidget', () => {
  it('renders without crashing', () => {
    const w = makeTodoWidget([
      { id: 'i1', text: 'Buy groceries', done: false, priority: 'medium', subtasks: [] },
      { id: 'i2', text: 'Walk the dog', done: true, priority: 'low', subtasks: [] },
    ])
    const { container } = render(
      <Wrapper>
        <TodoWidget widget={w} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })

  it('renders with empty items', () => {
    const w = makeTodoWidget([])
    const { container } = render(
      <Wrapper>
        <TodoWidget widget={w} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })

  it('renders with subtasks', () => {
    const w = makeTodoWidget([
      {
        id: 'i1',
        text: 'Project',
        done: false,
        priority: 'high',
        dueDate: '2024-12-31',
        subtasks: [{ id: 's1', text: 'Subtask 1', done: false }],
      },
    ])
    const { container } = render(
      <Wrapper>
        <TodoWidget widget={w} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })
})
