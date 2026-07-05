import { useMemo } from 'react'
import { Drawer, Stack, UnstyledButton, Group, Text } from '@mantine/core'
import type { WidgetType } from '../types'
import {
  WIDGET_REGISTRY,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
} from '../widgets/registry'

interface MobileWidgetSheetProps {
  opened: boolean
  onClose: () => void
  onSelect: (type: WidgetType) => void
}

export function MobileWidgetSheet({ opened, onClose, onSelect }: MobileWidgetSheetProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof WIDGET_REGISTRY>()
    for (const item of WIDGET_REGISTRY) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [])

  const visibleCategories = CATEGORY_ORDER.filter(
    (cat) => grouped.has(cat) && grouped.get(cat)!.length > 0
  )

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      withCloseButton={false}
      radius="md"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      styles={{
        content: {
          backgroundColor: 'var(--wb-surface)',
          maxHeight: '80vh',
          overflow: 'hidden',
        },
        body: {
          overflowY: 'auto',
          maxHeight: 'calc(80vh - 60px)',
        },
        header: {
          backgroundColor: 'var(--wb-surface)',
          padding: 0,
        },
      }}
    >
      {/* Handle bar */}
      <div
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'var(--wb-border)',
          margin: '8px auto 12px',
        }}
      />
      <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb="sm" px="sm">
        Add Widget
      </Text>
      <Stack gap={0} p={4}>
        {visibleCategories.map((cat, catIdx) => {
          const widgets = grouped.get(cat)!
          return (
            <div key={cat}>
              {catIdx > 0 && (
                <div
                  style={{
                    height: 1,
                    backgroundColor: 'var(--wb-border)',
                    margin: '4px 8px',
                  }}
                />
              )}
              <Text
                size="xs"
                tt="uppercase"
                fw={600}
                c="dimmed"
                px="sm"
                pt={catIdx === 0 ? 4 : 8}
                pb={4}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
              {widgets.map((item) => (
                <UnstyledButton
                  key={item.type}
                  onClick={() => {
                    onSelect(item.type)
                    onClose()
                  }}
                  p="sm"
                  style={{ borderRadius: 'var(--mantine-radius-md)', width: '100%' }}
                  styles={{
                    root: {
                      transition: 'background-color 150ms ease',
                      '&:hover': {
                        backgroundColor: 'var(--wb-accent-subtle)',
                      },
                    },
                  }}
                >
                  <Group gap="md">
                    <div style={{ color: 'var(--wb-text-dimmed)' }}>
                      {item.icon}
                    </div>
                    <div>
                      <Text size="sm" c="gray.2" fw={500}>
                        {item.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.description}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              ))}
            </div>
          )
        })}
      </Stack>
    </Drawer>
  )
}
