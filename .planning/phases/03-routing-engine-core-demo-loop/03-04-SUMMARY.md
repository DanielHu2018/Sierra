---
phase: 03-routing-engine-core-demo-loop
plan: "04"
subsystem: server-ai-endpoints
tags: [claude, sse, streaming, canned-fallback, express, ai-endpoints]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [ai-endpoints, canned-fallback-content]
  affects: [client-ui-panels, demo-loop]
tech_stack:
  added: ["@anthropic-ai/sdk (streaming + create)", "SSE text/event-stream"]
  patterns: ["try/catch canned fallback", "SSE AbortController", "JSON extraction regex"]
key_files:
  created:
    - server/src/cannedFallback.ts
    - server/src/routes/aiEndpoints.ts
  modified:
    - server/src/index.ts
    - server/src/types.ts
    - src/types.ts
    - server/src/__tests__/cannedFallback.test.ts
decisions:
  - "Import types from server/src/types.ts (not ../../src/types.ts) to avoid rootDir violation in server tsconfig"
  - "AI response types (RouteRecommendation, EnvironmentalTrigger, SierraAlert, ProjectSummary) added to both src/types.ts and server/src/types.ts for separate compilation domains"
  - "Canned SSE streams at 3 chars/25ms chunk — yields ~30s playback for 800-char CANNED_REASONING_STREAM"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-18"
  tasks_completed: 2
  files_changed: 6
---

# Phase 03 Plan 04: Claude AI Endpoints with Canned Fallbacks Summary

**One-liner:** Five Express endpoints (SSE reasoning stream + 4 parallel JSON panels) each with silent try/catch canned fallback using real Texas regulatory content — judges see identical demo behavior with or without a Claude API key.

## What Was Built

### Task 1: Canned Fallback Content Module

`server/src/cannedFallback.ts` — 6 exports used as catch-branch content for every AI endpoint:

- `CANNED_REASONING_STREAM` — ~900-char typewriter narration (~30s at 3 chars/25ms) covering 5 constraint layers, concluding with "Sierra Recommends: Route C. Preparing justification and risk summary."
- `CANNED_RECOMMENDATION` — RouteRecommendation object for Route C with 3-sentence rationale
- `CANNED_TRIGGERS` — EnvironmentalTrigger[] for routes A/B/C, each with ESA Section 7, CWA Section 404, NHPA Section 106, NEPA Level entries
- `CANNED_ALERTS` — SierraAlert with primary (Nolan County landowner opposition) and 2 secondary items
- `CANNED_SUMMARY` — ProjectSummary with 6 phases from Desktop Screening to Total Timeline
- `CANNED_SEGMENT_JUSTIFICATIONS` — Record<number, string> for 5 segment indices

All content references real Texas locations: Reeves County, Edwards Aquifer, Nolan County, US-385, Sutton County, Pecos Basin, PUCT.

Test file upgraded from 6 `test.todo` stubs to 6 fully passing assertions.

### Task 2: Claude AI Express Endpoints

`server/src/routes/aiEndpoints.ts` — 5 endpoints registered at `/api`:

| Endpoint | Method | Pattern |
|----------|--------|---------|
| `/api/stream/reasoning` | GET | SSE stream via `client.messages.stream()`, falls back to `streamCannedText()` |
| `/api/recommend` | POST | `client.messages.create()`, JSON regex extraction, falls back to CANNED_RECOMMENDATION |
| `/api/triggers` | POST | `client.messages.create()`, JSON array extraction, falls back to CANNED_TRIGGERS |
| `/api/alerts` | POST | `client.messages.create()`, JSON extraction, falls back to CANNED_ALERTS |
| `/api/summary` | POST | `client.messages.create()`, JSON extraction with 6-phase validation, falls back to CANNED_SUMMARY |

SSE stream uses `req.on('close', () => { aborted = true })` to prevent write-after-end errors on client disconnect. Live stream sends `data: [DONE]\n\n` sentinel; canned fallback helper also terminates with `[DONE]`.

Registered in `server/src/index.ts` as `app.use('/api', aiRouter)` alongside existing `apiRouter`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed rootDir TypeScript violation in cannedFallback.ts import**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** Plan specified `import from '../../src/types.js'` but server `tsconfig.json` has `rootDir: "./src"` — cross-package imports fail compilation
- **Fix:** Added AI response types directly to `server/src/types.ts` and changed import to `'./types.js'`
- **Also:** Added same types to `src/types.ts` so client-facing code can use them
- **Files modified:** `server/src/types.ts`, `server/src/cannedFallback.ts`, `src/types.ts`
- **Commit:** f0ef972

## Verification Results

- `cd server && npx vitest run --reporter=dot` — 27 tests passed (6 files)
- `npx vitest run --reporter=dot` (root) — 45 tests passed, 6 files passed, 7 skipped
- Five endpoints exist in aiEndpoints.ts: GET /api/stream/reasoning, POST /api/recommend, POST /api/triggers, POST /api/alerts, POST /api/summary
- cannedFallback.ts references: Reeves County, Edwards Aquifer, Nolan County, US-385
- Reasoning stream concludes with "Sierra Recommends: Route C. Preparing justification and risk summary."

## Self-Check: PASSED
