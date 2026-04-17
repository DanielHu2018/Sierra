# Phase 2: Offline Data Pipeline & AI Core - Research

**Researched:** 2026-04-16
**Domain:** Node.js offline pipeline — graph construction, GeoJSON enrichment, Claude friction scoring, OpenAI embeddings, in-memory RAG, Express server
**Confidence:** HIGH (core decisions are locked; research confirms chosen libraries are current and well-supported)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Graph structure:** Regular lat/lng grid lattice over Texas bounding box, ~25km node spacing (~300–500 nodes). Schema: `{ id, lat, lng, neighbors: string[] }`. Friction lives separately in `friction_cache.json` keyed by node id.
- **Overlay enrichment:** Per-node point-in-polygon checks (turf.js) against existing GeoJSON overlays produce boolean/categorical flags (`esaHabitat`, `privateLand`, `topoElevationM`, `nearErcotCorridor`). Flags are NOT stored in graph.json — used only as Claude context for friction scoring.
- **BFS connectivity check:** Pipeline validates >95% of nodes are reachable before writing graph.json.
- **Regulation source:** Real regulatory documents scraped from public .gov URLs at pipeline run time (PUCT, NEPA, ESA Section 7, CWA Section 404, NHPA Section 106, Texas habitat).
- **Embedding model:** Claude API preferred; fall back to OpenAI `text-embedding-3-small` if Anthropic has no dedicated embeddings endpoint (confirmed: Anthropic does NOT expose embeddings — OpenAI is the active path). Adds `openai` npm package to `/server` only.
- **Pipeline sequence:** (1) scrape + embed regulations → (2) build graph → (3) score friction with RAG context. Sequential, not parallel.
- **Friction batching:** ~20–25 geographically nearby nodes per Claude call. Each batch gets node coords + overlay flags + top 2–3 RAG-retrieved regulation excerpts. Claude returns JSON array `{ nodeId, frictionScore: number (0–1), justification: string }`.
- **Concurrency:** `p-limit` with 3–5 batches in parallel. 3x retry with exponential backoff. Partial progress written to disk for resumption.
- **Output files:** `public/data/friction_cache.json` (static, served by Vite). `regulations-embedded.json` (loaded by Express at startup).
- **LLM constraint (AI-03):** Claude scores friction only — never generates or modifies coordinates.
- **Backend:** Node.js + Express in `/server` directory, port 3001. Vite dev server (port 3000) proxies `/api/*` to Express.
- **Express startup:** Loads `regulations-embedded.json` into memory before serving requests.
- **Static file serving:** `graph.json` and `friction_cache.json` are in `public/data/` and served by Vite as static assets — no server needed for routing data.

### Claude's Discretion

- Exact chunking strategy for regulation documents (sentence-level vs. paragraph-level)
- Number of regulation chunks per statute (target: 5–10 per statute, ~40–60 total)
- Specific RAG retrieval approach (cosine similarity threshold, top-k)
- Graph bounding box exact coordinates for Texas
- Whether to include diagonal edges (8-connected vs 4-connected grid)
- Pipeline script naming and directory structure within `/server`

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | RAG index built at startup from PUCT, Texas environmental, NEPA, ESA, CWA Section 404, NHPA Section 106, and wildlife habitat regulation text chunks embedded in-memory (no external vector DB) | In-memory cosine similarity retrieval over `regulations-embedded.json`; no Pinecone/Weaviate needed; dot-product search over float32 arrays |
| AI-02 | LLM (Claude) produces friction score (0–1 float) and one-line justification for each graph node during offline pipeline | Claude messages API with `output_config.format` structured JSON; batch ~20–25 nodes per call |
| AI-03 | LLM never generates or modifies coordinates — all geometry from pre-built graph only | Enforced by pipeline architecture: graph written before Claude is called; Claude prompt explicitly excludes coordinate generation |
| ROUTE-03 | A* or Dijkstra runs on pre-built friction-weighted graph (graph.json); LLM not in hot path | graph.json written by pipeline; read-only at Phase 3 route time |
| ROUTE-04 | Friction scores for all graph nodes pre-computed offline and loaded from friction_cache.json at startup | `friction_cache.json` keyed by node id; loaded into Zustand store on app init |
| ROUTE-07 | Graph construction includes BFS connectivity check (>95% nodes reachable) before any route request is served | BFS over adjacency list; pipeline aborts and does not write graph.json if check fails |

