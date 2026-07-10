import { useState, useCallback, useRef } from 'react'
import { Group, Text, Button, ActionIcon, Tooltip } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconPlus, IconArrowBackUp, IconArrowForwardUp, IconGridDots, IconShield, IconDownload, IconUpload, IconSun, IconMoon, IconRobot } from '@tabler/icons-react'
import type { WidgetType } from '../types'
import { useStore } from '../store/useStore'
import { WidgetMenu } from './WidgetMenu'
import { MobileWidgetSheet } from './MobileWidgetSheet'

interface ToolbarProps {
  onToggleScheme?: () => void
  scheme?: 'dark' | 'light'
  boardId?: string
  agentOpened?: boolean
  onToggleAgent?: () => void
}

export function Toolbar({ onToggleScheme, scheme, boardId, agentOpened, onToggleAgent }: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const addWidget = useStore((s) => s.addWidget)
  const widgetCount = useStore((s): number => Object.values(s.boards).reduce((acc, arr) => acc + arr.length, 0))
  const snapEnabled = useStore((s) => s.snapEnabled)
  const collisionEnabled = useStore((s) => s.collisionEnabled)
  const toggleSnap = useStore((s) => s.toggleSnap)
  const toggleCollision = useStore((s) => s.toggleCollision)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const historyIndex = useStore((s) => s.historyIndex)
  const historyLength = useStore((s) => s.history.length)
  const exportLayout = useStore((s) => s.exportLayout)
  const importLayout = useStore((s) => s.importLayout)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < historyLength - 1

  const handleAdd = useCallback(
    (type: WidgetType) => {
      const rect = new DOMRect(0, 0, window.innerWidth, window.innerHeight)
      addWidget(type, window.innerWidth / 2, window.innerHeight / 2, rect, boardId)
    },
    [addWidget, boardId]
  )

  const handleExport = useCallback(() => {
    const json = exportLayout()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `widgetboard-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportLayout])

  const handleImport = useCallback(
    (file: File | null) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const json = reader.result as string
        importLayout(json)
      }
      reader.readAsText(file)
      // Reset input so same file can be re-imported
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [importLayout]
  )

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
      />
      <div
        style={{
          position: 'fixed',
          bottom: isMobile ? 16 : 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
        }}
      >
        <Group
          gap={2}
          px={isMobile ? 'sm' : 6}
          py={isMobile ? 6 : 4}
          className="wb-toolbar"
          style={{
            borderRadius: 'var(--wb-radius-lg)',
          }}
        >
          <Tooltip label="Undo" position="top" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
            >
              <IconArrowBackUp size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Redo" position="top" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
            >
              <IconArrowForwardUp size={16} />
            </ActionIcon>
          </Tooltip>

          {!isMobile && (
            <div style={{ width: 1, height: 20, backgroundColor: 'var(--wb-border-solid)', margin: '0 4px' }} />
          )}

          {!isMobile && (
            <>
              <Tooltip label={snapEnabled ? 'Snap: ON' : 'Snap: OFF'} position="top" withArrow>
                <ActionIcon
                  variant={snapEnabled ? 'light' : 'subtle'}
                  color={snapEnabled ? 'violet' : 'gray'}
                  size="sm"
                  onClick={toggleSnap}
                >
                  <IconGridDots size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={collisionEnabled ? 'Collision: ON' : 'Collision: OFF'} position="top" withArrow>
                <ActionIcon
                  variant={collisionEnabled ? 'light' : 'subtle'}
                  color={collisionEnabled ? 'violet' : 'gray'}
                  size="sm"
                  onClick={toggleCollision}
                >
                  <IconShield size={16} />
                </ActionIcon>
              </Tooltip>

              <div style={{ width: 1, height: 20, backgroundColor: 'var(--wb-border-solid)', margin: '0 4px' }} />
            </>
          )}

          {!isMobile && widgetCount > 0 && (
            <Text size="xs" c="dimmed" fw={500} px={4} style={{ whiteSpace: 'nowrap' }}>
              {widgetCount}
            </Text>
          )}

          {!isMobile && (
            <>
              <Tooltip label="Export layout" position="top" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={handleExport}
                  disabled={widgetCount === 0}
                >
                  <IconDownload size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Import layout" position="top" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconUpload size={16} />
                </ActionIcon>
              </Tooltip>

              <div style={{ width: 1, height: 20, backgroundColor: 'var(--wb-border-solid)', margin: '0 4px' }} />
            </>
          )}

          {onToggleScheme && (
            <Tooltip label={scheme === 'dark' ? 'Light mode' : 'Dark mode'} position="top" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={onToggleScheme}
              >
                {scheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
              </ActionIcon>
            </Tooltip>
          )}

          {onToggleAgent && (
            <Tooltip label={agentOpened ? 'Close Agent' : 'AI Agent'} position="top" withArrow>
              <ActionIcon
                variant={agentOpened ? 'light' : 'subtle'}
                color={agentOpened ? 'violet' : 'gray'}
                size="sm"
                onClick={onToggleAgent}
              >
                <IconRobot size={16} />
              </ActionIcon>
            </Tooltip>
          )}

          <div style={{ position: 'relative' }}>
            <Button
              leftSection={!isMobile ? <IconPlus size={14} /> : undefined}
              variant="light"
              color="violet"
              size={isMobile ? 'compact-xs' : 'compact-sm'}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {isMobile ? <IconPlus size={16} /> : 'Add Widget'}
            </Button>
            {!isMobile && menuOpen && (
              <WidgetMenu onSelect={handleAdd} onClose={() => setMenuOpen(false)} />
            )}
          </div>
        </Group>
      </div>

      <MobileWidgetSheet
        opened={isMobile && menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={handleAdd}
      />
    </>
  )
}
