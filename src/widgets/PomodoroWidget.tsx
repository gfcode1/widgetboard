import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Text, Stack, Group, ActionIcon, Chip, Tooltip } from '@mantine/core'
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconTrophy,
  IconFlame,
} from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'

interface Props {
  widget: Widget
}

type Phase = 'idle' | 'work' | 'break'

const SOUND_KEY = 'wb_pomodoro_sound'
const SESSIONS_KEY = 'wb_pomodoro_sessions'

function getSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'false'
  } catch {
    return true
  }
}

function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, String(enabled))
  } catch {
    /* ignore */
  }
}

function loadSessions(): Array<{
  date: string
  workMin: number
  breakMin: number
  completed: boolean
}> {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveSessions(
  sessions: Array<{ date: string; workMin: number; breakMin: number; completed: boolean }>
): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch {
    /* ignore */
  }
}

let sharedAudioCtx: AudioContext | null = null

function createBeep(type: 'work' | 'break' = 'work') {
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new AudioContext()
    const osc = sharedAudioCtx.createOscillator()
    const gain = sharedAudioCtx.createGain()
    osc.connect(gain)
    gain.connect(sharedAudioCtx.destination)
    // Different tones for work and break
    osc.frequency.value = type === 'work' ? 800 : 600
    gain.gain.value = 0.3
    osc.start()
    osc.stop(sharedAudioCtx.currentTime + 0.15)
  } catch {
    /* ignore */
  }
}

export const PomodoroWidget = memo(function PomodoroWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content =
    widget.content.type === 'pomodoro'
      ? widget.content
      : { type: 'pomodoro' as const, workMin: 25, breakMin: 5 }
  const contentRef = useRef(content)
  contentRef.current = content
  const [phase, setPhase] = useState<Phase>('idle')
  const [remaining, setRemaining] = useState(content.workMin * 60)
  const [soundEnabled, setSoundEnabledState] = useState(getSoundEnabled)
  const sessionsRef = useRef(loadSessions())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [sessionCount, setSessionCount] = useState(0)

  // Stats
  const today = new Date().toISOString().split('T')[0] ?? ''
  const todaySessions = useMemo(
    () => sessionsRef.current.filter((s) => s.date === today && s.completed),
    [today]
  )
  const totalSessions = sessionsRef.current.filter((s) => s.completed).length
  const totalWorkMin = sessionsRef.current
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.workMin, 0)

  const totalSeconds = phase === 'break' ? content.breakMin * 60 : content.workMin * 60
  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  useEffect(() => {
    if (phase === 'idle') {
      setRemaining(contentRef.current.workMin * 60)
      return
    }
    clearTimer()
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (soundEnabled) createBeep(phase === 'work' ? 'work' : 'break')
          if (phase === 'work') {
            const c = contentRef.current
            const completed = {
              date: today,
              workMin: c.workMin,
              breakMin: c.breakMin,
              completed: true,
            }
            const newCount = sessionCount + 1
            setSessionCount(newCount)
            sessionsRef.current = [...sessionsRef.current, completed]
            saveSessions(sessionsRef.current)
            updateWidget(widget.id, { content: { ...c, sessions: sessionsRef.current } })
            setPhase('break')
            const isLongBreak = newCount % 4 === 0
            return isLongBreak ? 15 * 60 : c.breakMin * 60
          } else {
            setPhase('work')
            return contentRef.current.workMin * 60
          }
        }
        return prev - 1
      })
    }, 1000)
    return clearTimer
  }, [phase, clearTimer, widget.id, updateWidget, soundEnabled, today])

  const togglePlayPause = () => setPhase((p) => (p === 'idle' ? 'work' : 'idle'))

  const reset = () => {
    clearTimer()
    setPhase('idle')
    setRemaining(content.workMin * 60)
  }

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabledState(next)
    setSoundEnabled(next)
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const toggleWork = () => {
    const next = content.workMin === 25 ? 30 : content.workMin === 30 ? 15 : 25
    updateWidget(widget.id, { content: { ...content, workMin: next } })
    if (phase === 'idle') setRemaining(next * 60)
  }

  const toggleBreak = () => {
    const next = content.breakMin === 5 ? 10 : 5
    updateWidget(widget.id, { content: { ...content, breakMin: next } })
  }

  return (
    <Stack align="center" justify="center" h="100%" gap={4} px="sm">
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--mantine-color-dark-5)"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={
              phase === 'work'
                ? 'var(--mantine-color-blue-5)'
                : phase === 'break'
                  ? 'var(--mantine-color-green-5)'
                  : 'var(--wb-text-dimmed)'
            }
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
              filter:
                phase === 'work'
                  ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))'
                  : phase === 'break'
                    ? 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))'
                    : 'none',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Text
            fw={200}
            fz="xl"
            c="gray.1"
            style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
          >
            {timeStr}
          </Text>
          <Text
            size="xs"
            c={
              phase === 'work'
                ? 'blue.4'
                : phase === 'break'
                  ? sessionCount % 4 === 0
                    ? 'yellow.4'
                    : 'green.4'
                  : 'dimmed'
            }
            fw={phase !== 'idle' ? 500 : 400}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background:
                  phase === 'work'
                    ? 'var(--mantine-color-blue-4)'
                    : phase === 'break'
                      ? 'var(--mantine-color-green-4)'
                      : 'var(--mantine-color-dimmed)',
                marginRight: 4,
                verticalAlign: 'middle',
              }}
            />
            {phase === 'idle'
              ? 'Ready'
              : phase === 'work'
                ? 'Focus'
                : sessionCount % 4 === 0
                  ? 'Long Break'
                  : 'Break'}
          </Text>
        </div>
      </div>

      <Group gap={4}>
        <ActionIcon
          variant="filled"
          color="violet"
          size={40}
          radius="xl"
          onClick={togglePlayPause}
          aria-label={phase === 'idle' ? 'Start timer' : 'Pause timer'}
          aria-pressed={phase !== 'idle'}
          style={{
            boxShadow: phase === 'idle' ? 'var(--wb-glow-accent)' : 'none',
          }}
        >
          {phase === 'idle' ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={reset}
          aria-label="Reset timer"
        >
          <IconPlayerStop size={16} />
        </ActionIcon>
        <Tooltip label={soundEnabled ? 'Sound on' : 'Sound off'}>
          <ActionIcon
            variant="subtle"
            color={soundEnabled ? 'violet' : 'gray'}
            size="sm"
            onClick={toggleSound}
            aria-label="Toggle sound"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group gap="md" justify="center">
        <Group gap={4}>
          <IconFlame size={12} color="var(--mantine-color-orange-5)" />
          <Text size="xs" c="dimmed">
            {todaySessions.length} today
          </Text>
        </Group>
        <Group gap={4}>
          <IconTrophy size={12} color="var(--mantine-color-yellow-5)" />
          <Text size="xs" c="dimmed">
            {totalSessions} total
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          {totalWorkMin}m focused
        </Text>
      </Group>

      <Group gap={4}>
        <Chip size="xs" variant="light" color="gray" checked={false} onChange={toggleWork}>
          {content.workMin}m work
        </Chip>
        <Chip size="xs" variant="light" color="gray" checked={false} onChange={toggleBreak}>
          {content.breakMin}m break
        </Chip>
      </Group>
    </Stack>
  )
})

export default PomodoroWidget
