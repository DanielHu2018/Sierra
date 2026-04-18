---
phase: 05-demo-hardening-polish
plan: 01
subsystem: testing
tags: [vitest, react-testing-library, wcag, a11y, tdd, wave-0, jest-dom]

requires:
  - phase: 04-pdf-dossier-export
    provides: "MapCanvas, Sidebar, OverlayLayers components that Phase 5 tests exercise"

provides:
  - "Wave-0 test scaffolds: 3 files, 11 tests total (5 red, 6 green)"
  - "MapCanvas bounds-check tests (DATA-03) — fail red until 05-02 implements OOB popup"
  - "MapCanvas footnote test (DATA-05) — fails red until 05-02 adds 'Illustrative mock data' overlay"
  - "Sidebar error-state tests (DATA-04) — fail red until 05-03 adds Retry button + error message"
  - "WCAG AA contrast assertions (DATA-06) — 6/6 green, color contract documented"

affects: [05-02, 05-03, 05-04, 05-05]

tech-stack:
  added: []
  patterns:
    - "react-map-gl/mapbox vi.mock with Source/Layer/Marker/NavigationControl stubs for MapCanvas component tests"
    - "Module-level capturedMapOnClick slot pattern to capture Map onClick prop across render calls"
    - "vitest regex alias pattern for mapbox-gl root import vs CSS sub-path imports"
    - "WCAG relative luminance formula inline in test file for portable color contract assertions"
    - "Wave-0 scaffolding: tests written before implementation, intentionally RED until implementation tasks complete"

key-files:
  created:
    - src/components/MapCanvas/MapCanvas.test.tsx
    - src/components/Sidebar/Sidebar.test.tsx
    - src/utils/contrast.test.ts
    - src/test/__mocks__/empty-style.ts
    - src/test/__mocks__/empty.css
  modified:
    - vitest.config.ts

key-decisions:
  - "vitest.config.ts: regex alias array for mapbox-gl — /^mapbox-gl$/ matches root import only; /^mapbox-gl\\/.+\\.css$/ stubs CSS sub-path imports separately"
  - "Module-level capturedMapOnClick variable captures Map onClick prop across describe blocks — avoids per-describe vi.mocked() re-mock complexity"
  - "Sidebar.test.tsx mocks all 7 sub-components (StreamPanel, ResultsPanel, PinPlacementSection, etc.) to isolate error-branch rendering"
  - "WCAG contrast helper is self-contained in contrast.test.ts — no external a11y library dependency"

patterns-established:
  - "MapCanvas test pattern: render MapCanvas with mocked react-map-gl; capture onClick via module-level slot; inject spy setSourcePin/setDestinationPin via useAppStore.setState"
  - "Sidebar test pattern: mock all leaf sub-components via vi.mock; set simulationStatus via useAppStore.setState; assert on error-branch text/button presence"

requirements-completed: [DATA-03, DATA-04, DATA-06]

duration: 8min
completed: 2026-04-18
---

# Phase 5 Plan 01: Wave-0 Test Scaffolds Summary

**Vitest Wave-0 scaffolds for DATA-03/04/05/06: 3 test files, 5 intentionally-red tests, 6 green contrast assertions — all implement-then-green pattern**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-18T07:02:00Z
- **Completed:** 2026-04-18T07:10:07Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- MapCanvas.test.tsx extended with 4 Wave-0 tests: OOB click prevention (Test A/B red), in-bounds call (Test C green), footnote presence (Test D red)
- Sidebar.test.tsx created with 3 tests: error message text (A red), Retry button (B red), idle state control (C green)
- contrast.test.ts created with 6 WCAG AA assertions: all 6 green, documents color contract for route colors, heatmap endpoints, footnote text
- vitest.config.ts fixed to resolve CSS import from mapbox-gl via regex alias pattern

## Task Commits

1. **Task 1: MapCanvas test scaffolds (DATA-03 + DATA-05)** - `bc3ef2e` (test)
2. **Task 2: Sidebar error state test scaffold (DATA-04)** - `12ad249` (test)
3. **Task 3: WCAG AA contrast static assertions (DATA-06)** - `00b26eb` (test)

## Files Created/Modified

- `src/components/MapCanvas/MapCanvas.test.tsx` - Extended with 4 Wave-0 tests; react-map-gl vi.mock with all sub-component exports
- `src/components/Sidebar/Sidebar.test.tsx` - Created; 3 DATA-04 error-state tests with full sub-component mocking
- `src/utils/contrast.test.ts` - Created; 6 WCAG AA contrast assertions with inline luminance formula
- `vitest.config.ts` - Regex alias array for mapbox-gl + CSS stub; removed inline test.alias in favor of top-level resolve.alias pattern
- `src/test/__mocks__/empty-style.ts` - CSS stub for mapbox-gl/dist/mapbox-gl.css import in test environment
- `src/test/__mocks__/empty.css` - Inert CSS file (unused fallback)

## Decisions Made

- vitest regex aliases: `/^mapbox-gl$/` routes to mock TS file; `/^mapbox-gl\/.+\.css$/` routes to empty-style stub — resolves import-analysis resolution failure when full-string alias intercepts CSS sub-paths
- Module-level `capturedMapOnClick` slot captures the onClick prop that MapCanvas passes to the mocked Map component — enables `fireClick({ lng, lat })` helper in bounds-check tests without re-mocking per describe block
- WCAG formula self-contained in test file (no external a11y library) — no new dependency; deterministic and portable

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed vitest CSS import resolution failure for mapbox-gl**
- **Found during:** Task 1 (MapCanvas test scaffolds)
- **Issue:** `mapbox-gl/dist/mapbox-gl.css` import in MapCanvas.tsx caused `vite:import-analysis` failure in test mode. The string alias `'mapbox-gl'` caused vite to resolve CSS sub-paths relative to the mock file (not node_modules), breaking resolution.
- **Fix:** Switched `test.alias` from string-based to regex alias array at top level. `/^mapbox-gl$/` matches only the root package import; `/^mapbox-gl\/.+\.css$/` separately stubs CSS sub-paths. Added `src/test/__mocks__/empty-style.ts` as the CSS stub target.
- **Files modified:** `vitest.config.ts`, `src/test/__mocks__/empty-style.ts`
- **Verification:** `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` runs without import-analysis error
- **Committed in:** `bc3ef2e` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was essential to unblock test execution. No scope creep — only vitest config and an empty mock file.

## Issues Encountered

- The existing mapbox-gl alias in vitest used a simple string key which also intercepted CSS sub-path imports. Switching to regex-based alias array resolved the ambiguity cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave-0 gate CLEARED: all 3 test files exist and run without import/syntax errors
- 05-02 (MapCanvas bounds check + footnote implementation) can now point to MapCanvas.test.tsx as its verify command — Tests A, B, D go green when implementation is complete
- 05-03 (Sidebar error state implementation) can point to Sidebar.test.tsx — Tests A, B go green when Retry button and error message are implemented
- contrast.test.ts provides ongoing regression protection for DATA-06 compliance

---
*Phase: 05-demo-hardening-polish*
*Completed: 2026-04-18*
