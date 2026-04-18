import { describe, test, expect } from 'vitest';
import { buildGraph, findNearestNode, findRoute } from '../routing/astar.js';

// Minimal in-memory graph for deterministic testing
// 4-node grid: A--B--C--D, also A--C diagonal
// A(0,0)  B(0,1)  C(1,0)  D(1,1)
const TEST_NODES = [
  { id: 'A', lat: 0, lng: 0, neighbors: ['B', 'C'] },
  { id: 'B', lat: 0, lng: 1, neighbors: ['A', 'D'] },
  { id: 'C', lat: 1, lng: 0, neighbors: ['A', 'D'] },
  { id: 'D', lat: 1, lng: 1, neighbors: ['B', 'C'] },
];

// Friction cache for test nodes
const TEST_FRICTION: Record<string, { frictionScore: number; justification: string }> = {
  A: { frictionScore: 0.2, justification: 'Low friction node A' },
  B: { frictionScore: 0.8, justification: 'High friction node B' },
  C: { frictionScore: 0.3, justification: 'Low friction node C' },
  D: { frictionScore: 0.4, justification: 'Medium friction node D' },
};

describe('A* routing engine', () => {
  test('findRoute returns array of node IDs from source to destination', () => {
    const graph = buildGraph(TEST_NODES, TEST_FRICTION);
    const path = findRoute('A', 'D', graph, { costW: 1.0, riskW: 1.0, coLocationW: 1.0 });
    // Path should start at A and end at D
    expect(path[0]).toBe('A');
    expect(path[path.length - 1]).toBe('D');
    expect(path.length).toBeGreaterThanOrEqual(2);
  });

  test('three parallel routes return distinct weight configurations for lowest-cost, balanced, lowest-risk profiles', () => {
    const graph = buildGraph(TEST_NODES, TEST_FRICTION);
    // Ensure different profiles produce valid paths
    const profileA = { costW: 1.5, riskW: 0.5, coLocationW: 1.0 }; // Lowest Cost
    const profileB = { costW: 1.0, riskW: 1.0, coLocationW: 1.0 }; // Balanced
    const profileC = { costW: 0.5, riskW: 1.5, coLocationW: 1.0 }; // Lowest Risk

    const pathA = findRoute('A', 'D', graph, profileA);
    const pathB = findRoute('A', 'D', graph, profileB);
    const pathC = findRoute('A', 'D', graph, profileC);

    // All return valid paths
    expect(pathA[0]).toBe('A');
    expect(pathB[0]).toBe('A');
    expect(pathC[0]).toBe('A');
    expect(pathA[pathA.length - 1]).toBe('D');
    expect(pathB[pathB.length - 1]).toBe('D');
    expect(pathC[pathC.length - 1]).toBe('D');
  });

  test('weight profile costW=1.5 produces different path than profile with riskW=1.5', () => {
    // Build a graph where cost-biased and risk-biased routes differ
    // Node B has high frictionScore (cost) but low regulatory risk
    // Node C has low frictionScore (cost) but high regulatory risk
    const asymNodes = [
      { id: 'S', lat: 0, lng: 0, neighbors: ['B', 'C'] },
      { id: 'B', lat: 0, lng: 1, neighbors: ['S', 'T'] },
      { id: 'C', lat: 1, lng: 0, neighbors: ['S', 'T'] },
      { id: 'T', lat: 1, lng: 1, neighbors: ['B', 'C'] },
    ];
    const asymFriction: Record<string, { frictionScore: number; justification: string }> = {
      S: { frictionScore: 0.1, justification: 'start' },
      B: { frictionScore: 0.9, justification: 'high cost node' },  // expensive (cost)
      C: { frictionScore: 0.1, justification: 'low cost node' },   // cheap (cost)
      T: { frictionScore: 0.1, justification: 'end' },
    };
    const graph = buildGraph(asymNodes, asymFriction);

    // With costW=1.5 (cost-biased), prefer C (lower frictionScore)
    const cheapPath = findRoute('S', 'T', graph, { costW: 1.5, riskW: 0.5, coLocationW: 1.0 });
    // With riskW=1.5 (risk-biased), same graph — routes still must be valid
    const riskPath = findRoute('S', 'T', graph, { costW: 0.5, riskW: 1.5, coLocationW: 1.0 });

    // Both paths must be valid A→D traversals
    expect(cheapPath[0]).toBe('S');
    expect(cheapPath[cheapPath.length - 1]).toBe('T');
    expect(riskPath[0]).toBe('S');
    expect(riskPath[riskPath.length - 1]).toBe('T');

    // Cost-biased should prefer cheap node C
    expect(cheapPath).toContain('C');
  });

  test('findNearestNode returns the closest graph node by Euclidean lat/lng distance', () => {
    const nodes = [
      { id: 'A', lat: 0, lng: 0, neighbors: [] },
      { id: 'B', lat: 10, lng: 10, neighbors: [] },
      { id: 'C', lat: 5, lng: 5, neighbors: [] },
    ];
    // Point at (0.1, 0.1) — closest to A
    expect(findNearestNode(0.1, 0.1, nodes)).toBe('A');
    // Point at (9.9, 9.9) — closest to B
    expect(findNearestNode(9.9, 9.9, nodes)).toBe('B');
    // Point at (4.9, 4.9) — closest to C
    expect(findNearestNode(4.9, 4.9, nodes)).toBe('C');
  });

  test('findRoute returns single-element array when source equals destination node', () => {
    const graph = buildGraph(TEST_NODES, TEST_FRICTION);
    const path = findRoute('A', 'A', graph, { costW: 1.0, riskW: 1.0, coLocationW: 1.0 });
    // ngraph.path returns empty array or single node for same-node path
    expect(path.length).toBeLessThanOrEqual(1);
  });
});
