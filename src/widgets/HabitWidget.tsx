import { memo, useState, useCallback, useMemo } from 'react'
import { Text, Stack, Group, ActionIcon, TextInput, Badge } from '@mantine/core'
import { IconPlus, IconTrash, IconFlame, IconTarget } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { useGlobalTick } from '../hooks/useGlobalTick'
import { WidgetHeader } from './base/WidgetHeader'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  widget: Widget
}

const HABIT_COLORS = [
  { value: 'violet', label: 'Violet', hex: 'var(--mantine-color-violet-5)' },
  { value: 'blue', label: 'Blue', hex: 'var(--mantine-color-blue-5)' },
  { value: 'green', label: 'Green', hex: 'var(--mantine-color-green-5)' },
  { value: 'orange', label: 'Orange', hex: 'var(--mantine-color-orange-5)' },
  { value: 'red', label: 'Red', hex: 'var(--mantine-color-red-5)' },
  { value: 'pink', label: 'Pink', hex: 'var(--mantine-color-pink-5)' },
  { value: 'teal', label: 'Teal', hex: 'var(--mantine-color-teal-5)' },
]

function getWeekDates(): string[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]!
  })
}

function getDayLabels(): string[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d).slice(0, 2)
  })
}

function getStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0
  const sorted = [...completedDates].sort().reverse()
  const today = new Date().toISOString().split('T')[0]!
  let streak = 0
  let checkDate = new Date(today)
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]!
    if (sorted.includes(dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
    checkDate.setDate(checkDate.getDate() - 1)
  }
  return streak
}

export const HabitWidget = memo(function HabitWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('violet')

  const content =
    widget.content.type === 'habit' ? widget.content : { type: 'habit' as const, habits: [] }

  const now = useGlobalTick()
  const weekDates = useMemo(() => getWeekDates(), [now.toISOString().split('T')[0]])
  const dayLabels = useMemo(() => getDayLabels(), [now.toISOString().split('T')[0]])
  const today = now.toISOString().split('T')[0]

  const addHabit = useCallback(() => {
    if (!newName) return
    const habit = {
      id: uuidv4(),
      name: newName,
      icon: 'target',
      color: newColor,
      completedDates: [],
      frequency: 'daily' as const,
    }
    updateWidget(widget.id, {
      content: { ...content, habits: [...content.habits, habit] },
    })
    setNewName('')
  }, [widget.id, content, newName, newColor, updateWidget])

  const removeHabit = useCallback(
    (id: string) => {
      updateWidget(widget.id, {
        content: { ...content, habits: content.habits.filter((h) => h.id !== id) },
      })
    },
    [widget.id, content, updateWidget]
  )

  const toggleDay = useCallback(
    (habitId: string, date: string) => {
      updateWidget(widget.id, {
        content: {
          ...content,
          habits: content.habits.map((h) => {
            if (h.id !== habitId) return h
            const completed = h.completedDates.includes(date)
            return {
              ...h,
              completedDates: completed
                ? h.completedDates.filter((d) => d !== date)
                : [...h.completedDates, date],
            }
          }),
        },
      })
    },
    [widget.id, content, updateWidget]
  )

  const weeklyRate = useMemo(() => {
    if (content.habits.length === 0) return 0
    const totalPossible = content.habits.length * 7
    const totalDone = content.habits.reduce(
      (sum, h) => sum + h.completedDates.filter((d) => weekDates.includes(d)).length,
      0
    )
    return totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0
  }, [content.habits, weekDates])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Habits"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconTarget size={12} />}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            {content.habits.map((h) => (
              <Group key={h.id} gap="xs" justify="space-between">
                <Group gap="xs">
                  <Badge size="xs" color={h.color} variant="light">
                    {h.name}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {getStreak(h.completedDates)}d streak
                  </Text>
                </Group>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={() => removeHabit(h.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <IconTrash size={10} />
                </ActionIcon>
              </Group>
            ))}
            <Group gap="xs">
              <TextInput
                placeholder="Habit name"
                value={newName}
                onChange={(e) => setNewName(e.currentTarget.value)}
                onMouseDown={(e) => e.stopPropagation()}
                size="xs"
                style={{ flex: 1 }}
              />
              <ActionIcon
                variant="light"
                color="violet"
                size="sm"
                onClick={addHabit}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
            <Group gap={4} justify="center">
              {HABIT_COLORS.map((c) => (
                <div
                  key={c.value}
                  onClick={() => setNewColor(c.value)}
                  role="radio"
                  aria-checked={newColor === c.value}
                  aria-label={c.label}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setNewColor(c.value)
                  }}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: c.hex,
                    border: newColor === c.value ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Group>
          </Stack>
        ) : (
          <>
            {content.habits.length === 0 ? (
              <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
                No habits tracked yet
              </Text>
            ) : (
              <>
                <Group justify="space-between" mb={8}>
                  <Text size="xs" c="dimmed">
                    Weekly completion
                  </Text>
                  <Text size="xs" fw={600} c="violet.4">
                    {weeklyRate}%
                  </Text>
                </Group>

                <Group gap={0} mb={4} pl={70}>
                  {dayLabels.map((d, i) => (
                    <Text
                      key={i}
                      size="xs"
                      c="dimmed"
                      ta="center"
                      style={{ flex: 1, fontSize: 10 }}
                    >
                      {d}
                    </Text>
                  ))}
                </Group>

                <Stack gap={4}>
                  {content.habits.map((h) => {
                    const streak = getStreak(h.completedDates)
                    return (
                      <Group key={h.id} gap={0} align="center">
                        <div style={{ width: 70, minWidth: 70 }}>
                          <Text size="xs" c="gray.2" truncate>
                            {h.name}
                          </Text>
                          {streak > 0 && (
                            <Group gap={2}>
                              <IconFlame size={10} color="var(--mantine-color-orange-5)" />
                              <Text size="xs" c="orange.4" style={{ fontSize: 10 }}>
                                {streak}
                              </Text>
                            </Group>
                          )}
                        </div>
                        {weekDates.map((date) => {
                          const done = h.completedDates.includes(date)
                          const isToday = date === today
                          const colorHex =
                            HABIT_COLORS.find((c) => c.value === h.color)?.hex ||
                            'var(--mantine-color-violet-5)'
                          return (
                            <div
                              key={date}
                              onClick={() => toggleDay(h.id, date)}
                              onMouseDown={(e) => e.stopPropagation()}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                              }}
                            >
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 4,
                                  border: isToday
                                    ? `2px solid ${colorHex}`
                                    : '1px solid var(--wb-border)',
                                  background: done ? colorHex : 'transparent',
                                  transition: 'all var(--wb-transition-fast)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {done && (
                                  <Text size="xs" c="white" fw={700} style={{ fontSize: 10 }}>
                                    ✓
                                  </Text>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </Group>
                    )
                  })}
                </Stack>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
})

export default HabitWidget
