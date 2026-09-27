import { useState, useMemo, useCallback } from 'react'
import { Drawer, TextInput, Text, Group, ScrollArea, UnstyledButton, Collapse } from '@mantine/core'
import {
  IconSearch,
  IconLayoutDashboard,
  IconUsersGroup,
  IconChevronRight,
} from '@tabler/icons-react'
import type { Widget, GroupElement } from '../types'
import { WIDGET_MAP } from '../widgets/registry'

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

function getWidgetPreview(widget: Widget): string {
  const c = widget.content
  switch (c.type) {
    case 'note':
      return c.text.slice(0, 60).replace(/\n/g, ' ') || 'Empty'
    case 'sticky':
      return c.text.slice(0, 60).replace(/\n/g, ' ') || 'Empty'
    case 'quote':
      return `"${c.text.slice(0, 50)}" — ${c.author || '?'}`
    case 'todo':
      return c.items.length === 0
        ? 'No tasks'
        : `${c.items.filter((i) => i.done).length}/${c.items.length} done`
    case 'kanban':
      return `${c.columns.length} columns, ${c.columns.reduce((sum, col) => sum + col.cards.length, 0)} cards`
    case 'bookmark':
      return `${c.bookmarks.length} bookmarks`
    case 'link':
      return c.links.length > 0
        ? c.links[c.activeIndex]?.title || c.links[c.activeIndex]?.url || '—'
        : 'No links'
    case 'embed':
      return c.url || 'No URL'
    case 'worldclock':
      return c.clocks.map((cl) => cl.city).join(', ') || 'No cities'
    case 'weather':
      return c.locations.map((l) => l.city).join(', ') || 'No locations'
    case 'calc':
      return c.result ? `= ${c.result}` : c.expr || 'Ready'
    case 'calendar':
      return `${c.events.length} events`
    case 'search':
      return c.recentSearches.length > 0 ? (c.recentSearches[0] ?? 'No searches') : 'No searches'
    case 'clipboard':
      return `${c.entries.length} entries`
    case 'snippet':
      return `${c.snippets.length} snippets`
    case 'palette':
      return c.name || `${c.colors.length} colors`
    case 'expense':
      return c.items.length > 0
        ? `${c.currency} ${c.items.reduce((sum, i) => sum + i.amount, 0)} total`
        : 'No expenses'
    case 'rss':
      return c.feeds.length > 0 ? c.feeds.map((f) => f.title || f.url).join(', ') : 'No feeds'
    case 'countdown':
      return c.countdowns.map((cd) => cd.label).join(', ') || 'No countdowns'
    case 'pomodoro-stats':
      return `${c.sessions.length} sessions`
    case 'habit':
      return `${c.habits.length} habits`
    case 'timer':
      return c.mode === 'stopwatch' ? 'Stopwatch' : 'Countdown'
    case 'board':
      return c.title || 'Nested board'
    case 'pomodoro':
      return `${c.workMin}m work / ${c.breakMin}m break`
    case 'image':
      return c.alt || c.src || 'Image'
    case 'clock':
      return c.showSeconds ? 'HH:MM:SS' : 'HH:MM'
    default:
      return ''
  }
}

interface WidgetListDrawerProps {
  widgets: Widget[]
  groups: GroupElement[]
  opened: boolean
  onClose: () => void
  onSelect: (widgetId: string) => void
  onSelectGroup: (groupId: string) => void
}

