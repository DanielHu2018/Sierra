---
phase: 03-routing-engine-core-demo-loop
plan: 05
subsystem: ui
tags: [react-map-gl, mapbox, heatmap, geojson, zustand, hover-popup, route-visualization]

# Dependency graph
requires:
  - phase: 03-routing-engine-core-demo-loop
    provides: Zustand store with routes[], selectedRoute, frictionCache; RouteResult/FrictionCache types
  - phase: 02-offline-data-pipeline-ai-core
    provides: friction_cache.json static file in public/data/

provides:
  - RouteLayer.tsx — three color-coded LineString layers (A/B/C) with click-to-select and hover-for-justification
  - HoverPopup.tsx — glassmorphism popup showing friction score bar and segment justification text
  - OverlayLayers.tsx — friction heatmap layer loaded once at startup from friction_cache.json
  - MapCanvas.tsx — interactiveLayerIds wired to route line layer IDs

affects:
  - 03-06 (UI panels and controls referencing route selection/heatmap toggle)
  - 04-export (any export snapshot that includes the map canvas)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD with react-map-gl mocks (Source/Layer mocked as div wrappers with data-testid)
    - Friction heatmap loaded once at mount via useEffect fetch, stored in local component state
    - interactiveLayerIds prop on Map enables react-map-gl click/mousemove events on route layers
    - Hover justification resolved from segmentJustifications array (no fetch on hover)

key-files:
  created:
    - src/components/ui/HoverPopup.tsx
    - src/components/MapCanvas/RouteLayer.tsx
    - src/components/MapCanvas/OverlayLayers.test.tsx
  modified:
    - src/components/MapCanvas/OverlayLayers.tsx
    - src/components/MapCanvas/MapCanvas.tsx
    - src/components/MapCanvas/RouteLayer.test.tsx

key-decisions:
  - "HoverPopup uses inline styles (not Tailwind classes) for glassmorphism backdrop-filter — avoids Tailwind v4 purge risk on dynamic values"
  - "heatmapGeoJSON stored in local OverlayLayers state (not Zustand) — it is map-layer-local data; frictionCache (raw nodes) stored in Zustand for cross-component access"
  - "fireEvent.mouseMove/mouseLeave used in tests (not dispatchEvent) — React synthetic events fire onMouseMove prop in mock Layer"

patterns-established:
  - "react-map-gl Source/Layer mocked as plain div wrappers with data-testid for unit testing"
  - "Hover data resolved from pre-loaded Zustand store, never fetched on user interaction"

requirements-completed: [HEAT-01, HEAT-02, HEAT-03, HOVER-01, HOVER-02]

# Metrics
duration: 12min
completed: 2026-04-18
---

# Phase 03 Plan 05: Map Layer Rendering Summary

**Three color-coded route LineString layers with click-to-select and hover justification popup, plus friction heatmap toggled from friction_cache.json loaded once at app startup**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-18T01:29:00Z
- **Completed:** 2026-04-18T01:41:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- RouteLayer.tsx renders one react-map-gl Source+Layer per route with correct colors (#A7C8FF / #FFBC7C / #E8B3FF), line width (4px selected / 2px), and opacity (0.35 for deselected)
- HoverPopup.tsx displays glassmorphism card with friction score progress bar (green/yellow/red) and justification text from pre-loaded segmentJustifications
- OverlayLayers.tsx fetches friction_cache.json once at mount, converts to GeoJSON FeatureCollection, renders heatmap with green-to-red gradient toggled by overlays.frictionHeatmap
- MapCanvas.tsx wired with interactiveLayerIds so react-map-gl fires click/hover events on route lines
- 10 new tests pass (6 RouteLayer + 4 OverlayLayers); full suite 55/55 passing; tsc --noEmit clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Create HoverPopup component and RouteLayer with click/hover** - `c790c70` (feat)
2. **Task 2: Add friction heatmap layer to OverlayLayers and load frictionCache at startup** - `13d95c2` (feat)

## Files Created/Modified
- `src/components/ui/HoverPopup.tsx` — glassmorphism popup, friction score bar, justification paragraph
- `src/components/MapCanvas/RouteLayer.tsx` — Source+Layer per route, hover/click handlers, HoverPopup render
- `src/components/MapCanvas/RouteLayer.test.tsx` — 6 tests: null renders, layer presence, click, hover show/hide, no-fetch assertion
- `src/components/MapCanvas/OverlayLayers.tsx` — added useEffect fetch, heatmapGeoJSON state, heatmap Source+Layer
- `src/components/MapCanvas/OverlayLayers.test.tsx` — 4 tests: fetch on mount, silent fail, source render, visibility toggle
- `src/components/MapCanvas/MapCanvas.tsx` — added RouteLayer import/render, interactiveLayerIds prop, routes selector

## Decisions Made
- HoverPopup uses inline styles for glassmorphism backdrop-filter (not Tailwind classes) — consistent with existing design token inline style pattern from Phase 1
- heatmapGeoJSON stored in local OverlayLayers state (not Zustand) — map-layer-local data; raw FrictionCache nodes stored in Zustand for cross-component justification access
- fireEvent (not dispatchEvent) used in tests — React synthetic events fire through the mock Layer's onMouseMove prop correctly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial RouteLayer tests used `dispatchEvent(new MouseEvent('mousemove'))` which doesn't trigger React synthetic `onMouseMove` prop — corrected to `fireEvent.mouseMove()` from @testing-library/react (Rule 1 auto-fix, inline during GREEN phase)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Route map layers fully functional: three colored lines appear after simulation, hover shows popup, click selects route in Zustand
- Friction heatmap toggleable once friction_cache.json is present in public/data/
- Ready for Phase 03-06 (UI polish, sidebar route cards, result panels)

---
*Phase: 03-routing-engine-core-demo-loop*
*Completed: 2026-04-18*
