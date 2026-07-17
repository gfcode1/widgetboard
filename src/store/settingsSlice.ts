import { create } from 'zustand'

export type AccentColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose'
export type CanvasBg = 'dot-grid' | 'line-grid' | 'solid'

interface SettingsState {
  accentColor: AccentColor
  canvasBg: CanvasBg
  setAccentColor: (color: AccentColor) => void
  setCanvasBg: (bg: CanvasBg) => void
  init: () => void
}

const ACCENT_VALUES: Record<AccentColor, { hex: string; rgb: string }> = {
  violet: { hex: '#8b5cf6', rgb: '139, 92, 246' },
  blue: { hex: '#3b82f6', rgb: '59, 130, 246' },
  emerald: { hex: '#10b981', rgb: '16, 185, 129' },
  amber: { hex: '#f59e0b', rgb: '245, 158, 11' },
  rose: { hex: '#f43f5e', rgb: '244, 63, 94' },
}

function applyAccent(color: AccentColor) {
  const values = ACCENT_VALUES[color]
  document.documentElement.style.setProperty('--wb-accent', values.hex)
  document.documentElement.style.setProperty('--wb-accent-rgb', values.rgb)
  document.documentElement.setAttribute('data-accent', color)
}

function applyCanvasBg(bg: CanvasBg) {
  document.documentElement.setAttribute('data-canvas-bg', bg)
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  accentColor: 'violet',
  canvasBg: 'dot-grid',
  setAccentColor: (color) => {
    applyAccent(color)
    localStorage.setItem('widgetboard-accent', color)
    set({ accentColor: color })
  },
  setCanvasBg: (bg) => {
    applyCanvasBg(bg)
    localStorage.setItem('widgetboard-canvas-bg', bg)
    set({ canvasBg: bg })
  },
  init: () => {
    const savedAccent = (localStorage.getItem('widgetboard-accent') || 'violet') as AccentColor
    const savedBg = (localStorage.getItem('widgetboard-canvas-bg') || 'dot-grid') as CanvasBg
    applyAccent(savedAccent)
    applyCanvasBg(savedBg)
    set({ accentColor: savedAccent, canvasBg: savedBg })
  },
}))

export { ACCENT_VALUES }
