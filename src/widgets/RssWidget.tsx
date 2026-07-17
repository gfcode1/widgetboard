import { memo, useState, useCallback, useMemo, useEffect } from 'react'
import {
  Text,
  Stack,
  Group,
  ActionIcon,
  TextInput,
  Loader,
  Badge,
  Tooltip,
  Select,
} from '@mantine/core'
import {
  IconRss,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconClock,
} from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { formatRelativeTimeLong } from '../utils/date'
import { getFaviconUrl } from '../utils/favicon'

interface Props {
  widget: Widget
}

interface RssItem {
  title: string
  link: string
  pubDate: string
  feedUrl: string
  description?: string
  read?: boolean
}

interface RssFeed {
  url: string
  title?: string
  lastFetched: number
}

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => url,
]

async function fetchWithProxy(url: string): Promise<string> {
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy(url)
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const text = await res.text()
        if (text.includes('<rss') || text.includes('<feed')) return text
      }
    } catch {
      continue
    }
  }
  throw new Error('All fetch methods failed')
}

function parseRssFeed(xmlText: string, feedUrl: string): { title: string; items: RssItem[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid XML')

  const feedTitle =
    doc.querySelector('channel > title, feed > title')?.textContent ||
    new URL(feedUrl).hostname.replace('www.', '')

  const items: RssItem[] = []
  const rssItems = doc.querySelectorAll('item')
  const atomItems = doc.querySelectorAll('entry')
  const targetItems = rssItems.length > 0 ? rssItems : atomItems

  targetItems.forEach((item) => {
    const title = item.querySelector('title')?.textContent || 'Untitled'
    const link =
      item.querySelector('link')?.textContent ||
      item.querySelector('link')?.getAttribute('href') ||
      feedUrl
    const pubDate =
      item.querySelector('pubDate, published, updated, dc\\:date')?.textContent ||
      new Date().toISOString()
    const description =
      item.querySelector('description, summary, content\\:encoded')?.textContent || ''
    items.push({
      title: title.trim(),
      link: link.trim(),
      pubDate,
      feedUrl,
      description: description.replace(/<[^>]*>/g, '').slice(0, 200),
      read: false,
    })
  })
  return { title: feedTitle, items }
}

const CACHE_KEY = 'wb_rss_read'

function loadReadItems(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveReadItems(readItems: Record<string, boolean>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(readItems))
  } catch {
    /* ignore */
  }
}

