import { memo, useCallback, useRef } from 'react'
import { Textarea, Group, UnstyledButton } from '@mantine/core'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'

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
  const content = widget.content.type === 'sticky' ? widget.content : { type: 'sticky' as const, text: '', color: '#fef3c7' }
  const contentRef = useRef(content)
  contentRef.current = content

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: content.color,
        borderRadius: 'var(--mantine-radius-md)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: 3,
          backgroundColor: content.color,
          filter: 'brightness(0.85)',
          borderRadius: 'var(--wb-radius) var(--wb-radius) 0 0',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <Textarea
          value={content.text}
          onChange={(e) => handleChange(e.currentTarget.value)}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Write something..."
          variant="unstyled"
          autosize
          minRows={3}
          style={{
            '& textarea': {
              fontFamily: "'Inter', system-ui, sans-serif",
              color: '#1a1a1a',
              fontSize: '15px',
              lineHeight: '1.6',
              resize: 'none',
              backgroundColor: 'transparent',
            },
          }}
        />
      </div>
      <Group
        justify="flex-end"
        px={8}
        py={6}
        gap={6}
        style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
      >
        {COLORS.map((c) => (
          <UnstyledButton
            key={c.value}
            onClick={() => handleColorChange(c.value)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: c.value,
              border: content.color === c.value
                ? '2px solid rgba(0,0,0,0.3)'
                : '1px solid rgba(0,0,0,0.15)',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: content.color === c.value ? 'scale(1.15)' : 'none',
              boxShadow: content.color === c.value
                ? '0 0 0 3px rgba(0,0,0,0.1)'
                : 'none',
            }}
          />
        ))}
      </Group>
    </div>
  )
})

export default StickyWidget
