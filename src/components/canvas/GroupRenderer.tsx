import { useState, useCallback, useRef, memo } from 'react'
import { Text } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useDroppable } from '@dnd-kit/core'
import { useStore } from '../../store/useStore'
import type { GroupElement } from '../../types'

interface GroupRendererProps {
  element: GroupElement
  scale: number
  isSelected: boolean
  onSelect: (id: string) => void
  isDragOver?: boolean
}

type ResizeCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export const GroupRenderer = memo(function GroupRenderer({
  element,
  scale,
  isSelected,
  onSelect,
  isDragOver = false,
}: GroupRendererProps) {
  const updateGroup = useStore((s) => s.updateGroup)
  const removeGroup = useStore((s) => s.removeGroup)
  const setSelectedElement = useStore((s) => s.setSelectedElement)
  const moveGroupWithWidgets = useStore((s) => s.moveGroupWithWidgets)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  // Track actual position in ref to avoid stale props during rapid drag
  const posRef = useRef({ x: element.x, y: element.y })
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    origW: 0,
    origH: 0,
    corner: '' as ResizeCorner | '',
  })

  // Keep posRef in sync with element when not dragging
  if (!isDragging && !isResizing) {
    posRef.current.x = element.x
    posRef.current.y = element.y
  }

  const { setNodeRef, isOver } = useDroppable({
    id: `group-${element.id}`,
    data: { type: 'group', groupId: element.id },
  })

  const widgetCount = Object.keys(element.relativeWidgets).length

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      onSelect(element.id)
      setSelectedElement(element.id)
      setIsDragging(true)
      posRef.current = { x: element.x, y: element.y }
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: element.x,
        origY: element.y,
        origW: element.width,
        origH: element.height,
        corner: '',
      }
      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)
    },
    [element.id, element.x, element.y, element.width, element.height, onSelect, setSelectedElement]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging && !isResizing) return
      const dx = (e.clientX - dragRef.current.startX) / scale
      const dy = (e.clientY - dragRef.current.startY) / scale

      if (isDragging) {
        // Use cumulative delta from drag start, not incremental from last frame
        const targetX = dragRef.current.origX + dx
        const targetY = dragRef.current.origY + dy
        const groupDx = targetX - posRef.current.x
        const groupDy = targetY - posRef.current.y
        if (groupDx !== 0 || groupDy !== 0) {
          moveGroupWithWidgets(element.id, groupDx, groupDy)
          posRef.current = { x: targetX, y: targetY }
        }
      } else if (isResizing) {
        const { corner, origX, origY, origW, origH } = dragRef.current
        let newX = origX
        let newY = origY
        let newW = origW
        let newH = origH

        if (corner === 'bottom-right') {
          newW = Math.max(200, origW + dx)
          newH = Math.max(120, origH + dy)
        } else if (corner === 'bottom-left') {
          newW = Math.max(200, origW - dx)
          newH = Math.max(120, origH + dy)
          newX = origX + (origW - newW)
        } else if (corner === 'top-right') {
          newW = Math.max(200, origW + dx)
          newH = Math.max(120, origH - dy)
          newY = origY + (origH - newH)
        } else if (corner === 'top-left') {
          newW = Math.max(200, origW - dx)
          newH = Math.max(120, origH - dy)
          newX = origX + (origW - newW)
          newY = origY + (origH - newH)
        }

        updateGroup(element.id, { x: newX, y: newY, width: newW, height: newH })
      }
    },
    [isDragging, isResizing, scale, element.id, updateGroup, moveGroupWithWidgets]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, corner: ResizeCorner) => {
      e.stopPropagation()
      setIsResizing(true)
      setIsDragging(false)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: element.x,
        origY: element.y,
        origW: element.width,
        origH: element.height,
        corner,
      }
      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)
    },
    [element.x, element.y, element.width, element.height]
  )

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }, [])

  const handleTitleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(false)
      updateGroup(element.id, { title: e.target.value })
    },
    [element.id, updateGroup]
  )

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
    }
  }, [])

  const showDropHighlight = isOver || isDragOver

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        backgroundColor: showDropHighlight ? 'rgba(139, 92, 246, 0.15)' : element.color,
        border: `2px dashed ${
          showDropHighlight
            ? 'var(--wb-accent)'
            : isSelected
              ? 'var(--wb-accent)'
              : 'var(--wb-border-solid)'
        }`,
        borderRadius: 'var(--wb-radius)',
        zIndex: element.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition:
          isDragging || isResizing
            ? 'none'
            : 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: showDropHighlight ? '0 0 20px rgba(139, 92, 246, 0.3)' : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--wb-border)',
        }}
      >
        {isEditing ? (
          <input
            type="text"
            defaultValue={element.title}
            autoFocus
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--wb-text)',
              fontSize: 14,
              fontWeight: 600,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <Text
            size="sm"
            fw={600}
            style={{ color: 'var(--wb-text)', cursor: 'text' }}
            onDoubleClick={handleDoubleClick}
          >
            {element.title || 'Untitled Group'}
          </Text>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: isSelected ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          {widgetCount > 0 && (
            <Text size="xs" c="dimmed">
              {widgetCount}
            </Text>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeGroup(element.id)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              background: 'var(--wb-accent-subtle)',
              border: 'none',
              borderRadius: 'var(--wb-radius-sm)',
              cursor: 'pointer',
              color: 'var(--wb-text-dimmed)',
            }}
          >
            <IconX size={12} />
          </button>
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100% - 40px)',
        }}
      >
        {element.collapsed && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--wb-text-dimmed)',
              fontSize: 12,
            }}
          >
            Group collapsed ({widgetCount} widgets)
          </div>
        )}
        {showDropHighlight && !element.collapsed && (
          <div
            style={{
              position: 'absolute',
              inset: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--wb-accent)',
              borderRadius: 'var(--wb-radius-sm)',
              color: 'var(--wb-accent)',
              fontSize: 12,
              fontWeight: 500,
              pointerEvents: 'none',
            }}
          >
            Drop to add to group
          </div>
        )}
      </div>
      {isSelected && (
        <>
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              width: 8,
              height: 8,
              background: 'var(--wb-accent)',
              borderRadius: '50%',
              cursor: 'nwse-resize',
            }}
            onPointerDown={(e) => handleResizeStart(e, 'top-left')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 8,
              height: 8,
              background: 'var(--wb-accent)',
              borderRadius: '50%',
              cursor: 'nesw-resize',
            }}
            onPointerDown={(e) => handleResizeStart(e, 'top-right')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: -4,
              width: 8,
              height: 8,
              background: 'var(--wb-accent)',
              borderRadius: '50%',
              cursor: 'nesw-resize',
            }}
            onPointerDown={(e) => handleResizeStart(e, 'bottom-left')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 8,
              height: 8,
              background: 'var(--wb-accent)',
              borderRadius: '50%',
              cursor: 'nwse-resize',
            }}
            onPointerDown={(e) => handleResizeStart(e, 'bottom-right')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </>
      )}
    </div>
  )
})