</phase_requirements>

---

## Summary

Phase 2 is a one-time offline build pipeline that produces three artifacts consumed by Phase 3: `graph.json` (routing graph), `friction_cache.json` (AI-scored node friction), and an in-memory RAG index loaded by the Express server. All AI work is pre-computed so that Phase 3 routing never blocks on LLM calls.

The pipeline is sequential: scrape and embed regulation text first, build the graph second, score friction with RAG context third. The Express server bootstrapped in this phase serves as the API host for all Phase 3 live Claude calls. No live LLM calls happen during routing.

The embedding path is settled: Anthropic does not expose a dedicated embeddings endpoint, so OpenAI `text-embedding-3-small` (via the `openai` npm SDK v6) is the active embedding path. The `@anthropic-ai/sdk` (v0.88+) handles all Claude friction scoring calls. Both are Node.js only — the frontend never calls these SDKs directly.

**Primary recommendation:** Write `/server/pipeline/` as three sequential TypeScript scripts invoked by a single `npm run pipeline` command. Each script writes its output to disk, enabling safe resumption. The Express server and pipeline share types via a `server/types.ts` file (or import from `../src/types.ts`).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | ^0.88.0 | Claude API calls for friction scoring | Official Anthropic SDK; supports structured JSON output via `output_config.format` (GA, no beta header needed) |
| `openai` | ^6.16.0 | `text-embedding-3-small` embeddings | Official OpenAI SDK; Anthropic has no embeddings endpoint; belongs in `/server` only |
| `@turf/turf` | ^7.3.0 | Point-in-polygon checks, distance calculations | Industry-standard geospatial library; `booleanPointInPolygon` handles convex/concave/holed polygons |
| `p-limit` | ^6.x | Concurrent batch throttling (3–5 batches) | Pure ESM; works in Node.js 18+ ESM projects; wraps `Promise.all` cleanly |
| `express` | ^4.21.x | HTTP server for `/api/*` endpoints | Locked decision; port 3001; proxied by Vite |
| `cors` | ^2.8.5 | Enable cross-origin requests from Vite (port 3000) | Required when Vite and Express run on different ports |
| `tsx` | ^4.x | Run TypeScript pipeline scripts directly | Zero-config TS execution; dev-only; no compilation step for pipeline scripts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node-fetch` | built-in (Node 18+) | Fetch regulation documents from .gov URLs | Use native `fetch` (Node 18+ global) — no extra package needed |
| `exponential-backoff` | ^3.1.x | Retry failed Claude calls | Simple drop-in; alternative is hand-rolled `delay * 2^attempt + jitter` (acceptable since it's trivial) |
| `@types/express` | ^5.x | TypeScript types for Express | DevDependency in `/server` |
| `@types/cors` | ^2.x | TypeScript types for cors | DevDependency in `/server` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OpenAI embeddings | Cohere, local model (Ollama) | OpenAI locked by user decision; fastest to set up for hackathon |
| `p-limit` | `p-queue`, manual semaphore | p-limit is simpler for flat batch arrays; p-queue needed only if priority/pause required |
| `@turf/turf` (full) | `@turf/boolean-point-in-polygon` individually | Full `@turf/turf` is larger but avoids juggling individual packages; acceptable for a build pipeline |
| `tsx` | `ts-node`, compile to JS | `tsx` is faster startup; no tsconfig changes needed |

**Installation (in `/server`):**
```bash
npm install express cors @anthropic-ai/sdk openai @turf/turf p-limit
npm install -D tsx typescript @types/express @types/cors @types/node
```

---

## Architecture Patterns

### Recommended Project Structure
```
server/
├── package.json              # Separate from root; "type": "module" or CJS with tsx
├── tsconfig.json             # Server-specific TS config
├── index.ts                  # Express server entry point — loads RAG index, mounts routes
├── types.ts                  # Server-side types (or re-export from ../src/types.ts)
├── rag/
│   └── ragIndex.ts           # In-memory RAG: load regulations-embedded.json, cosine search
├── routes/
│   └── api.ts                # Express router for /api/* Phase 3 endpoints
└── pipeline/
    ├── run-pipeline.ts       # Orchestrator: runs steps 1–3 sequentially
    ├── 1-scrape-embed.ts     # Fetch regulation text, chunk, embed, write regulations-embedded.json
    ├── 2-build-graph.ts      # Generate lat/lng grid, enrich nodes, BFS check, write graph.json
    └── 3-score-friction.ts   # Load graph + RAG, batch Claude calls, write friction_cache.json

