import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Paper,
  Text,
  Group,
  TextInput,
  Box,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Badge,
  Loader,
} from '@mantine/core'
import {
  IconSparkles,
  IconSend,
  IconPlayerStop,
  IconTrash,
  IconSettings,
  IconX,
} from '@tabler/icons-react'
import { usePageAgent, type ChatMessage } from '../hooks/usePageAgent'
import { AgentSettingsModal } from './AgentSettingsModal'

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 6,
      }}
    >
      <Paper
        radius="md"
        p="xs"
        px="sm"
        style={{
          maxWidth: '85%',
          background: isUser
            ? 'var(--wb-accent)'
            : isError
              ? 'rgba(239, 68, 68, 0.15)'
              : 'var(--wb-bg)',
          border: isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--wb-border)',
          color: isUser ? '#fff' : isError ? '#fca5a5' : 'var(--wb-text)',
          fontSize: 13,
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}
      >
        {msg.text}
      </Paper>
    </div>
  )
}

interface AIChatProps {
  open: boolean
  onClose: () => void
  initialQuery?: string
  onQueryConsumed?: () => void
}

export function AIChat({ open, onClose, initialQuery, onQueryConsumed }: AIChatProps) {
  const [query, setQuery] = useState('')
  const [settingsOpened, setSettingsOpened] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesViewportRef = useRef<HTMLDivElement>(null)
  const queryConsumedRef = useRef(false)

  const { status, messages, currentActivity, execute, stop, clearMessages } = usePageAgent()

  const scrollToBottom = useCallback(() => {
    const el = messagesViewportRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (open && initialQuery && !queryConsumedRef.current) {
      queryConsumedRef.current = true
      execute(initialQuery)
      onQueryConsumed?.()
    }
    if (!open) {
      queryConsumedRef.current = false
    }
  }, [open, initialQuery, execute, onQueryConsumed])

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        onClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        onClose()
      }
    }
    if (open) {
      window.addEventListener('keydown', handler)
    }
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const text = query.trim()
        if (!text || status === 'running') return
        setQuery('')
        execute(text)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [query, status, execute, onClose]
  )

  const handleSend = useCallback(() => {
    const text = query.trim()
    if (!text || status === 'running') return
    setQuery('')
    execute(text)
  }, [query, status, execute])

  const statusColor =
    status === 'running'
      ? 'yellow'
      : status === 'completed'
        ? 'green'
        : status === 'error'
          ? 'red'
          : 'gray'

  if (!open) return null

  return (
    <>
      <div
        className="wb-command-palette-overlay"
        style={{ position: 'fixed', inset: 0, zIndex: 190 }}
        onClick={onClose}
      />
      <Paper
        shadow="xl"
        radius="lg"
        style={{
          position: 'fixed',
          top: '8%',
          right: 24,
          zIndex: 195,
          width: 440,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--wb-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(139, 92, 246, 0.06)',
          }}
        >
          <IconSparkles size={18} color="var(--wb-accent)" />
          <Text fw={600} size="sm" style={{ color: 'var(--wb-text)', flex: 1 }}>
            AI Agent
          </Text>
          <Badge
            color={statusColor}
            variant="dot"
            size="xs"
            style={{ textTransform: 'capitalize' }}
          >
            {status}
          </Badge>
          {status === 'running' && (
            <Tooltip label="Stop">
              <ActionIcon size="sm" variant="subtle" color="red" onClick={stop}>
                <IconPlayerStop size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Clear chat">
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={clearMessages}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Settings">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={() => setSettingsOpened(true)}
            >
              <IconSettings size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Close">
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={onClose}>
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        </div>

        <div
          style={{ flex: 1, overflow: 'hidden' }}
          role="log"
          aria-live="polite"
          aria-label="AI chat messages"
        >
          <ScrollArea
            viewportRef={messagesViewportRef}
            style={{ height: '100%' }}
            scrollbarSize={4}
          >
            <div style={{ padding: '8px 12px' }}>
              {messages.length === 0 && (
                <Text size="xs" ta="center" c="dimmed" pt="xl" style={{ lineHeight: 1.5 }}>
                  Ask me to add, remove, or manage
                  <br />
                  widgets on your canvas.
                </Text>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {currentActivity && (
                <Group gap="xs" justify="center" py={4}>
                  <Loader size="xs" color="violet" />
                  <Text size="xs" c="dimmed">
                    {currentActivity}
                  </Text>
                </Group>
              )}
            </div>
          </ScrollArea>
        </div>

        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--wb-border)' }}>
          <TextInput
            ref={inputRef}
            placeholder="Ask AI to manage widgets..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            disabled={status === 'running'}
            rightSection={
              status === 'running' ? (
                <Loader size="sm" color="violet" />
              ) : (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="violet"
                  onClick={handleSend}
                  disabled={!query.trim()}
                >
                  <IconSend size={14} />
                </ActionIcon>
              )
            }
            styles={{
              input: {
                background: 'var(--wb-bg)',
                borderColor: 'var(--wb-border)',
                color: 'var(--wb-text)',
                fontSize: 13,
              },
            }}
          />
        </div>

        <Box
          px="sm"
          py={6}
          style={{ borderTop: '1px solid var(--wb-border)', display: 'flex', gap: 16 }}
        >
          <Text size="xs" c="dimmed">
            <span style={{ opacity: 0.5 }}>↵</span> send
          </Text>
          <Text size="xs" c="dimmed">
            <span style={{ opacity: 0.5 }}>esc</span> close
          </Text>
        </Box>
      </Paper>

      <AgentSettingsModal opened={settingsOpened} onClose={() => setSettingsOpened(false)} />
    </>
  )
}

export default AIChat
