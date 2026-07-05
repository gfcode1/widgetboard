import { memo, useState, useCallback } from 'react'
import { Text, Stack, Group, ActionIcon, TextInput, Tabs } from '@mantine/core'
import { IconPlus, IconTrash, IconExternalLink, IconBookmark } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  widget: Widget
}

export const BookmarkWidget = memo(function BookmarkWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [folderInput, setFolderInput] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>('all')

  const content = widget.content.type === 'bookmark'
    ? widget.content
    : { type: 'bookmark' as const, bookmarks: [], folders: [] }

  const addBookmark = useCallback(() => {
    if (!urlInput) return
    const url = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`
    let domain: string
    try {
      domain = new URL(url).hostname.replace('www.', '')
    } catch {
      domain = urlInput.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    }
    const newBookmark = {
      id: uuidv4(),
      title: titleInput || domain,
      url,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      folder: folderInput || undefined,
    }
    const newFolders = folderInput && !content.folders.includes(folderInput)
      ? [...content.folders, folderInput]
      : content.folders
    updateWidget(widget.id, {
      content: {
        ...content,
        bookmarks: [...content.bookmarks, newBookmark],
        folders: newFolders,
      },
    })
    setUrlInput('')
    setTitleInput('')
    setFolderInput('')
  }, [widget.id, content, urlInput, titleInput, folderInput, updateWidget])

  const removeBookmark = useCallback((id: string) => {
    updateWidget(widget.id, {
      content: {
        ...content,
        bookmarks: content.bookmarks.filter((b) => b.id !== id),
      },
    })
  }, [widget.id, content, updateWidget])

  const filteredBookmarks = activeTab === 'all'
    ? content.bookmarks
    : content.bookmarks.filter((b) => b.folder === activeTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader title="Bookmarks" editing={editing} onToggleEdit={() => setEditing(!editing)} icon={<IconBookmark size={12} />} />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            <TextInput
              placeholder="URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
            />
            <TextInput
              placeholder="Title (optional)"
              value={titleInput}
              onChange={(e) => setTitleInput(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
            />
            <TextInput
              placeholder="Folder (optional)"
              value={folderInput}
              onChange={(e) => setFolderInput(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
            />
            <ActionIcon variant="light" color="violet" size="sm" onClick={addBookmark} onMouseDown={(e) => e.stopPropagation()}>
              <IconPlus size={14} />
            </ActionIcon>
          </Stack>
        ) : (
          <>
            {content.folders.length > 0 && (
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab value="all">All</Tabs.Tab>
                  {content.folders.map((f) => (
                    <Tabs.Tab key={f} value={f}>{f}</Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
            )}
            <Stack gap={4}>
              {filteredBookmarks.length === 0 ? (
                <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
                  No bookmarks yet
                </Text>
              ) : (
                filteredBookmarks.map((b) => (
                  <Group key={b.id} gap="xs" p={4} className="bookmark-item" style={{ borderRadius: 'var(--wb-radius-sm)', background: 'var(--wb-surface-hover)', transition: 'all 150ms ease' }}>
                    {b.favicon && (
                      <img src={b.favicon} alt="" width={16} height={16} style={{ borderRadius: 2 }} />
                    )}
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ flex: 1, color: 'var(--wb-text)', textDecoration: 'none', fontSize: 'var(--mantine-font-size-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pointerEvents: 'auto', transition: 'color 150ms ease' }}
                    >
                      {b.title}
                    </a>
                    <ActionIcon size="xs" variant="subtle" color="gray" component="a" href={b.url} target="_blank" onMouseDown={(e) => e.stopPropagation()}>
                      <IconExternalLink size={10} />
                    </ActionIcon>
                    <ActionIcon size="xs" variant="subtle" color="red" onClick={() => removeBookmark(b.id)} onMouseDown={(e) => e.stopPropagation()}>
                      <IconTrash size={10} />
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
      `}</style>
    </div>
  )
})

export default BookmarkWidget
