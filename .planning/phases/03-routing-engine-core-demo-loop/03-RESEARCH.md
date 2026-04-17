# Phase 3: Routing Engine & Core Demo Loop - Research

**Researched:** 2026-04-16
**Domain:** A* routing engine, Claude SSE streaming, React UI state machine, Mapbox GL layers, Recharts radar chart
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Agent Reasoning Stream — Layout**
- Sidebar transforms on simulation start: When "Run Simulation" is clicked, the constraint controls section disappears and the same sidebar panel fills with the Agent Reasoning Stream. One panel, two states — no new overlay or second panel.
- Stream ends → sidebar transitions to results: When the stream concludes ("Sierra Recommends: Route C. Preparing..."), a brief pause, then the sidebar smoothly fades/transitions into the full results view with Sierra Recommends as the first visible element.
- Cancel button: A small `[x]` button appears in the top-right of the stream panel during streaming. Clicking it aborts the Claude SSE stream (AbortController) and returns the sidebar to the constraint controls state.

**Agent Reasoning Stream — Text Rendering**
- Typewriter effect: Each token/chunk from the Claude SSE stream is rendered character-by-character with a small `setTimeout` delay. No line-buffering — characters appear as they stream in. Standard terminal typewriter feel.
- Canned fallback text also plays through the typewriter effect — judges see no difference between live and fallback.

**Results Panel Structure**
- Single scrollable sidebar (320px, existing width — no expansion).
- Scroll order (top to bottom):
  1. Sierra Recommends callout (always visible at top, first element)
  2. Radar/spider comparison chart
  3. Compact route cards (A, B, C — horizontal tab or stacked)
  4. Sierra Alerts (primary + up to 2 secondary collapsed)
  5. Environmental Trigger Panel
  6. Inline Project Summary
- Sierra Recommends stays sticky/pinned at top of results or is simply the first element when scrolled to top.

**Route Cards**
- Compact by default: Each card shows route label, color swatch, distance, cost estimate, permitting range.
- Expand on click: Clicking a card expands it to show full metrics and segment justification details.
- Clicking a card also highlights that route on the map (DASH-03). Clicking a route line on map focuses the corresponding card (DASH-04).
- Recommended route (Route C by default) card is pre-highlighted/active on load per REC-03.

**Comparison Visualization**
- Radar/spider chart — three overlapping radar shapes, one per route in route colors (`#A7C8FF` blue, `#FFBC7C` orange, `#E8B3FF` purple).
- Four axes: Cost, Permitting Timeline, Congestion Relief Value, Regulatory Risk.
- Use Recharts `RadarChart` component (already likely in ecosystem; small bundle, React-native).
- Chart fits within 320px sidebar width — compact but readable.

**API Fallback Behavior**
- Silent fallback — canned text fills in seamlessly if Claude API is unavailable. No badge, no indicator.
- Route-agnostic fixed text — one set of high-quality pre-written canned content that always references real Texas locations:
  - Agent Reasoning Stream: Reeves County ESA habitat, US-385 345kV ROW corridor, Edwards Aquifer recharge zone, Nolan County landowner opposition
  - Sierra Recommends canned rationale: ~3 sentences referencing Route C's regulatory advantage
  - Environmental Triggers: per-route ESA/CWA/NHPA/NEPA entries with Texas-specific zone references
  - Sierra Alerts: Nolan County landowner opposition primary alert + 1 secondary
  - Segment justifications: representative justification strings per segment index
- Fallback triggered per-call via try/catch — live calls always attempted first; canned text is the catch branch.
- Typewriter effect plays on canned text just as it does on live streamed content.

