---
phase: 04-pdf-dossier-export
plan: 05
subsystem: api
tags: [pdf, express, puppeteer, mapbox, ejs]

requires:
  - phase: 04-02
    provides: buildMapboxStaticUrl, fetchMapboxThumbnail, mockContacts, CANNED_NARRATIVES
  - phase: 04-03
    provides: generatePdf (Puppeteer singleton + EJS template)

provides:
  - server/src/routes/api.ts — POST /api/export/pdf Express endpoint (complete PDF pipeline)

affects:
  - 04-06 (client wiring calls this endpoint to trigger PDF download)

tech-stack:
  added: []
  patterns:
    - "POST /api/export/pdf: validate routeId → fetch Mapbox thumbnail (silent .catch) → server-side contacts lookup → narrative coalesce → generatePdf → stream buffer"
    - "mapThumbnail fetch failure: .catch(() => '') pattern — endpoint never 500s on Mapbox unavailability"
    - "narrative coalescing: body.narrative || CANNED_NARRATIVES[routeId] — server guarantees non-empty narrative"
    - "mockContacts looked up server-side by routeId — not trusted from client body"
    - "Content-Type: application/pdf + Content-Disposition: attachment for browser download trigger"

key-files:
  created: []
  modified:
    - server/src/routes/api.ts

key-decisions:
  - "Import types from server/src/types.ts (not root src/types.ts) — rootDir boundary prevents cross-domain imports"
  - "All pre-existing TypeScript errors in 2-build-graph.ts and @mapbox/polyline are out-of-scope; zero new errors introduced by this plan"

requirements-completed: [PDF-02, PDF-03, PDF-04]

duration: 5min
completed: 2026-04-18
---

# Phase 04 Plan 05: POST /api/export/pdf Endpoint Summary

**Express PDF export endpoint wiring all Phase 4 modules into a single synchronous pipeline: Mapbox thumbnail fetch (graceful fallback) → server-side contacts + narrative coalescing → Puppeteer PDF generation → buffer stream to client.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-18T02:10:00Z
- **Completed:** 2026-04-18T02:15:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- POST /api/export/pdf registered in the Express router in `server/src/routes/api.ts`
- Full pipeline implemented: routeId validation → Mapbox static image fetch (silent catch → empty string fallback) → server-side contacts lookup via `mockContacts[routeId]` → narrative coalescing via `body.narrative || CANNED_NARRATIVES[routeId]` → `generatePdf()` → buffer stream with correct headers
- Response headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="sierra-dossier-route-{routeId}.pdf"`, `Content-Length`
- Invalid routeId returns 400 with descriptive error; only `generatePdf()` throw produces 500
- Mapbox token absence and missing route geometry both handled gracefully (mapThumbnail defaults to empty string)
- All 38 server tests pass (5 todo stubs remain from prior plans); zero new TypeScript errors introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Add POST /api/export/pdf to server routes** - `9bf6b33` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `server/src/routes/api.ts` - Added PDF imports + POST /api/export/pdf route handler (87 lines added)

## Decisions Made

- Server-side types imported from `server/src/types.ts` rather than root `src/types.ts` — the server tsconfig rootDir boundary (`./src`) would reject cross-workspace imports
- Pre-existing TypeScript errors in `2-build-graph.ts` (turf type mismatches) and `buildMapboxUrl.ts` (@mapbox/polyline missing @types) are out-of-scope and logged to deferred-items

## Deviations from Plan

None — plan executed exactly as written. The dynamic import syntax `import('../types.js').RouteResult` in the route handler inline types was used to import from the server-local types.ts rather than the client src/types.ts as noted in the plan's comment.

## Issues Encountered

Pre-existing TypeScript errors in `server/src/pipeline/2-build-graph.ts` and `server/src/pdf/buildMapboxUrl.ts` were present before this plan executed and are unrelated to the PDF endpoint. No new errors were introduced.

## User Setup Required

- Set `MAPBOX_TOKEN` environment variable in server/.env for live Mapbox Static Images thumbnail fetching. Without it, mapThumbnail defaults to empty string and the PDF renders with a placeholder div instead of an image — this is the intended graceful fallback.

## Next Phase Readiness

- POST /api/export/pdf is complete and ready for client wiring in Plan 04-06
- All four Phase 4 server modules are now integrated: buildMapboxUrl + pdfGenerator + mock-contacts + canned-narrative
- Server test suite: 38 passing, 5 todo (narrative endpoint tests — due in 04-04 if not yet executed)

---
*Phase: 04-pdf-dossier-export*
*Completed: 2026-04-18*
