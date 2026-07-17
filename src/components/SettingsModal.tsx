import { Modal, Stack, Group, Text, UnstyledButton, Paper } from '@mantine/core'
import {
  useSettingsStore,
  type AccentColor,
  type CanvasBg,
  ACCENT_VALUES,
} from '../store/settingsSlice'
import { IconCheck } from '@tabler/icons-react'

interface SettingsModalProps {
  opened: boolean
  onClose: () => void
}

const ACCENTS: { key: AccentColor; label: string }[] = [
  { key: 'violet', label: 'Violet' },
  { key: 'blue', label: 'Blue' },
  { key: 'emerald', label: 'Emerald' },
  { key: 'amber', label: 'Amber' },
  { key: 'rose', label: 'Rose' },
]

const BACKGROUNDS: { key: CanvasBg; label: string; desc: string }[] = [
  { key: 'dot-grid', label: 'Dot Grid', desc: 'Subtle dot pattern' },
  { key: 'line-grid', label: 'Line Grid', desc: 'Crosshatch grid lines' },
  { key: 'solid', label: 'Solid', desc: 'Plain background' },
]

export function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const accentColor = useSettingsStore((s) => s.accentColor)
  const canvasBg = useSettingsStore((s) => s.canvasBg)
  const setAccentColor = useSettingsStore((s) => s.setAccentColor)
  const setCanvasBg = useSettingsStore((s) => s.setCanvasBg)

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="sm">
          Settings
        </Text>
      }
      size="sm"
      centered
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      styles={{
        content: {
          backgroundColor: 'var(--wb-surface-solid)',
          border: '1px solid var(--wb-border-solid)',
        },
        header: {
          backgroundColor: 'var(--wb-surface-solid)',
          borderBottom: '1px solid var(--wb-border)',
        },
        title: {
          color: 'var(--wb-text)',
        },
      }}
    >
      <Stack gap="lg" py="sm">
        <div>
          <Text size="xs" fw={600} c="dimmed" mb="sm" tt="uppercase">
            Accent Color
          </Text>
          <Group gap="sm">
            {ACCENTS.map((a) => {
              const isActive = accentColor === a.key
              const rgb = ACCENT_VALUES[a.key].rgb
              return (
                <UnstyledButton
                  key={a.key}
                  onClick={() => setAccentColor(a.key)}
                  aria-label={`${a.label} accent`}
                  title={a.label}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: ACCENT_VALUES[a.key].hex,
                    border: isActive ? '3px solid white' : '3px solid transparent',
                    boxShadow: isActive ? `0 0 12px rgba(${rgb}, 0.5)` : 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: '2px solid transparent',
                    outlineOffset: 2,
                  }}
                >
                  {isActive && <IconCheck size={14} color="white" />}
                </UnstyledButton>
              )
            })}
          </Group>
        </div>

        <div>
          <Text size="xs" fw={600} c="dimmed" mb="sm" tt="uppercase">
            Canvas Background
          </Text>
          <Stack gap="xs">
            {BACKGROUNDS.map((b) => {
              const isActive = canvasBg === b.key
              return (
                <Paper
                  key={b.key}
                  p="sm"
                  radius="md"
                  withBorder
                  style={{
                    backgroundColor: isActive
                      ? 'var(--wb-accent-subtle)'
                      : 'var(--wb-surface-hover)',
                    borderColor: isActive ? 'var(--wb-accent)' : 'var(--wb-border)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  onClick={() => setCanvasBg(b.key)}
                >
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={500} c="gray.2">
                        {b.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {b.desc}
                      </Text>
                    </div>
                    {isActive && <IconCheck size={14} color="var(--wb-accent)" />}
                  </Group>
                </Paper>
              )
            })}
          </Stack>
        </div>
      </Stack>
    </Modal>
  )
}
