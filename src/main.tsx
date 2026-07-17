import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import App from './App'
import { theme } from './theme'
import { HydrationGate } from './components/HydrationGate'
import { useSettingsStore } from './store/settingsSlice'

function Root() {
  const [scheme, setScheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('widgetboard-color-scheme')
    if (stored === 'light' || stored === 'dark') return stored
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-mantine-color-scheme', scheme)
    localStorage.setItem('widgetboard-color-scheme', scheme)
  }, [scheme])

  useEffect(() => {
    useSettingsStore.getState().init()
  }, [])

  return (
    <MantineProvider theme={theme} defaultColorScheme={scheme}>
      <HydrationGate>
        <App
          onToggleScheme={() => setScheme((s) => (s === 'dark' ? 'light' : 'dark'))}
          scheme={scheme}
        />
      </HydrationGate>
    </MantineProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <Root />
  </StrictMode>
)
