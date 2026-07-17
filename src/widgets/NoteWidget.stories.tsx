import type { Meta, StoryObj } from '@storybook/react'
import { NoteWidget } from './NoteWidget'
import { WidgetContext } from '../components/Widget'

const mockWidget = {
  id: 'test-1',
  type: 'note' as const,
  x: 0,
  y: 0,
  width: 400,
  height: 300,
  locked: false,
  content: {
    type: 'note' as const,
    text: '# Hello World\n\nThis is a **note** widget.',
    categories: ['Work'],
    category: 'Work',
  },
}

const meta: Meta<typeof NoteWidget> = {
  title: 'Widgets/NoteWidget',
  component: NoteWidget,
  decorators: [
    (Story) => (
      <WidgetContext.Provider value={{ widgetId: 'test-1', boardId: 'root' }}>
        <div style={{ width: 400, height: 300 }}>
          <Story />
        </div>
      </WidgetContext.Provider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof NoteWidget>

export const Default: Story = { args: { widget: mockWidget as never } }

export const Empty: Story = {
  args: {
    widget: {
      ...mockWidget,
      content: { ...mockWidget.content, text: '' },
    } as never,
  },
}
