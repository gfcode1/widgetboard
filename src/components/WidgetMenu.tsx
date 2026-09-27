import { useCallback, useState, useMemo } from 'react'
import { Paper, UnstyledButton, Group, Text, TextInput, Badge, ActionIcon } from '@mantine/core'
import { IconSearch, IconStar, IconStarFilled, IconClock } from '@tabler/icons-react'
import type { WidgetType } from '../types'
import {
  WIDGET_REGISTRY,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type WidgetCategory,
} from '../widgets/registry'

const RECENT_KEY = 'widgetboard-recent'
const FAVORITES_KEY = 'widgetboard-favorites'

function loadFromStorage(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(key: string, items: string[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

interface WidgetMenuProps {
  onSelect: (type: WidgetType) => void
  onClose: () => void
}

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

function highlightMatch(text: string, query: string): { text: string; highlighted: boolean }[] {
  if (!query) return [{ text, highlighted: false }]
  const q = query.toLowerCase()
  const parts: { text: string; highlighted: boolean }[] = []
  let qi = 0
  let current = ''
  for (const ch of text) {
    if (qi < q.length && ch.toLowerCase() === q[qi]) {
      if (current) {
        parts.push({ text: current, highlighted: false })
        current = ''
      }
      parts.push({ text: ch, highlighted: true })
      qi++
    } else {
      current += ch
    }
  }
  if (current) parts.push({ text: current, highlighted: false })
  return parts
}

export function WidgetMenu({ onSelect, onClose }: WidgetMenuProps) {
  const [filter, setFilter] = useState('')
  const [recent, setRecent] = useState<string[]>(() => loadFromStorage(RECENT_KEY))
  const [favorites, setFavorites] = useState<string[]>(() => loadFromStorage(FAVORITES_KEY))
  const [selectedCat, setSelectedCat] = useState<WidgetCategory | 'all'>('all')

  const toggleFavorite = useCallback((type: string) => {
    setFavorites((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      saveToStorage(FAVORITES_KEY, next)
      return next
    })
  }, [])

  const recentWidgets = useMemo(() => {
    if (!filter.trim()) {
      return recent
        .map((t) => WIDGET_REGISTRY.find((w) => w.type === t))
        .filter(Boolean) as typeof WIDGET_REGISTRY
    }
    return []
  }, [recent, filter])

  const favoriteWidgets = useMemo(() => {
    return favorites
      .map((t) => WIDGET_REGISTRY.find((w) => w.type === t))
      .filter(Boolean) as typeof WIDGET_REGISTRY
  }, [favorites])

  const filtered = useMemo(() => {
    const q = filter.trim()
    if (!q) {
      if (selectedCat === 'all') return WIDGET_REGISTRY
      return WIDGET_REGISTRY.filter((w) => w.category === selectedCat)
    }
    return WIDGET_REGISTRY.filter(
      (w) => fuzzyMatch(w.label, q) || fuzzyMatch(w.description, q) || fuzzyMatch(w.type, q)
    )
  }, [filter, selectedCat])

  const handleSelect = useCallback(
    (type: WidgetType) => {
      const updated = [type, ...recent.filter((t) => t !== type)].slice(0, 5)
      setRecent(updated)
      saveToStorage(RECENT_KEY, updated)
      onSelect(type)
      onClose()
    },
    [recent, onSelect, onClose]
  )

  const showPinned = favoriteWidgets.length > 0 && !filter.trim() && selectedCat === 'all'
  const showRecent = recentWidgets.length > 0 && !filter.trim() && selectedCat === 'all'

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={onClose} />
      <Paper
        shadow="xl"
        radius="md"
        withBorder
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          width: 380,
          zIndex: 50,
          backgroundColor: 'var(--wb-surface)',
          borderColor: 'var(--wb-border)',
          overflow: 'hidden',
          boxShadow: 'var(--wb-shadow-lg)',
          animation: 'scale-in 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ padding: '8px 8px 4px' }}>
          <TextInput
            placeholder="Search widgets..."
            size="xs"
            leftSection={<IconSearch size={12} />}
            value={filter}
            onChange={(e) => setFilter(e.currentTarget.value)}
            variant="filled"
            radius="md"
            autoFocus
            styles={{
              input: {
                backgroundColor: 'var(--wb-surface-hover)',
                borderColor: 'var(--wb-border)',
                color: 'var(--wb-text)',
                fontSize: 12,
                height: 30,
              },
            }}
          />
        </div>

        {!filter.trim() && (
          <div style={{ padding: '0 8px 6px' }}>
            <Group gap={4} wrap="nowrap" style={{ overflowX: 'auto', paddingBottom: 2 }}>
              <Badge
                size="sm"
                variant={selectedCat === 'all' ? 'filled' : 'light'}
                color={selectedCat === 'all' ? 'violet' : 'gray'}
                style={{ cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setSelectedCat('all')}
              >
                All
              </Badge>
              {CATEGORY_ORDER.map((cat) => (
                <Badge
                  key={cat}
                  size="sm"
                  variant={selectedCat === cat ? 'filled' : 'light'}
                  color={selectedCat === cat ? CATEGORY_COLORS[cat] : 'gray'}
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => setSelectedCat(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </Badge>
              ))}
            </Group>
          </div>
        )}

        <div
          style={{
            maxHeight: 400,
            overflowY: 'auto',
            padding: '4px 8px 8px',
          }}
        >
          {showPinned && (
            <>
              <Group gap={4} mb={4} px={4}>
                <IconStarFilled size={10} color="var(--mantine-color-yellow-5)" />
                <Text size="xs" c="dimmed" fw={600}>
                  Pinned
                </Text>
              </Group>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}
              >
                {favoriteWidgets.map((w) => (
                  <WidgetCard
                    key={w.type}
                    item={w}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(w.type)}
                    onSelect={() => handleSelect(w.type)}
                    query=""
                  />
                ))}
              </div>
            </>
          )}

          {showRecent && (
            <>
              <Group gap={4} mb={4} px={4}>
                <IconClock size={10} color="var(--wb-text-dimmed)" />
                <Text size="xs" c="dimmed" fw={600}>
                  Recent
                </Text>
              </Group>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}
              >
                {recentWidgets.map((w) => (
                  <WidgetCard
                    key={w.type}
                    item={w}
                    isFavorite={favorites.includes(w.type)}
                    onToggleFavorite={() => toggleFavorite(w.type)}
                    onSelect={() => handleSelect(w.type)}
                    query=""
                  />
                ))}
              </div>
            </>
          )}

          {filtered.length === 0 ? (
            <Text size="xs" c="dimmed" ta="center" py="md">
              No widgets found
            </Text>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {filtered.map((w, i) => (
                <WidgetCard
                  key={w.type}
                  item={w}
                  isFavorite={favorites.includes(w.type)}
                  onToggleFavorite={() => toggleFavorite(w.type)}
                  onSelect={() => handleSelect(w.type)}
                  query={filter.trim()}
                  style={{ animationDelay: `${i * 30}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      </Paper>
    </>
  )
}

function WidgetCard({
  item,
  isFavorite,
  onToggleFavorite,
  onSelect,
  query,
  style,
}: {
  item: (typeof WIDGET_REGISTRY)[number]
  isFavorite: boolean
  onToggleFavorite: () => void
  onSelect: () => void
  query: string
  style?: React.CSSProperties
}) {
  const labelParts = highlightMatch(item.label, query)
  const descParts = highlightMatch(item.description, query)
  const FavoriteIcon = isFavorite ? IconStarFilled : IconStar
  const catColor = CATEGORY_COLORS[item.category] || 'violet'

  return (
    <UnstyledButton
      onClick={onSelect}
      style={{
        borderRadius: 'var(--wb-radius-sm)',
        padding: '8px 10px',
        transition: 'background-color 150ms ease, transform 120ms ease',
        animation: 'fade-in 200ms ease both',
        ...style,
      }}
      styles={{
        root: {
          '&:hover': {
            backgroundColor: 'var(--wb-accent-subtle)',
            transform: 'translateY(-1px)',
          },
        },
      }}
    >
      <Group gap="xs" align="flex-start" wrap="nowrap">
        <div
          style={{
            color: `var(--mantine-color-${catColor}-4)`,
            marginTop: 1,
            flexShrink: 0,
            opacity: 0.9,
          }}
        >
          {item.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" fw={500} c="gray.2">
            {labelParts.map((p, i) =>
              p.highlighted ? (
                <span
                  key={i}
                  style={{
                    backgroundColor: 'var(--wb-accent)',
                    color: 'white',
                    borderRadius: 2,
                    padding: '0 1px',
                  }}
                >
                  {p.text}
                </span>
              ) : (
                <span key={i}>{p.text}</span>
              )
            )}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {descParts.map((p, i) =>
              p.highlighted ? (
                <span
                  key={i}
                  style={{
                    backgroundColor: 'var(--wb-accent-hover)',
                    color: 'var(--wb-accent)',
                    borderRadius: 2,
                    padding: '0 1px',
                  }}
                >
                  {p.text}
                </span>
              ) : (
                <span key={i}>{p.text}</span>
              )
            )}
          </Text>
        </div>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xs"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          aria-label={isFavorite ? 'Unpin widget' : 'Pin widget'}
          style={{ flexShrink: 0, opacity: isFavorite ? 1 : 0.3, transition: 'opacity 150ms ease' }}
          onMouseEnter={(e) => {
            if (!isFavorite) e.currentTarget.style.opacity = '0.7'
          }}
          onMouseLeave={(e) => {
            if (!isFavorite) e.currentTarget.style.opacity = '0.3'
          }}
        >
          <FavoriteIcon
            size={12}
            color={isFavorite ? 'var(--mantine-color-yellow-5)' : 'var(--wb-text-dimmed)'}
          />
        </ActionIcon>
      </Group>
    </UnstyledButton>
  )
}
