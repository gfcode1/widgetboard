import { memo, useState, useCallback, useRef } from 'react'
import { Text, Stack, Group, ActionIcon, TextInput, Tabs, Tooltip } from '@mantine/core'
import {
  IconPlus,
  IconTrash,
  IconExternalLink,
  IconBookmark,
  IconEdit,
  IconCheck,
  IconDownload,
  IconUpload,
  IconGripVertical,
} from '@tabler/icons-react'
import { v4 as uuidv4 } from 'uuid'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { getFaviconUrl, getDomainLabel } from '../utils/favicon'

interface Props {
  widget: Widget
}

interface BookmarkItem {
  id: string
  title: string
  url: string
  favicon?: string
  folder?: string
}

export const BookmarkWidget = memo(function BookmarkWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [folderInput, setFolderInput] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>('all')
  const [editId, setEditId] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const content =
    widget.content.type === 'bookmark'
      ? widget.content
      : { type: 'bookmark' as const, bookmarks: [], folders: [] }

  const bookmarks: BookmarkItem[] = content.bookmarks || []
  const folders: string[] = content.folders || []

  const addBookmark = useCallback(() => {
    if (!urlInput) return
    const url = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`
    const title = titleInput || getDomainLabel(url)
    const newBookmark: BookmarkItem = {
      id: uuidv4(),
      title,
      url,
      favicon: getFaviconUrl(url, 32),
      folder: folderInput || undefined,
    }
    const newFolders =
      folderInput && !folders.includes(folderInput) ? [...folders, folderInput] : folders
    updateWidget(widget.id, {
      content: { ...content, bookmarks: [...bookmarks, newBookmark], folders: newFolders },
    })
    setUrlInput('')
    setTitleInput('')
    setFolderInput('')
  }, [widget.id, content, urlInput, titleInput, folderInput, bookmarks, folders, updateWidget])

  const removeBookmark = useCallback(
    (id: string) => {
      updateWidget(widget.id, {
        content: { ...content, bookmarks: bookmarks.filter((b) => b.id !== id) },
      })
    },
    [widget.id, content, bookmarks, updateWidget]
  )

  const saveEdit = useCallback(() => {
    if (!editId || !editUrl.trim()) return
    const url = editUrl.startsWith('http') ? editUrl : `https://${editUrl}`
    updateWidget(widget.id, {
      content: {
        ...content,
        bookmarks: bookmarks.map((b) =>
          b.id === editId ? { ...b, url, title: editTitle || getDomainLabel(url) } : b
        ),
      },
    })
    setEditId(null)
  }, [widget.id, content, editId, editUrl, editTitle, bookmarks, updateWidget])

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
    const newBookmarks = [...bookmarks]
    const [moved] = newBookmarks.splice(fromIdx, 1)
    if (moved) newBookmarks.splice(toIdx, 0, moved)
    updateWidget(widget.id, { content: { ...content, bookmarks: newBookmarks } })
    setDragIdx(null)
    setDragOverIdx(null)
  }

  const exportBookmarks = () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${bookmarks.map((b) => `  <DT><A HREF="${b.url}">${b.title}</A>`).join('\n')}
