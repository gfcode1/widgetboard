import type { Preview } from '@storybook/react-vite'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    backgrounds: { default: 'dark' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <MantineProvider defaultColorScheme="dark">
        <Story />
      </MantineProvider>
    ),
  ],
}

export default preview
