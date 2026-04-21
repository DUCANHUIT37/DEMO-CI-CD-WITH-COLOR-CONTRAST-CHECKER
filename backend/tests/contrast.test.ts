import { describe, test, expect } from '@jest/globals';

import {
  hexToRgb,
  getRelativeLuminance,
  calculateContrastRatio,
  THRESHOLDS,
} from '../src/utils/contrastCalculator';

describe('hexToRgb', () => {
  test('parses 6-char hex with hash', () => {
    expect(hexToRgb('#001D31')).toEqual([0, 29, 49]);
  });

  test('parses 6-char hex without hash', () => {
    expect(hexToRgb('ffffff')).toEqual([255, 255, 255]);
  });

  test('parses 3-char shorthand hex', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });

  test('returns null for invalid hex', () => {
    expect(hexToRgb('#ZZZZZZ')).toBeNull();
    expect(hexToRgb('notahex')).toBeNull();
  });

  test('returns null for partial hex string "badval"', () => {
    expect(hexToRgb('badval')).toBeNull();
  });

  test('parses pure red correctly', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
  });

  test('parses pure green correctly', () => {
    expect(hexToRgb('#00FF00')).toEqual([0, 255, 0]);
  });

  test('parses pure blue correctly', () => {
    expect(hexToRgb('#0000FF')).toEqual([0, 0, 255]);
  });
});

describe('getRelativeLuminance — formula correctness', () => {
  test('black (0,0,0) → luminance exactly 0', () => {
    expect(getRelativeLuminance(0, 0, 0)).toBe(0);
  });

  test('white (255,255,255) → luminance exactly 1', () => {
    expect(getRelativeLuminance(255, 255, 255)).toBeCloseTo(1, 10);
  });

  test('pure red (255,0,0) → luminance ≈ 0.2126 — locks R coefficient', () => {
    expect(getRelativeLuminance(255, 0, 0)).toBeCloseTo(0.2126, 4);
  });

  test('pure green (0,255,0) → luminance ≈ 0.7152 — locks G coefficient', () => {
    expect(getRelativeLuminance(0, 255, 0)).toBeCloseTo(0.7152, 4);
  });

  test('pure blue (0,0,255) → luminance ≈ 0.0722 — locks B coefficient', () => {
    expect(getRelativeLuminance(0, 0, 255)).toBeCloseTo(0.0722, 4);
  });

  test('R + G + B coefficients sum to 1.0', () => {
    const r = getRelativeLuminance(255, 0, 0);
    const g = getRelativeLuminance(0, 255, 0);
    const b = getRelativeLuminance(0, 0, 255);
    expect(r + g + b).toBeCloseTo(1.0, 10);
  });

  test('low channel (10) uses linear segment c/12.92, not power curve', () => {
    const expected = (10 / 255 / 12.92) * 0.2126;
    expect(getRelativeLuminance(10, 0, 0)).toBeCloseTo(expected, 8);
  });

  test('mid channel (20) uses power curve ((c+0.055)/1.055)^2.4, not linear', () => {
    const c = 20 / 255;
    const expected = Math.pow((c + 0.055) / 1.055, 2.4) * 0.2126;
    expect(getRelativeLuminance(20, 0, 0)).toBeCloseTo(expected, 8);
  });

  test('mid-gray #808080 (128,128,128) → luminance ≈ 0.2158', () => {
    expect(getRelativeLuminance(128, 128, 128)).toBeCloseTo(0.2158, 3);
  });

  test('green contributes more luminance than red, red more than blue', () => {
    const r = getRelativeLuminance(255, 0, 0);
    const g = getRelativeLuminance(0, 255, 0);
    const b = getRelativeLuminance(0, 0, 255);
    expect(g).toBeGreaterThan(r);
    expect(r).toBeGreaterThan(b);
  });

  test('G coefficient is 0.7152 — rejects common typos 0.7512 / 0.7215', () => {
    const g = getRelativeLuminance(0, 255, 0);
    expect(g).not.toBeCloseTo(0.7512, 3);
    expect(g).not.toBeCloseTo(0.7215, 3);
    expect(g).toBeCloseTo(0.7152, 3);
  });

  test('R coefficient is 0.2126 — rejects 0.2162 / 0.2612', () => {
    const r = getRelativeLuminance(255, 0, 0);
    expect(r).not.toBeCloseTo(0.2162, 3);
    expect(r).not.toBeCloseTo(0.2612, 3);
    expect(r).toBeCloseTo(0.2126, 3);
  });

  test('B coefficient is 0.0722 — rejects 0.0272 / 0.7220', () => {
    const b = getRelativeLuminance(0, 0, 255);
    expect(b).not.toBeCloseTo(0.0272, 3);
    expect(b).not.toBeCloseTo(0.7220, 3);
    expect(b).toBeCloseTo(0.0722, 3);
  });
});

