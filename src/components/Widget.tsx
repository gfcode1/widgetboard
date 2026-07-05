import { useRef, useCallback, useState, Suspense, lazy } from 'react'
import { Skeleton } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useDraggable } from '@dnd-kit/core'
import type { Widget as WidgetType } from '../types'
import { useStore } from '../store/useStore'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'

const NoteWidget = lazy(() => import('../widgets/NoteWidget'))
const ClockWidget = lazy(() => import('../widgets/ClockWidget'))
const LinkWidget = lazy(() => import('../widgets/LinkWidget'))
const ImageWidget = lazy(() => import('../widgets/ImageWidget'))
const WeatherWidget = lazy(() => import('../widgets/WeatherWidget'))
const PomodoroWidget = lazy(() => import('../widgets/PomodoroWidget'))
const CalcWidget = lazy(() => import('../widgets/CalcWidget'))
const StickyWidget = lazy(() => import('../widgets/StickyWidget'))
const EmbedWidget = lazy(() => import('../widgets/EmbedWidget'))
const WorldClockWidget = lazy(() => import('../widgets/WorldClockWidget'))
const TodoWidget = lazy(() => import('../widgets/TodoWidget'))
const CalendarWidget = lazy(() => import('../widgets/CalendarWidget'))
const SearchWidget = lazy(() => import('../widgets/SearchWidget'))
// BoardWidget loaded separately due to extra onOpenBoard prop
import { BoardWidget } from '../widgets/BoardWidget'
const BookmarkWidget = lazy(() => import('../widgets/BookmarkWidget'))
const QuoteWidget = lazy(() => import('../widgets/QuoteWidget'))
const ClipboardWidget = lazy(() => import('../widgets/ClipboardWidget'))
const SnippetWidget = lazy(() => import('../widgets/SnippetWidget'))
const PaletteWidget = lazy(() => import('../widgets/PaletteWidget'))
const ExpenseWidget = lazy(() => import('../widgets/ExpenseWidget'))
const RssWidget = lazy(() => import('../widgets/RssWidget'))
const CountdownWidget = lazy(() => import('../widgets/CountdownWidget'))
const PomodoroStatsWidget = lazy(() => import('../widgets/PomodoroStatsWidget'))
const HabitWidget = lazy(() => import('../widgets/HabitWidget'))

interface WidgetProps {
  widget: WidgetType
  scale: number
  isSelected: boolean
  onSelect: (id: string | null, shiftKey?: boolean) => void
  onContextMenu: (e: React.MouseEvent, widgetId: string) => void
  boardId?: string
  onOpenBoard?: (boardId: string) => void
}

const widgetComponents: Record<string, React.LazyExoticComponent<React.ComponentType<{ widget: WidgetType }>>> = {
  note: NoteWidget,
  clock: ClockWidget,
  link: LinkWidget,
  image: ImageWidget,
  weather: WeatherWidget,
  pomodoro: PomodoroWidget,
  calc: CalcWidget,
  sticky: StickyWidget,
  embed: EmbedWidget,
  worldclock: WorldClockWidget,
  todo: TodoWidget,
  calendar: CalendarWidget,
  search: SearchWidget,
  bookmark: BookmarkWidget,
  quote: QuoteWidget,
  clipboard: ClipboardWidget,
  snippet: SnippetWidget,
  palette: PaletteWidget,
  expense: ExpenseWidget,
  rss: RssWidget,
  countdown: CountdownWidget,
  'pomodoro-stats': PomodoroStatsWidget,
  habit: HabitWidget,
}

function WidgetSkeleton({ width, height }: { width: number; height: number }) {
  return (
    <div style={{ width, height, padding: 8 }}>
      <Skeleton height={16} width="60%" radius="sm" mb={8} />
      <Skeleton height={10} width="90%" radius="sm" mb={4} />
      <Skeleton height={10} width="75%" radius="sm" mb={4} />
      <Skeleton height={10} width="80%" radius="sm" />
    </div>
  )
}

type ResizeDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right'

const resizeHandles: { dir: ResizeDirection; cursor: string; style: React.CSSProperties }[] = [
  { dir: 'top-left', cursor: 'nwse-resize', style: { top: -4, left: -4 } },
  { dir: 'top-right', cursor: 'nesw-resize', style: { top: -4, right: -4 } },
  { dir: 'bottom-left', cursor: 'nesw-resize', style: { bottom: -4, left: -4 } },
  { dir: 'bottom-right', cursor: 'nwse-resize', style: { bottom: -4, right: -4 } },
  { dir: 'left', cursor: 'ew-resize', style: { top: '50%', left: -4, transform: 'translateY(-50%)' } },
  { dir: 'right', cursor: 'ew-resize', style: { top: '50%', right: -4, transform: 'translateY(-50%)' } },
]

