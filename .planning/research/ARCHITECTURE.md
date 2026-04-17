# Architecture Patterns: Sierra

**Domain:** AI-augmented GIS routing platform with RAG + LLM friction scoring
**Researched:** 2026-04-16
**Confidence:** MEDIUM-HIGH (domain expertise; web search unavailable, Context7 not applicable to custom architecture)

---

## Recommended Architecture

Sierra is a three-layer system: a React map frontend, a Python API backend, and an offline pre-processing pipeline. The key architectural decision is that the LLM is NOT in the hot path for every request. Friction scores are pre-computed and cached; LLM is invoked only to generate justification text after a route is selected.

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER (React + Mapbox GL JS)                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Map Canvas  │  │ Control Panel│  │ Results Dashboard  │ │
│  │ (Mapbox GL)  │  │ (sliders,    │  │ (route cards, PDF  │ │
│  │ overlays,    │  │  toggles)    │  │  export button)    │ │
│  │ heatmap,     │  └──────────────┘  └────────────────────┘ │
│  │ route lines) │                                            │
│  └─────────────┘                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST + SSE (progress stream)
┌───────────────────────────▼─────────────────────────────────┐
│  FASTAPI BACKEND                                             │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │  Route Endpoint  │  │  RAG Service    │  │ PDF Service│ │
│  │  /api/route      │  │  (ChromaDB)     │  │ (Weasyprint│ │
│  │                  │  │                 │  │  /reportlab│ │
│  │  1. load graph   │  │  retrieve regs  │  │  )         │ │
│  │  2. apply weights│  │  for hotspots   │  └────────────┘ │
│  │  3. run A*×3     │  └─────────────────┘                 │
│  │  4. LLM justify  │                                       │
│  └──────────────────┘                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ reads static files
┌───────────────────────────▼─────────────────────────────────┐
│  STATIC DATA LAYER (pre-processed, committed to repo)        │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ graph.json     │  │ friction_cache   │  │ chroma/     │ │
│  │ (nodes + edges │  │ .json            │  │ (vector DB  │ │
│  │  with lat/lon) │  │ (node_id →       │  │  on disk)   │ │
│  │                │  │  friction score) │  │             │ │
│  └────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ▲
                   offline pipeline (run once before hackathon demo)
┌───────────────────────────┴─────────────────────────────────┐
│  DATA PIPELINE (scripts/pipeline/)                           │
│  GeoJSON layers → node extraction → friction scoring → cache │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

### Component 1: React Map Frontend

**Responsibility:** All rendering, user interaction, and results display. Knows nothing about graph structure or LLM internals.

**Owns:**
- Mapbox GL JS map instance with layer management
- Pin drop UI (click to set source/destination)
- Control panel state (slider values, toggle states)
- SSE listener for progress events
- Route line rendering (three GeoJSON LineString features, color-coded)
- Heatmap layer (client-side, Mapbox GL heatmap expression)
- Overlay layer toggles (ERCOT grid, habitats, topography, parcels)
- Hover popup with per-segment justification text
- Results dashboard (distance, cost estimate, permitting timeline per route)
- PDF export trigger (POST to /api/pdf, receive blob, download)

**Does NOT own:**
- Any graph data structure
- Any LLM calls
- Any pathfinding logic

**Communicates with:** FastAPI backend via REST and Server-Sent Events

**Key boundary:** The frontend receives fully-formed GeoJSON LineStrings for routes plus metadata. It never receives raw graph node arrays. All route data is projection-ready.

---

### Component 2: FastAPI Backend — Route Endpoint

**Responsibility:** Orchestrate a single route generation request. Coordinates graph loading, pathfinding, RAG retrieval, LLM calls, and response assembly.

**Owns:**
- `POST /api/route` — accepts {source_lat, source_lon, dest_lat, dest_lon, constraints}
- Graph loading from `graph.json` (in-memory after first request via module-level singleton)
- Constraint-to-weight mapping (translates slider/toggle values into edge weight multipliers)
- Three A* runs (one per route profile: lowest-cost, balanced, lowest-risk)
- Hotspot identification (segments where friction_cache score > threshold)
- RAG retrieval for hotspot segments only
- Claude API calls for segment justifications (batched, not per-node)
- SSE progress stream: emit events at graph-load, pathfind-complete, rag-complete, llm-complete
- Response assembly: route GeoJSON + metadata + per-segment justifications

