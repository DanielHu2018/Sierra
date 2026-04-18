import { describe, test, expect } from 'vitest';
import {
  CANNED_REASONING_STREAM,
  CANNED_RECOMMENDATION,
  CANNED_TRIGGERS,
  CANNED_ALERTS,
  CANNED_SUMMARY,
  CANNED_SEGMENT_JUSTIFICATIONS,
} from '../cannedFallback.js';

describe('canned fallback content', () => {
  test('reasoning stream canned text is a non-empty string containing Texas location names', () => {
    expect(typeof CANNED_REASONING_STREAM).toBe('string');
    expect(CANNED_REASONING_STREAM.length).toBeGreaterThan(100);
    expect(CANNED_REASONING_STREAM).toContain('Reeves County');
    expect(CANNED_REASONING_STREAM).toContain('Edwards Aquifer');
    expect(CANNED_REASONING_STREAM).toContain('Nolan County');
    expect(CANNED_REASONING_STREAM).toContain('US-385');
    expect(CANNED_REASONING_STREAM).toContain('Sierra Recommends: Route C');
  });

  test('recommendation canned object has routeId and rationale string', () => {
    expect(CANNED_RECOMMENDATION).toBeDefined();
    expect(['A', 'B', 'C']).toContain(CANNED_RECOMMENDATION.routeId);
    expect(typeof CANNED_RECOMMENDATION.rationale).toBe('string');
    expect(CANNED_RECOMMENDATION.rationale.length).toBeGreaterThan(20);
    expect(typeof CANNED_RECOMMENDATION.timestamp).toBe('number');
  });

  test('triggers canned array contains entries for ESA, CWA, NHPA, and NEPA for each route', () => {
    expect(Array.isArray(CANNED_TRIGGERS)).toBe(true);
    expect(CANNED_TRIGGERS).toHaveLength(3);

    const routeIds = CANNED_TRIGGERS.map((t) => t.routeId);
    expect(routeIds).toContain('A');
    expect(routeIds).toContain('B');
    expect(routeIds).toContain('C');

    for (const entry of CANNED_TRIGGERS) {
      const statutes = entry.triggers.map((t) => t.statute);
      expect(statutes.some((s) => s.includes('ESA'))).toBe(true);
      expect(statutes.some((s) => s.includes('CWA'))).toBe(true);
      expect(statutes.some((s) => s.includes('NHPA'))).toBe(true);
      expect(statutes.some((s) => s.includes('NEPA'))).toBe(true);

      for (const trigger of entry.triggers) {
        expect(typeof trigger.statute).toBe('string');
        expect(typeof trigger.explanation).toBe('string');
        expect(Array.isArray(trigger.timelineMonths)).toBe(true);
        expect(trigger.timelineMonths).toHaveLength(2);
      }
    }
  });

  test('alerts canned object has primary with text field and secondary array', () => {
    expect(CANNED_ALERTS).toBeDefined();
    expect(typeof CANNED_ALERTS.primary.text).toBe('string');
    expect(CANNED_ALERTS.primary.text.length).toBeGreaterThan(20);
    expect(typeof CANNED_ALERTS.primary.location).toBe('string');
    expect(Array.isArray(CANNED_ALERTS.secondary)).toBe(true);
    expect(CANNED_ALERTS.secondary.length).toBeGreaterThan(0);
    for (const item of CANNED_ALERTS.secondary) {
      expect(typeof item.text).toBe('string');
      expect(typeof item.location).toBe('string');
    }
  });

  test('summary canned object has exactly 6 phases', () => {
    expect(CANNED_SUMMARY).toBeDefined();
    expect(Array.isArray(CANNED_SUMMARY.phases)).toBe(true);
    expect(CANNED_SUMMARY.phases).toHaveLength(6);
    for (const phase of CANNED_SUMMARY.phases) {
      expect(typeof phase.name).toBe('string');
      expect(Array.isArray(phase.estimatedMonths)).toBe(true);
      expect(phase.estimatedMonths).toHaveLength(2);
      expect(typeof phase.keyDependency).toBe('string');
    }
  });

  test('segment justifications canned map has entries keyed by segment index', () => {
    expect(CANNED_SEGMENT_JUSTIFICATIONS).toBeDefined();
    const keys = Object.keys(CANNED_SEGMENT_JUSTIFICATIONS).map(Number);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(typeof CANNED_SEGMENT_JUSTIFICATIONS[key]).toBe('string');
      expect(CANNED_SEGMENT_JUSTIFICATIONS[key].length).toBeGreaterThan(10);
    }
  });
});
