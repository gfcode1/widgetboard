import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Text, Stack, Group, ActionIcon, Textarea, TextInput } from '@mantine/core'
import { IconClipboard, IconPin, IconPinFilled, IconSearch, IconCopy, IconCheck } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  widget: Widget
}

export const ClipboardWidget = memo(function ClipboardWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
  }, [])

  const content = widget.content.type === 'clipboard'
    ? widget.content
    : { type: 'clipboard' as const, entries: [] }

  const addEntry = useCallback(() => {
    if (!inputText.trim()) return
    const entry = { id: uuidv4(), text: inputText.trim(), timestamp: Date.now(), pinned: false }
    updateWidget(widget.id, {
      content: { ...content, entries: [entry, ...content.entries].slice(0, 50) },
    })
    setInputText('')
  }, [widget.id, content, inputText, updateWidget])

  const togglePin = useCallback((id: string) => {
    updateWidget(widget.id, {
      content: {
        ...content,
        entries: content.entries.map((e) => e.id === id ? { ...e, pinned: !e.pinned } : e),
      },
    })
  }, [widget.id, content, updateWidget])

  const copyEntry = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopiedId(null), 1500)
    }).catch(() => {})
  }, [])

  const sortedEntries = [...content.entries]
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.timestamp - a.timestamp
    })
    .filter((e) => !searchQuery || e.text.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(d)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader title="Clipboard" editing={editing} onToggleEdit={() => setEditing(!editing)} icon={<IconClipboard size={12} />} />
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
            <ActionIcon variant="light" color="violet" size="sm" onClick={addEntry} disabled={!inputText.trim()} onMouseDown={(e) => e.stopPropagation()}>
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
              mb={6}
              leftSection={<IconSearch size={12} />}
            />
            <Stack gap={4}>
              {sortedEntries.length === 0 ? (
                <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
                  {searchQuery ? 'No matching entries' : 'No entries yet'}
                </Text>
              ) : (
                sortedEntries.map((entry) => (
                  <Group
                    key={entry.id}
                    gap="xs"
                    p={6}
                    style={{
                      borderRadius: 'var(--wb-radius-sm)',
                      background: entry.pinned ? 'var(--wb-accent-subtle)' : 'var(--wb-surface-hover)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" c="gray.2" lineClamp={2} style={{ wordBreak: 'break-word' }}>
                        {entry.text}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>
                        {formatTime(entry.timestamp)}
                      </Text>
                    </div>
                    <Group gap={2}>
                      <ActionIcon size="xs" variant="subtle" color={entry.pinned ? 'violet' : 'gray'} onClick={() => togglePin(entry.id)} onMouseDown={(e) => e.stopPropagation()} aria-label={entry.pinned ? 'Unpin' : 'Pin'}>
                        {entry.pinned ? <IconPinFilled size={10} /> : <IconPin size={10} />}
                      </ActionIcon>
                      <ActionIcon size="xs" variant="subtle" color={copiedId === entry.id ? 'green' : 'gray'} onClick={() => copyEntry(entry.text, entry.id)} onMouseDown={(e) => e.stopPropagation()} aria-label="Copy to clipboard">
                        {copiedId === entry.id ? <IconCheck size={10} /> : <IconCopy size={10} />}
                      </ActionIcon>
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
