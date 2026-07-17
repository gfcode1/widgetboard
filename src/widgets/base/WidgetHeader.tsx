import { useState, memo } from 'react'
import { Group, Text, ActionIcon, Menu } from '@mantine/core'
import {
  IconEdit,
  IconEye,
  IconDotsVertical,
  IconCopy,
  IconTrash,
  IconLock,
  IconLockOpen,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react'
import { useStore } from '../../store/useStore'
import { useToast } from '../../components/Toast'
import { useWidgetContext } from '../../components/Widget'

interface WidgetHeaderProps {
  title: string
  editing: boolean
  onToggleEdit: () => void
  rightSlot?: React.ReactNode
  icon?: React.ReactNode
  color?: string
  widgetId?: string
  boardId?: string
}

export const WidgetHeader = memo(function WidgetHeader({
  title,
  editing,
  onToggleEdit,
  rightSlot,
  icon,
  color,
  widgetId,
  boardId,
}: WidgetHeaderProps) {
  const ctx = useWidgetContext()
  const effectiveWidgetId = widgetId ?? ctx.widgetId
  const effectiveBoardId = boardId ?? ctx.boardId
  const [menuOpen, setMenuOpen] = useState(false)
  const removeWidget = useStore((s) => s.removeWidget)
  const duplicateWidget = useStore((s) => s.duplicateWidget)
  const toggleLockWidget = useStore((s) => s.toggleLockWidget)
  const bringToFront = useStore((s) => s.bringToFront)
  const sendToBack = useStore((s) => s.sendToBack)
  const widget = useStore((s) =>
    s.boards[effectiveBoardId]?.find((w) => w.id === effectiveWidgetId)
  )
  const locked = widget?.locked ?? false
  const toast = useToast()
  const hasWidget = !!effectiveWidgetId && effectiveWidgetId !== ''

  const accentColor = color || 'var(--wb-accent)'

  return (
    <div
      style={{
        position: 'relative',
        borderTop: `2px solid ${accentColor}`,
        borderRadius: 'var(--wb-radius) var(--wb-radius) 0 0',
      }}
    >
      <Group
        justify="space-between"
        px="sm"
        py={5}
        style={{
          background: 'var(--wb-surface-hover)',
          borderBottom: '1px solid var(--wb-border)',
        }}
      >
        <Group gap={6}>
          {icon && (
            <span
              style={{
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                opacity: 0.9,
              }}
            >
              {icon}
            </span>
          )}
          <Text
            size="xs"
            fw={600}
            c="dimmed"
            style={{ letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: 10 }}
          >
            {title}
          </Text>
        </Group>
        <Group gap={2}>
          {rightSlot}
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xs"
            aria-label={editing ? 'Preview mode' : 'Edit mode'}
            onClick={onToggleEdit}
            style={{ opacity: 0.4, transition: 'opacity 150ms ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.backgroundColor = 'var(--wb-accent-subtle)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.4'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {editing ? <IconEye size={13} /> : <IconEdit size={13} />}
          </ActionIcon>
          {hasWidget && (
            <Menu
              opened={menuOpen}
              onChange={setMenuOpen}
              position="bottom-end"
              offset={2}
              shadow="lg"
              radius="md"
              zIndex={60}
              styles={{
                dropdown: {
                  backgroundColor: 'var(--wb-surface-solid)',
                  border: '1px solid var(--wb-border-solid)',
                  boxShadow: 'var(--wb-shadow-lg)',
                  borderRadius: 'var(--wb-radius)',
                  padding: 4,
                  minWidth: 150,
                },
                item: {
                  borderRadius: 'var(--wb-radius-sm)',
                  fontSize: 13,
                  padding: '6px 10px',
                  color: 'var(--wb-text)',
                  '&:hover': { backgroundColor: 'var(--wb-surface-hover)' },
                  '&[data-destructive="true"]': { color: 'var(--mantine-color-red-4)' },
                },
              }}
            >
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="xs"
                  aria-label="Widget options"
                  style={{ opacity: menuOpen ? 1 : 0.4, transition: 'opacity 150ms ease' }}
                  onMouseEnter={(e) => {
                    if (!menuOpen) {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.backgroundColor = 'var(--wb-accent-subtle)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!menuOpen) {
                      e.currentTarget.style.opacity = '0.4'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <IconDotsVertical size={13} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                <Menu.Item
                  leftSection={<IconCopy size={14} />}
                  onClick={() => {
                    duplicateWidget(effectiveWidgetId, effectiveBoardId)
                    toast.success('Widget duplicated')
                  }}
                >
                  Duplicate
                </Menu.Item>
                <Menu.Item
                  leftSection={locked ? <IconLockOpen size={14} /> : <IconLock size={14} />}
                  onClick={() => {
                    toggleLockWidget(effectiveWidgetId, effectiveBoardId)
                    toast.info(locked ? 'Widget unlocked' : 'Widget locked')
                  }}
                >
                  {locked ? 'Unlock' : 'Lock'}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconArrowUp size={14} />}
                  onClick={() => {
                    bringToFront(effectiveWidgetId, effectiveBoardId)
                  }}
                >
                  Bring to Front
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconArrowDown size={14} />}
                  onClick={() => {
                    sendToBack(effectiveWidgetId, effectiveBoardId)
                  }}
                >
                  Send to Back
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  data-destructive="true"
                  onClick={() => {
                    removeWidget(effectiveWidgetId, effectiveBoardId)
                    toast.success('Widget deleted')
                  }}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>
    </div>
  )
})