public/data/                  # Written by pipeline; served by Vite as static assets
├── graph.json
└── friction_cache.json

regulations-embedded.json     # Written by pipeline; loaded by Express at startup (NOT in public/)
```

### Pattern 1: Sequential Pipeline with Disk Checkpoints
**What:** Each pipeline step reads its input from disk and writes its output to disk. If step 3 fails, re-running skips steps 1 and 2 by detecting output files.
**When to use:** Any multi-step process that calls external APIs and may partially fail.
**Example:**
```typescript
// server/pipeline/run-pipeline.ts
import { existsSync } from 'fs';

async function main() {
  if (!existsSync('regulations-embedded.json')) {
    console.log('Step 1: Scraping and embedding regulations...');
    await import('./1-scrape-embed.js');
  } else {
    console.log('Step 1: regulations-embedded.json exists, skipping.');
  }

  if (!existsSync('../public/data/graph.json')) {
    console.log('Step 2: Building graph...');
    await import('./2-build-graph.js');
  }

  if (!existsSync('../public/data/friction_cache.json')) {
    console.log('Step 3: Scoring friction...');
    await import('./3-score-friction.js');
  }

  console.log('Pipeline complete.');
}

main().catch(console.error);
```

### Pattern 2: Lat/Lng Grid Graph Generation
**What:** Generate a regular grid of nodes over the Texas bounding box with ~25km spacing. Connect each node to its 4 (or 8) geographic neighbors.
**When to use:** Building the routing graph from scratch.
**Example:**
```typescript
// server/pipeline/2-build-graph.ts
import * as turf from '@turf/turf';

// Texas bounding box (approximate)
const TEXAS_BBOX = { minLng: -106.65, maxLng: -93.51, minLat: 25.84, maxLat: 36.50 };
const SPACING_KM = 25;

// ~25km in degrees latitude: 25 / 111 ≈ 0.225°
const LAT_STEP = SPACING_KM / 111;

interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  neighbors: string[];
}

function buildGrid(): GraphNode[] {
  const nodes: GraphNode[] = [];
  const nodeMap = new Map<string, GraphNode>();

  for (let lat = TEXAS_BBOX.minLat; lat <= TEXAS_BBOX.maxLat; lat += LAT_STEP) {
    // Longitude step varies by latitude: 25km / (111 * cos(lat))
    const lngStep = SPACING_KM / (111 * Math.cos((lat * Math.PI) / 180));
    for (let lng = TEXAS_BBOX.minLng; lng <= TEXAS_BBOX.maxLng; lng += lngStep) {
      const id = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
      const node: GraphNode = { id, lat, lng, neighbors: [] };
      nodes.push(node);
      nodeMap.set(id, node);
    }
  }
  // Connect neighbors (4-connected or 8-connected — discretion area)
  // ... neighbor linkage by proximity lookup
  return nodes;
}
```

### Pattern 3: Point-in-Polygon Node Enrichment
**What:** For each graph node, run turf.js point-in-polygon checks against existing GeoJSON overlays to produce boolean/categorical flags.
**When to use:** Enrichment step in `2-build-graph.ts` before writing graph.json.
**Example:**
```typescript
// Source: https://turfjs.org/docs/api/booleanPointInPolygon (v7.3.0)
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

interface NodeFlags {
  esaHabitat: boolean;
  privateLand: boolean;
  topoElevationM: number;
  nearErcotCorridor: boolean;
}

