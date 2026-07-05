import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { Text, Stack, Group, Loader, TextInput, Button, ActionIcon, Badge } from '@mantine/core'
import { IconCloud, IconPlus, IconX } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

const WMO_CODES: Record<number, { desc: string; emoji: string }> = {
  0: { desc: 'Clear sky', emoji: '☀️' },
  1: { desc: 'Mainly clear', emoji: '🌤️' },
  2: { desc: 'Partly cloudy', emoji: '⛅' },
  3: { desc: 'Overcast', emoji: '☁️' },
  45: { desc: 'Fog', emoji: '🌫️' },
  48: { desc: 'Rime fog', emoji: '🌫️' },
  51: { desc: 'Light drizzle', emoji: '🌦️' },
  53: { desc: 'Moderate drizzle', emoji: '🌦️' },
  55: { desc: 'Dense drizzle', emoji: '🌧️' },
  61: { desc: 'Slight rain', emoji: '🌦️' },
  63: { desc: 'Moderate rain', emoji: '🌧️' },
  65: { desc: 'Heavy rain', emoji: '🌧️' },
  71: { desc: 'Slight snow', emoji: '🌨️' },
  73: { desc: 'Moderate snow', emoji: '🌨️' },
  75: { desc: 'Heavy snow', emoji: '❄️' },
  80: { desc: 'Slight showers', emoji: '🌦️' },
  81: { desc: 'Moderate showers', emoji: '🌧️' },
  82: { desc: 'Violent showers', emoji: '🌧️' },
  95: { desc: 'Thunderstorm', emoji: '⛈️' },
  96: { desc: 'Thunderstorm w/ hail', emoji: '⛈️' },
  99: { desc: 'Thunderstorm w/ heavy hail', emoji: '⛈️' },
}

interface WeatherData {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
  city: string
  daily: Array<{ day: string; max: number; min: number; code: number }>
}

function getWeatherEmoji(code: number): string {
  return WMO_CODES[code]?.emoji ?? '🌡️'
}

function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
}

