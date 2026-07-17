import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect, vi } from 'vitest'
import { CalcWidget } from '../CalcWidget'
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

function w() {
  return {
    id: 'c1',
    type: 'calc' as const,
    x: 0,
    y: 0,
    width: 300,
    height: 400,
    locked: false,
    content: { type: 'calc' as const, expr: '', result: undefined, history: [] },
  }
}

describe('CalcWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <CalcWidget widget={w() as never} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })
})
