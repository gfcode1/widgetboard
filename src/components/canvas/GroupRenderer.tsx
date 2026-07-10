import { useState, useCallback, useRef } from 'react'
import { Text } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useStore } from '../../store/useStore'
import type { GroupElement } from '../../types'

interface GroupRendererProps {
  element: GroupElement
  scale: number
  isSelected: boolean
  onSelect: (id: string) => void
}

type ResizeCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export function GroupRenderer({ element, scale, isSelected, onSelect }: GroupRendererProps) {
  const updateGroup = useStore((s) => s.updateGroup)
  const removeGroup = useStore((s) => s.removeGroup)
  const setSelectedElement = useStore((s) => s.setSelectedElement)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0, corner: '' as ResizeCorner | '' })

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    onSelect(element.id)
    setSelectedElement(element.id)
    setIsDragging(true)
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
  }, [element.id, element.x, element.y, onSelect, setSelectedElement])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging && !isResizing) return
    const dx = (e.clientX - dragRef.current.startX) / scale
    const dy = (e.clientY - dragRef.current.startY) / scale

    if (isDragging) {
      updateGroup(element.id, {
        x: dragRef.current.origX + dx,
        y: dragRef.current.origY + dy,
      })
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
  }, [isDragging, isResizing, scale, element.id, updateGroup])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  const handleResizeStart = useCallback((e: React.PointerEvent, corner: ResizeCorner) => {
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
  }, [element.x, element.y, element.width, element.height])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }, [])

  const handleTitleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(false)
    updateGroup(element.id, { title: e.target.value })
  }, [element.id, updateGroup])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
    }
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        backgroundColor: element.color,
        border: `2px dashed ${isSelected ? 'var(--wb-accent)' : 'var(--wb-border-solid)'}`,
        borderRadius: 'var(--wb-radius)',
        zIndex: element.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: isDragging || isResizing ? 'none' : 'border-color 0.15s ease',
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
            gap: 4,
            opacity: isSelected ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        >
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
            Group collapsed ({element.widgetIds.length} widgets)
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
}
