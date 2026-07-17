import { memo, useState, useCallback, useRef, useMemo } from 'react'
import { Text, TextInput, ActionIcon, Stack, Group, Checkbox, Badge, Tooltip } from '@mantine/core'
import {
  IconPlus,
  IconX,
  IconGripVertical,
  IconTrash,
  IconCheckbox,
  IconChevronRight,
  IconChevronDown,
  IconCalendar,
  IconFilter,
  IconCheck,
} from '@tabler/icons-react'
import type { Widget, TodoItem } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

const PRIORITY_COLORS = { low: 'gray', medium: 'blue', high: 'red' } as const

function formatDateBadge(d?: string) {
  if (!d) return null
  const date = new Date(d + 'T00:00:00')
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000)
  if (diffDays < 0)
    return (
      <Badge size="xs" color="red" variant="light">
        Overdue
      </Badge>
    )
  if (diffDays === 0)
    return (
      <Badge size="xs" color="orange" variant="light">
        Today
      </Badge>
    )
  if (diffDays === 1)
    return (
      <Badge size="xs" color="yellow" variant="light">
        Tomorrow
      </Badge>
    )
  return (
    <Badge size="xs" color="gray" variant="light">
      {d}
    </Badge>
  )
}

type FilterType = 'all' | 'active' | 'completed'

