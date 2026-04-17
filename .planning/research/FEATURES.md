# Feature Landscape

**Domain:** AI-assisted transmission line routing platform (hackathon MVP)
**Researched:** 2026-04-16
**Confidence:** MEDIUM — training-data based; web search unavailable. Real-tool feature lists sourced from knowledge of Esri Network Analyst, PowerGEM TARA, PSS/E, PSCAD, and transmission consultant RFP literature through August 2025.

---

## What Real Tools Do (Baseline)

Understanding what professional tools do frames what "table stakes" means for judges who know the space.

**Esri ArcGIS Network Analyst / Utility Network**
- Suitability analysis using weighted raster layers (terrain, land cover, ownership, environmental constraints)
- Least-cost path analysis over friction surfaces
- Parcel-level ownership lookup and ROW width estimation
- Integration with SCADA and GIS asset databases
- No AI-generated narrative; outputs are geometry + attribute tables
- Requires weeks of data prep and GIS expertise to run

**PowerGEM TARA / PSS/E / PSCAD**
- Power-flow and transient-stability simulation (not routing)
- Load-flow studies to validate a proposed route's electrical feasibility
- Fault analysis, contingency screening (N-1, N-2)
- No spatial routing engine — assumes route is already chosen
- Outputs: MW capacity, voltage profiles, stability margins

**Transmission planning consultants (e.g., Burns & McDonnell, Quanta)**
- Multi-year environmental impact studies (NEPA)
- Permitting with PUCT (Texas), FAA, Army Corps of Engineers
- Stakeholder consultation, landowner negotiations
- Produce 200+ page route study reports with 5-10 alternative corridors
- Timeline: 3-7 years from concept to construction

**Gap Sierra fills:** None of these tools produce instant, AI-explained, multi-route comparisons in a browser. Judges from the energy space will recognize this gap immediately.

---

## Table Stakes

Features without which the demo fails to impress or feels like a toy. These must work 100% reliably.

| Feature | Why Expected | Complexity | Hours Estimate | Notes |
|---------|--------------|------------|----------------|-------|
| Interactive Texas map, full-screen | Any routing tool must show the geography | Low | 2-4h | Mapbox GL JS or Google Maps; use pre-cached tiles |
| Pin drop for source + destination | Core UX — how user defines the problem | Low | 2-3h | Click-to-place with draggable pins |
| Three simultaneous color-coded routes on map | Core deliverable; judges expect to see alternatives | High | 8-12h | Depends on pathfinding + LLM pipeline; critical path |
| Route labels / profile names visible | "Lowest Cost / Balanced / Lowest Risk" must be scannable | Low | 1h | Legend + line label |
| Per-route summary stats card | Distance, cost estimate, permitting timeline — real planners always need these | Medium | 3-5h | Static card component fed by route metadata |
| Hover popup on route segments | Context on why a segment was chosen — this is what sets AI apart | Medium | 3-5h | Mapbox feature hover event + LLM text pre-loaded |
| Friction heatmap overlay | Visually demonstrates the AI reasoning layer | Medium | 4-6h | Pre-computed GeoJSON grid; color ramp green→red |
| Loading/progress animation during route gen | Without it, silent <1 min wait feels broken | Low | 1-2h | Animated spinner or step-by-step progress indicator |
| Graceful error state | If LLM times out or route fails, demo must not crash | Low | 1-2h | Fallback pre-computed route; never show raw error to judges |
| ERCOT grid overlay toggle | Legitimizes the tool — shows existing infrastructure context | Low | 2-3h | Static GeoJSON of ERCOT transmission lines (public data) |

**Table stakes total estimate:** ~27-43 hours. This is the critical path. Everything else is additive.

---

## Differentiators

Features that create "wow" moments for judges. Not expected from a 48-hour build, but they elevate the demo from "interesting prototype" to "fundable product."

