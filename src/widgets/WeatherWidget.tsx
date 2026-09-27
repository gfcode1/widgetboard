import { memo, useState, useEffect, useCallback, useRef } from 'react'
import {
  Text,
  Stack,
  Group,
  Loader,
  TextInput,
  Button,
  ActionIcon,
  Badge,
  Tooltip,
} from '@mantine/core'
import { IconCloud, IconPlus, IconX, IconRefresh } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

const CACHE_KEY_PREFIX = 'wb_weather_'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const LRU_ORDER_KEY = 'wb_weather_lru_order'
const MAX_CACHE_ENTRIES = 20

interface WeatherCache {
  data: WeatherData
  timestamp: number
}

function getLruOrder(): number[] {
  try {
    const raw = localStorage.getItem(LRU_ORDER_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setLruOrder(order: number[]): void {
  try {
    localStorage.setItem(LRU_ORDER_KEY, JSON.stringify(order))
  } catch {
    /* ignore quota errors */
  }
}

function touchLru(index: number): void {
  const order = getLruOrder().filter((i) => i !== index)
  order.unshift(index)
  setLruOrder(order)
}

function evictLruIfNeeded(): void {
  const order = getLruOrder()
  if (order.length > MAX_CACHE_ENTRIES) {
    const evicted = order.slice(MAX_CACHE_ENTRIES)
    evicted.forEach((i) => localStorage.removeItem(`${CACHE_KEY_PREFIX}${i}`))
    setLruOrder(order.slice(0, MAX_CACHE_ENTRIES))
  }
}

function cleanupStaleEntries(): void {
  try {
    const now = Date.now()
    const order = getLruOrder()
    const valid = order.filter((i) => {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${i}`)
      if (!cached) return false
      try {
        const parsed: WeatherCache = JSON.parse(cached)
        if (now - parsed.timestamp > CACHE_TTL) {
          localStorage.removeItem(`${CACHE_KEY_PREFIX}${i}`)
          return false
        }
        return true
      } catch {
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${i}`)
        return false
      }
    })
    if (valid.length !== order.length) setLruOrder(valid)
  } catch {
    /* ignore */
  }
}

function getCachedWeather(index: number): WeatherData | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${index}`)
    if (!cached) return null
    const parsed: WeatherCache = JSON.parse(cached)
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${index}`)
      setLruOrder(getLruOrder().filter((i) => i !== index))
      return null
    }
    touchLru(index)
    return parsed.data
  } catch {
    return null
  }
}

function setCachedWeather(index: number, data: WeatherData): void {
  try {
    const cache: WeatherCache = { data, timestamp: Date.now() }
    localStorage.setItem(`${CACHE_KEY_PREFIX}${index}`, JSON.stringify(cache))
    touchLru(index)
    evictLruIfNeeded()
  } catch {
    /* ignore quota errors */
  }
}

