import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { Text, Stack, Group, ActionIcon, Loader, Badge, Tooltip, Select } from '@mantine/core'
import {
  IconRefresh,
  IconHeart,
  IconHeartFilled,
  IconCopy,
  IconCheck,
  IconShare,
  IconClock,
} from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'

interface Props {
  widget: Widget
}

interface Quote {
  text: string
  author: string
  category?: string
}

const QUOTE_CATEGORIES = ['all', 'motivation', 'wisdom', 'creativity', 'success', 'life'] as const

const FALLBACK_QUOTES: ReadonlyArray<Quote> = [
  {
    text: 'Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
    category: 'creativity',
  },
  {
    text: 'Time is the most valuable thing a man can spend.',
    author: 'Theophrastus',
    category: 'wisdom',
  },
  {
    text: 'Creativity is intelligence having fun.',
    author: 'Albert Einstein',
    category: 'creativity',
  },
  {
    text: 'Every obstacle is an opportunity in disguise.',
    author: 'Robert Collier',
    category: 'motivation',
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: 'John Lennon',
    category: 'life',
  },
  {
    text: 'Success is going from failure to failure without losing enthusiasm.',
    author: 'Winston Churchill',
    category: 'success',
  },
  {
    text: 'It is never too late to be what you might have been.',
    author: 'George Eliot',
    category: 'motivation',
  },
  {
    text: 'Happiness is not something ready made. It comes from your own actions.',
    author: 'Dalai Lama',
    category: 'wisdom',
  },
  {
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    category: 'success',
  },
  {
    text: 'In the middle of difficulty lies opportunity.',
    author: 'Albert Einstein',
    category: 'motivation',
  },
  {
    text: 'Be the change you wish to see in the world.',
    author: 'Mahatma Gandhi',
    category: 'wisdom',
  },
  {
    text: 'Imagination is more important than knowledge.',
    author: 'Albert Einstein',
    category: 'creativity',
  },
  {
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
    category: 'wisdom',
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: 'Steve Jobs',
    category: 'life',
  },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs', category: 'motivation' },
]

const QUOTE_APIS = [
  {
    name: 'zenquotes',
    fetch: async (): Promise<Quote | null> => {
      const res = await fetch('https://zenquotes.io/api/random')
      if (!res.ok) return null
      const data = await res.json()
      if (data?.[0]?.q && data?.[0]?.a) return { text: data[0].q, author: data[0].a }
      return null
    },
  },
  {
    name: 'quotable',
    fetch: async (): Promise<Quote | null> => {
      const res = await fetch('https://api.quotable.io/random')
      if (!res.ok) return null
      const data = await res.json()
      if (data?.content && data?.author) return { text: data.content, author: data.author }
      return null
    },
  },
]

const CACHE_KEY = 'wb_quote_favorites'

function loadFavorites(): Quote[] {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveFavorites(favorites: Quote[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(favorites))
  } catch {
    /* ignore */
  }
}

function isQuoteFavorite(quote: Quote, favorites: Quote[]): boolean {
  return favorites.some((f) => f.text === quote.text && f.author === quote.author)
}

const CACHE_DURATION = 30 * 60 * 1000
const AUTO_REFRESH_OPTIONS = [
  { value: '0', label: 'Never' },
  { value: '60', label: '1 hour' },
  { value: '360', label: '6 hours' },
  { value: '1440', label: '24 hours' },
]

