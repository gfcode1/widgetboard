import { Component, type ReactNode } from 'react'
import { Paper, Text, Button, Stack } from '@mantine/core'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('CanvasErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper
          p="xl"
          radius="md"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
          }}
        >
          <Stack align="center" gap="xs">
            <Text fw={600} size="sm">
              Canvas crashed
            </Text>
            <Text size="xs" c="dimmed" ta="center" style={{ maxWidth: 400 }}>
              {this.state.error?.message ?? 'Unknown error'}
            </Text>
            <Text size="xs" c="dimmed">
              Check console for details. Try resetting or reload.
            </Text>
            <Button size="xs" variant="light" color="violet" onClick={this.handleReset}>
              Retry
            </Button>
          </Stack>
        </Paper>
      )
    }
    return this.props.children
  }
}

export default CanvasErrorBoundary
