import { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Text, Stack, Group, ActionIcon, Textarea, TextInput, Badge, Tooltip } from '@mantine/core'
import {
  IconClipboard,
  IconPin,
  IconPinFilled,
  IconSearch,
  IconCopy,
  IconCheck,
  IconTrash,
} from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  widget: Widget
}

interface ClipboardEntry {
  id: string
  text: string
  timestamp: number
  pinned: boolean
  category?: string
}

const CATEGORIES = ['general', 'code', 'link', 'text', 'other']

export const ClipboardWidget = memo(function ClipboardWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    },
    []
  )

  const content =
    widget.content.type === 'clipboard'
      ? widget.content
      : { type: 'clipboard' as const, entries: [] }
  const contentRef = useRef(content)
  contentRef.current = content

  const entries: ClipboardEntry[] = useMemo(() => content.entries || [], [content.entries])

  const addEntry = useCallback(() => {
    if (!inputText.trim()) return
    const c = contentRef.current
    // Auto-detect category
    let category = 'text'
    if (inputText.startsWith('http://') || inputText.startsWith('https://')) {
      category = 'link'
    } else if (
      inputText.includes('{') ||
      inputText.includes('function') ||
      inputText.includes('const ') ||
      inputText.includes('import ')
    ) {
      category = 'code'
    }

    const entry: ClipboardEntry = {
      id: uuidv4(),
      text: inputText.trim(),
      timestamp: Date.now(),
      pinned: false,
      category,
    }
    updateWidget(widget.id, {
      content: { ...c, entries: [entry, ...(c.entries || [])].slice(0, 100) },
    })
    setInputText('')
  }, [widget.id, inputText, updateWidget])

  const togglePin = useCallback(
    (id: string) => {
      const c = contentRef.current
      updateWidget(widget.id, {
        content: {
          ...c,
          entries: (c.entries || []).map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e)),
        },
      })
    },
    [widget.id, updateWidget]
  )

  const removeEntry = useCallback(
    (id: string) => {
      const c = contentRef.current
      updateWidget(widget.id, {
        content: {
          ...c,
          entries: (c.entries || []).filter((e) => e.id !== id),
        },
      })
    },
    [widget.id, updateWidget]
  )

  const copyEntry = useCallback((text: string, id: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedId(id)
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = setTimeout(() => setCopiedId(null), 1500)
      })
      .catch(() => {})
  }, [])

  const stats = useMemo(() => {
    const pinned = entries.filter((e) => e.pinned).length
    const categories = new Set(entries.map((e) => e.category || 'text')).size
    return { total: entries.length, pinned, categories }
  }, [entries])

  const sortedEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return b.timestamp - a.timestamp
      })
      .filter((e) => {
        const matchesSearch =
          !searchQuery || e.text.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || e.category === selectedCategory
        return matchesSearch && matchesCategory
      })
  }, [entries, searchQuery, selectedCategory])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title={`Clipboard (${stats.total})`}
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconClipboard size={12} />}
        rightSlot={
          !editing && stats.pinned > 0 ? (
            <Badge size="xs" variant="light" color="violet" style={{ fontSize: 9 }}>
              {stats.pinned} pinned
            </Badge>
          ) : undefined
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Paste or type text..."
              autosize
              minRows={2}
              size="xs"
            />
            <ActionIcon
              variant="light"
              color="violet"
              size="sm"
              onClick={addEntry}
              disabled={!inputText.trim()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <IconClipboard size={14} />
            </ActionIcon>
          </Stack>
        ) : (
          <>
            <TextInput
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
              mb={4}
              leftSection={<IconSearch size={12} />}
            />

            <Group gap={4} mb={4} wrap="nowrap" style={{ overflow: 'auto' }}>
              <Badge
                size="xs"
                variant={!selectedCategory ? 'filled' : 'light'}
                color={!selectedCategory ? 'violet' : 'gray'}
                style={{ cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setSelectedCategory(null)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                All
              </Badge>
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  size="xs"
                  variant={selectedCategory === cat ? 'filled' : 'light'}
                  color={selectedCategory === cat ? 'violet' : 'gray'}
                  style={{ cursor: 'pointer', textTransform: 'capitalize', flexShrink: 0 }}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {cat}
                </Badge>
              ))}
            </Group>

            <Stack gap={3}>
              {sortedEntries.length === 0 ? (
                <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
                  {searchQuery || selectedCategory ? 'No matching entries' : 'No entries yet'}
                </Text>
              ) : (
                sortedEntries.map((entry) => (
                  <Group
                    key={entry.id}
                    gap="xs"
                    p={6}
                    style={{
                      borderRadius: 'var(--wb-radius-sm)',
                      background: entry.pinned
                        ? 'var(--wb-accent-subtle)'
                        : 'var(--wb-surface-hover)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" c="gray.2" lineClamp={2} style={{ wordBreak: 'break-word' }}>
                        {entry.text}
                      </Text>
                      <Group gap={4} mt={2}>
                        <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>
                          {formatTime(entry.timestamp)}
                        </Text>
                        {entry.category && (
                          <Badge size="xs" variant="dot" color="gray" style={{ fontSize: 9 }}>
                            {entry.category}
                          </Badge>
                        )}
                      </Group>
                    </div>
                    <Group gap={2}>
                      <Tooltip label={entry.pinned ? 'Unpin' : 'Pin'}>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color={entry.pinned ? 'violet' : 'gray'}
                          onClick={() => togglePin(entry.id)}
                          onMouseDown={(e) => e.stopPropagation()}
                          aria-label={entry.pinned ? 'Unpin' : 'Pin'}
                        >
                          {entry.pinned ? <IconPinFilled size={10} /> : <IconPin size={10} />}
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Copy">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color={copiedId === entry.id ? 'green' : 'gray'}
                          onClick={() => copyEntry(entry.text, entry.id)}
                          onMouseDown={(e) => e.stopPropagation()}
                          aria-label="Copy to clipboard"
                        >
                          {copiedId === entry.id ? <IconCheck size={10} /> : <IconCopy size={10} />}
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => removeEntry(entry.id)}
                          onMouseDown={(e) => e.stopPropagation()}
                          aria-label="Delete entry"
                          style={{ opacity: 0.6 }}
                        >
                          <IconTrash size={10} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                ))
              )}
            </Stack>
          </>
        )}
      </div>
    </div>
  )
})

export default ClipboardWidget
