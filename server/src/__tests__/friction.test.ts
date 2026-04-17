import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { GraphNode, FrictionEntry } from '../types.js';

const FRICTION_PATH = path.resolve('../public/data/friction_cache.json');
const GRAPH_PATH = path.resolve('../public/data/graph.json');

describe('friction_cache.json schema (AI-02, AI-03)', () => {
  it('friction_cache.json exists on disk', () => {
    expect(existsSync(FRICTION_PATH)).toBe(true);
  });

  it('friction_cache.json is a valid JSON object', () => {
    if (!existsSync(FRICTION_PATH)) return;
    const raw = readFileSync(FRICTION_PATH, 'utf-8');
    const cache = JSON.parse(raw);
    expect(typeof cache).toBe('object');
    expect(cache).not.toBeNull();
  });

  it('each entry has frictionScore (0–1) and non-empty justification', () => {
    if (!existsSync(FRICTION_PATH)) return;
    const cache: Record<string, FrictionEntry> = JSON.parse(readFileSync(FRICTION_PATH, 'utf-8'));
    const entries = Object.values(cache).slice(0, 20);
    for (const entry of entries) {
      expect(entry.frictionScore).toBeGreaterThanOrEqual(0);
      expect(entry.frictionScore).toBeLessThanOrEqual(1);
      expect(typeof entry.justification).toBe('string');
      expect(entry.justification.length).toBeGreaterThan(10);
    }
  });

  it('no entry contains lat/lng coordinate fields (AI-03: LLM never generates coordinates)', () => {
    if (!existsSync(FRICTION_PATH)) return;
    const cache = JSON.parse(readFileSync(FRICTION_PATH, 'utf-8'));
    for (const entry of Object.values(cache)) {
      expect(entry).not.toHaveProperty('lat');
      expect(entry).not.toHaveProperty('lng');
      expect(entry).not.toHaveProperty('coordinates');
    }
  });

  it('all graph node IDs appear in friction_cache.json', () => {
    if (!existsSync(FRICTION_PATH) || !existsSync(GRAPH_PATH)) return;
    const cache: Record<string, FrictionEntry> = JSON.parse(readFileSync(FRICTION_PATH, 'utf-8'));
    const nodes: GraphNode[] = JSON.parse(readFileSync(GRAPH_PATH, 'utf-8'));
    const missing = nodes.filter(n => !cache[n.id]);
    expect(missing.length).toBe(0);
  });
});
