import { useState, useEffect, useCallback } from 'react'
import { Paper, Text, Stack, Group, ActionIcon, Button } from '@mantine/core'
import {
  IconX,
  IconChevronRight,
  IconChevronLeft,
  IconMouse,
  IconZoom,
  IconHandClick,
  IconKeyboard,
} from '@tabler/icons-react'
import { useStore } from '../store/useStore'
import type { WidgetType } from '../types'

interface Step {
  title: string
  description: string
  icon: React.ReactNode
  highlight?: string
}

const STEPS: Step[] = [
  {
    title: 'Your Infinite Canvas',
    description:
      'Drag and scroll to explore. Click & drag empty space to pan, scroll to zoom in and out. There are no boundaries.',
    icon: <IconMouse size={24} />,
  },
  {
    title: 'Add Widgets',
    description:
      'Click the + button below to open the widget picker. Choose from 24 widgets: notes, tasks, clocks, weather, and more.',
    icon: <IconZoom size={24} />,
    highlight: 'add-button',
  },
  {
    title: 'Move & Resize',
    description:
      'Drag widgets to reposition them. Use the handles on edges and corners to resize. Right-click or use the ••• menu for more options.',
    icon: <IconHandClick size={24} />,
  },
  {
    title: 'Keyboard Power',
    description:
      'Press Ctrl+K to open the Command Palette for quick actions. Use Ctrl+Z/Y for undo/redo, Delete to remove, Ctrl+D to duplicate.',
    icon: <IconKeyboard size={24} />,
    highlight: 'command-palette',
  },
]

const TEMPLATES = [
  {
    name: 'Work Dashboard',
    widgets: ['todo', 'note', 'clock', 'pomodoro', 'calendar', 'bookmark'],
  },
  {
    name: 'Study Dashboard',
    widgets: ['note', 'pomodoro', 'search', 'snippet', 'quote', 'clock'],
  },
  {
    name: 'Personal Dashboard',
    widgets: ['weather', 'clock', 'todo', 'sticky', 'habit', 'quote'],
  },
  {
    name: 'Start Blank',
    widgets: [],
  },
]

const RECENT_KEY = 'widgetboard-recent'

export function Onboarding() {
  const widgetCount = useStore((s): number =>
    Object.values(s.boards).reduce((acc, arr) => acc + arr.length, 0)
  )
  const addWidget = useStore((s) => s.addWidget)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const [step, setStep] = useState(0)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('widgetboard-onboarded')
    if (seen) {
      setDismissed(true)
      return
    }
    if (widgetCount === 0 && !dismissed) {
      const timer = setTimeout(() => {
        setVisible(true)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setAnimateIn(true))
        })
      }, 400)
      return () => clearTimeout(timer)
    }
    if (widgetCount > 0) {
      setVisible(false)
      localStorage.setItem('widgetboard-onboarded', '1')
    }
  }, [widgetCount, dismissed])

  const handleDismiss = () => {
    setAnimateIn(false)
    setTimeout(() => {
      setVisible(false)
      setDismissed(true)
      localStorage.setItem('widgetboard-onboarded', '1')
    }, 200)
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      setShowTemplates(true)
    }
  }

  const handleTemplate = useCallback(
    (widgetTypes: string[]) => {
      if (widgetTypes.length === 0) {
        handleDismiss()
        return
      }
      const rect = new DOMRect(0, 0, window.innerWidth, window.innerHeight)
      const layouts: Record<string, { x: number; y: number; w: number; h: number }> = {
        todo: { x: 50, y: 50, w: 280, h: 300 },
        note: { x: 380, y: 50, w: 320, h: 280 },
        clock: { x: 50, y: 400, w: 260, h: 150 },
        pomodoro: { x: 380, y: 380, w: 220, h: 180 },
        calendar: { x: 750, y: 50, w: 260, h: 260 },
        bookmark: { x: 750, y: 380, w: 300, h: 200 },
        weather: { x: 380, y: 50, w: 280, h: 200 },
        search: { x: 380, y: 380, w: 280, h: 180 },
        snippet: { x: 750, y: 50, w: 300, h: 320 },
        quote: { x: 750, y: 380, w: 280, h: 160 },
        sticky: { x: 380, y: 50, w: 200, h: 200 },
        habit: { x: 380, y: 380, w: 320, h: 350 },
      }
      widgetTypes.forEach((type, i) => {
        const layout = layouts[type]
        if (layout) {
          addWidget(type as WidgetType, layout.x + i * 20, layout.y + i * 20, rect)
        }
      })
      const recent = widgetTypes.slice(0, 5)
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
      handleDismiss()
    },
    [addWidget, handleDismiss]
  )

  if (!visible) return null

  const currentStep = STEPS[step]

  return (
    <Paper
      shadow="xl"
      radius="lg"
      p="xl"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${animateIn ? 1 : 0.95})`,
        opacity: animateIn ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
        zIndex: 100,
        maxWidth: showTemplates ? 440 : 380,
        width: '90vw',
        backgroundColor: 'var(--wb-surface-solid)',
        border: '1px solid var(--wb-border-solid)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)',
      }}
    >
      <Group justify="flex-end" style={{ position: 'absolute', top: 10, right: 10 }}>
        <ActionIcon variant="subtle" color="gray" size="xs" onClick={handleDismiss}>
          <IconX size={14} />
        </ActionIcon>
      </Group>

      {!showTemplates ? (
        <Stack gap="lg">
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--wb-radius)',
              backgroundColor: 'var(--wb-accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--wb-accent)',
            }}
          >
            {currentStep?.icon}
          </div>
          <Stack gap="xs">
            <Text size="lg" fw={600} c="gray.1">
              {currentStep?.title}
            </Text>
            <Text size="sm" c="dimmed" lh={1.6}>
              {currentStep?.description}
            </Text>
          </Stack>

          <Group justify="space-between" align="center">
            <Group gap={4}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === step ? 'var(--wb-accent)' : 'var(--wb-border-solid)',
                    transition: 'all 200ms ease',
                  }}
                />
              ))}
            </Group>
            <Group gap="xs">
              {step > 0 && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="compact-sm"
                  onClick={() => setStep(step - 1)}
                  leftSection={<IconChevronLeft size={14} />}
                >
                  Back
                </Button>
              )}
              <Button
                variant="light"
                color="violet"
                size="compact-sm"
                onClick={handleNext}
                rightSection={<IconChevronRight size={14} />}
              >
                {step < STEPS.length - 1 ? 'Next' : 'Get Started'}
              </Button>
            </Group>
          </Group>
        </Stack>
      ) : (
        <Stack gap="lg">
          <Text size="lg" fw={600} c="gray.1">
            Choose a starting template
          </Text>
          <Text size="sm" c="dimmed">
            Pick a layout to get started quickly, or begin with a blank canvas.
          </Text>
          <Stack gap="sm">
            {TEMPLATES.map((t) => (
              <Paper
                key={t.name}
                p="md"
                radius="md"
                withBorder
                style={{
                  backgroundColor: 'var(--wb-surface-hover)',
                  borderColor: 'var(--wb-border)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: 'var(--wb-accent-subtle)',
                      borderColor: 'var(--wb-border-accent)',
                    },
                  },
                }}
                onClick={() => handleTemplate(t.widgets)}
              >
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500} c="gray.2">
                      {t.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t.widgets.length === 0 ? 'Empty canvas' : `${t.widgets.length} widgets`}
                    </Text>
                  </div>
                  <IconChevronRight size={16} color="var(--wb-text-dimmed)" />
                </Group>
              </Paper>
            ))}
          </Stack>
        </Stack>
      )}
    </Paper>
  )
}