### Claude's Discretion
- Recharts vs Chart.js for the radar chart (Recharts recommended for React integration)
- Exact A* weight formula combining friction scores + constraint slider values
- How "Sierra Recommends" route is selected (lowest weighted risk score, or configurable)
- Exact canned fallback text content (write high-quality Texas-specific content)
- Hover popup styling (tooltip vs card — match design system glassmorphism)
- How segment justifications are mapped from friction_cache.json indices to route geometry segments
- Whether route cards use horizontal tabs (A / B / C) or stacked accordion

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUTE-01 | User clicks "Run Simulation" and three routes are generated in under 60 seconds | A* on ngraph.path + Promise.all for parallel Claude calls; all non-LLM routing is fast |
| ROUTE-02 | Three simultaneous color-coded routes appear: A blue, B orange, C purple | Mapbox GL LineString layers via react-map-gl `<Source>` + `<Layer>` per route |
| ROUTE-05 | Constraint slider/toggle values adjust friction weights at route-generation time | A* distance function receives a weight multiplier derived from Zustand constraint state |
| AI-04 | Live Claude calls for stream, recommendation, triggers, alerts, segment justifications; all parallelizable; canned fallback for every call | `@anthropic-ai/sdk` stream + `.on('text')` pattern; Express SSE headers + `res.write()` per chunk; Promise.all for non-streaming calls |
| AGENT-01 | Agent Reasoning Panel activates immediately on simulation start, streaming narration before routes appear | SSE from Express `/api/stream/reasoning`; client EventSource or fetch with ReadableStream |
| AGENT-02 | Stream narrates specific named Texas locations during constraint evaluation | Prompt engineering: inject Texas location names into system prompt; verified by canned fallback text |
| AGENT-03 | Stream concludes with "Sierra Recommends: Route C" summary line; total 20–40 seconds | System prompt instructs Claude to conclude with the summary line; canned fallback mirrors timing |
| HEAT-01 | User can toggle friction heatmap overlay on/off | Mapbox GL heatmap layer type; visibility controlled by Zustand `overlays.frictionHeatmap` |
| HEAT-02 | Heatmap rendered as Mapbox GL heatmap layer from friction_cache.json (green=low, red=high) | `<Source type="geojson">` + `<Layer type="heatmap">` with `heatmap-color` expression mapping 0–1 to green→red |
| HEAT-03 | Heatmap renders client-side from static asset | friction_cache.json fetched at startup via `fetch('/data/friction_cache.json')` — no server roundtrip |
| DASH-01 | Results dashboard always visible with one card per route | Sidebar results panel with three RouteCard components; rendered when `simulationStatus === 'complete'` |
| DASH-02 | Each card: route label/profile, distance, cost, permitting timeline | RouteCard consumes `RouteResult.metrics` fields |
| DASH-03 | Clicking a dashboard card highlights that route on the map and expands card details | Zustand `selectedRoute` field; route layer `line-opacity` expression driven by selected state |
| DASH-04 | Clicking a route line on map focuses the corresponding dashboard card | `onMouseDown` on Mapbox layer via react-map-gl `<Layer>` event → Zustand `setSelectedRoute` |
| DASH-05 | Radar/spider chart showing all three routes across all four dimensions visible immediately | Recharts `RadarChart` with three `<Radar>` components, `fillOpacity={0.35}`, `ResponsiveContainer` |
| REC-01 | "Sierra Recommends" callout appears automatically as first visible results element | First child in results panel JSX; always rendered when `recommendation` is in Zustand |
| REC-02 | Panel header shows recommended route + LLM-generated 3-sentence rationale | `POST /api/recommend` → Claude → `RouteRecommendation.rationale` stored in Zustand |
| REC-03 | Recommended route pre-highlighted on map when results load | Set `selectedRoute` to recommendation.routeId when `simulationStatus` transitions to 'complete' |
| ENV-01 | Environmental Trigger Panel shows per-route statutory trigger list | `POST /api/triggers` → `EnvironmentalTrigger[]` → collapsible accordion per route |
| ENV-02 | Each trigger: statute name, plain-English explanation, estimated timeline contribution; Texas-specific locations | Claude prompt includes Texas zone names; canned fallback has Reeves County / Edwards Aquifer references |
| ENV-03 | Recommended route trigger panel expanded by default; others collapsed | Accordion default open state driven by `routeId === recommendation.routeId` |
| ALERT-01 | One prominent "Critical Risk Identified" callout — unprompted, specific to recommended route | `POST /api/alerts` → `SierraAlert` with `primary` field; always visible at-a-glance in results |
| ALERT-02 | Alert content references real Texas locations (Nolan County) | Claude prompt; canned fallback text includes "Nolan County landowner opposition clusters" |
| ALERT-03 | Up to 2 secondary alerts collapsed below primary | `SierraAlert.secondary[]` array; collapsed by default with expand toggle |
| SUMM-01 | Inline Project Summary accessible on dashboard without PDF export | Scroll section in sidebar results; rendered from `ProjectSummary` in Zustand |
| SUMM-02 | Summary includes phase timeline table with durations and dependencies | `ProjectSummary.phases[]` rows: Desktop Screening, Environmental Review, ROW Acquisition, State Permitting, Construction, Total |
| SUMM-03 | Timeline estimates flagged as illustrative in small print | Static disclaimer string below table |
| HOVER-01 | Hovering any route segment shows popup with LLM friction justification | react-map-gl `onMouseMove` on route layers → read `segmentJustifications` from Zustand routes |
| HOVER-02 | Justification text pre-loaded (not fetched live on hover) | `segmentJustifications` populated when routes returned from `POST /api/route`; no per-hover API call |
</phase_requirements>

---

## Summary

Phase 3 is the integration phase where everything built in Phase 1 (map + UI) and Phase 2 (graph.json + friction_cache.json) is wired together. The three major technical concerns are: (1) the A* routing engine on the Express server that reads `graph.json` and applies constraint weights at query time, (2) the Claude SSE streaming pipeline for the Agent Reasoning Stream plus four parallel Claude calls for the results panels, and (3) the React sidebar state machine that transitions from controls → stream → results, plus all the results UI components (radar chart, route cards, trigger panel, alerts, summary, hover popups, heatmap).

The routing algorithm is straightforward: `ngraph.path` provides a battle-tested A* implementation that accepts a custom distance function. The distance function sums `frictionScore * baseWeight` for each link, where `baseWeight` is adjusted by the constraint slider/toggle values passed in the `POST /api/route` request body. Three separate A* calls (one per route profile) run in parallel to produce the three routes in well under 60 seconds.

