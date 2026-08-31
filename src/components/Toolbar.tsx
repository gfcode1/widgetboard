import { useState, useCallback, useRef, useMemo } from 'react'
import { Group, Text, Button, ActionIcon, Tooltip, Menu } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconPlus,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconGridDots,
  IconShield,
  IconDownload,
  IconUpload,
  IconSun,
  IconMoon,
  IconCopy,
  IconTrash,
  IconLock,
  IconSparkles,
  IconArrowUp,
  IconArrowDown,
  IconX,
  IconSettings,
  IconSearch,
  IconPencil,
  IconEye,
  IconDots,
} from '@tabler/icons-react'
import type { WidgetType } from '../types'
import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { useToast } from './Toast'
import { WidgetMenu } from './WidgetMenu'
import { MobileWidgetSheet } from './MobileWidgetSheet'

interface ToolbarProps {
  onToggleScheme?: () => void
  scheme?: 'dark' | 'light'
  boardId?: string
  onOpenSettings?: () => void
  onOpenPalette?: () => void
  onOpenAI?: () => void
}

export function Toolbar({
  onToggleScheme,
  scheme,
  boardId,
  onOpenSettings,
  onOpenPalette,
  onOpenAI,
}: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreMenuOpened, setMoreMenuOpened] = useState(false)
  const addWidget = useStore((s) => s.addWidget)
  const widgetCount = useStore(
    useShallow((s) => Object.values(s.boards).reduce((acc, arr) => acc + arr.length, 0))
  )
  const editMode = useStore((s) => s.editMode)
  const toggleEditMode = useStore((s) => s.toggleEditMode)
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
  const selectedWidgetId = useStore((s) => s.selectedWidgetId)
  const selectedIds = useStore((s) => s.selectedIds)
  const setSelectedWidgetId = useStore((s) => s.setSelectedWidgetId)
  const setSelectedIds = useStore((s) => s.setSelectedIds)
  const duplicateWidget = useStore((s) => s.duplicateWidget)
  const removeWidget = useStore((s) => s.removeWidget)
  const toggleLockWidget = useStore((s) => s.toggleLockWidget)
  const bringToFront = useStore((s) => s.bringToFront)
  const sendToBack = useStore((s) => s.sendToBack)
  const duplicateSelectedWidgets = useStore((s) => s.duplicateSelectedWidgets)
  const removeSelectedWidgets = useStore((s) => s.removeSelectedWidgets)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < historyLength - 1
  const toast = useToast()

  const hasSelection = selectedIds.length > 0 || !!selectedWidgetId
  const multiSelect =
    selectedIds.length > 1 ||
    (selectedIds.length === 1 && !!selectedWidgetId && selectedIds[0] !== selectedWidgetId)

  const handleAdd = useCallback(
    (type: WidgetType) => {
      const rect = new DOMRect(0, 0, window.innerWidth, window.innerHeight)
      addWidget(type, window.innerWidth / 2, window.innerHeight / 2, rect, boardId)
      toast.success('Widget added')
    },
    [addWidget, boardId, toast]
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
    toast.success('Layout exported')
  }, [exportLayout, toast])

  const handleUndo = useCallback(() => {
    undo()
    toast.info('Undo')
  }, [undo, toast])
  const handleRedo = useCallback(() => {
    redo()
    toast.info('Redo')
  }, [redo, toast])

  const handleToggleSnap = useCallback(() => {
    toggleSnap()
    toast.info(snapEnabled ? 'Snap disabled' : 'Snap enabled')
  }, [toggleSnap, snapEnabled, toast])

  const handleToggleCollision = useCallback(() => {
    toggleCollision()
    toast.info(collisionEnabled ? 'Collision disabled' : 'Collision enabled')
  }, [toggleCollision, collisionEnabled, toast])

  const handleImport = useCallback(
    (file: File | null) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        importLayout(reader.result as string)
        toast.success('Layout imported')
      }
      reader.onerror = () => toast.error('Failed to import layout')
      reader.readAsText(file)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [importLayout, toast]
  )

  const handleClearSelection = useCallback(() => {
    setSelectedWidgetId(null)
    setSelectedIds([])
  }, [setSelectedWidgetId, setSelectedIds])

  const handleDuplicate = useCallback(() => {
    if (multiSelect || selectedIds.length > 0) {
      duplicateSelectedWidgets()
      toast.success(`${selectedIds.length + (selectedWidgetId ? 1 : 0)} widgets duplicated`)
      handleClearSelection()
    } else if (selectedWidgetId) {
      duplicateWidget(selectedWidgetId, boardId)
      toast.success('Widget duplicated')
    }
  }, [
    multiSelect,
    selectedIds,
    selectedWidgetId,
    duplicateSelectedWidgets,
    duplicateWidget,
    boardId,
    toast,
    handleClearSelection,
  ])

  const selectionCount = useMemo(() => {
    const s = new Set(selectedIds)
    if (selectedWidgetId) s.add(selectedWidgetId)
    return s.size
  }, [selectedIds, selectedWidgetId])

  const handleDelete = useCallback(() => {
    if (multiSelect || selectedIds.length > 0) {
      removeSelectedWidgets()
      toast.success(`${selectionCount} widgets deleted`)
      handleClearSelection()
    } else if (selectedWidgetId) {
      removeWidget(selectedWidgetId, boardId)
      toast.success('Widget deleted')
      setSelectedWidgetId(null)
    }
  }, [
    multiSelect,
    selectedIds,
    selectedWidgetId,
    selectionCount,
    removeSelectedWidgets,
    removeWidget,
    boardId,
    toast,
    handleClearSelection,
    setSelectedWidgetId,
  ])

  const renderDefaultActions = () => (
    <>
      <Tooltip
        label={editMode ? 'Switch to Use Mode (E)' : 'Switch to Edit Mode (E)'}
        position="top"
        withArrow
      >
        <ActionIcon
          variant={editMode ? 'light' : 'subtle'}
          color={editMode ? 'violet' : 'gray'}
          size="sm"
          onClick={toggleEditMode}
        >
          {editMode ? <IconPencil size={16} /> : <IconEye size={16} />}
        </ActionIcon>
      </Tooltip>

      {editMode && (
        <>
          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: 'var(--wb-border-solid)',
              margin: '0 4px',
            }}
          />
          <Tooltip label="Undo (Ctrl+Z)" position="top" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
            >
              <IconArrowBackUp size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Redo (Ctrl+Shift+Z)" position="top" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
            >
              <IconArrowForwardUp size={16} />
            </ActionIcon>
          </Tooltip>

          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: 'var(--wb-border-solid)',
              margin: '0 4px',
            }}
          />
        </>
      )}

      {onToggleScheme && (
        <Tooltip label={scheme === 'dark' ? 'Light mode' : 'Dark mode'} position="top" withArrow>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={onToggleScheme}>
            {scheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          </ActionIcon>
        </Tooltip>
      )}

      {!isMobile && editMode && (
        <Menu
          opened={moreMenuOpened}
          onChange={setMoreMenuOpened}
          position="top"
          offset={8}
          shadow="lg"
          radius="md"
          zIndex={60}
          styles={{
            dropdown: {
              backgroundColor: 'var(--wb-surface-solid)',
              border: '1px solid var(--wb-border-solid)',
              boxShadow: 'var(--wb-shadow-lg)',
              borderRadius: 'var(--wb-radius)',
              padding: 4,
              minWidth: 180,
            },
            item: {
              borderRadius: 'var(--wb-radius-sm)',
              fontSize: 13,
              padding: '6px 10px',
              color: 'var(--wb-text)',
              '&:hover': { backgroundColor: 'var(--wb-surface-hover)' },
            },
          }}
        >
          <Menu.Target>
            <Tooltip label="More options" position="top" withArrow>
              <ActionIcon variant="subtle" color="gray" size="sm">
                <IconDots size={16} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconGridDots size={14} />}
              onClick={handleToggleSnap}
              rightSection={
                <Text size="xs" c="dimmed">
                  {snapEnabled ? 'ON' : 'OFF'}
                </Text>
              }
            >
              Snap to Grid
            </Menu.Item>
            <Menu.Item
              leftSection={<IconShield size={14} />}
              onClick={handleToggleCollision}
              rightSection={
                <Text size="xs" c="dimmed">
                  {collisionEnabled ? 'ON' : 'OFF'}
                </Text>
              }
            >
              Collision Detection
            </Menu.Item>
            <Menu.Divider />
            {widgetCount > 0 && (
              <Menu.Item leftSection={<IconDownload size={14} />} onClick={handleExport}>
                Export Layout
              </Menu.Item>
            )}
            <Menu.Item
              leftSection={<IconUpload size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import Layout
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconSparkles size={14} />} onClick={onOpenAI}>
              AI Agent
            </Menu.Item>
            <Menu.Item leftSection={<IconSearch size={14} />} onClick={onOpenPalette}>
              Command Palette
            </Menu.Item>
            {onOpenSettings && (
              <Menu.Item leftSection={<IconSettings size={14} />} onClick={onOpenSettings}>
                Settings
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      )}

      {!isMobile && !editMode && onOpenSettings && (
        <Tooltip label="Settings" position="top" withArrow>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={onOpenSettings}>
            <IconSettings size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </>
  )

  const renderSelectionActions = () => (
    <>
      <Text size="xs" c="violet" fw={600} px={4} style={{ whiteSpace: 'nowrap' }}>
        {selectionCount} selected
      </Text>

      <div
        style={{ width: 1, height: 20, backgroundColor: 'var(--wb-border-solid)', margin: '0 4px' }}
      />

      <Tooltip label="Duplicate" position="top" withArrow>
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleDuplicate}>
          <IconCopy size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Delete" position="top" withArrow>
        <ActionIcon variant="subtle" color="red" size="sm" onClick={handleDelete}>
          <IconTrash size={16} />
        </ActionIcon>
      </Tooltip>

      {!isMobile && selectedWidgetId && !multiSelect && (
        <>
          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: 'var(--wb-border-solid)',
              margin: '0 4px',
            }}
          />
          <Tooltip
            label={
              useStore.getState().boards[boardId ?? 'root']?.find((w) => w.id === selectedWidgetId)
                ?.locked
                ? 'Unlock'
                : 'Lock'
            }
            position="top"
            withArrow
          >
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => {
                toggleLockWidget(selectedWidgetId, boardId)
                toast.info('Widget toggled lock')
              }}
            >
              <IconLock size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Bring to Front" position="top" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => bringToFront(selectedWidgetId, boardId)}
            >
              <IconArrowUp size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Send to Back" position="top" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => sendToBack(selectedWidgetId, boardId)}
            >
              <IconArrowDown size={16} />
            </ActionIcon>
          </Tooltip>
        </>
      )}

      <div
        style={{ width: 1, height: 20, backgroundColor: 'var(--wb-border-solid)', margin: '0 4px' }}
      />
      <Tooltip label="Clear selection" position="top" withArrow>
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleClearSelection}>
          <IconX size={16} />
        </ActionIcon>
      </Tooltip>
    </>
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
          role="toolbar"
          aria-label={hasSelection ? 'Selection actions' : 'Canvas toolbar'}
          style={{
            borderRadius: 'var(--wb-radius-lg)',
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
            borderColor: hasSelection ? 'var(--wb-accent)' : 'var(--wb-glass-border)',
            boxShadow: hasSelection
              ? 'var(--wb-shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 0 0 1px var(--wb-accent)'
              : 'var(--wb-shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
          }}
        >
          {hasSelection && !isMobile ? renderSelectionActions() : renderDefaultActions()}

          {editMode && (
            <div style={{ position: 'relative' }}>
              <Button
                leftSection={!isMobile ? <IconPlus size={14} /> : undefined}
                variant="light"
                color="violet"
                size={isMobile ? 'compact-sm' : 'compact-sm'}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {isMobile ? <IconPlus size={16} /> : 'Add Widget'}
              </Button>
              {!isMobile && menuOpen && (
                <WidgetMenu onSelect={handleAdd} onClose={() => setMenuOpen(false)} />
              )}
            </div>
          )}
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
