import { useMemo, useState, useCallback } from 'react'
import { Drawer, Group, Text, Chip, TextInput, ActionIcon } from '@mantine/core'
import { IconSearch, IconStar, IconStarFilled, IconClock } from '@tabler/icons-react'
import type { WidgetType } from '../types'
import {
  WIDGET_REGISTRY,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
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

interface MobileWidgetSheetProps {
  opened: boolean
  onClose: () => void
  onSelect: (type: WidgetType) => void
}

export function MobileWidgetSheet({ opened, onClose, onSelect }: MobileWidgetSheetProps) {
  const [filter, setFilter] = useState('')
  const [selectedCat, setSelectedCat] = useState<WidgetCategory | 'all'>('all')
  const [recent, setRecent] = useState<string[]>(() => loadFromStorage(RECENT_KEY))
  const [favorites, setFavorites] = useState<string[]>(() => loadFromStorage(FAVORITES_KEY))

  const toggleFavorite = useCallback((type: string) => {
    setFavorites((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      saveToStorage(FAVORITES_KEY, next)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    const q = filter.trim()
    if (!q) {
      if (selectedCat === 'all') return WIDGET_REGISTRY
      return WIDGET_REGISTRY.filter((w) => w.category === selectedCat)
    }
    return WIDGET_REGISTRY.filter((w) => fuzzyMatch(w.label, q) || fuzzyMatch(w.description, q))
  }, [filter, selectedCat])

  const recentWidgets = useMemo(() => {
    if (filter.trim()) return []
    return recent
      .map((t) => WIDGET_REGISTRY.find((w) => w.type === t))
      .filter(Boolean) as typeof WIDGET_REGISTRY
  }, [recent, filter])

  const favoritedWidgets = useMemo(() => {
    return favorites
      .map((t) => WIDGET_REGISTRY.find((w) => w.type === t))
      .filter(Boolean) as typeof WIDGET_REGISTRY
  }, [favorites])

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

  const showPinned = favoritedWidgets.length > 0 && !filter.trim() && selectedCat === 'all'
  const showRecent = recentWidgets.length > 0 && !filter.trim() && selectedCat === 'all'

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      withCloseButton={false}
      radius="md"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      styles={{
        content: {
          backgroundColor: 'var(--wb-surface)',
          maxHeight: '85vh',
          overflow: 'hidden',
        },
        body: {
          overflowY: 'auto',
          maxHeight: 'calc(85vh - 50px)',
          padding: '0 12px 12px',
        },
        header: {
          backgroundColor: 'var(--wb-surface)',
          padding: 0,
        },
      }}
    >
      <div
        style={{
          width: 36,
          height: 5,
          borderRadius: 3,
          backgroundColor: 'var(--wb-border-solid)',
          margin: '8px auto 0',
        }}
        aria-hidden
      />

      <div style={{ padding: '10px 0 6px' }}>
        <TextInput
          placeholder="Search widgets..."
          size="sm"
          leftSection={<IconSearch size={14} />}
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
          variant="filled"
          radius="md"
          styles={{
            input: {
              backgroundColor: 'var(--wb-surface-hover)',
              borderColor: 'var(--wb-border)',
              color: 'var(--wb-text)',
              fontSize: 14,
            },
          }}
        />
      </div>

      {!filter.trim() && (
        <div style={{ padding: '0 0 8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <Chip.Group
            value={selectedCat}
            onChange={(v) => setSelectedCat((v || 'all') as WidgetCategory | 'all')}
          >
            <Group gap={6}>
              <Chip value="all" size="xs" radius="sm">
                All
              </Chip>
              {CATEGORY_ORDER.map((cat) => (
                <Chip key={cat} value={cat} size="xs" radius="sm">
                  {CATEGORY_LABELS[cat]}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </div>
      )}

      {showPinned && (
        <div style={{ marginBottom: 10 }}>
          <Group gap={4} mb={6}>
            <IconStarFilled size={12} color="var(--mantine-color-yellow-5)" />
            <Text size="xs" c="dimmed" fw={600}>
              Pinned
            </Text>
          </Group>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {favoritedWidgets.map((w) => (
              <MobileWidgetItem
                key={w.type}
                item={w}
                isFavorite
                onToggleFavorite={() => toggleFavorite(w.type)}
                onSelect={() => handleSelect(w.type)}
              />
            ))}
          </div>
        </div>
      )}

      {showRecent && (
        <div style={{ marginBottom: 10 }}>
          <Group gap={4} mb={6}>
            <IconClock size={12} color="var(--wb-text-dimmed)" />
            <Text size="xs" c="dimmed" fw={600}>
              Recent
            </Text>
          </Group>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {recentWidgets.map((w) => (
              <MobileWidgetItem
                key={w.type}
                item={w}
                isFavorite={favorites.includes(w.type)}
                onToggleFavorite={() => toggleFavorite(w.type)}
                onSelect={() => handleSelect(w.type)}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No widgets found
        </Text>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {filtered.map((w) => (
            <MobileWidgetItem
              key={w.type}
              item={w}
              isFavorite={favorites.includes(w.type)}
              onToggleFavorite={() => toggleFavorite(w.type)}
              onSelect={() => handleSelect(w.type)}
            />
          ))}
        </div>
      )}
    </Drawer>
  )
}

function MobileWidgetItem({
  item,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: {
  item: (typeof WIDGET_REGISTRY)[number]
  isFavorite: boolean
  onToggleFavorite: () => void
  onSelect: () => void
}) {
  const FavoriteIcon = isFavorite ? IconStarFilled : IconStar

  return (
    <div
      onClick={onSelect}
      style={{
        borderRadius: 'var(--wb-radius)',
        padding: '12px 10px',
        backgroundColor: 'var(--wb-surface-hover)',
        border: '1px solid var(--wb-border)',
        cursor: 'pointer',
        transition: 'background-color 150ms ease, transform 120ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Group gap="xs" align="flex-start" wrap="nowrap">
        <div style={{ color: 'var(--wb-accent)', flexShrink: 0 }}>{item.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} c="gray.2">
            {item.label}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {item.description}
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
          style={{ flexShrink: 0, opacity: isFavorite ? 1 : 0.3 }}
        >
          <FavoriteIcon
            size={14}
            color={isFavorite ? 'var(--mantine-color-yellow-5)' : 'var(--wb-text-dimmed)'}
          />
        </ActionIcon>
      </Group>
    </div>
  )
}
