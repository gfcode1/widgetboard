import { memo, useState, useCallback } from 'react'
import { Text, TextInput, Button, Stack, Loader, Group, Badge } from '@mantine/core'
import { IconRefresh, IconMaximize } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

const PLATFORMS = [
  { name: 'YouTube', domains: ['youtube.com', 'youtu.be'] },
  { name: 'Spotify', domains: ['open.spotify.com'] },
  { name: 'CodePen', domains: ['codepen.io'] },
  { name: 'Vimeo', domains: ['vimeo.com'] },
  { name: 'Google Maps', domains: ['maps.google.com', 'google.com/maps'] },
  { name: 'Figma', domains: ['figma.com'] },
  { name: 'CodeSandbox', domains: ['codesandbox.io'] },
  { name: 'Twitch', domains: ['twitch.tv'] },
]

function getEmbedUrl(url: string): { url: string; platform: string } | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')
    const fullHost = host + u.pathname

    if (host === 'youtube.com' || host === 'youtu.be') {
      let videoId = ''
      if (host === 'youtu.be') {
        videoId = u.pathname.slice(1)
      } else {
        videoId = u.searchParams.get('v') || ''
      }
      if (videoId) return { url: `https://www.youtube.com/embed/${videoId}`, platform: 'YouTube' }
    }

    if (host === 'open.spotify.com') {
      return { url: url.replace('open.spotify.com', 'open.spotify.com/embed'), platform: 'Spotify' }
    }

    if (host === 'codepen.io') {
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts.length >= 3) {
        return {
          url: `https://codepen.io/${parts[0]}/embed/${parts[2]}?default-tab=result`,
          platform: 'CodePen',
        }
      }
    }

    if (host === 'vimeo.com') {
      const videoId = u.pathname.split('/').filter(Boolean)[0]
      if (videoId && /^\d+$/.test(videoId)) {
        return { url: `https://player.vimeo.com/video/${videoId}`, platform: 'Vimeo' }
      }
    }

    if (host === 'docs.google.com' || fullHost.includes('google.com/maps')) {
      return { url, platform: 'Google Maps' }
    }

    if (host === 'figma.com') {
      return {
        url: `https://www.figma.com/embed?embed_host=widgetboard&url=${encodeURIComponent(url)}`,
        platform: 'Figma',
      }
    }

    if (host === 'codesandbox.io') {
      return {
        url: url.replace('codesandbox.io/s/', 'codesandbox.io/embed/'),
        platform: 'CodeSandbox',
      }
    }

    if (host === 'twitch.tv') {
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts.length >= 1) {
        return { url: `https://player.twitch.tv/?${parts[0]}&parent=localhost`, platform: 'Twitch' }
      }
    }

    const platform = PLATFORMS.find((p) => p.domains.some((d) => fullHost.includes(d)))
    return { url, platform: platform?.name ?? 'Web' }
  } catch {
    return null
  }
}

export const EmbedWidget = memo(function EmbedWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content =
    widget.content.type === 'embed' ? widget.content : { type: 'embed' as const, url: '' }
  const [editing, setEditing] = useState(false)
  const [urlInput, setUrlInput] = useState(content.url)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [platform, setPlatform] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const handleSave = useCallback(() => {
    const result = getEmbedUrl(urlInput)
    if (!result) {
      setError('Invalid URL')
      return
    }
    updateWidget(widget.id, { content: { type: 'embed', url: result.url } })
    setPlatform(result.platform)
    setEditing(false)
    setError('')
  }, [widget.id, urlInput, updateWidget])

  const handleReload = useCallback(() => {
    setIframeKey((k) => k + 1)
    setLoading(true)
  }, [])

  const iframeContent = content.url ? (
    <>
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
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
          borderRadius: fullscreen ? 0 : 'var(--wb-radius)',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
        sandbox="allow-scripts allow-popups allow-presentation allow-same-origin"
        allow="autoplay; encrypted-media; fullscreen; clipboard-write"
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
        title="Embedded content"
      />
    </>
  ) : null

  const platformDisplay =
    platform ||
    (() => {
      try {
        const host = new URL(content.url).hostname.replace('www.', '')
        const found = PLATFORMS.find((p) =>
          p.domains.some((d) => host.includes(d) || content.url.includes(d))
        )
        return found?.name ?? null
      } catch {
        return null
      }
    })()

  if (fullscreen && content.url) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#000',
        }}
      >
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <Button variant="filled" color="dark" size="xs" onClick={() => setFullscreen(false)}>
            Close
          </Button>
        </div>
        {iframeContent}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Embed"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        rightSlot={
          !editing && content.url ? (
            <Group gap={2}>
              {platformDisplay && (
                <Badge size="xs" variant="light" color="gray">
                  {platformDisplay}
                </Badge>
              )}
              <button
                onClick={handleReload}
                aria-label="Reload embed"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  color: 'var(--wb-text-dimmed)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IconRefresh size={12} />
              </button>
              <button
                onClick={() => setFullscreen(true)}
                aria-label="Fullscreen"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  color: 'var(--wb-text-dimmed)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IconMaximize size={12} />
              </button>
            </Group>
          ) : undefined
        }
      />
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          position: 'relative',
        }}
      >
        {editing ? (
          <Stack gap="xs" w="100%" p="xs">
            <TextInput
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.currentTarget.value)
                setError('')
              }}
              placeholder="https://youtube.com/watch?v=..."
              autoFocus
              size="xs"
            />
            {error && (
              <Text size="xs" c="red.4">
                {error}
              </Text>
            )}
            <Button onClick={handleSave} variant="light" color="gray" fullWidth size="xs">
              Load
            </Button>
            <Text size="xs" c="dimmed">
              Supports: {PLATFORMS.map((p) => p.name).join(', ')}
            </Text>
          </Stack>
        ) : content.url ? (
          iframeContent
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