const REFRESH_OPTIONS = [
  { value: '0', label: 'Manual' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
]

export const RssWidget = memo(function RssWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [feedUrlInput, setFeedUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [readItems, setReadItems] = useState<Record<string, boolean>>(loadReadItems)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState('0')

  const content =
    widget.content.type === 'rss' ? widget.content : { type: 'rss' as const, feeds: [], items: [] }

  const feeds: RssFeed[] = useMemo(() => content.feeds || [], [content.feeds])
  const items: (RssItem & { read: boolean })[] = useMemo(
    () => (content.items || []).map((item) => ({ ...item, read: readItems[item.link] || false })),
    [content.items, readItems]
  )

  const fetchAllFeeds = useCallback(async () => {
    if (feeds.length === 0) return
    setLoading(true)
    setError('')
    const allItems: RssItem[] = []
    let failedCount = 0
    try {
      const updatedFeeds = [...feeds]
      for (let i = 0; i < updatedFeeds.length; i++) {
        const feed = updatedFeeds[i]
        if (!feed) continue
        try {
          const xmlText = await fetchWithProxy(feed.url)
          const parsed = parseRssFeed(xmlText, feed.url)
          updatedFeeds[i] = { ...feed, title: parsed.title, lastFetched: Date.now() }
          for (const item of parsed.items.slice(0, 15)) allItems.push(item)
        } catch {
          failedCount++
        }
      }
      if (failedCount === feeds.length && feeds.length > 0) setError('Failed to load feeds')
      allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      updateWidget(widget.id, {
        content: { type: 'rss', items: allItems.slice(0, 100), feeds: updatedFeeds },
      })
    } finally {
      setLoading(false)
    }
  }, [widget.id, feeds, updateWidget])

  useEffect(() => {
    const minutes = parseInt(autoRefresh)
    if (!minutes) return
    const interval = setInterval(fetchAllFeeds, minutes * 60 * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchAllFeeds])

  const addFeed = useCallback(async () => {
    if (!feedUrlInput) return
    const url = feedUrlInput.startsWith('http') ? feedUrlInput : `https://${feedUrlInput}`
    if (feeds.some((f) => f.url === url)) {
      setError('Feed already added')
      return
    }
    setLoading(true)
    setError('')
    try {
      const xmlText = await fetchWithProxy(url)
      const parsed = parseRssFeed(xmlText, url)
      const newFeed: RssFeed = { url, title: parsed.title, lastFetched: Date.now() }
      updateWidget(widget.id, {
        content: {
          type: 'rss',
          feeds: [...feeds, newFeed],
          items: [...items.slice(0, 50), ...parsed.items.slice(0, 15)],
        },
      })
      setFeedUrlInput('')
    } catch {
      const newFeed: RssFeed = { url, lastFetched: 0 }
      updateWidget(widget.id, { content: { type: 'rss', feeds: [...feeds, newFeed], items } })
      setFeedUrlInput('')
      setError('Feed added but could not be parsed')
    } finally {
      setLoading(false)
    }
  }, [widget.id, feedUrlInput, feeds, items, updateWidget])

  const removeFeed = useCallback(
    (url: string) => {
      updateWidget(widget.id, {
        content: {
          type: 'rss',
          feeds: feeds.filter((f) => f.url !== url),
          items: items.filter((i) => i.feedUrl !== url),
        },
      })
    },
    [widget.id, feeds, items, updateWidget]
  )

  const toggleRead = useCallback((link: string) => {
    setReadItems((prev) => {
      const newRead = { ...prev, [link]: !prev[link] }
      saveReadItems(newRead)
      return newRead
    })
  }, [])

  const markAllRead = useCallback(() => {
    const newRead: Record<string, boolean> = {}
    items.forEach((item) => {
      newRead[item.link] = true
    })
    setReadItems(newRead)
    saveReadItems(newRead)
  }, [items])

  const filteredItems = showUnreadOnly ? items.filter((item) => !item.read) : items
  const unreadCount = items.filter((item) => !item.read).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="RSS"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconRss size={12} />}
        rightSlot={
          !editing ? (
            <Group gap={2}>
              {unreadCount > 0 && (
                <Badge size="xs" variant="filled" color="violet" style={{ fontSize: 9 }}>
                  {unreadCount}
                </Badge>
              )}
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                onClick={fetchAllFeeds}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Refresh feeds"
              >
                <IconRefresh size={12} />
              </ActionIcon>
            </Group>
          ) : undefined
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            {feeds.map((f) => (
              <Group key={f.url} gap="xs" justify="space-between">
                <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                  <img
                    src={getFaviconUrl(f.url)}
                    alt=""
                    width={12}
                    height={12}
                    style={{ borderRadius: 2 }}
                  />
                  <Text size="xs" c="gray.3" truncate style={{ flex: 1 }}>
                    {f.title || f.url}
                  </Text>
                </Group>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={() => removeFeed(f.url)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <IconTrash size={10} />
                </ActionIcon>
              </Group>
            ))}
            <Select
              data={REFRESH_OPTIONS}
              value={autoRefresh}
              onChange={(v) => v !== null && setAutoRefresh(v)}
              label="Auto-refresh"
              size="xs"
              leftSection={<IconClock size={12} />}
            />
            <Group gap="xs">
              <TextInput
                placeholder="Feed URL"
                value={feedUrlInput}
                onChange={(e) => setFeedUrlInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addFeed()
                }}
                onMouseDown={(e) => e.stopPropagation()}
                size="xs"
                style={{ flex: 1 }}
                disabled={loading}
              />
              <ActionIcon
                variant="light"
                color="violet"
                size="sm"
                onClick={addFeed}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={loading || !feedUrlInput.trim()}
              >
                {loading ? <Loader size={12} /> : <IconPlus size={14} />}
              </ActionIcon>
            </Group>
            {error && (
              <Text size="xs" c="red.4">
                {error}
              </Text>
            )}
          </Stack>
        ) : (
          <>
            <Group gap="xs" mb={6}>
              <Tooltip label={showUnreadOnly ? 'Show all' : 'Show unread only'}>
                <ActionIcon
                  variant="subtle"
                  color={showUnreadOnly ? 'violet' : 'gray'}
                  size="xs"
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {showUnreadOnly ? <IconEyeOff size={12} /> : <IconEye size={12} />}
                </ActionIcon>
              </Tooltip>
              {unreadCount > 0 && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={markAllRead}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Mark all as read"
                >
                  <IconEye size={12} />
                </ActionIcon>
              )}
            </Group>
            {loading && <Loader size="xs" my="md" />}
            {error && !loading && (
              <Group gap="xs" my="md">
                <Text size="xs" c="red.4">
                  {error}
                </Text>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={fetchAllFeeds}>
                  <IconRefresh size={14} />
                </ActionIcon>
              </Group>
            )}
            <Stack gap={2}>
              {filteredItems.length === 0 && !loading ? (
                <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
                  {showUnreadOnly ? 'No unread items' : 'No feeds configured'}
                </Text>
              ) : (
                filteredItems.slice(0, 30).map((item, i) => {
                  const feedTitle = feeds.find((f) => f.url === item.feedUrl)?.title
                  const isExpanded = expandedId === item.link
                  return (
                    <div key={`${item.feedUrl}-${i}`}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (e.metaKey || e.ctrlKey) return
                          e.preventDefault()
                          setExpandedId(isExpanded ? null : item.link)
                          if (!item.read) toggleRead(item.link)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="rss-item"
                        style={{
                          display: 'block',
                          padding: 6,
                          borderRadius: 'var(--wb-radius-sm)',
                          background: item.read ? 'transparent' : 'var(--wb-surface-hover)',
                          textDecoration: 'none',
                          pointerEvents: 'auto',
                          transition: 'all 150ms ease',
                          opacity: item.read ? 0.6 : 1,
                        }}
                      >
                        <Group justify="space-between" gap="xs">
                          <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                            {!item.read && (
                              <div
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  background: 'var(--wb-accent)',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Text size="xs" c="gray.2" lineClamp={1} style={{ flex: 1 }}>
                              {item.title}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                            {formatRelativeTimeLong(item.pubDate)}
                          </Text>
                        </Group>
                        {feedTitle && (
                          <Text size="xs" c="dimmed" style={{ fontSize: 9, marginTop: 2 }}>
                            {feedTitle}
                          </Text>
                        )}
                      </a>
                      {isExpanded && item.description && (
                        <div
                          style={{
                            padding: '6px 8px',
                            margin: '0 0 4px',
                            borderRadius: 'var(--wb-radius-sm)',
                            background: 'var(--wb-surface-solid)',
                            border: '1px solid var(--wb-border)',
                          }}
                        >
                          <Text size="xs" c="gray.3" style={{ lineHeight: 1.5 }}>
                            {item.description || 'No description'}
                          </Text>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </Stack>
          </>
        )}
      </div>
      <style>{`a.rss-item:hover { background: var(--wb-surface-active) !important; opacity: 1 !important; }`}</style>
    </div>
  )
})

export default RssWidget