export const WeatherWidget = memo(function WeatherWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)

  // Backward compatibility: migrate old {lat, lon, city} to new {locations, activeIndex}
  const rawContent = widget.content.type === 'weather' ? widget.content : { type: 'weather' as const, locations: [], activeIndex: 0 }
  const content = (() => {
    if ('lat' in rawContent && 'locations' in rawContent === false) {
      const old = rawContent as { type: 'weather'; lat: number; lon: number; city: string }
      const migrated = { type: 'weather' as const, locations: old.lat || old.lon ? [{ city: old.city || 'Unknown', lat: old.lat, lon: old.lon }] : [], activeIndex: 0 }
      updateWidget(widget.id, { content: migrated })
      return migrated
    }
    return rawContent
  })()

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [weatherCache, setWeatherCache] = useState<Record<number, WeatherData>>({})
  const [cityInput, setCityInput] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const activeLocation = content.locations[content.activeIndex]
  const weather = weatherCache[content.activeIndex] || null

  const fetchWeather = useCallback(async (lat: number, lon: number, city: string, index: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`,
        { signal: controller.signal }
      )
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const daily = data.daily.time.map((_: string, i: number) => ({
        day: getDayName(data.daily.time[i]),
        max: Math.round(data.daily.temperature_2m_max[i]),
        min: Math.round(data.daily.temperature_2m_min[i]),
        code: data.daily.weather_code[i],
      }))
      setWeatherCache((prev) => ({
        ...prev,
        [index]: {
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          windSpeed: Math.round(data.current.wind_speed_10m),
          humidity: Math.round(data.current.relative_humidity_2m),
          city,
          daily,
        },
      }))
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Unable to load weather')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeLocation) {
      fetchWeather(activeLocation.lat, activeLocation.lon, activeLocation.city, content.activeIndex)
    }
    return () => { abortRef.current?.abort() }
  }, [content.activeIndex, activeLocation])

  const addCity = async () => {
    if (!cityInput.trim()) return
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1`)
      const data = await res.json()
      if (data.results?.length) {
        const { latitude: lat, longitude: lon, name } = data.results[0]
        const newLocations = [...content.locations, { city: name, lat, lon }]
        updateWidget(widget.id, {
          content: { ...content, locations: newLocations, activeIndex: newLocations.length - 1 },
        })
        fetchWeather(lat, lon, name, newLocations.length - 1)
        setCityInput('')
      } else {
        setError('City not found')
      }
    } catch {
      setError('Geocoding failed')
    }
  }

  const removeCity = (idx: number) => {
    const newLocations = content.locations.filter((_, i) => i !== idx)
    const newActive = idx < content.activeIndex
      ? content.activeIndex - 1
      : Math.min(content.activeIndex, newLocations.length - 1)
    // Invalidate cache since indices shift
    setWeatherCache({})
    updateWidget(widget.id, { content: { ...content, locations: newLocations, activeIndex: Math.max(0, newActive) } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader title="Weather" editing={editing} onToggleEdit={() => setEditing(!editing)} icon={<IconCloud size={12} />} />
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {editing ? (
          <Stack gap="xs">
            {content.locations.map((loc, i) => (
              <Group
                key={i}
                gap="xs"
                justify="space-between"
                style={{
                  padding: '4px 6px',
                  borderRadius: 'var(--wb-radius-sm)',
                  cursor: 'pointer',
                  background: i === content.activeIndex ? 'var(--wb-accent-subtle)' : 'transparent',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => { if (i !== content.activeIndex) e.currentTarget.style.background = 'var(--wb-accent-subtle)' }}
                onMouseLeave={(e) => { if (i !== content.activeIndex) e.currentTarget.style.background = 'transparent' }}
              >
                <Badge
                  size="xs"
                  variant={i === content.activeIndex ? 'filled' : 'light'}
                  color={i === content.activeIndex ? 'violet' : 'gray'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => updateWidget(widget.id, { content: { ...content, activeIndex: i } })}
                >
                  {loc.city}
                </Badge>
                <ActionIcon size="xs" variant="subtle" color="red" onClick={() => removeCity(i)} onMouseDown={(e) => e.stopPropagation()}>
                  <IconX size={10} />
                </ActionIcon>
              </Group>
            ))}
            <Group gap="xs">
              <TextInput
                value={cityInput}
                onChange={(e) => setCityInput(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCity() }}
                placeholder="Add city..."
                flex={1}
                size="xs"
                onMouseDown={(e) => e.stopPropagation()}
              />
              <Button variant="light" color="violet" size="xs" onClick={addCity} onMouseDown={(e) => e.stopPropagation()}>
                <IconPlus size={14} />
              </Button>
            </Group>
            {error && <Text size="xs" c="red.4">{error}</Text>}
          </Stack>
        ) : loading ? (
          <Group justify="center" h="100%"><Loader size="sm" /></Group>
        ) : weather ? (
          <Stack gap={6} h="100%">
            {content.locations.length > 1 && (
              <Group gap={4}>
                {content.locations.map((loc, i) => (
                  <Badge
                    key={i}
                    size="xs"
                    variant={i === content.activeIndex ? 'filled' : 'subtle'}
                    color={i === content.activeIndex ? 'violet' : 'gray'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => updateWidget(widget.id, { content: { ...content, activeIndex: i } })}
                  >
                    {loc.city}
                  </Badge>
                ))}
              </Group>
            )}
            <Group gap="sm">
              <Text
                fz="2.5rem"
                fw={300}
                c="gray.1"
                style={{
                  lineHeight: 1,
                  background: 'linear-gradient(135deg, #e4e4e7 30%, var(--wb-accent) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {getWeatherEmoji(weather.weatherCode)} {weather.temperature}°C
              </Text>
            </Group>
            <Text size="xs" c="dimmed" style={{ letterSpacing: '0.05em', opacity: 0.7 }}>📍 {weather.city}</Text>
            <Group gap="md">
              <span style={{ background: 'var(--wb-accent-subtle)', borderRadius: 'var(--wb-radius-sm)', padding: '2px 8px', display: 'inline-flex', alignItems: 'center' }}>
                <Text size="xs" c="dimmed" style={{ margin: 0 }}>Wind: {weather.windSpeed} km/h</Text>
              </span>
              <span style={{ background: 'var(--wb-accent-subtle)', borderRadius: 'var(--wb-radius-sm)', padding: '2px 8px', display: 'inline-flex', alignItems: 'center' }}>
                <Text size="xs" c="dimmed" style={{ margin: 0 }}>Humidity: {weather.humidity}%</Text>
              </span>
            </Group>
            <Group gap="xs" mt="auto" style={{ borderTop: '1px solid var(--wb-border)', paddingTop: 8 }}>
              {weather.daily.map((d) => (
                <Stack key={d.day} align="center" gap={2}>
                  <Text size="xs" c="dimmed" style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.04em' }}>{d.day}</Text>
                  <Text size="sm" c="gray.3">{getWeatherEmoji(d.code)}</Text>
                  <Text size="xs" c="dimmed">{d.max}°/{d.min}°</Text>
                </Stack>
              ))}
            </Group>
          </Stack>
        ) : (
          <Group justify="center" h="100%">
            <Text size="sm" c="dimmed" fs="italic">Click edit to set location</Text>
          </Group>
        )}
      </div>
    </div>
  )
})

export default WeatherWidget
