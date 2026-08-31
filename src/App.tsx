import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { Box, Center, Loader } from '@mantine/core'
import { Canvas } from './components/Canvas'
import { CanvasErrorBoundary } from './components/CanvasErrorBoundary'
import { Toolbar } from './components/Toolbar'
import { Onboarding } from './components/Onboarding'
import { CommandPalette } from './components/CommandPalette'
import { AIChat } from './components/AIChat'
import { Breadcrumb } from './components/Breadcrumb'
import { Minimap } from './components/Minimap'
import { ToastContainer } from './components/Toast'
import { SettingsModal } from './components/SettingsModal'

const BoardModal = lazy(() => import('./components/BoardModal'))
const ShortcutsModal = lazy(() => import('./components/ShortcutsModal'))

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
  const [settingsOpened, setSettingsOpened] = useState(false)
  const [paletteOpened, setPaletteOpened] = useState(false)
  const [aiChatOpened, setAiChatOpened] = useState(false)
  const [pendingAIQuery, setPendingAIQuery] = useState<string>('')

  const handleOpenBoard = useCallback((boardId: string) => {
    setOpenBoardId(boardId)
  }, [])

  const handleCloseBoard = useCallback(() => {
    setOpenBoardId(null)
  }, [])

  const handleAskAI = useCallback((query: string) => {
    setPendingAIQuery(query)
    setAiChatOpened(true)
  }, [])

  const handleAIQueryConsumed = useCallback(() => {
    setPendingAIQuery('')
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setAiChatOpened((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <Box w="100%" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <a
        href="#canvas"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = 'static'
          e.currentTarget.style.width = 'auto'
          e.currentTarget.style.height = 'auto'
          e.currentTarget.style.overflow = 'visible'
        }}
        onBlur={(e) => {
          e.currentTarget.style.position = 'absolute'
          e.currentTarget.style.width = '1px'
          e.currentTarget.style.height = '1px'
          e.currentTarget.style.overflow = 'hidden'
        }}
      >
        Skip to canvas
      </a>
      <Toolbar
        onToggleScheme={onToggleScheme}
        scheme={scheme}
        onOpenSettings={() => setSettingsOpened(true)}
        onOpenPalette={() => setPaletteOpened(true)}
        onOpenAI={() => setAiChatOpened(true)}
      />
      <main id="canvas" role="main" aria-label="Widget canvas" style={{ flex: 1 }}>
        <CanvasErrorBoundary>
          <Canvas onOpenBoard={handleOpenBoard} />
        </CanvasErrorBoundary>
      </main>
      <Breadcrumb />
      <Minimap />
      <Onboarding />
      <CommandPalette
        open={paletteOpened}
        onOpen={() => setPaletteOpened(true)}
        onClose={() => setPaletteOpened(false)}
        onAskAI={handleAskAI}
      />
      <AIChat
        open={aiChatOpened}
        onClose={() => setAiChatOpened(false)}
        initialQuery={pendingAIQuery}
        onQueryConsumed={handleAIQueryConsumed}
      />
      <Suspense fallback={<ModalFallback />}>
        <ShortcutsModal />
      </Suspense>
      {openBoardId && (
        <Suspense fallback={<ModalFallback />}>
          <BoardModal initialBoardId={openBoardId} onClose={handleCloseBoard} />
        </Suspense>
      )}
      <ToastContainer />
      <SettingsModal opened={settingsOpened} onClose={() => setSettingsOpened(false)} />
    </Box>
  )
}

export default App
