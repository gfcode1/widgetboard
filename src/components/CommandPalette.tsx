import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Paper, Text, Stack, Group, TextInput, Box } from '@mantine/core'
import { IconSearch, IconPlus, IconArrowBackUp, IconArrowForwardUp, IconGridDots, IconShield, IconDownload, IconUpload, IconLayoutDashboard, IconFolderPlus, IconKeyboard } from '@tabler/icons-react'
import type { WidgetType } from '../types'
import { WIDGET_REGISTRY } from '../widgets/registry'
import { useStore } from '../store/useStore'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  category: 'widget' | 'canvas' | 'board'
  action: () => void
  keywords: string[]
}

interface CommandPaletteProps {
  onToggleScheme?: () => void
  scheme?: 'dark' | 'light'
}

export function CommandPalette({ onToggleScheme, scheme }: CommandPaletteProps) {
  const [opened, setOpened] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
        id: 'undo', label: 'Undo', icon: <IconArrowBackUp size={14} />, category: 'canvas',
        action: undo, keywords: ['undo', 'ctrl+z'],
      },
      {
        id: 'redo', label: 'Redo', icon: <IconArrowForwardUp size={14} />, category: 'canvas',
        action: redo, keywords: ['redo', 'ctrl+shift+z'],
      },
      {
        id: 'toggle-snap', label: snapEnabled ? 'Disable Snap' : 'Enable Snap',
        description: snapEnabled ? 'Grid snapping is ON' : 'Grid snapping is OFF',
        icon: <IconGridDots size={14} />, category: 'canvas',
        action: toggleSnap, keywords: ['snap', 'grid', 'toggle'],
      },
      {
        id: 'toggle-collision', label: collisionEnabled ? 'Disable Collision' : 'Enable Collision',
        description: collisionEnabled ? 'Collision detection is ON' : 'Collision detection is OFF',
        icon: <IconShield size={14} />, category: 'canvas',
        action: toggleCollision, keywords: ['collision', 'overlap', 'toggle'],
      },
      {
        id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <IconKeyboard size={14} />, category: 'canvas',
        action: () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' })) },
        keywords: ['shortcuts', 'keyboard', 'help', '?'],
      },
    ]

    if (onToggleScheme) {
      canvasCommands.push({
        id: 'toggle-theme', label: scheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        icon: <IconLayoutDashboard size={14} />, category: 'canvas',
        action: onToggleScheme, keywords: ['theme', 'dark', 'light', 'mode', scheme === 'dark' ? 'light' : 'dark'],
      })
    }

    const boardCommands: Command[] = [
      {
        id: 'create-board', label: 'Create Sub-Board', icon: <IconFolderPlus size={14} />, category: 'board',
        action: createSubBoard, keywords: ['board', 'create', 'sub', 'folder'],
      },
      {
        id: 'export', label: 'Export Layout', icon: <IconDownload size={14} />, category: 'board',
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
        id: 'import', label: 'Import Layout', icon: <IconUpload size={14} />, category: 'board',
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
  }, [addWidget, undo, redo, snapEnabled, collisionEnabled, toggleSnap, toggleCollision, exportLayout, importLayout, createSubBoard, onToggleScheme, scheme])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter((cmd) =>
      cmd.keywords.some((kw) => kw.includes(q)) ||
      cmd.label.toLowerCase().includes(q)
    )
  }, [commands, query])

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    for (const cmd of filtered) {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    }
    return groups
  }, [filtered])

  const flatFiltered = filtered

  const executeCommand = useCallback((cmd: Command) => {
    cmd.action()
    setOpened(false)
    setQuery('')
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key === 'k') {
        e.preventDefault()
        setOpened((prev) => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (opened) {
      setTimeout(() => inputRef.current?.focus(), 50)
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
      setOpened(false)
      setQuery('')
    }
  }, [flatFiltered, selectedIndex, executeCommand])

  if (!opened) return null

  const categoryLabels: Record<string, string> = {
    canvas: 'Canvas',
    widget: 'Widgets',
    board: 'Board',
  }

  let itemIndex = -1

  return (
    <>
      <div
        className="wb-command-palette-overlay"
        style={{ position: 'fixed', inset: 0, zIndex: 200 }}
        onClick={() => { setOpened(false); setQuery('') }}
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
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--wb-border)' }}>
          <TextInput
            ref={inputRef}
            placeholder="Search commands and widgets..."
            size="sm"
            leftSection={<IconSearch size={16} style={{ color: 'var(--wb-text-dimmed)' }} />}
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
                <Text
                  size="xs"
                  tt="uppercase"
                  fw={600}
                  c="dimmed"
                  px="xs"
                  py={4}
                >
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
                          backgroundColor: isSelected ? 'var(--wb-accent-subtle)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 100ms ease',
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => executeCommand(cmd)}
                      >
                        <div style={{ color: isSelected ? 'var(--wb-accent)' : 'var(--wb-text-dimmed)', flexShrink: 0 }}>
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
      </Paper>
    </>
  )
}

export default CommandPalette
