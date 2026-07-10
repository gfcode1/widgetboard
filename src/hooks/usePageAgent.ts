import { useState, useRef, useCallback, useEffect } from 'react'
import { PageAgent } from 'page-agent'
import { widgetboardTools } from '../tools/widgetboardTools'

export interface AgentConfig {
  baseURL: string
  model: string
  apiKey: string
}

export interface ChatMessage {
  role: 'user' | 'agent' | 'error'
  text: string
  timestamp: number
}

const STORAGE_KEY = 'pageagent-config'

export function getStoredConfig(): AgentConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    baseURL: 'https://page-ag-testing-ohftxirgbn.cn-shanghai.fcapp.run',
    model: 'qwen3.5-plus',
    apiKey: '',
  }
}

export function storeConfig(config: AgentConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function usePageAgent() {
  const agentRef = useRef<PageAgent | null>(null)
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error' | 'stopped'>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentActivity, setCurrentActivity] = useState<string>('')

  const addMessage = useCallback((role: 'user' | 'agent' | 'error', text: string) => {
    setMessages((prev) => [...prev, { role, text, timestamp: Date.now() }])
  }, [])

  const getOrCreateAgent = useCallback(() => {
    if (agentRef.current && !agentRef.current.disposed) {
      return agentRef.current
    }

    const config = getStoredConfig()

    const agent = new PageAgent({
      baseURL: config.baseURL,
      model: config.model,
      apiKey: config.apiKey,
      language: 'en-US',
      enableMask: false,
      customTools: widgetboardTools,
      maxSteps: 20,
      stepDelay: 0.3,
      instructions: {
        system: `You are WidgetBoard AI Assistant. You control a widget-based infinite canvas dashboard.
You can add, remove, move, list, and update widgets using the available tools.
Available widget types: note, clock, todo, calendar, search, link, image, weather, pomodoro, calc, sticky, embed, worldclock, board, bookmark, quote, clipboard, snippet, palette, expense, rss, countdown, pomodoro-stats, habit.
Always use the tools to manipulate widgets. Never try to click DOM elements directly for widget operations.
When the user asks to add a widget, use add_widget with the correct type name.
When unsure, list available types first with list_widget_types.`,
      },
    })

    // Remove the default Panel UI injected by page-agent (no option to disable it)
    const defaultPanel = document.getElementById('page-agent-runtime_agent-panel')
    if (defaultPanel) defaultPanel.remove()

    agent.addEventListener('statuschange', () => {
      setStatus(agent.status)
    })

    agent.addEventListener('activity', ((e: CustomEvent) => {
      const activity = e.detail
      if (activity.type === 'thinking') {
        setCurrentActivity('Thinking...')
      } else if (activity.type === 'executing') {
        setCurrentActivity(`Executing: ${activity.tool}`)
      } else if (activity.type === 'executed') {
        setCurrentActivity('')
      } else if (activity.type === 'error') {
        setCurrentActivity(`Error: ${activity.message}`)
      }
    }) as EventListener)

    agentRef.current = agent
    return agent
  }, [])

  const execute = useCallback(
    async (task: string) => {
      addMessage('user', task)
      const config = getStoredConfig()
      if (!config.baseURL) {
        addMessage(
          'error',
          'No LLM endpoint configured. Click the settings icon (gear) to configure your API.'
        )
        return null
      }
      const agent = getOrCreateAgent()
      try {
        const result = await agent.execute(task)
        if (result.success) {
          addMessage('agent', result.data || 'Task completed successfully.')
        } else {
          addMessage('error', result.data || 'Task failed.')
        }
        return result
      } catch (err: any) {
        const msg = err?.message || String(err)
        addMessage('error', msg)
        return null
      }
    },
    [addMessage, getOrCreateAgent]
  )

  const stop = useCallback(async () => {
    if (agentRef.current && !agentRef.current.disposed) {
      await agentRef.current.stop()
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  useEffect(() => {
    return () => {
      if (agentRef.current && !agentRef.current.disposed) {
        agentRef.current.dispose()
      }
    }
  }, [])

  return {
    status,
    messages,
    currentActivity,
    execute,
    stop,
    clearMessages,
  }
}