| Feature | Value Proposition | Complexity | Hours Estimate | Dependencies | Notes |
|---------|-------------------|------------|----------------|--------------|-------|
| AI-generated natural language justifications per segment | No existing tool does this — transforms opaque geometry into explainable decisions | High | 6-10h | RAG pipeline, LLM integration, route segments | Pre-generate for demo path; don't re-run live |
| Cost vs. Risk constraint slider | Lets the judge interact and see routes shift — live demo moment | Medium | 4-6h | Route gen pipeline must accept weight params | Can be faked with pre-computed route variants |
| PDF dossier export | Professional artifact judges can take away; signals production intent | Medium | 5-8h | Route data, LLM narrative, mock contacts | Use pdf-lib or puppeteer; pre-fill templates |
| Eminent domain toggle | Directly references real regulatory pain point — signals domain expertise | Low | 2-3h | Friction scoring must penalize private parcels | Boolean flag that re-weights graph edges |
| Ecology avoidance toggle | NEPA/ESA compliance is a real bottleneck — judges in energy space know this | Low | 2-3h | Habitat layer GeoJSON in friction graph | Toggle habitat penalty weight |
| Co-location toggle (follow existing ROW) | Reduces permitting timeline by years — sophisticated planners care about this | Low | 2-3h | Existing ERCOT lines GeoJSON as friction bonus | Bonus weight for cells adjacent to existing lines |
| Regulatory zone overlay (PUCT, wildlife, land) | Shows the constraint landscape judges expect planners to manage | Medium | 4-6h | Static GeoJSON layers; toggle UI | Pre-process all layers into unified GeoJSON |
| RAG over real regulation text | "We trained on actual PUCT and NEPA rules" is credible and impressive | High | 8-12h | Vector store setup, chunking, embedding | Use pre-built index; don't build live |
| Voltage class dropdown | Signals understanding of transmission engineering (69kV vs 138kV vs 345kV vs 500kV) | Low | 1-2h | Affects cost estimate formula only for MVP | Cosmetic in MVP; affects card metadata |
| Mock landowner contacts per segment | Makes the output feel like a real planning dossier | Low | 2-3h | Route segment data; static lookup table | Entirely mock — no real data needed |

**Differentiator priority order for 48h:** Justifications > PDF export > Sliders/Toggles > RAG > Overlays > Mock contacts

---

## Anti-Features

Things to deliberately NOT build in 48 hours. Each of these is a time sink that adds no demo value.

| Anti-Feature | Why Avoid | Time Sink Risk | What to Do Instead |
|--------------|-----------|----------------|--------------------|
| Live regulatory data API ingestion | PUCT, NERC, EPA APIs are complex, rate-limited, and fragile | 8-20h of plumbing | Pre-process static GeoJSON snapshots; label as "data as of [date]" |
| Real parcel ownership lookup | County appraisal district APIs are inconsistent; Texas has 254 counties | 10-40h data wrangling | Mock ownership table with realistic-looking entries |
| Power-flow / load-flow simulation | PSS/E-level analysis requires electrical engineering domain depth | Not achievable in 48h | Note it as "Phase 2 integration" in the PDF dossier |
| User authentication / accounts | Adds auth plumbing with zero demo value | 4-8h | No login; judges must reach full demo instantly |
| Mobile layout | Transmission planners use desktops; judges will demo on laptop | 4-8h responsive CSS | Desktop-first; add a "best viewed on desktop" note |
| Real-time route recalculation on every slider move | LLM pipeline is too slow for real-time response | Latency/cost risk | Pre-compute 3-5 route variants; switch between them on slider snap |
| Nationwide or multi-state routing | Data surface area explodes; ERCOT is self-contained and well-documented | Infinite scope expansion | Explicitly scope to Texas/ERCOT; judges respect focused demos |
| Historical load data integration | Adds data pipeline complexity with no visual payoff | 6-12h | Use static reference values in cost formula |
| Drag-to-reshape route | Route editing UX is complex and fragile | 6-10h | Routes are read-only; user re-runs with different constraints |
| Multiple export formats (KML, Shapefile, DXF) | GIS export is an integration task, not a demo moment | 4-8h | PDF only; mention others as "planned formats" |
| Collaborative multi-user editing | Real-time sync adds infrastructure complexity | 16-30h | Single-user session; no state persistence needed |

---

## Feature Dependencies

```
Pin drop (source + destination)
  → Route generation pipeline
      → Pathfinding (A*/Dijkstra on friction graph)
          → Friction heatmap layer (pre-computed)
              → Constraint toggles (eminent domain, ecology, co-location)
              → Cost vs. risk slider (re-weights graph edges)
          → RAG pipeline (regulatory hotspot lookup)
              → LLM justification generation (per segment)
                  → Hover popup content
                  → PDF dossier narrative
      → Per-route summary cards (distance, cost, permitting timeline)
      → Color-coded route lines on map

Map overlays (ERCOT grid, land, habitat, regulatory zones)
  → Independent of routing pipeline; parallel build track

PDF export
  → Depends on: route data, summary cards, LLM justifications, mock contacts
  → Can be templated and filled post-routing

Progress animation
  → Depends on: route generation pipeline having discrete steps to report

Error states
  → Depends on: every feature having a pre-computed fallback
```

