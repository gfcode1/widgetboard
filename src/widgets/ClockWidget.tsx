import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { Text, Stack, Group, ActionIcon, Chip, Tooltip, Select } from '@mantine/core'
import { IconClock, IconMaximize, IconMinimize, IconBell, IconBellOff } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { useGlobalTick } from '../hooks/useGlobalTick'
import { WidgetHeader } from './base/WidgetHeader'

type ClockTheme = 'minimal' | 'digital' | 'analog' | 'neon' | 'retro'

interface Props {
  widget: Widget
}

function formatTime(now: Date, use12h: boolean, showSeconds: boolean): string {
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  if (use12h) {
    const h12 = h % 12 || 12
    const ampm = h < 12 ? 'AM' : 'PM'
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}${showSeconds ? `:${String(s).padStart(2, '0')}` : ''} ${ampm}`
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}${showSeconds ? `:${String(s).padStart(2, '0')}` : ''}`
}

function formatDate(now: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now)
}

interface Alarm {
  id: string
  time: string
  enabled: boolean
  label: string
}

export const ClockWidget = memo(function ClockWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [theme, setTheme] = useState<ClockTheme>('minimal')
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [alarmTime, setAlarmTime] = useState('07:00')
  const [alarmLabel, setAlarmLabel] = useState('')
  const alarmTriggeredRef = useRef<Set<string>>(new Set())

  const now = useGlobalTick()

  const content =
    widget.content.type === 'clock'
      ? widget.content
      : { type: 'clock' as const, showDate: true, showSeconds: true, use12h: false }

  const timeStr = formatTime(now, content.use12h, content.showSeconds)
  const dateStr = formatDate(now)

  const toggle12h = useCallback(
    () => updateWidget(widget.id, { content: { ...content, use12h: !content.use12h } }),
    [widget.id, updateWidget, content]
  )
  const toggleSeconds = useCallback(
    () => updateWidget(widget.id, { content: { ...content, showSeconds: !content.showSeconds } }),
    [widget.id, updateWidget, content]
  )
  const toggleDate = useCallback(
    () => updateWidget(widget.id, { content: { ...content, showDate: !content.showDate } }),
    [widget.id, updateWidget, content]
  )

  useEffect(() => {
    const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    for (const alarm of alarms) {
      if (!alarm.enabled || alarmTriggeredRef.current.has(curTime + alarm.id)) continue
      if (alarm.time === curTime) {
        alarmTriggeredRef.current.add(curTime + alarm.id)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Alarm: ${alarm.label || 'Wake up!'}`, {
            body: `It's ${curTime}`,
            icon: '/favicon.ico',
          })
        }
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          const ctx = new AudioCtx()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = 800
          gain.gain.value = 0.2
          osc.start()
          osc.stop(ctx.currentTime + 0.5)
        } catch {
          /* ignore */
        }
      }
    }
  }, [alarms, now])

  const addAlarm = useCallback(() => {
    setAlarms((prev) => [
      ...prev,
      { id: `alarm-${Date.now()}`, time: alarmTime, enabled: true, label: alarmLabel },
    ])
    setAlarmLabel('')
  }, [alarmTime, alarmLabel])

  const toggleAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)))
  }, [])

  const removeAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const themeStyles: Record<ClockTheme, React.CSSProperties> = {
    minimal: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontWeight: 200,
      letterSpacing: '-0.02em',
      background: 'linear-gradient(135deg, #e4e4e7 30%, var(--wb-accent) 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    digital: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 400,
      letterSpacing: '0.05em',
      color: '#10b981',
      textShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
    },
    analog: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontWeight: 300,
      letterSpacing: '0.02em',
      color: '#e4e4e7',
    },
    neon: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#f43f5e',
      textShadow: '0 0 10px rgba(244, 63, 94, 0.7), 0 0 40px rgba(244, 63, 94, 0.3)',
    },
    retro: {
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      fontWeight: 500,
      letterSpacing: '0.04em',
      color: '#f59e0b',
      textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
    },
  }

  const timeDisplay = (
    <Stack align="center" gap={0} aria-live="polite" aria-atomic="true">
      <Text
        fz={fullscreen ? '6rem' : '2.5rem'}
        style={{
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
          ...themeStyles[theme],
        }}
      >
        {timeStr}
      </Text>
      {content.showDate && (
        <Text
          size={fullscreen ? 'md' : 'xs'}
          c="dimmed"
          style={{
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            fontSize: fullscreen ? 14 : 10,
          }}
        >
          {dateStr}
        </Text>
      )}
    </Stack>
  )

  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.95)',
          cursor: 'pointer',
        }}
        onClick={() => setFullscreen(false)}
      >
        {timeDisplay}
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          style={{ position: 'absolute', top: 20, right: 20 }}
          onClick={() => setFullscreen(false)}
          aria-label="Close fullscreen"
        >
          <IconMinimize size={20} />
        </ActionIcon>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Clock"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconClock size={12} />}
        rightSlot={
          <Tooltip label="Fullscreen">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => setFullscreen(true)}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Fullscreen"
            >
              <IconMaximize size={12} />
            </ActionIcon>
          </Tooltip>
        }
      />
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {editing ? (
          <Stack gap="xs" w="100%">
            <Text size="xs" fw={600} c="gray.3">
              Theme
            </Text>
            <Select
              data={[
                { value: 'minimal', label: 'Minimal' },
                { value: 'digital', label: 'Digital' },
                { value: 'analog', label: 'Analog' },
                { value: 'neon', label: 'Neon' },
                { value: 'retro', label: 'Retro' },
              ]}
              value={theme}
              onChange={(v) => v && setTheme(v as ClockTheme)}
              size="xs"
              onMouseDown={(e) => e.stopPropagation()}
            />
            <Group gap="xs">
              <Chip
                size="xs"
                variant="light"
                color="gray"
                checked={content.use12h}
                onChange={toggle12h}
              >
                12h
              </Chip>
              <Chip
                size="xs"
                variant="light"
                color="gray"
                checked={content.showSeconds}
                onChange={toggleSeconds}
              >
                Seconds
              </Chip>
              <Chip
                size="xs"
                variant="light"
                color="gray"
                checked={content.showDate}
                onChange={toggleDate}
              >
                Date
              </Chip>
            </Group>
            <Text size="xs" fw={600} c="gray.3" mt="xs">
              Alarms
            </Text>
            {alarms.map((alarm) => (
              <Group key={alarm.id} gap="xs" justify="space-between">
                <Group gap={4}>
                  <Chip
                    size="xs"
                    variant="light"
                    color="violet"
                    checked={alarm.enabled}
                    onChange={() => toggleAlarm(alarm.id)}
                  >
                    {alarm.time}
                  </Chip>
                  {alarm.label && (
                    <Text size="xs" c="dimmed">
                      {alarm.label}
                    </Text>
                  )}
                </Group>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={() => removeAlarm(alarm.id)}
                  aria-label={`Remove alarm ${alarm.time}`}
                >
                  <IconBellOff size={10} />
                </ActionIcon>
              </Group>
            ))}
            <Group gap="xs">
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                style={{
                  background: 'var(--mantine-color-dark-6)',
                  color: 'var(--wb-text)',
                  border: '1px solid var(--wb-border)',
                  borderRadius: 'var(--wb-radius-sm)',
                  padding: '4px 8px',
                  fontSize: 12,
                }}
              />
              <ActionIcon
                variant="light"
                color="violet"
                size="sm"
                onClick={addAlarm}
                aria-label="Add alarm"
              >
                <IconBell size={14} />
              </ActionIcon>
            </Group>
          </Stack>
        ) : (
          timeDisplay
        )}
      </div>
    </div>
  )
})

export default ClockWidget
