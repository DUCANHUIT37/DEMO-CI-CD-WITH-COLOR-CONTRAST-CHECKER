import type { VercelRequest, VercelResponse } from '@vercel/node'

// ── Inline toàn bộ logic từ backend để tránh import path phức tạp ──

const THRESHOLDS = {
  AA_NORMAL: 4.5,
  AAA_NORMAL: 7.0,
  AA_LARGE: 3.0,
  AAA_LARGE: 4.5,
}

function hexToRgb(hex: string): [number, number, number] | null {
  const s = hex.replace(/^#/, '')
  const full = s.length === 3 ? s.split('').map(c => c + c).join('') : s
  if (!/^[0-9A-Fa-f]{6}$/.test(full)) return null
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function linearize(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

function calculateContrastRatio(foreground: string, background: string) {
  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)
  if (!fg || !bg) return null

  const L1 = Math.max(getRelativeLuminance(...fg), getRelativeLuminance(...bg))
  const L2 = Math.min(getRelativeLuminance(...fg), getRelativeLuminance(...bg))
  const ratio = (L1 + 0.05) / (L2 + 0.05)
  const ratioRounded = Math.round(ratio * 100) / 100

  return {
    ratio: ratioRounded,
    ratioFormatted: ratioRounded.toFixed(2),
    passesAA: ratio >= THRESHOLDS.AA_NORMAL,
    passesAAA: ratio >= THRESHOLDS.AAA_NORMAL,
    passesAALarge: ratio >= THRESHOLDS.AA_LARGE,
    passesAAALarge: ratio >= THRESHOLDS.AAA_LARGE,
    level: ratio >= THRESHOLDS.AAA_NORMAL ? 'AAA' : ratio >= THRESHOLDS.AA_NORMAL ? 'AA' : 'Fail',
  }
}

// ── Vercel handler ──
export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { foreground, background } = req.body ?? {}

  if (!foreground || !background) {
    res.status(400).json({ error: 'foreground and background are required' })
    return
  }

  const result = calculateContrastRatio(foreground, background)

  if (!result) {
    res.status(400).json({ error: 'Invalid hex color values' })
    return
  }

  res.status(200).json(result)
}