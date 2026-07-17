import { Center, Stack, Text, Group } from '@mantine/core'
import { IconKeyboard, IconPlus } from '@tabler/icons-react'

interface EmptyBoardStateProps {
  onAddWidget: () => void
  isRoot: boolean
}

export function EmptyBoardState({ isRoot }: EmptyBoardStateProps) {
  return (
    <Center h="100%" style={{ pointerEvents: 'auto' }}>
      <Stack align="center" gap="lg" p="xl">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--wb-accent-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconPlus size={28} color="var(--wb-accent)" />
        </div>
        <Stack align="center" gap={4}>
          <Text size="lg" fw={600} c="gray.3">
            {isRoot ? 'Your canvas is empty' : 'This board is empty'}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {isRoot
              ? 'Click the + button or press Ctrl+K to add your first widget'
              : 'Add widgets to this board to get started'}
          </Text>
        </Stack>
        <Group gap={6}>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--wb-radius-sm)',
              backgroundColor: 'var(--wb-surface-hover)',
              border: '1px solid var(--wb-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <IconKeyboard size={14} color="var(--wb-accent)" />
            <Text size="xs" c="dimmed">
              Ctrl+K
            </Text>
          </div>
          <Text size="xs" c="dimmed">
            or
          </Text>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--wb-radius-sm)',
              backgroundColor: 'var(--wb-surface-hover)',
              border: '1px solid var(--wb-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <IconPlus size={14} color="var(--wb-accent)" />
            <Text size="xs" c="dimmed">
              Add Widget
            </Text>
          </div>
        </Group>
      </Stack>
    </Center>
  )
}
