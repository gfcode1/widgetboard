import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Paper,
  Text,
  Stack,
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
  IconSearch,
  IconPlus,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconGridDots,
  IconShield,
  IconDownload,
  IconUpload,
  IconFolderPlus,
  IconKeyboard,
  IconSparkles,
  IconSend,
  IconPlayerStop,
  IconTrash,
  IconArrowLeft,
  IconSettings,
} from '@tabler/icons-react'
import type { WidgetType } from '../types'
import { WIDGET_REGISTRY } from '../widgets/registry'
import { useStore } from '../store/useStore'
import { usePageAgent, type ChatMessage } from '../hooks/usePageAgent'
import { AgentSettingsModal } from './AgentSettingsModal'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  category: 'widget' | 'canvas' | 'board'
  action: () => void
  keywords: string[]
}

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

interface CommandPaletteProps {
  open?: boolean
  onOpen?: () => void
  onClose?: () => void
}

export function CommandPalette({ open, onOpen, onClose }: CommandPaletteProps) {
  const [internalOpened, setInternalOpened] = useState(false)
  const isControlled = open !== undefined
  const opened = isControlled ? open : internalOpened
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mode, setMode] = useState<'commands' | 'ai'>('commands')
  const [settingsOpened, setSettingsOpened] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const messagesViewportRef = useRef<HTMLDivElement>(null)

  const { status, messages, currentActivity, execute, stop, clearMessages } = usePageAgent()

  const addWidget = useStore((s) => s.addWidget)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const toggleSnap = useStore((s) => s.toggleSnap)
  const toggleCollision = useStore((s) => s.toggleCollision)
  const snapEnabled = useStore((s) => s.snapEnabled)
  const collisionEnabled = useStore((s) => s.collisionEnabled)
  const exportLayout = useStore((s) => s.exportLayout)
  const importLayout = useStore((s) => s.importLayout)
  const createSubBoard = useStore((s) => s.createSubBoard)

  const commands = useMemo<Command[]>(() => {
    const widgetCommands: Command[] = WIDGET_REGISTRY.map((w) => ({
      id: `add-${w.type}`,
      label: `Add ${w.label}`,
      description: w.description,
      icon: <IconPlus size={14} />,
      category: 'widget' as const,
      action: () => {
        const rect = new DOMRect(0, 0, window.innerWidth, window.innerHeight)
        addWidget(w.type as WidgetType, window.innerWidth / 2, window.innerHeight / 2, rect)
      },
      keywords: [w.label.toLowerCase(), w.description.toLowerCase(), 'add', 'widget'],
    }))

    const canvasCommands: Command[] = [
      {
        id: 'undo',
        label: 'Undo',
        icon: <IconArrowBackUp size={14} />,
        category: 'canvas',
        action: undo,
        keywords: ['undo', 'ctrl+z'],
      },
      {
        id: 'redo',
        label: 'Redo',
        icon: <IconArrowForwardUp size={14} />,
        category: 'canvas',
        action: redo,
        keywords: ['redo', 'ctrl+shift+z'],
      },
      {
        id: 'toggle-snap',
        label: snapEnabled ? 'Disable Snap' : 'Enable Snap',
        description: snapEnabled ? 'Grid snapping is ON' : 'Grid snapping is OFF',
        icon: <IconGridDots size={14} />,
        category: 'canvas',
        action: toggleSnap,
        keywords: ['snap', 'grid', 'toggle'],
      },
      {
        id: 'toggle-collision',
        label: collisionEnabled ? 'Disable Collision' : 'Enable Collision',
        description: collisionEnabled ? 'Collision detection is ON' : 'Collision detection is OFF',
        icon: <IconShield size={14} />,
        category: 'canvas',
        action: toggleCollision,
        keywords: ['collision', 'overlap', 'toggle'],
      },
      {
        id: 'shortcuts',
        label: 'Keyboard Shortcuts',
        icon: <IconKeyboard size={14} />,
        category: 'canvas',
        action: () => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
        },
        keywords: ['shortcuts', 'keyboard', 'help', '?'],
      },
    ]

    const boardCommands: Command[] = [
      {
        id: 'create-board',
        label: 'Create Sub-Board',
        icon: <IconFolderPlus size={14} />,
        category: 'board',
        action: createSubBoard,
        keywords: ['board', 'create', 'sub', 'folder'],
      },
      {
        id: 'export',
        label: 'Export Layout',
        icon: <IconDownload size={14} />,
        category: 'board',
        action: () => {
          const json = exportLayout()
          const blob = new Blob([json], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `widgetboard-${new Date().toISOString().slice(0, 10)}.json`
          a.click()
          URL.revokeObjectURL(url)
        },
        keywords: ['export', 'save', 'download', 'json'],
      },
      {
        id: 'import',
        label: 'Import Layout',
        icon: <IconUpload size={14} />,
        category: 'board',
        action: () => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.json'
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => importLayout(reader.result as string)
            reader.readAsText(file)
          }
          input.click()
        },
        keywords: ['import', 'load', 'upload', 'json'],
      },
    ]

    return [...canvasCommands, ...widgetCommands, ...boardCommands]
  }, [
    addWidget,
    undo,
    redo,
    snapEnabled,
    collisionEnabled,
    toggleSnap,
    toggleCollision,
    exportLayout,
    importLayout,
    createSubBoard,
  ])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(
      (cmd) => cmd.keywords.some((kw) => kw.includes(q)) || cmd.label.toLowerCase().includes(q)
    )
  }, [commands, query])

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    for (const cmd of filtered) {
      if (!groups[cmd.category]) groups[cmd.category] = [] as Command[]
      groups[cmd.category]!.push(cmd)
    }
    return groups
  }, [filtered])

  const flatFiltered = filtered

  const scrollToBottom = useCallback(() => {
    messagesViewportRef.current?.scrollTo({
      top: messagesViewportRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    if (mode === 'ai') {
      scrollToBottom()
    }
  }, [messages, mode, scrollToBottom])

  const close = useCallback(() => {
    if (isControlled) {
      onClose?.()
    } else {
      setInternalOpened(false)
    }
    setQuery('')
    setMode('commands')
  }, [isControlled, onClose])

  const handleAskAI = useCallback(async () => {
    const text = query.trim()
    if (!text || status === 'running') return
    setQuery('')
    setMode('ai')
    await execute(text)
  }, [query, status, execute])

  const handleBackToCommands = useCallback(() => {
    setMode('commands')
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const executeCommand = useCallback(
    (cmd: Command) => {
      cmd.action()
      close()
    },
    [close]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key === 'k') {
        e.preventDefault()
        setQuery('')
        setSelectedIndex(0)
        setMode('commands')
        if (isControlled) {
          if (open) {
            onClose?.()
          } else {
            onOpen?.()
          }
        } else {
          setInternalOpened((prev) => !prev)
        }
      } else if (isMod && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setQuery('')
        setSelectedIndex(0)
        setMode('commands')
        if (isControlled) {
          if (!open) {
            onOpen?.()
          }
        } else {
          setInternalOpened(true)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isControlled, open, onClose, onOpen])

  useEffect(() => {
    if (opened) {
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [opened])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.children[selectedIndex] as HTMLElement
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (mode === 'ai') {
        if (e.key === 'Escape') {
          e.preventDefault()
          handleBackToCommands()
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleAskAI()
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && flatFiltered[selectedIndex]) {
        e.preventDefault()
        executeCommand(flatFiltered[selectedIndex])
      } else if (e.key === 'Escape') {
        close()
      }
    },
    [flatFiltered, selectedIndex, executeCommand, close, mode, handleBackToCommands, handleAskAI]
  )

  if (!opened) return null

  const categoryLabels: Record<string, string> = {
    canvas: 'Canvas',
    widget: 'Widgets',
    board: 'Board',
  }

  let itemIndex = -1

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
      <div
        className="wb-command-palette-overlay"
        style={{ position: 'fixed', inset: 0, zIndex: 200 }}
        onClick={() => close()}
      />
      <Paper
        shadow="xl"
        radius="lg"
        className="wb-command-palette"
        style={{
          position: 'fixed',
          top: '20%',
          left: 'calc(50% - 240px)',
          zIndex: 210,
          width: 480,
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'commands' ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--wb-border)' }}>
              <TextInput
                ref={inputRef}
                placeholder="Search commands and widgets..."
                size="sm"
                leftSection={<IconSearch size={16} style={{ color: 'var(--wb-text-dimmed)' }} />}
                rightSection={
                  <Tooltip label="Ask AI" position="left" withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="violet"
                      onClick={handleAskAI}
                      disabled={!query.trim() || status === 'running'}
                    >
                      {status === 'running' ? (
                        <Loader size="xs" color="violet" />
                      ) : (
                        <IconSparkles size={16} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                }
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                variant="unstyled"
                styles={{
                  input: {
                    backgroundColor: 'transparent',
                    color: 'var(--wb-text)',
                    fontSize: 15,
                    fontWeight: 400,
                    padding: '4px 0',
                  },
                }}
              />
            </div>

            <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 8 }}>
              {flatFiltered.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No results found
                </Text>
              ) : (
                Object.entries(grouped).map(([category, cmds]) => (
                  <div key={category} style={{ marginBottom: 8 }}>
                    <Text size="xs" tt="uppercase" fw={600} c="dimmed" px="xs" py={4}>
                      {categoryLabels[category] ?? category}
                    </Text>
                    <Stack gap={0}>
                      {cmds.map((cmd) => {
                        itemIndex++
                        const idx = itemIndex
                        const isSelected = idx === selectedIndex
                        return (
                          <Group
                            key={cmd.id}
                            gap="sm"
                            px="xs"
                            py={6}
                            style={{
                              borderRadius: 'var(--mantine-radius-sm)',
                              backgroundColor: isSelected
                                ? 'var(--wb-accent-subtle)'
                                : 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 100ms ease',
                            }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            onClick={() => executeCommand(cmd)}
                          >
                            <div
                              style={{
                                color: isSelected ? 'var(--wb-accent)' : 'var(--wb-text-dimmed)',
                                flexShrink: 0,
                              }}
                            >
                              {cmd.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" c={isSelected ? 'gray.1' : 'gray.3'} fw={500}>
                                {cmd.label}
                              </Text>
                              {cmd.description && (
                                <Text size="xs" c="dimmed" truncate>
                                  {cmd.description}
                                </Text>
                              )}
                            </div>
                            {cmd.category === 'widget' && (
                              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                Add
                              </Text>
                            )}
                          </Group>
                        )
                      })}
                    </Stack>
                  </div>
                ))
              )}
            </div>

            <Box
              px="sm"
              py={6}
              style={{ borderTop: '1px solid var(--wb-border)', display: 'flex', gap: 16 }}
            >
              <Text size="xs" c="dimmed">
                <span style={{ opacity: 0.5 }}>↑↓</span> navigate
              </Text>
              <Text size="xs" c="dimmed">
                <span style={{ opacity: 0.5 }}>↵</span> select
              </Text>
              <Text size="xs" c="dimmed">
                <span style={{ opacity: 0.5 }}>esc</span> close
              </Text>
            </Box>
          </>
        ) : (
          <>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--wb-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Tooltip label="Back to commands" position="left" withArrow>
                <ActionIcon size="sm" variant="subtle" color="gray" onClick={handleBackToCommands}>
                  <IconArrowLeft size={16} />
                </ActionIcon>
              </Tooltip>
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
            </div>

            <div
              style={{ flex: 1, overflow: 'auto' }}
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

            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--wb-border)' }}>
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
                      onClick={handleAskAI}
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
                <span style={{ opacity: 0.5 }}>esc</span> back
              </Text>
            </Box>
          </>
        )}
      </Paper>

      <AgentSettingsModal opened={settingsOpened} onClose={() => setSettingsOpened(false)} />
    </>
  )
}

export default CommandPalette
