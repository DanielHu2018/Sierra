# Roadmap: Sierra

## Overview

Sierra goes from blank canvas to a fully-working hackathon demo in five phases. Phase 1 (map canvas + constraint UI) and Phase 2 (offline data pipeline + AI friction scoring) are built in parallel by different team members, then merge into Phase 3 where the routing engine fires for the first time and the full agentic demo loop is built end-to-end — including the Agent Reasoning Stream, Sierra Recommends callout, Environmental Trigger Panel, Sierra Alerts, and Inline Project Summary. Phase 4 layers the PDF dossier export on top of the proven route data shape. Phase 5 is a hard feature freeze — error states, ADA compliance, mock data footnotes, and deploy.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Map Canvas** - Full-screen Texas map, pin drop, overlay toggles, constraint controls, and shared types contract
- [ ] **Phase 2: Offline Data Pipeline & AI Core** - graph.json build, friction pre-computation via Claude, RAG index (runs in parallel with Phase 1)
- [x] **Phase 3: Routing Engine & Core Demo Loop** - A* routing, Agent Reasoning Stream, three simultaneous routes, Sierra Recommends, Environmental Trigger Panel, Sierra Alerts, Inline Project Summary, heatmap, hover justifications, dashboard cards (completed 2026-04-18)
- [ ] **Phase 4: PDF Dossier Export** - Server-side PDF with LLM narrative intro, route metrics, Sierra Recommends rationale, environmental trigger summary, project timeline, Sierra Alerts, per-segment justifications, mock contacts, map thumbnail
- [ ] **Phase 5: Demo Hardening & Polish** - Error states, ADA compliance, mock data footnotes, cache pre-warm, production deploy

## Phase Details

### Phase 1: Foundation & Map Canvas
**Goal**: A judge can open the app and interact with the full map UI — drop pins, toggle all overlays, and adjust every constraint control — before any routing logic exists
**Depends on**: Nothing (first phase, runs in parallel with Phase 2)
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, MAP-08, DATA-01, DATA-02, CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05
**Success Criteria** (what must be TRUE):
  1. User sees a full-screen Texas map on first load with satellite and terrain baselayer options, no login prompt
  2. User can drop a Source pin and a Destination pin by clicking the map; both labels appear and the map recenters
  3. User can toggle each of the five overlays (ERCOT grid, land boundary, wildlife habitat, topography, friction heatmap placeholder) on and off without the browser freezing
  4. User can adjust the Cost vs. Risk slider, toggle Co-Location, Eminent Domain, and Ecology Avoidance, and select a Voltage type — all controls are visible and respond
  5. A shared types.ts contract exists that defines all data shapes: route result, RouteRecommendation, EnvironmentalTrigger, SierraAlert, and ProjectSummary — consumable by map, dashboard, and PDF without modification
**Plans**: 6 plans

Plans:
- [ ] 01-01-PLAN.md — Vite scaffold + Vitest test infrastructure (Wave 0)
- [ ] 01-02-PLAN.md — types.ts contract + Zustand AppState store (Wave 1)
- [ ] 01-03-PLAN.md — Mock GeoJSON overlay data assets (Wave 1)
- [ ] 01-04-PLAN.md — Map canvas: MapCanvas, PinMarkers, OverlayLayers, MapControls (Wave 2)
- [ ] 01-05-PLAN.md — Sidebar UI: all constraint controls, TopNav, UI primitives (Wave 2)
- [ ] 01-06-PLAN.md — App wiring: App.tsx, main.tsx, index.css + human verification (Wave 3)

