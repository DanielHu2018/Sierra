import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { GraphNode } from '../types.js';

const GRAPH_PATH = path.resolve('../public/data/graph.json');

describe('graph.json schema (ROUTE-03, ROUTE-04)', () => {
  it('graph.json exists on disk', () => {
    expect(existsSync(GRAPH_PATH)).toBe(true);
  });

  it('graph.json is a valid JSON array', () => {
    if (!existsSync(GRAPH_PATH)) return;
    const raw = readFileSync(GRAPH_PATH, 'utf-8');
    const nodes = JSON.parse(raw);
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('each node has id, lat, lng, neighbors fields', () => {
    if (!existsSync(GRAPH_PATH)) return;
    const nodes: GraphNode[] = JSON.parse(readFileSync(GRAPH_PATH, 'utf-8'));
    for (const node of nodes.slice(0, 10)) {
      expect(typeof node.id).toBe('string');
      expect(typeof node.lat).toBe('number');
      expect(typeof node.lng).toBe('number');
      expect(Array.isArray(node.neighbors)).toBe(true);
    }
  });

  it('graph contains 300–600 nodes (25km spacing over Texas)', () => {
    if (!existsSync(GRAPH_PATH)) return;
    const nodes: GraphNode[] = JSON.parse(readFileSync(GRAPH_PATH, 'utf-8'));
    expect(nodes.length).toBeGreaterThanOrEqual(300);
    expect(nodes.length).toBeLessThanOrEqual(600);
  });

  it('node coordinates are within Texas bounding box', () => {
    if (!existsSync(GRAPH_PATH)) return;
    const nodes: GraphNode[] = JSON.parse(readFileSync(GRAPH_PATH, 'utf-8'));
    for (const node of nodes) {
      expect(node.lat).toBeGreaterThanOrEqual(25.84);
      expect(node.lat).toBeLessThanOrEqual(36.50);
      expect(node.lng).toBeGreaterThanOrEqual(-106.65);
      expect(node.lng).toBeLessThanOrEqual(-93.51);
    }
  });
});
