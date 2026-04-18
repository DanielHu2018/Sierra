---
phase: 04-pdf-dossier-export
plan: "03"
subsystem: server/pdf
tags: [puppeteer, ejs, pdf-generation, singleton-pattern, server-side-rendering]
dependency_graph:
  requires: [04-01]
  provides: [generatePdf, PdfTemplateData, template.ejs]
  affects: [04-05-pdf-endpoint]
tech_stack:
  added: [puppeteer singleton pattern, ejs.render()]
  patterns: [module-level browser singleton, defensive defaults, process cleanup handlers]
key_files:
  created:
    - server/src/pdf/pdfGenerator.ts
    - server/src/pdf/template.ejs
    - server/src/data/mock-contacts.ts
  modified:
    - server/src/types.ts
    - server/src/__tests__/pdfGenerator.test.ts
decisions:
  - "RouteResult added to server/src/types.ts — client type not importable due to rootDir:./src boundary"
  - "mock-contacts.ts created in this plan as Rule 3 fix — 04-02 and 04-03 are parallel; import required"
  - "segmentJustifications rendered as array iteration (not Object.entries) matching RouteResult type"
  - "Friction score color-coded in table: green <30%, amber 30-60%, red >60%"
metrics:
  duration: "~4 minutes"
  completed: "2026-04-18"
  tasks: 2
  files: 5
requirements_met: [PDF-02, PDF-03]
---

# Phase 04 Plan 03: Puppeteer PDF Engine + EJS Template Summary

Puppeteer singleton browser manager (`getBrowser()`), `generatePdf(PdfTemplateData): Promise<Buffer>` function, and complete 6-page EJS HTML dossier template — ready to be called by the PDF endpoint in 04-05.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build Puppeteer singleton and generatePdf function | 454f3e5 | server/src/pdf/pdfGenerator.ts, server/src/types.ts, server/src/data/mock-contacts.ts, server/src/__tests__/pdfGenerator.test.ts |
| 2 | Build EJS dossier template (6 pages) | 1db01a3 | server/src/pdf/template.ejs |

## What Was Built

**pdfGenerator.ts:**
- `getBrowser()` — module-level Puppeteer singleton, launches once on first call
- `generatePdf(data: PdfTemplateData): Promise<Buffer>` — reads template.ejs, calls `ejs.render()`, uses `page.setContent({ waitUntil: 'networkidle0' })`, returns `Buffer.from(pdfBuffer)` (handles Puppeteer v24 Uint8Array return)
- Defensive defaults applied before template render: `narrative || ''`, `contacts || []`, `triggers || []`
- Footer template: "Sierra — Illustrative data only" left + "Page N of M" right at 9px Arial
- `page.close()` in finally block; browser singleton kept alive
- Process cleanup: `exit`, `SIGINT`, `SIGTERM` handlers prevent orphaned Chrome processes

**template.ejs (6 pages):**
- Page 1 (Cover): Sierra wordmark, route label with print-safe route accent color, export date, map thumbnail or placeholder, narrative HTML (unescaped `<%-`)
- Page 2 (Metrics + Recommendation): 3-card metrics grid (distance/CapEx/permitting), recommendation box with route-specific left-border accent
- Page 3 (Environmental Triggers + Alerts): trigger table for selected route, primary + secondary alert boxes
- Page 4 (Project Timeline): phase timeline table, last row gets `timeline-total` highlight class
- Page 5 (Segment Justifications): friction score color-coded red/amber/green, justification text per segment
- Page 6 (Contacts): parcel owner contact table with all 6 columns

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RouteResult missing from server/src/types.ts**
- **Found during:** Task 1 (import resolution)
- **Issue:** Plan imports `RouteResult` from `'../../../src/types.js'` but server tsconfig `rootDir: ./src` prevents cross-boundary imports
- **Fix:** Added `RouteResult` interface directly to `server/src/types.ts` with identical shape to client-side type
- **Files modified:** `server/src/types.ts`
- **Commit:** 454f3e5

**2. [Rule 3 - Blocking] mock-contacts.ts required for import but not yet created (04-02 parallel plan)**
- **Found during:** Task 1 (import resolution)
- **Issue:** `pdfGenerator.ts` imports `MockContact` type from `../data/mock-contacts.js`; 04-02 (which creates this file) is a parallel plan not yet executed
- **Fix:** Created `server/src/data/mock-contacts.ts` with route-specific mock contacts (8-10 per route A/B/C, Texas county landowners)
- **Files modified:** `server/src/data/mock-contacts.ts` (new file)
- **Commit:** 454f3e5

**3. [Rule 1 - Bug] segmentJustifications rendered as array not Record**
- **Found during:** Task 2 (template creation)
- **Issue:** Plan suggested `Object.entries(justifications)` but `RouteResult.segmentJustifications` is typed as `Array<{segmentIndex, frictionScore, justification}>` not a `Record<number, string>`
- **Fix:** Template uses `justifications.forEach()` iterating over array objects with `.segmentIndex`, `.frictionScore`, `.justification` properties
- **Files modified:** `server/src/pdf/template.ejs`
- **Commit:** 1db01a3

## Self-Check: PASSED

- FOUND: server/src/pdf/pdfGenerator.ts
- FOUND: server/src/pdf/template.ejs
- FOUND: server/src/data/mock-contacts.ts
- FOUND: commit 454f3e5 (Task 1)
- FOUND: commit 1db01a3 (Task 2)
