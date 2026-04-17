# Requirements: Sierra

**Defined:** 2026-04-16
**Core Value:** A planner drops two pins and instantly sees three color-coded transmission routes with AI-explained tradeoffs — no training, no login, no waiting.

## v1 Requirements

### Map & Geospatial UI

- [ ] **MAP-01**: User sees a full-screen Texas map on load with satellite and terrain baselayer options (Mapbox GL JS v3, no login required)
- [ ] **MAP-02**: User can drop a Source pin by clicking the map; label appears and map recenters
- [ ] **MAP-03**: User can drop a Destination pin by clicking the map; label appears and map recenters
- [ ] **MAP-04**: User can toggle ERCOT grid overlay on/off
- [ ] **MAP-05**: User can toggle state/private land boundary overlay on/off
- [ ] **MAP-06**: User can toggle wildlife habitat overlay on/off
- [ ] **MAP-07**: User can toggle topography overlay on/off
- [x] **MAP-08**: All overlay GeoJSON layers are pre-simplified (mapshaper ≤10%) to prevent browser freeze at Texas scale

### Constraints & Controls

- [ ] **CTRL-01**: User can adjust a Cost vs. Risk priority slider that affects route weighting
- [ ] **CTRL-02**: User can toggle Co-Location preference (favor existing infrastructure corridors)
- [ ] **CTRL-03**: User can toggle Eminent Domain avoidance
- [ ] **CTRL-04**: User can toggle Ecology Avoidance (maximize avoidance of habitat/ESA zones)
- [ ] **CTRL-05**: User can select Voltage type from a dropdown

### Routing Engine

- [ ] **ROUTE-01**: User clicks "Run Simulation" and three routes are generated in under 60 seconds
- [ ] **ROUTE-02**: Three simultaneous color-coded routes appear on the map: Route A "Lowest Cost" (blue), Route B "Balanced" (orange), Route C "Lowest Regulatory Risk" (purple)
- [x] **ROUTE-03**: A* or Dijkstra pathfinding runs on a pre-built friction-weighted graph (graph.json); LLM is not in the hot path
- [x] **ROUTE-04**: Friction scores for all graph nodes are pre-computed offline and loaded from friction_cache.json at startup
- [ ] **ROUTE-05**: Constraint slider/toggle values adjust friction weights at route-generation time (not requiring re-LLM-scoring)
- [ ] **ROUTE-06**: ~~A progress animation plays during route generation (5 named stages)~~ — **Superseded by AGENT-01 through AGENT-03**: the simulation moment is now the Agent Reasoning Stream, not a static progress indicator
- [ ] **ROUTE-07**: Graph construction includes a BFS connectivity check (>95% nodes reachable) before any route request is served

### Agent Reasoning Stream

- [ ] **AGENT-01**: On simulation start, a dedicated Agent Reasoning Panel activates immediately — visible sidebar or overlay — streaming real-time narration of constraint evaluation before any routes appear
- [ ] **AGENT-02**: Stream narrates actual constraint layers being evaluated with specific named locations (e.g., "Detected ESA critical habitat in Reeves County", "Found existing 345kV ROW along US-385", "Identified Edwards Aquifer recharge zone in Sutton County")
- [ ] **AGENT-03**: Stream concludes with a brief summary line ("Sierra Recommends: Route C. Preparing justification and risk summary.") before the results panel opens; total stream duration is 20–40 seconds

### AI Friction & RAG

- [ ] **AI-01**: A RAG index is built at startup from PUCT, Texas environmental, NEPA, ESA, CWA Section 404, NHPA Section 106, and wildlife habitat regulation text chunks embedded in-memory (no external vector DB)
- [x] **AI-02**: LLM (Claude) produces a friction score (0–1 float) and one-line justification for each graph node/segment during the offline pre-computation pipeline
- [x] **AI-03**: LLM never generates or modifies coordinates — all geometry comes from the pre-built graph only
- [ ] **AI-04**: Live Claude API calls at route generation time cover: Agent Reasoning Stream narration (streaming), Sierra Recommends 3-sentence rationale, per-route Environmental Trigger Panel summaries, Sierra Alerts content, and per-route segment justifications; all calls run via Promise.all where parallelizable; canned fallback text is available for every call if the API is unavailable

### Friction Heatmap

- [ ] **HEAT-01**: User can toggle the friction heatmap overlay on/off
- [ ] **HEAT-02**: Heatmap renders as a Mapbox GL heatmap layer driven by friction_cache.json (green=low friction, red=high friction)
- [ ] **HEAT-03**: Heatmap renders client-side from a static asset — no server-side tile generation required

### Results Dashboard

