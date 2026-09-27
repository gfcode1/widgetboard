import { useMemo, memo } from 'react'
import { useStore } from '../../store/useStore'
import { ROOT_BOARD_ID } from '../../store/useStore'
import { GroupRenderer } from './GroupRenderer'
import { TextRenderer } from './TextRenderer'
import { ArrowRenderer } from './ArrowRenderer'
import { ShapeRenderer } from './ShapeRenderer'

interface CanvasElementsProps {
  scale: number
  boardId?: string
  selectedWidgetId?: string | null
  dragOverGroupId?: string | null
}

export const CanvasElements = memo(function CanvasElements({
  scale,
  boardId = ROOT_BOARD_ID,
  dragOverGroupId,
}: CanvasElementsProps) {
  const allElements = useStore((s) => s.canvasElements)
  const elements = useMemo(
    () => allElements.filter((e) => e.boardId === boardId),
    [allElements, boardId]
  )
  const selectedElementId = useStore((s) => s.selectedElementId)
  const setSelectedElement = useStore((s) => s.setSelectedElement)

  const handleSelect = (id: string) => {
    setSelectedElement(id)
  }

  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements]
  )

  return (
    <>
      {sortedElements.map((element) => {
        const isSelected = selectedElementId === element.id
        switch (element.type) {
          case 'group':
            return (
              <GroupRenderer
                key={element.id}
                element={element}
                scale={scale}
                isSelected={isSelected}
                onSelect={handleSelect}
                isDragOver={dragOverGroupId === element.id}
              />
            )
          case 'text':
            return (
              <TextRenderer
                key={element.id}
                element={element}
                scale={scale}
                isSelected={isSelected}
                onSelect={handleSelect}
              />
            )
          case 'arrow':
            return (
              <ArrowRenderer
                key={element.id}
                element={element}
                scale={scale}
                isSelected={isSelected}
                onSelect={handleSelect}
              />
            )
          case 'shape':
            return (
              <ShapeRenderer
                key={element.id}
                element={element}
                scale={scale}
                isSelected={isSelected}
                onSelect={handleSelect}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
})
