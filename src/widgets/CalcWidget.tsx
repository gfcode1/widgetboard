import { memo, useState, useCallback, useRef } from 'react'
import { Text, UnstyledButton, Group, ActionIcon, Collapse } from '@mantine/core'
import { IconHistory } from '@tabler/icons-react'
import { evaluate } from 'mathjs'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'

interface Props {
  widget: Widget
}

const BASIC_BUTTONS = [
  ['C', '(', ')', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '=', '⌫'],
]

const SCIENTIFIC_BUTTONS = [
  ['sin', 'cos', 'tan', 'π'],
  ['log', 'ln', '√', '^'],
  ['!', 'abs', 'e', '%'],
]

function safeEval(expr: string): number | null {
  try {
    const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
    const result = evaluate(sanitized)
    if (typeof result !== 'number' || !isFinite(result)) return null
    return Math.round(result * 1e10) / 1e10
  } catch {
    return null
  }
}

export const CalcWidget = memo(function CalcWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const content = widget.content.type === 'calc' ? widget.content : { type: 'calc' as const }
  const [expr, setExpr] = useState(content.expr ?? '')
  const [result, setResult] = useState(content.result ?? '')
  const [history, setHistory] = useState(content.history ?? [])
  const [showHistory, setShowHistory] = useState(false)
  const [scientific, setScientific] = useState(false)
  const [error, setError] = useState('')
  const exprRef = useRef(expr)
  exprRef.current = expr

  const persistState = useCallback((newExpr: string, newResult: string, newHistory: typeof history) => {
    setExpr(newExpr)
    setResult(newResult)
    setHistory(newHistory)
    updateWidget(widget.id, { content: { type: 'calc', expr: newExpr, result: newResult, history: newHistory } })
  }, [widget.id, updateWidget])

  const handleButton = useCallback((btn: string) => {
    setError('')
    if (btn === 'C') {
      persistState('', '', history)
    } else if (btn === '⌫') {
      persistState(exprRef.current.slice(0, -1), '', history)
    } else if (btn === '=') {
      const r = safeEval(exprRef.current)
      if (r !== null) {
        const resultStr = String(r)
        const newHistory = [{ expr: exprRef.current, result: resultStr, timestamp: Date.now() }, ...history].slice(0, 20)
        persistState(resultStr, resultStr, newHistory)
      } else if (exprRef.current) {
        setError('Invalid expression')
      }
    } else if (btn === 'π') {
      persistState(exprRef.current + 'pi', '', history)
    } else if (btn === 'e') {
      persistState(exprRef.current + 'e', '', history)
    } else if (btn === '√') {
      persistState(exprRef.current + 'sqrt(', '', history)
    } else if (btn === 'sin' || btn === 'cos' || btn === 'tan' || btn === 'log' || btn === 'ln' || btn === 'abs') {
      persistState(exprRef.current + btn + '(', '', history)
    } else if (btn === '!') {
      persistState(exprRef.current + '!', '', history)
    } else if (btn === '^') {
      persistState(exprRef.current + '^', '', history)
    } else if (btn === '%') {
      persistState(exprRef.current + '/100', '', history)
    } else {
      persistState(exprRef.current + btn, '', history)
    }
  }, [history, persistState])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const key = e.key
    if (key >= '0' && key <= '9') handleButton(key)
    else if (key === '+') handleButton('+')
    else if (key === '-') handleButton('−')
    else if (key === '*') handleButton('×')
    else if (key === '/') { e.preventDefault(); handleButton('÷') }
    else if (key === '.') handleButton('.')
    else if (key === '(' || key === ')') handleButton(key)
    else if (key === '^') handleButton('^')
    else if (key === 'Enter' || key === '=') handleButton('=')
    else if (key === 'Escape') handleButton('C')
    else if (key === 'Backspace') handleButton('⌫')
  }, [handleButton])

  const allButtons = scientific ? [...SCIENTIFIC_BUTTONS, ...BASIC_BUTTONS] : BASIC_BUTTONS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 8, gap: 4 }} onKeyDown={handleKeyDown}>
      <div style={{
        flex: '0 0 auto',
        padding: '8px 12px',
        borderRadius: 'var(--mantine-radius-md)',
        backgroundColor: 'var(--mantine-color-dark-8)',
        minHeight: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <Text size="xs" c="dimmed" truncate="end" style={{ maxWidth: '100%' }}>{expr || '\u00A0'}</Text>
        {error ? (
          <Text size="xs" c="red.4" fw={500}>{error}</Text>
        ) : (
          <Text fw={500} c="gray.1" fz="lg" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{result || '\u00A0'}</Text>
        )}
      </div>

      <Group gap={4} justify="flex-end">
        <ActionIcon
          size="xs"
          variant="subtle"
          color={scientific ? 'violet' : 'gray'}
          onClick={() => setScientific(!scientific)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Toggle scientific mode"
        >
          <Text size="xs" fw={600}>SCI</Text>
        </ActionIcon>
        <ActionIcon
          size="xs"
          variant="subtle"
          color={showHistory ? 'violet' : 'gray'}
          onClick={() => setShowHistory(!showHistory)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Toggle history"
        >
          <IconHistory size={12} />
        </ActionIcon>
      </Group>

      <Collapse expanded={showHistory} transitionDuration={150}>
        <div style={{ maxHeight: 80, overflow: 'auto', padding: 4, borderRadius: 'var(--wb-radius-sm)', background: 'var(--mantine-color-dark-8)', marginBottom: 4 }}>
          {history.length === 0 ? (
            <Text size="xs" c="dimmed" ta="center" py={4}>No history</Text>
          ) : (
            history.map((h, i) => (
              <Group
                key={i}
                gap="xs"
                justify="space-between"
                py={2}
                px={4}
                style={{ cursor: 'pointer', borderRadius: 4, transition: 'all 150ms ease' }}
                onClick={() => persistState(h.result, h.result, history)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Text size="xs" c="dimmed" truncate style={{ flex: 1, pointerEvents: 'auto' }}>{h.expr}</Text>
                <Text size="xs" c="gray.2" fw={500} style={{ pointerEvents: 'auto' }}>= {h.result}</Text>
              </Group>
            ))
          )}
        </div>
      </Collapse>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {allButtons.map((row, ri) =>
          row.map((btn) => (
            <UnstyledButton
              key={`${ri}-${btn}`}
              onClick={() => handleButton(btn)}
              aria-label={btn === '⌫' ? 'Backspace' : btn === 'C' ? 'Clear' : btn === '=' ? 'Equals' : btn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: btn === '=' ? 'var(--wb-accent)' : 'var(--mantine-color-dark-6)',
                color: btn === '=' ? 'white' : 'var(--wb-text)',
                fontSize: btn === 'C' || btn === '⌫' || btn.length > 1 ? 'var(--mantine-font-size-xs)' : 'var(--mantine-font-size-md)',
                fontWeight: btn === '=' ? 600 : 400,
                userSelect: 'none',
                transition: 'all 150ms ease',
              }}
              styles={{
                root: {
                  '&:hover': { backgroundColor: btn === '=' ? 'var(--wb-accent-hover)' : 'var(--mantine-color-dark-5)' },
                  '&:active': { transform: 'scale(0.95)' },
                },
              }}
            >
              {btn}
            </UnstyledButton>
          ))
        )}
      </div>
    </div>
  )
})

export default CalcWidget
