import { Paper, UnstyledButton, Group, Text } from '@mantine/core'
import { IconCopy, IconTrash, IconLock, IconLockOpen, IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import { useStore, ROOT_BOARD_ID } from '../store/useStore'

interface ContextMenuProps {
  x: number
  y: number
  widgetId: string
  boardId?: string
  onClose: () => void
}

export function ContextMenu({ x, y, widgetId, boardId, onClose }: ContextMenuProps) {
  const removeWidget = useStore((s) => s.removeWidget)
  const duplicateWidget = useStore((s) => s.duplicateWidget)
  const toggleLockWidget = useStore((s) => s.toggleLockWidget)
  const bringToFront = useStore((s) => s.bringToFront)
  const sendToBack = useStore((s) => s.sendToBack)
  const widget = useStore((s) => s.boards[boardId ?? ROOT_BOARD_ID]?.find((w) => w.id === widgetId))
  const locked = widget?.locked ?? false

  return (
    <Paper
      shadow="xl"
      radius="md"
      withBorder
      className="wb-context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 50,
        width: 170,
        overflow: 'hidden',
        padding: 4,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <UnstyledButton
        onClick={() => { duplicateWidget(widgetId, boardId); onClose() }}
        p="xs"
        w="100%"
        style={{ borderRadius: 'var(--mantine-radius-md)' }}
        styles={{
          root: {
            transition: 'all 150ms ease',
            '&:hover': { backgroundColor: 'var(--wb-accent-subtle)' },
          },
        }}
      >
        <Group gap="xs">
          <IconCopy size={14} color="var(--wb-text-dimmed)" />
          <Text size="sm" c="gray.3" fw={500}>Duplicate</Text>
        </Group>
      </UnstyledButton>
      <UnstyledButton
        onClick={() => { bringToFront(widgetId, boardId); onClose() }}
        p="xs"
        w="100%"
        style={{ borderRadius: 'var(--mantine-radius-md)' }}
        styles={{
          root: {
            transition: 'all 150ms ease',
            '&:hover': { backgroundColor: 'var(--wb-accent-subtle)' },
          },
        }}
      >
        <Group gap="xs">
          <IconArrowUp size={14} color="var(--wb-text-dimmed)" />
          <Text size="sm" c="gray.3" fw={500}>Bring to Front</Text>
        </Group>
      </UnstyledButton>
      <UnstyledButton
        onClick={() => { sendToBack(widgetId, boardId); onClose() }}
        p="xs"
        w="100%"
        style={{ borderRadius: 'var(--mantine-radius-md)' }}
        styles={{
          root: {
            transition: 'all 150ms ease',
            '&:hover': { backgroundColor: 'var(--wb-accent-subtle)' },
          },
        }}
      >
        <Group gap="xs">
          <IconArrowDown size={14} color="var(--wb-text-dimmed)" />
          <Text size="sm" c="gray.3" fw={500}>Send to Back</Text>
        </Group>
      </UnstyledButton>
      <UnstyledButton
        onClick={() => { toggleLockWidget(widgetId, boardId); onClose() }}
        p="xs"
        w="100%"
        style={{ borderRadius: 'var(--mantine-radius-md)' }}
        styles={{
          root: {
            transition: 'all 150ms ease',
            '&:hover': { backgroundColor: 'var(--wb-accent-subtle)' },
          },
        }}
      >
        <Group gap="xs">
          {locked ? (
            <IconLockOpen size={14} color="var(--wb-text-dimmed)" />
          ) : (
            <IconLock size={14} color="var(--wb-text-dimmed)" />
          )}
          <Text size="sm" c="gray.3" fw={500}>{locked ? 'Unlock' : 'Lock'}</Text>
        </Group>
      </UnstyledButton>
      <div style={{ height: 1, backgroundColor: 'var(--wb-border)', margin: '2px 4px' }} />
      <UnstyledButton
        onClick={() => { removeWidget(widgetId, boardId); onClose() }}
        p="xs"
        w="100%"
        style={{ borderRadius: 'var(--mantine-radius-md)' }}
        styles={{
          root: {
            transition: 'all 150ms ease',
            '&:hover': { backgroundColor: 'rgba(220, 38, 38, 0.1)' },
          },
        }}
      >
        <Group gap="xs">
          <IconTrash size={14} color="var(--mantine-color-red-4)" />
          <Text size="sm" c="red.4" fw={500}>Delete</Text>
        </Group>
      </UnstyledButton>
    </Paper>
  )
}
