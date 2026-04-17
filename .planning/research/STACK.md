# Technology Stack — Sierra

**Project:** Sierra (AI Transmission Line Routing Platform)
**Researched:** 2026-04-16
**Context:** 48-hour hackathon, 2-3 person team, desktop-first, Texas/ERCOT only
**Knowledge basis:** Training data through August 2025; no live web access during this session — flag versions for spot-check at build time.

---

## Recommended Stack

### Frontend Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 14.x (App Router) | Full-stack React framework | Collapses frontend + API routes into one repo — critical for a 48-hour build where splitting services costs time. App Router gives server components for fast initial load. Vercel deploy is 2 commands. |
| React | 18.x | UI component model | Peer dep of Next.js; concurrent features enable non-blocking route-generation progress animations. |
| TypeScript | 5.x | Type safety | Catches GeoJSON shape mismatches at compile time, not runtime — especially important for the graph/adjacency matrix code. |
| Tailwind CSS | 3.x | Styling | Zero CSS file overhead; utility classes map well to the dashboard card and overlay panel layout. Do NOT use a component library (MUI, Chakra) — setup cost too high for 48 hours. |

**Confidence: HIGH** — Next.js 14 App Router is the dominant 2024-2025 pattern for full-stack React. Vercel deployment is fastest possible for a demo.

---

### Map Library

**Recommendation: Mapbox GL JS v3**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| mapbox-gl | 3.x | Interactive WebGL map | Only option that delivers: smooth WebGL rendering of GeoJSON line layers at Texas scale, built-in heatmap layer type (friction heatmap), custom layer styling via expressions, and terrain/3D elevation support. The API is mature and well-documented. |
| react-map-gl | 7.x | React wrapper for Mapbox GL JS | Turns map state into React props/hooks. Use `Map`, `Source`, `Layer` components directly — avoids imperative ref juggling when toggling 6+ overlay layers. |

**Why NOT the alternatives:**

| Library | Why Not |
|---------|---------|
| Google Maps JS API | Requires billing setup; GeoJSON line layer styling is far more limited; heatmap is first-party but friction-heatmap-from-arbitrary-data is awkward. Pricing unpredictability is a demo risk. |
| Leaflet + react-leaflet | Canvas-based; GeoJSON rendering noticeably slower beyond ~5,000 features; no native WebGL heatmap; styling expressions require plugins. Fine for simple maps, wrong for this feature density. |
| deck.gl | Excellent for data-heavy layers, but requires manual Mapbox base map wiring, more boilerplate for basic interactions (popups, pin drop), and steeper learning curve. Overkill when Mapbox GL JS handles everything natively. |
| MapLibre GL JS | Free/open fork of Mapbox GL JS with identical API. Viable alternative if Mapbox token becomes an issue. Versions are in sync (~4.x). **Swap candidate**: if the team doesn't have a Mapbox token, use `maplibre-gl` + `react-map-gl` with the maplibre adapter — zero API change. |

**Key Mapbox setup notes:**
- Mapbox token is free tier — 50,000 map loads/month. Hackathon will use <100. No billing required.
- Use a `.env.local` with `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx`. Do NOT commit the token.
- Static tile hosting: use Mapbox's own satellite/streets style as base — no need to self-host tiles.

**Confidence: HIGH** — Mapbox GL JS + react-map-gl is the industry-standard pairing for data-dense GeoJSON web maps in 2024-2025.

---

### Geospatial Processing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Turf.js (`@turf/turf`) | 6.x | GeoJSON geometry operations | Bearing calculations, line interpolation, point-in-polygon (for overlay zone checks), buffer creation around routes. Use tree-shakeable imports (`@turf/distance`, `@turf/bearing`) to keep bundle small. |
| `geojson` (types) | 0.5.x | TypeScript type definitions | `FeatureCollection<LineString>` types prevent shape errors in the pathfinding output serialization. |

**What NOT to use:**
- GDAL/OGR — server-side only, Python/C++ bindings, massive overhead for a hackathon. All your data is already GeoJSON.
- PostGIS — adds a database dependency. Not needed when data is static GeoJSON files.

**Confidence: HIGH** — Turf.js 6.x is stable and the standard for client-side GeoJSON math.

---

### Pathfinding

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `graphology` | 0.25.x | Graph data structure | Maintained, TypeScript-native graph library. Represents the friction-scored grid graph (nodes = waypoints, edges = segments with friction weights). |
| `graphology-shortest-path` | 2.x | Dijkstra/A* implementation | Ships with both Dijkstra and A* implementations over graphology graphs. No need to implement from scratch — critical for 48-hour builds. |

**Architecture note:** Build the friction graph server-side (Next.js API route or separate script) from the static GeoJSON grid. Each edge weight = friction score from LLM. Run pathfinding on the pre-weighted graph. Store graph as serialized JSON — load once per session.

