import { Center, Stack, Text, Group, Button } from '@mantine/core'
import { IconKeyboard, IconPlus } from '@tabler/icons-react'

interface EmptyBoardStateProps {
  onAddWidget: () => void
  isRoot: boolean
}

export function EmptyBoardState({ isRoot, onAddWidget }: EmptyBoardStateProps) {
  return (
    <Center h="100%" style={{ pointerEvents: 'auto' }}>
      <Stack align="center" gap="lg" p="xl">
        <div
          className="wb-empty-icon"
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
              ? 'Add your first widget to get started'
              : 'Add widgets to this board to get started'}
          </Text>
        </Stack>
        <Group gap={8}>
          <Button
            variant="light"
            color="violet"
            size="sm"
            radius="md"
            leftSection={<IconPlus size={16} />}
            onClick={onAddWidget}
          >
            Add Widget
          </Button>
          <div
            style={{
              padding: '6px 12px',
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
        </Group>
      </Stack>
    </Center>
  )
}
