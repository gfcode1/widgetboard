import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import App from './App'
import { theme } from './theme'

function Root() {
  const [scheme, setScheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('widgetboard-color-scheme')
    if (stored === 'light' || stored === 'dark') return stored
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-mantine-color-scheme', scheme)
    localStorage.setItem('widgetboard-color-scheme', scheme)
  }, [scheme])

  return (
    <MantineProvider theme={theme} defaultColorScheme={scheme}>
      <App onToggleScheme={() => setScheme((s) => (s === 'dark' ? 'light' : 'dark'))} scheme={scheme} />
    </MantineProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <Root />
  </StrictMode>,
)
