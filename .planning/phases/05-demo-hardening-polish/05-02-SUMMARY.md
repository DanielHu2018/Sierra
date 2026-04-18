---
phase: 05-demo-hardening-polish
plan: 02
subsystem: ui
tags: [react-map-gl, mapbox, zustand, vitest, testing-library]

# Dependency graph
requires:
  - phase: 05-01
    provides: Wave-0 failing test scaffolds for MapCanvas (DATA-03, DATA-05)
provides:
  - ERCOT bounding box validation with auto-dismissing glassmorphism OOB popup
  - Persistent mock data footnote overlay anchored bottom-left of map canvas
  - All MapCanvas.test.tsx DATA-03 and DATA-05 tests green
affects: [05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ERCOT bounds constant at module scope (not inside component) for stable reference
    - oobPopup state drives conditional Popup render — null = hidden, object = shown at coords
    - setTimeout 3000ms auto-dismiss + early return guard prevents Zustand state mutation on OOB
    - Footnote as absolute-positioned DOM child of Map (not GL layer) — correct pattern for static text overlays
    - Popup mock added to vi.mock return for react-map-gl/mapbox — required for asserting popup child text

key-files:
  created: []
  modified:
    - src/components/MapCanvas/MapCanvas.tsx
    - src/components/MapCanvas/MapCanvas.test.tsx

key-decisions:
  - "Popup added to react-map-gl/mapbox vi.mock return so Test B can assert rendered text — Rule 3 auto-fix (test was blocking)"
  - "Both Task 1 (OOB guard) and Task 2 (footnote) committed together — single atomic change to same file, both green simultaneously"

patterns-established:
  - "react-map-gl/mapbox mock must include all named exports used by component under test — add Popup alongside Source/Layer/Marker"

requirements-completed: [DATA-03, DATA-05]

# Metrics
duration: 5min
completed: 2026-04-18
---

# Phase 5 Plan 02: ERCOT Bounds Guard + Mock Data Footnote Summary

**ERCOT bounding-box click guard with glassmorphism auto-dismiss popup and persistent mock data footnote overlay in MapCanvas**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-18T03:12:00Z
- **Completed:** 2026-04-18T03:17:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Out-of-bounds clicks (outside ERCOT bbox) now show a glassmorphism popup and return early — Zustand pin state untouched
- Popup auto-dismisses after 3000ms via setTimeout; uses react-map-gl Popup anchored at click coordinates
- Persistent footnote "Illustrative mock data — for demonstration purposes only." rendered bottom-left above Mapbox attribution bar
- All 8 MapCanvas tests pass (4 existing + 3 DATA-03 + 1 DATA-05); TypeScript clean

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: ERCOT bounds guard + footnote** - `48e3b58` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/MapCanvas/MapCanvas.tsx` - Added ERCOT_BOUNDS constant, oobPopup state, bounds guard in handleClick, Popup JSX, footnote div
- `src/components/MapCanvas/MapCanvas.test.tsx` - Added MockPopup to vi.mock return for react-map-gl/mapbox

## Decisions Made

- Added Popup to the react-map-gl/mapbox mock in MapCanvas.test.tsx — without it Test B ("out-of-bounds click renders popup") would fail because the Popup import from vi.mock would be undefined. This is a Rule 3 auto-fix (blocking issue).
- Tasks 1 and 2 were implemented together in a single commit since both touch the same file and both turned green simultaneously.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Popup to react-map-gl/mapbox vi.mock return**
- **Found during:** Task 1 (implementing OOB popup)
- **Issue:** Test B expects `screen.getByText(/Outside ERCOT coverage area/i)` to find text rendered by the Popup component. The vi.mock for react-map-gl/mapbox had no `Popup` export — importing it would yield `undefined`, crashing the component.
- **Fix:** Added `MockPopup` (renders children in a div with `data-testid="mock-popup"`) to the mock's return object alongside existing Source/Layer/Marker/NavigationControl mocks.
- **Files modified:** `src/components/MapCanvas/MapCanvas.test.tsx`
- **Verification:** Test B passes — `screen.getByText(/Outside ERCOT coverage area/i)` finds the text inside MockPopup's children div.
- **Committed in:** `48e3b58` (part of Task 1+2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix essential for test harness correctness. The Wave-0 scaffold written in 05-01 omitted Popup from the mock — common oversight when writing tests before implementation. No scope creep.

## Issues Encountered

None beyond the mock gap described above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DATA-03 and DATA-05 requirements fulfilled
- MapCanvas is hardened: invalid clicks are gracefully rejected with user feedback
- Mock data disclosure is visible to all map users
- Ready for 05-03 (next demo hardening plan)

---
*Phase: 05-demo-hardening-polish*
*Completed: 2026-04-18*