**Alternative considered:** `ngraph.graph` + `ngraph.path` — smaller bundle, also good. Graphology is recommended because its TypeScript types and documentation are significantly better, reducing debugging time.

**What NOT to use:**
- Python NetworkX — requires a Python backend. If the team chooses FastAPI (see Backend section), NetworkX is excellent and preferred over JS for pathfinding. For a Next.js-only stack, use graphology.
- Implementing A* from scratch — not worth 3-4 hours when graphology-shortest-path exists.

**Confidence: MEDIUM** — graphology is well-maintained but less dominant than Turf.js. The API is stable; verify `graphology-shortest-path` exports before committing. Alternative: `ngraph.*` packages are equally viable.

---

### RAG / Vector Store

**Recommendation: In-memory vector store (no external service)**

For a 48-hour hackathon with static regulation text, a full vector database is unnecessary infrastructure. Use this hierarchy:

| Option | Recommendation | Why |
|--------|---------------|-----|
| In-memory with `@xenova/transformers` embeddings | **USE THIS** | Zero infra, zero latency, deterministic. Pre-embed all regulation chunks at build time, serialize to JSON, load into memory at startup. Fast retrieval via cosine similarity in <10ms. |
| Chroma (local) | Viable backup | Python-native, runs as a local server. Good if team has a Python backend. Adds a service to manage. |
| pgvector | Skip | Requires PostgreSQL with extension. Overkill — data is static. |
| Pinecone | Skip | Requires API key, network calls, cold start latency. Adds a point of failure during demo. |
| Weaviate / Qdrant | Skip | Same reasons as Pinecone. |

**In-memory RAG implementation pattern:**
```
1. At build/startup: load regulation text chunks from static JSON
2. Embed with @xenova/transformers (all-MiniLM-L6-v2 model, runs in Node.js)
3. Serialize embedding vectors to Float32Array in memory
4. At query time: embed the query, dot-product vs corpus, top-k
5. Pass top-k chunks as context to Claude API call
```

This eliminates ALL external vector store dependencies. The regulation corpus for Texas/PUCT/NEPA is small enough (< 500 chunks) that in-memory is trivially fast.

**Alternative if team prefers Python backend:** Use LangChain + Chroma with persistent SQLite storage. Pre-populate at startup. This is the standard Python RAG pattern and is well-documented.

| Technology | Version | Purpose | Condition |
|------------|---------|---------|-----------|
| `@xenova/transformers` | 2.x | In-browser/Node embedding model | JS stack — generates embeddings without external API |
| `langchain` (Python) | 0.2.x | RAG orchestration | Python backend only |
| `chromadb` (Python) | 0.5.x | Local vector store | Python backend only |

**Confidence: HIGH for in-memory recommendation** — the corpus size and static data constraint make this the right call for 48 hours. MEDIUM confidence on `@xenova/transformers` version — verify on npm before install.

---

### LLM Integration

**Recommendation: Anthropic SDK (`@anthropic-ai/sdk`)**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@anthropic-ai/sdk` | 0.24.x | Claude API client | Official SDK; team already uses Claude Code. TypeScript-first. Supports streaming. |

**Model selection (as of August 2025):**

| Model | Use Case | Why |
|-------|---------|-----|
| `claude-3-5-sonnet-20241022` | Friction scoring, route justifications, RAG synthesis | Best cost/quality ratio for structured output. Fast enough for the <1 min constraint. |
| `claude-3-haiku-20240307` | High-frequency scoring calls (individual segments) | 5-10x faster and cheaper than Sonnet. Use for bulk friction scoring where quality bar is lower. |

**IMPORTANT — model ID format:** Always use date-stamped IDs (`claude-3-5-sonnet-20241022`), not aliases (`claude-3-5-sonnet-latest`). Aliases can change behavior mid-hackathon if Anthropic pushes an update. Determinism matters for demo reliability.

**Note on claude-4 / claude-sonnet-4:** As of August 2025, newer Claude 4 series models may be available. The team is running on `claude-sonnet-4-6` (per environment context). Use `claude-sonnet-4-5` or the most recent stable dated ID — check the Anthropic docs at build start. The SDK version (`0.24.x`) is compatible with all current models.

**Key usage patterns for this project:**

```typescript
// Friction scoring — structured output, no streaming needed
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 512,
  messages: [{ role: 'user', content: frictionPrompt }],
});

