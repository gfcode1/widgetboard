import { useCallback, useState, useMemo } from 'react'
import { Paper, UnstyledButton, Group, Text, Stack, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import type { WidgetType } from '../types'
import {
  WIDGET_REGISTRY,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  type WidgetCategory,
} from '../widgets/registry'

interface WidgetMenuProps {
  onSelect: (type: WidgetType) => void
  onClose: () => void
}

export function WidgetMenu({ onSelect, onClose }: WidgetMenuProps) {
  const [filter, setFilter] = useState('')

  const grouped = useMemo(() => {
    const items = filter.trim()
      ? WIDGET_REGISTRY.filter((item) => {
          const q = filter.toLowerCase()
          return (
            item.label.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
          )
        })
      : WIDGET_REGISTRY

    const map = new Map<WidgetCategory, typeof items>()
    for (const item of items) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [filter])

  const handleSelect = useCallback(
    (type: WidgetType) => {
      onSelect(type)
      onClose()
    },
    [onSelect, onClose]
  )

  const visibleCategories = CATEGORY_ORDER.filter(
    (cat) => grouped.has(cat) && grouped.get(cat)!.length > 0
  )

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={onClose}
      />
      <Paper
        shadow="xl"
        radius="md"
        withBorder
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          width: 320,
          zIndex: 50,
          backgroundColor: 'var(--wb-surface)',
          borderColor: 'var(--wb-border)',
          overflow: 'hidden',
          boxShadow: 'var(--wb-shadow-lg)',
        }}
      >
        <Text
          size="xs"
          tt="uppercase"
          fw={600}
          c="dimmed"
          px="sm"
          py={8}
          style={{ borderBottom: '1px solid var(--wb-border)' }}
        >
          Add Widget
        </Text>
        <div style={{ padding: '6px 6px 2px' }}>
          <TextInput
            placeholder="Search widgets..."
            size="xs"
            leftSection={<IconSearch size={12} />}
            value={filter}
            onChange={(e) => setFilter(e.currentTarget.value)}
            variant="filled"
            radius="md"
            autoFocus
            styles={{
              input: {
                backgroundColor: 'var(--wb-surface-hover)',
                borderColor: 'var(--wb-border)',
                color: 'var(--wb-text)',
                fontSize: 12,
                height: 30,
              },
            }}
          />
        </div>
        <div
          style={{
            maxHeight: 420,
            overflowY: 'auto',
            padding: '4px 4px 6px',
          }}
        >
          {visibleCategories.length === 0 ? (
            <Text size="xs" c="dimmed" ta="center" py="md">
              No widgets found
            </Text>
          ) : (
            <Stack gap={0}>
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
                        onClick={() => handleSelect(item.type)}
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
                        <Group gap="sm">
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
          )}
        </div>
      </Paper>
    </>
  )
}
