import { Group, Text, ActionIcon } from '@mantine/core'
import { IconEdit, IconEye } from '@tabler/icons-react'

interface WidgetHeaderProps {
  title: string
  editing: boolean
  onToggleEdit: () => void
  rightSlot?: React.ReactNode
  icon?: React.ReactNode
  color?: string
}

export function WidgetHeader({ title, editing, onToggleEdit, rightSlot, icon, color }: WidgetHeaderProps) {
  return (
    <Group
      justify="space-between"
      px="sm"
      py={6}
      style={{
        borderBottom: '1px solid var(--wb-border)',
        background: 'var(--wb-surface-hover)',
      }}
    >
      <Group gap={6}>
        {icon && (
          <span style={{
            color: color || 'var(--wb-accent)',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.8,
            transition: 'opacity 150ms ease',
          }}>
            {icon}
          </span>
        )}
        <Text size="xs" fw={600} c="dimmed" style={{ letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: 10 }}>
          {title}
        </Text>
      </Group>
      <Group gap={2}>
        {rightSlot}
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xs"
          onClick={onToggleEdit}
          style={{
            transition: 'all 150ms ease',
            opacity: 0.5,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'var(--wb-accent-subtle)' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          {editing ? <IconEye size={13} /> : <IconEdit size={13} />}
        </ActionIcon>
      </Group>
    </Group>
  )
}
