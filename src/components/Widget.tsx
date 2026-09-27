import {
  useRef,
  useCallback,
  useState,
  useMemo,
  Suspense,
  lazy,
  memo,
  createContext,
  useContext,
} from 'react'
import { Skeleton, Text, Paper } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useDraggable } from '@dnd-kit/core'
import type { Widget as WidgetType } from '../types'
import { useStore } from '../store/useStore'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'

export interface WidgetContextValue {
  widgetId: string
  boardId: string
}

export const WidgetContext = createContext<WidgetContextValue>({ widgetId: '', boardId: '' })

export function useWidgetContext() {
  return useContext(WidgetContext)
}

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
const BoardWidget = lazy(() => import('../widgets/BoardWidget'))
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
const TimerWidget = lazy(() => import('../widgets/TimerWidget'))
const KanbanWidget = lazy(() => import('../widgets/KanbanWidget'))
const SomaRadioWidget = lazy(() => import('../widgets/SomaRadioWidget'))

interface WidgetProps {
  widget: WidgetType
  scale: number
  isSelected: boolean
  onSelect: (id: string | null, shiftKey?: boolean) => void
  onContextMenu: (e: React.MouseEvent, widgetId: string) => void
  boardId?: string
  onOpenBoard?: (boardId: string) => void
}

const widgetComponents: Record<
  string,
  React.LazyExoticComponent<
    React.ComponentType<{ widget: WidgetType; onOpenBoard?: (boardId: string) => void }>
  >
> = {
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
  board: BoardWidget,
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
  timer: TimerWidget,
  kanban: KanbanWidget,
  somaradio: SomaRadioWidget,
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
  { dir: 'top-left', cursor: 'nwse-resize', style: { top: -5, left: -5 } },
  { dir: 'top-right', cursor: 'nesw-resize', style: { top: -5, right: -5 } },
  { dir: 'bottom-left', cursor: 'nesw-resize', style: { bottom: -5, left: -5 } },
  { dir: 'bottom-right', cursor: 'nwse-resize', style: { bottom: -5, right: -5 } },
  {
    dir: 'left',
    cursor: 'ew-resize',
    style: { top: '50%', left: -5, transform: 'translateY(-50%)' },
  },
  {
    dir: 'right',
    cursor: 'ew-resize',
    style: { top: '50%', right: -5, transform: 'translateY(-50%)' },
  },
]

export const Widget = memo(function Widget({
  widget,
  scale,
  isSelected,
  onSelect,
  onContextMenu,
  boardId,
  onOpenBoard,
}: WidgetProps) {
  const resizeWidgetWithPosition = useStore((s) => s.resizeWidgetWithPosition)
  const forcePushHistory = useStore((s) => s.forcePushHistory)
  const editMode = useStore((s) => s.editMode)
  const [resizing, setResizing] = useState(false)
  const [resizeSize, setResizeSize] = useState<{ w: number; h: number } | null>(null)
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
    disabled: !editMode,
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
      setResizeSize({ w: newW, h: newH })
    },
    [resizing, scale, widget.id, resizeWidgetWithPosition]
  )

  const handleResizeEnd = useCallback(() => {
    setResizing(false)
    setResizeSize(null)
    forcePushHistory()
  }, [forcePushHistory])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (editMode) {
        onSelect(widget.id, e.shiftKey)
        listeners?.onPointerDown?.(e)
      }
    },
    [widget.id, onSelect, listeners, editMode]
  )

  const Component = widgetComponents[widget.type]
  const isActive = isDragging || resizing

  const cardClassName = useMemo(
    () =>
      [
        'wb-widget-card',
        isActive ? 'wb-widget-card--active' : '',
        isSelected && !isActive && editMode ? 'wb-widget-card--selected' : '',
      ]
        .filter(Boolean)
        .join(' '),
    [isActive, isSelected, editMode]
  )

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
        zIndex: isActive ? 50 : isSelected && editMode ? 40 : 10,
        animation: 'widget-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      onContextMenu={(e) => editMode && onContextMenu(e, widget.id)}
      onPointerDown={handlePointerDown}
      {...(editMode ? attributes : {})}
    >
      <div
        className={cardClassName}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            <WidgetErrorBoundary widgetId={widget.id}>
              <Suspense fallback={<WidgetSkeleton width={widget.width} height={widget.height} />}>
                <WidgetContext.Provider
                  value={useMemo(
                    () => ({ widgetId: widget.id, boardId: boardId ?? 'root' }),
                    [widget.id, boardId]
                  )}
                >
                  {Component && <Component widget={widget} onOpenBoard={onOpenBoard} />}
                </WidgetContext.Provider>
              </Suspense>
            </WidgetErrorBoundary>
          </div>
        </div>
      </div>

      {editMode &&
        resizeHandles.map((handle) => {
          const handleSize = isMobile ? 48 : 12
          const isCorner = handle.dir.includes('-')
          return (
            <div
              key={handle.dir}
              role="separator"
              aria-label={`Resize ${handle.dir}`}
              tabIndex={0}
              className="wb-resize-handle"
              style={{
                ...handle.style,
                width: isCorner ? handleSize + 2 : handleSize - 4,
                height: isCorner ? handleSize + 2 : 24,
                cursor: handle.cursor,
              }}
              onPointerDown={(e) => handleResizeStart(e, handle.dir)}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
            >
              {isCorner ? (
                <svg width={8} height={8} viewBox="0 0 8 8" fill="none">
                  <rect width="8" height="3" rx="1.5" fill="var(--wb-accent)" opacity="0.8" />
                </svg>
              ) : (
                <svg width={4} height={22} viewBox="0 0 4 22" fill="none">
                  <rect width="4" height="22" rx="2" fill="var(--wb-accent)" opacity="0.8" />
                </svg>
              )}
            </div>
          )
        })}

      {editMode && resizeSize && (
        <Paper
          px={6}
          py={2}
          radius="sm"
          style={{
            position: 'absolute',
            top: -26,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--wb-surface-solid)',
            border: '1px solid var(--wb-border-solid)',
            boxShadow: 'var(--wb-shadow)',
            zIndex: 100,
          }}
        >
          <Text size="xs" c="dimmed" fw={500} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {resizeSize.w} x {resizeSize.h}
          </Text>
        </Paper>
      )}
    </div>
  )
})
