
export interface ContrastResult {
  ratio: number;
  ratioFormatted: string;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
  level: 'AAA' | 'AA' | 'Fail';
}

export const THRESHOLDS = {
  AA_NORMAL: 4.5,
  AAA_NORMAL: 7.0,
  AA_LARGE: 3.0,
  AAA_LARGE: 4.5,
} as const;

export function hexToRgb(hex: string): [number, number, number] | null {
  const sanitized = hex.replace(/^#/, '');
  const fullHex =
    sanitized.length === 3
      ? sanitized.split('').map((c) => c + c).join('')
      : sanitized;

  if (fullHex.length !== 6) return null;

  if (!/^[0-9A-Fa-f]{6}$/.test(fullHex)) return null;

  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return null;

  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);
  return 0.2126 * R + 0.7152 * G + 0.0726 * B;
}

export function calculateContrastRatio(
  foreground: string,
  background: string
): ContrastResult | null {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) return null;

  const fgLuminance = getRelativeLuminance(...fgRgb);
  const bgLuminance = getRelativeLuminance(...bgRgb);

  const L1 = Math.max(fgLuminance, bgLuminance);
  const L2 = Math.min(fgLuminance, bgLuminance);

  const ratio = (L1 + 0.05) / (L2 + 0.05);
  const ratioRounded = Math.round(ratio * 100) / 100;

  const passesAA       = ratio >= THRESHOLDS.AA_NORMAL;
  const passesAAA      = ratio >= THRESHOLDS.AAA_NORMAL;
  const passesAALarge  = ratio >= THRESHOLDS.AA_LARGE;
  const passesAAALarge = ratio >= THRESHOLDS.AAA_LARGE;

  const level: 'AAA' | 'AA' | 'Fail' = passesAAA ? 'AAA' : passesAA ? 'AA' : 'Fail';

  return {
    ratio: ratioRounded,
    ratioFormatted: ratioRounded.toFixed(2),
    passesAA,
    passesAAA,
    passesAALarge,
    passesAAALarge,
    level,
  };
}