**Critical path:** Pin drop → Friction graph → Pathfinding → Three route lines on map. Everything else builds on or beside this.

**Parallel build tracks for a 2-3 person team:**
- Track A (backend/data): Friction graph construction, pathfinding, RAG pipeline, LLM calls
- Track B (frontend/GIS): Map setup, pin drop, overlays, route rendering, UI components
- Track C (PM/design): PDF template, summary card data schema, constraint UI, mock data prep

Tracks A and B can run in parallel until the route generation API is ready, at which point Track B consumes it.

---

## MVP Recommendation

**Scope v1 (ship at hour 36, spend last 12h on polish and error states):**

1. Full-screen Texas map with pin drop
2. Three color-coded routes (pre-computed for the demo corridor; live generation as stretch)
3. Friction heatmap overlay
4. Per-route summary cards (distance, cost, permitting estimate)
5. Segment hover popups with LLM justifications (pre-generated for demo path)
6. ERCOT grid overlay toggle
7. Cost vs. risk slider (switches between pre-computed route variants)
8. Eminent domain + ecology toggles (re-weight and re-route, or switch pre-computed variants)
9. Progress animation
10. Graceful error states with pre-computed fallback routes

**Scope v1 stretch (add if ahead of schedule at hour 36):**
- PDF dossier export
- Co-location toggle
- Regulatory zone overlay
- Voltage dropdown

**Defer to post-hackathon:**
- RAG pipeline running live (pre-build the index; show it works but don't re-index live)
- Mock landowner contacts in PDF
- Real pathfinding on full Texas grid (demo on a realistic but pre-defined corridor)

---

## What Hackathon Judges in Energy/Grid Space Look For

Based on patterns from DOE Grid Innovation competitions, ARPA-E demo days, and utility-sponsored hackathons (MEDIUM confidence — training data through Aug 2025):

1. **Domain credibility signals** — Does the team know what PUCT is? What NEPA means? What a 345kV line costs per mile? Sierra's toggles and RAG cite real regulatory bodies. This matters more than technical polish.

2. **Visual immediacy** — Judges have 3-5 minutes per team. The map must load, routes must appear, and the "aha moment" must happen in under 90 seconds. The three-route comparison with a slider is exactly this.

3. **Explainability** — Black-box AI output is a liability in regulated industries. The hover justifications directly address this. Judges will test: "why did it route through here?" The LLM answer must be coherent.

4. **Realistic scope awareness** — Judges respect teams that know what they're NOT building. The "Phase 2: power-flow integration" mention in the PDF signals maturity.

5. **Export artifact** — A PDF dossier a judge can open after the demo extends the impression past the presentation window. It also signals the team understands that real planning produces deliverables, not just visualizations.

6. **Performance** — A <1 minute generation time is credible for a demo. Any longer and judges will fill silence with doubt.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Real tool capabilities (Esri, PSS/E, PSCAD) | MEDIUM | Training data through Aug 2025; no live verification possible |
| ERCOT planning process | MEDIUM | Well-documented public process; unlikely to have changed materially |
| Hackathon judge priorities | LOW-MEDIUM | Inferred from patterns in energy innovation competitions; not verified against this specific hackathon's judging rubric |
| Feature complexity estimates | MEDIUM | Based on similar geospatial + LLM projects; actual times vary by team experience |
| Feature dependencies | HIGH | These are logical/technical dependencies, not empirical claims |

---

## Sources

- Esri ArcGIS Network Analyst and Utility Network documentation (training data, architecture known through Aug 2025)
- ERCOT Transmission Planning Guide (public, training data)
- PUCT Substantive Rules Chapter 25 (transmission siting in Texas, training data)
- PSS/E, PowerGEM TARA, PSCAD product documentation (training data)
- Burns & McDonnell, Quanta Services transmission route study methodology (training data, RFP literature)
- DOE Grid Modernization Initiative hackathon rubrics (training data through Aug 2025)
- Note: WebSearch and WebFetch were unavailable for this research session. All findings are training-data sourced. Flag LOW-confidence items for verification before committing to roadmap.
