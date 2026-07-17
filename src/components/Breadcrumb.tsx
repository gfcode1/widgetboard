import { useMemo } from 'react'
import { Group, Text, UnstyledButton } from '@mantine/core'
import { IconChevronRight, IconHome } from '@tabler/icons-react'
import { useStore, ROOT_BOARD_ID } from '../store/useStore'

export function Breadcrumb() {
  const navigationStack = useStore((s) => s.navigationStack)
  const boards = useStore((s) => s.boards)
  const closeBoard = useStore((s) => s.closeBoard)

  const crumbs = useMemo(() => {
    const items: { id: string; title: string }[] = [{ id: ROOT_BOARD_ID, title: 'Home' }]

    for (const boardId of navigationStack) {
      // Find the board widget that references this boardId
      let title = 'Board'
      for (const widgets of Object.values(boards)) {
        const boardWidget = widgets.find(
          (w) => w.type === 'board' && w.content.type === 'board' && w.content.boardId === boardId
        )
        if (boardWidget?.content.type === 'board') {
          title = boardWidget.content.title || 'Untitled'
          break
        }
      }
      items.push({ id: boardId, title })
    }

    return items
  }, [navigationStack, boards])

  if (navigationStack.length === 0) return null

  const handleClick = (index: number) => {
    // Navigate back to this level
    const stepsBack = crumbs.length - 1 - index
    for (let i = 0; i < stepsBack; i++) {
      closeBoard()
    }
  }

  return (
    <nav aria-label="Board navigation">
      <Group
        gap={4}
        px="sm"
        py={4}
        className="wb-glass"
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 20,
          borderRadius: 'var(--wb-radius-lg)',
          boxShadow: 'var(--wb-shadow-md)',
        }}
      >
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <Group key={crumb.id} gap={4}>
              {i > 0 && (
                <IconChevronRight
                  size={12}
                  style={{ color: 'var(--wb-text-dimmed)', opacity: 0.5 }}
                />
              )}
              <UnstyledButton
                onClick={() => handleClick(i)}
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                  padding: '2px 6px',
                  cursor: isLast ? 'default' : 'pointer',
                  opacity: isLast ? 1 : 0.7,
                  transition: 'opacity 150ms ease, background-color 150ms ease',
                }}
                styles={{
                  root: {
                    '&:hover': !isLast
                      ? { backgroundColor: 'var(--wb-accent-subtle)', opacity: 1 }
                      : {},
                  },
                }}
              >
                <Group gap={4}>
                  {i === 0 && <IconHome size={12} style={{ color: 'var(--wb-accent)' }} />}
                  <Text size="xs" fw={isLast ? 600 : 400} c={isLast ? 'gray.2' : 'dimmed'}>
                    {crumb.title}
                  </Text>
                </Group>
              </UnstyledButton>
            </Group>
          )
        })}
      </Group>
    </nav>
  )
}

export default Breadcrumb
