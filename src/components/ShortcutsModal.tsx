import { useState, useEffect } from 'react'
import { Paper, Text, Stack, Group, ActionIcon, Kbd } from '@mantine/core'
import { IconX, IconKeyboard } from '@tabler/icons-react'

interface Shortcut {
  keys: string[]
  description: string
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'Z'], description: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
  { keys: ['Ctrl', 'Y'], description: 'Redo (alt)' },
  { keys: ['Delete'], description: 'Delete selected widget' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate widget' },
  { keys: ['Escape'], description: 'Deselect / Close menu' },
  { keys: ['Ctrl', 'K'], description: 'Command palette' },
  { keys: ['Ctrl', 'Shift', 'A'], description: 'AI Agent' },
  { keys: ['Ctrl', '0'], description: 'Zoom to fit' },
  { keys: ['Scroll'], description: 'Zoom in/out' },
  { keys: ['Click + Drag'], description: 'Pan canvas' },
  { keys: ['Shift + Click'], description: 'Multi-select widget' },
  { keys: ['Right Click'], description: 'Widget context menu' },
  { keys: ['?'], description: 'Show this help' },
]

function isMac(): boolean {
  return typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().includes('MAC')
}

function formatKey(key: string): string {
  if (isMac()) {
    return key.replace('Ctrl', '⌘').replace('Shift', '⇧')
  }
  return key
}

export function ShortcutsModal() {
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable)
        return

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setOpened((prev) => !prev)
      }
      if (e.key === 'Escape' && opened) {
        setOpened(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [opened])

  if (!opened) return null

  return (
    <Paper
      shadow="xl"
      radius="lg"
      p="lg"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 200,
        width: 380,
        maxHeight: '80vh',
        overflow: 'auto',
        backgroundColor: 'var(--wb-surface)',
        border: '1px solid var(--wb-border)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconKeyboard size={18} style={{ color: 'var(--wb-accent)' }} />
          <Text size="lg" fw={600} c="gray.1">
            Keyboard Shortcuts
          </Text>
        </Group>
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setOpened(false)}>
          <IconX size={16} />
        </ActionIcon>
      </Group>

      <Stack gap={6}>
        {SHORTCUTS.map((shortcut, i) => (
          <Group
            key={i}
            justify="space-between"
            px="xs"
            py={4}
            style={{
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: i % 2 === 0 ? 'var(--wb-surface-hover)' : 'transparent',
            }}
          >
            <Text size="sm" c="gray.3">
              {shortcut.description}
            </Text>
            <Group gap={4}>
              {shortcut.keys.map((key, ki) => (
                <Kbd
                  key={ki}
                  style={{
                    backgroundColor: 'var(--mantine-color-dark-6)',
                    border: '1px solid var(--wb-border)',
                    color: 'var(--mantine-color-gray-3)',
                  }}
                >
                  {formatKey(key)}
                </Kbd>
              ))}
            </Group>
          </Group>
        ))}
      </Stack>

      <Text size="xs" c="dimmed" ta="center" mt="md">
        Press{' '}
        <Kbd
          style={{
            backgroundColor: 'var(--mantine-color-dark-6)',
            border: '1px solid var(--wb-border)',
            color: 'var(--mantine-color-gray-3)',
          }}
        >
          ?
        </Kbd>{' '}
        to toggle this panel
      </Text>
    </Paper>
  )
}

export default ShortcutsModal
