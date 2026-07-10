import { useState, useCallback, useRef } from 'react'
import { useStore } from '../../store/useStore'
import type { ArrowElement } from '../../types'

interface ArrowRendererProps {
  element: ArrowElement
  scale: number
  isSelected: boolean
  onSelect: (id: string) => void
}

export function ArrowRenderer({ element, scale, isSelected, onSelect }: ArrowRendererProps) {
  const updateArrow = useStore((s) => s.updateArrow)
  const setSelectedElement = useStore((s) => s.setSelectedElement)
  const [draggingEnd, setDraggingEnd] = useState<'start' | 'end' | null>(null)
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 })

  const handleStartPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    onSelect(element.id)
    setSelectedElement(element.id)
    setDraggingEnd('start')
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: element.startX,
      origY: element.startY,
    }
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
  }, [element.id, element.startX, element.startY, onSelect, setSelectedElement])

  const handleEndPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    onSelect(element.id)
    setSelectedElement(element.id)
    setDraggingEnd('end')
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: element.endX,
      origY: element.endY,
    }
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
  }, [element.id, element.endX, element.endY, onSelect, setSelectedElement])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingEnd) return
    const dx = (e.clientX - dragRef.current.startX) / scale
    const dy = (e.clientY - dragRef.current.startY) / scale

    if (draggingEnd === 'start') {
      updateArrow(element.id, {
        startX: dragRef.current.origX + dx,
        startY: dragRef.current.origY + dy,
      })
    } else {
      updateArrow(element.id, {
        endX: dragRef.current.origX + dx,
        endY: dragRef.current.origY + dy,
      })
    }
  }, [draggingEnd, scale, element.id, updateArrow])

  const handlePointerUp = useCallback(() => {
    setDraggingEnd(null)
  }, [])

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: element.zIndex,
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id={`arrowhead-${element.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={isSelected ? 'var(--wb-accent)' : element.color}
          />
        </marker>
      </defs>
      <line
        x1={element.startX}
        y1={element.startY}
        x2={element.endX}
        y2={element.endY}
        stroke={isSelected ? 'var(--wb-accent)' : element.color}
        strokeWidth={element.strokeWidth}
        strokeDasharray={element.style === 'dashed' ? '8,4' : 'none'}
        markerEnd={`url(#arrowhead-${element.id})`}
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
      />
      <circle
        cx={element.startX}
        cy={element.startY}
        r={8}
        fill={draggingEnd === 'start' ? 'var(--wb-accent)' : 'var(--wb-surface)'}
        stroke={isSelected ? 'var(--wb-accent)' : element.color}
        strokeWidth={2}
        style={{ pointerEvents: 'all', cursor: 'grab' }}
        onPointerDown={handleStartPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <circle
        cx={element.endX}
        cy={element.endY}
        r={8}
        fill={draggingEnd === 'end' ? 'var(--wb-accent)' : 'var(--wb-surface)'}
        stroke={isSelected ? 'var(--wb-accent)' : element.color}
        strokeWidth={2}
        style={{ pointerEvents: 'all', cursor: 'grab' }}
        onPointerDown={handleEndPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </svg>
  )
}
