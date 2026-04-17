import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { GraphNode } from '../types.js';

const GRAPH_PATH = path.resolve('../public/data/graph.json');

function runBFS(nodes: GraphNode[]): number {
  if (nodes.length === 0) return 0;
  const adjacency = new Map(nodes.map(n => [n.id, n.neighbors]));
  const visited = new Set<string>();
  const queue = [nodes[0].id];
  visited.add(nodes[0].id);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited.size / nodes.length;
}

describe('graph.json BFS connectivity (ROUTE-07)', () => {
  it('BFS reachability is >= 95% of all nodes', () => {
    if (!existsSync(GRAPH_PATH)) return;
    const nodes: GraphNode[] = JSON.parse(readFileSync(GRAPH_PATH, 'utf-8'));
    const reachability = runBFS(nodes);
    expect(reachability).toBeGreaterThanOrEqual(0.95);
  });
});
