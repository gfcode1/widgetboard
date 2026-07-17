import { memo, useState, useMemo } from 'react'
import { Text, Stack, Group, Select, ActionIcon, Chip, Badge } from '@mantine/core'
import { IconPlus, IconX, IconSun, IconMoon } from '@tabler/icons-react'
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

function formatTime(timezone: string, use12h: boolean, now: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: use12h,
    }).format(now)
  } catch {
    return '--:--:--'
  }
}

function formatDate(timezone: string, now: Date): string {
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

function getHourOffset(timezone: string, now: Date): number {
  try {
    const localTime = now.getTime()
    const tzString = new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).format(now)
    const match = tzString.match(/GMT([+-]\d+)/)
    if (match) return parseInt(match[1]!, 10)
    const tzTime = new Date(
      new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)
    ).getTime()
    return Math.round((tzTime - localTime) / 3600000)
  } catch {
    return 0
  }
}

function getLocalHourOffset(): number {
  return -new Date().getTimezoneOffset() / 60
}

function getCityName(timezone: string): string {
  return timezone.split('/').pop()?.replace(/_/g, ' ') || timezone
}

function isDaytime(timezone: string, now: Date): boolean {
  try {
    const hour = parseInt(
      new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        hour: '2-digit',
        hour12: false,
      }).format(now),
      10
    )
    return hour >= 6 && hour < 18
  } catch {
    return true
  }
}

export const WorldClockWidget = memo(function WorldClockWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content =
    widget.content.type === 'worldclock'
      ? widget.content
      : { type: 'worldclock' as const, clocks: [] }
  const now = useGlobalTick()
  const [adding, setAdding] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null)

  const localOffset = useMemo(() => getLocalHourOffset(), [])

  const addClock = () => {
    if (!selectedTimezone) return
    const cityName = getCityName(selectedTimezone)
    const newClocks = [
      ...content.clocks,
      { city: cityName, timezone: selectedTimezone, use12h: false },
    ]
    updateWidget(widget.id, { content: { ...content, clocks: newClocks } })
    setSelectedTimezone(null)
    setAdding(false)
  }

  const removeClock = (index: number) => {
    updateWidget(widget.id, {
      content: { ...content, clocks: content.clocks.filter((_, i) => i !== index) },
    })
  }

  const toggle12h = (index: number) => {
    updateWidget(widget.id, {
      content: {
        ...content,
        clocks: content.clocks.map((c, i) => (i === index ? { ...c, use12h: !c.use12h } : c)),
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 8 }}>
      <Stack gap={4} style={{ flex: 1, overflow: 'auto' }}>
        {content.clocks.map((clock, i) => {
          const tz = (clock as { timezone?: string }).timezone || 'UTC'
          const offset = getHourOffset(tz, now)
          const relDiff = offset - localOffset
          const day = isDaytime(tz, now)

          return (
            <Group
              key={`${clock.city}-${i}`}
              justify="space-between"
              px="xs"
              py={6}
              style={{
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: 'var(--mantine-color-dark-8)',
                transition: 'all 150ms ease',
              }}
            >
              <div>
                <Group gap={4}>
                  {day ? (
                    <IconSun size={10} style={{ color: 'var(--mantine-color-yellow-5)' }} />
                  ) : (
                    <IconMoon size={10} style={{ color: 'var(--mantine-color-blue-4)' }} />
                  )}
                  <Text size="xs" c="dimmed">
                    {clock.city}
                  </Text>
                </Group>
                <Text fw={500} c="gray.1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(tz, clock.use12h, now)}
                </Text>
                <Group gap={4}>
                  <Text size="xs" c="dimmed" style={{ fontSize: 9 }}>
                    {formatDate(tz, now)}
                  </Text>
                  {relDiff !== 0 && (
                    <Badge
                      size="xs"
                      variant="light"
                      color={relDiff > 0 ? 'green' : 'orange'}
                      style={{ fontSize: 8, padding: '0 4px' }}
                    >
                      {relDiff > 0 ? `+${relDiff}h` : `${relDiff}h`}
                    </Badge>
                  )}
                </Group>
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
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={() => removeClock(i)}
                  aria-label={`Remove ${clock.city}`}
                >
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
          <ActionIcon
            variant="subtle"
            color="green"
            size="sm"
            onClick={addClock}
            aria-label="Add clock"
          >
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
