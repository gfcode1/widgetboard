import { useCallback, useEffect, useState } from 'react'
import { Group, Text, ActionIcon, Paper, UnstyledButton } from '@mantine/core'
import { IconX, IconChevronRight, IconFolder } from '@tabler/icons-react'
import { useStore, ROOT_BOARD_ID } from '../store/useStore'
import { Canvas } from './Canvas'
import { Toolbar } from './Toolbar'

interface BoardModalProps {
  initialBoardId: string
  onClose: () => void
}

export function BoardModal({ initialBoardId, onClose }: BoardModalProps) {
  const openBoard = useStore((s) => s.openBoard)
  const navigationStack = useStore((s) => s.navigationStack)
  const boards = useStore((s) => s.boards)

  const [currentBoardId, setCurrentBoardId] = useState(initialBoardId)
  const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string; title: string }>>([])

  // Build breadcrumb from navigation stack
  useEffect(() => {
    const crumbs: Array<{ id: string; title: string }> = []
    for (const boardId of navigationStack) {
      let title = 'Root'
      if (boardId !== ROOT_BOARD_ID) {
        for (const [, widgets] of Object.entries(boards)) {
          const boardWidget = widgets.find(
            (w) => w.type === 'board' && w.content.type === 'board' && w.content.boardId === boardId
          )
          if (boardWidget && boardWidget.content.type === 'board') {
            title = boardWidget.content.title
            break
          }
        }
      }
      crumbs.push({ id: boardId, title })
    }
    setBreadcrumb(crumbs)
  }, [navigationStack, boards])

  const handleOpenBoard = useCallback(
    (boardId: string) => {
      openBoard(boardId)
      setCurrentBoardId(boardId)
    },
    [openBoard]
  )

  const handleNavigateTo = useCallback((targetIndex: number) => {
    const state = useStore.getState()
    const stepsToClose = state.navigationStack.length - 1 - targetIndex
    for (let i = 0; i < stepsToClose; i++) {
      state.closeBoard()
    }
    if (targetIndex >= 0 && state.navigationStack[targetIndex]) {
      setCurrentBoardId(state.navigationStack[targetIndex])
    }
  }, [])

  const handleClose = useCallback(() => {
    // Read fresh state from store to avoid stale closure
    const state = useStore.getState()
    let stack = state.navigationStack
    while (stack.length > 0) {
      useStore.getState().closeBoard()
      stack = useStore.getState().navigationStack
    }
    onClose()
  }, [onClose])

  // Handle Escape key — read from store directly to avoid stale closure
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useStore.getState()
        if (state.navigationStack.length > 1) {
          const prevBoardId = state.navigationStack[state.navigationStack.length - 2]
          state.closeBoard()
          setCurrentBoardId(prevBoardId!)
        } else {
          // Close all and unmount
          let stack = state.navigationStack
          while (stack.length > 0) {
            useStore.getState().closeBoard()
            stack = useStore.getState().navigationStack
          }
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'var(--wb-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with breadcrumb and close */}
      <Paper
        radius={0}
        style={{
          borderBottom: '1px solid var(--wb-border)',
          backgroundColor: 'var(--wb-surface)',
          flexShrink: 0,
        }}
      >
        <Group justify="space-between" px="md" py={6}>
          <Group gap={4}>
            {breadcrumb.map((crumb, index) => (
              <Group key={crumb.id} gap={4}>
                {index > 0 && (
                  <IconChevronRight size={14} style={{ color: 'var(--wb-text-dimmed)' }} />
                )}
                <UnstyledButton
                  onClick={() => handleNavigateTo(index)}
                  style={{
                    borderRadius: 'var(--mantine-radius-sm)',
                    padding: '2px 8px',
                    transition: 'background-color 150ms ease',
                    cursor: index === breadcrumb.length - 1 ? 'default' : 'pointer',
                    opacity: index === breadcrumb.length - 1 ? 0.7 : 1,
                  }}
                  styles={{
                    root: {
                      '&:hover':
                        index !== breadcrumb.length - 1
                          ? { backgroundColor: 'var(--wb-accent-subtle)' }
                          : undefined,
                    },
                  }}
                >
                  <Group gap={4}>
                    {index === 0 && <IconFolder size={14} style={{ color: 'var(--wb-accent)' }} />}
                    <Text
                      size="sm"
                      fw={index === breadcrumb.length - 1 ? 600 : 400}
                      c={index === breadcrumb.length - 1 ? 'gray.2' : 'dimmed'}
                    >
                      {crumb.title}
                    </Text>
                  </Group>
                </UnstyledButton>
              </Group>
            ))}
          </Group>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleClose}>
            <IconX size={16} />
          </ActionIcon>
        </Group>
      </Paper>

      {/* Canvas area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Canvas boardId={currentBoardId} onOpenBoard={handleOpenBoard} />
      </div>

      {/* Bottom toolbar */}
      <Toolbar onToggleScheme={() => {}} scheme="dark" boardId={currentBoardId} />
    </div>
  )
}

export default BoardModal
