import { useState, useEffect } from 'react'
import { Paper, Text, Stack, Group, ActionIcon } from '@mantine/core'
import { IconX, IconMouse, IconHandClick, IconZoom } from '@tabler/icons-react'
import { useStore } from '../store/useStore'

export function Onboarding() {
  const widgetCount = useStore((s): number => Object.values(s.boards).reduce((acc, arr) => acc + arr.length, 0))
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

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
      }, 500)
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

  if (!visible) return null

  return (
    <Paper
      shadow="xl"
      radius="lg"
      p="lg"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${animateIn ? 1 : 0.95})`,
        opacity: animateIn ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
        zIndex: 100,
        maxWidth: 360,
        backgroundColor: 'var(--wb-surface)',
        border: '1px solid var(--wb-border)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)',
      }}
    >
      <Group justify="flex-end" style={{ position: 'absolute', top: 8, right: 8 }}>
        <ActionIcon variant="subtle" color="gray" size="xs" onClick={handleDismiss}>
          <IconX size={14} />
        </ActionIcon>
      </Group>
      <Stack gap="md" mt="xs">
        <Text size="lg" fw={600} c="gray.1">
          Welcome to WidgetBoard
        </Text>
        <Text size="sm" c="dimmed">
          An infinite canvas for your widgets. Here's how to get started:
        </Text>
        <Stack gap="sm">
          <Group gap="sm">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: 'var(--wb-accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconMouse size={16} color="var(--wb-accent)" />
            </div>
            <Text size="sm" c="gray.3">Click & drag to pan the canvas</Text>
          </Group>
          <Group gap="sm">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: 'var(--wb-accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconZoom size={16} color="var(--wb-accent)" />
            </div>
            <Text size="sm" c="gray.3">Scroll to zoom in/out</Text>
          </Group>
          <Group gap="sm">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: 'var(--wb-accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconHandClick size={16} color="var(--wb-accent)" />
            </div>
            <Text size="sm" c="gray.3">Right-click a widget for options</Text>
          </Group>
        </Stack>
        <Text size="xs" c="dimmed">
          Use the + button below to add your first widget.
        </Text>
      </Stack>
    </Paper>
  )
}