The Agent Reasoning Stream uses native Express SSE (no library needed): set `Content-Type: text/event-stream`, write chunks as `data: {"chunk":"..."}\n\n`, and listen for client disconnect on `req.on('close')`. The Anthropic SDK's `.stream().on('text', fn)` handler pipes each text token directly to the SSE response. Client-side, a React hook manages `EventSource` or `fetch` with `ReadableStream`, an `AbortController` for the cancel button, and a typewriter queue that replays characters with `setTimeout`. Canned fallback plays through the same typewriter mechanism, so judges see identical behavior.

**Primary recommendation:** Use `ngraph.path` for A*, `@anthropic-ai/sdk` `.stream()` for Claude SSE, Recharts `RadarChart` for the comparison chart, and react-map-gl `<Source>`/`<Layer>` with `type: 'heatmap'` and `type: 'line'` for the map layers. The sidebar state machine should be driven by a Zustand `simulationStatus` field extended with `'streaming'` as an intermediate state.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ngraph.path` | 1.4.0 | A* pathfinding on weighted graph | Purpose-built for weighted graphs; accepts custom distance fn; fast; no grid constraints |
| `ngraph.graph` | latest | Graph data structure consumed by ngraph.path | Companion library; required to build the graph object ngraph.path operates on |
| `@anthropic-ai/sdk` | latest (already in server/package.json from Phase 2) | Claude streaming + parallel calls | Already in project; `.stream().on('text')` provides clean per-token callback |
| `recharts` | 3.8.1 | Radar/spider chart | React-native (JSX components); no D3 imperative code; `ResponsiveContainer` handles 320px sidebar; fillOpacity built-in |
| `react-map-gl` (mapbox) | 8.1.1 (already installed) | Route LineString layers, heatmap layer, hover events | Already in project; `<Source>` + `<Layer>` pattern identical to existing overlay layers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `p-limit` | (already in server from Phase 2) | Concurrency control for parallel Claude calls | Limit concurrent API calls to avoid rate limits during Promise.all |
| Native `AbortController` | Built-in | Cancel SSE stream from client | Browser built-in; no library needed |
| Native `EventSource` / `fetch` with `ReadableStream` | Built-in | Consume SSE on client | `EventSource` is simpler; `fetch` + `ReadableStream` gives more control over abort |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ngraph.path` | Custom A* implementation | Hand-rolling A* risks priority queue bugs and performance issues; ngraph.path is tested and handles weighted graphs correctly |
| Recharts `RadarChart` | Chart.js with radar type | Chart.js requires canvas + imperative API; Recharts is declarative React JSX — consistent with existing component patterns |
| Native SSE + Express `res.write()` | `socket.io` or `ws` | WebSockets are bidirectional; SSE is one-way and perfectly suited for streaming narration; far simpler setup |
| `fetch` ReadableStream for SSE | `EventSource` | `EventSource` doesn't support `AbortController` natively; use `fetch` with `ReadableStream` for the reasoning stream so the cancel button works via AbortController |

**Installation (client):**
```bash
npm install recharts
```

**Installation (server — in `/server` directory):**
```bash
npm install ngraph.path ngraph.graph
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 3 additions)
```
src/
├── components/
│   ├── MapCanvas/
│   │   ├── MapCanvas.tsx          # Add: route layers, hover handler, route click handler
│   │   ├── OverlayLayers.tsx      # Add: friction heatmap layer (HEAT-01/02/03)
│   │   └── RouteLayer.tsx         # NEW: LineString layers for routes A/B/C + hover popup
│   ├── Sidebar/
│   │   ├── Sidebar.tsx            # Refactor: state machine (controls | streaming | results)
│   │   ├── StreamPanel.tsx        # NEW: Agent Reasoning Stream + typewriter + cancel button
│   │   └── results/
│   │       ├── ResultsPanel.tsx   # NEW: scroll container for all results sections
│   │       ├── SierraRecommends.tsx   # NEW: REC-01/02/03
│   │       ├── RadarChart.tsx         # NEW: DASH-05
│   │       ├── RouteCards.tsx         # NEW: DASH-01/02/03
│   │       ├── SierraAlerts.tsx       # NEW: ALERT-01/02/03
│   │       ├── EnvTriggerPanel.tsx    # NEW: ENV-01/02/03
│   │       └── ProjectSummary.tsx     # NEW: SUMM-01/02/03
│   └── ui/
│       └── HoverPopup.tsx         # NEW: glassmorphism popup for HOVER-01/02
├── store/
│   └── useAppStore.ts             # Extend: recommendation, triggers, alerts, projectSummary, selectedRoute
├── hooks/
│   └── useReasoningStream.ts      # NEW: SSE + typewriter + AbortController
└── types.ts                       # Extend: RouteRecommendation, EnvironmentalTrigger, SierraAlert, ProjectSummary
server/
├── routes/
│   └── api.ts                     # Extend: POST /api/route, GET /api/stream/reasoning, POST /api/recommend, /api/triggers, /api/alerts, /api/summary
└── routing/
    └── astar.ts                   # NEW: A* engine using ngraph.path
