import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect, vi } from 'vitest'
import { ClockWidget } from '../ClockWidget'
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

function w(opts: { showDate?: boolean; showSeconds?: boolean; use12h?: boolean } = {}) {
  return {
    id: 'cl1',
    type: 'clock' as const,
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    locked: false,
    content: {
      type: 'clock' as const,
      showDate: opts.showDate ?? true,
      showSeconds: opts.showSeconds ?? true,
      use12h: opts.use12h ?? false,
    },
  }
}

describe('ClockWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <ClockWidget widget={w() as never} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })

  it('renders 12h mode', () => {
    const { container } = render(
      <Wrapper>
        <ClockWidget widget={w({ use12h: true }) as never} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })

  it('renders without date', () => {
    const { container } = render(
      <Wrapper>
        <ClockWidget widget={w({ showDate: false }) as never} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })
})