**Does NOT own:**
- Vector DB management (delegates to RAG Service)
- PDF rendering (delegates to PDF Service)
- Any frontend state

**Communicates with:** RAG Service (internal function call), Claude API (external HTTP), static data layer (file read)

---

### Component 3: RAG Service

**Responsibility:** Answer "what regulations apply to this geographic area?" given a bounding box or set of coordinates.

**Owns:**
- ChromaDB client (persistent, pointing at `data/chroma/`)
- Embedding model calls (sentence-transformers or OpenAI embeddings)
- Query construction from geographic context + constraint type
- Retrieval (top-k chunks) and deduplication
- Returning formatted context strings to the Route Endpoint for LLM prompt construction

**Does NOT own:**
- LLM calls (returns retrieved text, not LLM output)
- Route logic
- Any frontend concern

**Key boundary:** RAG Service is a pure retrieval function. It takes a query string and returns a list of regulation text chunks. The Route Endpoint decides how to use them in prompts.

---

### Component 4: PDF Service

**Responsibility:** Generate a downloadable PDF dossier from a completed route result.

**Owns:**
- `POST /api/pdf` — accepts complete route data object (same shape as route response)
- HTML template rendering (Jinja2)
- PDF generation from HTML (WeasyPrint) or direct PDF construction (ReportLab)
- Mock owner contact insertion
- Static map image embedding (Mapbox Static API call, or pre-generated PNG)

**Does NOT own:**
- Any LLM calls (justification text is already in the route response, passed in as input)
- Route computation

**Key boundary:** PDF Service is stateless. It receives all data it needs in the POST body. No database reads required at PDF generation time.

---

### Component 5: Static Data Layer

**Responsibility:** Provide all geospatial and pre-computed data at zero latency during demo.

**Files:**
- `data/graph.json` — NetworkX-serialized graph. Nodes: {id, lat, lon, land_type, habitat_flag, topography_class}. Edges: {source, target, length_km, base_cost}
- `data/friction_cache.json` — {node_id: friction_score (0.0–1.0)} pre-computed by the offline pipeline
- `data/geojson/` — ercot_grid.geojson, parcels.geojson, habitats.geojson, topography.geojson (served as static assets or loaded by backend)
- `data/chroma/` — ChromaDB persistent directory with embedded regulation chunks

**Does NOT change at runtime.** All files are committed or generated once in the offline pipeline before demo.

---

### Component 6: Offline Data Pipeline

**Responsibility:** One-time pre-processing that produces the static data layer. Runs on a developer machine before the hackathon demo, not during user requests.

**Stages:**
1. GeoJSON ingest — load parcel, habitat, topography, and ERCOT GeoJSON files
2. Graph construction — snap GeoJSON features to a grid (e.g., 1km²), create nodes and edges using NetworkX
3. Attribute assignment — tag each node with land_type, habitat_flag, topography class from spatial joins
4. Friction scoring — for each node: call Claude API with node attributes + retrieved regulations → scalar friction score 0.0–1.0. This is the ONLY place full LLM-per-node scoring happens (offline, time-unlimited).
5. Cache write — serialize {node_id: friction_score} to friction_cache.json
6. Regulation embedding — chunk regulation PDFs, embed with sentence-transformers, persist ChromaDB to disk
7. Validation — assert graph is connected, all nodes have friction scores, chroma collection is non-empty

**Confidence:** HIGH that this offline approach is the correct pattern for <1 min target. Full online LLM-per-node scoring would take 30–300+ seconds for a Texas-scale graph.

---

## Data Flow

### Route Generation (Runtime)