```

### Pattern 1: Sidebar State Machine
**What:** `Sidebar.tsx` renders one of three views based on `simulationStatus`: controls (idle/error), streaming (running), results (complete).
**When to use:** Any time a single panel must host multiple sequential views.

```typescript
// Source: derived from CONTEXT.md decisions
type SimulationStatus = 'idle' | 'running' | 'complete' | 'error';

// Extend to include streaming intermediate state
// 'running' = A* executing + stream open
// 'complete' = routes + all panels populated

function Sidebar() {
  const status = useAppStore(s => s.simulationStatus);

  if (status === 'running') return <StreamPanel />;
  if (status === 'complete') return <ResultsPanel />;
  return <ControlsPanel />;  // idle | error
}
```

### Pattern 2: A* Routing with Constraint-Adjusted Weights
**What:** Express route handler loads graph.json once at startup, runs three A* calls in parallel with different weight profiles derived from constraint state.
**When to use:** Three fixed route profiles (lowest-cost, balanced, lowest-risk).

```typescript
// Source: ngraph.path docs — https://www.npmjs.com/package/ngraph.path
import createGraph from 'ngraph.graph';
import { aStar } from 'ngraph.path';

// Build graph once at server startup from graph.json
const graph = createGraph();
graphJson.nodes.forEach(n => graph.addNode(n.id, n));
graphJson.edges.forEach(e => graph.addLink(e.from, e.to, e));

function findRoute(
  from: string,
  to: string,
  weights: { costW: number; riskW: number; coLocationW: number }
) {
  const finder = aStar(graph, {
    distance(fromNode, toNode, link) {
      const friction = link.data.frictionScore as number;
      // Weighted combination per profile
      return friction * weights.costW + link.data.regulatoryRisk * weights.riskW;
    },
    heuristic(from, to) {
      // Haversine distance as admissible heuristic
      return haversineKm(from.data.lat, from.data.lng, to.data.lat, to.data.lng);
    }
  });
  return finder.find(from, to);
}

// In route handler: three parallel calls
const [routeA, routeB, routeC] = await Promise.all([
  findRoute(source, dest, { costW: 1.5, riskW: 0.5, coLocationW: 1.0 }),
  findRoute(source, dest, { costW: 1.0, riskW: 1.0, coLocationW: 1.0 }),
  findRoute(source, dest, { costW: 0.5, riskW: 1.5, coLocationW: 1.0 }),
]);
```

### Pattern 3: Claude SSE Streaming to Express SSE Response
**What:** Express handler opens Claude stream, pipes each text token to the SSE response, handles disconnect cleanup.
**When to use:** `GET /api/stream/reasoning` endpoint.

```typescript
// Source: Anthropic SDK docs — https://platform.claude.com/docs/en/build-with-claude/streaming
import Anthropic from '@anthropic-ai/sdk';

app.get('/api/stream/reasoning', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = new Anthropic();
  let aborted = false;

  req.on('close', () => { aborted = true; });

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 800,
      messages: [{ role: 'user', content: buildReasoningPrompt(req.query) }],
    });

    stream.on('text', (text) => {
      if (aborted) return;
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    // Canned fallback — pipe pre-written text in chunks with delays
    await streamCannedFallback(res);
  }
});
```

### Pattern 4: Client-Side Typewriter Hook
**What:** Custom React hook consumes SSE stream and queues characters for display with `setTimeout` delay.
**When to use:** `StreamPanel` component for Agent Reasoning Stream.

```typescript
// Source: derived from MDN EventSource + React patterns
// Use fetch + ReadableStream (not EventSource) to support AbortController