// Route justification — stream to UI for progress feel
const stream = await anthropic.messages.stream({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: justificationPrompt }],
});
```

**Performance constraint note:** LLM calls are the primary bottleneck for the <1 min target. Mitigation:
1. Run friction scoring only on "hotspot" nodes (those within regulatory zones) — not every graph node.
2. Batch Haiku calls for bulk scoring; use Sonnet only for final narrative/justification.
3. Parallelize the three route justification calls with `Promise.all`.

**Confidence: HIGH** — `@anthropic-ai/sdk` is the correct choice given team context. Model IDs should be verified at build start against https://docs.anthropic.com/en/docs/models-overview.

---

### PDF Generation

**Recommendation: `@react-pdf/renderer`**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@react-pdf/renderer` | 3.x | PDF dossier generation | Lets you compose the PDF dossier using React JSX — maps directly onto the team's existing React component knowledge. No context switch. Supports text, tables, images, custom fonts. Runs client-side (no server needed) or server-side via Node. |

**Why NOT the alternatives:**

| Library | Why Not |
|---------|---------|
| Puppeteer | Requires a headless Chrome instance — adds a heavy server process. Overkill for a structured report with known content. Cold start is 2-5 seconds per PDF. |
| jsPDF | Imperative API (coordinate-based drawing). Writing a multi-page dossier with tables and segment lists is very slow to develop. No React integration. |
| `pdf-lib` | Low-level manipulation library — designed for modifying existing PDFs, not generating from scratch. Wrong tool. |
| WeasyPrint (Python) | Adds Python dependency just for PDF. Avoid unless team is already on Python backend. |

**Key `@react-pdf/renderer` patterns for this project:**
- Map route segments to `<View>` rows in a `<Document>`
- Embed a static PNG screenshot of the map (use `html2canvas` or the Mapbox Static Images API to capture the route)
- Include LLM justification text as `<Text>` blocks
- Mock owner contacts as a styled `<View>` table

**Static map image for PDF:** Use Mapbox Static Images API (`https://api.mapbox.com/styles/v1/{user}/{style}/static/{overlay}/{lon},{lat},{zoom}/{width}x{height}`) — returns a PNG that can be embedded directly. This is the simplest approach for capturing route visualization without running a headless browser.

**Confidence: HIGH** — `@react-pdf/renderer` v3 is the standard React PDF solution for 2024-2025. The JSX-based API is optimal for a small React team.

---

### Backend

**Recommendation: Next.js API Routes (no separate backend)**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js API Routes / Route Handlers | 14.x | Backend logic | Collapses frontend + backend into one repo and one deploy. For a 48-hour build, eliminating the frontend-backend coordination cost is the single biggest time saver. All LLM calls, pathfinding, RAG, and PDF generation run in Route Handlers. |

**Route structure:**
```
/api/route/generate   — POST: takes {source, dest, constraints} → returns 3 routes + justifications
/api/route/friction   — POST: takes {nodes} → returns friction scores (LLM-powered)
/api/export/pdf       — POST: takes {route} → returns PDF blob
```

**Alternative: FastAPI (Python) — only if team has a Python specialist**

If the data engineer prefers Python, a FastAPI backend is superior for:
- NetworkX pathfinding (more mature than graphology)
- LangChain RAG (better Python ecosystem)
- NumPy/SciPy for geospatial grid math

In that case: Next.js frontend + FastAPI backend on separate ports, with CORS configured. The tradeoff is managing two services during the demo — a real failure risk.

**Verdict:** Unless a team member is significantly faster in Python, stay in Next.js. Fewer moving parts = higher demo reliability.

| Technology | Version | Purpose | Condition |
|------------|---------|---------|-----------|
| FastAPI | 0.111.x | Python backend | Only if team has Python specialist AND values NetworkX/LangChain |
| uvicorn | 0.30.x | ASGI server for FastAPI | Paired with FastAPI |
| `anthropic` (Python) | 0.28.x | Claude API client (Python) | FastAPI path only |

**Confidence: HIGH for Next.js-only recommendation** — eliminates cross-service coordination that regularly kills hackathon demos.

---

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 4.x | Client state (map pins, overlay toggles, route results) | Minimal boilerplate, no Provider wrapping needed, persists slices trivially. For this app: `mapStore` (pins, zoom), `routeStore` (generated routes, active route), `overlayStore` (toggle state). |

**Why NOT Redux/Context:** Redux setup cost (actions, reducers, thunks) is 2-3 hours in a 48-hour build. React Context re-renders the whole tree on every overlay toggle — bad for map performance.

**Confidence: HIGH** — Zustand 4.x is the standard lightweight state solution for React 18 in 2024-2025.

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `axios` | 1.x | HTTP client | Prefer Next.js native `fetch` — skip axios entirely. |
| `zod` | 3.x | Schema validation | Validate LLM JSON output before feeding to pathfinding graph. LLMs hallucinate malformed JSON — zod prevents silent corruption. |
| `swr` | 2.x | Data fetching / caching | Cache route generation results — avoids re-calling LLM on tab re-focus. |
| `lucide-react` | 0.400.x | Icons | Lightweight, tree-shakeable. For dashboard cards and toggle controls. |
| `clsx` + `tailwind-merge` | latest | Conditional className | Standard Tailwind utility pattern. |
| `html2canvas` | 1.x | DOM-to-image capture | Fallback for map screenshot if Mapbox Static Images API is insufficient. Last resort — Static Images API is preferred. |

