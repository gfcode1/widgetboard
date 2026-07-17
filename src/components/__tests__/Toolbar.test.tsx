import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Toolbar } from '../Toolbar'
import { useStore } from '../../store/useStore'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider defaultColorScheme="dark">{children}</MantineProvider>
}

beforeEach(() => {
  vi.stubGlobal('innerWidth', 1920)
  vi.stubGlobal('innerHeight', 1080)

  useStore.setState({
    boards: { root: [] },
    currentBoardId: null,
    navigationStack: [],
    history: [{ boards: { root: [] }, canvasElements: [], connections: [] }],
    historyIndex: 0,
    selectedIds: [],
    selectedWidgetId: null,
    selectedElementId: null,
    lastPushTime: 0,
    canvasElements: [],
    snapEnabled: true,
    collisionEnabled: true,
  })
})

describe('Toolbar', () => {
  it('renders undo button disabled initially', () => {
    render(<Toolbar />, { wrapper: Wrapper })
    const buttons = screen.getAllByRole('button')
    const undoBtn = buttons.find((btn) => btn.querySelector('.tabler-icon-arrow-back-up'))
    expect(undoBtn).toBeInTheDocument()
    expect(undoBtn).toBeDisabled()
  })

  it('renders redo button disabled initially', () => {
    render(<Toolbar />, { wrapper: Wrapper })
    const buttons = screen.getAllByRole('button')
    const redoBtn = buttons.find((btn) => btn.querySelector('.tabler-icon-arrow-forward-up'))
    expect(redoBtn).toBeInTheDocument()
    expect(redoBtn).toBeDisabled()
  })

  it('renders the Add widget button', () => {
    render(<Toolbar />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /add widget/i })).toBeInTheDocument()
  })

  it('renders search palette button when onOpenPalette is provided', () => {
    const onOpenPalette = vi.fn()
    render(<Toolbar onOpenPalette={onOpenPalette} />, { wrapper: Wrapper })
    const buttons = screen.getAllByRole('button')
    const searchBtn = buttons.find((btn) => btn.querySelector('.tabler-icon-search'))
    expect(searchBtn).toBeInTheDocument()
  })

  it('renders scheme toggle when onToggleScheme is provided', () => {
    const onToggleScheme = vi.fn()
    render(<Toolbar onToggleScheme={onToggleScheme} scheme="dark" />, { wrapper: Wrapper })
    const buttons = screen.getAllByRole('button')
    const sunBtn = buttons.find((btn) => btn.querySelector('.tabler-icon-sun'))
    expect(sunBtn).toBeInTheDocument()
  })

  it('renders moon icon for light scheme', () => {
    const onToggleScheme = vi.fn()
    render(<Toolbar onToggleScheme={onToggleScheme} scheme="light" />, { wrapper: Wrapper })
    const buttons = screen.getAllByRole('button')
    const moonBtn = buttons.find((btn) => btn.querySelector('.tabler-icon-moon'))
    expect(moonBtn).toBeInTheDocument()
  })

  it('does not render search palette button when onOpenPalette is not provided', () => {
    render(<Toolbar />, { wrapper: Wrapper })
    const buttons = screen.getAllByRole('button')
    const searchBtn = buttons.find((btn) => btn.querySelector('.tabler-icon-search'))
    expect(searchBtn).toBeUndefined()
  })

  it('renders settings button when onOpenSettings is provided', () => {
    const onOpenSettings = vi.fn()
    render(<Toolbar onOpenSettings={onOpenSettings} />, { wrapper: Wrapper })
    const buttons = screen.getAllByRole('button')
    const settingsBtn = buttons.find((btn) => btn.querySelector('.tabler-icon-settings'))
    expect(settingsBtn).toBeInTheDocument()
  })

  it('has toolbar role on the container', () => {
    render(<Toolbar />, { wrapper: Wrapper })
    expect(screen.getByRole('toolbar')).toBeInTheDocument()
  })
})
