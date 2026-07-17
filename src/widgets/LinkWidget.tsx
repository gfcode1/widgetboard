import { memo, useState, useCallback } from 'react'
import { Text, TextInput, Stack, Group, ActionIcon, Tooltip, Anchor, Image } from '@mantine/core'
import {
  IconLink,
  IconPlus,
  IconTrash,
  IconEdit,
  IconCheck,
  IconExternalLink,
  IconGripVertical,
} from '@tabler/icons-react'
import { v4 as uuidv4 } from 'uuid'
import type { Widget, LinkItem } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { getFaviconUrl, getDomainLabel } from '../utils/favicon'
import { copyToClipboard } from '../utils/clipboard'

interface Props {
  widget: Widget
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

const PRESET_COLORS = [
  '#6d28d9',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#be185d',
]

function getLinkColor(_url: string, index: number): string {
  return PRESET_COLORS[index % PRESET_COLORS.length]!
}

export const LinkWidget = memo(function LinkWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const content =
    widget.content.type === 'link'
      ? widget.content
      : { type: 'link' as const, links: [], activeIndex: 0 }

  const links: LinkItem[] = content.links || []

  const addLink = useCallback(() => {
    if (!newUrl.trim()) return
    const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`
    if (!isValidUrl(url)) return
    const newLinks = [
      ...links,
      {
        id: uuidv4(),
        url,
        title: newTitle.trim() || getDomainLabel(url),
      },
    ]
    updateWidget(widget.id, {
      content: { ...content, links: newLinks, activeIndex: newLinks.length - 1 },
    })
    setNewUrl('')
    setNewTitle('')
  }, [widget.id, newUrl, newTitle, links, content, updateWidget])

  const removeLink = useCallback(
    (id: string) => {
      const newLinks = links.filter((l) => l.id !== id)
      const newActive = Math.min(content.activeIndex, newLinks.length - 1)
      updateWidget(widget.id, {
        content: { ...content, links: newLinks, activeIndex: Math.max(0, newActive) },
      })
    },
    [widget.id, links, content, updateWidget]
  )

  const saveEdit = useCallback(() => {
    if (!editId || !editUrl.trim()) return
    const url = editUrl.startsWith('http') ? editUrl : `https://${editUrl}`
    if (!isValidUrl(url)) return
    const newLinks = links.map((l) =>
      l.id === editId ? { ...l, url, title: editTitle.trim() || getDomainLabel(url) } : l
    )
    updateWidget(widget.id, { content: { ...content, links: newLinks } })
    setEditId(null)
  }, [widget.id, editId, editUrl, editTitle, links, content, updateWidget])

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('text/plain', String(idx))
    setDragIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    const fromIdx = Number(e.dataTransfer.getData('text/plain'))
    if (isNaN(fromIdx) || fromIdx === toIdx) return
    const newLinks = [...links]
    const [moved] = newLinks.splice(fromIdx, 1)
    if (moved) newLinks.splice(toIdx, 0, moved)
    updateWidget(widget.id, { content: { ...content, links: newLinks } })
    setDragIdx(null)
    setDragOverIdx(null)
  }

  const handleDragEnd = () => {
    setDragIdx(null)
    setDragOverIdx(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title={`Links (${links.length})`}
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconLink size={12} />}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            {links.map((link, i) => (
              <div
                key={link.id}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--wb-radius-sm)',
                  background:
                    dragOverIdx === i && dragIdx !== i
                      ? 'rgba(139, 92, 246, 0.15)'
                      : dragIdx === i
                        ? 'rgba(139, 92, 246, 0.08)'
                        : 'var(--wb-surface-hover)',
                  borderLeft: `3px solid ${getLinkColor(link.url, i)}`,
                  opacity: dragIdx === i ? 0.5 : 1,
                  transition: 'all 150ms ease',
                }}
              >
                {editId === link.id ? (
                  <Stack gap="xs">
                    <TextInput
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.currentTarget.value)}
                      placeholder="URL"
                      size="xs"
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      onMouseDown={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <TextInput
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.currentTarget.value)}
                      placeholder="Title"
                      size="xs"
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    <Group gap="xs">
                      <ActionIcon size="xs" variant="light" color="violet" onClick={saveEdit}>
                        <IconCheck size={12} />
                      </ActionIcon>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="gray"
                        onClick={() => setEditId(null)}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                ) : (
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                      <IconGripVertical size={12} style={{ opacity: 0.3, flexShrink: 0 }} />
                      {getFaviconUrl(link.url, 16) && (
                        <Image
                          src={getFaviconUrl(link.url, 16)}
                          alt=""
                          w={14}
                          h={14}
                          fit="contain"
                          style={{ flexShrink: 0 }}
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text size="xs" fw={500} c="gray.3" truncate>
                          {link.title}
                        </Text>
                        <Text size="xs" c="dimmed" truncate style={{ fontSize: 10 }}>
                          {link.url}
                        </Text>
                      </div>
                    </Group>
                    <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
                      <Tooltip label="Open in new tab">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="gray"
                          component="a"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconExternalLink size={11} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Copy URL">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="gray"
                          onClick={() => copyToClipboard(link.url)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <IconLink size={11} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="gray"
                          onClick={() => {
                            setEditId(link.id)
                            setEditUrl(link.url)
                            setEditTitle(link.title)
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <IconEdit size={11} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => removeLink(link.id)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <IconTrash size={11} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                )}
              </div>
            ))}
            <Group gap="xs">
              <TextInput
                value={newUrl}
                onChange={(e) => setNewUrl(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addLink()
                }}
                placeholder="URL..."
                size="xs"
                flex={1}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <TextInput
                value={newTitle}
                onChange={(e) => setNewTitle(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addLink()
                }}
                placeholder="Title"
                size="xs"
                w={100}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <ActionIcon
                variant="light"
                color="violet"
                size="sm"
                onClick={addLink}
                disabled={!newUrl.trim()}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Add link"
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
          </Stack>
        ) : links.length === 0 ? (
          <Stack align="center" justify="center" h="100%" gap={8}>
            <IconLink size={24} style={{ opacity: 0.3 }} />
            <Text size="xs" c="dimmed" fs="italic">
              Click Edit to add links
            </Text>
          </Stack>
        ) : (
          <Stack gap={4}>
            {links.map((link, i) => (
              <div
                key={link.id}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--wb-radius-sm)',
                  background:
                    i === content.activeIndex
                      ? 'var(--wb-accent-subtle)'
                      : 'var(--wb-surface-hover)',
                  borderLeft: `3px solid ${getLinkColor(link.url, i)}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onClick={() => updateWidget(widget.id, { content: { ...content, activeIndex: i } })}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                    {getFaviconUrl(link.url, 16) && (
                      <Image
                        src={getFaviconUrl(link.url, 16)}
                        alt=""
                        w={14}
                        h={14}
                        fit="contain"
                        style={{ flexShrink: 0 }}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" fw={500} c="gray.3" truncate>
                        {link.title}
                      </Text>
                      <Text size="xs" c="dimmed" truncate style={{ fontSize: 10 }}>
                        {link.url}
                      </Text>
                    </div>
                  </Group>
                  <Anchor
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Open ${link.title}`}
                  >
                    <IconExternalLink size={12} style={{ opacity: 0.4 }} />
                  </Anchor>
                </Group>
              </div>
            ))}
          </Stack>
        )}
      </div>
    </div>
  )
})

export default LinkWidget
