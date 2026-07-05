import { useState, useCallback, lazy, Suspense } from 'react'
import { Box, Center, Loader } from '@mantine/core'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { Onboarding } from './components/Onboarding'
import { CommandPalette } from './components/CommandPalette'
import { Breadcrumb } from './components/Breadcrumb'
import { Minimap } from './components/Minimap'

const BoardModal = lazy(() => import('./components/BoardModal'))
const ShortcutsModal = lazy(() => import('./components/ShortcutsModal'))
const AgentPanel = lazy(() => import('./components/AgentPanel'))

function ModalFallback() {
  return (
    <Center h="100%" w="100%">
      <Loader size="sm" color="violet" />
    </Center>
  )
}

interface AppProps {
  onToggleScheme: () => void
  scheme: 'dark' | 'light'
}

function App({ onToggleScheme, scheme }: AppProps) {
  const [openBoardId, setOpenBoardId] = useState<string | null>(null)

  const handleOpenBoard = useCallback((boardId: string) => {
    setOpenBoardId(boardId)
  }, [])

  const handleCloseBoard = useCallback(() => {
    setOpenBoardId(null)
  }, [])

  return (
    <Box w="100%" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Toolbar onToggleScheme={onToggleScheme} scheme={scheme} />
      <Canvas onOpenBoard={handleOpenBoard} />
      <Breadcrumb />
      <Minimap />
      <Onboarding />
      <CommandPalette onToggleScheme={onToggleScheme} scheme={scheme} />
      <Suspense fallback={<ModalFallback />}>
        <ShortcutsModal />
        <AgentPanel />
      </Suspense>
      {openBoardId && (
        <Suspense fallback={<ModalFallback />}>
          <BoardModal
            initialBoardId={openBoardId}
            onClose={handleCloseBoard}
          />
        </Suspense>
      )}
    </Box>
  )
}

export default App
