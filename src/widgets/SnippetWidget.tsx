import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Text, Stack, Group, ActionIcon, TextInput, Textarea, Select, Badge } from '@mantine/core'
import { IconCode, IconPlus, IconTrash, IconCopy, IconCheck, IconSearch } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  widget: Widget
}

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'HTML', 'CSS', 'SQL', 'Go', 'Java', 'Shell', 'Other']

export const SnippetWidget = memo(function SnippetWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [langFilter, setLangFilter] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newLang, setNewLang] = useState<string | null>('JavaScript')
  const [newTags, setNewTags] = useState('')

  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
  }, [])

  const content = widget.content.type === 'snippet'
    ? widget.content
    : { type: 'snippet' as const, snippets: [] }

  const addSnippet = useCallback(() => {
    if (!newTitle || !newCode) return
    const snippet = {
      id: uuidv4(),
      title: newTitle,
      code: newCode,
      language: newLang || 'Other',
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
    }
    updateWidget(widget.id, {
      content: { ...content, snippets: [...content.snippets, snippet] },
    })
    setNewTitle('')
    setNewCode('')
    setNewTags('')
  }, [widget.id, content, newTitle, newCode, newLang, newTags, updateWidget])

  const removeSnippet = useCallback((id: string) => {
    updateWidget(widget.id, {
      content: { ...content, snippets: content.snippets.filter((s) => s.id !== id) },
    })
  }, [widget.id, content, updateWidget])

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopiedId(null), 1500)
    }).catch(() => {})
  }, [])

  const filtered = content.snippets
    .filter((s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((s) => !langFilter || s.language === langFilter)

  const allLangs = [...new Set(content.snippets.map((s) => s.language))]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader title="Snippets" editing={editing} onToggleEdit={() => setEditing(!editing)} icon={<IconCode size={12} />} />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            <TextInput placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.currentTarget.value)} onMouseDown={(e) => e.stopPropagation()} size="xs" />
            <Select data={LANGUAGES} value={newLang} onChange={setNewLang} size="xs" searchable onMouseDown={(e) => e.stopPropagation()} />
            <Textarea
              value={newCode}
              onChange={(e) => setNewCode(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Code..."
              autosize
              minRows={3}
              size="xs"
              styles={{ input: { fontFamily: 'monospace', fontSize: 'var(--mantine-font-size-xs)' } }}
            />
            <TextInput placeholder="Tags (comma separated)" value={newTags} onChange={(e) => setNewTags(e.currentTarget.value)} onMouseDown={(e) => e.stopPropagation()} size="xs" />
            <ActionIcon variant="light" color="violet" size="sm" onClick={addSnippet} disabled={!newTitle || !newCode} onMouseDown={(e) => e.stopPropagation()}>
              <IconPlus size={14} />
            </ActionIcon>
          </Stack>
        ) : (
          <>
            <Group gap="xs" mb={6}>
              <TextInput
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                onMouseDown={(e) => e.stopPropagation()}
                size="xs"
                style={{ flex: 1 }}
                leftSection={<IconSearch size={12} />}
              />
              {allLangs.length > 0 && (
                <Select
                  data={allLangs.map((l) => ({ value: l, label: l }))}
                  value={langFilter}
                  onChange={setLangFilter}
                  size="xs"
                  clearable
                  placeholder="All"
                  w={90}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              )}
            </Group>
            <Stack gap={4}>
              {filtered.length === 0 ? (
                <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
                  {searchQuery || langFilter ? 'No matching snippets' : 'No snippets yet'}
                </Text>
              ) : (
                filtered.map((s) => (
                  <div
                    key={s.id}
                    className="snippet-item"
                    style={{ borderRadius: 'var(--wb-radius-sm)', background: 'var(--wb-surface-hover)', padding: 6, cursor: 'pointer', transition: 'all 150ms ease' }}
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    onMouseDown={(e) => e.stopPropagation()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setExpandedId(expandedId === s.id ? null : s.id) }}
                    aria-expanded={expandedId === s.id}
                  >
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Text size="xs" fw={600} c="gray.2">{s.title}</Text>
                        <Badge size="xs" variant="light" color="gray">{s.language}</Badge>
                      </Group>
                      <Group gap={2}>
                        <ActionIcon size="xs" variant="subtle" color={copiedId === s.id ? 'green' : 'gray'} onClick={(e) => { e.stopPropagation(); copyCode(s.code, s.id) }} onMouseDown={(e) => e.stopPropagation()} aria-label="Copy code">
                          {copiedId === s.id ? <IconCheck size={10} /> : <IconCopy size={10} />}
                        </ActionIcon>
                        <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); removeSnippet(s.id) }} onMouseDown={(e) => e.stopPropagation()} aria-label="Delete snippet">
                          <IconTrash size={10} />
                        </ActionIcon>
                      </Group>
                    </Group>
                    {expandedId === s.id && (
                      <pre style={{ margin: '6px 0 0', padding: 8, borderRadius: 'var(--wb-radius-sm)', background: 'var(--wb-surface-solid)', color: 'var(--wb-text)', fontSize: 'var(--mantine-font-size-xs)', fontFamily: 'monospace', overflow: 'auto', maxHeight: 120, whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid var(--wb-border)' }}>
                        {s.code}
                      </pre>
                    )}
                    {s.tags.length > 0 && expandedId !== s.id && (
                      <Group gap={4} mt={4}>
                        {s.tags.map((t) => (
                          <Badge key={t} size="xs" variant="dot" color="gray" style={{ fontSize: 9 }}>{t}</Badge>
                        ))}
                      </Group>
                    )}
                  </div>
                ))
              )}
            </Stack>
          </>
        )}
      </div>
      <style>{`
        .snippet-item:hover { background: var(--wb-surface-active) !important; }
      `}</style>
    </div>
  )
})

export default SnippetWidget
