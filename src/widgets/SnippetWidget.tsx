import { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  Text,
  Stack,
  Group,
  ActionIcon,
  TextInput,
  Textarea,
  Select,
  Badge,
  Tooltip,
} from '@mantine/core'
import {
  IconCode,
  IconPlus,
  IconTrash,
  IconCopy,
  IconCheck,
  IconSearch,
  IconDownload,
} from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  widget: Widget
}

const LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Rust',
  'HTML',
  'CSS',
  'SQL',
  'Go',
  'Java',
  'Shell',
  'Other',
]

// Simple syntax highlighting colors per language
const SYNTAX_COLORS: Record<string, Record<string, string>> = {
  JavaScript: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
  TypeScript: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
  Python: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
  Rust: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
  HTML: { keyword: '#e06c75', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
  CSS: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
  SQL: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
  Go: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
  Java: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
  Shell: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66' },
}

function highlightCode(code: string, language: string): string {
  const colors = SYNTAX_COLORS[language] || SYNTAX_COLORS.JavaScript
  if (!colors) return escapeHtml(code)

  let result = escapeHtml(code)

  // Comments
  result = result.replace(/(\/\/.*$)/gm, `<span style="color: ${colors.comment}">$1</span>`)
  result = result.replace(/(#.*$)/gm, `<span style="color: ${colors.comment}">$1</span>`)

  // Strings
  result = result.replace(
    /(&quot;[^&]*&quot;|&#39;[^&]*&#39;|`[^`]*`)/g,
    `<span style="color: ${colors.string}">$1</span>`
  )

  // Keywords
  const keywords = [
    'const',
    'let',
    'var',
    'function',
    'return',
    'if',
    'else',
    'for',
    'while',
    'class',
    'import',
    'export',
    'from',
    'async',
    'await',
    'try',
    'catch',
    'throw',
    'new',
    'this',
    'def',
    'fn',
    'pub',
    'struct',
    'impl',
    'use',
    'mod',
    'SELECT',
    'FROM',
    'WHERE',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'DROP',
  ]
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
  result = result.replace(keywordRegex, `<span style="color: ${colors.keyword}">$1</span>`)

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, `<span style="color: ${colors.number}">$1</span>`)

  return result
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    },
    []
  )

  const content =
    widget.content.type === 'snippet' ? widget.content : { type: 'snippet' as const, snippets: [] }
  const contentRef = useRef(content)
  contentRef.current = content

  const addSnippet = useCallback(() => {
    if (!newTitle || !newCode) return
    const c = contentRef.current
    const snippet = {
      id: uuidv4(),
      title: newTitle,
      code: newCode,
      language: newLang || 'Other',
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }
    updateWidget(widget.id, {
      content: { ...c, snippets: [...c.snippets, snippet] },
    })
    setNewTitle('')
    setNewCode('')
    setNewTags('')
  }, [widget.id, newTitle, newCode, newLang, newTags, updateWidget])

  const removeSnippet = useCallback(
    (id: string) => {
      const c = contentRef.current
      updateWidget(widget.id, {
        content: { ...c, snippets: c.snippets.filter((s) => s.id !== id) },
      })
    },
    [widget.id, updateWidget]
  )

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopiedId(id)
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = setTimeout(() => setCopiedId(null), 1500)
      })
      .catch(() => {})
  }, [])

  const exportSnippet = useCallback(
    (snippet: { title: string; code: string; language: string }) => {
      const extensions: Record<string, string> = {
        JavaScript: 'js',
        TypeScript: 'ts',
        Python: 'py',
        Rust: 'rs',
        HTML: 'html',
        CSS: 'css',
        SQL: 'sql',
        Go: 'go',
        Java: 'java',
        Shell: 'sh',
      }
      const ext = extensions[snippet.language] || 'txt'
      const blob = new Blob([snippet.code], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${snippet.title.toLowerCase().replace(/\s+/g, '-')}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    },
    []
  )

  const filtered = useMemo(() => {
    return content.snippets
      .filter(
        (s) =>
          !searchQuery ||
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((s) => !langFilter || s.language === langFilter)
  }, [content.snippets, searchQuery, langFilter])

  const allLangs = useMemo(
    () => [...new Set(content.snippets.map((s) => s.language))],
    [content.snippets]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title={`Snippets (${content.snippets.length})`}
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconCode size={12} />}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            <TextInput
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
            />
            <Select
              data={LANGUAGES}
              value={newLang}
              onChange={setNewLang}
              size="xs"
              searchable
              onMouseDown={(e) => e.stopPropagation()}
            />
            <Textarea
              value={newCode}
              onChange={(e) => setNewCode(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Code..."
              autosize
              minRows={3}
              size="xs"
              styles={{
                input: { fontFamily: 'monospace', fontSize: 'var(--mantine-font-size-xs)' },
              }}
            />
            <TextInput
              placeholder="Tags (comma separated)"
              value={newTags}
              onChange={(e) => setNewTags(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
            />
            <ActionIcon
              variant="light"
              color="violet"
              size="sm"
              onClick={addSnippet}
              disabled={!newTitle || !newCode}
              onMouseDown={(e) => e.stopPropagation()}
            >
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
                    style={{
                      borderRadius: 'var(--wb-radius-sm)',
                      background: 'var(--wb-surface-hover)',
                      padding: 6,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    onMouseDown={(e) => e.stopPropagation()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setExpandedId(expandedId === s.id ? null : s.id)
                    }}
                    aria-expanded={expandedId === s.id}
                  >
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Text size="xs" fw={600} c="gray.2">
                          {s.title}
                        </Text>
                        <Badge size="xs" variant="light" color="gray">
                          {s.language}
                        </Badge>
                      </Group>
                      <Group gap={2}>
                        <Tooltip label="Export">
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="gray"
                            onClick={(e) => {
                              e.stopPropagation()
                              exportSnippet(s)
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            aria-label="Export snippet"
                          >
                            <IconDownload size={10} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={copiedId === s.id ? 'Copied!' : 'Copy code'}>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color={copiedId === s.id ? 'green' : 'gray'}
                            onClick={(e) => {
                              e.stopPropagation()
                              copyCode(s.code, s.id)
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            aria-label="Copy code"
                          >
                            {copiedId === s.id ? <IconCheck size={10} /> : <IconCopy size={10} />}
                          </ActionIcon>
                        </Tooltip>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSnippet(s.id)
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          aria-label="Delete snippet"
                        >
                          <IconTrash size={10} />
                        </ActionIcon>
                      </Group>
                    </Group>
                    {expandedId === s.id && (
                      <pre
                        style={{
                          margin: '6px 0 0',
                          padding: 8,
                          borderRadius: 'var(--wb-radius-sm)',
                          background: 'var(--wb-surface-solid)',
                          color: 'var(--wb-text)',
                          fontSize: 'var(--mantine-font-size-xs)',
                          fontFamily: 'monospace',
                          overflow: 'auto',
                          maxHeight: 150,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          border: '1px solid var(--wb-border)',
                          lineHeight: 1.5,
                        }}
                        dangerouslySetInnerHTML={{ __html: highlightCode(s.code, s.language) }}
                      />
                    )}
                    {s.tags.length > 0 && expandedId !== s.id && (
                      <Group gap={4} mt={4}>
                        {s.tags.map((t) => (
                          <Badge
                            key={t}
                            size="xs"
                            variant="dot"
                            color="gray"
                            style={{ fontSize: 9 }}
                          >
                            {t}
                          </Badge>
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
