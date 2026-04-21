// ============================================================
// WCAG 2.1 Contrast Ratio Calculator
// ============================================================
// To change luminance formula: edit the `getRelativeLuminance` function below.
// To change WCAG thresholds: edit the THRESHOLDS object below.
// ============================================================

export interface ContrastResult {
  ratio: number;
  ratioFormatted: string;
  passesAA: boolean;        // Normal text AA (≥ 4.5:1)
  passesAAA: boolean;       // Normal text AAA (≥ 7:1)
  passesAALarge: boolean;   // Large text AA (≥ 3:1)
  passesAAALarge: boolean;  // Large text AAA (≥ 4.5:1)
  level: 'AAA' | 'AA' | 'Fail';
}

// ============================================================
// THRESHOLDS — change these values to adjust pass/fail levels
// ============================================================
export const THRESHOLDS = {
  AA_NORMAL: 4.5,   // WCAG AA minimum for small/normal text
  AAA_NORMAL: 7.0,  // WCAG AAA minimum for small/normal text
  AA_LARGE: 3.0,    // WCAG AA minimum for large text (18pt+ or 14pt bold)
  AAA_LARGE: 4.5,   // WCAG AAA minimum for large text
} as const;

/**
 * Convert a hex color string to [R, G, B] 0-255 values.
 * Supports both 3-char and 6-char hex (with or without #).
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const sanitized = hex.replace(/^#/, '');
  const fullHex =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((c) => c + c)
          .join('')
      : sanitized;

  if (fullHex.length !== 6) return null;

  // Reject strings with non-hex characters
  if (!/^[0-9A-Fa-f]{6}$/.test(fullHex)) return null;

  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return null;

  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Convert an 8-bit channel value (0-255) to a linear light value.
 * Formula from WCAG 2.1 spec: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * TO CHANGE FORMULA: modify the sRGB linearization below.
 */
function linearize(channel: number): number {
  const c = channel / 255;
  // WCAG 2.1 sRGB linearization
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance of an RGB color.
 * Returns a value between 0 (black) and 1 (white).
 *
 * WCAG formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * TO CHANGE WEIGHTS: modify the coefficients below.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const R = linearize(r); // Red channel linearized
  const G = linearize(g); // Green channel linearized
  const B = linearize(b); // Blue channel linearized

  // WCAG 2.1 luminance coefficients (ITU-R BT.709)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate the WCAG contrast ratio between two colors.
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.
 * Returns a ratio from 1:1 (no contrast) to 21:1 (black on white).
 */
export function calculateContrastRatio(
  foreground: string,
  background: string
): ContrastResult | null {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) return null;

  const fgLuminance = getRelativeLuminance(...fgRgb);
  const bgLuminance = getRelativeLuminance(...bgRgb);

  // Ensure lighter color is L1 per WCAG spec
  const L1 = Math.max(fgLuminance, bgLuminance);
  const L2 = Math.min(fgLuminance, bgLuminance);

  const ratio = (L1 + 0.05) / (L2 + 0.05);
  const ratioRounded = Math.round(ratio * 100) / 100;

  // Evaluate against thresholds
  const passesAA = ratio >= THRESHOLDS.AA_NORMAL;
  const passesAAA = ratio >= THRESHOLDS.AAA_NORMAL;
  const passesAALarge = ratio >= THRESHOLDS.AA_LARGE;
  const passesAAALarge = ratio >= THRESHOLDS.AAA_LARGE;

  // Overall level: AAA > AA > Fail (based on normal text)
  const level: 'AAA' | 'AA' | 'Fail' = passesAAA
    ? 'AAA'
    : passesAA
    ? 'AA'
    : 'Fail';

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