### Phase 2: Offline Data Pipeline & AI Core
**Goal**: A validated, friction-scored graph is on disk and a RAG index is ready in memory — all AI work is pre-computed so routing never blocks on LLM calls
**Depends on**: Nothing (runs in parallel with Phase 1)
**Requirements**: AI-01, AI-02, AI-03, ROUTE-03, ROUTE-04, ROUTE-07
**Success Criteria** (what must be TRUE):
  1. graph.json exists on disk and passes a BFS connectivity check confirming >95% of nodes are reachable
  2. friction_cache.json exists with a 0–1 float score and one-line justification for every graph node, produced by Claude offline
  3. LLM produces friction scores only; it never writes or modifies any graph coordinates
  4. RAG index is loadable at server startup from embedded regulation text chunks (PUCT, Texas environmental, NEPA, ESA, CWA Section 404, NHPA Section 106, habitat) with no external vector DB dependency
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Express server scaffold, test stubs, Vite proxy (Wave 1)
- [x] 02-02-PLAN.md — Graph construction pipeline: lat/lng grid, BFS check, write graph.json (Wave 2)
- [ ] 02-03-PLAN.md — Regulation scrape + embed pipeline: fetch/fallback, chunk, OpenAI embed, write regulations-embedded.json (Wave 2)
- [ ] 02-04-PLAN.md — Friction scoring pipeline: batched Claude calls with RAG context, write friction_cache.json + pipeline orchestrator (Wave 3)

### Phase 3: Routing Engine & Core Demo Loop
**Planning Note**: Before Phase 3 execution begins, add the four new type shapes from the updated PRD to the existing `types.ts`: `RouteRecommendation`, `EnvironmentalTrigger`, `SierraAlert`, `ProjectSummary`. This is additive — nothing built in Phase 1 breaks. Include as an explicit task in the Phase 3 plan.
**Goal**: A judge can drop two pins, click "Run Simulation," and watch the Agent Reasoning Stream narrate constraint evaluation for 20–40 seconds before three color-coded routes appear — then immediately see the Sierra Recommends callout, Environmental Trigger Panel, Sierra Alerts risk flag, and Inline Project Summary; the full 8-step demo arc works end-to-end
**Depends on**: Phase 1 (map rendering + types contract), Phase 2 (graph.json + friction_cache.json)
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-05, AI-04, AGENT-01, AGENT-02, AGENT-03, HEAT-01, HEAT-02, HEAT-03, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, REC-01, REC-02, REC-03, ENV-01, ENV-02, ENV-03, ALERT-01, ALERT-02, ALERT-03, SUMM-01, SUMM-02, SUMM-03, HOVER-01, HOVER-02
**Success Criteria** (what must be TRUE):
  1. Clicking "Run Simulation" immediately activates the Agent Reasoning Panel, which streams real-time narration of constraint evaluation (naming specific Texas locations) for 20–40 seconds before routes appear, concluding with "Sierra Recommends: Route C" or equivalent
  2. Three color-coded routes (blue Lowest Cost, orange Balanced, purple Lowest Regulatory Risk) appear on the map in under 60 seconds total
  3. A radar/spider chart or four-column comparison table is the first visible element of the results dashboard, showing all three routes scored on all four dimensions (cost, permitting timeline, congestion relief value, regulatory risk)
  4. Sierra Recommends callout appears automatically as a highlighted panel — the first named element — with the recommended route pre-highlighted on the map and an LLM-generated 3-sentence rationale
  5. Environmental Trigger Panel populates with per-route statutory triggers (ESA Section 7, CWA 404, NHPA 106, NEPA Level), each with a plain-English explanation and timeline estimate; recommended route expanded by default
  6. Sierra Alerts callout appears unprompted with a ⚠️ warning, naming a specific risk and Texas location; no user interaction required to see it
  7. Inline Project Summary phase timeline is accessible on the dashboard without PDF export; timeline estimates are marked illustrative
  8. Hovering any route segment shows an instant popup with the pre-loaded LLM friction justification for that segment
  9. The friction heatmap layer (green=low, red=high) renders client-side from friction_cache.json and can be toggled on and off
**Plans**: 9 plans

Plans:
- [ ] 03-01-PLAN.md — Test scaffolds + npm installs (Wave 0)
- [ ] 03-02-PLAN.md — types.ts extension + Zustand store extension (Wave 1)
- [ ] 03-03-PLAN.md — A* routing engine + POST /api/route (Wave 1)
- [ ] 03-04-PLAN.md — Claude SSE stream + parallel AI endpoints + canned fallback (Wave 1)
- [ ] 03-05-PLAN.md — RouteLayer (LineString + hover popup) + friction heatmap in OverlayLayers (Wave 2)
- [ ] 03-06-PLAN.md — Sidebar state machine + StreamPanel + useReasoningStream hook (Wave 2)
- [ ] 03-07-PLAN.md — SierraRecommends + RadarChartPanel + RouteCards + ResultsPanel (Wave 3)
- [ ] 03-08-PLAN.md — SierraAlerts + EnvTriggerPanel + ProjectSummary (Wave 3)
- [ ] 03-09-PLAN.md — Full test suite + human verification checkpoint (Wave 4)

