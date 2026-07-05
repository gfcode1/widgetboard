import { memo, useState, useCallback } from 'react'
import { Text, Group, ActionIcon, Tooltip } from '@mantine/core'
import { IconRefresh, IconLock, IconLockOpen, IconCopy, IconCheck } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'

interface Props {
  widget: Widget
}

function generatePalette(count: number): string[] {
  const baseHue = Math.random() * 360
  return Array.from({ length: count }, (_, i) => {
    const hue = (baseHue + (i * 360) / count) % 360
    const sat = 55 + Math.random() * 30
    const light = 45 + Math.random() * 20
    return `hsl(${Math.round(hue)}, ${Math.round(sat)}%, ${Math.round(light)}%)`
  })
}

function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return hsl
  const h = Number(match[1]) / 360
  const s = Number(match[2]) / 100
  const l = Number(match[3]) / 100
  let r = 0, g = 0, b = 0
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export const PaletteWidget = memo(function PaletteWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const content = widget.content.type === 'palette'
    ? widget.content
    : { type: 'palette' as const, colors: generatePalette(5), name: 'Palette', locked: [false, false, false, false, false] }

  const regenerate = useCallback(() => {
    const newColors = content.colors.map((c, idx) => content.locked[idx] ? c : null).map((c) => {
      if (c) return c
      return generatePalette(1)[0]
    })
    updateWidget(widget.id, {
      content: { ...content, colors: newColors },
    })
  }, [widget.id, content, updateWidget])

  const toggleLock = useCallback((idx: number) => {
    const newLocked = [...content.locked]
    newLocked[idx] = !newLocked[idx]
    updateWidget(widget.id, {
      content: { ...content, locked: newLocked },
    })
  }, [widget.id, content, updateWidget])

  const copyHex = useCallback((color: string, idx: number) => {
    const hex = hslToHex(color)
    navigator.clipboard.writeText(hex).catch(() => {})
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }, [])

  const exportCss = useCallback(() => {
    const css = content.colors.map((c, i) => `  --palette-${i + 1}: ${hslToHex(c)};`).join('\n')
    navigator.clipboard.writeText(`:root {\n${css}\n}`).catch(() => {})
  }, [content.colors])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Palette"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconRefresh size={12} />}
        rightSlot={
          <Group gap={4}>
            <ActionIcon variant="subtle" color="gray" size="xs" onClick={regenerate} onMouseDown={(e) => e.stopPropagation()}>
              <IconRefresh size={12} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" size="xs" onClick={exportCss} onMouseDown={(e) => e.stopPropagation()}>
              <IconCopy size={12} />
            </ActionIcon>
          </Group>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}>
          {content.colors.map((color, i) => (
            <Tooltip key={i} label={copiedIdx === i ? 'Copied!' : hslToHex(color)} position="right" withArrow>
              <div
                className="palette-swatch"
                style={{
                  flex: 1,
                  borderRadius: 'var(--wb-radius-sm)',
                  backgroundColor: color,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform var(--wb-transition-fast)',
                  position: 'relative',
                  minHeight: 24,
                }}
                onClick={() => copyHex(color, i)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {copiedIdx === i ? (
                  <IconCheck size={14} color="white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                ) : (
                  <Group gap={4} style={{ opacity: 0 }}>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="white"
                      onClick={(e) => { e.stopPropagation(); toggleLock(i) }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ pointerEvents: 'auto' }}
                    >
                      {content.locked[i] ? <IconLock size={10} /> : <IconLockOpen size={10} />}
                    </ActionIcon>
                    <Text size="xs" c="white" fw={500} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {hslToHex(color)}
                    </Text>
                  </Group>
                )}
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
      <style>{`
        .palette-swatch:hover { transform: scale(1.02); }
        .palette-swatch:hover > div:last-child { opacity: 1 !important; }
      `}</style>
    </div>
  )
})

export default PaletteWidget
