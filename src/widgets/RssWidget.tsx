import { memo, useState, useCallback } from 'react'
import { Text, Stack, Group, ActionIcon, TextInput, Loader } from '@mantine/core'
import { IconRss, IconPlus, IconTrash, IconRefresh } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

interface RssItem {
  title: string
  link: string
  pubDate: string
  feedUrl: string
}

export const RssWidget = memo(function RssWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [feedUrlInput, setFeedUrlInput] = useState('')
  const [loading, setLoading] = useState(false)

  const content = widget.content.type === 'rss'
    ? widget.content
    : { type: 'rss' as const, feeds: [], items: [] }

  const fetchFeeds = useCallback(async () => {
    if (content.feeds.length === 0) return
    setLoading(true)
    const allItems: RssItem[] = []
    try {
      for (const feed of content.feeds) {
        try {
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`)
          if (!res.ok) continue
          const data = await res.json()
          if (data.status === 'ok' && data.items) {
            for (const item of data.items.slice(0, 10)) {
              allItems.push({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                feedUrl: feed.url,
              })
            }
          }
        } catch { /* skip failed feeds */ }
      }
      allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      updateWidget(widget.id, {
        content: {
          type: 'rss',
          items: allItems.slice(0, 50),
          feeds: content.feeds.map((f) => ({ ...f, lastFetched: Date.now() })),
        },
      })
    } finally {
      setLoading(false)
    }
  }, [widget.id, content, updateWidget])

  const addFeed = useCallback(() => {
    if (!feedUrlInput) return
    const url = feedUrlInput.startsWith('http') ? feedUrlInput : `https://${feedUrlInput}`
    if (content.feeds.some((f) => f.url === url)) return
    updateWidget(widget.id, {
      content: { ...content, feeds: [...content.feeds, { url, lastFetched: 0 }] },
    })
    setFeedUrlInput('')
  }, [widget.id, content, feedUrlInput, updateWidget])

  const removeFeed = useCallback((url: string) => {
    updateWidget(widget.id, {
      content: {
        type: 'rss',
        feeds: content.feeds.filter((f) => f.url !== url),
        items: content.items.filter((i) => i.feedUrl !== url),
      },
    })
  }, [widget.id, content, updateWidget])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffH = Math.floor(diffMs / 3600000)
    if (diffH < 1) return `${Math.floor(diffMs / 60000)}m ago`
    if (diffH < 24) return `${diffH}h ago`
    return `${Math.floor(diffH / 24)}d ago`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="RSS"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconRss size={12} />}
        rightSlot={
          <ActionIcon variant="subtle" color="gray" size="xs" onClick={fetchFeeds} onMouseDown={(e) => e.stopPropagation()}>
            <IconRefresh size={12} />
          </ActionIcon>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            {content.feeds.map((f) => (
              <Group key={f.url} gap="xs" justify="space-between">
                <Text size="xs" c="gray.3" truncate style={{ flex: 1 }}>{f.url}</Text>
                <ActionIcon size="xs" variant="subtle" color="red" onClick={() => removeFeed(f.url)} onMouseDown={(e) => e.stopPropagation()}>
                  <IconTrash size={10} />
                </ActionIcon>
              </Group>
            ))}
            <Group gap="xs">
              <TextInput
                placeholder="Feed URL"
                value={feedUrlInput}
                onChange={(e) => setFeedUrlInput(e.currentTarget.value)}
                onMouseDown={(e) => e.stopPropagation()}
                size="xs"
                style={{ flex: 1 }}
              />
              <ActionIcon variant="light" color="violet" size="sm" onClick={addFeed} onMouseDown={(e) => e.stopPropagation()}>
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
          </Stack>
        ) : (
          <>
            {loading && <Loader size="xs" my="md" />}
            <Stack gap={3}>
              {content.items.length === 0 && !loading ? (
                <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
                  No feeds configured
                </Text>
              ) : (
                content.items.slice(0, 15).map((item, i) => (
                  <a
                    key={`${item.feedUrl}-${i}`}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rss-item"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      display: 'block',
                      padding: 6,
                      borderRadius: 'var(--wb-radius-sm)',
                      background: 'var(--wb-surface-hover)',
                      textDecoration: 'none',
                      pointerEvents: 'auto',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <Group justify="space-between" gap="xs">
                      <Text size="xs" c="gray.2" lineClamp={1} style={{ flex: 1 }}>{item.title}</Text>
                      <Text size="xs" c="dimmed" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{formatDate(item.pubDate)}</Text>
                    </Group>
                  </a>
                ))
              )}
            </Stack>
          </>
        )}
      </div>
      <style>{`
        a.rss-item:hover { background: var(--wb-surface-active) !important; }
      `}</style>
    </div>
  )
})

export default RssWidget
