---
phase: 03-routing-engine-core-demo-loop
plan: "03"
subsystem: routing-engine
tags: [astar, ngraph, routing, express, api]
dependency_graph:
  requires: [03-01, 02-02]
  provides: [POST /api/route, A* engine]
  affects: [03-04, 03-05]
tech_stack:
  added: [ngraph.graph, ngraph.path]
  patterns: [A* with haversine heuristic, module-init graph loading, three weight profiles, adjacency-list to ngraph conversion]
key_files:
  created:
    - server/src/routing/astar.ts
    - server/src/__tests__/routing.test.ts (populated from scaffolds)
  modified:
    - server/src/routes/api.ts
decisions:
  - "graph.json is Phase 2 adjacency-list format (array of {id,lat,lng,neighbors}) not {nodes,edges} — adapted buildGraph to convert neighbors to ngraph links"
  - "Edge frictionScore computed as average of source and destination node friction_cache values (no per-edge friction in Phase 2 data)"
  - "regulatoryRisk uses same frictionScore signal (Phase 2 data doesn't separate them)"
  - "findRoute reverses ngraph.path output (dest-first) to return src→dest order"
  - "cannedStubRoutes fallback guards against empty graph at startup"
metrics:
  duration: "8 minutes"
  completed: "2026-04-18"
  tasks_completed: 2
  files_changed: 3
requirements: [ROUTE-01, ROUTE-02, ROUTE-05]
---

# Phase 03 Plan 03: A* Routing Engine + POST /api/route Summary

**One-liner:** A* routing engine using ngraph with haversine heuristic; three weight profiles (cost/balanced/risk) served via POST /api/route with frictionCache-backed segment justifications.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build A* engine module (astar.ts) | 49ac2d1 | server/src/routing/astar.ts, server/src/__tests__/routing.test.ts |
| 2 | Add POST /api/route endpoint | 42178d9 | server/src/routes/api.ts |

## What Was Built

### astar.ts

- `buildGraph(nodes, frictionCache)` — converts Phase 2 adjacency-list graph (564 nodes, `{id,lat,lng,neighbors}` array) into ngraph.graph. Edge friction = average of source/dest node frictionCache entries.
- `findNearestNode(lat, lng, nodes)` — O(n) Euclidean scan; maps arbitrary pin coordinates to nearest graph node ID.
- `findRoute(fromId, toId, graph, weights)` — A* via `ngraph.path.aStar`; distance = `frictionScore * costW + regulatoryRisk * riskW`; haversine heuristic. Returns ordered `string[]` (src→dest).
- `sharedGraph` — pre-built singleton at module init; graph loaded once from `public/data/graph.json`.
- `haversineKm` exported for reuse in api.ts metric calculation.

### api.ts POST /api/route

- Accepts `{source: [lng,lat], dest: [lng,lat], constraints: {costRisk, coLocation, eminentDomainAvoidance, ecologyAvoidance}, voltage}`.
- `blendWeights()` interpolates `constraints.costRisk` (0→1 slider) into each profile's base weights.
- Three parallel `findRoute` calls: Route A (costW=1.5, riskW=0.5), Route B (1.0, 1.0), Route C (0.5, 1.5).
- Converts node-ID paths to GeoJSON LineString, computes distanceMiles (haversine sum × 0.621), estimatedCapexUSD (per-profile $/mile), permittingMonths.
- `segmentJustifications` populated from `frictionCache` keyed by node ID.
- `narrativeSummary` set to `''` (LLM fills via `/api/recommend`).
- Fallback: `cannedStubRoutes()` returns two-point LineStrings when graph is empty.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Adaptation] graph.json uses adjacency-list format, not {nodes,edges}**
- **Found during:** Task 1, pre-implementation inspection
- **Issue:** Plan documented `{nodes: [...], edges: [{from,to,frictionScore,distanceKm}]}` format. Actual Phase 2 output is `[{id, lat, lng, neighbors: string[]}]` — a flat node array where edges are implicit neighbor references.
- **Fix:** `buildGraph` iterates each node's `neighbors` array to create ngraph links. Edge friction computed as average of source + destination `frictionCache` values (no per-edge friction in Phase 2 data).
- **Files modified:** server/src/routing/astar.ts
- **Commit:** 49ac2d1

**2. [Rule 1 - Adaptation] ngraph.path returns nodes in dest-first order**
- **Found during:** Task 1, TDD GREEN phase
- **Issue:** `ngraph.path` aStar returns the found path with destination node first.
- **Fix:** Added `.reverse()` to `findRoute` return to produce src→dest order.
- **Files modified:** server/src/routing/astar.ts
- **Commit:** 49ac2d1

## Verification Results

- 27/27 server tests pass (`npx vitest run --reporter=dot`)
- All 5 routing.test.ts assertions pass (RED → GREEN TDD cycle)
- `buildGraph`, `findNearestNode`, `findRoute` all export as `function`
- `graphNodes.length === 564` (Phase 2 graph loaded at startup)

## Self-Check: PASSED
