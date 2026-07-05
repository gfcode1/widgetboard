import { memo, useState, useCallback, useMemo } from 'react'
import { Text, Group, ActionIcon, Stack, TextInput, Badge, Modal, Select } from '@mantine/core'
import { IconChevronLeft, IconChevronRight, IconPlus, IconTrash, IconEdit } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { useGlobalTick } from '../hooks/useGlobalTick'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  widget: Widget
}

const EVENT_COLORS = ['violet', 'blue', 'green', 'orange', 'red', 'pink']

function getWeekdays(): string[] {
  const base = new Date(2024, 0, 7) // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d).slice(0, 2)
  })
}

function getMonths(): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(2024, i, 1))
  )
}

export const CalendarWidget = memo(function CalendarWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const now = useGlobalTick()
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventColor, setNewEventColor] = useState('violet')
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const content = widget.content.type === 'calendar'
    ? widget.content
    : { type: 'calendar' as const, events: [] }

  const WEEKDAYS = useMemo(() => getWeekdays(), [])
  const MONTHS = useMemo(() => getMonths(), [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = now.getDate()
  const todayMonth = now.getMonth()
  const todayYear = now.getFullYear()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const formatDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const getEventsForDay = useCallback((day: number) => {
    const dateStr = formatDateStr(day)
    return content.events.filter((e) => e.date === dateStr)
  }, [content.events, year, month])

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
    setEditingEvent(null)
    setNewEventTitle('')
    setShowModal(true)
  }

  const addEvent = useCallback(() => {
    if (!newEventTitle.trim() || selectedDay === null) return
    const event = { id: uuidv4(), title: newEventTitle.trim(), date: formatDateStr(selectedDay), color: newEventColor }
    updateWidget(widget.id, { content: { ...content, events: [...content.events, event] } })
    setNewEventTitle('')
    setShowModal(false)
  }, [widget.id, content, newEventTitle, newEventColor, selectedDay, updateWidget])

  const startEditEvent = useCallback((event: { id: string; title: string }) => {
    setEditingEvent(event.id)
    setEditTitle(event.title)
  }, [])

  const saveEditEvent = useCallback(() => {
    if (!editingEvent || !editTitle.trim()) return
    updateWidget(widget.id, {
      content: {
        ...content,
        events: content.events.map((e) => e.id === editingEvent ? { ...e, title: editTitle.trim() } : e),
      },
    })
    setEditingEvent(null)
    setEditTitle('')
  }, [widget.id, content, editingEvent, editTitle, updateWidget])

  const removeEvent = useCallback((id: string) => {
    updateWidget(widget.id, { content: { ...content, events: content.events.filter((e) => e.id !== id) } })
  }, [widget.id, content, updateWidget])

  const exportICS = useCallback((event: { title: string; date: string }) => {
    const dateNum = event.date.replace(/-/g, '')
    const nextDay = new Date(event.date + 'T00:00:00')
    nextDay.setDate(nextDay.getDate() + 1)
    const dtEnd = nextDay.toISOString().split('T')[0].replace(/-/g, '')
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//WidgetBoard//EN',
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${dateNum}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${event.title.replace(/[,;\\]/g, '\\$&')}`,
      `UID:${uuidv4()}@widgetboard`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const monthEvents = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return content.events
      .filter((e) => e.date.startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [content.events, year, month])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 8 }}>
      <Group justify="space-between" px="xs" py={4}>
        <ActionIcon variant="subtle" color="gray" size="xs" onClick={prevMonth} aria-label="Previous month"><IconChevronLeft size={14} /></ActionIcon>
        <Text size="xs" fw={600} c="gray.2">{MONTHS[month]} {year}</Text>
        <ActionIcon variant="subtle" color="gray" size="xs" onClick={nextMonth} aria-label="Next month"><IconChevronRight size={14} /></ActionIcon>
      </Group>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, flex: 1 }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--wb-text-dimmed)', fontWeight: 600, padding: 2 }}>
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const isToday = day === today && month === todayMonth && year === todayYear
          const dayEvents = getEventsForDay(day)
          const isWeekend = i % 7 === 0 || i % 7 === 6
          return (
            <div
              key={`${month}-${day}`}
              className="calendar-day"
              onClick={() => handleDayClick(day)}
              onMouseDown={(e) => e.stopPropagation()}
              role="button"
              tabIndex={0}
              aria-label={`${MONTHS[month]} ${day}, ${year}${dayEvents.length > 0 ? `, ${dayEvents.length} events` : ''}`}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDayClick(day) }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                borderRadius: '50%',
                backgroundColor: isToday ? 'var(--wb-accent)' : 'transparent',
                color: isToday ? 'white' : isWeekend ? 'var(--wb-text-dimmed)' : 'var(--wb-text)',
                fontWeight: isToday ? 600 : 400,
                aspectRatio: '1',
                cursor: 'pointer',
                transition: 'background-color var(--wb-transition-fast)',
                position: 'relative',
                pointerEvents: 'auto',
              }}
            >
              {day}
              {dayEvents.length > 0 && (
                <div style={{ position: 'absolute', bottom: 1, display: 'flex', gap: 1 }}>
                  {dayEvents.slice(0, 3).map((e) => (
                    <div key={e.id} style={{ width: 3, height: 3, borderRadius: '50%', background: `var(--mantine-color-${e.color || 'violet'}-5)` }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {monthEvents.length > 0 && (
        <Stack gap={2} mt={4} style={{ maxHeight: 80, overflow: 'auto' }}>
          {monthEvents.map((e) => (
            <Group key={e.id} gap="xs" justify="space-between">
              <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                <Badge size="xs" color={e.color || 'violet'} variant="light">{e.date.split('-')[2]}</Badge>
                {editingEvent === e.id ? (
                  <TextInput
                    value={editTitle}
                    onChange={(ev) => setEditTitle(ev.currentTarget.value)}
                    onKeyDown={(ev) => { if (ev.key === 'Enter') saveEditEvent(); if (ev.key === 'Escape') setEditingEvent(null) }}
                    onBlur={saveEditEvent}
                    size="xs"
                    autoFocus
                    variant="unstyled"
                    style={{ flex: 1, pointerEvents: 'auto' }}
                  />
                ) : (
                  <Text size="xs" c="gray.3" truncate style={{ maxWidth: 80 }}>{e.title}</Text>
                )}
              </Group>
              <Group gap={2}>
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => startEditEvent(e)} onMouseDown={(ev) => ev.stopPropagation()} aria-label="Edit event">
                  <IconEdit size={10} />
                </ActionIcon>
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => exportICS(e)} onMouseDown={(ev) => ev.stopPropagation()} aria-label="Export as ICS">
                  <Text size={9} fw={600}>.ics</Text>
                </ActionIcon>
                <ActionIcon size="xs" variant="subtle" color="red" onClick={() => removeEvent(e.id)} onMouseDown={(ev) => ev.stopPropagation()} aria-label="Delete event">
                  <IconTrash size={10} />
                </ActionIcon>
              </Group>
            </Group>
          ))}
        </Stack>
      )}

      <Modal opened={showModal} onClose={() => setShowModal(false)} title="Add Event" size="xs" centered>
        <Stack gap="xs">
          <TextInput placeholder="Event title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === 'Enter') addEvent() }} autoFocus />
          <Group gap={4}>
            {EVENT_COLORS.map((c) => (
              <div
                key={c}
                onClick={() => setNewEventColor(c)}
                role="radio"
                aria-checked={newEventColor === c}
                aria-label={`Color ${c}`}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setNewEventColor(c) }}
                style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: `var(--mantine-color-${c}-5)`,
                  border: newEventColor === c ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </Group>
          <ActionIcon variant="light" color="violet" onClick={addEvent} onMouseDown={(e) => e.stopPropagation()}>
            <IconPlus size={16} />
          </ActionIcon>
        </Stack>
      </Modal>

      <style>{`
        .calendar-day:hover { background-color: var(--wb-accent-subtle) !important; color: var(--wb-text) !important; }
      `}</style>
    </div>
  )
})

export default CalendarWidget
