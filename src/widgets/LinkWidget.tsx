import { memo, useState, useCallback } from 'react'
import { Text, TextInput, Button, Stack, Anchor, Image } from '@mantine/core'
import { IconLink } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

export const LinkWidget = memo(function LinkWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const url = widget.content.type === 'link' ? widget.content.url || '' : ''
  const title = widget.content.type === 'link' ? widget.content.title || '' : ''

  const handleSave = useCallback(
    (newUrl: string, newTitle: string) => {
      if (!isValidUrl(newUrl)) {
        setError('Please enter a valid URL')
        return
      }
      const autoTitle = newTitle || getDomain(newUrl)
      updateWidget(widget.id, {
        content: { type: 'link', url: newUrl, title: autoTitle },
      })
      setEditing(false)
      setError('')
    },
    [widget.id, updateWidget]
  )

  const faviconUrl = getFaviconUrl(url)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader title="Link" editing={editing} onToggleEdit={() => setEditing(!editing)} icon={<IconLink size={12} />} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        {editing ? (
          <LinkEditor url={url} title={title} onSave={handleSave} error={error} />
        ) : url ? (
          <Anchor
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            underline="never"
            style={{ textAlign: 'center', maxWidth: '100%', transition: 'all 150ms ease' }}
          >
            <Stack align="center" gap={4}>
              {faviconUrl ? (
                <Image
                  src={faviconUrl}
                  alt=""
                  w={24}
                  h={24}
                  fit="contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <Text size="lg" c="gray.4">🔗</Text>
              )}
              <Text size="sm" c="gray.3" truncate="end" style={{ maxWidth: '100%' }}>
                {title || url}
              </Text>
              <Text size="xs" c="dimmed" truncate="end" style={{ maxWidth: '100%' }}>
                {getDomain(url)}
              </Text>
            </Stack>
          </Anchor>
        ) : (
          <Text size="sm" c="dimmed" fs="italic">
            Click Edit to add a URL
          </Text>
        )}
      </div>
    </div>
  )
})

function LinkEditor({
  url,
  title,
  onSave,
  error,
}: {
  url: string
  title: string
  onSave: (url: string, title: string) => void
  error: string
}) {
  const [u, setU] = useState(url)
  const [t, setT] = useState(title)

  return (
    <Stack gap="xs" w="100%">
      <TextInput
        value={u}
        onChange={(e) => setU(e.currentTarget.value)}
        placeholder="https://..."
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter' && u.trim()) onSave(u, t) }}
        error={error || undefined}
      />
      <TextInput
        value={t}
        onChange={(e) => setT(e.currentTarget.value)}
        placeholder="Title (auto-detected from domain)"
      />
      <Button
        onClick={() => onSave(u, t)}
        variant="light"
        color="gray"
        fullWidth
        disabled={!u.trim()}
      >
        Save
      </Button>
    </Stack>
  )
}

export default LinkWidget
