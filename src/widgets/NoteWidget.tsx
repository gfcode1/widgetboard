import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Text, Textarea, Select, Group, Badge, TextInput } from '@mantine/core'
import { IconNote, IconSearch } from '@tabler/icons-react'
import type { Widget, NoteContent } from '../types'
import { useStore } from '../store/useStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

const DEBOUNCE_MS = 300

function highlightText(text: string, query: string): string {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '**$1**')
}

export const NoteWidget = memo(function NoteWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [localText, setLocalText] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(widget.content)

  const content = widget.content.type === 'note'
    ? widget.content
    : { type: 'note' as const, text: '', category: undefined, categories: [] }

  useEffect(() => {
    contentRef.current = content
    if (!editing) setLocalText(content.text)
  }, [content, editing])

  const categories = content.categories || []
  const activeCategory = content.category || null

  const flushDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    updateWidget(widget.id, { content: { ...(contentRef.current as NoteContent), text: localText } })
  }, [widget.id, localText, updateWidget])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const handleChange = useCallback((value: string) => {
    setLocalText(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateWidget(widget.id, { content: { ...(contentRef.current as NoteContent), text: value } })
    }, DEBOUNCE_MS)
  }, [widget.id, updateWidget])

  const setCategory = useCallback((cat: string | null) => {
    const newCategories = cat && !categories.includes(cat) ? [...categories, cat] : categories
    updateWidget(widget.id, {
      content: { ...content, category: cat || undefined, categories: newCategories },
    })
  }, [widget.id, content, categories, updateWidget])

  const displayText = editing ? localText : content.text
  const filteredText = searchQuery
    ? displayText.split('\n').filter((line) => line.toLowerCase().includes(searchQuery.toLowerCase())).join('\n')
    : displayText
  const highlightedText = searchQuery ? highlightText(filteredText, searchQuery) : filteredText

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Note"
        editing={editing}
        onToggleEdit={() => {
          if (editing) flushDebounce()
          setEditing(!editing)
          setLocalText(content.text)
        }}
        icon={<IconNote size={12} />}
        rightSlot={activeCategory ? (
          <Badge size="xs" variant="light" color="violet" style={{ cursor: 'pointer' }} onClick={() => setCategory(null)}>
            {activeCategory} ×
          </Badge>
        ) : undefined}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {editing ? (
          <>
            <Group gap="xs" mb={8}>
              <Select
                data={categories.map((c) => ({ value: c, label: c }))}
                value={activeCategory || null}
                onChange={setCategory}
                placeholder="No category"
                size="xs"
                searchable
                clearable
                onMouseDown={(e) => e.stopPropagation()}
                style={{ flex: 1, pointerEvents: 'auto' }}
              />
            </Group>
            <Textarea
              value={localText}
              onChange={(e) => handleChange(e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Write here... Markdown supported"
              autosize
              minRows={3}
              variant="unstyled"
              style={{
                pointerEvents: 'auto',
                '& textarea': {
                  fontFamily: 'var(--mantine-font-family-monospace)',
                  color: 'var(--wb-text)',
                  fontSize: 'var(--mantine-font-size-sm)',
                  resize: 'none',
                },
              }}
            />
            <Text size="xs" c="dimmed" ta="right" mt={4}>
              {localText.split(/\s+/).filter(Boolean).length} words · {localText.length} chars
            </Text>
          </>
        ) : (
          <>
            {!activeCategory && categories.length > 0 && (
              <Group gap={4} mb={8}>
                {categories.map((c) => (
                  <Badge key={c} size="xs" variant="light" color="gray" style={{ cursor: 'pointer' }} onClick={() => setCategory(c)}>
                    {c}
                  </Badge>
                ))}
              </Group>
            )}
            <Group gap="xs" mb={8}>
              <TextInput
                placeholder="Search in note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                onMouseDown={(e) => e.stopPropagation()}
                size="xs"
                leftSection={<IconSearch size={12} />}
                style={{ flex: 1, pointerEvents: 'auto' }}
              />
            </Group>
            <div style={{ color: 'var(--wb-text)', fontSize: 'var(--mantine-font-size-sm)', lineHeight: 1.6 }}>
              {displayText ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{highlightedText}</ReactMarkdown>
              ) : (
                <Text size="xs" c="dimmed" fs="italic">Double-click to edit. Markdown supported.</Text>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
})

export default NoteWidget
