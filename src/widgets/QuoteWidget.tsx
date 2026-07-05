import { memo, useState, useCallback } from 'react'
import { Text, Stack, ActionIcon, Loader } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'

interface Props {
  widget: Widget
}

const FALLBACK_QUOTES = [
  { text: "Simplicity is the ultimate sophistication.", author: 'Leonardo da Vinci' },
  { text: "Time is the most valuable thing a man can spend.", author: 'Theophrastus' },
  { text: "Creativity is intelligence having fun.", author: 'Albert Einstein' },
  { text: "Every obstacle is an opportunity in disguise.", author: 'Robert Collier' },
  { text: "Life is what happens when you're busy making other plans.", author: 'John Lennon' },
  { text: "Success is going from failure to failure without losing enthusiasm.", author: 'Winston Churchill' },
  { text: "It is never too late to be what you might have been.", author: 'George Eliot' },
  { text: "Happiness is not something ready made. It comes from your own actions.", author: 'Dalai Lama' },
]

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export const QuoteWidget = memo(function QuoteWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content = widget.content.type === 'quote'
    ? widget.content
    : { type: 'quote' as const, text: FALLBACK_QUOTES[0].text, author: FALLBACK_QUOTES[0].author, lastFetched: 0 }
  const [loading, setLoading] = useState(false)

  const isStale = Date.now() - content.lastFetched > CACHE_DURATION

  const fetchQuote = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('https://zenquotes.io/api/random')
      if (res.ok) {
        const data = await res.json()
        if (data?.[0]?.q && data?.[0]?.a) {
          updateWidget(widget.id, {
            content: { type: 'quote', text: data[0].q, author: data[0].a, lastFetched: Date.now() },
          })
          return
        }
      }
      throw new Error('API failed')
    } catch {
      const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
      updateWidget(widget.id, {
        content: { type: 'quote', text: fallback.text, author: fallback.author, lastFetched: Date.now() },
      })
    } finally {
      setLoading(false)
    }
  }, [widget.id, updateWidget, loading])

  return (
    <Stack align="center" justify="center" h="100%" gap="sm" px="md" py="sm" style={{ userSelect: 'none' }}>
      {loading ? (
        <Loader size="sm" color="gray" />
      ) : (
        <>
          <Text
            size="sm"
            c="gray.2"
            ta="center"
            fs="italic"
            fw={300}
            style={{ lineHeight: 1.6, flex: 1, overflow: 'auto', letterSpacing: '0.01em' }}
          >
            &ldquo;{content.text}&rdquo;
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            &mdash; {content.author}
          </Text>
        </>
      )}
      <ActionIcon
        variant="subtle"
        color={isStale ? 'violet' : 'gray'}
        size="sm"
        onClick={fetchQuote}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
        aria-label="Refresh quote"
      >
        <IconRefresh size={14} />
      </ActionIcon>
    </Stack>
  )
})

export default QuoteWidget