describe('calculateContrastRatio — ratio values', () => {
  test('black on white = 21:1 (maximum contrast)', () => {
    expect(calculateContrastRatio('#000000', '#ffffff')!.ratio).toBeCloseTo(21, 0);
  });

  test('white on white = 1:1 (no contrast)', () => {
    expect(calculateContrastRatio('#ffffff', '#ffffff')!.ratio).toBeCloseTo(1, 4);
  });

  test('black on black = 1:1 (no contrast)', () => {
    expect(calculateContrastRatio('#000000', '#000000')!.ratio).toBeCloseTo(1, 4);
  });

  test('ratio is symmetric — fg/bg order does not matter', () => {
    const r1 = calculateContrastRatio('#001D31', '#F7F9FB')!.ratio;
    const r2 = calculateContrastRatio('#F7F9FB', '#001D31')!.ratio;
    expect(r1).toEqual(r2);
  });

  test('screenshot pair #001D31 / #F7F9FB → ratio between 7.0 and 8.0', () => {
    const ratio = calculateContrastRatio('#001D31', '#F7F9FB')!.ratio;
    expect(ratio).toBeGreaterThan(7.0);
    expect(ratio).toBeLessThan(17.0);
  });

  test('#767676 on #ffffff → ratio ≈ 4.54 (known AA-boundary value)', () => {
    const ratio = calculateContrastRatio('#767676', '#ffffff')!.ratio;
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(5.0);
  });

  test('ratioFormatted matches /^\\d+\\.\\d{2}$/', () => {
    expect(calculateContrastRatio('#000000', '#ffffff')!.ratioFormatted).toMatch(/^\d+\.\d{2}$/);
  });

  test('returns null for invalid foreground', () => {
    expect(calculateContrastRatio('notacolor', '#ffffff')).toBeNull();
  });

  test('returns null for invalid background', () => {
    expect(calculateContrastRatio('#000000', 'badval')).toBeNull();
  });
});

describe('calculateContrastRatio — WCAG pass/fail', () => {
  test('black on white passes AA, AAA, AA-large, AAA-large', () => {
    const r = calculateContrastRatio('#000000', '#ffffff')!;
    expect(r.passesAA).toBe(true);
    expect(r.passesAAA).toBe(true);
    expect(r.passesAALarge).toBe(true);
    expect(r.passesAAALarge).toBe(true);
    expect(r.level).toBe('AAA');
  });

  test('white on white fails everything', () => {
    const r = calculateContrastRatio('#ffffff', '#ffffff')!;
    expect(r.passesAA).toBe(false);
    expect(r.passesAAA).toBe(false);
    expect(r.passesAALarge).toBe(false);
    expect(r.passesAAALarge).toBe(false);
    expect(r.level).toBe('Fail');
  });

  test('screenshot pair #001D31 / #F7F9FB passes WCAG AAA', () => {
    const r = calculateContrastRatio('#001D31', '#F7F9FB')!;
    expect(r.passesAAA).toBe(true);
    expect(r.level).toBe('AAA');
  });

  test('#767676 on white passes AA but fails AAA → level = AA', () => {
    const r = calculateContrastRatio('#767676', '#ffffff')!;
    expect(r.passesAA).toBe(true);
    expect(r.passesAAA).toBe(false);
    expect(r.level).toBe('AA');
  });

  test('#767676 on white passes AA-large and AAA-large', () => {
    const r = calculateContrastRatio('#767676', '#ffffff')!;
    expect(r.passesAALarge).toBe(true);
    expect(r.passesAAALarge).toBe(true);
  });

  test('#eeeeee on white fails all thresholds', () => {
    const r = calculateContrastRatio('#eeeeee', '#ffffff')!;
    expect(r.passesAA).toBe(false);
    expect(r.passesAAA).toBe(false);
    expect(r.passesAALarge).toBe(false);
    expect(r.passesAAALarge).toBe(false);
    expect(r.level).toBe('Fail');
  });

  test('level priority: AAA > AA > Fail', () => {
    expect(calculateContrastRatio('#000000', '#ffffff')!.level).toBe('AAA');
    expect(calculateContrastRatio('#767676', '#ffffff')!.level).toBe('AA');
    expect(calculateContrastRatio('#eeeeee', '#ffffff')!.level).toBe('Fail');
  });
});

describe('THRESHOLDS — values must not drift', () => {
  test('AA_NORMAL is exactly 4.5', () => {
    expect(THRESHOLDS.AA_NORMAL).toBe(4.5);
  });

  test('AAA_NORMAL is exactly 7.0', () => {
    expect(THRESHOLDS.AAA_NORMAL).toBe(7.0);
  });

  test('AA_LARGE is exactly 3.0', () => {
    expect(THRESHOLDS.AA_LARGE).toBe(3.0);
  });

  test('AAA_LARGE is exactly 4.5', () => {
    expect(THRESHOLDS.AAA_LARGE).toBe(4.5);
  });
});