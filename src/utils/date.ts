const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

export function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  if (diffMs < MINUTE) return `${Math.floor(diffMs / 1000)}s`
  if (diffMs < HOUR) return `${Math.floor(diffMs / MINUTE)}m`
  if (diffMs < DAY) return `${Math.floor(diffMs / HOUR)}h`
  return `${Math.floor(diffMs / DAY)}d`
}

export function formatRelativeTimeLong(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMinutes = Math.floor(diffMs / MINUTE)
  const diffHours = Math.floor(diffMs / HOUR)
  const diffDays = Math.floor(diffMs / DAY)
  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

export function getLast7Days(today: string): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0]!)
  }
  return days
}

export function getDayShortNames(today: string): string[] {
  const labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    labels.push(new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d).slice(0, 2))
  }
  return labels
}

export function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return date.getTime() < now.getTime()
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDate()
}

export function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return dateStr === tomorrow.toISOString().split('T')[0]
}

export function formatDateTime(
  timezone: string,
  now: Date,
  options: Intl.DateTimeFormatOptions
): string {
  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone: timezone }).format(now)
  } catch {
    return '--:--:--'
  }
}