```
User drops pins + sets constraints
        │
        ▼
POST /api/route {source, dest, constraints}
        │
        ├─ Load graph.json (singleton, ~50ms first call)
        ├─ Load friction_cache.json (singleton, ~10ms)
        │
        ├─ Apply constraint weights to edge costs
        │   slider(cost_vs_risk) → multiplier on friction vs distance
        │   toggles → add penalty multipliers for eminent_domain, ecology, co_location
        │
        ├─ Run A* × 3 (profile variants via weight configs)  [~100-500ms]
        │   Profile 1 (Lowest Cost): weight=distance+base_cost, friction penalty=low
        │   Profile 2 (Balanced): weight=distance+cost+friction equally
        │   Profile 3 (Lowest Risk): weight=friction dominant
        │
        ├─ Identify hotspot segments (friction_score > 0.6)
        │
        ├─ RAG retrieval for hotspot segments              [~200-500ms]
        │   query: "regulations for [land_type] [habitat_flag] near [lat/lon]"
        │   returns: top-5 regulation chunks per hotspot cluster
        │
        ├─ Batch LLM call to Claude API                   [~5-20s]
        │   Input: route summary + hotspot attributes + retrieved regulation text
        │   Output: per-segment justification strings + overall route narrative
        │   Parallelized: 3 routes → 3 parallel Claude calls
        │
        ├─ Assemble response:
        │   routes[]: {
        │     profile: "lowest_cost" | "balanced" | "lowest_risk"
        │     geojson: LineString,
        │     segments: [{segment_id, justification_text, friction_score}]
        │     metrics: {distance_km, cost_estimate, permitting_weeks}
        │   }
        │
        └─► Stream response via SSE + final JSON payload
```

### Heatmap Rendering (Client-Side)

```
friction_cache.json (served as static asset)
        │
        ▼
Frontend fetches on app load
        │
        ▼
Convert {node_id: score} → GeoJSON FeatureCollection (points with score property)
        │
        ▼
Mapbox GL heatmap layer: color expression maps 0.0–1.0 → green-yellow-red
```

No server involvement at render time. The heatmap is entirely client-side from a pre-fetched JSON file. This is the correct pattern — server-side tile generation (MapboxTiling, GeoServer) is overkill for a static, pre-computed score array.

### PDF Generation Flow

```
User clicks "Export PDF" for selected route
        │
        ▼
Frontend POSTs to /api/pdf:
  {
    route_geojson,
    metrics,
    segments[{justification, friction_score, land_type}],
    mock_owner_contacts (from static lookup table),
    regulatory_zones (derived from segment attributes)
  }
        │
        ▼
Backend renders Jinja2 HTML template
        │
        ├─ Embeds static map image (Mapbox Static API or pre-captured PNG)
        ├─ Renders per-segment table with justifications
        ├─ Renders metrics summary
        └─ Renders regulatory zone highlights
        │
        ▼
WeasyPrint converts HTML → PDF bytes
        │
        ▼
Response: application/pdf blob
        │
        ▼
Browser triggers download
```

---

## Vector Store Architecture (RAG)

### Chunking Strategy

Regulation documents (PUCT, NEPA, Texas environmental, habitat) are chunked as follows:

- **Chunk size:** 400–600 tokens (not characters). Smaller than typical because regulation text is dense and judges often cite specific sections.
- **Overlap:** 50–100 tokens between chunks. Prevents context loss at boundaries.
- **Chunking boundary:** Prefer section breaks (numbered sections, paragraph breaks) over fixed-size splits. Use recursive character text splitter with `\n\n`, `\n`, `. ` as separators in that priority order.
- **Metadata per chunk:** {source_document, section_number, geographic_scope ("statewide" | "ERCOT" | specific county), regulation_type ("cost" | "habitat" | "eminent_domain" | "permitting")}

### Embedding Model

Use `sentence-transformers/all-MiniLM-L6-v2` (local, free, 384-dim, fast). Do NOT use OpenAI embeddings for the offline pipeline — eliminates API dependency during data prep and avoids cost. If OpenAI embeddings are preferred, `text-embedding-3-small` is the current best cost/quality tradeoff.

### Retrieval Strategy

