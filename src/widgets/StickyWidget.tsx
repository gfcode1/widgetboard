import { memo, useCallback, useRef, useState } from 'react'
import {
  Textarea,
  Group,
  ActionIcon,
  UnstyledButton,
  Tooltip,
  Chip,
  TextInput,
} from '@mantine/core'
import {
  IconBold,
  IconItalic,
  IconList,
  IconCheck,
  IconDownload,
  IconPlus,
  IconX,
} from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { copyToClipboard } from '../utils/clipboard'

interface Props {
  widget: Widget
}

const COLORS = [
  { value: '#fef3c7', label: 'Yellow' },
  { value: '#fce7f3', label: 'Pink' },
  { value: '#d1fae5', label: 'Green' },
  { value: '#dbeafe', label: 'Blue' },
  { value: '#fed7aa', label: 'Orange' },
  { value: '#ede9fe', label: 'Purple' },
]

export const StickyWidget = memo(function StickyWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content =
    widget.content.type === 'sticky'
      ? widget.content
      : { type: 'sticky' as const, text: '', color: '#fef3c7' }
  const contentRef = useRef(content)
  contentRef.current = content
  const [editing, setEditing] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const handleChange = useCallback(
    (value: string) => {
      updateWidget(widget.id, {
        content: { ...contentRef.current, text: value },
      })
    },
    [widget.id, updateWidget]
  )

  const handleColorChange = useCallback(
    (color: string) => {
      updateWidget(widget.id, {
        content: { ...contentRef.current, color },
      })
    },
    [widget.id, updateWidget]
  )

  const insertMarkdown = useCallback(
    (wrapper: string) => {
      const textarea = document.querySelector(
        `[data-sticky-id="${widget.id}"]`
      ) as HTMLTextAreaElement
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = contentRef.current.text.slice(start, end)
      const replacement = wrapper.replace('$1', selected || 'text')
      const newText =
        contentRef.current.text.slice(0, start) + replacement + contentRef.current.text.slice(end)
      handleChange(newText)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + replacement.indexOf(selected || 'text'),
          start + replacement.indexOf(selected || 'text') + (selected || 'text').length
        )
      }, 0)
    },
    [widget.id, handleChange]
  )

  const tags = (content as { tags?: string[] }).tags || []

  const addTag = useCallback(() => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return
    const newTags = [...tags, tagInput.trim()]
    updateWidget(widget.id, { content: { ...contentRef.current, tags: newTags } })
    setTagInput('')
  }, [widget.id, tagInput, tags, updateWidget])

  const removeTag = useCallback(
    (tag: string) => {
      updateWidget(widget.id, {
        content: { ...contentRef.current, tags: tags.filter((t: string) => t !== tag) },
      })
    },
    [widget.id, tags, updateWidget]
  )

  const exportText = () => {
    copyToClipboard(content.text)
  }

  const isDark = (() => {
    const hex = content.color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5
  })()
  const textColor = isDark ? '#e4e4e7' : '#1a1a1a'
  const mutedColor = isDark ? 'rgba(228,228,231,0.5)' : 'rgba(0,0,0,0.4)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Sticky"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        color={isDark ? '#ffffff' : '#1a1a1a'}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: content.color,
          position: 'relative',
        }}
      >
        {editing && (
          <Group gap={4} px={8} pt={6}>
            <Tooltip label="Bold">
              <ActionIcon
                size="xs"
                variant="subtle"
                style={{ color: textColor, opacity: 0.7 }}
                onClick={() => insertMarkdown('**$1**')}
                aria-label="Bold"
              >
                <IconBold size={12} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Italic">
              <ActionIcon
                size="xs"
                variant="subtle"
                style={{ color: textColor, opacity: 0.7 }}
                onClick={() => insertMarkdown('*$1*')}
                aria-label="Italic"
              >
                <IconItalic size={12} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Checkbox">
              <ActionIcon
                size="xs"
                variant="subtle"
                style={{ color: textColor, opacity: 0.7 }}
                onClick={() => insertMarkdown('- [ ] $1')}
                aria-label="Checkbox"
              >
                <IconCheck size={12} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="List">
              <ActionIcon
                size="xs"
                variant="subtle"
                style={{ color: textColor, opacity: 0.7 }}
                onClick={() => insertMarkdown('- $1')}
                aria-label="List"
              >
                <IconList size={12} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          <Textarea
            value={content.text}
            onChange={(e) => handleChange(e.currentTarget.value)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Write something..."
            variant="unstyled"
            autosize
            minRows={3}
            data-sticky-id={widget.id}
            aria-label="Sticky note content"
            style={{
              '& textarea': {
                fontFamily: "'Inter', system-ui, sans-serif",
                color: textColor,
                fontSize: '15px',
                lineHeight: '1.6',
                resize: 'none',
                backgroundColor: 'transparent',
              },
              '& textarea::placeholder': {
                color: mutedColor,
              },
            }}
          />
        </div>
        <Group px={8} pt={0} pb={2} gap={4} wrap="wrap">
          {tags.map((tag: string) => (
            <Chip
              key={tag}
              size="xs"
              variant="filled"
              color="gray"
              checked={false}
              onChange={() => {}}
            >
              <Group gap={2}>
                {tag}
                <IconX size={8} onClick={() => removeTag(tag)} style={{ cursor: 'pointer' }} />
              </Group>
            </Chip>
          ))}
        </Group>
        <Group justify="space-between" px={8} py={6} gap={6}>
          <Group gap={4}>
            <TextInput
              value={tagInput}
              onChange={(e) => setTagInput(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="Tag..."
              size="xs"
              w={80}
              onMouseDown={(e) => e.stopPropagation()}
              styles={{
                input: {
                  background: 'rgba(0,0,0,0.08)',
                  border: 'none',
                  color: textColor,
                  fontSize: 11,
                  '&::placeholder': { color: mutedColor },
                },
              }}
            />
            <ActionIcon
              size="xs"
              variant="subtle"
              style={{ color: textColor, opacity: 0.6 }}
              onClick={addTag}
              disabled={!tagInput.trim()}
              aria-label="Add tag"
            >
              <IconPlus size={10} />
            </ActionIcon>
          </Group>
          <Group gap={4}>
            <Tooltip label="Export">
              <ActionIcon
                size="xs"
                variant="subtle"
                style={{ color: textColor, opacity: 0.6 }}
                onClick={exportText}
                aria-label="Copy text"
              >
                <IconDownload size={12} />
              </ActionIcon>
            </Tooltip>
            {COLORS.map((c) => (
              <UnstyledButton
                key={c.value}
                onClick={() => handleColorChange(c.value)}
                aria-label={`Color ${c.label}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  backgroundColor: c.value,
                  border:
                    content.color === c.value
                      ? '2px solid rgba(0,0,0,0.3)'
                      : '1px solid rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: content.color === c.value ? 'scale(1.15)' : 'none',
                  boxShadow: content.color === c.value ? '0 0 0 2px rgba(0,0,0,0.1)' : 'none',
                }}
              />
            ))}
          </Group>
        </Group>
      </div>
    </div>
  )
})

export default StickyWidget