export function useReasoningStream() {
  const [displayText, setDisplayText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<string[]>([]);  // pending chars

  const startStream = useCallback(async (queryParams: Record<string, string>) => {
    abortRef.current = new AbortController();
    const res = await fetch(`/api/stream/reasoning?${new URLSearchParams(queryParams)}`, {
      signal: abortRef.current.signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    // Parse SSE chunks, push chars to queue
    // Drain queue character-by-character with setTimeout(15ms)
    // On [DONE] sentinel, stop draining
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { displayText, startStream, cancel };
}
```

### Pattern 5: Mapbox GL Heatmap Layer from friction_cache.json
**What:** Convert friction_cache.json nodes to GeoJSON FeatureCollection, render as Mapbox GL heatmap layer.
**When to use:** Friction heatmap toggle (HEAT-01/02/03).

```typescript
// Source: Mapbox GL JS docs — https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/
// friction_cache.json shape (from Phase 2): { nodeId: { lat, lng, frictionScore, justification } }

// In OverlayLayers.tsx — convert to GeoJSON at component mount
const heatmapGeoJSON = useMemo(() => ({
  type: 'FeatureCollection' as const,
  features: Object.values(frictionCache).map(node => ({
    type: 'Feature' as const,
    geometry: { type: 'Point', coordinates: [node.lng, node.lat] },
    properties: { friction: node.frictionScore },
  })),
}), [frictionCache]);

// Layer paint — green (0) to red (1)
const heatmapPaint = {
  'heatmap-weight': ['get', 'friction'],          // 0–1 from friction score
  'heatmap-intensity': 1,
  'heatmap-color': [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0,200,0,0)',
    0.4, 'rgba(255,235,0,0.6)',
    1, 'rgba(220,0,0,0.9)',
  ],
  'heatmap-radius': 20,
};
```

### Pattern 6: Route LineString Layers + Click/Hover
**What:** Render three route LineString geometries as Mapbox GL line layers; handle click-to-select and hover-for-popup.
**When to use:** `RouteLayer.tsx` component, consumed inside `MapCanvas`.

```typescript
// Source: react-map-gl docs + Mapbox popup examples
// One <Source> + <Layer> per route; opacity driven by selectedRoute state

routes.map(route => (
  <Source key={route.id} id={`route-${route.id}`} type="geojson" data={route.geometry}>
    <Layer
      id={`route-line-${route.id}`}
      type="line"
      paint={{
        'line-color': route.color,
        'line-width': selectedRoute === route.id ? 4 : 2,
        'line-opacity': selectedRoute === null || selectedRoute === route.id ? 1 : 0.35,
      }}
      onClick={() => setSelectedRoute(route.id)}
      onMouseMove={(e) => handleRouteHover(e, route)}
      onMouseLeave={() => setHoverPopup(null)}
    />
  </Source>
))
```

### Pattern 7: Recharts RadarChart (320px sidebar)
**What:** Three overlapping radar shapes at 30–40% fill opacity, axes for four dimensions.
**When to use:** DASH-05 comparison visualization.

```typescript
// Source: Recharts official docs — https://recharts.github.io/en-US/api/RadarChart/
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const data = [
  { axis: 'Cost',               A: routeA.cost,        B: routeB.cost,        C: routeC.cost },
  { axis: 'Permitting',         A: routeA.permitting,  B: routeB.permitting,  C: routeC.permitting },
  { axis: 'Congestion Relief',  A: routeA.congestion,  B: routeB.congestion,  C: routeC.congestion },
  { axis: 'Regulatory Risk',    A: routeA.risk,        B: routeB.risk,        C: routeC.risk },
];

<ResponsiveContainer width="100%" height={200}>
  <RadarChart data={data}>
    <PolarGrid />
    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#C1C6D7' }} />
    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
    <Radar name="Route A" dataKey="A" stroke="#A7C8FF" fill="#A7C8FF" fillOpacity={0.35} />
    <Radar name="Route B" dataKey="B" stroke="#FFBC7C" fill="#FFBC7C" fillOpacity={0.35} />
    <Radar name="Route C" dataKey="C" stroke="#E8B3FF" fill="#E8B3FF" fillOpacity={0.35} />
  </RadarChart>
</ResponsiveContainer>
```

### Anti-Patterns to Avoid
- **Re-running A* on every render:** Build the ngraph graph once at server startup; store it in module scope — do not rebuild from graph.json per request.
- **Fetching friction_cache.json per hover:** HOVER-02 explicitly requires pre-loaded data. Fetch at app startup via `useEffect` in App.tsx, store in Zustand or a module-level variable.
- **Using `EventSource` for the reasoning stream:** EventSource does not support `AbortController` natively; use `fetch` with `ReadableStream` instead so the cancel `[x]` button works correctly.
- **Typewriter effect via `setInterval` on component:** Use a ref-based queue with `setTimeout` chaining — `setInterval` will drift and pile up if the component re-renders.
- **Blocking route response on Claude calls:** The `POST /api/route` should return routes immediately after A* completes. The five Claude calls (`/api/stream/reasoning` SSE, `/api/recommend`, `/api/triggers`, `/api/alerts`, `/api/summary`) are separate endpoints called in parallel from the client, not blocking the route response.
- **Rendering Recharts at fixed pixel width:** Always wrap in `<ResponsiveContainer>` — fixed width breaks at different DPI or when sidebar has padding.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| A* pathfinding on weighted graph | Custom priority queue + graph traversal | `ngraph.path` + `ngraph.graph` | Priority queue correctness is subtle; ngraph.path handles tie-breaking, heuristic pluggability, and is battle-tested at scale |
| Radar/spider chart | SVG path math for polygon radar shapes | Recharts `RadarChart` | Polar coordinate math for overlapping multi-series radar is error-prone; Recharts handles axis labels, responsive sizing, fill overlap |
| SSE parsing in browser | Manual `TextDecoder` + newline splitting | `fetch` + `ReadableStream` with chunk parser | SSE chunk boundaries don't align with write() calls; partial chunks must be buffered — standard pattern handles this reliably |
| Claude token streaming | Manual HTTP streaming with `node-fetch` | `@anthropic-ai/sdk` `.stream()` | SDK handles reconnect, event parsing, error normalization, and the `message_stop` sentinel |

**Key insight:** The routing and visualization are both solved problems with standard libraries. The real engineering in Phase 3 is the state machine wiring — making controls → stream → results transition feel seamless — not the individual algorithms.

---

## Common Pitfalls

### Pitfall 1: graph.json Node ID Mismatch with Nearest-Node Lookup
**What goes wrong:** The user drops pins at arbitrary lat/lng. The A* engine needs a start node ID and end node ID from `graph.json`. Finding the nearest graph node to the pin requires a spatial lookup; a naive linear scan over thousands of nodes is too slow.
**Why it happens:** Developers forget the pin→node translation step and either crash (unknown node ID) or produce routes from the wrong starting point.
**How to avoid:** Implement `findNearestNode(lat, lng, graph)` using Euclidean distance (sufficient for demo scale — no need for a spatial index). Run it server-side in the route handler. Cache nothing — it's fast enough at graph.json's expected scale (~few thousand nodes).
**Warning signs:** Routes that start far from the dropped pin; A* returning empty path.

### Pitfall 2: SSE Connection Leaks When Client Disconnects
**What goes wrong:** Judge closes the tab or clicks cancel. The Express SSE handler continues calling `res.write()` on a closed socket, producing `write after end` errors and wasting Claude API tokens.
**Why it happens:** Missing `req.on('close', ...)` listener.
**How to avoid:** Set a boolean `aborted = true` in the `req.on('close')` handler. Check `aborted` before every `res.write()`. For the Anthropic stream, call `stream.controller.abort()` if `req` closes.
**Warning signs:** Server logs showing `write after end` errors; Claude API usage accumulating even when nobody is watching the stream.

### Pitfall 3: Typewriter Queue Pile-Up During Fast Streaming
**What goes wrong:** Claude streams tokens faster than the typewriter delay (15ms/char × chars per token). The queue grows unboundedly; when the user closes the stream panel mid-stream, the queue continues draining and updating state on an unmounted component.
**Why it happens:** The queue drain loop is not cancelled on component unmount or stream abort.
**How to avoid:** Track a `draining` ref. On component unmount (via `useEffect` cleanup) or stream abort, clear the queue and set a `cancelled` flag. The drain `setTimeout` checks `cancelled` before each character.
**Warning signs:** Characters continuing to appear in React state after sidebar has transitioned away from `StreamPanel`; React "unmounted component" warnings in console.

### Pitfall 4: Recharts Hydration Mismatch at 320px Width
**What goes wrong:** `RadarChart` renders at 0×0 or overflows the sidebar because `ResponsiveContainer` needs a parent with explicit height.
**Why it happens:** `ResponsiveContainer width="100%" height={200}` requires its parent to have a defined width. A `display: flex` column container without explicit width may not propagate correctly.
**How to avoid:** Give the radar chart container `style={{ width: '100%', minWidth: 0 }}` and ensure the parent flex container has `minWidth: 0` to allow flex shrink below content size.
**Warning signs:** Chart not visible, zero-size SVG, or chart overflowing sidebar at 320px.

### Pitfall 5: Parallel Claude Calls Hitting Rate Limits
**What goes wrong:** After routing, client fires `POST /api/recommend`, `POST /api/triggers`, `POST /api/alerts`, `POST /api/summary` simultaneously. Claude API rate limits trigger 429 errors, degrading to canned fallback for all four.
**Why it happens:** `Promise.all` with four concurrent Claude calls on a tier with strict RPM limits.
**How to avoid:** On the server, use `p-limit(2)` to cap concurrent Claude calls at 2 simultaneous. The /api/recommend call (most visible) goes first; triggers and alerts can be slightly delayed. Alternatively, stagger client-side fetches: recommend first, then Promise.all(triggers, alerts, summary).
**Warning signs:** Multiple simultaneous 429 responses in server logs immediately after route generation.

### Pitfall 6: friction_cache.json Shape Mismatch for Heatmap
**What goes wrong:** Phase 2 produces `friction_cache.json` in a shape the Phase 3 heatmap code doesn't expect (e.g., array vs object keyed by nodeId).
**Why it happens:** Phase 3 planning assumes a shape that Phase 2 didn't produce.
**How to avoid:** The Phase 3 plan must explicitly document the expected friction_cache.json schema (object keyed by nodeId with `{ lat, lng, frictionScore, justification }` per node) and include a validation step that reads the actual file and asserts the shape before writing heatmap layer code.
**Warning signs:** Heatmap renders no points; console errors on `Object.values(frictionCache).map(...)`.

---

## Code Examples

### Express SSE Headers (verified pattern)
```typescript
// Source: MDN Using server-sent events — https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.flushHeaders();
// Write events: res.write(`data: ${JSON.stringify(payload)}\n\n`);
// End: res.write('data: [DONE]\n\n'); res.end();
```

### Anthropic SDK Streaming (TypeScript)
```typescript
// Source: Anthropic official docs — https://platform.claude.com/docs/en/build-with-claude/streaming
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();

const stream = client.messages.stream({
  messages: [{ role: 'user', content: prompt }],
  model: 'claude-opus-4-7',
  max_tokens: 800,
});

stream.on('text', (text) => {
  // text is a single token/chunk — pipe to SSE res.write()
  res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
});

await stream.finalMessage(); // awaits message_stop
res.write('data: [DONE]\n\n');
res.end();
```

### Fetch-based SSE Consumer with AbortController
```typescript
// Source: derived from MDN ReadableStream API
const controller = new AbortController();

const response = await fetch('/api/stream/reasoning', { signal: controller.signal });
const reader = response.body!.getReader();
const decoder = new TextDecoder();

let buffer = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  // Parse SSE lines from buffer
  const lines = buffer.split('\n\n');
  buffer = lines.pop() ?? '';
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const payload = line.slice(6);
      if (payload === '[DONE]') return;
      const { chunk } = JSON.parse(payload);
      enqueueForTypewriter(chunk);
    }
  }
}

// Cancel: controller.abort();
```

### ngraph.path A* with Custom Weight
```typescript
// Source: ngraph.path README — https://www.npmjs.com/package/ngraph.path
import createGraph from 'ngraph.graph';
import { aStar } from 'ngraph.path';

const graph = createGraph();
// Populate from graph.json nodes/edges

const finder = aStar(graph, {
  distance(fromNode, toNode, link) {
    return link.data.frictionScore * weightMultiplier;
  },
  heuristic(from, to) {
    return haversineKm(from.data, to.data); // admissible
  },
});

const path = finder.find('node-123', 'node-456');
// Returns array of nodes from source to destination
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `EventSource` for cancellable SSE | `fetch` + `ReadableStream` + `AbortController` | ~2021 | EventSource can't be aborted cleanly; fetch approach supports full lifecycle control |
| Chart.js for React radar charts | Recharts declarative JSX components | ~2019 | No imperative canvas ref manipulation; plays well with React re-renders |
| Dijkstra for routing (uniform cost) | A* with haversine heuristic | Standard | A* is faster for geographic graphs where node coordinates enable distance estimation |
| `setInterval` typewriter | `setTimeout` chain with ref-based queue | Ongoing best practice | setInterval accumulates ticks during suspend; setTimeout chains are cancellable per character |

**Deprecated/outdated:**
- `react-mapbox-gl` (alex3165): Replaced by official `react-map-gl` from vis.gl (used in this project). Do not mix the two.
- `EventSource` for this use case: Can't be cancelled with AbortController; use fetch + ReadableStream.

---

## Open Questions

1. **friction_cache.json exact schema from Phase 2**
   - What we know: Phase 2 plans produce friction_cache.json; Phase 2 research specified `{ nodeId: { frictionScore, justification } }` structure
   - What's unclear: Does it include `lat`/`lng` per node, or only a reference back to graph.json node IDs? The heatmap needs coordinates.
   - Recommendation: Phase 3 Wave 0 task must read the actual friction_cache.json produced by Phase 2 and verify it contains coordinates (or add a transform step that joins with graph.json to add lat/lng).

2. **graph.json edge shape from Phase 2**
   - What we know: graph.json is a pre-built graph; edges connect nodes with friction weights
   - What's unclear: Exact edge schema — does each edge have `frictionScore` inline, or does the A* server join with friction_cache.json at query time?
   - Recommendation: The Phase 3 `astar.ts` plan must include an explicit "inspect graph.json schema" step before writing the distance function.

3. **Nearest-node lookup performance at Texas scale**
   - What we know: Graph has enough nodes to cover Texas at useful granularity; linear scan is O(n)
   - What's unclear: If Phase 2 produces ~50,000+ nodes, linear scan may be too slow (though for a demo this is acceptable)
   - Recommendation: Start with linear scan. If it's noticeably slow, add a simple grid-bucket spatial index (no library needed for demo scale).

---

## Validation Architecture

> nyquist_validation is enabled (key present and true in config.json).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `vitest.config.ts` (root) + `server/` has its own vitest setup from Phase 2 |
| Quick run command | `npx vitest run --reporter=verbose` (root); `cd server && npx vitest run` (server) |
| Full suite command | `npx vitest run && cd server && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-01 | A* returns 3 routes in response | unit | `cd server && npx vitest run src/__tests__/routing.test.ts` | ❌ Wave 0 |
| ROUTE-02 | Routes have correct id/color/profile fields | unit | `cd server && npx vitest run src/__tests__/routing.test.ts` | ❌ Wave 0 |
| ROUTE-05 | Constraint weights alter route path | unit | `cd server && npx vitest run src/__tests__/routing.test.ts` | ❌ Wave 0 |
| AI-04 | Canned fallback returns valid shape | unit | `cd server && npx vitest run src/__tests__/cannedFallback.test.ts` | ❌ Wave 0 |
| AGENT-01/02/03 | SSE endpoint sends chunks + [DONE] | integration | manual — SSE in jsdom requires mocking | manual-only |
| HEAT-01/02/03 | Heatmap layer toggled by overlay state | unit | `npx vitest run src/components/MapCanvas/OverlayLayers.test.tsx` | ❌ Wave 0 |
| DASH-01/02 | RouteCards renders metrics from RouteResult | unit | `npx vitest run src/components/Sidebar/results/RouteCards.test.tsx` | ❌ Wave 0 |
| DASH-03/04 | Card click sets selectedRoute; route click focuses card | unit | `npx vitest run src/components/Sidebar/results/RouteCards.test.tsx` | ❌ Wave 0 |
| DASH-05 | RadarChart renders with 3 Radar children | unit | `npx vitest run src/components/Sidebar/results/RadarChart.test.tsx` | ❌ Wave 0 |
| REC-01/02/03 | SierraRecommends shows rationale; recommended route active | unit | `npx vitest run src/components/Sidebar/results/SierraRecommends.test.tsx` | ❌ Wave 0 |
| ENV-01/02/03 | EnvTriggerPanel renders triggers; recommended route expanded | unit | `npx vitest run src/components/Sidebar/results/EnvTriggerPanel.test.tsx` | ❌ Wave 0 |
| ALERT-01/02/03 | SierraAlerts shows primary + collapsed secondary | unit | `npx vitest run src/components/Sidebar/results/SierraAlerts.test.tsx` | ❌ Wave 0 |
| SUMM-01/02/03 | ProjectSummary renders timeline rows with illustrative disclaimer | unit | `npx vitest run src/components/Sidebar/results/ProjectSummary.test.tsx` | ❌ Wave 0 |
| HOVER-01/02 | HoverPopup shows justification from pre-loaded data | unit | `npx vitest run src/components/MapCanvas/RouteLayer.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=dot` (root) or `cd server && npx vitest run --reporter=dot`
- **Per wave merge:** `npx vitest run && cd server && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `server/src/__tests__/routing.test.ts` — covers ROUTE-01, ROUTE-02, ROUTE-05 (A* engine unit tests with a small synthetic graph)
- [ ] `server/src/__tests__/cannedFallback.test.ts` — covers AI-04 (validates canned fallback objects match type shapes)
- [ ] `src/components/Sidebar/results/RouteCards.test.tsx` — covers DASH-01/02/03
- [ ] `src/components/Sidebar/results/RadarChart.test.tsx` — covers DASH-05
- [ ] `src/components/Sidebar/results/SierraRecommends.test.tsx` — covers REC-01/02/03
- [ ] `src/components/Sidebar/results/EnvTriggerPanel.test.tsx` — covers ENV-01/02/03
- [ ] `src/components/Sidebar/results/SierraAlerts.test.tsx` — covers ALERT-01/02/03
- [ ] `src/components/Sidebar/results/ProjectSummary.test.tsx` — covers SUMM-01/02/03
- [ ] `src/components/MapCanvas/OverlayLayers.test.tsx` (extend existing) — covers HEAT-01/02/03
- [ ] `src/components/MapCanvas/RouteLayer.test.tsx` — covers HOVER-01/02
- [ ] Server: `npm install ngraph.path ngraph.graph` — if not already in server/package.json
- [ ] Client: `npm install recharts` — not yet installed (confirmed)

---

## Sources

### Primary (HIGH confidence)
- Anthropic SDK streaming docs — https://platform.claude.com/docs/en/build-with-claude/streaming — confirmed `.stream().on('text', fn)` pattern and `finalMessage()` awaitable
- ngraph.path npm/README — https://www.npmjs.com/package/ngraph.path — confirmed distance function API and weighted graph pattern
- Recharts GitHub demo — https://github.com/recharts/recharts/blob/master/demo/component/RadarChart.tsx — confirmed `<Radar fillOpacity>` and `<ResponsiveContainer>` usage
- Mapbox GL JS heatmap docs — https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/ — confirmed `heatmap-weight` and `heatmap-color` paint properties
- MDN Server-sent events — https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events — confirmed SSE wire format
- Existing project files: `src/types.ts`, `src/store/useAppStore.ts`, `src/components/MapCanvas/*.tsx`, `src/components/Sidebar/Sidebar.tsx`, `package.json`, `vitest.config.ts`, Phase 2 plan 02-01-PLAN.md

### Secondary (MEDIUM confidence)
- Recharts v3.8.1 latest version — npm registry search result (22 days ago from research date) — verified package exists and is actively maintained
- ngraph.path weighted graph example — npm README example verified against GitHub source
- Express SSE pattern — verified across multiple WebSearch sources (MDN primary, dev.to secondary)
- fetch + ReadableStream SSE consumption — MDN WebSearch result, consistent with Anthropic streaming pattern

### Tertiary (LOW confidence)
- Recharts bundle size — Bundlephobia redirect failed; size not independently verified. Known to be lightweight from project claims; flag for verification if bundle size becomes a concern.
- ngraph.path performance at Texas graph scale — no benchmarks found for >10,000 node graphs; linear nearest-node scan performance at hackathon scale is assumed acceptable.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified via npm/official docs; existing project dependencies confirmed by reading package.json
- Architecture: HIGH — patterns derived directly from official SDK docs and existing codebase patterns (OverlayLayers.tsx, useAppStore.ts)
- Pitfalls: MEDIUM — most from direct technical reasoning about the integration points; SSE leak and typewriter pitfalls are well-documented community patterns

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (Recharts and ngraph.path are stable; Anthropic SDK may change streaming API)