export function Widget({ widget, scale, isSelected, onSelect, onContextMenu, onOpenBoard }: WidgetProps) {
  const resizeWidgetWithPosition = useStore((s) => s.resizeWidgetWithPosition)
  const [resizing, setResizing] = useState(false)
  const resizeRef = useRef({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    origW: 0,
    origH: 0,
    direction: '' as ResizeDirection | '',
  })
  const isMobile = useMediaQuery('(max-width: 768px)')

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: widget.id,
    data: { widgetId: widget.id, widgetX: widget.x, widgetY: widget.y },
  })

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, direction: ResizeDirection) => {
      e.stopPropagation()
      e.preventDefault()
      setResizing(true)
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: widget.x,
        origY: widget.y,
        origW: widget.width,
        origH: widget.height,
        direction,
      }
      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)
    },
    [widget.x, widget.y, widget.width, widget.height]
  )

  const handleResizeMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizing) return
      const dx = (e.clientX - resizeRef.current.startX) / scale
      const dy = (e.clientY - resizeRef.current.startY) / scale
      const { direction, origX, origY, origW, origH } = resizeRef.current

      let newX = origX
      let newY = origY
      let newW = origW
      let newH = origH

      if (direction.includes('right')) {
        newW = Math.max(150, origW + dx)
      }
      if (direction.includes('left')) {
        newW = Math.max(150, origW - dx)
        newX = origX + (origW - newW)
      }
      if (direction.includes('bottom')) {
        newH = Math.max(80, origH + dy)
      }
      if (direction.includes('top')) {
        newH = Math.max(80, origH - dy)
        newY = origY + (origH - newH)
      }

      resizeWidgetWithPosition(widget.id, newX, newY, newW, newH)
    },
    [resizing, scale, widget.id, resizeWidgetWithPosition]
  )

  const handleResizeEnd = useCallback(() => {
    setResizing(false)
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      onSelect(widget.id, e.shiftKey)
      listeners?.onPointerDown?.(e as any)
    },
    [widget.id, onSelect, listeners]
  )

  const Component = widgetComponents[widget.type]
  const isActive = isDragging || resizing

  const cardClassName = [
    'wb-widget-card',
    isActive ? 'wb-widget-card--active' : '',
    isSelected && !isActive ? 'wb-widget-card--selected' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        userSelect: 'none',
        zIndex: isActive ? 50 : isSelected ? 40 : 10,
        animation: 'widget-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      onContextMenu={(e) => onContextMenu(e, widget.id)}
      onPointerDown={handlePointerDown}
      {...attributes}
    >
      <div
        className={cardClassName}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <WidgetErrorBoundary widgetId={widget.id}>
              <Suspense fallback={<WidgetSkeleton width={widget.width} height={widget.height} />}>
                {widget.type === 'board' ? (
                  <BoardWidget widget={widget} onOpenBoard={onOpenBoard ?? (() => {})} />
                ) : Component ? (
                  <Component widget={widget} />
                ) : null}
              </Suspense>
            </WidgetErrorBoundary>
          </div>
        </div>
      </div>

      {resizeHandles.map((handle) => {
        const handleSize = isMobile ? 44 : Math.round(16 / scale)
        return (
          <div
            key={handle.dir}
            className="wb-resize-handle"
            style={{
              ...handle.style,
              width: handleSize,
              height: handleSize,
              cursor: handle.cursor,
            }}
            onPointerDown={(e) => handleResizeStart(e, handle.dir)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          >
            {handle.dir === 'left' || handle.dir === 'right' ? (
              <svg width={Math.round(4 / scale)} height={Math.round(16 / scale)} viewBox="0 0 4 16" fill="none">
                <rect width="4" height="16" rx="2" fill="var(--wb-accent)" opacity="0.5" />
              </svg>
            ) : (
              <svg width={Math.round(6 / scale)} height={Math.round(6 / scale)} viewBox="0 0 6 6" fill="none">
                <circle cx="3" cy="3" r="3" fill="var(--wb-accent)" opacity="0.5" />
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )
}