</DL><p>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bookmarks.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importBookmarks = () => fileRef.current?.click()

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const matches = text.matchAll(/<A HREF="([^"]+)"[^>]*>([^<]+)<\/A>/gi)
      const imported: BookmarkItem[] = []
      for (const match of matches) {
        const url = match[1]!
        const title = match[2]!
        imported.push({ id: uuidv4(), title, url, favicon: getFaviconUrl(url, 32) })
      }
      if (imported.length > 0) {
        updateWidget(widget.id, {
          content: { ...content, bookmarks: [...bookmarks, ...imported] },
        })
      }
    }
    reader.readAsText(file)
  }

  const filteredBookmarks =
    activeTab === 'all' ? bookmarks : bookmarks.filter((b) => b.folder === activeTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title={`Bookmarks (${bookmarks.length})`}
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconBookmark size={12} />}
        rightSlot={
          !editing && bookmarks.length > 0 ? (
            <Group gap={2}>
              <Tooltip label="Export">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={exportBookmarks}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Export bookmarks"
                >
                  <IconDownload size={12} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Import">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={importBookmarks}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Import bookmarks"
                >
                  <IconUpload size={12} />
                </ActionIcon>
              </Tooltip>
            </Group>
          ) : undefined
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept=".html"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            {bookmarks.map((b, i) => (
              <div
                key={b.id}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={() => {
                  setDragIdx(null)
                  setDragOverIdx(null)
                }}
                style={{
                  padding: '4px 6px',
                  borderRadius: 'var(--wb-radius-sm)',
                  background:
                    dragOverIdx === i && dragIdx !== i
                      ? 'rgba(139, 92, 246, 0.15)'
                      : dragIdx === i
                        ? 'rgba(139, 92, 246, 0.08)'
                        : 'var(--wb-surface-hover)',
                  opacity: dragIdx === i ? 0.5 : 1,
                  transition: 'all 150ms ease',
                }}
              >
                {editId === b.id ? (
                  <Group gap="xs" wrap="nowrap">
                    <TextInput
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.currentTarget.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      placeholder="URL"
                      size="xs"
                      style={{ flex: 1 }}
                      autoFocus
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    <TextInput
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.currentTarget.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      placeholder="Title"
                      size="xs"
                      w={80}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    <ActionIcon
                      size="xs"
                      variant="light"
                      color="violet"
                      onClick={saveEdit}
                      aria-label="Save"
                    >
                      <IconCheck size={10} />
                    </ActionIcon>
                  </Group>
                ) : (
                  <Group gap="xs" justify="space-between" wrap="nowrap">
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                      <IconGripVertical size={12} style={{ opacity: 0.3, flexShrink: 0 }} />
                      {b.favicon && (
                        <img
                          src={b.favicon}
                          alt=""
                          width={14}
                          height={14}
                          style={{ borderRadius: 2, flexShrink: 0 }}
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <Text size="xs" c="gray.3" truncate style={{ flex: 1 }}>
                        {b.title}
                      </Text>
                    </Group>
                    <Group gap={2}>
                      <Tooltip label="Open">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="gray"
                          component="a"
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconExternalLink size={10} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="gray"
                          onClick={() => {
                            setEditId(b.id)
                            setEditUrl(b.url)
                            setEditTitle(b.title)
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <IconEdit size={10} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => removeBookmark(b.id)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <IconTrash size={10} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                )}
              </div>
            ))}
            <Group gap="xs">
              <TextInput
                placeholder="URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBookmark()}
                onMouseDown={(e) => e.stopPropagation()}
                size="xs"
                flex={1}
              />
              <TextInput
                placeholder="Title"
                value={titleInput}
                onChange={(e) => setTitleInput(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBookmark()}
                onMouseDown={(e) => e.stopPropagation()}
                size="xs"
                w={90}
              />
              <TextInput
                placeholder="Folder"
                value={folderInput}
                onChange={(e) => setFolderInput(e.currentTarget.value)}
                onMouseDown={(e) => e.stopPropagation()}
                size="xs"
                w={80}
              />
              <ActionIcon
                variant="light"
                color="violet"
                size="sm"
                onClick={addBookmark}
                disabled={!urlInput.trim()}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Add bookmark"
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
          </Stack>
        ) : (
          <>
            {folders.length > 0 && (
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab value="all">All</Tabs.Tab>
                  {folders.map((f) => (
                    <Tabs.Tab key={f} value={f}>
                      {f}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
            )}
            <Stack gap={4} mt={4}>
              {filteredBookmarks.length === 0 ? (
                <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
                  No bookmarks yet
                </Text>
              ) : (
                filteredBookmarks.map((b) => (
                  <Group
                    key={b.id}
                    gap="xs"
                    p={4}
                    className="bookmark-item"
                    style={{
                      borderRadius: 'var(--wb-radius-sm)',
                      background: 'var(--wb-surface-hover)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {b.favicon && (
                      <img
                        src={b.favicon}
                        alt=""
                        width={16}
                        height={16}
                        style={{ borderRadius: 2, flexShrink: 0 }}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    )}
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        color: 'var(--wb-text)',
                        textDecoration: 'none',
                        fontSize: 'var(--mantine-font-size-xs)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'auto',
                        transition: 'color 150ms ease',
                        minWidth: 0,
                      }}
                    >
                      {b.title}
                    </a>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      component="a"
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Open ${b.title}`}
                    >
                      <IconExternalLink size={10} />
                    </ActionIcon>
                  </Group>
                ))
              )}
            </Stack>
          </>
        )}
      </div>
      <style>{`
        .bookmark-item:hover { background: var(--wb-surface-active) !important; }
        a:hover { color: var(--wb-accent) !important; }
      `}</style>
    </div>
  )
})

export default BookmarkWidget
