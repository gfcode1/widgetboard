import { useState } from 'react'
import { Modal, TextInput, Button, Stack, Text, Group, Alert } from '@mantine/core'
import { IconSettings, IconCheck, IconInfoCircle } from '@tabler/icons-react'
import { getStoredConfig, storeConfig, type AgentConfig } from '../hooks/usePageAgent'

interface AgentSettingsModalProps {
  opened: boolean
  onClose: () => void
}

export function AgentSettingsModal({ opened, onClose }: AgentSettingsModalProps) {
  const [config, setConfig] = useState<AgentConfig>(getStoredConfig)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    storeConfig(config)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 800)
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSettings size={18} />
          <Text fw={600}>Agent Settings</Text>
        </Group>
      }
      size="md"
      styles={{
        content: {
          background: 'var(--wb-surface)',
          border: '1px solid var(--wb-border)',
        },
        header: {
          background: 'var(--wb-surface)',
        },
        title: {
          color: 'var(--wb-text)',
        },
      }}
    >
      <Stack gap="md">
        <Alert
          variant="light"
          color="violet"
          icon={<IconInfoCircle size={16} />}
          styles={{
            root: { background: 'var(--wb-accent-subtle)' },
            message: { color: 'var(--wb-text)', fontSize: 12 },
          }}
        >
          Works with any OpenAI-compatible API: Alibaba DashScope, OpenAI, DeepSeek, OpenRouter,
          Anthropic (via proxy), Ollama, and more. No API key needed for the default testing
          endpoint.
        </Alert>

        <TextInput
          label="Base URL"
          description="OpenAI-compatible API endpoint"
          placeholder={import.meta.env.VITE_AI_ENDPOINT || 'https://your-api.example.com/v1'}
          value={config.baseURL}
          onChange={(e) => setConfig({ ...config, baseURL: e.currentTarget.value })}
          styles={{
            input: {
              background: 'var(--wb-bg)',
              borderColor: 'var(--wb-border)',
              color: 'var(--wb-text)',
            },
            label: { color: 'var(--wb-text)' },
            description: { color: 'var(--wb-text-dimmed)' },
          }}
        />
        <TextInput
          label="Model"
          description="Model identifier"
          placeholder={import.meta.env.VITE_AI_MODEL || 'gpt-4o'}
          value={config.model}
          onChange={(e) => setConfig({ ...config, model: e.currentTarget.value })}
          styles={{
            input: {
              background: 'var(--wb-bg)',
              borderColor: 'var(--wb-border)',
              color: 'var(--wb-text)',
            },
            label: { color: 'var(--wb-text)' },
            description: { color: 'var(--wb-text-dimmed)' },
          }}
        />
        <TextInput
          label="API Key"
          description="Optional — not needed for the free testing endpoint"
          placeholder="sk-..."
          type="password"
          value={config.apiKey}
          onChange={(e) => setConfig({ ...config, apiKey: e.currentTarget.value })}
          styles={{
            input: {
              background: 'var(--wb-bg)',
              borderColor: 'var(--wb-border)',
              color: 'var(--wb-text)',
            },
            label: { color: 'var(--wb-text)' },
            description: { color: 'var(--wb-text-dimmed)' },
          }}
        />
        <Text size="xs" c="dimmed">
          Works with any OpenAI-compatible API: Alibaba DashScope, OpenAI, DeepSeek, OpenRouter,
          Anthropic (via proxy), Ollama, and more.
        </Text>
        <Group justify="flex-end">
          <Button
            variant="subtle"
            onClick={onClose}
            styles={{ root: { color: 'var(--wb-text-dimmed)' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="filled"
            color="violet"
            leftSection={saved ? <IconCheck size={16} /> : undefined}
          >
            {saved ? 'Saved!' : 'Save'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
