import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Text, Stack, Group, ActionIcon, TextInput, Badge, Tooltip } from '@mantine/core'
import { IconSettings, IconPlus, IconTrash, IconBell, IconBellOff } from '@tabler/icons-react'
import { v4 as uuidv4 } from 'uuid'
import type { Widget, CountdownItem } from '../types'
import { useStore } from '../store/useStore'
import { useGlobalTick } from '../hooks/useGlobalTick'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

const PRESETS = [
  { label: '5m', ms: 5 * 60 * 1000 },
  { label: '15m', ms: 15 * 60 * 1000 },
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '2h', ms: 2 * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: '1w', ms: 7 * 24 * 60 * 60 * 1000 },
]

const COUNTDOWN_COLORS = [
  '#6d28d9',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#be185d',
]

function getCountdownColor(index: number): string {
  return COUNTDOWN_COLORS[index % COUNTDOWN_COLORS.length]!
}

function getUrgencyColor(days: number, expired: boolean): string {
  if (expired) return 'var(--mantine-color-red-5)'
  if (days > 7) return 'var(--mantine-color-green-5)'
  if (days > 1) return 'var(--mantine-color-yellow-5)'
  return 'var(--mantine-color-orange-5)'
}

interface CountdownDisplay {
  label: string
  isExpired: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  totalDuration: number
}

function calculateDisplay(target: number, now: number): CountdownDisplay {
  const diff = target - now
  const isExpired = diff <= 0
  const totalSeconds = Math.max(0, Math.floor(diff / 1000))
  return {
    label: '',
    isExpired,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
    totalDuration: totalSeconds,
  }
}

function requestNotification(label: string): void {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification('Countdown Expired', {
      body: `"${label}" has reached its deadline`,
      icon: '/favicon.ico',
    })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission()
  }
}

