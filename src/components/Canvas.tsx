import { useRef, useCallback, useState, useEffect } from 'react'
import { Button, Group, Paper, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useStore, ROOT_BOARD_ID } from '../store/useStore'
import type { Widget as WidgetType } from '../types'
import { Widget } from './Widget'
import { ContextMenu } from './ContextMenu'
import { CanvasElements } from './canvas/CanvasElements'
import { CanvasToolbar } from './canvas/CanvasToolbar'
import { CanvasContextMenu } from './canvas/CanvasContextMenu'
import { useCanvasPan } from '../hooks/useCanvasPan'
import { useCanvasZoom } from '../hooks/useCanvasZoom'
import { useCanvasTouch } from '../hooks/useCanvasTouch'

const EMPTY_WIDGETS: WidgetType[] = []

interface CanvasProps {
  boardId?: string
  onOpenBoard?: (boardId: string) => void
}

export function Canvas({ boardId = ROOT_BOARD_ID, onOpenBoard }: CanvasProps) {
  const widgets = useStore((s) => s.boards[boardId] ?? EMPTY_WIDGETS)
  const canvasOffset = useStore((s) => s.canvasOffset)
  const canvasScale = useStore((s) => s.canvasScale)
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)
  const moveWidget = useStore((s) => s.moveWidget)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const removeWidget = useStore((s) => s.removeWidget)
  const duplicateWidget = useStore((s) => s.duplicateWidget)
  const selectedIds = useStore((s) => s.selectedIds)
  const setSelectedIds = useStore((s) => s.setSelectedIds)
  const toggleSelectWidget = useStore((s) => s.toggleSelectWidget)
  const removeSelectedWidgets = useStore((s) => s.removeSelectedWidgets)
  const duplicateSelectedWidgets = useStore((s) => s.duplicateSelectedWidgets)

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragScaleRef = useRef(canvasScale)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    widgetId: string
  } | null>(null)
  const [canvasContextMenu, setCanvasContextMenu] = useState<{
    screenX: number
    screenY: number
    canvasX: number
    canvasY: number
  } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const activeWidget = widgets.find((w) => w.id === activeId)

  const { isPanning, handleMouseDown, handleMouseMove, handleMouseUp } = useCanvasPan(canvasRef)
  const { centerCanvas } = useCanvasZoom(canvasRef)
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useCanvasTouch(canvasRef)

  const zoomToFit = useCallback(() => {
    if (!canvasRef.current || widgets.length === 0) {
      centerCanvas()
      return
    }
    const rect = canvasRef.current.getBoundingClientRect()
    const padding = 60

    // Calculate bounding box of all widgets
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const w of widgets) {
      minX = Math.min(minX, w.x)
      minY = Math.min(minY, w.y)
      maxX = Math.max(maxX, w.x + w.width)
      maxY = Math.max(maxY, w.y + w.height)
    }

    const contentW = maxX - minX
    const contentH = maxY - minY
    if (contentW <= 0 || contentH <= 0) {
      centerCanvas()
      return
    }

    const scaleX = (rect.width - padding * 2) / contentW
    const scaleY = (rect.height - padding * 2) / contentH
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 2)

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    setCanvasTransform(
      { x: rect.width / 2 - centerX * newScale, y: rect.height / 2 - centerY * newScale },
      newScale
    )
  }, [widgets, setCanvasTransform, centerCanvas])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { delta, active } = event
      const widgetId = active.id as string
      const data = active.data.current as { widgetX: number; widgetY: number } | undefined
      if (!data) return
      const scale = dragScaleRef.current
      const dx = delta.x / scale
      const dy = delta.y / scale
      moveWidget(widgetId, data.widgetX + dx, data.widgetY + dy, boardId)
      setActiveId(null)
    },
    [moveWidget, boardId]
  )

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    dragScaleRef.current = canvasScale
    setActiveId(event.active.id as string)
  }, [canvasScale])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }
      if (isMod && e.key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (isMod && e.key === '0') {
        e.preventDefault()
        zoomToFit()
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
        e.preventDefault()
        if (selectedIds.length > 0) {
          removeSelectedWidgets()
        } else if (selectedWidgetId) {
          removeWidget(selectedWidgetId, boardId)
          setSelectedWidgetId(null)
        }
        return
      }
      if (isMod && e.key === 'd') {
        e.preventDefault()
        if (selectedIds.length > 0) {
          duplicateSelectedWidgets()
        } else if (selectedWidgetId) {
          duplicateWidget(selectedWidgetId, boardId)
        }
        return
      }
      if (e.key === 'Escape') {
        setSelectedWidgetId(null)
        setSelectedIds([])
        setContextMenu(null)
        setCanvasContextMenu(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, zoomToFit, removeWidget, duplicateWidget, selectedWidgetId, selectedIds, removeSelectedWidgets, duplicateSelectedWidgets, setSelectedIds, boardId])

  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const initialScale = rect.width < 768 ? 0.25 : 0.4
      setCanvasTransform(
        { x: rect.width / 2, y: rect.height / 2 },
        initialScale
      )
    }
  }, [setCanvasTransform])

  useEffect(() => {
    const handler = () => {
      setContextMenu(null)
      setCanvasContextMenu(null)
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  const handleZoomSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newScale = parseFloat(e.target.value) / 100
      setCanvasTransform(canvasOffset, newScale)
    },
    [canvasOffset, setCanvasTransform]
  )

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 }
      const rect = canvasRef.current.getBoundingClientRect()
      return {
        x: (screenX - rect.left - canvasOffset.x) / canvasScale,
        y: (screenY - rect.top - canvasOffset.y) / canvasScale,
      }
    },
    [canvasScale, canvasOffset]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, widgetId: string) => {
      e.preventDefault()
      const canvas = screenToCanvas(e.clientX, e.clientY)
      setContextMenu({ x: canvas.x, y: canvas.y, widgetId })
    },
    [screenToCanvas]
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
        setSelectedWidgetId(null)
        setSelectedIds([])
        setCanvasContextMenu(null)
      }
    },
    [setSelectedIds]
  )

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
        e.preventDefault()
        setContextMenu(null)
        const canvasPos = screenToCanvas(e.clientX, e.clientY)
        setCanvasContextMenu({
          screenX: e.clientX,
          screenY: e.clientY,
          canvasX: canvasPos.x,
          canvasY: canvasPos.y,
        })
      }
    },
    [screenToCanvas]
  )

  return (
    <div
      ref={canvasRef}
      className="wb-canvas"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'grab',
        touchAction: 'none',
        transition: 'background 0.2s ease',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCanvasClick}
      onContextMenu={handleCanvasContextMenu}
    >
      <Group
        gap="xs"
        style={{
          position: 'absolute',
          bottom: isMobile ? 80 : 20,
          left: 16,
          zIndex: 20,
        }}
      >
        <Button
          size="compact-xs"
          variant="light"
          color="gray"
          onClick={centerCanvas}
          className="wb-glass"
        >
          Center
        </Button>
        <Button
          size="compact-xs"
          variant="light"
          color="gray"
          onClick={zoomToFit}
          className="wb-glass"
        >
          Fit
        </Button>
        <Paper
          px="xs"
          py={4}
          radius="md"
          className="wb-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <input
            type="range"
            min={10}
            max={200}
            value={Math.round(canvasScale * 100)}
            onChange={handleZoomSlider}
            style={{
              width: 60,
              height: 3,
              accentColor: 'var(--wb-accent)',
              cursor: 'pointer',
            }}
          />
          <Text size="xs" c="dimmed" fw={500} style={{ minWidth: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(canvasScale * 100)}%
          </Text>
        </Paper>
        {selectedIds.length > 0 && (
          <Paper
            px="xs"
            py={4}
            radius="md"
            className="wb-glass"
            style={{
              border: '1px solid var(--wb-accent)',
            }}
          >
            <Text size="xs" c="violet" fw={500}>{selectedIds.length} selected</Text>
          </Paper>
        )}
      </Group>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          style={{
            position: 'absolute',
            transformOrigin: '0 0',
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          }}
          data-canvas="true"
        >
          <CanvasElements scale={canvasScale} boardId={boardId} selectedWidgetId={selectedWidgetId} />
          {widgets.map((widget) => (
            <Widget
              key={widget.id}
              widget={widget}
              scale={canvasScale}
              isSelected={widget.id === selectedWidgetId || selectedIds.includes(widget.id)}
              onSelect={(id, shiftKey) => {
                if (id && shiftKey) {
                  toggleSelectWidget(id)
                } else if (id) {
                  setSelectedWidgetId(id)
                }
              }}
              onContextMenu={handleContextMenu}
              boardId={boardId}
              onOpenBoard={onOpenBoard}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeWidget ? (
            <div
              style={{
                width: activeWidget.width * canvasScale,
                height: activeWidget.height * canvasScale,
                opacity: 0.85,
                border: '2px dashed var(--wb-accent)',
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: 'var(--wb-surface)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                transform: 'rotate(2deg)',
                pointerEvents: 'none',
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x * canvasScale + canvasOffset.x}
          y={contextMenu.y * canvasScale + canvasOffset.y}
          widgetId={contextMenu.widgetId}
          boardId={boardId}
          onClose={() => setContextMenu(null)}
        />
      )}
      {canvasContextMenu && (
        <CanvasContextMenu
          x={canvasContextMenu.screenX}
          y={canvasContextMenu.screenY}
          canvasX={canvasContextMenu.canvasX}
          canvasY={canvasContextMenu.canvasY}
          boardId={boardId}
          onClose={() => setCanvasContextMenu(null)}
        />
      )}
      <CanvasToolbar boardId={boardId} />
    </div>
  )
}