At query time:
1. Construct query from node attributes: `"transmission line through {land_type} with {habitat_flag} near {county}, voltage {kv}"`
2. Filter by metadata: `regulation_type IN [relevant_types_from_constraints]`
3. Retrieve top-5 chunks by cosine similarity
4. Deduplicate by section_number (same section cited by multiple nodes → include once)
5. Format as numbered list for LLM context window

### ChromaDB Configuration

```python
# Persistent local DB, committed to repo as data/chroma/
client = chromadb.PersistentClient(path="data/chroma")
collection = client.get_or_create_collection(
    name="regulations",
    metadata={"hnsw:space": "cosine"}
)
```

Collection size estimate: ~200–400 chunks for Texas transmission regulations. Well within ChromaDB's in-process performance range. No need for a separate Chroma server process.

---

## Friction Score Pre-Computation

### Why Pre-Compute

A Texas ERCOT routing graph at 1km² resolution covers ~690,000 km² / 1km² = ~690,000 potential nodes. Even at 100 nodes per route corridor, calling Claude per-node at runtime would be 100 × ~1s = 100s minimum — exceeding the <1 min target before pathfinding even runs.

### Pre-Computation Strategy

Run once offline. Estimated time: 1–4 hours (acceptable for hackathon prep).

```
For each node in graph:
  1. Build prompt: node attributes (land_type, habitat_flag, topo, county)
               + top-3 RAG regulation chunks for that node's context
  2. Call Claude API: "Rate friction for transmission line at this location: 0.0 (no obstacles) to 1.0 (severe)"
  3. Parse scalar from response
  4. Store in friction_cache dict

Batching: Send 20–50 prompts concurrently (respect rate limits)
Cache write: Dump dict to friction_cache.json
```

For the hackathon, the practical graph is much smaller: define a corridor bounding box for the demo (e.g., Dallas to Corpus Christi corridor), use a 5–10km grid resolution. That yields ~500–2,000 nodes — pre-computable in 10–30 minutes.

### Runtime Friction Application

At request time, the A* weight function reads from the in-memory friction_cache dict (loaded once at startup):

```python
def edge_weight(u, v, edge_data, constraints, cache):
    base = edge_data["length_km"] * edge_data["base_cost"]
    friction = cache.get(u, 0.3)  # default 0.3 for uncached nodes
    risk_weight = constraints["risk_slider"]  # 0.0–1.0
    cost_weight = 1.0 - risk_weight
    return (cost_weight * base) + (risk_weight * friction * 100)
```

No LLM calls in the A* loop. Pure dict lookup — microseconds per node.

---

## Heatmap Rendering

### Recommended Approach: Client-Side Mapbox GL Expression

Serve `friction_cache.json` as a static asset. On frontend load:

1. Fetch the cache JSON (~50–200KB for demo-scale graph)
2. Convert to GeoJSON FeatureCollection: each node becomes a Point feature with `score` property
3. Add as a Mapbox GL `heatmap` layer using paint expressions:

```js
map.addLayer({
  id: "friction-heatmap",
  type: "heatmap",
  source: "friction-points",
  paint: {
    "heatmap-color": [
      "interpolate", ["linear"], ["heatmap-density"],
      0, "rgba(0,255,0,0.0)",   // transparent at zero
      0.3, "rgba(0,255,0,0.8)", // green
      0.6, "rgba(255,200,0,0.8)", // yellow
      1.0, "rgba(255,0,0,0.9)"  // red
    ],
    "heatmap-radius": 20,
    "heatmap-opacity": 0.6
  }
})
```

### Why Not Server-Side Tiles

Server-side tile generation (GeoServer, MapboxTiling Service, TiTiler) requires:
- A running tile server process
- Tile caching infrastructure
- 1–2 days of setup

For a static, pre-computed score grid, client-side Mapbox GL heatmap achieves visually identical output with zero infrastructure overhead. The only limit is file size — at demo scale (<2,000 nodes), the GeoJSON is trivially small.

---

## Frontend/Backend Split for Real-Time Updates

### Server-Sent Events (SSE) for Progress Animation

The <1 min generation target requires a progress animation to prevent dead-air perception. Use SSE (not WebSocket — one-directional, simpler, no socket management).

