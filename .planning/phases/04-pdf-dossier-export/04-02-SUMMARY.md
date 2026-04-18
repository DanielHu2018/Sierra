---
phase: 04-pdf-dossier-export
plan: 02
subsystem: api
tags: [mapbox, polyline, pdf, geojson, vitest]

requires:
  - phase: 04-01
    provides: vitest test scaffold stubs for buildMapboxUrl and narrative

provides:
  - server/src/pdf/buildMapboxUrl.ts — Mapbox Static Images URL builder with polyline encoding and thumbnail fetcher
  - server/src/data/mock-contacts.ts — route-specific mock parcel contact records (9/8/10 contacts for A/B/C)
  - server/src/data/canned-narrative.ts — pre-written 3-paragraph narrative fallbacks per route (A/B/C)

affects:
  - 04-03 (pdfGenerator imports mockContacts and CANNED_NARRATIVES)
  - 04-05 (PDF endpoint uses buildMapboxStaticUrl and fetchMapboxThumbnail)

tech-stack:
  added: []
  patterns:
    - "@mapbox/polyline.encode() receives [lat,lng] pairs — GeoJSON [lng,lat] must be swapped before encoding"
    - "Mapbox Static Images URL pattern: satellite-streets-v12, path-3+A7C8FF overlay, 800x500@2x, bbox with 0.05-degree padding"
    - "fetchMapboxThumbnail returns data:image/png;base64,... for HTML embedding; throws on non-200 for caller catch"
    - "Downsample coords (keep every 3rd + final) when route > 100 points to stay under 8192-char URL limit"

key-files:
  created:
    - server/src/pdf/buildMapboxUrl.ts
    - server/src/data/mock-contacts.ts
    - server/src/data/canned-narrative.ts
  modified:
    - server/src/__tests__/buildMapboxUrl.test.ts
    - server/src/__tests__/narrative.test.ts

key-decisions:
  - "mockContacts exported as camelCase (not MOCK_CONTACTS) to match plan spec and PDF endpoint import convention"
  - "narrative.test.ts: 3 canned data tests implemented now; 2 endpoint tests (POST /api/narrative) deferred to Plan 04-04 as test.todo"
  - "Test regex for polyline URL-encoding fixed to allow %XX anywhere in encoded path segment, not only at position 0"

patterns-established:
  - "GeoJSON [lng,lat] → [lat,lng] swap before @mapbox/polyline.encode() — documented in source comment"
  - "Canned narrative structure: Para 1 = context/goal, Para 2 = route selection rationale, Para 3 = risks/mitigations"

requirements-completed: [PDF-03, PDF-04]

duration: 3min
completed: 2026-04-18
---

# Phase 04 Plan 02: Mapbox URL Builder, Mock Contacts, Canned Narratives Summary

**Mapbox Static Images URL builder with @mapbox/polyline encoding and coordinate swap, plus route-specific mock contacts and Texas-location-anchored narrative fallbacks for the PDF dossier pipeline.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-18T06:08:48Z
- **Completed:** 2026-04-18T06:12:16Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- buildMapboxUrl.ts implemented with satellite-streets-v12 style, 0.05-degree bbox padding, GeoJSON→polyline coordinate swap, and 100-point downsampling — all 7 tests pass GREEN
- mock-contacts.ts has 9/8/10 route-specific fictional contacts for routes A/B/C referencing real Texas counties (Reeves, Ward, Midland, Edwards, Sutton, etc.)
- canned-narrative.ts has 3-paragraph narratives per route referencing US-385 corridor, Nolan County, Reeves County, Edwards Aquifer, and Edwards Plateau for demo credibility
- narrative.test.ts data tests (3) implemented and passing; 2 endpoint tests deferred to Plan 04-04

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Mapbox Static URL utility** - `2da01c3` (feat)
2. **Task 2: Create mock contacts and canned narrative data** - `4ac98fb` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `server/src/pdf/buildMapboxUrl.ts` - buildMapboxStaticUrl() and fetchMapboxThumbnail() implementations
- `server/src/data/mock-contacts.ts` - mockContacts Record<'A'|'B'|'C', MockContact[]> with 9/8/10 entries
- `server/src/data/canned-narrative.ts` - CANNED_NARRATIVES Record<'A'|'B'|'C', string> with 3-paragraph fallbacks
- `server/src/__tests__/buildMapboxUrl.test.ts` - Full test suite replacing todo stubs (7 tests, all GREEN)
- `server/src/__tests__/narrative.test.ts` - 3 data tests implemented (GREEN), 2 endpoint todos deferred to 04-04

## Decisions Made

- mockContacts exported as camelCase (`mockContacts`) matching the plan's export spec and PDF endpoint lookup pattern
- narrative.test.ts endpoint tests (POST /api/narrative) left as .todo since the endpoint doesn't exist until Plan 04-04
- Test regex for polyline URL-encoding corrected: `/path-3\+A7C8FF\([^)]*%[0-9A-F]{2}/i` — the polyline encoded string may begin with non-percent characters before the first %XX escape sequence

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed polyline URL-encoding regex in test**
- **Found during:** Task 1 (Build Mapbox Static URL utility)
- **Issue:** Test regex `/path-3\+A7C8FF\(%[0-9A-F]{2}/i` assumed the encoded polyline starts with `%XX` immediately after `(`, but `@mapbox/polyline.encode()` may produce non-percent characters at position 0 (e.g., `_jg_E~cy%7C...`)
- **Fix:** Updated regex to `/path-3\+A7C8FF\([^)]*%[0-9A-F]{2}/i` — matches `%XX` anywhere within the parenthesized encoded segment
- **Files modified:** server/src/__tests__/buildMapboxUrl.test.ts
- **Verification:** All 7 buildMapboxUrl tests pass GREEN
- **Committed in:** 2da01c3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test regex)
**Impact on plan:** Fix necessary for correct test assertion. No scope creep.

## Issues Encountered

None — implementation was straightforward after fixing the test regex.

## User Setup Required

None - no external service configuration required for these pure data/utility modules. A live Mapbox token is needed at PDF export runtime, but that is configured in Plan 04-05.

## Next Phase Readiness

- buildMapboxUrl.ts is ready to be imported by the PDF generator (Plan 04-03/04-05)
- mockContacts and CANNED_NARRATIVES are ready to be imported by the PDF endpoint (Plan 04-05)
- 2 remaining narrative.test.ts endpoint tests are stubs ready for Plan 04-04 to implement

---
*Phase: 04-pdf-dossier-export*
*Completed: 2026-04-18*
