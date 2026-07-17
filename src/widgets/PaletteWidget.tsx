import { memo, useState, useCallback, useMemo } from 'react'
import { Text, Group, ActionIcon, Tooltip, Select, Badge } from '@mantine/core'
import {
  IconRefresh,
  IconLock,
  IconLockOpen,
  IconCopy,
  IconCheck,
  IconDownload,
} from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import {
  generatePalette,
  generateAnalogousPalette,
  generateComplementaryPalette,
  generateTriadicPalette,
  generateMonochromaticPalette,
  hslToHex,
  getContrastRatio,
} from '../utils/colors'
import { copyToClipboard } from '../utils/clipboard'

interface Props {
  widget: Widget
}

type GenerationMode = 'random' | 'analogous' | 'complementary' | 'triadic' | 'monochromatic'

const MODES: { value: GenerationMode; label: string }[] = [
  { value: 'random', label: 'Random' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'monochromatic', label: 'Monochromatic' },
]

function generateByMode(mode: GenerationMode, count: number): string[] {
  switch (mode) {
    case 'random':
      return generatePalette(count)
    case 'analogous':
      return generateAnalogousPalette(count)
    case 'complementary':
      return generateComplementaryPalette()
    case 'triadic':
      return generateTriadicPalette()
    case 'monochromatic':
      return generateMonochromaticPalette(count)
  }
}

export const PaletteWidget = memo(function PaletteWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [genMode, setGenMode] = useState<GenerationMode>('random')
  const content =
    widget.content.type === 'palette'
      ? widget.content
      : {
          type: 'palette' as const,
          colors: generatePalette(5),
          name: 'Palette',
          locked: [false, false, false, false, false],
        }

  const regenerate = useCallback(() => {
    const newColors = content.colors
      .map((c, idx) => (content.locked[idx] ? c : null))
      .map((c, idx): string => {
        if (c) return c
        const fresh = generateByMode(genMode, content.colors.length)
        return fresh[idx] ?? generatePalette(1)[0]!
      })
    updateWidget(widget.id, { content: { ...content, colors: newColors } })
  }, [widget.id, content, genMode, updateWidget])

  const toggleLock = useCallback(
    (idx: number) => {
      const newLocked = [...content.locked]
      newLocked[idx] = !newLocked[idx]
      updateWidget(widget.id, { content: { ...content, locked: newLocked } })
    },
    [widget.id, content, updateWidget]
  )

  const copyHex = useCallback((color: string, idx: number) => {
    const hex = hslToHex(color)
    copyToClipboard(hex)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }, [])

  const exportCss = useCallback(() => {
    const css = content.colors.map((c, i) => `  --palette-${i + 1}: ${hslToHex(c)};`).join('\n')
    copyToClipboard(`:root {\n${css}\n}`)
  }, [content.colors])

  const exportTailwind = useCallback(() => {
    const config = content.colors.map((c, i) => `        ${i + 1}00: '${hslToHex(c)}',`).join('\n')
    copyToClipboard(`colors: {\n  palette: {\n${config}\n  }\n}`)
  }, [content.colors])

  const contrastRatios = useMemo(
    () =>
      content.colors.map((c) => {
        const hex = hslToHex(c)
        const onWhite = getContrastRatio(hex, '#ffffff')
        const onBlack = getContrastRatio(hex, '#000000')
        return {
          hex,
          onWhite: Math.round(onWhite * 10) / 10,
          onBlack: Math.round(onBlack * 10) / 10,
        }
      }),
    [content.colors]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Palette"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconRefresh size={12} />}
        rightSlot={
          <Group gap={4}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xs"
              onClick={regenerate}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Regenerate"
            >
              <IconRefresh size={12} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xs"
              onClick={exportCss}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Export CSS"
            >
              <IconDownload size={12} />
            </ActionIcon>
          </Group>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Group gap="xs" mb={8}>
            <Select
              data={MODES}
              value={genMode}
              onChange={(v) => v && setGenMode(v as GenerationMode)}
              size="xs"
              w={140}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <Tooltip label="Export CSS">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                onClick={exportCss}
                aria-label="Export CSS"
              >
                <IconCopy size={12} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Export Tailwind">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                onClick={exportTailwind}
                aria-label="Export Tailwind"
              >
                <IconDownload size={12} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : null}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            height: editing ? 'auto' : '100%',
          }}
        >
          {content.colors.map((color, i) => {
            const cr = contrastRatios[i]
            return (
              <Tooltip
                key={i}
                label={
                  copiedIdx === i
                    ? 'Copied!'
                    : `${cr?.hex ?? hslToHex(color)} | AA: ${(cr?.onWhite ?? 0) >= 4.5 ? 'yes' : 'no'}`
                }
                position="right"
                withArrow
              >
                <div
                  className="palette-swatch"
                  style={{
                    flex: editing ? undefined : 1,
                    height: editing ? 40 : undefined,
                    borderRadius: 'var(--wb-radius-sm)',
                    backgroundColor: color,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform var(--wb-transition-fast)',
                    position: 'relative',
                    minHeight: 28,
                  }}
                  onClick={() => copyHex(color, i)}
                  onMouseDown={(e) => e.stopPropagation()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && copyHex(color, i)}
                  aria-label={`Color ${i + 1}: ${cr?.hex ?? hslToHex(color)}`}
                >
                  {copiedIdx === i ? (
                    <IconCheck
                      size={14}
                      color="white"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                    />
                  ) : (
                    <Group gap={4} className="palette-meta" style={{ opacity: 0 }}>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="white"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLock(i)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ pointerEvents: 'auto' }}
                        aria-label={content.locked[i] ? 'Unlock color' : 'Lock color'}
                      >
                        {content.locked[i] ? <IconLock size={10} /> : <IconLockOpen size={10} />}
                      </ActionIcon>
                      <Text
                        size="xs"
                        c="white"
                        fw={500}
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {cr?.hex ?? hslToHex(color)}
                      </Text>
                      <Badge
                        size="xs"
                        variant="filled"
                        color={(cr?.onWhite ?? 0) >= 4.5 ? 'green' : 'red'}
                        style={{ fontSize: 8, padding: '0 4px' }}
                      >
                        {(cr?.onWhite ?? 0) >= 4.5 ? 'AA' : 'X'}
                      </Badge>
                    </Group>
                  )}
                </div>
              </Tooltip>
            )
          })}
        </div>
      </div>
      <style>{`
        .palette-swatch:hover { transform: scale(1.02); }
        .palette-swatch:hover .palette-meta { opacity: 1 !important; }
      `}</style>
    </div>
  )
})

export default PaletteWidget
