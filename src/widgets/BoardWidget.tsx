import { memo, useState, useCallback } from 'react'
import { Text, Group, ActionIcon, TextInput, Tooltip, Badge } from '@mantine/core'
import { IconFolder, IconArrowRight, IconEdit, IconCheck } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'

interface Props {
  widget: Widget
  onOpenBoard?: (boardId: string) => void
}

const BOARD_COLORS = [
  '#6d28d9',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#be185d',
]

export const BoardWidget = memo(function BoardWidget({ widget, onOpenBoard }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const boards = useStore((s) => s.boards)
  const [editing, setEditing] = useState(false)
  const [titleInput, setTitleInput] = useState('')

  const content =
    widget.content.type === 'board'
      ? widget.content
      : { type: 'board' as const, boardId: '', title: 'Board' }

  const boardWidgets = boards[content.boardId] || []
  const widgetCount = boardWidgets.length

  const startEdit = () => {
    setTitleInput(content.title)
    setEditing(true)
  }

  const saveTitle = useCallback(() => {
    updateWidget(widget.id, {
      content: { ...content, title: titleInput.trim() || 'Board' },
    })
    setEditing(false)
  }, [widget.id, content, titleInput, updateWidget])

  const setColor = useCallback(
    (color: string) => {
      updateWidget(widget.id, { content: { ...content, color } })
    },
    [widget.id, content, updateWidget]
  )

  const boardColor = (content as { color?: string }).color || BOARD_COLORS[0]!

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--wb-surface-hover)',
        borderRadius: 'var(--wb-radius)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 4,
          backgroundColor: boardColor,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 10,
          gap: 8,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--wb-radius)',
            background: `linear-gradient(135deg, ${boardColor}30, ${boardColor}10)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconFolder size={24} style={{ color: boardColor, opacity: 0.8 }} />
        </div>

        {editing ? (
          <Group gap="xs">
            <TextInput
              value={titleInput}
              onChange={(e) => setTitleInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle()
              }}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
              autoFocus
            />
            <ActionIcon
              variant="light"
              color="violet"
              size="sm"
              onClick={saveTitle}
              aria-label="Save title"
            >
              <IconCheck size={14} />
            </ActionIcon>
          </Group>
        ) : (
          <Group gap="xs">
            <Text fw={600} size="sm" c="gray.3">
              {content.title}
            </Text>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xs"
              onClick={startEdit}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Rename board"
            >
              <IconEdit size={10} />
            </ActionIcon>
          </Group>
        )}

        <Badge size="xs" variant="light" color="gray">
          {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
        </Badge>

        <ActionIcon
          variant="filled"
          color="violet"
          size="lg"
          radius="xl"
          onClick={() => onOpenBoard?.(content.boardId)}
          aria-label={`Open ${content.title}`}
          style={{
            boxShadow: 'var(--wb-glow-accent)',
            transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          className="board-enter-btn"
        >
          <IconArrowRight size={20} />
        </ActionIcon>
      </div>

      <Group
        gap={4}
        px={8}
        py={6}
        justify="center"
        style={{
          borderTop: '1px solid var(--wb-border)',
        }}
      >
        {BOARD_COLORS.map((c) => (
          <Tooltip key={c} label={c}>
            <button
              type="button"
              onClick={() => setColor(c)}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: c,
                border: boardColor === c ? '2px solid white' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 150ms ease',
                transform: boardColor === c ? 'scale(1.2)' : 'none',
              }}
            />
          </Tooltip>
        ))}
      </Group>

      <style>{`
        .board-enter-btn:hover { transform: scale(1.1); }
      `}</style>
    </div>
  )
})

export default BoardWidget
