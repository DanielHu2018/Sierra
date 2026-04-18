import { readFileSync } from 'fs';
import { resolve } from 'path';
import createGraph from 'ngraph.graph';
import { aStar } from 'ngraph.path';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Node as stored in graph.json (adjacency-list format from Phase 2) */
export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  neighbors: string[];
}

/** Internal edge data stored on graph links */
interface EdgeData {
  frictionScore: number;
  regulatoryRisk: number;
}

/** Friction cache entry from friction_cache.json */
export interface FrictionEntry {
  frictionScore: number;
  justification: string;
}

export type FrictionCache = Record<string, FrictionEntry>;

export interface RouteWeights {
  costW: number;
  riskW: number;
  coLocationW: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  } catch {
    console.warn(`[astar] Could not load ${filePath} — using fallback`);
    return fallback;
  }
}

/** Haversine distance in km between two lat/lng points */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Data Loading (once at module init) ──────────────────────────────────────

const GRAPH_PATH = resolve(process.cwd(), '../public/data/graph.json');
const FRICTION_PATH = resolve(process.cwd(), '../public/data/friction_cache.json');

// graph.json is an array of nodes (Phase 2 adjacency-list format)
export const graphNodes = loadJson<GraphNode[]>(GRAPH_PATH, []);
export const frictionCache = loadJson<FrictionCache>(FRICTION_PATH, {});

// Build an O(1) node lookup map
const nodeMap = new Map<string, GraphNode>(graphNodes.map((n) => [n.id, n]));

// ─── Graph Construction ───────────────────────────────────────────────────────

/**
 * Build an ngraph.graph from the Phase 2 adjacency-list format.
 *
 * Accepts custom nodes + frictionCache for testing.
 * When called with no args, uses the module-level data loaded from disk.
 */
export function buildGraph(
  nodes: GraphNode[] = graphNodes,
  cache: FrictionCache = frictionCache,
) {
  const g = createGraph<GraphNode, EdgeData>();

  // Add all nodes first
  for (const node of nodes) {
    g.addNode(node.id, node);
  }

  // Add directed edges from adjacency lists.
  // frictionScore comes from the source node's friction_cache entry.
  // We use the same value as regulatoryRisk since Phase 2 doesn't separate them.
  for (const node of nodes) {
    const srcFriction = cache[node.id]?.frictionScore ?? 0.5;
    for (const neighborId of node.neighbors) {
      // ngraph.graph.addLink is idempotent-ish but we avoid duplicates with hasLink
      if (!g.hasLink(node.id, neighborId)) {
        const dstFriction = cache[neighborId]?.frictionScore ?? 0.5;
        // Edge friction = average of source and destination node frictions
        const edgeFriction = (srcFriction + dstFriction) / 2;
        g.addLink(node.id, neighborId, {
          frictionScore: edgeFriction,
          regulatoryRisk: edgeFriction, // same signal in Phase 2 data
        });
      }
    }
  }

  return g;
}

/** Pre-built shared graph — loaded once at module init */
export const sharedGraph = buildGraph();

// ─── Nearest Node Lookup ──────────────────────────────────────────────────────

/**
 * Return the graph node ID closest to (lat, lng) by Euclidean distance.
 * Uses the module-level graphNodes list by default; pass custom list for tests.
 */
export function findNearestNode(
  lat: number,
  lng: number,
  nodes: GraphNode[] = graphNodes,
): string {
  let nearest = nodes[0]?.id ?? 'node-0';
  let minDist = Infinity;
  for (const node of nodes) {
    const dist = (node.lat - lat) ** 2 + (node.lng - lng) ** 2;
    if (dist < minDist) {
      minDist = dist;
      nearest = node.id;
    }
  }
  return nearest;
}

// ─── A* Route Finding ─────────────────────────────────────────────────────────

type NGraph = ReturnType<typeof buildGraph>;

/**
 * Run A* from fromNodeId to toNodeId.
 *
 * Distance function: edge.frictionScore * costW + edge.regulatoryRisk * riskW
 * Heuristic: haversine distance between nodes (admissible for geographic graphs)
 *
 * Returns an ordered array of node IDs (first = source, last = dest).
 * Returns [] when source equals destination (ngraph.path behaviour).
 */
export function findRoute(
  fromNodeId: string,
  toNodeId: string,
  graph: NGraph = sharedGraph,
  weights: RouteWeights = { costW: 1.0, riskW: 1.0, coLocationW: 1.0 },
): string[] {
  // Same node — return immediately without calling A* to avoid edge cases
  if (fromNodeId === toNodeId) return [];

  // Build a node lookup for heuristic (works with custom test graphs too)
  const localNodeMap = new Map<string, { lat: number; lng: number }>();
  graph.forEachNode((node) => {
    if (node.data) {
      localNodeMap.set(node.id as string, { lat: (node.data as GraphNode).lat, lng: (node.data as GraphNode).lng });
    }
  });

  const finder = aStar(graph, {
    distance(_from, _to, link) {
      const data = link.data as EdgeData;
      return (data.frictionScore ?? 0.5) * weights.costW + (data.regulatoryRisk ?? 0.5) * weights.riskW;
    },
    heuristic(from, to) {
      const a = localNodeMap.get(from.id as string) ?? { lat: 0, lng: 0 };
      const b = localNodeMap.get(to.id as string) ?? { lat: 0, lng: 0 };
      return haversineKm(a.lat, a.lng, b.lat, b.lng);
    },
    oriented: true,
  });

  const path = finder.find(fromNodeId, toNodeId);
  // ngraph.path returns nodes in reverse order (dest first) — reverse to get src→dest
  return path.map((n) => n.id as string).reverse();
}