- [ ] **DASH-01**: A results dashboard is always visible with one card per route (A, B, C)
- [ ] **DASH-02**: Each card displays: route label/profile, estimated distance, cost, and permitting timeline
- [ ] **DASH-03**: Clicking a dashboard card highlights that route on the map and expands card details
- [ ] **DASH-04**: Clicking a route line on the map focuses the corresponding dashboard card
- [ ] **DASH-05**: Results dashboard includes a radar/spider chart or four-column comparison table showing all three routes scored side-by-side across all four dimensions (cost, permitting timeline, congestion relief value, regulatory risk); visible immediately on route generation — not buried in individual cards

### Sierra Recommends

- [ ] **REC-01**: A highlighted "Sierra Recommends" callout panel appears automatically as the first visible element of the results dashboard after route generation — no user action required
- [ ] **REC-02**: Panel header shows the recommended route (e.g., "Sierra Recommends: Route C — Lowest Regulatory Risk") with an LLM-generated 3-sentence rationale explaining the choice based on the user's constraint settings and the specific corridor's constraints
- [ ] **REC-03**: Recommended route is pre-highlighted on the map when results load; user can override by selecting another route

### Environmental Trigger Panel

- [ ] **ENV-01**: Environmental Trigger Panel appears after route generation, showing per-route statutory trigger list for ESA Section 7, CWA Section 404, NHPA Section 106, and NEPA Level
- [ ] **ENV-02**: Each trigger entry shows: statute name, plain-English explanation, and estimated timeline contribution (e.g., "adds approximately 6–12 months to review"); references real Texas-specific constraint zones (Reeves County habitat, Edwards Aquifer) for credibility
- [ ] **ENV-03**: Recommended route trigger panel is expanded by default; other routes are collapsed

### Sierra Alerts

- [ ] **ALERT-01**: After route generation, Sierra surfaces one prominent "⚠️ Critical Risk Identified" callout — unprompted, specific to the recommended route — flagging the single biggest project-level risk before the user has explored the map
- [ ] **ALERT-02**: Alert content is LLM-generated based on route geometry and mock parcel opposition history data; references real Texas locations by name (e.g., Nolan County landowner opposition clusters)
- [ ] **ALERT-03**: Up to 2 secondary alerts may appear collapsed below the primary alert

### Inline Project Summary

- [ ] **SUMM-01**: A live-generated Inline Project Summary view is accessible on the dashboard (tab or scroll section) for the recommended route — not requiring PDF export
- [ ] **SUMM-02**: Summary includes a phase timeline table with estimated durations and key dependencies for each stage: Desktop Screening, Environmental Review, ROW Acquisition, State Permitting, Construction, and Total Estimated Timeline
- [ ] **SUMM-03**: Timeline estimates are flagged as illustrative/mock in small print; summary content feeds directly into the PDF dossier export

### Hover Justifications

- [ ] **HOVER-01**: Hovering any route segment on the map shows a popup with the LLM-generated friction justification for that segment
- [ ] **HOVER-02**: Justification text is pre-loaded (not fetched live on hover) to ensure instant popup response

### PDF Dossier Export

- [ ] **PDF-01**: "Export PDF Dossier" button is always visible; exports the currently selected route
- [ ] **PDF-02**: PDF is generated server-side (not client-side) to avoid WebGL canvas capture limitations
- [ ] **PDF-03**: PDF includes: LLM-generated narrative introduction (2–3 paragraphs telling the story of why this route was chosen), route profile label, key metrics (distance, cost, permitting time), Sierra Recommends rationale, per-route environmental trigger summary, Inline Project Summary phase timeline, Sierra Alerts risk flag, per-segment LLM justifications, mock land parcel owner contact list, regulatory jurisdictions/zones crossed
- [ ] **PDF-04**: PDF map thumbnail is captured via Mapbox Static Images API (not html2canvas)

### Data & Reliability

- [x] **DATA-01**: All geospatial layers use static/mock GeoJSON and datasets — no live regulatory API calls
- [x] **DATA-02**: A shared types.ts data contract defines all data shapes consumed by map, dashboard, and PDF components: route result (geometry, scores, segment justifications), RouteRecommendation (recommended route ID + rationale), EnvironmentalTrigger (per-route statute list with timeline estimates), SierraAlert (primary + secondary alerts), and ProjectSummary (phase timeline rows)
- [ ] **DATA-03**: Out-of-bounds pin placement shows a graceful error state (not a crash or blank screen)
- [ ] **DATA-04**: Missing or unavailable data shows a graceful fallback — no dead ends during demo
- [ ] **DATA-05**: All mock data is visually marked as such (small footnote on map and PDF)
- [ ] **DATA-06**: ADA-compliant color/contrast for all route colors, overlays, and heatmap