```
Client                          Server
  │                               │
  ├── POST /api/route ──────────► │
  │                               │
  ├── GET /api/route/progress ──► │  (SSE stream, keyed by request_id)
  │                               │
  │ ◄── event: graph_loaded ───── │  emit after graph + cache loaded
  │ ◄── event: pathfinding ─────  │  emit when A* starts
  │ ◄── event: routes_found ────  │  emit when 3 routes computed
  │ ◄── event: rag_retrieving ──  │  emit when RAG starts
  │ ◄── event: llm_generating ──  │  emit when Claude calls start
  │ ◄── event: complete ────────  │  emit with full payload OR redirect to result
  │                               │
```

Implementation: FastAPI `StreamingResponse` with `text/event-stream` content type. Each event is `data: {type, message, progress_pct}\n\n`.

Frontend displays a progress bar and status message cycling through these events — makes the system feel active even if LLM calls take 15–25 seconds.

### State Ownership

| State | Owner | Rationale |
|-------|-------|-----------|
| Map camera/zoom | Mapbox GL internal | Never lift this to React state |
| Pin positions | React (useState) | Needed for form submission |
| Control panel values | React (useState) | Needed for API call body |
| Route results | React (useState) | Drives route line rendering + dashboard |
| Active route (selected) | React (useState) | Drives PDF export + popup content |
| Overlay toggles | React (useState) | Drives Mapbox layer visibility |
| Heatmap GeoJSON | React (useState, loaded once) | Stable after initial fetch |
| SSE progress | React (useState) | Drives progress bar |

---

## Build Order / Component Dependency Graph

For a 3-person team in 48 hours, parallelism is critical. Components with no shared dependencies can be built simultaneously.

```
Hour 0–4: Foundation (all three devs)
  ├─ Dev A: Project scaffold (Vite+React+TypeScript, FastAPI, folder structure, .env wiring)
  ├─ Dev B: Data pipeline — GeoJSON → graph.json (NetworkX) + friction_cache.json stub
  └─ Dev C: Regulation chunks → ChromaDB embedding (offline script)

Hour 4–12: Core parallel tracks
  ├─ Dev A: Mapbox integration — map canvas, pin drop, overlay layers, heatmap layer
  ├─ Dev B: Route endpoint — A* pathfinding on graph + friction weights (no LLM yet, mock responses)
  └─ Dev C: RAG service — ChromaDB retrieval function + Claude API integration for justifications

Hour 12–20: Integration
  ├─ Dev A: Wire frontend to POST /api/route + SSE progress animation
  ├─ Dev B: Connect A* to friction_cache + constraint weight system + SSE emitter
  └─ Dev C: Connect RAG → LLM justification → route response assembly

Hour 20–28: Features
  ├─ Dev A: Hover popups, results dashboard cards, overlay toggles
  ├─ Dev B: PDF endpoint (Jinja2 template + WeasyPrint)
  └─ Dev C: Run full friction pre-computation (offline, produces final friction_cache.json)

Hour 28–36: Polish + Demo Hardening
  ├─ All: Integration testing with real LLM responses
  ├─ All: Fallback/error states (LLM timeout → use cached justification strings)
  └─ All: ADA contrast, visual polish

Hour 36–48: Buffer / Demo Prep
  ├─ Freeze feature set at hour 36
  ├─ Practice demo flow
  └─ Prepare fallback: pre-run route results cached as JSON (if API is slow during demo)
```

### Dependency Graph

```
graph.json ──────────────────────────► Route Endpoint (A*)
friction_cache.json ─────────────────► Route Endpoint (weight function)
                                      ► Frontend (heatmap layer)
ChromaDB ────────────────────────────► RAG Service
RAG Service ─────────────────────────► Route Endpoint (hotspot retrieval)
Route Endpoint ──────────────────────► Frontend (route lines + dashboard)
                                      ► PDF Service (input data)
Claude API ──────────────────────────► Route Endpoint (justifications)
                                      ► Offline pipeline (friction scoring)
```