export const QuoteWidget = memo(function QuoteWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content =
    widget.content.type === 'quote'
      ? widget.content
      : {
          type: 'quote' as const,
          text: FALLBACK_QUOTES[0]?.text ?? '',
          author: FALLBACK_QUOTES[0]?.author ?? '',
          lastFetched: 0,
        }
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Quote[]>(loadFavorites)
  const [copied, setCopied] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [fadeClass, setFadeClass] = useState('')
  const [posterMode, setPosterMode] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState('0')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const addTimer = useCallback((fn: () => void, delay: number) => {
    const timer = setTimeout(() => {
      fn()
      timersRef.current = timersRef.current.filter((t) => t !== timer)
    }, delay)
    timersRef.current.push(timer)
    return timer
  }, [])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  const isStale = Date.now() - content.lastFetched > CACHE_DURATION
  const isFav = isQuoteFavorite({ text: content.text, author: content.author }, favorites)

  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  const fetchQuote = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setFadeClass('fade-out')
    try {
      let quote: Quote | null = null
      for (const api of QUOTE_APIS) {
        try {
          quote = await api.fetch()
          if (quote) break
        } catch {
          continue
        }
      }
      if (quote) {
        const matchingFallback = FALLBACK_QUOTES.find((f) => f.author === quote?.author)
        quote.category = matchingFallback?.category || 'wisdom'
        addTimer(() => {
          updateWidget(widget.id, {
            content: {
              type: 'quote',
              text: quote?.text ?? '',
              author: quote?.author ?? '',
              lastFetched: Date.now(),
            },
          })
          setFadeClass('fade-in')
        }, 150)
      } else throw new Error('All APIs failed')
    } catch {
      const fallback =
        FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)] ?? FALLBACK_QUOTES[0]!
      addTimer(() => {
        updateWidget(widget.id, {
          content: {
            type: 'quote',
            text: fallback.text,
            author: fallback.author,
            lastFetched: Date.now(),
          },
        })
        setFadeClass('fade-in')
      }, 150)
    } finally {
      setLoading(false)
    }
  }, [widget.id, updateWidget, loading, addTimer])

  useEffect(() => {
    const minutes = parseInt(autoRefresh)
    if (!minutes) return
    const interval = setInterval(fetchQuote, minutes * 60 * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchQuote])

  const toggleFavorite = useCallback(() => {
    const currentQuote: Quote = { text: content.text, author: content.author }
    if (isFav) {
      setFavorites((prev) =>
        prev.filter((f) => !(f.text === currentQuote.text && f.author === currentQuote.author))
      )
    } else {
      setFavorites((prev) => [...prev, currentQuote])
    }
  }, [content.text, content.author, isFav])

  const copyQuote = useCallback(() => {
    const text = `${content.text} — ${content.author}`
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        addTimer(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }, [content.text, content.author, addTimer])

  const shareQuote = useCallback(() => {
    const text = `${content.text} — ${content.author}`
    if (navigator.share) {
      navigator.share({ title: 'Quote', text }).catch(() => {})
    } else {
      copyQuote()
    }
  }, [content.text, content.author, copyQuote])

  if (posterMode) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: 'var(--wb-radius)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={() => setPosterMode(false)}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xs"
          onClick={() => setPosterMode(false)}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
          aria-label="Close poster"
        >
          <IconCheck size={12} />
        </ActionIcon>
        <Stack align="center" justify="center" h="100%" px="xl" gap="md">
          <Text
            fz="xl"
            c="gray.1"
            ta="center"
            fs="italic"
            fw={300}
            style={{ lineHeight: 1.5, letterSpacing: '0.02em' }}
          >
            &ldquo;{content.text}&rdquo;
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            &mdash; {content.author}
          </Text>
        </Stack>
      </div>
    )
  }

  return (
    <Stack
      align="center"
      justify="center"
      h="100%"
      gap="sm"
      px="md"
      py="sm"
      style={{ userSelect: 'none' }}
    >
      <style>{`
        .quote-fade-out { opacity: 0; transform: translateY(4px); transition: all 0.15s ease-out; }
        .quote-fade-in { opacity: 1; transform: translateY(0); transition: all 0.2s ease-in; }
        .quote-poster-trigger:hover { opacity: 1 !important; }
      `}</style>

      <Group gap={4} wrap="nowrap" style={{ overflow: 'auto', maxWidth: '100%' }}>
        {QUOTE_CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            size="xs"
            variant={selectedCategory === cat ? 'filled' : 'light'}
            color={selectedCategory === cat ? 'violet' : 'gray'}
            style={{ cursor: 'pointer', textTransform: 'capitalize', flexShrink: 0 }}
            onClick={() => setSelectedCategory(cat)}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {cat}
          </Badge>
        ))}
      </Group>

      {loading ? (
        <Loader size="sm" color="gray" />
      ) : (
        <div
          className={fadeClass}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
          }}
          onClick={() => setPosterMode(true)}
        >
          <Text
            size="sm"
            c="gray.2"
            ta="center"
            fs="italic"
            fw={300}
            style={{ lineHeight: 1.6, letterSpacing: '0.01em' }}
          >
            &ldquo;{content.text}&rdquo;
          </Text>
          <Text size="xs" c="dimmed" ta="center" mt={4}>
            &mdash; {content.author}
          </Text>
        </div>
      )}

      <Group gap={4}>
        <Tooltip label={isFav ? 'Remove from favorites' : 'Add to favorites'}>
          <ActionIcon
            variant="subtle"
            color={isFav ? 'red' : 'gray'}
            size="sm"
            onClick={toggleFavorite}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFav ? <IconHeartFilled size={14} /> : <IconHeart size={14} />}
          </ActionIcon>
        </Tooltip>

        <Tooltip label={copied ? 'Copied!' : 'Copy quote'}>
          <ActionIcon
            variant="subtle"
            color={copied ? 'green' : 'gray'}
            size="sm"
            onClick={copyQuote}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
            aria-label="Copy quote"
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Share">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={shareQuote}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
            aria-label="Share quote"
          >
            <IconShare size={14} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="New quote">
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
        </Tooltip>
        <Select
          data={AUTO_REFRESH_OPTIONS}
          value={autoRefresh}
          onChange={(v) => v !== null && setAutoRefresh(v)}
          size="xs"
          w={40}
          allowDeselect={false}
          leftSection={<IconClock size={10} />}
          styles={{ input: { fontSize: 9, padding: '0 4px' } }}
        />
      </Group>
    </Stack>
  )
})

export default QuoteWidget
