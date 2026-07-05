import { memo } from 'react'
import { Group, Text, Chip, Stack } from '@mantine/core'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { useGlobalTick } from '../hooks/useGlobalTick'

interface Props {
  widget: Widget
}

function formatTime(date: Date, showSeconds: boolean, use12h: boolean): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: use12h,
  }
  if (showSeconds) opts.second = '2-digit'
  return new Intl.DateTimeFormat(undefined, opts).format(date)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export const ClockWidget = memo(function ClockWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content = widget.content.type === 'clock' ? widget.content : { type: 'clock' as const, showDate: true, showSeconds: true, use12h: false }
  const now = useGlobalTick()

  const toggleDate = () => {
    updateWidget(widget.id, {
      content: { type: 'clock', showDate: !content.showDate, showSeconds: content.showSeconds, use12h: content.use12h },
    })
  }

  const toggleSeconds = () => {
    updateWidget(widget.id, {
      content: { type: 'clock', showDate: content.showDate, showSeconds: !content.showSeconds, use12h: content.use12h },
    })
  }

  const toggle12h = () => {
    updateWidget(widget.id, {
      content: { type: 'clock', showDate: content.showDate, showSeconds: content.showSeconds, use12h: !content.use12h },
    })
  }

  return (
    <Stack align="center" justify="center" h="100%" gap={8} px="sm" style={{ userSelect: 'none' }}>
      <Text
        fw={300}
        fz="2.8rem"
        style={{
          letterSpacing: '0.05em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #e4e4e7 0%, var(--wb-accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {formatTime(now, content.showSeconds, content.use12h)}
      </Text>
      {content.showDate && (
        <>
          <div
            style={{
              width: 40,
              height: 1,
              background: 'rgba(255,255,255,0.08)',
              marginTop: 6,
              marginBottom: 2,
            }}
          />
          <Text size="xs" c="dimmed" style={{ letterSpacing: '0.06em' }}>
            {formatDate(now)}
          </Text>
        </>
      )}
      <Group gap={6} mt={6}>
        <Chip size="xs" variant="light" checked={content.showDate} onChange={toggleDate} color="violet">
          Date
        </Chip>
        <Chip size="xs" variant="light" checked={content.showSeconds} onChange={toggleSeconds} color="violet">
          Seconds
        </Chip>
        <Chip size="xs" variant="light" checked={content.use12h} onChange={toggle12h} color="violet">
          {content.use12h ? '12h' : '24h'}
        </Chip>
      </Group>
    </Stack>
  )
})

export default ClockWidget
