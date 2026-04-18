import { describe, it, expect } from 'vitest';

// ─── WCAG relative luminance + contrast ratio ────────────────────────────────
//
// Formula per WCAG 2.1 §1.4.3 and §1.4.11:
//   1. Parse hex to RGB in [0, 1] range
//   2. Linearize: c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4
//   3. Luminance: L = 0.2126*R + 0.7152*G + 0.0722*B
//   4. Contrast = (Lhigher + 0.05) / (Llower + 0.05)
//
// WCAG AA thresholds:
//   - Normal text (< 18pt regular / < 14pt bold): contrast >= 4.5
//   - Large text / UI components (route lines, heatmap): contrast >= 3.0

function hexToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * hexToLinear(r) + 0.7152 * hexToLinear(g) + 0.0722 * hexToLinear(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Background color used in Sierra design system (the dark background)
const BACKGROUND = '#131313';

// ─── WCAG AA Contrast Assertions ─────────────────────────────────────────────
//
// These tests are intentionally "pre-passing" — they document the color contract
// and will catch future regressions if any color is changed to a non-compliant value.

describe('WCAG AA contrast: route colors against #131313 (UI component threshold ≥ 3.0)', () => {
  it('Route A #A7C8FF — contrast ratio >= 3.0 (UI component AA)', () => {
    const ratio = getContrastRatio('#A7C8FF', BACKGROUND);
    // Expected ~10.9:1 per design spec
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it('Route B #FFBC7C — contrast ratio >= 3.0 (UI component AA)', () => {
    const ratio = getContrastRatio('#FFBC7C', BACKGROUND);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it('Route C #E8B3FF — contrast ratio >= 3.0 (UI component AA)', () => {
    const ratio = getContrastRatio('#E8B3FF', BACKGROUND);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});

describe('WCAG AA contrast: heatmap colors against #131313 (UI component threshold ≥ 3.0)', () => {
  it('Heatmap low #3291FF — contrast ratio >= 3.0 (UI component AA)', () => {
    const ratio = getContrastRatio('#3291FF', BACKGROUND);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it('Heatmap high #FF4444 — contrast ratio >= 3.0 (UI component AA)', () => {
    const ratio = getContrastRatio('#FF4444', BACKGROUND);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});

describe('WCAG AA contrast: footnote text against #131313 (normal text threshold ≥ 4.5)', () => {
  it('Footnote text #C1C6D7 — contrast ratio >= 4.5 (normal text AA)', () => {
    const ratio = getContrastRatio('#C1C6D7', BACKGROUND);
    // on-surface-variant color; expected ~8.5:1
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
