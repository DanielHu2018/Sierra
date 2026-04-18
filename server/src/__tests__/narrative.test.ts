import { describe, test, expect } from 'vitest';
import { CANNED_NARRATIVES } from '../data/canned-narrative.js';

describe('canned narrative fallback', () => {
  test('CANNED_NARRATIVES has entries for route A, B, and C', () => {
    expect(CANNED_NARRATIVES).toHaveProperty('A');
    expect(CANNED_NARRATIVES).toHaveProperty('B');
    expect(CANNED_NARRATIVES).toHaveProperty('C');
  });

  test('each canned narrative is a non-empty string', () => {
    for (const key of ['A', 'B', 'C'] as const) {
      expect(typeof CANNED_NARRATIVES[key]).toBe('string');
      expect(CANNED_NARRATIVES[key].length).toBeGreaterThan(0);
    }
  });

  test('each canned narrative contains at least one Texas location name', () => {
    const texasLocations = ['Reeves', 'Nolan', 'Edwards Aquifer', 'Pecos', 'US-385', 'Midland', 'Sutton', 'Edwards'];
    for (const key of ['A', 'B', 'C'] as const) {
      const narrative = CANNED_NARRATIVES[key];
      const hasLocation = texasLocations.some((loc) => narrative.includes(loc));
      expect(hasLocation, `Route ${key} narrative should reference at least one Texas location`).toBe(true);
    }
  });

  test.todo('POST /api/narrative returns narrative string in response JSON');
  test.todo('POST /api/narrative falls back to canned narrative when Claude API unavailable');
});
