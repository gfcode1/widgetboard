import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { Text, Stack, Group, ActionIcon, Button } from '@mantine/core'
import { IconPlayerPlay, IconPlayerStop, IconRotate, IconFlag } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { useGlobalTick } from '../hooks/useGlobalTick'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

function formatTimer(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatTimerMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const cs = Math.floor((ms % 1000) / 10)
  if (h > 0)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

export const TimerWidget = memo(function TimerWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const lastTickRef = useRef<number>(0)
  const tick = useGlobalTick()

  const content =
    widget.content.type === 'timer'
      ? widget.content
      : {
          type: 'timer' as const,
          mode: 'stopwatch' as const,
          elapsed: 0,
          target: 300000,
          running: false,
          laps: [],
        }

  const displayMs =
    content.mode === 'countdown' ? Math.max(0, content.target - content.elapsed) : content.elapsed

  useEffect(() => {
    if (!content.running) return
    const now = tick.getTime()
    if (lastTickRef.current === 0) {
      lastTickRef.current = now
      return
    }
    const delta = now - lastTickRef.current
    lastTickRef.current = now
    updateWidget(widget.id, {
      content: { ...content, elapsed: content.elapsed + delta },
    })
  }, [tick])

  const toggleRun = useCallback(() => {
    lastTickRef.current = 0
    updateWidget(widget.id, {
      content: { ...content, running: !content.running },
    })
  }, [widget.id, updateWidget, content])

  const reset = useCallback(() => {
    updateWidget(widget.id, {
      content: { ...content, elapsed: 0, running: false, laps: [] },
    })
  }, [widget.id, updateWidget, content])

  const addLap = useCallback(() => {
    updateWidget(widget.id, {
      content: { ...content, laps: [...content.laps, content.elapsed] },
    })
  }, [widget.id, updateWidget, content])

  const setMode = useCallback(
    (mode: 'stopwatch' | 'countdown') => {
      updateWidget(widget.id, {
        content: { ...content, mode, elapsed: 0, running: false, laps: [] },
      })
    },
    [widget.id, updateWidget, content]
  )

  const adjustTarget = useCallback(
    (delta: number) => {
      updateWidget(widget.id, {
        content: { ...content, target: Math.max(1000, content.target + delta) },
      })
    },
    [widget.id, updateWidget, content]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Timer"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconPlayerPlay size={16} />}
        color="var(--mantine-color-teal-5)"
        widgetId={widget.id}
      />
      <Stack align="center" justify="center" gap="xs" style={{ flex: 1, padding: 12 }}>
        <Group gap={4}>
          <Button
            size="xs"
            variant={content.mode === 'stopwatch' ? 'filled' : 'subtle'}
            color={content.mode === 'stopwatch' ? 'teal' : 'gray'}
            onClick={() => setMode('stopwatch')}
          >
            Stopwatch
          </Button>
          <Button
            size="xs"
            variant={content.mode === 'countdown' ? 'filled' : 'subtle'}
            color={content.mode === 'countdown' ? 'teal' : 'gray'}
            onClick={() => setMode('countdown')}
          >
            Countdown
          </Button>
        </Group>

        <Text
          ff="monospace"
          size="xl"
          fw={700}
          c={
            content.mode === 'countdown' && content.elapsed >= content.target
              ? 'red'
              : 'var(--wb-text)'
          }
          style={{ fontVariantNumeric: 'tabular-nums', cursor: 'default' }}
        >
          {formatTimerMs(displayMs)}
        </Text>

        {content.mode === 'countdown' && !content.running && (
          <Group gap={4}>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => adjustTarget(-30000)}
            >
              -30s
            </ActionIcon>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => adjustTarget(-60000)}
            >
              -1m
            </ActionIcon>
            <Text size="xs" c="dimmed" fw={500}>
              {formatTimer(content.target)}
            </Text>
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => adjustTarget(60000)}>
              +1m
            </ActionIcon>
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => adjustTarget(30000)}>
              +30s
            </ActionIcon>
          </Group>
        )}

        <Group gap="xs">
          <ActionIcon
            variant="filled"
            color={content.running ? 'red' : 'teal'}
            size="lg"
            radius="xl"
            onClick={toggleRun}
            aria-label={content.running ? 'Stop' : 'Start'}
          >
            {content.running ? <IconPlayerStop size={18} /> : <IconPlayerPlay size={18} />}
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={reset} aria-label="Reset">
            <IconRotate size={18} />
          </ActionIcon>
          {content.mode === 'stopwatch' && content.running && (
            <ActionIcon variant="subtle" color="teal" size="lg" onClick={addLap} aria-label="Lap">
              <IconFlag size={18} />
            </ActionIcon>
          )}
        </Group>

        {content.laps.length > 0 && (
          <Stack gap={2} style={{ maxHeight: 80, overflow: 'auto', width: '100%' }}>
            {content.laps.slice(-5).map((lap, i) => (
              <Group key={i} justify="space-between" px="sm">
                <Text size="xs" c="dimmed">
                  Lap {i + 1}
                </Text>
                <Text size="xs" ff="monospace" c="var(--wb-text)">
                  {formatTimerMs(lap)}
                </Text>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </div>
  )
})

export default TimerWidget
