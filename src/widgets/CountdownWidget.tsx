import { memo, useState, useCallback } from 'react'
import { Text, Stack, Group, ActionIcon, TextInput } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { useGlobalTick } from '../hooks/useGlobalTick'

interface Props {
  widget: Widget
}

export const CountdownWidget = memo(function CountdownWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [targetTime, setTargetTime] = useState('12:00')
  const now = useGlobalTick()

  const content = widget.content.type === 'countdown'
    ? widget.content
    : { type: 'countdown' as const, target: 0, label: '', showSeconds: true }

  const toggleEdit = () => {
    if (!editing && content.target > 0) {
      const d = new Date(content.target)
      setLabelInput(content.label || '')
      setTargetDate(d.toISOString().split('T')[0])
      setTargetTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    }
    setEditing(!editing)
  }

  const saveCountdown = useCallback(() => {
    if (!targetDate) return
    const ts = new Date(`${targetDate}T${targetTime}`).getTime()
    if (isNaN(ts)) return
    updateWidget(widget.id, {
      content: { ...content, target: ts, label: labelInput || 'Countdown' },
    })
    setEditing(false)
  }, [widget.id, content, targetDate, targetTime, labelInput, updateWidget])

  const diff = content.target - now.getTime()
  const isExpired = diff <= 0 && content.target > 0
  const totalSeconds = Math.max(0, Math.floor(diff / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const getColor = () => {
    if (isExpired) return 'var(--mantine-color-red-5)'
    if (days > 7) return 'var(--mantine-color-green-5)'
    if (days > 1) return 'var(--mantine-color-yellow-5)'
    return 'var(--mantine-color-orange-5)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Group
        justify="space-between"
        px="sm"
        py={4}
        style={{
          borderBottom: '1px solid var(--wb-border)',
          minHeight: 32,
        }}
      >
        <Text size="xs" fw={600} c="gray.3" truncate style={{ flex: 1 }}>
          {content.label || 'Countdown'}
        </Text>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xs"
          onClick={toggleEdit}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Edit countdown"
        >
          <IconSettings size={12} />
        </ActionIcon>
      </Group>

      <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {editing ? (
          <Stack gap="xs" w="100%">
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
            <ActionIcon
              variant="light"
              color="violet"
              size="sm"
              onClick={saveCountdown}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ alignSelf: 'flex-end' }}
            >
              <IconSettings size={14} />
            </ActionIcon>
          </Stack>
        ) : (
          <Stack align="center" gap={4}>
            {content.target > 0 ? (
              <>
                <Text
                  fw={300}
                  fz="1.8rem"
                  ta="center"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                    color: getColor(),
                  }}
                >
                  {isExpired ? (
                    'EXPIRED'
                  ) : (
                    <>
                      {days > 0 && <>{days}d </>}
                      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                      {content.showSeconds && `:${String(seconds).padStart(2, '0')}`}
                    </>
                  )}
                </Text>
                {!isExpired && (
                  <Group gap="xs">
                    {days > 0 && (
                      <Text size="xs" c="dimmed">{days} days</Text>
                    )}
                    <Text size="xs" c="dimmed">{hours}h</Text>
                    <Text size="xs" c="dimmed">{minutes}m</Text>
                  </Group>
                )}
              </>
            ) : (
              <Text size="sm" c="dimmed" fs="italic" ta="center">
                Click to set a countdown
              </Text>
            )}
          </Stack>
        )}
      </div>
    </div>
  )
})

export default CountdownWidget
