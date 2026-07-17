import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Center, Loader, Text, Stack } from '@mantine/core'

export function HydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])

  if (!hydrated) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="sm">
          <Loader size="md" />
          <Text size="sm" c="dimmed">
            Loading WidgetBoard...
          </Text>
        </Stack>
      </Center>
    )
  }

  return <>{children}</>
}
