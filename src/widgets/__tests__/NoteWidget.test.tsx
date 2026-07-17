import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect, vi } from 'vitest'
import { NoteWidget } from '../NoteWidget'
import { WidgetContext } from '../../components/Widget'

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

function w(opts: { text?: string; categories?: string[] } = {}) {
  return {
    id: 'n1',
    type: 'note' as const,
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    locked: false,
    content: {
      type: 'note' as const,
      text: opts.text ?? '# Hello\n\nThis is a **markdown** note.',
      categories: opts.categories ?? ['Work', 'Ideas'],
    },
  }
}

describe('NoteWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <NoteWidget widget={w() as never} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })

  it('renders without category', () => {
    const { container } = render(
      <Wrapper>
        <NoteWidget widget={w({ categories: [] }) as never} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })

  it('renders with empty text', () => {
    const { container } = render(
      <Wrapper>
        <NoteWidget widget={w({ text: '', categories: [] }) as never} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })
})