export const TodoWidget = memo(function TodoWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content =
    widget.content.type === 'todo' ? widget.content : { type: 'todo' as const, items: [] }
  const contentRef = useRef(content)
  contentRef.current = content
  const [newText, setNewText] = useState('')
  const [editing, setEditing] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [datePickerForId, setDatePickerForId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  const addItem = useCallback(() => {
    if (!newText.trim()) return
    const newItem: TodoItem = {
      id: `todo-${Date.now()}`,
      text: newText.trim(),
      done: false,
      priority: newPriority,
    }
    updateWidget(widget.id, {
      content: { ...contentRef.current, items: [...contentRef.current.items, newItem] },
    })
    setNewText('')
  }, [widget.id, newText, newPriority, updateWidget])

  const toggleItem = useCallback(
    (id: string) => {
      const c = contentRef.current
      const toggleInList = (items: TodoItem[]): TodoItem[] =>
        items.map((item) =>
          item.id === id
            ? { ...item, done: !item.done }
            : item.subtasks
              ? { ...item, subtasks: toggleInList(item.subtasks) }
              : item
        )
      updateWidget(widget.id, { content: { ...c, items: toggleInList(c.items) } })
    },
    [widget.id, updateWidget]
  )

  const removeItem = useCallback(
    (id: string) => {
      const c = contentRef.current
      const removeFromList = (items: TodoItem[]): TodoItem[] =>
        items
          .filter((item) => item.id !== id)
          .map((item) =>
            item.subtasks ? { ...item, subtasks: removeFromList(item.subtasks) } : item
          )
      updateWidget(widget.id, { content: { ...c, items: removeFromList(c.items) } })
    },
    [widget.id, updateWidget]
  )

  const addSubtask = useCallback(
    (parentId: string, text: string) => {
      if (!text.trim()) return
      const c = contentRef.current
      const addToParent = (items: TodoItem[]): TodoItem[] =>
        items.map((item) =>
          item.id === parentId
            ? {
                ...item,
                subtasks: [
                  ...(item.subtasks || []),
                  { id: `todo-${Date.now()}`, text: text.trim(), done: false },
                ],
              }
            : item.subtasks
              ? { ...item, subtasks: addToParent(item.subtasks) }
              : item
        )
      updateWidget(widget.id, { content: { ...c, items: addToParent(c.items) } })
    },
    [widget.id, updateWidget]
  )

  const setDueDate = useCallback(
    (id: string, date: string) => {
      const c = contentRef.current
      const setInList = (items: TodoItem[]): TodoItem[] =>
        items.map((item) =>
          item.id === id
            ? { ...item, dueDate: date || undefined }
            : item.subtasks
              ? { ...item, subtasks: setInList(item.subtasks) }
              : item
        )
      updateWidget(widget.id, { content: { ...c, items: setInList(c.items) } })
      setDatePickerForId(null)
    },
    [widget.id, updateWidget]
  )

  const moveItem = useCallback(
    (fromId: string, toId: string) => {
      const c = contentRef.current
      const items = [...c.items]
      const fromIndex = items.findIndex((i) => i.id === fromId)
      const toIndex = items.findIndex((i) => i.id === toId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
      const moved = items.splice(fromIndex, 1)[0]
      if (!moved) return
      items.splice(toIndex, 0, moved)
      updateWidget(widget.id, { content: { ...c, items } })
    },
    [widget.id, updateWidget]
  )

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      const sourceId = e.dataTransfer.getData('text/plain')
      if (sourceId && sourceId !== targetId) moveItem(sourceId, targetId)
      setDraggedId(null)
      setDragOverId(null)
    },
    [moveItem]
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const doneCount = content.items.filter((i) => i.done).length
  const totalCount = content.items.length
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

  const filteredItems = useMemo(() => {
    if (filter === 'active') return content.items.filter((i) => !i.done)
    if (filter === 'completed') return content.items.filter((i) => i.done)
    return content.items
  }, [content.items, filter])

  const clearCompleted = useCallback(() => {
    const c = contentRef.current
    const removeDone = (items: TodoItem[]): TodoItem[] =>
      items
        .filter((item) => !item.done)
        .map((item) => (item.subtasks ? { ...item, subtasks: removeDone(item.subtasks) } : item))
    updateWidget(widget.id, { content: { ...c, items: removeDone(c.items) } })
  }, [widget.id, updateWidget])

  const renderItem = useCallback(
    (item: TodoItem, depth: number = 0) => {
      const isExpanded = expandedIds.has(item.id)
      const hasSubtasks = item.subtasks && item.subtasks.length > 0
      const showDatePicker = datePickerForId === item.id

      return (
        <div key={item.id}>
          <Group
            className="todo-item"
            gap="xs"
            px="xs"
            py={2}
            draggable={depth === 0}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, item.id)}
            style={{
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: item.done
                ? 'var(--wb-accent-subtle)'
                : draggedId === item.id
                  ? 'rgba(139, 92, 246, 0.15)'
                  : dragOverId === item.id
                    ? 'rgba(139, 92, 246, 0.08)'
                    : 'transparent',
              borderLeft:
                dragOverId === item.id && draggedId !== item.id
                  ? '2px solid var(--wb-accent)'
                  : '2px solid transparent',
              opacity: item.done ? 0.5 : draggedId === item.id ? 0.5 : 1,
              cursor: 'grab',
              transition:
                'background-color 150ms ease, border-color 150ms ease, opacity 150ms ease',
              pointerEvents: 'auto',
              paddingLeft: depth * 16 + 4,
            }}
          >
            {hasSubtasks && (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => toggleExpand(item.id)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isExpanded ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
              </ActionIcon>
            )}
            {!hasSubtasks && <div style={{ width: 20 }} />}
            <IconGripVertical
              size={12}
              style={{ color: 'var(--wb-text-dimmed)', opacity: 0.4, cursor: 'grab' }}
            />
            <Checkbox
              checked={item.done}
              onChange={() => toggleItem(item.id)}
              size="xs"
              color="violet"
              style={{ pointerEvents: 'auto' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                size="sm"
                c={item.done ? 'dimmed' : 'gray.3'}
                style={{
                  textDecoration: item.done ? 'line-through' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.text}
              </Text>
              <Group gap={4}>
                {item.priority && item.priority !== 'medium' && (
                  <Badge
                    size="xs"
                    color={PRIORITY_COLORS[item.priority]}
                    variant="dot"
                    style={{ fontSize: 9 }}
                  >
                    {item.priority}
                  </Badge>
                )}
                {formatDateBadge(item.dueDate)}
              </Group>
            </div>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setDatePickerForId(showDatePicker ? null : item.id)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Set due date"
              style={{ opacity: 0.5, pointerEvents: 'auto' }}
            >
              <IconCalendar size={12} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => removeItem(item.id)}
              style={{ opacity: 0.5, pointerEvents: 'auto' }}
            >
              <IconX size={12} />
            </ActionIcon>
          </Group>
          {showDatePicker && (
            <div style={{ paddingLeft: depth * 16 + 40, paddingRight: 8, paddingBottom: 4 }}>
              <input
                type="date"
                value={item.dueDate || ''}
                onChange={(e) => setDueDate(item.id, e.target.value)}
                onBlur={() => setDatePickerForId(null)}
                style={{
                  width: '100%',
                  background: 'var(--mantine-color-dark-6)',
                  color: 'var(--wb-text)',
                  border: '1px solid var(--wb-border)',
                  borderRadius: 'var(--wb-radius-sm)',
                  padding: '4px 8px',
                  fontSize: 11,
                  pointerEvents: 'auto',
                }}
              />
            </div>
          )}
          {isExpanded && hasSubtasks && (
            <Stack gap={0}>
              {item.subtasks?.map((sub) => renderItem(sub, depth + 1))}
              <Group gap="xs" px="xs" py={2} pl={(depth + 1) * 16 + 24}>
                <TextInput
                  placeholder="Add subtask..."
                  variant="unstyled"
                  size="xs"
                  flex={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      addSubtask(item.id, e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ pointerEvents: 'auto' }}
                />
              </Group>
            </Stack>
          )}
        </div>
      )
    },
    [
      expandedIds,
      draggedId,
      dragOverId,
      datePickerForId,
      handleDragStart,
      handleDragOver,
      handleDragEnd,
      handleDrop,
      toggleItem,
      removeItem,
      toggleExpand,
      setDueDate,
      addSubtask,
    ]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .todo-item:hover { background-color: var(--wb-surface-hover) !important; }
        .priority-badge:hover { transform: scale(1.15); }
        .todo-completed { opacity: 0.6; }
        .filter-btn { transition: all 150ms ease; }
        .filter-btn:hover { background: var(--wb-accent-subtle); }
        .filter-btn.active { background: var(--wb-accent); color: white; }
      `}</style>
      <WidgetHeader
        title={`Tasks ${totalCount > 0 ? `(${doneCount}/${totalCount})` : ''}`}
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconCheckbox size={12} />}
        rightSlot={
          <Group gap={2}>
            {totalCount > 0 && (
              <Tooltip label={`Filter: ${filter}`}>
                <ActionIcon
                  variant="subtle"
                  color={filter !== 'all' ? 'violet' : 'gray'}
                  size="xs"
                  onClick={() => {
                    const next: FilterType =
                      filter === 'all' ? 'active' : filter === 'active' ? 'completed' : 'all'
                    setFilter(next)
                  }}
                  style={{ pointerEvents: 'auto', opacity: 0.6 }}
                  aria-label={`Filter: ${filter}`}
                >
                  <IconFilter size={12} />
                </ActionIcon>
              </Tooltip>
            )}
            {doneCount > 0 ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                onClick={clearCompleted}
                style={{ pointerEvents: 'auto', opacity: 0.6 }}
              >
                <IconTrash size={12} />
              </ActionIcon>
            ) : undefined}
          </Group>
        }
      />
      {totalCount > 0 && (
        <div
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label={`${doneCount} of ${totalCount} tasks completed`}
          style={{ padding: '8px 8px 0', pointerEvents: 'auto' }}
        >
          <div
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'var(--wb-border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: 2,
                backgroundColor:
                  progress === 100 ? 'var(--mantine-color-green-5)' : 'var(--wb-accent)',
                transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow:
                  progress === 100
                    ? '0 0 8px rgba(34, 197, 94, 0.4)'
                    : '0 0 6px rgba(139, 92, 246, 0.3)',
              }}
            />
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {filteredItems.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 8,
            }}
          >
            {totalCount === 0 ? (
              <>
                <IconCheckbox size={24} style={{ color: 'var(--wb-text-dimmed)', opacity: 0.5 }} />
                <Text size="xs" c="dimmed" fs="italic">
                  No tasks yet. Add one below!
                </Text>
              </>
            ) : (
              <>
                <IconCheck
                  size={20}
                  style={{ color: 'var(--mantine-color-green-5)', opacity: 0.7 }}
                />
                <Text size="xs" c="dimmed" fs="italic">
                  {filter === 'active'
                    ? 'All tasks completed!'
                    : filter === 'completed'
                      ? 'No completed tasks'
                      : 'No tasks'}
                </Text>
              </>
            )}
          </div>
        ) : (
          <Stack gap={2}>{filteredItems.map((item) => renderItem(item))}</Stack>
        )}
      </div>
      <Group gap="xs" px="sm" py={8} style={{ borderTop: '1px solid var(--wb-border)' }}>
        <TextInput
          value={newText}
          onChange={(e) => setNewText(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addItem()
          }}
          placeholder="Add task..."
          variant="unstyled"
          size="sm"
          flex={1}
          style={{ pointerEvents: 'auto' }}
        />
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={() =>
            setNewPriority(
              newPriority === 'medium' ? 'high' : newPriority === 'high' ? 'low' : 'medium'
            )
          }
          onMouseDown={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto' }}
        >
          <Badge
            size="md"
            color={PRIORITY_COLORS[newPriority]}
            variant="filled"
            className="priority-badge"
            style={{
              cursor: 'pointer',
              fontSize: 10,
              transition: 'transform 150ms ease',
              textTransform: 'uppercase',
            }}
          >
            {newPriority[0]?.toUpperCase()}
          </Badge>
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="violet"
          size="sm"
          onClick={addItem}
          disabled={!newText.trim()}
          style={{ pointerEvents: 'auto' }}
        >
          <IconPlus size={16} />
        </ActionIcon>
      </Group>
    </div>
  )
})

export default TodoWidget
