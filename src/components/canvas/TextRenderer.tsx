import { useState, useCallback, useRef, memo } from 'react'
import { useStore } from '../../store/useStore'
import type { TextElement } from '../../types'

interface TextRendererProps {
  element: TextElement
  scale: number
  isSelected: boolean
  onSelect: (id: string) => void
}

export const TextRenderer = memo(function TextRenderer({
  element,
  scale,
  isSelected,
  onSelect,
}: TextRendererProps) {
  const updateText = useStore((s) => s.updateText)
  const setSelectedElement = useStore((s) => s.setSelectedElement)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 })

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      onSelect(element.id)
      setSelectedElement(element.id)
      setIsDragging(true)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: element.x,
        origY: element.y,
      }
      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)
    },
    [element.id, element.x, element.y, onSelect, setSelectedElement]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const dx = (e.clientX - dragRef.current.startX) / scale
      const dy = (e.clientY - dragRef.current.startY) / scale
      updateText(element.id, {
        x: dragRef.current.origX + dx,
        y: dragRef.current.origY + dy,
      })
    },
    [isDragging, scale, element.id, updateText]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }, [])

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsEditing(false)
      updateText(element.id, { content: e.target.value })
    },
    [element.id, updateText]
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        zIndex: element.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        outline: isSelected ? '2px solid var(--wb-accent)' : 'none',
        outlineOffset: 4,
        borderRadius: 4,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          autoFocus
          defaultValue={element.content}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            background: 'var(--wb-surface)',
            border: '1px solid var(--wb-border)',
            borderRadius: 'var(--wb-radius-sm)',
            padding: '8px 12px',
            color: element.color,
            fontSize: element.fontSize,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            lineHeight: 1.5,
            minWidth: 200,
            minHeight: 60,
            resize: 'both',
            outline: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          style={{
            color: element.color,
            fontSize: element.fontSize,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            maxWidth: 400,
          }}
        >
          {element.content || 'Double-click to edit'}
        </div>
      )}
    </div>
  )
})
