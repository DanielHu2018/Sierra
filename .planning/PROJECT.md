# Sierra

## What This Is

Sierra is a web-based, map-driven AI platform that radically shortens high-voltage transmission line planning from years to minutes. It generates three optimized, legally-aware routing blueprints between user-selected source and destination nodes on the Texas (ERCOT) grid, visualized simultaneously on an interactive map with AI-generated friction heatmaps and natural-language justifications for each routing decision.

## Core Value

A planner drops two pins and instantly sees three color-coded transmission routes with AI-explained tradeoffs — no training, no login, no waiting.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Full-screen interactive Texas map with pin drop for source and destination
- [ ] Three simultaneous color-coded AI-generated routes (Lowest Cost / Balanced / Lowest Regulatory Risk)
- [ ] Constraint controls: cost-vs-risk slider, co-location toggle, eminent domain toggle, ecology avoidance toggle, voltage dropdown
- [ ] Toggleable overlays: ERCOT grid, state/private land, wildlife habitats, topography, friction heatmap
- [ ] Friction heatmap layer (green=low, red=high) driven by LLM friction scoring
- [ ] Route segment hover popups with LLM-generated justifications
- [ ] Results dashboard cards per route (distance, cost, permitting timeline)
- [ ] PDF dossier export with LLM narrative, per-segment justifications, mock owner contacts, regulatory zones
- [ ] RAG vector store with PUCT/Texas environmental/NEPA/habitat regulations
- [ ] A*/Dijkstra pathfinding on friction-scored graph
- [ ] Progress animation during route generation (<1 min target)
- [ ] ADA-compliant color/contrast; graceful error states

### Out of Scope

- Real-time or live regulatory/parcel data ingestion — static/mock data only for hackathon speed
- Nationwide (multi-state) routing — ERCOT/Texas only
- User login or authentication — no login required
- Real owner contact discovery — mock contacts only
- Financial projections beyond baseline construction cost estimates
- Mobile-optimized layout — desktop-first
- Side-by-side route dashboards — map + cards serve this purpose

## Context

- **Hackathon project**: 48-hour build, 2-3 team members (full-stack/GIS dev, backend/data engineer, PM/designer)
- **Target audience for demo**: Hackathon judges — must be visually impressive with zero dead ends
- **Data strategy**: All geospatial layers (parcels, terrain, grid, habitats, regulations) are pre-processed static GeoJSON and mock datasets
- **AI core**: RAG over regulation text (PUCT, Texas environmental, NEPA, habitat) + Claude API for friction scoring and route justifications
- **Pathfinding**: A* or Dijkstra on LLM-scored friction graph; RAG+LLM run only on regulatory hotspots for speed
- **Map platform**: Mapbox or Google Maps with pre-cached tiles
- **PDF export**: Takes selected route + dashboard metrics + per-segment LLM justifications + mock contacts
- Heavy use of Claude Code for LLM, PDF, and UI scaffold

## Constraints

- **Timeline**: 48-hour hackathon build — prioritize demo reliability over production stability
- **Data**: Static/mock GeoJSON only — no live API calls to regulatory databases
- **Performance**: Route generation target <1 minute end-to-end including RAG+LLM calls
- **Geography**: Texas/ERCOT only
- **Team size**: 2-3 people — scope must be achievable in parallel
- **Demo reliability**: 100% required — every judged feature must function without dead ends

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static/mock data only | Hackathon speed; eliminates live API complexity and rate limit risk | — Pending |
| RAG+LLM only on hotspots | Performance constraint — full LLM scoring of every node would exceed <1 min target | — Pending |
| Three fixed route profiles | Clear differentiation for judges; matches real-world planning tradeoffs | — Pending |
| No login required | Judges must reach full demo without friction | — Pending |
| Claude API for LLM | Team uses Claude Code; Anthropic SDK already familiar | — Pending |

---
*Last updated: 2026-04-16 after initialization*