---

## Full Dependency Install

```bash
# Core framework
npx create-next-app@14 sierra --typescript --tailwind --eslint --app

# Map
npm install mapbox-gl@3 react-map-gl@7
npm install -D @types/mapbox-gl

# Geospatial
npm install @turf/turf@6

# Graph / pathfinding
npm install graphology@0.25 graphology-shortest-path@2

# LLM
npm install @anthropic-ai/sdk@0.24

# Embeddings (in-memory RAG)
npm install @xenova/transformers@2

# PDF
npm install @react-pdf/renderer@3

# State
npm install zustand@4

# Utilities
npm install zod@3 swr@2 lucide-react clsx tailwind-merge

# Types
npm install -D geojson
```

---

## Alternatives Considered (Summary)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Map | Mapbox GL JS v3 + react-map-gl | MapLibre GL JS (free fork) | MapLibre is a valid swap if Mapbox token unavailable; API is identical |
| Map | Mapbox GL JS v3 | deck.gl | Too much boilerplate for basic interactions (pin drop, popups) |
| Map | Mapbox GL JS v3 | Leaflet | Canvas-based, slower for data density, no native WebGL heatmap |
| Map | Mapbox GL JS v3 | Google Maps JS | Billing risk, weaker GeoJSON styling API |
| RAG | In-memory + @xenova/transformers | Chroma (local) | Adds a service; unnecessary for static corpus |
| RAG | In-memory + @xenova/transformers | Pinecone | Network dependency = demo failure risk |
| PDF | @react-pdf/renderer | Puppeteer | Headless Chrome overhead; 2-5s cold start per PDF |
| PDF | @react-pdf/renderer | jsPDF | Imperative coordinate API = slow to develop |
| Backend | Next.js API Routes | FastAPI | Two services = more demo failure surface area |
| Pathfinding | graphology + graphology-shortest-path | ngraph.* | graphology has better TypeScript types |
| Pathfinding | graphology (JS) | NetworkX (Python) | Only if FastAPI backend is chosen |
| State | Zustand | Redux Toolkit | Setup cost too high for 48 hours |
| State | Zustand | React Context | Re-renders entire tree on overlay toggle — kills map perf |
| Styling | Tailwind CSS | MUI / Chakra UI | Component library setup (theme, customization) costs 2-3 hours |

---

## Version Verification Checklist

Run this at build start to confirm versions are current:

```bash
npm info mapbox-gl version          # Expect 3.x
npm info react-map-gl version       # Expect 7.x
npm info @turf/turf version         # Expect 6.x
npm info graphology version         # Expect 0.25.x
npm info @anthropic-ai/sdk version  # Expect 0.24.x or later
npm info @react-pdf/renderer version # Expect 3.x
npm info zustand version            # Expect 4.x
npm info @xenova/transformers version # Expect 2.x
```

Also verify Claude model IDs at: https://docs.anthropic.com/en/docs/models-overview

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Next.js 14 App Router | HIGH | Dominant pattern, well-established |
| Mapbox GL JS v3 + react-map-gl | HIGH | Industry standard for this use case |
| Turf.js v6 | HIGH | Stable, no breaking changes expected |
| graphology pathfinding | MEDIUM | Solid library but less dominant; verify `graphology-shortest-path` exports |
| In-memory RAG (@xenova/transformers) | MEDIUM | Correct architectural choice; verify v2.x is current on npm |
| Anthropic SDK + model IDs | HIGH (SDK) / MEDIUM (model IDs) | SDK is correct; specific date-stamped model IDs must be verified at build start |
| @react-pdf/renderer v3 | HIGH | Standard React PDF solution |
| Zustand v4 | HIGH | Dominant lightweight state library |
| Tailwind CSS v3 | HIGH | No breaking changes; v4 alpha exists but avoid for hackathon |
| FastAPI (alternative) | HIGH | Standard Python async web framework |

---

## Sources

- Knowledge basis: Claude training data through August 2025
- All versions flagged MEDIUM confidence should be verified with `npm info <package> version` at build start
- Model IDs: https://docs.anthropic.com/en/docs/models-overview (verify at build start)
- Mapbox free tier: https://www.mapbox.com/pricing (50k map loads/month free)
- MapLibre (Mapbox-free alternative): https://maplibre.org/maplibre-gl-js/docs/
