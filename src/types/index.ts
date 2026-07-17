export type WidgetType =
  | 'note'
  | 'clock'
  | 'link'
  | 'image'
  | 'weather'
  | 'pomodoro'
  | 'calc'
  | 'sticky'
  | 'embed'
  | 'worldclock'
  | 'todo'
  | 'calendar'
  | 'search'
  | 'board'
  | 'bookmark'
  | 'quote'
  | 'clipboard'
  | 'snippet'
  | 'palette'
  | 'expense'
  | 'rss'
  | 'countdown'
  | 'pomodoro-stats'
  | 'habit'
  | 'timer'
  | 'kanban'

export type CanvasElementType = 'group' | 'text' | 'arrow' | 'shape'

export interface GroupElement {
  id: string
  type: 'group'
  boardId: string
  x: number
  y: number
  width: number
  height: number
  title: string
  color: string
  widgetIds: string[]
  collapsed: boolean
  zIndex: number
}

export interface TextElement {
  id: string
  type: 'text'
  boardId: string
  x: number
  y: number
  content: string
  fontSize: number
  fontFamily: string
  color: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  zIndex: number
}

export interface ArrowElement {
  id: string
  type: 'arrow'
  boardId: string
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  strokeWidth: number
  style: 'solid' | 'dashed'
  startWidgetId?: string
  endWidgetId?: string
  zIndex: number
}

export interface ShapeElement {
  id: string
  type: 'shape'
  boardId: string
  shape: 'rectangle' | 'ellipse'
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  zIndex: number
}

export type CanvasElement = GroupElement | TextElement | ArrowElement | ShapeElement

export interface NoteContent {
  type: 'note'
  text: string
  category?: string
  categories?: string[]
}

export interface ClockContent {
  type: 'clock'
  showDate: boolean
  showSeconds: boolean
  use12h: boolean
}

export interface LinkItem {
  id: string
  url: string
  title: string
  favicon?: string
  description?: string
  health?: 'ok' | 'error' | 'checking'
}

export interface LinkContent {
  type: 'link'
  links: LinkItem[]
  activeIndex: number
}

export interface ImageContent {
  type: 'image'
  src: string
  alt: string
}

export interface WeatherContent {
  type: 'weather'
  locations: Array<{ city: string; lat: number; lon: number }>
  activeIndex: number
}

export interface PomodoroSession {
  date: string
  workMin: number
  breakMin: number
  completed: boolean
}

export interface PomodoroContent {
  type: 'pomodoro'
  workMin: number
  breakMin: number
  sessions?: PomodoroSession[]
}

export interface CalcHistoryEntry {
  expr: string
  result: string
  timestamp: number
}

export interface CalcContent {
  type: 'calc'
  expr?: string
  result?: string
  history?: CalcHistoryEntry[]
}

export interface StickyContent {
  type: 'sticky'
  text: string
  color: string
  tags?: string[]
}

export interface EmbedContent {
  type: 'embed'
  url: string
}

export interface WorldClockContent {
  type: 'worldclock'
  clocks: Array<{ city: string; timezone: string; use12h: boolean; offset?: number }>
}

export interface TodoItem {
  id: string
  text: string
  done: boolean
  subtasks?: TodoItem[]
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface TodoContent {
  type: 'todo'
  items: TodoItem[]
}

export interface CalendarContent {
  type: 'calendar'
  events: Array<{ id: string; title: string; date: string; color?: string }>
}

export interface SearchContent {
  type: 'search'
  engines: Array<{ name: string; url: string; icon?: string }>
  activeEngine: number
  recentSearches: string[]
}

export interface BoardContent {
  type: 'board'
  boardId: string
  title: string
  color?: string
}

export interface BookmarkContent {
  type: 'bookmark'
  bookmarks: Array<{ id: string; title: string; url: string; favicon?: string; folder?: string }>
  folders: string[]
}

export interface QuoteContent {
  type: 'quote'
  text: string
  author: string
  lastFetched: number
}

export interface ClipboardContent {
  type: 'clipboard'
  entries: Array<{ id: string; text: string; timestamp: number; pinned: boolean }>
}

export interface SnippetContent {
  type: 'snippet'
  snippets: Array<{ id: string; title: string; code: string; language: string; tags: string[] }>
}

export interface PaletteContent {
  type: 'palette'
  colors: string[]
  name: string
  locked: boolean[]
}

export interface ExpenseContent {
  type: 'expense'
  items: Array<{
    id: string
    amount: number
    category: string
    note: string
    date: string
    isRecurring?: boolean
  }>
  currency: string
  monthlyBudget?: number
}

export interface RssContent {
  type: 'rss'
  feeds: Array<{ url: string; title?: string; lastFetched: number }>
  items: Array<{ title: string; link: string; pubDate: string; feedUrl: string }>
}

export interface CountdownItem {
  id: string
  label: string
  target: number
  color: string
}

export interface CountdownContent {
  type: 'countdown'
  countdowns: CountdownItem[]
  showSeconds: boolean
}

export interface PomodoroStatsContent {
  type: 'pomodoro-stats'
  sessions: Array<{ date: string; workMin: number; breakMin: number; completed: boolean }>
}

export interface HabitContent {
  type: 'habit'
  habits: Array<{
    id: string
    name: string
    icon: string
    color: string
    completedDates: string[]
    frequency: 'daily' | 'weekly'
  }>
}

export interface TimerContent {
  type: 'timer'
  mode: 'stopwatch' | 'countdown'
  elapsed: number
  target: number
  running: boolean
  laps: number[]
}

export interface KanbanContent {
  type: 'kanban'
  columns: Array<{
    id: string
    title: string
    cards: Array<{ id: string; text: string }>
  }>
}

export type WidgetContent =
  | NoteContent
  | ClockContent
  | LinkContent
  | ImageContent
  | WeatherContent
  | PomodoroContent
  | CalcContent
  | StickyContent
  | EmbedContent
  | WorldClockContent
  | TodoContent
  | CalendarContent
  | SearchContent
  | BoardContent
  | BookmarkContent
  | QuoteContent
  | ClipboardContent
  | SnippetContent
  | PaletteContent
  | ExpenseContent
  | RssContent
  | CountdownContent
  | PomodoroStatsContent
  | HabitContent
  | TimerContent
  | KanbanContent

export interface Widget {
  id: string
  type: WidgetType
  x: number
  y: number
  width: number
  height: number
  content: WidgetContent
  locked?: boolean
}
