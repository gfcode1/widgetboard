import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect, vi } from 'vitest'
import { WeatherWidget } from '../WeatherWidget'
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

function w(opts: { locations?: { city: string; lat: number; lon: number }[] } = {}) {
  return {
    id: 'w1',
    type: 'weather' as const,
    x: 0,
    y: 0,
    width: 350,
    height: 300,
    locked: false,
    content: {
      type: 'weather' as const,
      locations: opts.locations ?? [
        { city: 'Milan', lat: 45.46, lon: 9.19 } as { city: string; lat: number; lon: number },
      ],
      activeIndex: 0,
    },
  }
}

describe('WeatherWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <WeatherWidget widget={w() as never} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })

  it('renders with empty locations', () => {
    const { container } = render(
      <Wrapper>
        <WeatherWidget widget={w({ locations: [] }) as never} />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })

  it('renders with multiple locations', () => {
    const { container } = render(
      <Wrapper>
        <WeatherWidget
          widget={
            w({
              locations: [
                { city: 'Milan', lat: 45.46, lon: 9.19 },
                { city: 'Tokyo', lat: 35.68, lon: 139.76 },
              ],
            }) as never
          }
        />
      </Wrapper>
    )
    expect(container).toBeTruthy()
  })
})