function enrichNode(
  lat: number,
  lng: number,
  habitatPolygons: Feature<Polygon | MultiPolygon>[],
  landPolygons: Feature<Polygon | MultiPolygon>[],
  // ...
): NodeFlags {
  const pt = point([lng, lat]);
  const esaHabitat = habitatPolygons.some(poly => booleanPointInPolygon(pt, poly));
  const privateLand = landPolygons.some(poly => booleanPointInPolygon(pt, poly));
  return { esaHabitat, privateLand, topoElevationM: 0, nearErcotCorridor: false };
}
```

### Pattern 4: BFS Connectivity Validation
**What:** Run BFS from a single seed node; count reachable nodes; abort if < 95% reachable.
**When to use:** After graph is built but before writing `graph.json` to disk.
**Example:**
```typescript
function bfsConnectivityCheck(nodes: GraphNode[]): boolean {
  if (nodes.length === 0) return false;
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

  const reachable = visited.size / nodes.length;
  console.log(`BFS: ${(reachable * 100).toFixed(1)}% of nodes reachable`);
  return reachable >= 0.95; // ROUTE-07
}
```

### Pattern 5: Batched Claude Friction Scoring with p-limit
**What:** Group ~20–25 nodes per Claude call; run 3–5 batches concurrently; retry failures with backoff.
**When to use:** `3-score-friction.ts` — the main scoring loop.
**Example:**
```typescript
// Source: @anthropic-ai/sdk v0.88+; output_config.format is GA (no beta header)
import Anthropic from '@anthropic-ai/sdk';
import pLimit from 'p-limit';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const limit = pLimit(4); // 4 concurrent batches

interface FrictionScore {
  nodeId: string;
  frictionScore: number;
  justification: string;
}

async function scoreBatch(
  batch: EnrichedNode[],
  ragExcerpts: string[]
): Promise<FrictionScore[]> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: 'You are a transmission line routing expert scoring friction for pre-transmission planning. Score ONLY — do not generate or modify coordinates.',
    messages: [{
      role: 'user',
      content: buildFrictionPrompt(batch, ragExcerpts)
    }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            scores: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nodeId: { type: 'string' },
                  frictionScore: { type: 'number', minimum: 0, maximum: 1 },
                  justification: { type: 'string' }
                },
                required: ['nodeId', 'frictionScore', 'justification'],
                additionalProperties: false
              }
            }
          },
          required: ['scores'],
          additionalProperties: false
        }
      }
    }
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text).scores as FrictionScore[];
}

// Throttled execution across all batches
const results = await Promise.all(
  batches.map(batch => limit(() => withRetry(() => scoreBatch(batch, getRAGExcerpts(batch)))))
);
```

### Pattern 6: In-Memory RAG — Cosine Similarity Retrieval
**What:** Load `regulations-embedded.json` (array of `{ text, embedding: number[] }`) at server startup. For each query, compute cosine similarity against all stored embeddings and return top-k chunks.
**When to use:** Pipeline step 3 (RAG lookup per batch) and Express server (Phase 3 live calls).
**Example:**
```typescript
// server/rag/ragIndex.ts
interface RegChunk {
  text: string;
  embedding: number[];
  statute: string;
}

let index: RegChunk[] = [];

export function loadRAGIndex(path: string): void {
  index = JSON.parse(fs.readFileSync(path, 'utf-8'));
  console.log(`RAG index loaded: ${index.length} chunks`);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function retrieveTopK(queryEmbedding: number[], k = 3): RegChunk[] {
  return index
    .map(chunk => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(r => r.chunk);
}
```

### Pattern 7: OpenAI Embeddings (text-embedding-3-small)
**What:** Embed regulation text chunks during pipeline step 1. Each embedding call can accept up to 2048 texts in a single request (max 300K tokens total).
**Example:**
```typescript
// Source: openai SDK v6; https://platform.openai.com/docs/api-reference/embeddings/create
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embedChunks(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float',
  });
  return response.data.map(d => d.embedding);
}
```

### Pattern 8: Express Server with RAG Index Startup Load
**What:** Express server loads `regulations-embedded.json` into memory at startup before accepting connections.
**Example:**
```typescript
// server/index.ts
import express from 'express';
import cors from 'cors';
import { loadRAGIndex } from './rag/ragIndex.js';
import apiRouter from './routes/api.js';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

