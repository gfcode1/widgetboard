import { memo, useState, useMemo, useCallback } from 'react'
import { Text, TextInput, Stack, Group, ActionIcon, Badge, Select } from '@mantine/core'
import { IconSearch, IconPlus, IconTrash } from '@tabler/icons-react'
import { useShallow } from 'zustand/react/shallow'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

const DEFAULT_ENGINES = [
  { name: 'Google', url: 'https://www.google.com/search?q={query}' },
  { name: 'Bing', url: 'https://www.bing.com/search?q={query}' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}' },
  { name: 'GitHub', url: 'https://github.com/search?q={query}' },
  { name: 'YouTube', url: 'https://www.youtube.com/results?search_query={query}' },
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/w/index.php?search={query}' },
]

export const SearchWidget = memo(function SearchWidget({ widget }: Props) {
  const widgets = useStore(useShallow((s): Widget[] => Object.values(s.boards).flat()))
  const updateWidget = useStore((s) => s.updateWidget)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const content = widget.content.type === 'search'
    ? widget.content
    : { type: 'search' as const, engines: DEFAULT_ENGINES, activeEngine: 0, recentSearches: [] }

  const engines = content.engines?.length > 0 ? content.engines : DEFAULT_ENGINES
  const activeEngine = engines[content.activeEngine ?? 0] || engines[0]

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return widgets.filter((w) => {
      if (w.type.toLowerCase().includes(q)) return true
      if ('text' in w.content && typeof w.content.text === 'string' && w.content.text.toLowerCase().includes(q)) return true
      if ('title' in w.content && typeof w.content.title === 'string' && w.content.title.toLowerCase().includes(q)) return true
      if ('city' in w.content && typeof w.content.city === 'string' && w.content.city.toLowerCase().includes(q)) return true
      if ('url' in w.content && typeof w.content.url === 'string' && w.content.url.toLowerCase().includes(q)) return true
      return false
    })
  }, [query, widgets])

  const handleSearch = useCallback(() => {
    if (!query.trim() || !activeEngine) return
    const url = activeEngine.url.replace('{query}', encodeURIComponent(query))
    window.open(url, '_blank')
    // Save to recent
    const recent = [query, ...(content.recentSearches ?? []).filter((r) => r !== query)].slice(0, 10)
    updateWidget(widget.id, { content: { ...content, recentSearches: recent } })
  }, [query, activeEngine, content, widget.id, updateWidget])

  const addEngine = useCallback(() => {
    if (!newName || !newUrl || !newUrl.includes('{query}')) return
    updateWidget(widget.id, {
      content: { ...content, engines: [...content.engines, { name: newName, url: newUrl }] },
    })
    setNewName('')
    setNewUrl('')
  }, [widget.id, content, newName, newUrl, updateWidget])

  const removeEngine = useCallback((idx: number) => {
    const newEngines = content.engines.filter((_, i) => i !== idx)
    const newActive = idx < content.activeEngine
      ? content.activeEngine - 1
      : Math.min(content.activeEngine, newEngines.length - 1)
    updateWidget(widget.id, {
      content: { ...content, engines: newEngines, activeEngine: Math.max(0, newActive) },
    })
  }, [widget.id, content, updateWidget])

  const getWidgetPreview = (widget: { type: string; content: unknown }): string => {
    const c = widget.content as Record<string, unknown>
    if (typeof c?.text === 'string') return c.text.slice(0, 50) || '(empty)'
    if (typeof c?.title === 'string') return c.title || '(untitled)'
    if (typeof c?.city === 'string') return c.city || '(no city)'
    if (typeof c?.url === 'string') return c.url.slice(0, 50) || '(no url)'
    return widget.type
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader title="Search" editing={editing} onToggleEdit={() => setEditing(!editing)} icon={<IconSearch size={12} />} />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            <Text size="xs" fw={600} c="gray.3">Search Engines</Text>
            {engines.map((e, i) => (
              <Group key={i} gap="xs" justify="space-between">
                <Badge size="xs" variant={i === content.activeEngine ? 'filled' : 'light'} color={i === content.activeEngine ? 'violet' : 'gray'}>
                  {e.name}
                </Badge>
                <ActionIcon size="xs" variant="subtle" color="red" onClick={() => removeEngine(i)} onMouseDown={(e) => e.stopPropagation()}>
                  <IconTrash size={10} />
                </ActionIcon>
              </Group>
            ))}
            <Text size="xs" fw={600} c="gray.3" mt="xs">Add Custom Engine</Text>
            <TextInput placeholder="Name" value={newName} onChange={(e) => setNewName(e.currentTarget.value)} onMouseDown={(e) => e.stopPropagation()} size="xs" />
            <TextInput placeholder="URL with {query}" value={newUrl} onChange={(e) => setNewUrl(e.currentTarget.value)} onMouseDown={(e) => e.stopPropagation()} size="xs" />
            <ActionIcon variant="light" color="violet" size="sm" onClick={addEngine} onMouseDown={(e) => e.stopPropagation()}>
              <IconPlus size={14} />
            </ActionIcon>
          </Stack>
        ) : (
          <>
            <Group gap="xs" mb={6}>
              <Select
                data={engines.map((e) => ({ value: String(engines.indexOf(e)), label: e.name }))}
                value={String(content.activeEngine)}
                onChange={(v) => v !== null && updateWidget(widget.id, { content: { ...content, activeEngine: parseInt(v) } })}
                size="xs"
                w={110}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder={`Search ${activeEngine?.name || ''}...`}
                leftSection={<IconSearch size={14} />}
                variant="unstyled"
                size="sm"
                flex={1}
                style={{ pointerEvents: 'auto' }}
              />
            </Group>

            {content.recentSearches.length > 0 && !query && (
              <Stack gap={2} mb={6}>
                <Text size="xs" c="dimmed">Recent</Text>
                {content.recentSearches.slice(0, 5).map((r, i) => (
                  <Group key={i} gap="xs" px="xs" py={2} style={{ borderRadius: 'var(--mantine-radius-sm)', background: 'var(--wb-surface-hover)', cursor: 'pointer', transition: 'all 150ms ease' }} onClick={() => setQuery(r)} onMouseDown={(e) => e.stopPropagation()}>
                    <Text size="xs" c="gray.3" style={{ pointerEvents: 'auto' }}>{r}</Text>
                  </Group>
                ))}
              </Stack>
            )}

            <Stack
              gap={2}
              style={{ flex: 1, overflow: 'auto' }}
            >
              {query.trim() && results.length === 0 && (
                <Text size="xs" c="dimmed" ta="center" mt="md">No results found</Text>
              )}
              {results.map((w) => (
                <Group key={w.id} gap="xs" px="xs" py={4} style={{ borderRadius: 'var(--mantine-radius-sm)', backgroundColor: 'var(--wb-accent-subtle)' }}>
                  <Text size="xs" c="violet" fw={500} tt="capitalize">{w.type}</Text>
                  <Text size="xs" c="gray.3" truncate="end" style={{ flex: 1 }}>{getWidgetPreview(w)}</Text>
                </Group>
              ))}
            </Stack>
          </>
        )}
      </div>
    </div>
  )
})

export default SearchWidget
