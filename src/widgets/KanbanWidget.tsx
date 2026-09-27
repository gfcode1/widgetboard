import { memo, useState, useCallback } from 'react'
import { Text, Group, ActionIcon, TextInput } from '@mantine/core'
import { IconPlus, IconX, IconGripVertical } from '@tabler/icons-react'
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

function DroppableColumn({
  id,
  children,
  label,
}: {
  id: string
  children: React.ReactNode
  label: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: '0 0 180px',
        minHeight: 40,
        background: isOver ? 'var(--wb-accent-subtle)' : 'var(--wb-surface-hover)',
        borderRadius: 'var(--wb-radius-sm)',
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'background 150ms ease',
        border: `1px solid ${isOver ? 'var(--wb-accent)' : 'transparent'}`,
      }}
    >
      <Text size="xs" fw={600} c="dimmed" px={4} style={{ flexShrink: 0 }}>
        {label}
      </Text>
      {children}
    </div>
  )
}

function DraggableCard({
  id,
  columnId,
  text,
  onRemove,
}: {
  id: string
  columnId: string
  text: string
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { columnId } })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '4px 8px',
        background: 'var(--wb-surface)',
        borderRadius: 'var(--wb-radius-sm)',
        border: '1px solid var(--wb-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none',
      }}
    >
      <Group gap={4} style={{ flex: 1 }}>
        <IconGripVertical size={12} style={{ color: 'var(--wb-text-dimmed)' }} />
        <Text size="xs" style={{ flex: 1 }}>
          {text}
        </Text>
      </Group>
      <ActionIcon
        size="xs"
        variant="subtle"
        color="red"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        aria-label="Remove card"
      >
        <IconX size={10} />
      </ActionIcon>
    </div>
  )
}

export const KanbanWidget = memo(function KanbanWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [newCardText, setNewCardText] = useState<Record<string, string>>({})
  const [newColumnTitle, setNewColumnTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const content =
    widget.content.type === 'kanban'
      ? widget.content
      : {
          type: 'kanban' as const,
          columns: [
            { id: 'col-1', title: 'To Do', cards: [] },
            { id: 'col-2', title: 'Done', cards: [] },
          ],
        }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const fromColId = active.data.current?.columnId as string
      const toColId = over.id as string

      const updated = content.columns.map((col) => {
        if (col.id === fromColId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== active.id) }
        }
        if (col.id === toColId) {
          const card = content.columns
            .find((c) => c.id === fromColId)
            ?.cards.find((c) => c.id === active.id)
          if (card) {
            return { ...col, cards: [...col.cards, card] }
          }
        }
        return col
      })

      updateWidget(widget.id, { content: { ...content, columns: updated } })
    },
    [content, widget.id, updateWidget]
  )

  const addCard = useCallback(
    (columnId: string) => {
      const text = (newCardText[columnId] || '').trim()
      if (!text) return
      const updated = content.columns.map((col) =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, { id: `card-${Date.now()}`, text }] }
          : col
      )
      updateWidget(widget.id, { content: { ...content, columns: updated } })
      setNewCardText((prev) => ({ ...prev, [columnId]: '' }))
    },
    [newCardText, content, widget.id, updateWidget]
  )

  const removeCard = useCallback(
    (columnId: string, cardId: string) => {
      const updated = content.columns.map((col) =>
        col.id === columnId ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) } : col
      )
      updateWidget(widget.id, { content: { ...content, columns: updated } })
    },
    [content, widget.id, updateWidget]
  )

  const addColumn = useCallback(() => {
    const title = newColumnTitle.trim()
    if (!title) return
    const updated = [...content.columns, { id: `col-${Date.now()}`, title, cards: [] }]
    updateWidget(widget.id, { content: { ...content, columns: updated } })
    setNewColumnTitle('')
  }, [newColumnTitle, content, widget.id, updateWidget])

  const removeColumn = useCallback(
    (columnId: string) => {
      const updated = content.columns.filter((col) => col.id !== columnId)
      updateWidget(widget.id, { content: { ...content, columns: updated } })
    },
    [content, widget.id, updateWidget]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Kanban"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconGripVertical size={16} />}
        color="var(--mantine-color-blue-5)"
        widgetId={widget.id}
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 6, padding: 8, overflow: 'auto', flex: 1 }}>
          {content.columns.map((col) => (
            <DroppableColumn key={col.id} id={col.id} label={col.title}>
              {col.cards.map((card) => (
                <DraggableCard
                  key={card.id}
                  id={card.id}
                  columnId={col.id}
                  text={card.text}
                  onRemove={() => removeCard(col.id, card.id)}
                />
              ))}
              <Group gap={4}>
                <TextInput
                  size="xs"
                  placeholder="+ card"
                  value={newCardText[col.id] || ''}
                  onChange={(e) => {
                    const val = e.target?.value
                    if (val !== undefined) {
                      setNewCardText((prev) => ({ ...prev, [col.id]: val }))
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && addCard(col.id)}
                  styles={{
                    input: {
                      background: 'var(--wb-bg)',
                      borderColor: 'var(--wb-border)',
                      color: 'var(--wb-text)',
                      fontSize: 11,
                    },
                  }}
                  aria-label={`New card in ${col.title}`}
                />
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={() => {
                    if (content.columns.length > 1) removeColumn(col.id)
                  }}
                  aria-label={`Remove column ${col.title}`}
                >
                  <IconX size={10} />
                </ActionIcon>
              </Group>
            </DroppableColumn>
          ))}
          <Group gap={4} style={{ flex: '0 0 auto', alignSelf: 'flex-start' }}>
            <TextInput
              size="xs"
              placeholder="New column"
              value={newColumnTitle}
              onChange={(e) => {
                const val = e.target?.value
                if (val !== undefined) setNewColumnTitle(val)
              }}
              onKeyDown={(e) => e.key === 'Enter' && addColumn()}
              styles={{
                input: {
                  background: 'var(--wb-bg)',
                  borderColor: 'var(--wb-border)',
                  color: 'var(--wb-text)',
                  fontSize: 11,
                  width: 100,
                },
              }}
              aria-label="New column title"
            />
            <ActionIcon
              size="xs"
              variant="subtle"
              color="blue"
              onClick={addColumn}
              aria-label="Add column"
            >
              <IconPlus size={12} />
            </ActionIcon>
          </Group>
        </div>
      </DndContext>
    </div>
  )
})

export default KanbanWidget