const PORT = process.env.PORT ?? 3001;

// Load RAG index synchronously before listening — server is not ready until this completes
loadRAGIndex(path.resolve('./regulations-embedded.json'));

app.listen(PORT, () => {
  console.log(`Sierra API server ready on port ${PORT}`);
});
```

### Pattern 9: Vite Proxy to Express
**What:** Configure Vite dev server to proxy `/api/*` to Express on port 3001.
**Example:**
```typescript
// vite.config.ts — add server.proxy
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### Pattern 10: Exponential Backoff Retry Wrapper
**What:** Retry failed async operations up to N times with exponential delay + jitter.
**Example:**
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.warn(`Attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('unreachable');
}
```

### Anti-Patterns to Avoid
- **Storing overlay flags in graph.json:** Flags are enrichment-only context for Claude; storing them bloats graph.json and couples the graph schema to AI scoring. Keep graph.json minimal (`id`, `lat`, `lng`, `neighbors`).
- **Calling Claude from the Vite frontend:** Both SDKs (Anthropic and OpenAI) belong in `/server` only — API keys must never ship to the browser.
- **Embedding at query time in Phase 3:** Pre-compute all embeddings during pipeline step 1 and store in `regulations-embedded.json`. Express loads this file at startup; no embedding API calls at runtime.
- **Writing graph.json before BFS check passes:** The pipeline must abort and not write if BFS fails. Otherwise Phase 3 will silently route on a disconnected graph.
- **Using p-limit version < 5 with CommonJS require():** p-limit v6 is pure ESM. The `/server` project should use `"type": "module"` in `package.json` or pin p-limit to v4 (last CJS-compatible version). ESM is recommended.
- **Generating ERCOT corridor proximity with booleanPointInPolygon:** The ERCOT overlay is a LineString (corridor lines), not a polygon. Use `turf.nearestPointOnLine` + a distance threshold instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Point-in-polygon for convex/concave polygons with holes | Custom ray-casting algorithm | `@turf/boolean-point-in-polygon` | Handles edge cases (boundary, holes, antimeridian wrap); 1-line call |
| Cosine similarity search | Custom dot-product + magnitude loop | Already trivial; hand-roll is fine at ~50 chunks; see Pattern 6 | At 40–60 chunks, a simple loop is O(n) and completes in < 1ms |
| HTTP concurrency throttling | Manual promise queue with semaphore | `p-limit` | Semaphore implementation has off-by-one bugs; p-limit is battle-tested |
| JSON schema enforcement on Claude output | Manual JSON.parse + runtime validation | `output_config.format` with JSON schema | Claude's structured output GA feature guarantees schema compliance at token level — no parse errors |
| Regulation text chunking | Custom sentence splitter | Split by paragraph (`\n\n`) or fixed 500-token windows | Paragraph splitting is sufficient for 40–60 total chunks; no need for a chunking library |
| Embeddings similarity indexing | Build HNSW / FAISS index | Plain cosine similarity loop | At 40–60 chunks, a loop is fast enough; vector DB adds operational complexity for zero gain |

**Key insight:** The pipeline runs once before the demo. Correctness and output quality matter more than pipeline speed or sophistication. The ONLY performance constraint is Phase 3's 60-second route generation — which never touches the pipeline.

---

## Common Pitfalls

### Pitfall 1: ERCOT Overlay is LineString, Not Polygon
**What goes wrong:** Calling `booleanPointInPolygon` on ERCOT corridor lines returns false for all nodes since lines are not polygons.
**Why it happens:** `ercot-grid.geojson` uses LineString geometry (grid corridor lines), not polygon areas.
**How to avoid:** Use `turf.nearestPointOnLine` to find the closest point on each ERCOT line to the node, then check if the distance is within a threshold (e.g., 10km) to set `nearErcotCorridor: true`.
**Warning signs:** All nodes show `nearErcotCorridor: false` after enrichment.

### Pitfall 2: p-limit ESM vs CJS Mismatch
**What goes wrong:** `require('p-limit')` throws `ERR_REQUIRE_ESM` in a CommonJS server.
**Why it happens:** p-limit v6+ is pure ESM. If `/server/package.json` lacks `"type": "module"`, Node treats `.js` files as CommonJS.
**How to avoid:** Either add `"type": "module"` to `/server/package.json` (recommended) or pin `p-limit` to v4 (`npm install p-limit@4`). Using `tsx` to run `.ts` scripts bypasses this because tsx handles ESM natively.
**Warning signs:** Pipeline crashes on import with `ERR_REQUIRE_ESM`.

### Pitfall 3: Longitude Step Must Be Latitude-Dependent
**What goes wrong:** Using a fixed longitude step produces nodes that are much closer together near the equator and much farther apart at high latitudes.
**Why it happens:** Degrees of longitude represent different distances at different latitudes. At 30°N (central Texas), 1° longitude ≈ 96km, not 111km.
**How to avoid:** Compute `lngStep = SPACING_KM / (111 * Math.cos(lat * Math.PI / 180))` per latitude row. See Pattern 2.
**Warning signs:** Node density is uneven; nodes near 36°N latitude are far apart while nodes near 26°N are densely packed.

### Pitfall 4: Partial friction_cache.json on Failure Overwrites Good Data
**What goes wrong:** If step 3 crashes midway and re-runs, it may overwrite previously written scores with partial results.
**Why it happens:** Writing the entire `friction_cache.json` at the end of a failed run includes only nodes that were successfully scored.
**How to avoid:** Write a partial progress file (e.g., `friction_cache.partial.json`) that accumulates scores per batch. On completion, rename to `friction_cache.json`. On resume, skip batches whose node IDs already appear in the partial file.
**Warning signs:** Re-running the pipeline produces a `friction_cache.json` with fewer entries than the first run.

### Pitfall 5: Regulation Fetch May Return HTML Error Pages
**What goes wrong:** `fetch('https://ftp.puc.texas.gov/...')` returns a 200 with HTML instead of PDF content on some .gov servers.
**Why it happens:** Some government servers require specific Accept headers or redirect to login/captcha pages.
**How to avoid:** Validate response Content-Type; extract text from PDFs using a simple text extractor or pre-copy plain text manually for the ~7 statutes needed. For a hackathon pipeline, manually curated text blobs are acceptable and more reliable than web scraping.
**Warning signs:** `regulations-embedded.json` chunks contain HTML tags or very short texts.

### Pitfall 6: Claude Structured Output Response Location
**What goes wrong:** Accessing `response.content[0].text` on a structured output response throws or returns undefined.
**Why it happens:** The `output_config` structured output still returns a `text` content block — but only when using the GA `output_config.format` path. The text IS valid JSON matching the schema.
**How to avoid:** Always check `block.type === 'text'` before accessing `.text`. Then `JSON.parse(text)` the result. The entire response is valid JSON; no stripping needed.
**Warning signs:** Empty or malformed friction scores despite successful API calls.

### Pitfall 7: BFS Disconnected Graph from Edge Nodes
**What goes wrong:** Nodes at the corners or edges of the bounding box have fewer than 4 neighbors and may form isolated clusters if the grid is irregular.
**Why it happens:** At irregular longitude steps, rounding can cause adjacent rows to not align to exact neighbor IDs.
**How to avoid:** Build the neighbor list by proximity search (find all nodes within `SPACING_KM * 1.5` distance) rather than by computing expected neighbor IDs from coordinates. This handles rounding and irregular grids gracefully.
**Warning signs:** BFS check reports < 95% reachability even for a complete-looking grid.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Claude `tool_use` for JSON extraction | `output_config.format` with JSON schema (GA) | Late 2025 / early 2026 | Schema-guaranteed JSON; no parse failures; no need for tool workarounds |
| Anthropic beta header `"structured-outputs-2025-11-13"` | `output_config.format` (no header needed) | GA release 2026 | Simpler setup; backward compatible during transition |
| Prompt engineering for JSON ("return JSON only") | Native structured output constraint | 2025 | Eliminates parse errors and hallucinated keys |
| Vector databases (Pinecone, Weaviate) | In-memory cosine similarity for small corpora | Ongoing | At < 100 chunks, a loop is correct and simple; DB adds infrastructure cost |

**Deprecated/outdated:**
- `text-embedding-ada-002`: Superseded by `text-embedding-3-small` (better performance, lower cost). Do not use ada-002.
- Anthropic `tool_use` trick for JSON: Still works but `output_config.format` is cleaner and enforced at inference level.

---

## Open Questions

1. **Regulation document reliability from .gov URLs**
   - What we know: `https://ftp.puc.texas.gov/public/puct-info/agency/rulesnlaws/subrules/electric/ch25complete.pdf` is publicly accessible (confirmed in search). NEPA and NHPA handbooks are on ceq.doe.gov and achp.gov.
   - What's unclear: Whether government servers block programmatic fetch at pipeline run time (some require user-agent headers or return HTML error pages for PDF requests).
   - Recommendation: Provide two paths in `1-scrape-embed.ts`: (a) live fetch attempt with error handling, (b) fall back to pre-seeded text blobs for each statute if fetch fails. The fallback ensures the pipeline always succeeds in a hackathon context.

2. **Diagonal (8-connected) vs 4-connected grid edges**
   - What we know: 8-connected gives more routing options; 4-connected is simpler to implement. Left to Claude's discretion.
   - What's unclear: Impact on route aesthetics and BFS connectivity. 8-connected dramatically reduces disconnected grid risk.
   - Recommendation: Use 8-connected. Diagonal edges ensure full connectivity even with irregular longitude steps and prevent the BFS check from failing near grid boundaries.

3. **`regulations-embedded.json` file location**
   - What we know: Must NOT be in `public/` (it contains API artifacts and is large). Should be at the server project root or a sibling of `public/`.
   - What's unclear: The exact path the Express server uses to load it vs. where the pipeline writes it.
   - Recommendation: Write to `server/data/regulations-embedded.json` (inside the `/server` directory). Express loads from `path.resolve(__dirname, './data/regulations-embedded.json')`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already configured in vitest.config.ts) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

> Note: Pipeline scripts (`/server/pipeline/`) run as Node.js scripts, not as Vitest tests. Validation of pipeline outputs is structural (file exists, JSON is parseable, BFS check passes) — these are checked by the pipeline itself via `console.assert` / `throw` patterns, not by Vitest. Vitest covers frontend types and store behavior.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | RAG index loadable from `regulations-embedded.json` at startup; returns top-k chunks for a test query | unit (server) | Manual: `tsx server/index.ts` and `curl http://localhost:3001/api/health` | ❌ Wave 0 |
| AI-02 | `friction_cache.json` exists with a float score (0–1) and justification for every graph node | integration (pipeline) | `node -e "const d=require('./public/data/friction_cache.json'); assert(Object.keys(d).length > 0)"` | ❌ Wave 0 |
| AI-03 | No coordinate fields appear in friction_cache.json entries (only nodeId, frictionScore, justification) | unit (pipeline output shape) | `npm test -- --run src/types.test.ts` (extend types test) | ❌ Wave 0 |
| ROUTE-03 | `graph.json` is a valid array of nodes with `id`, `lat`, `lng`, `neighbors` fields | unit (schema) | `npm test -- --run` (add graph schema test) | ❌ Wave 0 |
| ROUTE-04 | `friction_cache.json` can be loaded as a static asset (JSON parse succeeds, keys match graph node IDs) | integration | Manual: `fetch('/data/friction_cache.json')` in browser console | ❌ Wave 0 |
| ROUTE-07 | BFS check runs during pipeline and reports >= 95% reachability | integration (pipeline) | Built into `2-build-graph.ts` — throws if check fails; confirmed by successful `graph.json` write | Built-in |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (Vitest unit tests, ~2s)
- **Per wave merge:** `npm test` (full Vitest suite)
- **Phase gate:** Full suite green + `graph.json`, `friction_cache.json`, and `regulations-embedded.json` all exist on disk before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/test/graphSchema.test.ts` — validates `graph.json` structure: nodes array, each with `id/lat/lng/neighbors`, no coordinate fields in friction data
- [ ] `src/test/frictionCache.test.ts` — validates `friction_cache.json`: all node IDs present, scores in [0,1], justification is non-empty string
- [ ] `server/` directory and `server/package.json` — does not exist yet; Wave 0 creates it
- [ ] `server/pipeline/` scripts — all four pipeline scripts created in Wave 0 tasks

---

## Regulation Document Sources

These are confirmed public URLs for pipeline step 1 to fetch from:

| Statute | URL | Format |
|---------|-----|--------|
| PUCT Electric Rules (Chapter 25) | `https://ftp.puc.texas.gov/public/puct-info/agency/rulesnlaws/subrules/electric/ch25complete.pdf` | PDF |
| NEPA/NHPA Integration Handbook | `https://ceq.doe.gov/docs/ceq-publications/NEPA_NHPA_Section_106_Handbook_Mar2013.pdf` | PDF |
| NHPA Section 106 Overview | `https://www.epa.gov/system/files/documents/2023-07/NHPA-Overview.pdf` | PDF |
| ESA Section 7 | `https://www.fws.gov/sites/default/files/documents/endangered-species-act-section7.pdf` | PDF — verify at runtime |
| CWA Section 404 | `https://www.epa.gov/cwa-404` | HTML — extract text |
| Texas Habitat (TPWD) | `https://tpwd.texas.gov/landwater/land/habitats/` | HTML — extract text |

**Fallback strategy:** If any URL fails (non-200 response, HTML error page, or Content-Type mismatch), the pipeline uses pre-seeded text constants defined inline in `1-scrape-embed.ts`. This guarantees the pipeline completes for a hackathon demo regardless of network conditions.

---

## Sources

### Primary (HIGH confidence)
- [Turf.js official docs — booleanPointInPolygon v7.3.0](https://turfjs.org/docs/api/booleanPointInPolygon) — confirmed API signature, version, polygon/multipolygon support
- [Anthropic structured outputs docs (GA)](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — confirmed `output_config.format` is GA; no beta header needed; Node.js SDK example verified
- [Anthropic messages API reference](https://platform.claude.com/docs/en/api/messages) — confirmed current message structure and model names
- [OpenAI embeddings API reference](https://platform.openai.com/docs/api-reference/embeddings/create) — confirmed `text-embedding-3-small`, batch up to 2048 texts, 8192 token limit per input
- [Vite server.proxy docs](https://vite.dev/config/server-options) — confirmed `server.proxy` configuration for `/api/*` → port 3001
- [PUCT Chapter 25 rules](https://ftp.puc.texas.gov/public/puct-info/agency/rulesnlaws/subrules/electric/ch25complete.pdf) — confirmed public access, PDF format
- [NEPA/NHPA Integration Handbook](https://ceq.doe.gov/docs/ceq-publications/NEPA_NHPA_Section_106_Handbook_Mar2013.pdf) — confirmed public access, PDF format

### Secondary (MEDIUM confidence)
- [p-limit GitHub releases](https://github.com/sindresorhus/p-limit/releases) — v6 is pure ESM; v4 last CJS version; Node.js 18+ ESM recommended
- [@anthropic-ai/sdk npm](https://www.npmjs.com/package/@anthropic-ai/sdk) — current version 0.88.0; Node.js 18+ required
- [openai npm package](https://www.npmjs.com/package/openai) — current version 6.16.0; TypeScript 4.9+ required
- Multiple sources confirm in-memory cosine similarity is sufficient for < 100 chunks without a vector DB

### Tertiary (LOW confidence — validate if used)
- Public .gov URLs for ESA Section 7 and Texas habitat documents — URLs may change or require headers; use fallback text blobs if fetch fails

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed current via official sources or npm; versions verified
- Architecture: HIGH — locked decisions from CONTEXT.md are detailed and implementable; patterns follow confirmed library APIs
- Pitfalls: HIGH for code-level pitfalls (ESM, longitude step, BFS); MEDIUM for regulatory URL availability (network-dependent)
- Regulation URLs: MEDIUM — confirmed for PUCT/NEPA/NHPA; LOW for ESA/TPWD (verify at pipeline run time)

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable libraries); re-check Anthropic structured output API if > 30 days old (fast-moving feature)
