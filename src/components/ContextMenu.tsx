import { useRef, useEffect, useState } from 'react'
import { Paper, UnstyledButton, Group, Text } from '@mantine/core'
import {
  IconCopy,
  IconTrash,
  IconLock,
  IconLockOpen,
  IconArrowUp,
  IconArrowDown,
  IconLayoutDashboard,
} from '@tabler/icons-react'
import { useStore, ROOT_BOARD_ID } from '../store/useStore'
import type { GroupElement } from '../types'

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
  const moveWidgetFromGroup = useStore((s) => s.moveWidgetFromGroup)
  const widget = useStore((s) => s.boards[boardId ?? ROOT_BOARD_ID]?.find((w) => w.id === widgetId))
  const locked = widget?.locked ?? false
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusIndex, setFocusIndex] = useState(0)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Check if widget is in a group
  const widgetGroup = useStore((s) =>
    s.canvasElements.find(
      (e): e is GroupElement => e.type === 'group' && e.widgetIds.includes(widgetId)
    )
  )

  const menuItems = [
    {
      label: 'Duplicate',
      icon: IconCopy,
      action: () => {
        duplicateWidget(widgetId, boardId)
        onClose()
      },
    },
    {
      label: locked ? 'Unlock' : 'Lock',
      icon: locked ? IconLockOpen : IconLock,
      action: () => {
        toggleLockWidget(widgetId)
        onClose()
      },
    },
    ...(widgetGroup
      ? [
          {
            label: 'Move out of group',
            icon: IconLayoutDashboard,
            action: () => {
              moveWidgetFromGroup(widgetId)
              onClose()
            },
          },
        ]
      : []),
    {
      label: 'Bring to Front',
      icon: IconArrowUp,
      action: () => {
        bringToFront(widgetId, boardId)
        onClose()
      },
    },
    {
      label: 'Send to Back',
      icon: IconArrowDown,
      action: () => {
        sendToBack(widgetId, boardId)
        onClose()
      },
    },
    {
      label: 'Delete',
      icon: IconTrash,
      action: () => {
        removeWidget(widgetId, boardId)
        onClose()
      },
      color: 'red',
    },
  ]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIndex((i) => Math.min(i + 1, menuItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter') {
        menuItems[focusIndex]?.action()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focusIndex, menuItems, onClose])

  useEffect(() => {
    itemRefs.current[focusIndex]?.focus()
  }, [focusIndex])

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportW = window.innerWidth
      const viewportH = window.innerHeight
      let posX = x
      let posY = y
      if (posX + rect.width > viewportW) posX = viewportW - rect.width - 8
      if (posY + rect.height > viewportH) posY = viewportH - rect.height - 8
      if (posX < 0) posX = 8
      if (posY < 0) posY = 8
      menuRef.current.style.left = `${posX}px`
      menuRef.current.style.top = `${posY}px`
    }
  }, [x, y])

  return (
    <Paper
      ref={menuRef}
      shadow="xl"
      radius="md"
      withBorder
      className="wb-context-menu"
      role="menu"
      aria-label="Widget actions"
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
      {menuItems.map((item, i) => (
        <UnstyledButton
          key={item.label}
          ref={(el) => {
            itemRefs.current[i] = el
          }}
          role="menuitem"
          tabIndex={-1}
          onClick={item.action}
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
            <item.icon
              size={14}
              color={item.color === 'red' ? 'var(--mantine-color-red-4)' : 'var(--wb-text-dimmed)'}
            />
            <Text size="sm" c={item.color === 'red' ? 'red.4' : 'gray.3'} fw={500}>
              {item.label}
            </Text>
          </Group>
        </UnstyledButton>
      ))}
    </Paper>
  )
}