export function WidgetListDrawer({
  widgets,
  groups,
  opened,
  onClose,
  onSelect,
  onSelectGroup,
}: WidgetListDrawerProps) {
  const [filter, setFilter] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const toggleGroupExpand = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }, [])

  const filteredWidgets = useMemo(() => {
    const q = filter.trim()
    if (!q) return widgets
    return widgets.filter((w) => {
      const meta = WIDGET_MAP[w.type]
      const label = meta?.label || w.type
      const preview = getWidgetPreview(w)
      return fuzzyMatch(label, q) || fuzzyMatch(preview, q) || fuzzyMatch(w.type, q)
    })
  }, [widgets, filter])

  const filteredGroups = useMemo(() => {
    const q = filter.trim()
    if (!q) return groups
    return groups.filter((g) => {
      if (fuzzyMatch(g.title, q)) return true
      // Also search widget names inside the group
      const groupWidgetIds = Object.keys(g.relativeWidgets)
      return groupWidgetIds.some((wid) => {
        const widget = widgets.find((w) => w.id === wid)
        if (!widget) return false
        const meta = WIDGET_MAP[widget.type]
        const label = meta?.label || widget.type
        return fuzzyMatch(label, q)
      })
    })
  }, [groups, widgets, filter])

  const handleSelect = useCallback(
    (widgetId: string) => {
      onSelect(widgetId)
      onClose()
      setFilter('')
    },
    [onSelect, onClose]
  )

  const handleSelectGroup = useCallback(
    (groupId: string) => {
      onSelectGroup(groupId)
      onClose()
      setFilter('')
    },
    [onSelectGroup, onClose]
  )

  const handleClose = useCallback(() => {
    setFilter('')
    onClose()
  }, [onClose])

  const visibleGroups = filter ? filteredGroups : groups
  const visibleWidgets = filter ? filteredWidgets : widgets

  // Widgets not in any group
  const ungroupedWidgets = useMemo(() => {
    const groupWidgetIds = new Set(groups.flatMap((g) => Object.keys(g.relativeWidgets)))
    return visibleWidgets.filter((w) => !groupWidgetIds.has(w.id))
  }, [visibleWidgets, groups])

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="left"
      size="xs"
      withCloseButton={false}
      radius="md"
      overlayProps={{ backgroundOpacity: 0.3, blur: 2 }}
      styles={{
        content: {
          backgroundColor: 'var(--wb-surface)',
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
        },
        body: {
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '0 12px 12px',
        },
        header: {
          backgroundColor: 'var(--wb-surface)',
          padding: 0,
          minHeight: 0,
        },
      }}
    >
      <Group px="md" py="sm" gap={8}>
        <IconLayoutDashboard size={18} color="var(--wb-accent)" />
        <Text fw={600} size="sm" c="var(--wb-text)">
          Navigator
        </Text>
        <Text size="xs" c="dimmed">
          {widgets.length + groups.length}
        </Text>
      </Group>

      <div style={{ padding: '0 12px 8px' }}>
        <TextInput
          placeholder="Search widgets & groups..."
          size="xs"
          leftSection={<IconSearch size={14} />}
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
          variant="filled"
          radius="md"
          styles={{
            input: {
              backgroundColor: 'var(--wb-surface-hover)',
              borderColor: 'var(--wb-border)',
              color: 'var(--wb-text)',
              fontSize: 13,
            },
          }}
        />
      </div>

      <ScrollArea.Autosize mah="100%" type="scroll" offsetScrollbars>
        {visibleGroups.length === 0 && ungroupedWidgets.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            {filter ? 'No matching items' : 'No widgets or groups on this board'}
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Groups Section */}
            {visibleGroups.length > 0 && (
              <>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="xs" pt="xs" pb={4}>
                  Groups ({visibleGroups.length})
                </Text>
                {visibleGroups.map((g) => {
                  const isExpanded = expandedGroups[g.id] ?? false
                  const groupWidgetIds = Object.keys(g.relativeWidgets)
                  const groupWidgets = groupWidgetIds
                    .map((wid) => widgets.find((w) => w.id === wid))
                    .filter(Boolean) as Widget[]

                  return (
                    <div key={g.id}>
                      <UnstyledButton
                        onClick={() => handleSelectGroup(g.id)}
                        style={{
                          borderRadius: 'var(--wb-radius)',
                          padding: '8px 10px',
                          transition: 'background-color 120ms ease',
                          width: '100%',
                        }}
                        styles={{
                          root: {
                            '&:hover': {
                              backgroundColor: 'var(--wb-surface-hover)',
                            },
                          },
                        }}
                      >
                        <Group gap="sm" wrap="nowrap" align="center">
                          <div
                            style={{
                              color: 'var(--wb-accent)',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <IconUsersGroup size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text size="sm" fw={500} c="var(--wb-text)" truncate>
                              {g.title || 'Untitled Group'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {groupWidgetIds.length} widget{groupWidgetIds.length !== 1 ? 's' : ''}
                            </Text>
                          </div>
                          {groupWidgetIds.length > 0 && (
                            <UnstyledButton
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleGroupExpand(g.id)
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: 2,
                              }}
                            >
                              <IconChevronRight
                                size={14}
                                color="var(--wb-text-dimmed)"
                                style={{
                                  transform: isExpanded ? 'rotate(90deg)' : 'none',
                                  transition: 'transform 0.15s ease',
                                }}
                              />
                            </UnstyledButton>
                          )}
                        </Group>
                      </UnstyledButton>
                      <Collapse in={isExpanded}>
                        <div style={{ paddingLeft: 28, paddingBottom: 4 }}>
                          {groupWidgets.map((w) => {
                            const meta = WIDGET_MAP[w.type]
                            return (
                              <UnstyledButton
                                key={w.id}
                                onClick={() => handleSelect(w.id)}
                                style={{
                                  borderRadius: 'var(--wb-radius)',
                                  padding: '6px 10px',
                                  transition: 'background-color 120ms ease',
                                  width: '100%',
                                }}
                                styles={{
                                  root: {
                                    '&:hover': {
                                      backgroundColor: 'var(--wb-surface-hover)',
                                    },
                                  },
                                }}
                              >
                                <Group gap="xs" wrap="nowrap" align="flex-start">
                                  <div
                                    style={{
                                      color: 'var(--wb-accent)',
                                      flexShrink: 0,
                                      marginTop: 2,
                                    }}
                                  >
                                    {meta ? (
                                      <span style={{ display: 'flex' }}>{meta.icon}</span>
                                    ) : (
                                      <IconLayoutDashboard size={14} />
                                    )}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text size="xs" fw={500} c="var(--wb-text)">
                                      {meta?.label || w.type}
                                    </Text>
                                    {getWidgetPreview(w) && (
                                      <Text size="xs" c="dimmed" truncate style={{ fontSize: 11 }}>
                                        {getWidgetPreview(w)}
                                      </Text>
                                    )}
                                  </div>
                                </Group>
                              </UnstyledButton>
                            )
                          })}
                        </div>
                      </Collapse>
                    </div>
                  )
                })}
              </>
            )}

            {/* Ungrouped Widgets Section */}
            {ungroupedWidgets.length > 0 && (
              <>
                <Text
                  size="xs"
                  fw={600}
                  c="dimmed"
                  tt="uppercase"
                  px="xs"
                  pt={visibleGroups.length > 0 ? 'xs' : undefined}
                  pb={4}
                >
                  Widgets ({ungroupedWidgets.length})
                </Text>
                {ungroupedWidgets.map((w) => {
                  const meta = WIDGET_MAP[w.type]
                  return (
                    <UnstyledButton
                      key={w.id}
                      onClick={() => handleSelect(w.id)}
                      style={{
                        borderRadius: 'var(--wb-radius)',
                        padding: '8px 10px',
                        transition: 'background-color 120ms ease',
                      }}
                      styles={{
                        root: {
                          '&:hover': {
                            backgroundColor: 'var(--wb-surface-hover)',
                          },
                        },
                      }}
                    >
                      <Group gap="sm" wrap="nowrap" align="flex-start">
                        <div
                          style={{
                            color: 'var(--wb-accent)',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          {meta ? (
                            <span style={{ display: 'flex' }}>{meta.icon}</span>
                          ) : (
                            <IconLayoutDashboard size={18} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} c="var(--wb-text)">
                            {meta?.label || w.type}
                          </Text>
                          {getWidgetPreview(w) && (
                            <Text size="xs" c="dimmed" truncate>
                              {getWidgetPreview(w)}
                            </Text>
                          )}
                        </div>
                        {w.locked && (
                          <Text size="xs" c="dimmed" fs="italic" style={{ flexShrink: 0 }}>
                            locked
                          </Text>
                        )}
                      </Group>
                    </UnstyledButton>
                  )
                })}
              </>
            )}
          </div>
        )}
      </ScrollArea.Autosize>
    </Drawer>
  )
}
