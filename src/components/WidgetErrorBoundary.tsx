import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Text, Stack, ActionIcon } from '@mantine/core'
import { IconRefresh, IconAlertTriangle } from '@tabler/icons-react'

interface Props {
  children: ReactNode
  widgetId: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Widget ${this.props.widgetId}]`, error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack
          align="center"
          justify="center"
          h="100%"
          gap="xs"
          p="sm"
          style={{ textAlign: 'center' }}
        >
          <IconAlertTriangle size={24} color="var(--mantine-color-yellow-5)" />
          <Text size="xs" c="dimmed" fw={500}>
            Widget crashed
          </Text>
          <Text
            size="xs"
            c="dimmed"
            style={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={this.handleRetry}>
            <IconRefresh size={14} />
          </ActionIcon>
        </Stack>
      )
    }

    return this.props.children
  }
}
