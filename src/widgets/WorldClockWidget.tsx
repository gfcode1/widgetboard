import { memo, useState } from 'react'
import { Text, Stack, Group, Select, ActionIcon, Chip } from '@mantine/core'
import { IconPlus, IconX } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { useGlobalTick } from '../hooks/useGlobalTick'

interface Props {
  widget: Widget
}

const TIMEZONE_CITIES = [
  { value: 'Pacific/Pago_Pago', label: 'Pago Pago (UTC-11)' },
  { value: 'Pacific/Honolulu', label: 'Honolulu (UTC-10)' },
  { value: 'America/Anchorage', label: 'Anchorage (UTC-9/-8)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8/-7)' },
  { value: 'America/Denver', label: 'Denver (UTC-7/-6)' },
  { value: 'America/Chicago', label: 'Chicago (UTC-6/-5)' },
  { value: 'America/New_York', label: 'New York (UTC-5/-4)' },
  { value: 'America/Halifax', label: 'Halifax (UTC-4/-3)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
  { value: 'Atlantic/South_Georgia', label: 'South Georgia (UTC-2)' },
  { value: 'Atlantic/Azores', label: 'Azores (UTC-1/+0)' },
  { value: 'Europe/London', label: 'London (UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (UTC+2/+3)' },
  { value: 'Europe/Moscow', label: 'Moscow (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
  { value: 'Asia/Karachi', label: 'Karachi (UTC+5)' },
  { value: 'Asia/Kolkata', label: 'Mumbai (UTC+5:30)' },
  { value: 'Asia/Dhaka', label: 'Dhaka (UTC+6)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10/+11)' },
  { value: 'Pacific/Auckland', label: 'Auckland (UTC+12/+13)' },
]

function formatClockTime(timezone: string, use12h: boolean, now: Date): string {
  try {
    const opts: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: use12h,
    }
    return new Intl.DateTimeFormat(undefined, opts).format(now)
  } catch {
    return '--:--:--'
  }
}

function formatClockDate(timezone: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(now)
  } catch {
    return ''
  }
}

function getCityName(timezone: string): string {
  return timezone.split('/').pop()?.replace(/_/g, ' ') || timezone
}

export const WorldClockWidget = memo(function WorldClockWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content = widget.content.type === 'worldclock' ? widget.content : { type: 'worldclock' as const, clocks: [] }
  const now = useGlobalTick()
  const [adding, setAdding] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null)

  const addClock = () => {
    if (!selectedTimezone) return
    const cityName = getCityName(selectedTimezone)
    const newClocks = [...content.clocks, { city: cityName, timezone: selectedTimezone, use12h: false }]
    updateWidget(widget.id, { content: { ...content, clocks: newClocks } })
    setSelectedTimezone(null)
    setAdding(false)
  }

  const removeClock = (index: number) => {
    updateWidget(widget.id, { content: { ...content, clocks: content.clocks.filter((_, i) => i !== index) } })
  }

  const toggle12h = (index: number) => {
    updateWidget(widget.id, {
      content: {
        ...content,
        clocks: content.clocks.map((c, i) => i === index ? { ...c, use12h: !c.use12h } : c),
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 8 }}>
      <Stack gap={4} style={{ flex: 1, overflow: 'auto' }}>
        {content.clocks.map((clock, i) => {
          const tz = (clock as { timezone?: string; offset?: number }).timezone
          const displayTz = tz || 'UTC'
          return (
            <Group
              key={`${clock.city}-${i}`}
              justify="space-between"
              px="xs"
              py={4}
              style={{
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: 'var(--mantine-color-dark-8)',
              }}
            >
              <div>
                <Text size="xs" c="dimmed">{clock.city}</Text>
                <Text fw={500} c="gray.1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatClockTime(displayTz, clock.use12h, now)}
                </Text>
                <Text size="xs" c="dimmed" style={{ fontSize: 9 }}>
                  {formatClockDate(displayTz, now)}
                </Text>
              </div>
              <Group gap={2}>
                <Chip
                  size="xs"
                  variant="light"
                  color="gray"
                  checked={clock.use12h}
                  onChange={() => toggle12h(i)}
                >
                  12h
                </Chip>
                <ActionIcon variant="subtle" color="red" size="xs" onClick={() => removeClock(i)} aria-label={`Remove ${clock.city}`}>
                  <IconX size={12} />
                </ActionIcon>
              </Group>
            </Group>
          )
        })}
        {content.clocks.length === 0 && (
          <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
            Add a clock to get started
          </Text>
        )}
      </Stack>

      {adding ? (
        <Group gap="xs" mt={4}>
          <Select
            data={TIMEZONE_CITIES}
            value={selectedTimezone}
            onChange={setSelectedTimezone}
            placeholder="Select city"
            size="xs"
            searchable
            flex={1}
          />
          <ActionIcon variant="subtle" color="green" size="sm" onClick={addClock} aria-label="Add clock">
            <IconPlus size={14} />
          </ActionIcon>
        </Group>
      ) : (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          mt={4}
          onClick={() => setAdding(true)}
          style={{ alignSelf: 'center' }}
          aria-label="Add clock"
        >
          <IconPlus size={14} />
        </ActionIcon>
      )}
    </div>
  )
})

export default WorldClockWidget
