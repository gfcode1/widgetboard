import { useState, useRef, useEffect, memo } from 'react'
import { Group, Text, ActionIcon, Menu, TextInput } from '@mantine/core'
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
  IconPencil,
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
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [hoverTitle, setHoverTitle] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const removeWidget = useStore((s) => s.removeWidget)
  const duplicateWidget = useStore((s) => s.duplicateWidget)
  const toggleLockWidget = useStore((s) => s.toggleLockWidget)
  const bringToFront = useStore((s) => s.bringToFront)
  const sendToBack = useStore((s) => s.sendToBack)
  const updateWidget = useStore((s) => s.updateWidget)
  const widget = useStore((s) =>
    s.boards[effectiveBoardId]?.find((w) => w.id === effectiveWidgetId)
  )
  const locked = widget?.locked ?? false
  const toast = useToast()
  const hasWidget = !!effectiveWidgetId && effectiveWidgetId !== ''

  const accentColor = color || 'var(--wb-accent)'
  const displayName = widget?.name || title

  useEffect(() => {
    if (editingName) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editingName])

  const startRenaming = () => {
    setNameValue(widget?.name ?? '')
    setEditingName(true)
  }

  const commitRename = () => {
    const trimmed = nameValue.trim()
    updateWidget(effectiveWidgetId, { name: trimmed || undefined }, effectiveBoardId)
    setEditingName(false)
  }

  const cancelRename = () => {
    setEditingName(false)
  }

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
        <Group
          gap={6}
          style={{ minWidth: 0, flex: 1 }}
          onMouseEnter={() => setHoverTitle(true)}
          onMouseLeave={() => setHoverTitle(false)}
        >
          {icon && (
            <span
              style={{
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                opacity: 0.9,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
          {editingName ? (
            <TextInput
              ref={inputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              onBlur={commitRename}
              variant="unstyled"
              size="xs"
              placeholder={title}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              styles={{
                input: {
                  padding: 0,
                  height: 18,
                  minHeight: 18,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  color: 'var(--wb-text)',
                  backgroundColor: 'var(--wb-surface)',
                  border: '1px solid var(--wb-accent)',
                  borderRadius: 3,
                },
              }}
            />
          ) : (
            <Text
              size="xs"
              fw={600}
              c="dimmed"
              truncate
              onDoubleClick={(e) => {
                e.stopPropagation()
                startRenaming()
              }}
              style={{
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                fontSize: 10,
                cursor: hasWidget ? 'default' : undefined,
                minWidth: 0,
              }}
            >
              {displayName}
            </Text>
          )}
          {hasWidget && !editingName && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size={14}
              aria-label="Rename widget"
              onClick={(e) => {
                e.stopPropagation()
                startRenaming()
              }}
              style={{
                opacity: hoverTitle ? 0.6 : 0,
                transition: 'opacity 150ms ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = hoverTitle ? '0.6' : '0'
              }}
            >
              <IconPencil size={10} />
            </ActionIcon>
          )}
        </Group>
        <Group gap={2}>
          {rightSlot}
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xs"
            aria-label={editing ? 'Preview mode' : 'Edit mode'}
            onClick={onToggleEdit}
            style={{ opacity: 0.5, transition: 'opacity 150ms ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.backgroundColor = 'var(--wb-accent-subtle)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.5'
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
                  style={{ opacity: menuOpen ? 1 : 0.5, transition: 'opacity 150ms ease' }}
                  onMouseEnter={(e) => {
                    if (!menuOpen) {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.backgroundColor = 'var(--wb-accent-subtle)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!menuOpen) {
                      e.currentTarget.style.opacity = '0.5'
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
