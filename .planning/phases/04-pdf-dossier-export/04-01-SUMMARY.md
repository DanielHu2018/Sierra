---
phase: 04-pdf-dossier-export
plan: 01
subsystem: pdf-test-scaffolds
tags: [tdd, wave-0, test-scaffolds, pdf, server-deps]
dependency_graph:
  requires: []
  provides: [PDF-01-scaffold, PDF-02-scaffold, PDF-03-scaffold, PDF-04-scaffold]
  affects: [04-02, 04-03, 04-04, 04-05]
tech_stack:
  added: [puppeteer, ejs, "@mapbox/polyline", "@types/ejs"]
  patterns: [test.todo stubs, wave-0 gate, tdd-red-phase]
key_files:
  created:
    - server/src/__tests__/pdfGenerator.test.ts
    - server/src/__tests__/buildMapboxUrl.test.ts
    - server/src/__tests__/narrative.test.ts
    - src/components/TopNav/TopNav.test.tsx
  modified:
    - server/package.json
    - server/package-lock.json
decisions:
  - "Wave 0 gate: all 4 Phase 4 test scaffolds written as test.todo stubs before any production code"
  - "No imports of non-existent modules in test files — avoids import chain failures in RED state"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-18T06:07:24Z"
  tasks_completed: 3
  files_created: 4
  files_modified: 2
---

# Phase 04 Plan 01: Wave 0 Test Scaffolds Summary

**One-liner:** Installed 4 PDF server deps (puppeteer/ejs/@mapbox/polyline/@types/ejs) and created 4 test.todo scaffold files establishing the Nyquist sampling contract for Phase 4.

## What Was Built

Wave 0 gate for Phase 4 PDF Dossier Export. Four test scaffold files written in RED state using `test.todo` stubs only — no production code, no imports of non-existent modules.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Install server dependencies | 785f889 | server/package.json, package-lock.json |
| 2 | Create server-side test scaffolds | 80af042 | pdfGenerator.test.ts, buildMapboxUrl.test.ts, narrative.test.ts |
| 3 | Create client-side TopNav test scaffold | 1b26264 | src/components/TopNav/TopNav.test.tsx |

## Test Scaffolds Created

**server/src/__tests__/pdfGenerator.test.ts** (4 todos)
- generatePdf returns a Buffer
- Template renders without "undefined" strings
- Accepts PdfTemplateData shape
- Puppeteer browser singleton reuse

**server/src/__tests__/buildMapboxUrl.test.ts** (7 todos)
- URL contains satellite-streets-v12 style
- bbox with 0.05-degree padding
- polyline URL-encoding
- GeoJSON [lng,lat] -> [lat,lng] coordinate swap
- Coordinate downsampling for >100 points
- Returns base64 data URI string
- Throws on non-200 Mapbox API status

**server/src/__tests__/narrative.test.ts** (5 todos)
- CANNED_NARRATIVES has entries for routes A, B, C
- Each is a non-empty string
- Each contains a Texas location name
- POST /api/narrative returns narrative in JSON
- Falls back to canned narrative when Claude unavailable

**src/components/TopNav/TopNav.test.tsx** (5 todos)
- Button visible/enabled when simulationStatus is "complete"
- Button disabled (opacity 0.4, cursor not-allowed) when not complete
- Click triggers exportPdf when enabled
- No trigger when simulationStatus is "idle"
- No trigger when simulationStatus is "streaming"

## Verification Results

- `npx vitest run` (root): 11 passed | 4 skipped | 85 tests (69 passed + 16 todo) — exit 0
- `cd server && npx vitest run`: 6 passed | 3 skipped | 43 tests (27 passed + 16 todo) — exit 0
- All 4 packages present in server/node_modules: puppeteer, ejs, @mapbox/polyline, @types/ejs

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] server/src/__tests__/pdfGenerator.test.ts exists
- [x] server/src/__tests__/buildMapboxUrl.test.ts exists
- [x] server/src/__tests__/narrative.test.ts exists
- [x] src/components/TopNav/TopNav.test.tsx exists
- [x] Commits 785f889, 80af042, 1b26264 verified
- [x] Both test runners exit 0
