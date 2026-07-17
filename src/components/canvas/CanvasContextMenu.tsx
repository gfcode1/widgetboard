import { Paper, UnstyledButton, Group, Text } from '@mantine/core'
import { IconTypography, IconShape, IconArrowRight, IconBoxMultiple } from '@tabler/icons-react'
import { useStore, ROOT_BOARD_ID } from '../../store/useStore'
import { GROUP_COLORS } from '../../store/elementsSlice'

interface CanvasContextMenuProps {
  x: number
  y: number
  canvasX: number
  canvasY: number
  boardId?: string
  onClose: () => void
}

export function CanvasContextMenu({
  x,
  y,
  canvasX,
  canvasY,
  boardId = ROOT_BOARD_ID,
  onClose,
}: CanvasContextMenuProps) {
  const addText = useStore((s) => s.addText)
  const addShape = useStore((s) => s.addShape)
  const addArrow = useStore((s) => s.addArrow)
  const addGroup = useStore((s) => s.addGroup)

  const handleAddText = () => {
    addText({
      boardId,
      x: canvasX - 100,
      y: canvasY - 20,
      content: 'Double-click to edit',
      fontSize: 16,
      fontFamily: "'Inter', sans-serif",
      color: 'var(--wb-text)',
      fontWeight: 'normal',
      fontStyle: 'normal',
    })
    onClose()
  }

  const handleAddRectangle = () => {
    addShape({
      boardId,
      shape: 'rectangle',
      x: canvasX - 75,
      y: canvasY - 50,
      width: 150,
      height: 100,
      fill: 'rgba(124, 58, 237, 0.12)',
      stroke: '#7c3aed',
      strokeWidth: 2,
      opacity: 1,
    })
    onClose()
  }

  const handleAddEllipse = () => {
    addShape({
      boardId,
      shape: 'ellipse',
      x: canvasX - 75,
      y: canvasY - 50,
      width: 150,
      height: 100,
      fill: 'rgba(124, 58, 237, 0.12)',
      stroke: '#7c3aed',
      strokeWidth: 2,
      opacity: 1,
    })
    onClose()
  }

  const handleAddArrow = () => {
    addArrow({
      boardId,
      startX: canvasX - 100,
      startY: canvasY,
      endX: canvasX + 100,
      endY: canvasY,
      color: '#7c3aed',
      strokeWidth: 2,
      style: 'solid',
    })
    onClose()
  }

  const handleAddGroup = () => {
    addGroup({
      boardId,
      x: canvasX - 200,
      y: canvasY - 150,
      width: 400,
      height: 300,
      title: 'New Group',
      color: GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)]!,
      widgetIds: [],
      collapsed: false,
    })
    onClose()
  }

  const items = [
    { label: 'Text', icon: IconTypography, onClick: handleAddText },
    { label: 'Rectangle', icon: IconShape, onClick: handleAddRectangle },
    { label: 'Ellipse', icon: IconShape, onClick: handleAddEllipse },
    { label: 'Arrow', icon: IconArrowRight, onClick: handleAddArrow },
    { label: 'Group', icon: IconBoxMultiple, onClick: handleAddGroup },
  ]

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
      {items.map((item) => (
        <UnstyledButton
          key={item.label}
          onClick={item.onClick}
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
            <item.icon size={14} color="var(--wb-text-dimmed)" />
            <Text size="sm" c="gray.3" fw={500}>
              {item.label}
            </Text>
          </Group>
        </UnstyledButton>
      ))}
    </Paper>
  )
}
