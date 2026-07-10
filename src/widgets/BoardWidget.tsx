import { memo, useState, useCallback } from 'react'
import { Text, TextInput, Group, Badge } from '@mantine/core'
import { IconFolder, IconArrowRight } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
  onOpenBoard: (boardId: string) => void
}

export const BoardWidget = memo(function BoardWidget({ widget, onOpenBoard }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const boards = useStore((s) => s.boards)
  const [editing, setEditing] = useState(false)

  const boardId = widget.content.type === 'board' ? widget.content.boardId : ''
  const title = widget.content.type === 'board' ? widget.content.title : ''
  const widgetCount = boardId ? (boards[boardId] ?? []).length : 0

  const handleTitleChange = useCallback(
    (value: string) => {
      if (widget.content.type !== 'board') return
      updateWidget(widget.id, {
        content: { type: 'board', boardId: widget.content.boardId, title: value },
      })
    },
    [widget.id, widget.content, updateWidget]
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setEditing(true)
    },
    []
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!editing && boardId) {
        onOpenBoard(boardId)
      }
    },
    [editing, boardId, onOpenBoard]
  )

  if (widget.content.type !== 'board') return null

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      onDoubleClick={handleDoubleClick}
    >
      <WidgetHeader
        title="Board"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          gap: 8,
          cursor: editing ? 'text' : 'pointer',
          opacity: editing ? 0.9 : 1,
        }}
        onClick={handleClick}
      >
        {editing ? (
          <TextInput
            value={title}
            onChange={(e) => handleTitleChange(e.currentTarget.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(false)
            }}
            size="sm"
            variant="unstyled"
            style={{
              textAlign: 'center',
              '& input': {
                textAlign: 'center',
                color: 'var(--mantine-color-gray-2)',
                fontWeight: 500,
                fontSize: 'var(--mantine-font-size-md)',
              },
            }}
            autoFocus
          />
        ) : (
          <>
            <Group gap={8} align="center">
              <IconFolder size={28} style={{ color: 'var(--wb-accent)' }} />
              <Text fw={600} size="md" c="gray.2">
                {title}
              </Text>
            </Group>
            <Group gap={6} align="center">
              <Badge
                size="sm"
                variant="light"
                color="gray"
                style={{ backgroundColor: 'var(--wb-accent-subtle)' }}
              >
                {widgetCount} {widgetCount === 1 ? 'widget' : 'widgets'}
              </Badge>
              <IconArrowRight
                size={14}
                style={{ color: 'var(--wb-text-dimmed)' }}
              />
            </Group>
          </>
        )}
      </div>
    </div>
  )
})

export default BoardWidget
