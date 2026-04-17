# Phase 3: Routing Engine & Core Demo Loop - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the A* routing engine to the existing map + graph/friction artifacts, and build the full results UI: Agent Reasoning Stream, Sierra Recommends callout, radar comparison chart, compact route cards, Environmental Trigger Panel, Sierra Alerts, Inline Project Summary, hover justifications, and friction heatmap. This phase delivers the complete 8-step demo arc end-to-end.

**Planning Note (from ROADMAP.md):** Before Phase 3 execution begins, add the four new type shapes to the existing `src/types.ts`: `RouteRecommendation`, `EnvironmentalTrigger`, `SierraAlert`, `ProjectSummary`. This is additive — nothing from Phase 1 breaks.

</domain>

<decisions>
## Implementation Decisions

### Agent Reasoning Stream — Layout
- **Sidebar transforms on simulation start:** When "Run Simulation" is clicked, the constraint controls section disappears and the same sidebar panel fills with the Agent Reasoning Stream. One panel, two states — no new overlay or second panel.
- **Stream ends → sidebar transitions to results:** When the stream concludes ("Sierra Recommends: Route C. Preparing..."), a brief pause, then the sidebar smoothly fades/transitions into the full results view with Sierra Recommends as the first visible element.
- **Cancel button:** A small `[x]` button appears in the top-right of the stream panel during streaming. Clicking it aborts the Claude SSE stream (AbortController) and returns the sidebar to the constraint controls state.

### Agent Reasoning Stream — Text Rendering
- **Typewriter effect:** Each token/chunk from the Claude SSE stream is rendered character-by-character with a small `setTimeout` delay. No line-buffering — characters appear as they stream in. Standard terminal typewriter feel.
- Canned fallback text also plays through the typewriter effect — judges see no difference between live and fallback.

### Results Panel Structure
- **Single scrollable sidebar** (320px, existing width — no expansion).
- **Scroll order (top to bottom):**
  1. ★ Sierra Recommends callout (always visible at top, first element)
  2. Radar/spider comparison chart
  3. Compact route cards (A, B, C — horizontal tab or stacked)
  4. ⚠ Sierra Alerts (primary + up to 2 secondary collapsed)
  5. Environmental Trigger Panel
  6. Inline Project Summary
- Sierra Recommends stays sticky/pinned at top of results or is simply the first element when scrolled to top.

### Route Cards
- **Compact by default:** Each card shows route label, color swatch, distance, cost estimate, permitting range.
- **Expand on click:** Clicking a card expands it to show full metrics and segment justification details.
- Clicking a card also highlights that route on the map (DASH-03). Clicking a route line on map focuses the corresponding card (DASH-04).
- Recommended route (Route C by default) card is pre-highlighted/active on load per REC-03.

### Comparison Visualization
- **Radar/spider chart** — three overlapping radar shapes, one per route in route colors (`#A7C8FF` blue, `#FFBC7C` orange, `#E8B3FF` purple).
- Four axes: Cost, Permitting Timeline, Congestion Relief Value, Regulatory Risk.
- Use **Recharts** `RadarChart` component (already likely in ecosystem; small bundle, React-native).
- Chart fits within 320px sidebar width — compact but readable.

### API Fallback Behavior
- **Silent fallback** — canned text fills in seamlessly if Claude API is unavailable. No badge, no indicator. Judges see no difference.
- **Route-agnostic fixed text:** One set of high-quality pre-written canned content that always references real Texas locations for credibility:
  - Agent Reasoning Stream canned text references: Reeves County ESA habitat, US-385 345kV ROW corridor, Edwards Aquifer recharge zone, Nolan County landowner opposition
  - Sierra Recommends canned rationale: ~3 sentences referencing Route C's regulatory advantage
  - Environmental Triggers canned content: per-route ESA/CWA/NHPA/NEPA entries with Texas-specific zone references
  - Sierra Alerts canned content: Nolan County landowner opposition primary alert + 1 secondary
  - Segment justifications canned: representative justification strings per segment index
- Fallback is triggered per-call via try/catch — live calls are always attempted first; canned text is the catch branch.
- The typewriter effect plays on canned text just as it does on live streamed content.

### Claude's Discretion
- Recharts vs Chart.js for the radar chart (Recharts recommended for React integration)
- Exact A* weight formula combining friction scores + constraint slider values
- How "Sierra Recommends" route is selected (lowest weighted risk score, or configurable)
- Exact canned fallback text content (write high-quality Texas-specific content)
- Hover popup styling (tooltip vs card — match design system glassmorphism)
- How segment justifications are mapped from friction_cache.json indices to route geometry segments
- Whether route cards use horizontal tabs (A / B / C) or stacked accordion

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/MapCanvas/MapCanvas.tsx` — existing map component; route LineString layers and hover popup can be added here
- `src/components/MapCanvas/OverlayLayers.tsx` — friction heatmap layer goes here (HEAT-01/02/03)
- `src/components/MapCanvas/PinMarkers.tsx` — existing pin rendering; no changes needed
- `src/components/Sidebar/Sidebar.tsx` — shell for sidebar state machine (controls → stream → results)
- `src/components/ui/ToggleSwitch.tsx`, `ChipToggle.tsx`, `RadioGroup.tsx` — existing UI primitives; reuse for results panel toggles
- `src/store/useAppStore.ts` — Zustand store already has `routes`, `simulationStatus` fields; extend with `recommendation`, `triggers`, `alerts`, `projectSummary`
- `src/types.ts` — `RouteResult`, `AppState` defined; Phase 3 adds `RouteRecommendation`, `EnvironmentalTrigger`, `SierraAlert`, `ProjectSummary`
- `public/data/friction_cache.json` — (produced by Phase 2) drives heatmap layer and hover justifications
- `public/data/graph.json` — (produced by Phase 2) consumed by A* routing on Express server

### Established Patterns
- Dark design system: `surface-container-low` (`#1C1B1B`) sidebar, glassmorphism for floating elements, no 1px borders
- Route colors locked: A=`#A7C8FF`, B=`#FFBC7C`, C=`#E8B3FF`
- Zustand store as single source of truth for all app state
- Vite proxy `/api/*` → Express port 3001 for all server calls
- TypeScript throughout; shared types in `src/types.ts`
- Vitest for tests; test files colocated in `src/components/**/*.test.tsx`

### Integration Points
- `POST /api/route` → Express A* engine → returns 3 `RouteResult` objects → stored in Zustand `routes`
- `GET /api/stream/reasoning` (SSE) → Express → Claude streaming → rendered in sidebar stream panel
- `POST /api/recommend` → Express → Claude → `RouteRecommendation` → stored in Zustand
- `POST /api/triggers` → Express → Claude → `EnvironmentalTrigger[]` → stored in Zustand
- `POST /api/alerts` → Express → Claude → `SierraAlert` → stored in Zustand
- `POST /api/summary` → Express → Claude → `ProjectSummary` → stored in Zustand
- `public/data/friction_cache.json` → fetched client-side at startup → drives heatmap + hover popups (no server roundtrip)

</code_context>

<specifics>
## Specific Ideas

- The typewriter effect on the Agent Reasoning Stream is a pure visual/UX choice — computational cost is negligible; bottleneck is Claude API speed regardless
- Canned fallback text for the stream should specifically name: Reeves County, Edwards Aquifer, Nolan County, US-385 corridor — same locations the friction pipeline uses, for consistency
- The radar chart's three overlapping shapes in `#A7C8FF` / `#FFBC7C` / `#E8B3FF` should use 30–40% fill opacity to show overlap clearly

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-routing-engine-core-demo-loop*
*Context gathered: 2026-04-16*
