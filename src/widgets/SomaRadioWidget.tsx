import { memo, useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Group, Select, ActionIcon, Text, Slider, Tooltip, Badge } from '@mantine/core'
import { IconRadio, IconPlayerPlay, IconPlayerPause, IconLoader } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { SOMA_STATIONS, getStationBySlug } from './data/somaStations'

interface Props {
  widget: Widget
}

type GenreGroup = { group: string; items: { value: string; label: string }[] }

export const SomaRadioWidget = memo(function SomaRadioWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const content =
    widget.content.type === 'somaradio'
      ? widget.content
      : { type: 'somaradio' as const, stationSlug: '', volume: 0.8 }

  const station = content.stationSlug ? getStationBySlug(content.stationSlug) : undefined
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => {
      setPlaying(true)
      setBuffering(false)
      setError(null)
    }
    const onPause = () => {
      setPlaying(false)
      setBuffering(false)
    }
    const onWaiting = () => setBuffering(true)
    const onCanPlay = () => setBuffering(false)
    const onError = () => {
      setPlaying(false)
      setError('Stream unavailable')
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('error', onError)
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current || !station) {
      if (audioRef.current && !station) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
      }
      return
    }
    const audio = audioRef.current
    audio.pause()
    setPlaying(false)
    setBuffering(true)
    setError(null)
    audio.volume = content.volume
    audio.src = station.streamUrl
    audio.load()
  }, [content.stationSlug, station])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = content.volume
    }
  }, [content.volume])

  useEffect(
    () => () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
    },
    []
  )

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      setError(null)
      audio.play().catch(() => {
        setError('Playback blocked. Click play again.')
      })
    }
  }, [playing])

  const handleStationChange = useCallback(
    (value: string | null) => {
      if (!value) return
      updateWidget(widget.id, { content: { ...content, stationSlug: value } })
    },
    [widget.id, updateWidget, content]
  )

  const handleVolumeChange = useCallback(
    (value: number) => {
      updateWidget(widget.id, { content: { ...content, volume: value / 100 } })
    },
    [widget.id, updateWidget, content]
  )

  const genreGroups = useMemo(() => {
    const map = new Map<string, { value: string; label: string }[]>()
    for (const s of SOMA_STATIONS) {
      const items = map.get(s.genre) || []
      items.push({ value: s.slug, label: s.name })
      map.set(s.genre, items)
    }
    const groups: GenreGroup[] = []
    for (const [group, items] of map) {
      groups.push({ group, items })
    }
    return groups
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Soma Radio"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconRadio size={12} />}
      />
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <Select
          placeholder="Search SomaFM stations..."
          data={genreGroups}
          value={content.stationSlug || null}
          onChange={handleStationChange}
          searchable
          clearable
          size="xs"
          styles={{
            input: {
              background: 'var(--wb-surface-hover)',
              border: '1px solid var(--wb-border)',
              color: 'var(--wb-text)',
              fontSize: 13,
            },
            dropdown: {
              background: 'var(--wb-surface-solid)',
              border: '1px solid var(--wb-border-solid)',
            },
            option: {
              fontSize: 13,
            },
            groupLabel: {
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--wb-accent)',
            },
          }}
        />

        {station && (
          <>
            <Group gap="xs" wrap="nowrap">
              <Tooltip label={playing ? 'Stop' : 'Play'}>
                <ActionIcon
                  variant="filled"
                  color={error ? 'red' : playing ? 'violet' : 'violet'}
                  size="lg"
                  radius="xl"
                  onClick={handlePlayPause}
                  aria-label={playing ? 'Stop' : 'Play'}
                  disabled={!content.stationSlug}
                >
                  {buffering ? (
                    <IconLoader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : playing ? (
                    <IconPlayerPause size={18} />
                  ) : (
                    <IconPlayerPlay size={18} />
                  )}
                </ActionIcon>
              </Tooltip>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <Text
                    size="sm"
                    fw={600}
                    style={{ color: 'var(--wb-accent)', letterSpacing: '0.02em' }}
                  >
                    {station.name}
                  </Text>
                  {buffering && (
                    <Badge size="xs" variant="light" color="yellow" autoContrast>
                      buffering
                    </Badge>
                  )}
                  {error && (
                    <Badge size="xs" variant="light" color="red">
                      {error}
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {station.description}
                </Text>
              </div>
            </Group>

            <Group gap="xs" wrap="nowrap">
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                Vol
              </Text>
              <Slider
                value={content.volume * 100}
                onChange={handleVolumeChange}
                min={0}
                max={100}
                step={1}
                size="xs"
                style={{ flex: 1 }}
                styles={{
                  track: { backgroundColor: 'var(--wb-border)' },
                  bar: { backgroundColor: 'var(--wb-accent)' },
                  thumb: { borderColor: 'var(--wb-accent)' },
                }}
                aria-label="Volume"
              />
            </Group>
          </>
        )}

        {!station && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size="sm" c="dimmed" ta="center">
              Select a SomaFM station to start listening
            </Text>
          </div>
        )}
      </div>

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
})

export default SomaRadioWidget