**Critical path:** `graph.json exists` → `A* runs` → `routes exist` → `frontend renders routes`. Everything else (heatmap, RAG, LLM justifications, PDF) can be stubbed and added incrementally without blocking the core demo.

**Stub strategy:** Build the critical path with mock data first. Route endpoint can return hardcoded GeoJSON for hour 0–8 while real graph and LLM are wired up. This ensures the frontend is never blocked.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: LLM in the A* Hot Path

**What:** Calling Claude API to score each node during pathfinding
**Why bad:** A* may evaluate thousands of nodes. At ~1s per LLM call, this is 1000s = infeasible. Even with aggressive caching, per-node LLM calls at runtime add unpredictable latency.
**Instead:** Pre-compute all friction scores offline. A* reads from an in-memory dict — microseconds per node.

### Anti-Pattern 2: Streaming Map Data Through the Backend

**What:** Routing all GeoJSON overlay layers through FastAPI endpoints
**Why bad:** Adds latency, backend CPU load, and a single point of failure for rendering
**Instead:** Serve all static GeoJSON files as static assets (FastAPI `StaticFiles` mount or directly from the Vite public directory). Backend only serves computed routes.

### Anti-Pattern 3: Separate WebSocket Server

**What:** Adding a WebSocket server for progress updates
**Why bad:** Requires additional infrastructure, connection management, reconnect logic
**Instead:** SSE via FastAPI StreamingResponse. Simpler, HTTP-native, sufficient for one-directional progress updates.

### Anti-Pattern 4: Client-Side Pathfinding

**What:** Running A* in the browser (e.g., via a JS graph library)
**Why bad:** The friction-weighted graph JSON would be multi-MB. Loading it in the browser adds 2–10s. A* on a large graph blocks the main thread.
**Instead:** All pathfinding on the server. Frontend receives only the result GeoJSON.

### Anti-Pattern 5: Generating PDF Synchronously in Route Endpoint

**What:** Blocking the route response until PDF is generated
**Why bad:** PDF generation (WeasyPrint) takes 1–5s. Forces user to wait for PDF before seeing routes.
**Instead:** PDF is a separate endpoint triggered only when user clicks export. Route response is always fast-returned.

### Anti-Pattern 6: Lifting Mapbox Camera State to React

**What:** Syncing map center/zoom into React useState on every map move
**Why bad:** Causes re-renders on every pan/zoom event. Mapbox GL JS manages its own camera state efficiently.
**Instead:** Only lift state that the application logic needs (pin positions, selected route). Read map camera from `map.getCenter()` / `map.getZoom()` imperatively only when needed (e.g., for PDF static image bounds).

---

## Scalability Considerations

These are noted for context but are NOT relevant to the 48-hour build. All scaling work should be explicitly deferred.

| Concern | At Demo Scale | At Production Scale |
|---------|---------------|---------------------|
| Graph size | ~500–2,000 nodes, in-memory | NetworkX too slow; use PostGIS + pgRouting |
| Friction cache | friction_cache.json in memory | Redis or Postgres materialized view |
| LLM calls | 3 parallel Claude calls, ~15–25s | Queue with Celery/BullMQ, streaming responses |
| ChromaDB | In-process, local disk | Chroma server or Pinecone/Weaviate |
| PDF generation | WeasyPrint, synchronous | Async worker queue |
| Heatmap | Client-side GeoJSON | Mapbox Tiling Service or TiTiler for large grids |
| Tile serving | Mapbox hosted | Self-hosted tile server |

---

## Sources

- Architecture patterns drawn from domain knowledge of GIS routing systems, RAG architectures, and FastAPI/React patterns (MEDIUM confidence — web search unavailable for verification)
- Mapbox GL JS heatmap layer approach: well-established pattern, HIGH confidence
- ChromaDB persistent client API: HIGH confidence (standard documented API)
- SSE via FastAPI StreamingResponse: HIGH confidence (documented FastAPI pattern)
- Pre-computation approach for LLM scoring: HIGH confidence (fundamental performance constraint)
- Chunking strategy (400–600 tokens, recursive splitter): MEDIUM confidence (common RAG practice, not verified against current benchmarks)