### Phase 4: PDF Dossier Export
**Goal**: A judge can click "Export PDF Dossier" and receive a professional PDF that captures the entire demo arc — LLM narrative intro, route metrics, Sierra Recommends rationale, environmental trigger summary, project phase timeline, Sierra Alerts risk flag, per-segment justifications, mock contacts, and a map thumbnail
**Depends on**: Phase 3 (route data shape, per-segment justifications, and all agentic panel content)
**Requirements**: PDF-01, PDF-02, PDF-03, PDF-04
**Success Criteria** (what must be TRUE):
  1. "Export PDF Dossier" button is always visible and exports the currently selected route without error
  2. PDF is generated server-side and includes: LLM-generated narrative introduction (2–3 paragraphs), route profile label, distance/cost/permitting metrics, Sierra Recommends rationale, per-route environmental trigger summary, Inline Project Summary phase timeline, Sierra Alerts risk flag, per-segment justifications, mock land parcel owner contacts, and regulatory jurisdictions crossed
  3. PDF contains a map thumbnail captured via Mapbox Static Images API (not html2canvas)
  4. All mock data is clearly labeled as illustrative; PDF is desktop-optimized and judge-presentable
**Plans**: 7 plans

Plans:
- [ ] 04-01-PLAN.md — Server deps + 4 test scaffolds (Wave 0)
- [ ] 04-02-PLAN.md — buildMapboxUrl.ts + mock-contacts.ts + canned-narrative.ts (Wave 1)
- [ ] 04-03-PLAN.md — pdfGenerator.ts + template.ejs — Puppeteer + EJS core (Wave 1)
- [ ] 04-04-PLAN.md — POST /api/narrative + NarrativeByRoute types + Zustand store extension (Wave 1)
- [ ] 04-05-PLAN.md — POST /api/export/pdf endpoint — PDF pipeline integration (Wave 2)
- [ ] 04-06-PLAN.md — useExportPdf hook + TopNav button wiring (Wave 3)
- [ ] 04-07-PLAN.md — Human verification checkpoint (Wave 4)

### Phase 5: Demo Hardening & Polish
**Goal**: Every possible judge interaction — including bad inputs, slow networks, and missing data — results in a graceful recovery, not a crash or blank screen; the app is deployed and ADA-compliant
**Depends on**: Phase 4 (all features complete)
**Requirements**: DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. Dropping a pin outside Texas shows a clear error message and does not crash or produce a blank screen
  2. Any missing or unavailable data (API timeout, missing GeoJSON) shows a graceful fallback — the demo never reaches a dead end
  3. All mock data is visually marked with a small footnote on both the map and PDF
  4. All route colors, overlay colors, and heatmap gradient meet ADA contrast requirements
**Plans**: 4 plans

Plans:
- [ ] 05-01-PLAN.md — Wave 0 test scaffolds: MapCanvas bounds check + footnote, Sidebar error state, WCAG AA contrast assertions
- [ ] 05-02-PLAN.md — MapCanvas: out-of-bounds popup guard (DATA-03) + mock data footnote overlay (DATA-05) (Wave 1)
- [ ] 05-03-PLAN.md — Sidebar error branch + VITE_API_URL prefix + GeoJSON silent skip + blue→red heatmap + legend (DATA-04, DATA-06) (Wave 1)
- [ ] 05-04-PLAN.md — PDF mock data footer + /health endpoint + deploy configs (vercel.json + railway.toml) + human verification (Wave 2)

## Progress

**Execution Order:**
Phase 1 and Phase 2 execute in parallel, then: 1+2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Map Canvas | 5/6 | In Progress|  |
| 2. Offline Data Pipeline & AI Core | 2/4 | In Progress | - |
| 3. Routing Engine & Core Demo Loop | 9/9 | Complete   | 2026-04-18 |
| 4. PDF Dossier Export | 1/7 | In Progress|  |
| 5. Demo Hardening & Polish | 0/4 | Not started | - |
