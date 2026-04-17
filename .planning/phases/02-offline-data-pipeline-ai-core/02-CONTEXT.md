# Phase 2: Offline Data Pipeline & AI Core - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Build all pre-computed artifacts that Phase 3 routing needs: `graph.json` (the routing graph), `friction_cache.json` (Claude-scored friction per node), and an in-memory RAG index loadable at server startup. All AI work happens offline — routing in Phase 3 never waits on LLM calls. The Express backend server introduced in this phase also serves as the API host for Phase 3's live Claude calls.

</domain>

<decisions>
## Implementation Decisions

### Graph Construction
- **Structure:** Regular lat/lng grid lattice over the Texas bounding box, ~25km node spacing → approximately 300–500 nodes
- **Schema (minimal):** `{ id, lat, lng, neighbors: string[] }` — friction scores live separately in `friction_cache.json` keyed by node id. Clean separation: graph.json stays stable; friction can be regenerated independently.
- **Overlay enrichment:** During pipeline, each node is pre-processed via point-in-polygon checks (turf.js) against the GeoJSON overlays to produce boolean/categorical flags (`esaHabitat`, `privateLand`, `topoElevationM`, `nearErcotCorridor`). These flags are NOT stored in graph.json — they are used as context when calling Claude for friction scoring.
- **BFS connectivity check:** Pipeline validates >95% of nodes are reachable before writing graph.json (per ROUTE-07).

### Regulation Text (RAG)
- **Source:** Real regulatory documents scraped/fetched at pipeline run time — PUCT rules, NEPA guidance, ESA Section 7 consultation docs, CWA Section 404, NHPA Section 106, Texas habitat regulations. Fetched from public .gov URLs during the offline build.
- **Embedding strategy:** Pre-compute embeddings in a one-time pipeline step → write chunk text + vectors to `regulations-embedded.json`. Server loads this file at startup — no embedding API calls at runtime.
- **Embedding model:** Claude API preferred. **Note:** Anthropic does not currently expose a dedicated embeddings endpoint — fall back to OpenAI `text-embedding-3-small` if unavailable. Adds `openai` npm package to `/server` only.
- **RAG is built before friction scoring** — pipeline is sequential: (1) scrape + embed regulations → (2) build graph → (3) score friction with RAG context.

### Friction Scoring Pipeline
- **Batching:** Group ~20–25 geographically nearby nodes per Claude call. Each batch receives: node coordinates + overlay flags + top 2–3 RAG-retrieved regulation excerpts relevant to that region. Claude returns a JSON array of `{ nodeId, frictionScore: number (0–1), justification: string }`.
- **Why RAG context per batch:** Justifications reference actual statutory text (e.g., "per NEPA 40 CFR §1508.27, this corridor requires formal Section 7 consultation..."), which is significantly more credible to judges than generic location-based reasoning.
- **Concurrency:** `p-limit` with 3–5 batches in parallel. Balances speed (~2–4 min total) and Anthropic rate limit safety.
- **Failure handling:** Retry failed calls up to 3x with exponential backoff. Partial progress written to disk so the pipeline can resume after a failure.
- **Output:** `public/data/friction_cache.json` — static file loaded by Vite frontend as a regular asset. Also drives the Phase 3 heatmap layer.
- **LLM constraint (AI-03):** Claude scores friction only — never generates or modifies coordinates. All geometry comes from the pre-built graph exclusively.

### Backend Server
- **Runtime:** Node.js + Express
- **Location:** `/server` — separate directory with its own `package.json`. Runs on port 3001. Vite dev server (port 3000) proxies `/api/*` to Express.
- **Startup behavior:** Server loads `regulations-embedded.json` (RAG index) into memory on startup. Ready for RAG queries and live Claude calls before any route request arrives.
- **Static file serving:** `graph.json` and `friction_cache.json` live in `public/data/` and are served by Vite as regular static assets — no server roundtrip required for routing data.
- **Phase 3 handoff:** The Express server is the host for all Phase 3 live Claude calls (Agent Reasoning Stream, Sierra Recommends, Environmental Trigger Panel, Sierra Alerts, segment justifications).

### Claude's Discretion
- Exact chunking strategy for regulation documents (sentence-level vs. paragraph-level)
- Number of regulation chunks per statute (target: 5–10 per statute, ~40–60 total)
- Specific RAG retrieval approach (cosine similarity threshold, top-k)
- Graph bounding box exact coordinates for Texas
- Whether to include diagonal edges in the grid lattice (8-connected vs 4-connected)
- Pipeline script naming and directory structure within `/server`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `public/data/ercot-grid.geojson` — ERCOT corridor lines; can be used as proximity reference for `nearErcotCorridor` overlay flag during node enrichment
- `public/data/wildlife-habitat.geojson` — habitat polygons; used for `esaHabitat` point-in-polygon check per node
- `public/data/land-boundary.geojson` — land boundary polygons; used for `privateLand` flag
- `public/data/topography.geojson` — contour data; used for `topoElevationM` extraction per node
- `src/types.ts` — `RouteResult.segmentJustifications` shape (`segmentIndex`, `frictionScore`, `justification`) defines what friction_cache.json must produce per node

### Established Patterns
- Static/mock data only — all pipeline outputs become static files in `public/data/`
- TypeScript throughout — server can share types with frontend via a shared types file or by importing from `../src/types.ts`
- Zustand store in frontend (`src/store/`) — Phase 3 will load graph.json and friction_cache.json into app state on startup

### Integration Points
- Pipeline writes to `public/data/graph.json` and `public/data/friction_cache.json` → consumed by Phase 3 frontend
- Express server at `localhost:3001` → Vite proxy at `/api/*` → consumed by Phase 3 API calls
- `regulations-embedded.json` → loaded by Express at startup → queried during Agent Reasoning Stream (Phase 3)

</code_context>

<specifics>
## Specific Ideas

- Friction justifications should sound regulatory, not geographic — reference statute names, section numbers, and Texas-specific zone names (Reeves County, Edwards Aquifer, Nolan County) for judge credibility
- The pipeline is a one-time offline run before the demo — prioritize correctness and output quality over pipeline speed (the 60-second route generation target is Phase 3's constraint, not the offline pipeline's)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-offline-data-pipeline-ai-core*
*Context gathered: 2026-04-16*
