import { useState, useCallback, useRef } from 'react'
import { useStore } from '../../store/useStore'
import type { ShapeElement } from '../../types'

interface ShapeRendererProps {
  element: ShapeElement
  scale: number
  isSelected: boolean
  onSelect: (id: string) => void
}

export function ShapeRenderer({ element, scale, isSelected, onSelect }: ShapeRendererProps) {
  const updateShape = useStore((s) => s.updateShape)
  const setSelectedElement = useStore((s) => s.setSelectedElement)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 })

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
    }
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
  }, [element.id, element.x, element.y, element.width, element.height, onSelect, setSelectedElement])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging && !isResizing) return
    const dx = (e.clientX - dragRef.current.startX) / scale
    const dy = (e.clientY - dragRef.current.startY) / scale

    if (isDragging) {
      updateShape(element.id, {
        x: dragRef.current.origX + dx,
        y: dragRef.current.origY + dy,
      })
    } else if (isResizing) {
      updateShape(element.id, {
        width: Math.max(50, dragRef.current.origW + dx),
        height: Math.max(50, dragRef.current.origH + dy),
      })
    }
  }, [isDragging, isResizing, scale, element.id, updateShape])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
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
    }
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
  }, [element.x, element.y, element.width, element.height])

  const borderRadius = element.shape === 'ellipse' ? '50%' : 'var(--wb-radius-sm)'

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        backgroundColor: element.fill,
        border: `${element.strokeWidth}px solid ${isSelected ? 'var(--wb-accent)' : element.stroke}`,
        borderRadius,
        opacity: element.opacity,
        zIndex: element.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: isDragging || isResizing ? 'none' : 'border-color 0.15s ease',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            right: -6,
            width: 12,
            height: 12,
            background: 'var(--wb-accent)',
            borderRadius: '50%',
            cursor: 'nwse-resize',
          }}
          onPointerDown={handleResizeStart}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
    </div>
  )
}
