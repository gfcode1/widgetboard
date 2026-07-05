import { memo, useState, useCallback } from 'react'
import { Text, TextInput, Button, Stack, Loader } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')

    if (host === 'youtube.com' || host === 'youtu.be') {
      let videoId = ''
      if (host === 'youtu.be') {
        videoId = u.pathname.slice(1)
      } else {
        videoId = u.searchParams.get('v') || ''
      }
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }

    if (host === 'open.spotify.com') {
      return url.replace('open.spotify.com', 'open.spotify.com/embed')
    }

    if (host === 'codepen.io') {
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts.length >= 3) {
        return `https://codepen.io/${parts[0]}/embed/${parts[2]}?default-tab=result`
      }
    }

    return url
  } catch {
    return null
  }
}

export const EmbedWidget = memo(function EmbedWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content = widget.content.type === 'embed' ? widget.content : { type: 'embed' as const, url: '' }
  const [editing, setEditing] = useState(false)
  const [urlInput, setUrlInput] = useState(content.url)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const handleSave = useCallback(() => {
    const embedUrl = getEmbedUrl(urlInput)
    if (!embedUrl) {
      setError('Invalid URL')
      return
    }
    updateWidget(widget.id, { content: { type: 'embed', url: embedUrl } })
    setEditing(false)
    setError('')
  }, [widget.id, urlInput, updateWidget])

  const handleReload = useCallback(() => {
    setIframeKey((k) => k + 1)
    setLoading(true)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Embed"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        rightSlot={!editing && content.url ? (
          <button
            onClick={handleReload}
            aria-label="Reload embed"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: 'var(--wb-text-dimmed)', display: 'flex', alignItems: 'center',
            }}
          >
            <IconRefresh size={12} />
          </button>
        ) : undefined}
      />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, position: 'relative' }}>
        {editing ? (
          <Stack gap="xs" w="100%" p="xs">
            <TextInput
              value={urlInput}
              onChange={(e) => { setUrlInput(e.currentTarget.value); setError('') }}
              placeholder="https://youtube.com/watch?v=..."
              autoFocus
              size="xs"
            />
            {error && <Text size="xs" c="red.4">{error}</Text>}
            <Button onClick={handleSave} variant="light" color="gray" fullWidth size="xs">
              Load
            </Button>
          </Stack>
        ) : content.url ? (
          <>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <Loader size="sm" color="violet" />
              </div>
            )}
            <iframe
              key={iframeKey}
              src={content.url}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 'var(--wb-radius)',
                opacity: loading ? 0 : 1,
                transition: 'opacity 0.2s ease',
              }}
              sandbox="allow-scripts allow-popups allow-presentation"
              allow="autoplay; encrypted-media; fullscreen"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
              title="Embedded content"
            />
          </>
        ) : (
          <Text size="sm" c="dimmed" fs="italic">
            Click Edit to embed content
          </Text>
        )}
      </div>
    </div>
  )
})

export default EmbedWidget
