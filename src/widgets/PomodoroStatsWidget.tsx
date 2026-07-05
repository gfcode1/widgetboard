import { memo, useMemo } from 'react'
import { Text, Stack, Group } from '@mantine/core'
import { IconChartBar } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { useGlobalTick } from '../hooks/useGlobalTick'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

export const PomodoroStatsWidget = memo(function PomodoroStatsWidget({ widget: _widget }: Props) {
  const boards = useStore((s) => s.boards)
  const currentBoardId = useStore((s) => s.currentBoardId)
  const now = useGlobalTick()

  const last7 = useMemo(() => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }, [now.toISOString().split('T')[0]])

  const dayLabels = useMemo(() => {
    const labels: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      labels.push(new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d).slice(0, 2))
    }
    return labels
  }, [now.toISOString().split('T')[0]])

  const allSessions = useMemo(() => {
    const boardWidgets = currentBoardId ? (boards[currentBoardId] ?? []) : []
    return boardWidgets
      .filter((w): w is Widget & { content: { type: 'pomodoro'; sessions: Array<{ date: string; workMin: number; breakMin: number; completed: boolean }> } } =>
        w.content.type === 'pomodoro' && Array.isArray((w.content as { sessions?: unknown }).sessions)
      )
      .flatMap((w) => w.content.sessions)
  }, [boards, currentBoardId])

  const dayData = useMemo(() => {
    return last7.map((date) => {
      const sessions = allSessions.filter((s) => s.date === date)
      const workMin = sessions.reduce((sum, s) => sum + s.workMin, 0)
      const breakMin = sessions.reduce((sum, s) => sum + s.breakMin, 0)
      const completed = sessions.filter((s) => s.completed).length
      return { date, workMin, breakMin, completed, total: sessions.length }
    })
  }, [allSessions, last7])

  const maxMin = Math.max(1, ...dayData.map((d) => d.workMin + d.breakMin))

  const totalSessions = allSessions.length
  const totalWorkMin = allSessions.reduce((sum, s) => sum + s.workMin, 0)
  const avgPerDay = totalWorkMin / 7

  const bestDay = useMemo(() => {
    let best = dayData[0]
    for (const d of dayData) {
      if (d.workMin > best.workMin) best = d
    }
    return best
  }, [dayData])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader title="Pomodoro Stats" editing={false} onToggleEdit={() => {}} icon={<IconChartBar size={12} />} />
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {totalSessions === 0 ? (
          <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
            Complete pomodoro sessions to see stats
          </Text>
        ) : (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Last 7 days</Text>
            </Group>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, padding: '0 4px' }}>
              {dayData.map((d, i) => {
                const workPct = maxMin > 0 ? (d.workMin / maxMin) * 100 : 0
                const breakPct = maxMin > 0 ? (d.breakMin / maxMin) * 100 : 0
                const isToday = d.date === last7[6]
                return (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${breakPct}%`,
                          background: 'var(--mantine-color-green-6)',
                          borderRadius: '2px 2px 0 0',
                          minHeight: breakPct > 0 ? 2 : 0,
                          transition: 'height 0.3s ease',
                        }}
                      />
                      <div
                        style={{
                          width: '100%',
                          height: `${workPct}%`,
                          background: isToday ? 'var(--mantine-color-violet-5)' : 'var(--mantine-color-blue-5)',
                          borderRadius: '2px 2px 0 0',
                          minHeight: workPct > 0 ? 2 : 0,
                          transition: 'height 0.3s ease',
                        }}
                      />
                    </div>
                    <Text size="xs" c={isToday ? 'violet.4' : 'dimmed'} style={{ fontSize: 9 }}>
                      {dayLabels[i]}
                    </Text>
                  </div>
                )
              })}
            </div>

            <Group gap="md" justify="center">
              <Group gap={4}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--mantine-color-blue-5)' }} />
                <Text size="xs" c="dimmed">Work</Text>
              </Group>
              <Group gap={4}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--mantine-color-green-6)' }} />
                <Text size="xs" c="dimmed">Break</Text>
              </Group>
            </Group>

            <Stack gap={4}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Total sessions</Text>
                <Text size="xs" fw={600} c="gray.1">{totalSessions}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Total focus</Text>
                <Text size="xs" fw={600} c="gray.1">{Math.round(totalWorkMin)}m</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Daily average</Text>
                <Text size="xs" fw={600} c="gray.1">{Math.round(avgPerDay)}m</Text>
              </Group>
              {bestDay.workMin > 0 && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Best day</Text>
                  <Text size="xs" fw={600} c="violet.4">{bestDay.date} ({bestDay.workMin}m)</Text>
                </Group>
              )}
            </Stack>
          </Stack>
        )}
      </div>
    </div>
  )
})

export default PomodoroStatsWidget