export const CountdownWidget = memo(function CountdownWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [targetTime, setTargetTime] = useState('12:00')
  const [editId, setEditId] = useState<string | null>(null)
  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const notifiedRef = useRef<Set<string>>(new Set())
  const now = useGlobalTick()

  const content =
    widget.content.type === 'countdown'
      ? widget.content
      : { type: 'countdown' as const, countdowns: [], showSeconds: true }

  const countdowns: CountdownItem[] = content.countdowns || []

  const saveCountdown = useCallback(() => {
    if (!targetDate) return
    const ts = new Date(`${targetDate}T${targetTime}`).getTime()
    if (isNaN(ts)) return

    if (editId) {
      const updated = countdowns.map((c) =>
        c.id === editId ? { ...c, target: ts, label: labelInput || 'Countdown' } : c
      )
      updateWidget(widget.id, { content: { ...content, countdowns: updated } })
      setEditId(null)
    } else {
      const newCountdown: CountdownItem = {
        id: uuidv4(),
        label: labelInput || 'Countdown',
        target: ts,
        color: getCountdownColor(countdowns.length),
      }
      updateWidget(widget.id, {
        content: { ...content, countdowns: [...countdowns, newCountdown] },
      })
    }
    setLabelInput('')
    setTargetDate('')
    setTargetTime('12:00')
  }, [widget.id, content, targetDate, targetTime, labelInput, editId, countdowns, updateWidget])

  const removeCountdown = useCallback(
    (id: string) => {
      updateWidget(widget.id, {
        content: { ...content, countdowns: countdowns.filter((c) => c.id !== id) },
      })
      notifiedRef.current.delete(id)
    },
    [widget.id, content, countdowns, updateWidget]
  )

  const startEdit = useCallback((cd: CountdownItem) => {
    setEditId(cd.id)
    setLabelInput(cd.label)
    const d = new Date(cd.target)
    setTargetDate(d.toISOString().split('T')[0]!)
    setTargetTime(
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    )
    setEditing(true)
  }, [])

  const addPreset = useCallback(
    (presetMs: number, label: string) => {
      const target = now.getTime() + presetMs
      const newCountdown: CountdownItem = {
        id: uuidv4(),
        label,
        target,
        color: getCountdownColor(countdowns.length),
      }
      updateWidget(widget.id, {
        content: { ...content, countdowns: [...countdowns, newCountdown] },
      })
    },
    [widget.id, content, countdowns, now, updateWidget]
  )

  useEffect(() => {
    if (!notifyEnabled) return
    for (const cd of countdowns) {
      if (cd.target <= now.getTime() && !notifiedRef.current.has(cd.id)) {
        requestNotification(cd.label)
        notifiedRef.current.add(cd.id)
      }
    }
  }, [countdowns, now, notifyEnabled])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title={`Countdown (${countdowns.length})`}
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconSettings size={12} />}
        rightSlot={
          <Tooltip label={notifyEnabled ? 'Notifications on' : 'Notifications off'}>
            <ActionIcon
              variant="subtle"
              color={notifyEnabled ? 'violet' : 'gray'}
              size="xs"
              onClick={() => setNotifyEnabled(!notifyEnabled)}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Toggle notifications"
            >
              {notifyEnabled ? <IconBell size={12} /> : <IconBellOff size={12} />}
            </ActionIcon>
          </Tooltip>
        }
      />
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {editing ? (
          <Stack gap="xs" flex={1}>
            <TextInput
              label="Label"
              value={labelInput}
              onChange={(e) => setLabelInput(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Event name"
              size="xs"
            />
            <TextInput
              label="Date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
            />
            <TextInput
              label="Time"
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
            />
            <Text size="xs" fw={600} c="gray.3" mt="xs">
              Quick Presets
            </Text>
            <Group gap={4}>
              {PRESETS.map((p) => (
                <Badge
                  key={p.label}
                  size="xs"
                  variant="light"
                  color="gray"
                  style={{ cursor: 'pointer' }}
                  onClick={() => addPreset(p.ms, p.label)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  +{p.label}
                </Badge>
              ))}
            </Group>
            <Group gap="xs" mt="auto">
              <ActionIcon
                variant="light"
                color="violet"
                size="sm"
                onClick={saveCountdown}
                disabled={!targetDate}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Save countdown"
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
          </Stack>
        ) : countdowns.length === 0 ? (
          <Stack align="center" justify="center" h="100%" gap={8}>
            <IconSettings size={24} style={{ opacity: 0.3 }} />
            <Text size="xs" c="dimmed" fs="italic" ta="center">
              Click Edit to set a countdown
            </Text>
            <Group gap={4}>
              {PRESETS.map((p) => (
                <Badge
                  key={p.label}
                  size="xs"
                  variant="light"
                  color="gray"
                  style={{ cursor: 'pointer' }}
                  onClick={() => addPreset(p.ms, p.label)}
                >
                  +{p.label}
                </Badge>
              ))}
            </Group>
          </Stack>
        ) : (
          countdowns.map((cd) => {
            const display = calculateDisplay(cd.target, now.getTime())
            const { isExpired, days, hours, minutes, seconds } = display
            const color = getUrgencyColor(days, isExpired)
            return (
              <div
                key={cd.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--wb-radius-sm)',
                  background: 'var(--wb-surface-hover)',
                  borderLeft: `3px solid ${cd.color}`,
                }}
              >
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={600} c="gray.3" truncate>
                    {cd.label}
                  </Text>
                  <Group gap={2}>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={() => startEdit(cd)}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Edit ${cd.label}`}
                    >
                      <IconSettings size={10} />
                    </ActionIcon>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => removeCountdown(cd.id)}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Delete ${cd.label}`}
                    >
                      <IconTrash size={10} />
                    </ActionIcon>
                  </Group>
                </Group>
                <Text
                  fw={300}
                  fz="1.4rem"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.1,
                    color,
                  }}
                >
                  {isExpired ? (
                    'EXPIRED'
                  ) : (
                    <>
                      {days > 0 && <>{days}d </>}
                      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                      {(content.showSeconds ?? true) && `:${String(seconds).padStart(2, '0')}`}
                    </>
                  )}
                </Text>
                {!isExpired && (
                  <Group gap="xs" mt={2}>
                    {days > 0 && (
                      <Text size="xs" c="dimmed">
                        {days}d
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {hours}h
                    </Text>
                    <Text size="xs" c="dimmed">
                      {minutes}m
                    </Text>
                    <Text size="xs" c="dimmed">
                      {seconds}s
                    </Text>
                  </Group>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
})

export default CountdownWidget
