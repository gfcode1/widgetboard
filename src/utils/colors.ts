export function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return hsl
  const h = Number(match[1]) / 360
  const s = Number(match[2]) / 100
  const l = Number(match[3]) / 100

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = hue2rgb(p, q, h + 1 / 3)
  const g = hue2rgb(p, q, h)
  const b = hue2rgb(p, q, h - 1 / 3)

  const toHex = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return {
    r: parseInt(result[1] ?? '0', 16),
    g: parseInt(result[2] ?? '0', 16),
    b: parseInt(result[3] ?? '0', 16),
  }
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const rsrgb = rgb.r / 255
  const gsrgb = rgb.g / 255
  const bsrgb = rgb.b / 255
  const rLin = rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4)
  const gLin = gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4)
  const bLin = bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4)
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function generatePalette(count: number): string[] {
  const baseHue = Math.random() * 360
  return Array.from({ length: count }, (_, i) => {
    const hue = (baseHue + (i * 360) / count) % 360
    const sat = 55 + Math.random() * 30
    const light = 45 + Math.random() * 20
    return `hsl(${Math.round(hue)}, ${Math.round(sat)}%, ${Math.round(light)}%)`
  })
}

export function generateAnalogousPalette(count: number): string[] {
  const baseHue = Math.random() * 360
  const spacing = 30
  return Array.from({ length: count }, (_, i) => {
    const hue = (baseHue + i * spacing) % 360
    return `hsl(${Math.round(hue)}, 65%, 55%)`
  })
}

export function generateComplementaryPalette(): string[] {
  const baseHue = Math.random() * 360
  return [
    `hsl(${Math.round(baseHue)}, 65%, 55%)`,
    `hsl(${Math.round((baseHue + 180) % 360)}, 65%, 55%)`,
    `hsl(${Math.round(baseHue)}, 45%, 70%)`,
    `hsl(${Math.round((baseHue + 180) % 360)}, 45%, 70%)`,
    `hsl(${Math.round(baseHue)}, 65%, 35%)`,
  ]
}

export function generateTriadicPalette(): string[] {
  const baseHue = Math.random() * 360
  return [
    `hsl(${Math.round(baseHue)}, 65%, 55%)`,
    `hsl(${Math.round((baseHue + 120) % 360)}, 65%, 55%)`,
    `hsl(${Math.round((baseHue + 240) % 360)}, 65%, 55%)`,
    `hsl(${Math.round(baseHue)}, 45%, 70%)`,
    `hsl(${Math.round((baseHue + 120) % 360)}, 45%, 70%)`,
  ]
}

export function generateMonochromaticPalette(count: number): string[] {
  const baseHue = Math.random() * 360
  const sat = 50 + Math.random() * 20
  return Array.from({ length: count }, (_, i) => {
    const light = 20 + (i / (count - 1)) * 55
    return `hsl(${Math.round(baseHue)}, ${Math.round(sat)}%, ${Math.round(light)}%)`
  })
}