function clearWeatherCache(index?: number): void {
  try {
    if (index !== undefined) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${index}`)
      setLruOrder(getLruOrder().filter((i) => i !== index))
    } else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(CACHE_KEY_PREFIX))
        .forEach((k) => localStorage.removeItem(k))
      localStorage.removeItem(LRU_ORDER_KEY)
    }
  } catch {
    /* ignore */
  }
}

async function fetchWithRetry(url: string, retries = 2, delay = 1000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      if (i === retries) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      if (i === retries) throw err
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)))
    }
  }
  throw new Error('Fetch failed')
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
  windDirection: number
  humidity: number
  feelsLike: number
  uvIndex: number
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

  const migratedRef = useRef(false)

  useEffect(() => {
    if (migratedRef.current) return
    const c = widget.content
    if (c.type === 'weather' && 'lat' in c && !('locations' in c)) {
      const old = c as { lat: number; lon: number; city: string }
      updateWidget(widget.id, {
        content: {
          type: 'weather',
          locations:
            old.lat || old.lon ? [{ city: old.city || 'Unknown', lat: old.lat, lon: old.lon }] : [],
          activeIndex: 0,
        },
      })
      migratedRef.current = true
    }
  }, [widget.id, widget.content, updateWidget])

  const content =
    widget.content.type === 'weather' && 'locations' in widget.content
      ? widget.content
      : { type: 'weather' as const, locations: [], activeIndex: 0 }

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [weatherCache, setWeatherCache] = useState<Record<number, WeatherData>>({})
  const [cityInput, setCityInput] = useState('')
  const [useFahrenheit, setUseFahrenheit] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const activeLocation = content.locations[content.activeIndex]
  const weather = weatherCache[content.activeIndex] || null

  const tempC = weather?.temperature ?? 0
  const feelsLikeC = weather?.feelsLike ?? 0
  const toF = (c: number) => Math.round((c * 9) / 5 + 32)
  const temperature = useFahrenheit ? toF(tempC) : tempC
  const feelsLike = useFahrenheit ? toF(feelsLikeC) : feelsLikeC
  const tempUnit = useFahrenheit ? '\u00b0F' : '\u00b0C'

  const fetchWeather = useCallback(
    async (lat: number, lon: number, city: string, index: number) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError('')

      // Check cache first
      const cached = getCachedWeather(index)
      if (cached && cached.city === city) {
        setWeatherCache((prev) => ({ ...prev, [index]: cached }))
        setLoading(false)
        return
      }

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,apparent_temperature,uv_index&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`
        const res = await fetchWithRetry(url, 2, 1500)
        const data = await res.json()
        const daily = data.daily.time.map((_: string, i: number) => ({
          day: getDayName(data.daily.time[i]),
          max: Math.round(data.daily.temperature_2m_max[i]),
          min: Math.round(data.daily.temperature_2m_min[i]),
          code: data.daily.weather_code[i],
        }))
        const weatherData: WeatherData = {
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          windSpeed: Math.round(data.current.wind_speed_10m),
          windDirection: data.current.wind_direction_10m,
          humidity: Math.round(data.current.relative_humidity_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          uvIndex: Math.round(data.current.uv_index),
          city,
          daily,
        }
        setWeatherCache((prev) => ({ ...prev, [index]: weatherData }))
        setCachedWeather(index, weatherData)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Try stale cache as fallback
        const stale = getCachedWeather(index)
        if (stale) {
          setWeatherCache((prev) => ({ ...prev, [index]: stale }))
          setError('Using cached data')
        } else {
          setError('Unable to load weather')
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    cleanupStaleEntries()
  }, [])

  useEffect(() => {
    if (activeLocation) {
      fetchWeather(activeLocation.lat, activeLocation.lon, activeLocation.city, content.activeIndex)
    }
    return () => {
      abortRef.current?.abort()
    }
  }, [content.activeIndex, activeLocation, fetchWeather])

  const addCity = async () => {
    if (!cityInput.trim()) return
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1`
      )
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
    const newActive =
      idx < content.activeIndex
        ? content.activeIndex - 1
        : Math.min(content.activeIndex, newLocations.length - 1)
    // Invalidate cache since indices shift
    clearWeatherCache()
    setWeatherCache({})
    updateWidget(widget.id, {
      content: { ...content, locations: newLocations, activeIndex: Math.max(0, newActive) },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Weather"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconCloud size={12} />}
        rightSlot={
          !editing && activeLocation ? (
            <Group gap={2}>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                onClick={() => setUseFahrenheit(!useFahrenheit)}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label={useFahrenheit ? 'Switch to Celsius' : 'Switch to Fahrenheit'}
              >
                <Text size="xs" style={{ fontSize: 10, lineHeight: 1 }}>
                  {useFahrenheit ? 'F' : 'C'}
                </Text>
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                onClick={() => {
                  clearWeatherCache(content.activeIndex)
                  setWeatherCache({})
                  fetchWeather(
                    activeLocation.lat,
                    activeLocation.lon,
                    activeLocation.city,
                    content.activeIndex
                  )
                }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Refresh weather"
              >
                <IconRefresh size={12} />
              </ActionIcon>
            </Group>
          ) : undefined
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
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
                onMouseEnter={(e) => {
                  if (i !== content.activeIndex)
                    e.currentTarget.style.background = 'var(--wb-accent-subtle)'
                }}
                onMouseLeave={(e) => {
                  if (i !== content.activeIndex) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Badge
                  size="xs"
                  variant={i === content.activeIndex ? 'filled' : 'light'}
                  color={i === content.activeIndex ? 'violet' : 'gray'}
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    updateWidget(widget.id, { content: { ...content, activeIndex: i } })
                  }
                >
                  {loc.city}
                </Badge>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={() => removeCity(i)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <IconX size={10} />
                </ActionIcon>
              </Group>
            ))}
            <Group gap="xs">
              <TextInput
                value={cityInput}
                onChange={(e) => setCityInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCity()
                }}
                placeholder="Add city..."
                flex={1}
                size="xs"
                onMouseDown={(e) => e.stopPropagation()}
              />
              <Button
                variant="light"
                color="violet"
                size="xs"
                onClick={addCity}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <IconPlus size={14} />
              </Button>
            </Group>
            {error && (
              <Group gap="xs">
                <Text size="xs" c="red.4">
                  {error}
                </Text>
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={() => {
                    setError('')
                    if (activeLocation) {
                      fetchWeather(
                        activeLocation.lat,
                        activeLocation.lon,
                        activeLocation.city,
                        content.activeIndex
                      )
                    }
                  }}
                >
                  Retry
                </Button>
              </Group>
            )}
          </Stack>
        ) : loading ? (
          <Group justify="center" h="100%">
            <Loader size="sm" />
          </Group>
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
                    onClick={() =>
                      updateWidget(widget.id, { content: { ...content, activeIndex: i } })
                    }
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
                {getWeatherEmoji(weather.weatherCode)} {temperature}
                {tempUnit}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" style={{ letterSpacing: '0.05em', opacity: 0.7 }}>
              📍 {weather.city}
            </Text>
            <Group gap="md">
              <Tooltip label={`Feels like ${feelsLike}${tempUnit}`}>
                <span
                  style={{
                    background: 'var(--wb-accent-subtle)',
                    borderRadius: 'var(--wb-radius-sm)',
                    padding: '2px 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <Text size="xs" c="dimmed" style={{ margin: 0 }}>
                    🌡️ {feelsLike}
                    {tempUnit}
                  </Text>
                </span>
              </Tooltip>
              <Tooltip label={`Wind direction: ${weather.windDirection}°`}>
                <span
                  style={{
                    background: 'var(--wb-accent-subtle)',
                    borderRadius: 'var(--wb-radius-sm)',
                    padding: '2px 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <Text size="xs" c="dimmed" style={{ margin: 0 }}>
                    💨 {weather.windSpeed} km/h
                  </Text>
                </span>
              </Tooltip>
              <span
                style={{
                  background: 'var(--wb-accent-subtle)',
                  borderRadius: 'var(--wb-radius-sm)',
                  padding: '2px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <Text size="xs" c="dimmed" style={{ margin: 0 }}>
                  💧 {weather.humidity}%
                </Text>
              </span>
              {weather.uvIndex !== undefined && (
                <Tooltip label={`UV Index: ${weather.uvIndex}`}>
                  <span
                    style={{
                      background:
                        weather.uvIndex > 5 ? 'rgba(239, 68, 68, 0.15)' : 'var(--wb-accent-subtle)',
                      borderRadius: 'var(--wb-radius-sm)',
                      padding: '2px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      size="xs"
                      c={weather.uvIndex > 5 ? 'red.4' : 'dimmed'}
                      style={{ margin: 0 }}
                    >
                      ☀️ {weather.uvIndex}
                    </Text>
                  </span>
                </Tooltip>
              )}
            </Group>
            <Group
              gap="xs"
              mt="auto"
              style={{ borderTop: '1px solid var(--wb-border)', paddingTop: 8 }}
            >
              {weather.daily.map((d) => {
                const dMax = useFahrenheit ? toF(d.max) : d.max
                const dMin = useFahrenheit ? toF(d.min) : d.min
                return (
                  <Stack key={d.day} align="center" gap={2}>
                    <Text
                      size="xs"
                      c="dimmed"
                      style={{
                        textTransform: 'uppercase',
                        fontSize: '0.65rem',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {d.day}
                    </Text>
                    <Text size="sm" c="gray.3">
                      {getWeatherEmoji(d.code)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {dMax}
                      {tempUnit[0]}/{dMin}
                      {tempUnit[0]}
                    </Text>
                  </Stack>
                )
              })}
            </Group>
          </Stack>
        ) : (
          <Group justify="center" h="100%">
            <Text size="sm" c="dimmed" fs="italic">
              Click edit to set location
            </Text>
          </Group>
        )}
      </div>
    </div>
  )
})

export default WeatherWidget