## v2 Requirements

### Extended Routing

- **EXT-01**: Live recalculation as constraint sliders are adjusted (real-time routing)
- **EXT-02**: Multi-state / nationwide routing beyond ERCOT
- **EXT-03**: Side-by-side route comparison dashboard

### Data & Integration

- **INT-01**: Live ingestion of Texas regulatory/parcel data
- **INT-02**: Real land parcel owner discovery and county contact data
- **INT-03**: Financial projections beyond baseline construction cost estimates

### Platform

- **PLT-01**: User authentication and saved projects
- **PLT-02**: Mobile-optimized layout

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live regulatory/parcel API ingestion | Hackathon speed; eliminates rate limit risk and data freshness complexity |
| Real owner contact discovery | Mock contacts sufficient for demo; real lookup requires paid APIs |
| Nationwide/multi-state routing | ERCOT/Texas only per PRD scope |
| Power-flow simulation (PSS/E style) | Electrical simulation assumes routing is done; out of Sierra's domain |
| User login/authentication | Judges must reach full demo without friction |
| Mobile layout | Desktop-first; hackathon time constraint |
| Real-time slider recalculation | Constraint weights applied at generation time; re-run required for full re-route |
| Multi-user editing | Single-session demo tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAP-01 | Phase 1 | Pending |
| MAP-02 | Phase 1 | Pending |
| MAP-03 | Phase 1 | Pending |
| MAP-04 | Phase 1 | Pending |
| MAP-05 | Phase 1 | Pending |
| MAP-06 | Phase 1 | Pending |
| MAP-07 | Phase 1 | Pending |
| MAP-08 | Phase 1 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| CTRL-01 | Phase 1 | Pending |
| CTRL-02 | Phase 1 | Pending |
| CTRL-03 | Phase 1 | Pending |
| CTRL-04 | Phase 1 | Pending |
| CTRL-05 | Phase 1 | Pending |
| AI-01 | Phase 2 | Pending |
| AI-02 | Phase 2 | Complete |
| AI-03 | Phase 2 | Complete |
| ROUTE-03 | Phase 2 | Complete |
| ROUTE-04 | Phase 2 | Complete |
| ROUTE-07 | Phase 2 | Pending |
| ROUTE-01 | Phase 3 | Pending |
| ROUTE-02 | Phase 3 | Pending |
| ROUTE-05 | Phase 3 | Pending |
| ROUTE-06 | Phase 3 | Superseded by AGENT-01–03 |
| AI-04 | Phase 3 | Pending |
| AGENT-01 | Phase 3 | Pending |
| AGENT-02 | Phase 3 | Pending |
| AGENT-03 | Phase 3 | Pending |
| HEAT-01 | Phase 3 | Pending |
| HEAT-02 | Phase 3 | Pending |
| HEAT-03 | Phase 3 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| DASH-04 | Phase 3 | Pending |
| DASH-05 | Phase 3 | Pending |
| REC-01 | Phase 3 | Pending |
| REC-02 | Phase 3 | Pending |
| REC-03 | Phase 3 | Pending |
| ENV-01 | Phase 3 | Pending |
| ENV-02 | Phase 3 | Pending |
| ENV-03 | Phase 3 | Pending |
| ALERT-01 | Phase 3 | Pending |
| ALERT-02 | Phase 3 | Pending |
| ALERT-03 | Phase 3 | Pending |
| SUMM-01 | Phase 3 | Pending |
| SUMM-02 | Phase 3 | Pending |
| SUMM-03 | Phase 3 | Pending |
| HOVER-01 | Phase 3 | Pending |
| HOVER-02 | Phase 3 | Pending |
| PDF-01 | Phase 4 | Pending |
| PDF-02 | Phase 4 | Pending |
| PDF-03 | Phase 4 | Pending |
| PDF-04 | Phase 4 | Pending |
| DATA-03 | Phase 5 | Pending |
| DATA-04 | Phase 5 | Pending |
| DATA-05 | Phase 5 | Pending |
| DATA-06 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 59 total (MAP:8, CTRL:5, ROUTE:7, AI:4, AGENT:3, HEAT:3, DASH:5, REC:3, ENV:3, ALERT:3, SUMM:3, HOVER:2, PDF:4, DATA:6)
- Mapped to phases: 59
- Unmapped: 0 ✓
- Note: ROUTE-06 superseded by AGENT-01–03 (progress animation replaced by Agent Reasoning Stream per updated PRD)

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 — updated from sierra_prd.docx: added AGENT, REC, ENV, ALERT, SUMM requirement groups; expanded DASH-05, PDF-03, DATA-02, AI-01, AI-04; ROUTE-06 superseded*
