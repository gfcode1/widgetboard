import { memo, useState, useCallback, useMemo } from 'react'
import { Text, Stack, Group, ActionIcon, TextInput, NumberInput, Select, Badge } from '@mantine/core'
import { IconPlus, IconTrash, IconWallet, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  widget: Widget
}

const CATEGORIES = [
  { value: 'food', label: 'Food', color: 'orange' },
  { value: 'transport', label: 'Transport', color: 'blue' },
  { value: 'home', label: 'Home', color: 'green' },
  { value: 'fun', label: 'Fun', color: 'pink' },
  { value: 'health', label: 'Health', color: 'red' },
  { value: 'other', label: 'Other', color: 'gray' },
]

const CURRENCIES = [
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
  { value: 'GBP', label: '£ GBP' },
]

const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' }

const CATEGORY_COLORS: Record<string, string> = {
  food: 'var(--mantine-color-orange-5)',
  transport: 'var(--mantine-color-blue-5)',
  home: 'var(--mantine-color-green-5)',
  fun: 'var(--mantine-color-pink-5)',
  health: 'var(--mantine-color-red-5)',
  other: 'var(--mantine-color-gray-5)',
}

function getMonthLabel(dateStr: string): string {
  const [y, m] = dateStr.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(d)
}

export const ExpenseWidget = memo(function ExpenseWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const [editing, setEditing] = useState(false)
  const [amountInput, setAmountInput] = useState<string>('')
  const [categoryInput, setCategoryInput] = useState<string | null>('food')
  const [noteInput, setNoteInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNote, setEditNote] = useState('')

  const content = widget.content.type === 'expense'
    ? widget.content
    : { type: 'expense' as const, items: [], currency: 'EUR' }

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const currentMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  const monthItems = useMemo(() =>
    content.items.filter((i) => i.date.startsWith(currentMonth)).sort((a, b) => b.date.localeCompare(a.date)),
    [content.items, currentMonth]
  )

  const monthTotal = useMemo(() => monthItems.reduce((sum, i) => sum + i.amount, 0), [monthItems])

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    monthItems.forEach((i) => { totals[i.category] = (totals[i.category] || 0) + i.amount })
    return totals
  }, [monthItems])

  const addExpense = useCallback(() => {
    const amount = parseFloat(amountInput)
    if (!amount || amount <= 0) return
    const item = {
      id: uuidv4(),
      amount,
      category: categoryInput || 'other',
      note: noteInput,
      date: new Date().toISOString().split('T')[0],
    }
    updateWidget(widget.id, { content: { ...content, items: [item, ...content.items] } })
    setAmountInput('')
    setNoteInput('')
  }, [widget.id, content, amountInput, categoryInput, noteInput, updateWidget])

  const removeExpense = useCallback((id: string) => {
    updateWidget(widget.id, { content: { ...content, items: content.items.filter((i) => i.id !== id) } })
  }, [widget.id, content, updateWidget])

  const startEdit = useCallback((item: { id: string; note: string }) => {
    setEditingId(item.id)
    setEditNote(item.note)
  }, [])

  const saveEdit = useCallback(() => {
    if (!editingId) return
    updateWidget(widget.id, {
      content: { ...content, items: content.items.map((i) => i.id === editingId ? { ...i, note: editNote } : i) },
    })
    setEditingId(null)
  }, [widget.id, content, editingId, editNote, updateWidget])

  const symbol = SYMBOLS[content.currency] || '€'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader title="Expenses" editing={editing} onToggleEdit={() => setEditing(!editing)} icon={<IconWallet size={12} />} />
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {editing ? (
          <Stack gap="xs">
            <Select data={CURRENCIES} value={content.currency} onChange={(v) => v && updateWidget(widget.id, { content: { ...content, currency: v } })} size="xs" onMouseDown={(e) => e.stopPropagation()} />
            <NumberInput
              placeholder="Amount"
              value={amountInput}
              onChange={(v) => setAmountInput(String(v))}
              onMouseDown={(e) => e.stopPropagation()}
              size="xs"
              min={0}
              decimalSeparator=","
              prefix={symbol}
            />
            <Select data={CATEGORIES} value={categoryInput} onChange={setCategoryInput} size="xs" onMouseDown={(e) => e.stopPropagation()} />
            <TextInput placeholder="Note" value={noteInput} onChange={(e) => setNoteInput(e.currentTarget.value)} onMouseDown={(e) => e.stopPropagation()} size="xs" />
            <ActionIcon variant="light" color="violet" size="sm" onClick={addExpense} onMouseDown={(e) => e.stopPropagation()}>
              <IconPlus size={14} />
            </ActionIcon>
          </Stack>
        ) : (
          <>
            <Group justify="space-between" mb={8}>
              <Group gap={4}>
                <ActionIcon variant="subtle" color="gray" size="xs" onClick={prevMonth} aria-label="Previous month"><IconChevronLeft size={14} /></ActionIcon>
                <Text size="xs" c="dimmed">{getMonthLabel(currentMonth)}</Text>
                <ActionIcon variant="subtle" color="gray" size="xs" onClick={nextMonth} aria-label="Next month"><IconChevronRight size={14} /></ActionIcon>
                {!isCurrentMonth && (
                  <Badge size="xs" variant="light" color="violet" style={{ cursor: 'pointer' }} onClick={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()) }}>
                    Today
                  </Badge>
                )}
              </Group>
              <Text size="sm" fw={700} c="gray.1" style={{ fontVariantNumeric: 'tabular-nums' }}>{symbol}{monthTotal.toFixed(2)}</Text>
            </Group>

            {Object.keys(categoryTotals).length > 0 && (
              <div style={{ display: 'flex', gap: 3, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                {Object.entries(categoryTotals).map(([cat, total]) => {
                  const pct = monthTotal > 0 ? (total / monthTotal) * 100 : 0
                  return (
                    <div
                      key={cat}
                      style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || 'var(--mantine-color-gray-5)', minWidth: 2 }}
                      title={`${cat}: ${symbol}${total.toFixed(2)}`}
                    />
                  )
                })}
              </div>
            )}

            <Stack gap={3}>
              {monthItems.map((item) => {
                const catInfo = CATEGORIES.find((c) => c.value === item.category)
                const isEditing = editingId === item.id
                return (
                  <Group key={item.id} gap="xs" justify="space-between" p={4} style={{ borderRadius: 'var(--wb-radius-sm)', background: 'var(--wb-surface-hover)', transition: 'all 150ms ease' }}>
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                      <Badge size="xs" color={catInfo?.color || 'gray'} variant="light">{catInfo?.label || item.category}</Badge>
                      {isEditing ? (
                        <TextInput
                          value={editNote}
                          onChange={(e) => setEditNote(e.currentTarget.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                          onBlur={saveEdit}
                          size="xs"
                          autoFocus
                          variant="unstyled"
                          style={{ flex: 1, pointerEvents: 'auto' }}
                        />
                      ) : (
                        <Text size="xs" c="gray.3" truncate style={{ maxWidth: 100, cursor: 'pointer' }} onClick={() => startEdit(item)}>{item.note || '—'}</Text>
                      )}
                    </Group>
                    <Group gap="xs">
                      <Text size="xs" fw={600} c="gray.2" style={{ fontVariantNumeric: 'tabular-nums' }}>{symbol}{item.amount.toFixed(2)}</Text>
                      <ActionIcon size="xs" variant="subtle" color="red" onClick={() => removeExpense(item.id)} onMouseDown={(e) => e.stopPropagation()}>
                        <IconTrash size={10} />
                      </ActionIcon>
                    </Group>
                  </Group>
                )
              })}
              {monthItems.length === 0 && (
                <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">No expenses this month</Text>
              )}
            </Stack>
          </>
        )}
      </div>
    </div>
  )
})

export default ExpenseWidget
