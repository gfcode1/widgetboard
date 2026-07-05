import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { Text, Stack, Group, ActionIcon, Chip } from '@mantine/core'
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'

interface Props {
  widget: Widget
}

type Phase = 'idle' | 'work' | 'break'

let sharedAudioCtx: AudioContext | null = null

function createBeep() {
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new AudioContext()
    const osc = sharedAudioCtx.createOscillator()
    const gain = sharedAudioCtx.createGain()
    osc.connect(gain)
    gain.connect(sharedAudioCtx.destination)
    osc.frequency.value = 800
    gain.gain.value = 0.3
    osc.start()
    osc.stop(sharedAudioCtx.currentTime + 0.15)
  } catch { /* ignore */ }
}

export const PomodoroWidget = memo(function PomodoroWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content = widget.content.type === 'pomodoro'
    ? widget.content
    : { type: 'pomodoro' as const, workMin: 25, breakMin: 5 }
  const [phase, setPhase] = useState<Phase>('idle')
  const [remaining, setRemaining] = useState(content.workMin * 60)
  const sessionsRef = useRef(content.sessions ?? [])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      setRemaining(content.workMin * 60)
      return
    }
    clearTimer()
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          createBeep()
          if (phase === 'work') {
            const completed = { date: new Date().toISOString().split('T')[0], workMin: content.workMin, breakMin: content.breakMin, completed: true }
            sessionsRef.current = [...sessionsRef.current, completed]
            updateWidget(widget.id, { content: { ...content, sessions: sessionsRef.current } })
            setPhase('break')
            return content.breakMin * 60
          } else {
            setPhase('work')
            return content.workMin * 60
          }
        }
        return prev - 1
      })
    }, 1000)
    return clearTimer
  }, [phase, content.workMin, content.breakMin, clearTimer, widget.id, content, updateWidget])

  const togglePlayPause = () => setPhase((p) => p === 'idle' ? 'work' : 'idle')

  const reset = () => {
    clearTimer()
    setPhase('idle')
    setRemaining(content.workMin * 60)
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
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--mantine-color-dark-5)" strokeWidth="4" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={phase === 'work' ? 'var(--mantine-color-blue-5)' : phase === 'break' ? 'var(--mantine-color-green-5)' : 'var(--wb-text-dimmed)'}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
              filter: phase === 'work' ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' : phase === 'break' ? 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))' : 'none',
            }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <Text fw={200} fz="xl" c="gray.1" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {timeStr}
          </Text>
          <Text size="xs" c={phase === 'work' ? 'blue.4' : phase === 'break' ? 'green.4' : 'dimmed'} fw={phase !== 'idle' ? 500 : 400}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: phase === 'work' ? 'var(--mantine-color-blue-4)' : phase === 'break' ? 'var(--mantine-color-green-4)' : 'var(--mantine-color-dimmed)', marginRight: 4, verticalAlign: 'middle' }} />
            {phase === 'idle' ? 'Ready' : phase === 'work' ? 'Focus' : 'Break'}
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
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={reset} aria-label="Reset timer">
          <IconPlayerStop size={16} />
        </ActionIcon>
      </Group>

      <Text size="xs" c="dimmed" style={{ background: 'var(--wb-accent-subtle)', borderRadius: 'var(--wb-radius-sm)', padding: '2px 8px' }}>
        {sessionsRef.current.length} sessions completed
      </Text>

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
