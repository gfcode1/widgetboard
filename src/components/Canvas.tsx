import { useRef, useCallback, useState, useEffect, memo } from 'react'
import { Button, Group, Menu, Paper, Text, Transition } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragMoveEvent, DragOverEvent } from '@dnd-kit/core'
import { useStore, ROOT_BOARD_ID } from '../store/useStore'
import type { Widget as WidgetType, GroupElement } from '../types'
import { useShallow } from 'zustand/react/shallow'
import { IconList } from '@tabler/icons-react'
import { Widget } from './Widget'
import { ContextMenu } from './ContextMenu'
import { CanvasElements } from './canvas/CanvasElements'
import { CanvasToolbar } from './canvas/CanvasToolbar'
import { CanvasContextMenu } from './canvas/CanvasContextMenu'
import { EmptyBoardState } from './EmptyBoardState'
import { WidgetListDrawer } from './WidgetListDrawer'
import { useCanvasPan } from '../hooks/useCanvasPan'
import { useCanvasZoom } from '../hooks/useCanvasZoom'
import { useCanvasTouch } from '../hooks/useCanvasTouch'

const EMPTY_WIDGETS: WidgetType[] = []

interface CanvasProps {
  boardId?: string
  onOpenBoard?: (boardId: string) => void
}

export const Canvas = memo(function Canvas({ boardId = ROOT_BOARD_ID, onOpenBoard }: CanvasProps) {
  const widgets = useStore(useShallow((s) => s.boards[boardId] ?? EMPTY_WIDGETS))
  const groups = useStore(
    useShallow((s) =>
      s.canvasElements.filter((e): e is GroupElement => e.type === 'group' && e.boardId === boardId)
    )
  )
  const canvasOffset = useStore((s) => s.canvasOffset)
  const canvasScale = useStore((s) => s.canvasScale)
  const setCanvasTransform = useStore((s) => s.setCanvasTransform)
  const moveWidget = useStore((s) => s.moveWidget)
  const addWidgetToGroup = useStore((s) => s.addWidgetToGroup)
  const updateGroupAutoResize = useStore((s) => s.updateGroupAutoResize)
  const moveWidgetFromGroup = useStore((s) => s.moveWidgetFromGroup)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const removeWidget = useStore((s) => s.removeWidget)
  const duplicateWidget = useStore((s) => s.duplicateWidget)
  const selectedIds = useStore((s) => s.selectedIds)
  const selectedWidgetId = useStore((s) => s.selectedWidgetId)
  const setSelectedIds = useStore((s) => s.setSelectedIds)
  const setSelectedWidgetId = useStore((s) => s.setSelectedWidgetId)
  const toggleSelectWidget = useStore((s) => s.toggleSelectWidget)
  const removeSelectedWidgets = useStore((s) => s.removeSelectedWidgets)
  const duplicateSelectedWidgets = useStore((s) => s.duplicateSelectedWidgets)
  const snapEnabled = useStore((s) => s.snapEnabled)
  const editMode = useStore((s) => s.editMode)

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
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)
  const [snapLines, setSnapLines] = useState<
    { type: 'v' | 'h'; pos: number; start: number; end: number }[]
  >([])
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false)
  const [zoomIndicator, setZoomIndicator] = useState(false)
  const zoomIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [widgetListOpened, setWidgetListOpened] = useState(false)

  const GRID_BASE = 20

  const handleWidgetSelect = useCallback(
    (id: string | null, shiftKey?: boolean) => {
      if (id && shiftKey) {
        toggleSelectWidget(id)
      } else if (id) {
        setSelectedWidgetId(id)
      }
    },
    [toggleSelectWidget, setSelectedWidgetId]
  )

  const activeWidget = widgets.find((w) => w.id === activeId)

  const { centerCanvas, animateTo, cancelAnimation } = useCanvasZoom(canvasRef)
  const { isPanning, hasMoved, handleMouseDown, handleMouseMove, handleMouseUp } = useCanvasPan(
    canvasRef,
    cancelAnimation
  )

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = x - rect.left
      const mouseY = y - rect.top
      const targetScale = canvasScale >= 0.9 ? 0.4 : 1.0
      const ratio = targetScale / canvasScale
      animateTo(
        {
          x: mouseX - (mouseX - canvasOffset.x) * ratio,
          y: mouseY - (mouseY - canvasOffset.y) * ratio,
        },
        targetScale
      )
    },
    [canvasScale, canvasOffset, animateTo, canvasRef]
  )

  const zoomBy = useCallback(
    (factor: number) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const { canvasScale: currentScale, canvasOffset: currentOffset } = useStore.getState()
      const newScale = Math.min(2, Math.max(0.1, currentScale * factor))
      const ratio = newScale / currentScale
      animateTo(
        {
          x: centerX - (centerX - currentOffset.x) * ratio,
          y: centerY - (centerY - currentOffset.y) * ratio,
        },
        newScale
      )
    },
    [animateTo, canvasRef]
  )

  const resetZoom = useCallback(() => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const { canvasOffset: currentOffset } = useStore.getState()
    const ratio = 1.0 / useStore.getState().canvasScale
    animateTo(
      {
        x: rect.width / 2 - (rect.width / 2 - currentOffset.x) * ratio,
        y: rect.height / 2 - (rect.height / 2 - currentOffset.y) * ratio,
      },
      1.0
    )
  }, [animateTo, canvasRef])

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useCanvasTouch(
    canvasRef,
    cancelAnimation,
    handleDoubleTap
  )

  const zoomToFit = useCallback(() => {
    if (!canvasRef.current || widgets.length === 0) {
      centerCanvas()
      return
    }
    const rect = canvasRef.current.getBoundingClientRect()
    const padding = 60

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
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

    animateTo(
      { x: rect.width / 2 - centerX * newScale, y: rect.height / 2 - centerY * newScale },
      newScale
    )
  }, [widgets, animateTo, centerCanvas, canvasRef])

  const handleZoomToWidget = useCallback(
    (widgetId: string) => {
      setWidgetListOpened(false)
      const widget = widgets.find((w) => w.id === widgetId)
      if (!widget || !canvasRef.current) return

      cancelAnimation()
      const rect = canvasRef.current.getBoundingClientRect()
      const padding = 80

      const scaleX = (rect.width - padding * 2) / widget.width
      const scaleY = (rect.height - padding * 2) / widget.height
      const targetScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 2)

      const centerX = widget.x + widget.width / 2
      const centerY = widget.y + widget.height / 2

      animateTo(
        {
          x: rect.width / 2 - centerX * targetScale,
          y: rect.height / 2 - centerY * targetScale,
        },
        targetScale
      )
    },
    [widgets, animateTo, cancelAnimation, canvasRef]
  )

  const handleZoomToGroup = useCallback(
    (groupId: string) => {
      setWidgetListOpened(false)
      const group = groups.find((g) => g.id === groupId)
      if (!group || !canvasRef.current) return

      cancelAnimation()
      const rect = canvasRef.current.getBoundingClientRect()
      const padding = 80

      const scaleX = (rect.width - padding * 2) / group.width
      const scaleY = (rect.height - padding * 2) / group.height
      const targetScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 2)

      const centerX = group.x + group.width / 2
      const centerY = group.y + group.height / 2

      animateTo(
        {
          x: rect.width / 2 - centerX * targetScale,
          y: rect.height / 2 - centerY * targetScale,
        },
        targetScale
      )
    },
    [groups, animateTo, cancelAnimation, canvasRef]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { delta, active, over } = event
      const widgetId = active.id as string
      const data = active.data.current as { widgetX: number; widgetY: number } | undefined
      if (!data) return
      const scale = dragScaleRef.current
      const dx = delta.x / scale
      const dy = delta.y / scale
      const newX = data.widgetX + dx
      const newY = data.widgetY + dy

      // Check if dropped over a group
      if (over) {
        const overData = over.data.current as { type: string; groupId: string } | undefined
        if (overData?.type === 'group') {
          const group = useStore
            .getState()
            .canvasElements.find((e) => e.id === overData.groupId && e.type === 'group') as
            GroupElement | undefined
          if (group) {
            // Check if widget is already in this exact group - just update position
            const isAlreadyInGroup = group.widgetIds.includes(widgetId)
            if (isAlreadyInGroup) {
              // Just update relative position
              const relX = newX - group.x
              const relY = newY - group.y
              useStore.setState((s) => ({
                boards: {
                  ...s.boards,
                  [boardId]: (s.boards[boardId] ?? []).map((w) =>
                    w.id === widgetId ? { ...w, x: newX, y: newY } : w
                  ),
                },
                canvasElements: s.canvasElements.map((e) => {
                  if (e.id === group.id && e.type === 'group') {
                    return {
                      ...e,
                      relativeWidgets: {
                        ...e.relativeWidgets,
                        [widgetId]: { relX, relY },
                      },
                    }
                  }
                  return e
                }),
              }))
              useStore.getState().forcePushHistory()
            } else {
              // Remove from previous group if any (just the association, widget stays in place)
              const prevGroup = useStore
                .getState()
                .canvasElements.find(
                  (e) => e.type === 'group' && e.widgetIds.includes(widgetId)
                ) as GroupElement | undefined
              if (prevGroup) {
                useStore.getState().removeWidgetFromGroup(prevGroup.id, widgetId)
              }
              // Add to new group
              const relX = newX - group.x
              const relY = newY - group.y
              addWidgetToGroup(group.id, widgetId, relX, relY, boardId)
              updateGroupAutoResize(group.id)
            }
            setActiveId(null)
            setDragOverGroupId(null)
            setSnapLines([])
            return
          }
        }
      }

      // Check if widget was in a group and is being dragged out
      const currentGroup = useStore
        .getState()
        .canvasElements.find((e) => e.type === 'group' && e.widgetIds.includes(widgetId)) as
        GroupElement | undefined
      if (currentGroup) {
        // Widget is being dragged out of the group
        moveWidgetFromGroup(widgetId, boardId)
      }

      moveWidget(widgetId, newX, newY, boardId)
      setActiveId(null)
      setDragOverGroupId(null)
      setSnapLines([])
    },
    [moveWidget, addWidgetToGroup, updateGroupAutoResize, moveWidgetFromGroup, boardId]
  )

  const handleDragStart = useCallback(
    (event: { active: { id: string | number } }) => {
      dragScaleRef.current = canvasScale
      setActiveId(event.active.id as string)
      setDragOverGroupId(null)
    },
    [canvasScale]
  )

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    if (over) {
      const overData = over.data.current as { type: string; groupId: string } | undefined
      if (overData?.type === 'group') {
        setDragOverGroupId(overData.groupId)
        return
      }
    }
    setDragOverGroupId(null)
  }, [])

  const computeSnapLines = useCallback(
    (widgetId: string, newX: number, newY: number, newW: number, newH: number) => {
      const threshold = 6
      const lines: { type: 'v' | 'h'; pos: number; start: number; end: number }[] = []
      const otherWidgets = widgets.filter((w) => w.id !== widgetId)
      if (otherWidgets.length === 0) return lines

      for (const w of otherWidgets) {
        const wLeft = w.x
        const wRight = w.x + w.width
        const wCenter = w.x + w.width / 2
        const wTop = w.y
        const wBottom = w.y + w.height
        const wMid = w.y + w.height / 2

        const widgetLeft = newX
        const widgetRight = newX + newW
        const widgetCenter = newX + newW / 2
        const widgetTop = newY
        const widgetBottom = newY + newH
        const widgetMid = newY + newH / 2

        if (Math.abs(widgetLeft - wLeft) < threshold) {
          lines.push({
            type: 'v',
            pos: wLeft,
            start: Math.min(wTop, widgetTop) - 10,
            end: Math.max(wBottom, widgetBottom) + 10,
          })
        }
        if (Math.abs(widgetRight - wRight) < threshold) {
          lines.push({
            type: 'v',
            pos: wRight,
            start: Math.min(wTop, widgetTop) - 10,
            end: Math.max(wBottom, widgetBottom) + 10,
          })
        }
        if (Math.abs(widgetLeft - wRight) < threshold) {
          lines.push({
            type: 'v',
            pos: wRight,
            start: Math.min(wTop, widgetTop) - 10,
            end: Math.max(wBottom, widgetBottom) + 10,
          })
        }
        if (Math.abs(widgetRight - wLeft) < threshold) {
          lines.push({
            type: 'v',
            pos: wLeft,
            start: Math.min(wTop, widgetTop) - 10,
            end: Math.max(wBottom, widgetBottom) + 10,
          })
        }
        if (Math.abs(widgetCenter - wCenter) < threshold) {
          lines.push({
            type: 'v',
            pos: wCenter,
            start: Math.min(wTop, widgetTop) - 10,
            end: Math.max(wBottom, widgetBottom) + 10,
          })
        }

        if (Math.abs(widgetTop - wTop) < threshold) {
          lines.push({
            type: 'h',
            pos: wTop,
            start: Math.min(wLeft, widgetLeft) - 10,
            end: Math.max(wRight, widgetRight) + 10,
          })
        }
        if (Math.abs(widgetBottom - wBottom) < threshold) {
          lines.push({
            type: 'h',
            pos: wBottom,
            start: Math.min(wLeft, widgetLeft) - 10,
            end: Math.max(wRight, widgetRight) + 10,
          })
        }
        if (Math.abs(widgetTop - wBottom) < threshold) {
          lines.push({
            type: 'h',
            pos: wBottom,
            start: Math.min(wLeft, widgetLeft) - 10,
            end: Math.max(wRight, widgetRight) + 10,
          })
        }
        if (Math.abs(widgetBottom - wTop) < threshold) {
          lines.push({
            type: 'h',
            pos: wTop,
            start: Math.min(wLeft, widgetLeft) - 10,
            end: Math.max(wRight, widgetRight) + 10,
          })
        }
        if (Math.abs(widgetMid - wMid) < threshold) {
          lines.push({
            type: 'h',
            pos: wMid,
            start: Math.min(wLeft, widgetLeft) - 10,
            end: Math.max(wRight, widgetRight) + 10,
          })
        }
      }

      return lines
    },
    [widgets]
  )

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { delta } = event
      if (!snapEnabled) {
        setSnapLines([])
        return
      }
      const data = event.active.data.current as { widgetX: number; widgetY: number } | undefined
      if (!data) return
      const scale = dragScaleRef.current
      const dx = delta.x / scale
      const dy = delta.y / scale
      const widget = widgets.find((w) => w.id === event.active.id)
      if (!widget) return
      const lines = computeSnapLines(
        event.active.id as string,
        data.widgetX + dx,
        data.widgetY + dy,
        widget.width,
        widget.height
      )
      setSnapLines(lines)
    },
    [snapEnabled, widgets, computeSnapLines]
  )

  const handlerRef = useRef<(e: KeyboardEvent) => void>(() => {})

  useEffect(() => {
    handlerRef.current = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      const state = useStore.getState()
      const tag = (e.target as HTMLElement).tagName
      const isInput =
        tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable

      if (e.key === 'e' && !isMod && !isInput) {
        e.preventDefault()
        state.toggleEditMode()
        return
      }

      if (editMode) {
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
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (isInput) return
          e.preventDefault()
          if (state.selectedIds.length > 0) {
            removeSelectedWidgets()
          } else if (state.selectedWidgetId) {
            removeWidget(state.selectedWidgetId, boardId)
            state.setSelectedWidgetId(null)
          }
          return
        }
        if (isMod && e.key === 'd') {
          e.preventDefault()
          if (state.selectedIds.length > 0) {
            duplicateSelectedWidgets()
          } else if (state.selectedWidgetId) {
            duplicateWidget(state.selectedWidgetId, boardId)
          }
          return
        }
      }

      if (isMod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        zoomBy(1.2)
        return
      }
      if (isMod && e.key === '-') {
        e.preventDefault()
        zoomBy(0.8)
        return
      }
      if (isMod && e.key === '1') {
        e.preventDefault()
        resetZoom()
        return
      }
      if (isMod && e.key === '0') {
        e.preventDefault()
        zoomToFit()
        return
      }
      if (e.key === 'Escape') {
        setSelectedWidgetId(null)
        setSelectedIds([])
        setContextMenu(null)
        setCanvasContextMenu(null)
      }
    }
  }, [undo, redo, zoomToFit, zoomBy, resetZoom, removeWidget, duplicateWidget, boardId, editMode])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handlerRef.current(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const initialScale = rect.width < 768 ? 0.25 : 0.4
      setCanvasTransform({ x: rect.width / 2, y: rect.height / 2 }, initialScale)
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

  useEffect(() => {
    if (zoomIndicatorTimer.current) clearTimeout(zoomIndicatorTimer.current)
    setZoomIndicator(true)
    zoomIndicatorTimer.current = setTimeout(() => setZoomIndicator(false), 800)
    return () => {
      if (zoomIndicatorTimer.current) clearTimeout(zoomIndicatorTimer.current)
    }
  }, [canvasScale])

  // Listen for "add selected widget to group" events from context menu
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { groupId: string } | undefined
      if (!detail?.groupId) return
      const state = useStore.getState()
      const widgetId = state.selectedWidgetId
      if (!widgetId) return
      const group = state.canvasElements.find(
        (el) => el.id === detail.groupId && el.type === 'group'
      ) as GroupElement | undefined
      if (!group) return
      const widget = (state.boards[boardId] ?? []).find((w) => w.id === widgetId)
      if (!widget) return
      const relX = widget.x - group.x
      const relY = widget.y - group.y
      addWidgetToGroup(detail.groupId, widgetId, relX, relY, boardId)
      updateGroupAutoResize(detail.groupId)
    }
    window.addEventListener('add-selected-to-group', handler)
    return () => window.removeEventListener('add-selected-to-group', handler)
  }, [boardId, addWidgetToGroup, updateGroupAutoResize])

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
      if (hasMoved.current) return
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
        setSelectedWidgetId(null)
        setSelectedIds([])
        setCanvasContextMenu(null)
      }
    },
    [setSelectedIds, setSelectedWidgetId]
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

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
        centerCanvas()
      }
    },
    [centerCanvas, canvasRef]
  )

  return (
    <div
      ref={canvasRef}
      className="wb-canvas"
      aria-label="Widget canvas - drag to pan, scroll to zoom"
      tabIndex={0}
      style={
        {
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: editMode ? (isPanning ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
          '--grid-size': `${GRID_BASE * canvasScale}px`,
          '--grid-offset-x': `${canvasOffset.x}px`,
          '--grid-offset-y': `${canvasOffset.y}px`,
        } as React.CSSProperties
      }
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCanvasClick}
      onContextMenu={handleCanvasContextMenu}
      onDoubleClick={handleDoubleClick}
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
          onClick={resetZoom}
          className="wb-glass"
        >
          100%
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
            aria-label="Zoom level"
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
          <Menu
            opened={zoomMenuOpen}
            onChange={setZoomMenuOpen}
            position="top"
            withinPortal={false}
          >
            <Menu.Target>
              <Text
                size="xs"
                c="dimmed"
                fw={500}
                style={{
                  minWidth: 28,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  cursor: 'pointer',
                }}
              >
                {Math.round(canvasScale * 100)}%
              </Text>
            </Menu.Target>
            <Menu.Dropdown>
              {[25, 50, 75, 100, 150, 200].map((preset) => (
                <Menu.Item
                  key={preset}
                  onClick={() => {
                    const { canvasScale: currentScale, canvasOffset: currentOffset } =
                      useStore.getState()
                    const newScale = preset / 100
                    if (!canvasRef.current) return
                    const rect = canvasRef.current.getBoundingClientRect()
                    const centerX = rect.width / 2
                    const centerY = rect.height / 2
                    const ratio = newScale / currentScale
                    animateTo(
                      {
                        x: centerX - (centerX - currentOffset.x) * ratio,
                        y: centerY - (centerY - currentOffset.y) * ratio,
                      },
                      newScale
                    )
                    setZoomMenuOpen(false)
                  }}
                >
                  {preset}%
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
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
            <Text size="xs" c="violet" fw={500}>
              {selectedIds.length} selected
            </Text>
          </Paper>
        )}
      </Group>
      {widgets.length > 0 && (
        <Button
          size="compact-xs"
          variant="light"
          color="gray"
          onClick={() => setWidgetListOpened(true)}
          className="wb-glass"
          style={{
            position: 'absolute',
            top: isMobile ? 80 : 16,
            right: 16,
            zIndex: 20,
          }}
        >
          <IconList size={14} />
        </Button>
      )}

      {editMode ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            style={{
              position: 'absolute',
              transformOrigin: '0 0',
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
            }}
            data-canvas="true"
          >
            {snapLines.length > 0 && (
              <svg
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  zIndex: 100,
                  overflow: 'visible',
                }}
              >
                {snapLines.map((line, i) => (
                  <line
                    key={i}
                    x1={line.type === 'v' ? line.pos : line.start}
                    y1={line.type === 'h' ? line.pos : line.start}
                    x2={line.type === 'v' ? line.pos : line.end}
                    y2={line.type === 'h' ? line.pos : line.end}
                    stroke="var(--mantine-color-red-5)"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    opacity={0.8}
                  />
                ))}
              </svg>
            )}
            <CanvasElements
              scale={canvasScale}
              boardId={boardId}
              selectedWidgetId={selectedWidgetId}
              dragOverGroupId={dragOverGroupId}
            />
            {widgets.length === 0 && (
              <EmptyBoardState
                onAddWidget={() => {
                  window.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
                  )
                }}
                isRoot={boardId === ROOT_BOARD_ID}
              />
            )}
            {widgets.map((widget) => (
              <Widget
                key={widget.id}
                widget={widget}
                scale={canvasScale}
                isSelected={widget.id === selectedWidgetId || selectedIds.includes(widget.id)}
                onSelect={handleWidgetSelect}
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
      ) : (
        <div
          style={{
            position: 'absolute',
            transformOrigin: '0 0',
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          }}
          data-canvas="true"
        >
          {widgets.map((widget) => (
            <Widget
              key={widget.id}
              widget={widget}
              scale={canvasScale}
              isSelected={false}
              onSelect={() => {}}
              onContextMenu={() => {}}
              boardId={boardId}
              onOpenBoard={onOpenBoard}
            />
          ))}
        </div>
      )}

      {editMode && contextMenu && (
        <ContextMenu
          x={contextMenu.x * canvasScale + canvasOffset.x}
          y={contextMenu.y * canvasScale + canvasOffset.y}
          widgetId={contextMenu.widgetId}
          boardId={boardId}
          onClose={() => setContextMenu(null)}
        />
      )}
      {editMode && canvasContextMenu && (
        <CanvasContextMenu
          x={canvasContextMenu.screenX}
          y={canvasContextMenu.screenY}
          canvasX={canvasContextMenu.canvasX}
          canvasY={canvasContextMenu.canvasY}
          boardId={boardId}
          onClose={() => setCanvasContextMenu(null)}
        />
      )}
      {editMode && <CanvasToolbar boardId={boardId} />}
      <Transition mounted={zoomIndicator} transition="fade" duration={200}>
        {(styles) => (
          <div
            style={{
              ...styles,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 15,
              pointerEvents: 'none',
            }}
          >
            <Paper
              px="md"
              py="sm"
              radius="md"
              className="wb-glass"
              style={{
                fontSize: 18,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--wb-text)',
              }}
            >
              {Math.round(canvasScale * 100)}%
            </Paper>
          </div>
        )}
      </Transition>
      <WidgetListDrawer
        widgets={widgets}
        groups={groups}
        opened={widgetListOpened}
        onClose={() => setWidgetListOpened(false)}
        onSelect={handleZoomToWidget}
        onSelectGroup={handleZoomToGroup}
      />
    </div>
  )
})
