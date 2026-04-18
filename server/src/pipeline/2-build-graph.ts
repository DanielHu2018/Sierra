/**
 * 2-build-graph.ts — Graph construction pipeline script
 * Generates a lat/lng grid lattice over Texas, runs BFS connectivity check,
 * and writes public/data/graph.json.
 *
 * Run from repo root: npx tsx server/src/pipeline/2-build-graph.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';
import type { GraphNode } from '../types.js';

// ---- Configuration --------------------------------------------------------
const TEXAS_BBOX = { minLng: -106.65, maxLng: -93.51, minLat: 25.84, maxLat: 36.50 };
const SPACING_KM = 52; // ~52km spacing yields ~560 nodes over Texas (target: 300–600)
const LAT_STEP = SPACING_KM / 111;
const NEIGHBOR_SEARCH_MULTIPLIER = 1.5; // search within SPACING_KM * 1.5
const ERCOT_NEAR_THRESHOLD_KM = 10;
const MAX_NEIGHBORS = 8;
const BFS_MIN_REACHABILITY = 0.95;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_SERVER_ROOT = path.resolve(__dirname, '../..'); // server/

// ---- Interfaces for overlay flags -----------------------------------------
interface NodeFlags {
  esaHabitat: boolean;
  privateLand: boolean;
  nearErcotCorridor: boolean;
  topoElevationM: number | null;
}

// ---- Utility: load GeoJSON -------------------------------------------------
function loadGeoJSON(filePath: string): turf.FeatureCollection | null {
  if (!existsSync(filePath)) {
    console.warn(`GeoJSON not found: ${filePath} — skipping overlay`);
    return null;
  }
  return JSON.parse(readFileSync(filePath, 'utf-8')) as turf.FeatureCollection;
}

// ---- BFS connectivity check -----------------------------------------------
function bfsConnectivityCheck(nodes: GraphNode[]): number {
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

// ---- Main -----------------------------------------------------------------
async function main() {
  console.log('Sierra Pipeline — Step 2: Building routing graph...');

  // Load overlay GeoJSON files (optional — continue if missing)
  const wildlifeGeo = loadGeoJSON(path.join(SERVER_ROOT, 'public/data/wildlife-habitat.geojson'));
  const landGeo = loadGeoJSON(path.join(SERVER_ROOT, 'public/data/land-boundary.geojson'));
  const ercotGeo = loadGeoJSON(path.join(SERVER_ROOT, 'public/data/ercot-grid.geojson'));
  const topoGeo = loadGeoJSON(path.join(SERVER_ROOT, 'public/data/topography.geojson'));

  // Extract individual features for efficiency
  const wildlifeFeatures = wildlifeGeo?.features ?? [];
  const landFeatures = landGeo?.features ?? [];
  const ercotLineFeatures = ercotGeo?.features ?? [];
  const topoFeatures = topoGeo?.features ?? [];

  // ---- Step 1: Generate lat/lng grid lattice --------------------------------
  console.log('Generating lat/lng grid lattice...');
  const nodes: GraphNode[] = [];

  for (let lat = TEXAS_BBOX.minLat; lat <= TEXAS_BBOX.maxLat; lat += LAT_STEP) {
    const lngStep = SPACING_KM / (111 * Math.cos((lat * Math.PI) / 180));
    for (let lng = TEXAS_BBOX.minLng; lng <= TEXAS_BBOX.maxLng; lng += lngStep) {
      const id = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
      nodes.push({ id, lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)), neighbors: [] });
    }
  }

  console.log(`Generated ${nodes.length} nodes`);

  // ---- Step 2: Overlay enrichment (in-memory only, NOT in graph.json) ------
  console.log('Running overlay enrichment (in-memory)...');
  const flagsMap = new Map<string, NodeFlags>();

  for (let i = 0; i < nodes.length; i++) {
    if (i > 0 && i % 50 === 0) {
      console.log(`  Enriched ${i}/${nodes.length} nodes...`);
    }

    const node = nodes[i];
    const pt = turf.point([node.lng, node.lat]);

    // ESA habitat — polygon check
    let esaHabitat = false;
    for (const feature of wildlifeFeatures) {
      if (
        feature.geometry.type === 'Polygon' ||
        feature.geometry.type === 'MultiPolygon'
      ) {
        try {
          if (turf.booleanPointInPolygon(pt, feature as turf.Feature<turf.Polygon | turf.MultiPolygon>)) {
            esaHabitat = true;
            break;
          }
        } catch {
          // Skip malformed features
        }
      }
    }

    // Private land — polygon check
    let privateLand = false;
    for (const feature of landFeatures) {
      if (
        feature.geometry.type === 'Polygon' ||
        feature.geometry.type === 'MultiPolygon'
      ) {
        try {
          if (turf.booleanPointInPolygon(pt, feature as turf.Feature<turf.Polygon | turf.MultiPolygon>)) {
            privateLand = true;
            break;
          }
        } catch {
          // Skip malformed features
        }
      }
    }

    // Near ERCOT corridor — line distance check
    let nearErcotCorridor = false;
    for (const feature of ercotLineFeatures) {
      if (
        feature.geometry.type === 'LineString' ||
        feature.geometry.type === 'MultiLineString'
      ) {
        try {
          const nearest = turf.nearestPointOnLine(
            feature as turf.Feature<turf.LineString | turf.MultiLineString>,
            pt
          );
          const dist = turf.distance(pt, nearest, { units: 'kilometers' });
          if (dist < ERCOT_NEAR_THRESHOLD_KM) {
            nearErcotCorridor = true;
            break;
          }
        } catch {
          // Skip malformed features
        }
      }
    }

    // Topography elevation — nearest point
    let topoElevationM: number | null = null;
    if (topoFeatures.length > 0) {
      try {
        const topoPoints = topoFeatures
          .filter(f => f.geometry.type === 'Point')
          .map(f => f as turf.Feature<turf.Point>);

        if (topoPoints.length > 0) {
          const fc = turf.featureCollection(topoPoints);
          const nearest = turf.nearestPoint(pt, fc);
          const elevation = nearest.properties?.elevation ?? nearest.properties?.ELEVATION ?? nearest.properties?.elev;
          if (typeof elevation === 'number') {
            topoElevationM = elevation;
          }
        }
      } catch {
        // Skip if topo data is malformed
      }
    }

    flagsMap.set(node.id, { esaHabitat, privateLand, nearErcotCorridor, topoElevationM });
  }

  console.log('Overlay enrichment complete');

  // ---- Step 3: Build neighbor lists via proximity search -------------------
  console.log('Building neighbor lists...');
  const searchRadiusKm = SPACING_KM * NEIGHBOR_SEARCH_MULTIPLIER;

  for (let i = 0; i < nodes.length; i++) {
    if (i > 0 && i % 50 === 0) {
      console.log(`  Building neighbors: ${i}/${nodes.length} nodes...`);
    }

    const node = nodes[i];
    const nodePt = turf.point([node.lng, node.lat]);

    const withDistances: Array<{ id: string; dist: number }> = [];

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const other = nodes[j];

      // Quick bounding box pre-filter to avoid turf.distance on far nodes
      const latDiff = Math.abs(node.lat - other.lat);
      const lngDiff = Math.abs(node.lng - other.lng);
      const roughDegrees = searchRadiusKm / 111;
      if (latDiff > roughDegrees * 1.5 || lngDiff > roughDegrees * 1.5) continue;

      const otherPt = turf.point([other.lng, other.lat]);
      const dist = turf.distance(nodePt, otherPt, { units: 'kilometers' });

      if (dist <= searchRadiusKm) {
        withDistances.push({ id: other.id, dist });
      }
    }

    // Sort by distance, take closest MAX_NEIGHBORS
    withDistances.sort((a, b) => a.dist - b.dist);
    node.neighbors = withDistances.slice(0, MAX_NEIGHBORS).map(x => x.id);
  }

  console.log('Neighbor lists built');

  // ---- Step 4: BFS connectivity check -------------------------------------
  console.log('Running BFS connectivity check...');
  const reachability = bfsConnectivityCheck(nodes);
  console.log(`BFS reachability: ${(reachability * 100).toFixed(1)}% (${Math.round(reachability * nodes.length)}/${nodes.length} nodes)`);

  if (reachability < BFS_MIN_REACHABILITY) {
    throw new Error(
      `BFS check failed: graph is not sufficiently connected (${(reachability * 100).toFixed(1)}% < ${BFS_MIN_REACHABILITY * 100}%)`
    );
  }

  console.log(`BFS check passed: ${(reachability * 100).toFixed(1)}% reachable`);

  // ---- Step 5: Write graph.json -------------------------------------------
  const graphPath = path.join(SERVER_ROOT, 'public/data/graph.json');
  mkdirSync(path.dirname(graphPath), { recursive: true });
  writeFileSync(graphPath, JSON.stringify(nodes, null, 2));
  console.log(`graph.json written: ${nodes.length} nodes to ${graphPath}`);

  // ---- Step 6: Write node-flags.json (for use by step 3) ------------------
  const flagsPath = path.join(SERVER_ROOT, 'public/data/node-flags.json');
  mkdirSync(path.dirname(flagsPath), { recursive: true });
  const flagsObj: Record<string, NodeFlags> = {};
  for (const [id, flags] of flagsMap.entries()) {
    flagsObj[id] = flags;
  }
  writeFileSync(flagsPath, JSON.stringify(flagsObj, null, 2));
  console.log(`node-flags.json written: ${flagsMap.size} entries`);
}

main().catch(err => {
  console.error('Graph build failed:', err.message);
  process.exit(1);
});
