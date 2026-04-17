---
phase: 01-foundation-map-canvas
plan: 04
subsystem: ui
tags: [mapbox-gl, react-map-gl, geojson, zustand, mapbox]

requires:
  - phase: 01-02
    provides: useAppStore with sourcePin/destinationPin/overlays state and all action functions
  - phase: 01-03
    provides: public/data/*.geojson files for four overlay layers

provides:
  - Full-screen Mapbox GL Map (100vw x 100vh) with satellite-streets-v12 default and terrain switcher
  - Click-to-place pin placement (source then destination sequence, fitBounds on second pin)
  - PinMarkers with CSS keyframe pulse animation using design system colors
  - OverlayLayers with 4 GeoJSON source/layer pairs (visibility-toggled, Sources never unmounted)
  - MapControls glassmorphism floating panel with NavigationControl, recenter, baselayer switcher
  - mapStyle/setMapStyle added to useAppStore (UI-only state, not in AppState types.ts)

affects: [01-05, 01-06]

tech-stack:
  added: ["@testing-library/dom", "@testing-library/user-event"]
  patterns: [react-map-gl-v8-mapbox-import, visibility-toggle-not-unmount, fitbounds-with-sidebar-padding, geojson-url-from-public-dir]

key-files:
  created:
    - src/components/MapCanvas/MapCanvas.tsx
    - src/components/MapCanvas/PinMarkers.tsx
    - src/components/MapCanvas/PinMarkers.css
    - src/components/MapCanvas/MapControls.tsx
    - src/components/MapCanvas/OverlayLayers.tsx
    - src/declarations.d.ts
  modified:
    - src/store/useAppStore.ts
    - src/components/MapCanvas/MapCanvas.test.tsx
    - package.json

key-decisions:
  - "GeoJSON layers loaded by URL string (/data/*.geojson) not ES module import — files in public/ can't be imported as modules in Vite, Source data prop accepts URL strings natively"
  - "mapStyle stored in AppStore (not AppState types.ts) — UI-only state that should not be serialized or shared with server"
  - "MapCanvas tests verify store interactions only — WebGL is not available in jsdom, visual render is manual smoke test"
  - "@testing-library/dom and @testing-library/user-event installed as missing deps needed by Sidebar tests"

patterns-established:
  - "Overlay layer visibility: always keep Source mounted, toggle Layer layout.visibility between 'visible'/'none'"
  - "react-map-gl v8 import path is 'react-map-gl/mapbox' not 'react-map-gl'"
  - "GeoJSON type declarations in src/declarations.d.ts using declare module '*.geojson'"
  - "fitBounds with setPadding({left: 336}) to offset sidebar width after pin placement"

requirements-completed: [MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07]

duration: 12min
completed: 2026-04-17
---

# Phase 1 Plan 4: Map Canvas Summary

**Full-screen Mapbox GL map with click-to-place pins, four toggleable GeoJSON overlay layers, CSS pulse-animated markers, and a glassmorphism controls panel.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-17T19:28:00Z
- **Completed:** 2026-04-17T19:40:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- MapCanvas.tsx renders full-screen with satellite-streets-v12 default, click handler sets source/destination pins sequentially with fitBounds on second pin drop
- OverlayLayers.tsx implements all 4 GeoJSON overlays (ercot grid, land boundary, wildlife habitat, topography) — Sources permanently mounted, only Layer visibility toggled
- PinMarkers.tsx uses CSS keyframe animations for pin-drop and pulse-ring effects in design system colors (#A7C8FF background, #003061 icon)
- MapControls.tsx glassmorphism panel with NavigationControl, recenter button, and Satellite/Terrain baselayer switcher
- 4 store-interaction tests pass; full test suite 26/26 green

## Task Commits

Each task was committed atomically:

1. **Task 1: Build MapCanvas.tsx and PinMarkers.tsx** - `546bc0e` (feat)
2. **Task 2: Build OverlayLayers.tsx with all four GeoJSON layers** - `ead1450` (feat)

## Files Created/Modified
- `src/components/MapCanvas/MapCanvas.tsx` - Full-screen Map with click handler, mapStyle, pin placement, fitBounds
- `src/components/MapCanvas/PinMarkers.tsx` - Source/Destination Marker components reading from useAppStore
- `src/components/MapCanvas/PinMarkers.css` - CSS keyframes: pin-drop scale animation + pulse-ring expand animation
- `src/components/MapCanvas/MapControls.tsx` - Glassmorphism floating panel with NavigationControl + baselayer switcher
- `src/components/MapCanvas/OverlayLayers.tsx` - Four GeoJSON Source+Layer pairs with visibility toggling
- `src/declarations.d.ts` - TypeScript module declaration for *.geojson imports
- `src/store/useAppStore.ts` - Added mapStyle (string) and setMapStyle action
- `src/components/MapCanvas/MapCanvas.test.tsx` - 4 store-interaction tests replacing todo placeholders
- `package.json` - Added @testing-library/dom + @testing-library/user-event (were missing)

## Decisions Made
- GeoJSON layers use URL strings (`/data/*.geojson`) not ES module imports — Vite `public/` dir is served as static at root path, and Source `data` prop natively accepts URL strings
- `mapStyle` lives in `AppStore` interface only (not `AppState` in types.ts) since it's pure UI state not needed by the server or type consumers
- Tests validate store behavior only due to jsdom lacking WebGL — confirmed with plan notes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @testing-library/dom and @testing-library/user-event**
- **Found during:** Task 2 verification (running full test suite)
- **Issue:** Sidebar tests (from plan 01-05) were failing with "Cannot find module '@testing-library/dom'" — missing dependency prevented clean test suite
- **Fix:** `npm install @testing-library/dom @testing-library/user-event --save-dev`
- **Files modified:** package.json, package-lock.json
- **Verification:** Full test suite 26/26 passed after install
- **Committed in:** 546bc0e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for full test suite to pass. No scope creep.

## Issues Encountered
- GeoJSON files are in `public/data/` — cannot be imported as ES modules in Vite. Used URL string references (`/data/*.geojson`) in Source `data` prop instead of the import-based approach shown in the plan. This is actually the correct Vite pattern and simpler.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MapCanvas is complete and ready to be wired into App.tsx (Plan 01-06)
- All four overlay toggle state keys (ercotGrid, landBoundary, wildlifeHabitat, topography) drive Layer visibility
- mapStyle in store is ready for Sidebar baselayer switcher to call setMapStyle
- Sidebar components (Plan 01-05) can import MapCanvas directly

---
*Phase: 01-foundation-map-canvas*
*Completed: 2026-04-17*
