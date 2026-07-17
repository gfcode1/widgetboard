import { useState } from 'react'
import { Group, ActionIcon, Popover, Button, Text, ColorInput } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconShape,
  IconTypography,
  IconArrowRight,
  IconSquare,
  IconCircle,
  IconBoxMultiple,
} from '@tabler/icons-react'
import { useStore, ROOT_BOARD_ID } from '../../store/useStore'
import { GROUP_COLORS } from '../../store/elementsSlice'

interface CanvasToolbarProps {
  boardId?: string
}

export function CanvasToolbar({ boardId = ROOT_BOARD_ID }: CanvasToolbarProps) {
  const [opened, setOpened] = useState(false)
  const [activeColor, setActiveColor] = useState('#7c3aed')
  const [activeShape, setActiveShape] = useState<'rectangle' | 'ellipse'>('rectangle')

  const addGroup = useStore((s) => s.addGroup)
  const addText = useStore((s) => s.addText)
  const addArrow = useStore((s) => s.addArrow)
  const addShape = useStore((s) => s.addShape)
  const canvasOffset = useStore((s) => s.canvasOffset)
  const canvasScale = useStore((s) => s.canvasScale)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const screenToCanvas = (_screenX: number, _screenY: number) => {
    const centerX = (window.innerWidth / 2 - canvasOffset.x) / canvasScale
    const centerY = (window.innerHeight / 2 - canvasOffset.y) / canvasScale
    return { x: centerX, y: centerY }
  }

  const handleAddGroup = () => {
    const pos = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2)
    addGroup({
      boardId,
      x: pos.x - 200,
      y: pos.y - 150,
      width: 400,
      height: 300,
      title: 'New Group',
      color: GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)]!,
      widgetIds: [],
      collapsed: false,
    })
    setOpened(false)
  }

  const handleAddText = () => {
    const pos = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2)
    addText({
      boardId,
      x: pos.x - 100,
      y: pos.y - 20,
      content: 'Double-click to edit',
      fontSize: 16,
      fontFamily: "'Inter', sans-serif",
      color: 'var(--wb-text)',
      fontWeight: 'normal',
      fontStyle: 'normal',
    })
    setOpened(false)
  }

  const handleAddArrow = () => {
    const pos = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2)
    addArrow({
      boardId,
      startX: pos.x - 100,
      startY: pos.y,
      endX: pos.x + 100,
      endY: pos.y,
      color: activeColor,
      strokeWidth: 2,
      style: 'solid',
    })
    setOpened(false)
  }

  const handleAddShape = () => {
    const pos = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2)
    addShape({
      boardId,
      shape: activeShape,
      x: pos.x - 75,
      y: pos.y - 50,
      width: 150,
      height: 100,
      fill: `${activeColor}20`,
      stroke: activeColor,
      strokeWidth: 2,
      opacity: 1,
    })
    setOpened(false)
  }

  const tools = [
    { id: 'group', label: 'Add Group', icon: IconBoxMultiple, onClick: handleAddGroup },
    { id: 'text', label: 'Add Text', icon: IconTypography, onClick: handleAddText },
    { id: 'arrow', label: 'Add Arrow', icon: IconArrowRight, onClick: handleAddArrow },
    { id: 'shape', label: 'Add Shape', icon: IconShape, onClick: handleAddShape },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? 80 : 70,
        left: 16,
        zIndex: 20,
      }}
    >
      <Popover
        opened={opened}
        onChange={setOpened}
        position="top-start"
        width={220}
        closeOnClickOutside
      >
        <Popover.Target>
          <Button
            leftSection={<IconShape size={14} />}
            variant="light"
            color="violet"
            size="compact-sm"
            className="wb-glass"
            onClick={() => setOpened(!opened)}
          >
            Elements
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Text size="sm" fw={600}>
              Add Element
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant="subtle"
                  color="gray"
                  leftSection={<tool.icon size={14} />}
                  onClick={tool.onClick}
                  size="compact-xs"
                >
                  {tool.label.replace('Add ', '')}
                </Button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text size="xs" c="dimmed">
                Color
              </Text>
              <ColorInput
                value={activeColor}
                onChange={setActiveColor}
                size="xs"
                swatches={GROUP_COLORS}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text size="xs" c="dimmed">
                Shape (for shapes)
              </Text>
              <Group gap={4}>
                <ActionIcon
                  variant={activeShape === 'rectangle' ? 'light' : 'subtle'}
                  color={activeShape === 'rectangle' ? 'violet' : 'gray'}
                  onClick={() => setActiveShape('rectangle')}
                  size="sm"
                >
                  <IconSquare size={14} />
                </ActionIcon>
                <ActionIcon
                  variant={activeShape === 'ellipse' ? 'light' : 'subtle'}
                  color={activeShape === 'ellipse' ? 'violet' : 'gray'}
                  onClick={() => setActiveShape('ellipse')}
                  size="sm"
                >
                  <IconCircle size={14} />
                </ActionIcon>
              </Group>
            </div>
          </div>
        </Popover.Dropdown>
      </Popover>
    </div>
  )
}
