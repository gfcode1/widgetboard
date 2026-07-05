import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ActionIcon,
  Tooltip,
  TextInput,
  ScrollArea,
  Group,
  Text,
  Badge,
  Loader,
  Paper,
} from '@mantine/core'
import {
  IconRobot,
  IconSend,
  IconSettings,
  IconPlayerStop,
  IconTrash,
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
          border: isError
            ? '1px solid rgba(239, 68, 68, 0.3)'
            : '1px solid var(--wb-border)',
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

export function AgentPanel() {
  const [opened, setOpened] = useState(false)
  const [settingsOpened, setSettingsOpened] = useState(false)
  const [input, setInput] = useState('')
  const viewportRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { status, messages, currentActivity, execute, stop, clearMessages } =
    usePageAgent()

  const scrollToBottom = useCallback(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (opened) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [opened])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || status === 'running') return
    setInput('')
    await execute(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const statusColor =
    status === 'running'
      ? 'yellow'
      : status === 'completed'
        ? 'green'
        : status === 'error'
          ? 'red'
          : 'gray'

  return (
    <>
      {/* Chat Panel */}
      {opened && (
        <div className="wb-agent-panel">
          {/* Header */}
          <div className="wb-agent-header">
            <Group gap="xs" style={{ flex: 1 }}>
              <IconRobot size={18} color="var(--wb-accent)" />
              <Text fw={600} size="sm" style={{ color: 'var(--wb-text)' }}>
                WidgetBoard Agent
              </Text>
              <Badge
                color={statusColor}
                variant="dot"
                size="xs"
                style={{ textTransform: 'capitalize' }}
              >
                {status}
              </Badge>
            </Group>
            <Group gap={4}>
              {status === 'running' && (
                <Tooltip label="Stop">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={stop}
                  >
                    <IconPlayerStop size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label="Clear chat">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={clearMessages}
                >
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
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => setOpened(false)}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </div>

          {/* Messages */}
          <div className="wb-agent-messages">
            <ScrollArea
              viewportRef={viewportRef}
              style={{ flex: 1 }}
              scrollbarSize={4}
            >
              <div style={{ padding: '8px 12px' }}>
                {messages.length === 0 && (
                  <Text
                    size="xs"
                    ta="center"
                    c="dimmed"
                    pt="xl"
                    style={{ lineHeight: 1.5 }}
                  >
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

          {/* Input */}
          <div className="wb-agent-input">
            <TextInput
              ref={inputRef}
              placeholder="Add a clock widget..."
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
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
                    disabled={!input.trim()}
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
        </div>
      )}

      {/* FAB Button */}
      {!opened && (
        <Tooltip label="AI Agent" position="left" withinPortal>
          <button
            className="wb-agent-fab"
            onClick={() => setOpened(true)}
            aria-label="Open AI Agent"
          >
            <IconRobot size={22} />
          </button>
        </Tooltip>
      )}

      <AgentSettingsModal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
      />
    </>
  )
}

export default AgentPanel
