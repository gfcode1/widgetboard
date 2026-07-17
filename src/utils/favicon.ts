export function getFaviconUrl(url: string, size: number = 16): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
  } catch {
    return ''
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function getDomainLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      return parts[parts.length - 2] ?? hostname
    }
    return hostname
  } catch {
    return url
  }
}
