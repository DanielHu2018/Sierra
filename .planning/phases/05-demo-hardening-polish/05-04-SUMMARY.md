---
phase: 05-demo-hardening-polish
plan: "04"
subsystem: server-hardening-deploy-config
tags: [health-endpoint, pdf-footer, deploy-config, DATA-05, vercel, railway, cache-pre-warm]
dependency_graph:
  requires: ["05-02", "05-03"]
  provides: [pdf-mock-data-footer, health-endpoint, vercel-deploy-config, railway-deploy-config, startup-cache-prewarm-confirmed]
  affects: [server/src/pdf/pdfGenerator.ts, server/src/index.ts, vercel.json, server/railway.toml]
tech_stack:
  added: []
  patterns: [Puppeteer footerTemplate HTML entities for unicode, top-level /health route on app (not router), nixpacks Railway build, Vite SPA rewrite rule in vercel.json]
key_files:
  created:
    - vercel.json
    - server/railway.toml
  modified:
    - server/src/pdf/pdfGenerator.ts
    - server/src/index.ts
decisions:
  - "HTML entities used for ⓘ (&#9432;) and — (&#8212;) in Puppeteer footerTemplate — avoids UTF-8 encoding issues in headless Chrome"
  - "/health registered directly on app (not apiRouter) so endpoint is GET /health not GET /api/health — matches Railway healthcheckPath and plan spec"
  - "graph.json and friction_cache.json confirmed already loaded at module scope in astar.ts (lines 64-65) — no change needed, pre-warm is active"
  - "Railway startCommand uses tsx (not node dist/index.js) matching existing server/package.json start script pattern"
  - "vercel.json _comment field documents required env vars; railway.toml uses TOML comments — no secrets hardcoded in either file"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-04-18"
  tasks_completed: 2
  files_changed: 4
---

# Phase 5 Plan 04: PDF Footer, Health Endpoint & Deploy Config Summary

**One-liner:** PDF pages now carry the required DATA-05 mock data footnote via Puppeteer footerTemplate, Express exposes GET /health for Railway healthchecks and pre-warm pings, and Vercel/Railway deploy configs are committed to disk.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | PDF mock data footer + /health endpoint + startup cache pre-warm | d937383 | server/src/pdf/pdfGenerator.ts, server/src/index.ts |
| 2 | Production deploy config (Vercel + Railway) | bf96a81 | vercel.json, server/railway.toml |
| 3 | Human verification checkpoint | — | (pending user verification) |

## What Was Built

### Task 1: PDF Footer + /health + Cache Pre-warm

**PDF footer (DATA-05):**
- Updated `server/src/pdf/pdfGenerator.ts` footerTemplate text from "Sierra — Illustrative data only" to "&#9432; Illustrative mock data &#8212; for demonstration purposes only."
- HTML entities `&#9432;` (ⓘ) and `&#8212;` (—) used to avoid UTF-8 encoding issues in headless Chrome
- Footer appears on every PDF page via Puppeteer's `displayHeaderFooter: true` + `footerTemplate`

**GET /health endpoint:**
- Added `app.get('/health', (_req, res) => res.json({ status: 'ok' }));` directly on the Express `app` in `server/src/index.ts`
- Registered at top-level (not inside `/api` router) so the path is `GET /health`, not `GET /api/health`
- Matches Railway `healthcheckPath = "/health"` in railway.toml

**Cache pre-warm (no-op confirmation):**
- `server/src/routing/astar.ts` lines 64-65 already load `graph.json` and `friction_cache.json` at module scope via `loadJson()`
- These are exported constants (`graphNodes`, `frictionCache`) initialized when Node.js first imports the module
- No per-request disk reads — first judge interaction is instant

### Task 2: Deploy Config Files

**vercel.json (repo root):**
- `buildCommand: "npm run build"`, `outputDirectory: "dist"`, `framework: "vite"`
- SPA rewrite rule: `/((?!api/).*)` → `/index.html` for React Router compatibility
- Comment documents required Vercel dashboard env vars: `VITE_MAPBOX_TOKEN`, `VITE_API_URL`
- No secrets hardcoded

**server/railway.toml:**
- `builder = "nixpacks"` (auto-detects Node.js + tsx)
- `startCommand = "tsx src/index.ts"` — matches existing `server/package.json` start script pattern
- `healthcheckPath = "/health"` — uses the endpoint added in Task 1
- `healthcheckTimeout = 30`, `restartPolicyType = "on_failure"`
- Comment documents required Railway dashboard env vars: `MAPBOX_TOKEN`, `ANTHROPIC_API_KEY`, `PORT`

## Verification Results

```
Test Files  14 passed | 3 skipped (17)
Tests       84 passed | 15 todo (99)
TypeScript  3 pre-existing errors (narrative.test.ts, buildMapboxUrl.ts) — unchanged from 05-03 baseline
```

Pre-existing TS errors (in pipeline scripts and test stubs) confirmed present before any changes via `git stash` round-trip.

## Success Criteria Verification

- [x] `server/src/pdf/pdfGenerator.ts` contains "Illustrative mock data" (footerTemplate)
- [x] `server/src/index.ts` registers `GET /health` directly on app
- [x] graph.json and friction_cache.json loaded at module scope (astar.ts lines 64-65)
- [x] `vercel.json` exists at repo root with buildCommand, outputDirectory, framework, rewrites
- [x] `server/railway.toml` exists with startCommand and healthcheckPath = "/health"
- [x] Full test suite: 84 passed, 0 failed
- [ ] Human checkpoint: 6 checks pending user verification

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Footer text did not match DATA-05 spec**
- **Found during:** Task 1, Part A
- **Issue:** Existing `pdfGenerator.ts` footer text was "Sierra — Illustrative data only" — missing "ⓘ", wrong wording, not matching plan spec
- **Fix:** Updated footerTemplate span to "&#9432; Illustrative mock data &#8212; for demonstration purposes only."
- **Files modified:** server/src/pdf/pdfGenerator.ts
- **Commit:** d937383

**2. [Rule 2 - Missing] /health not on top-level app**
- **Found during:** Task 1, Part B investigation
- **Issue:** api.ts router already had `router.get('/health', ...)` registered under `/api` prefix — this makes it `/api/health`, not `/GET /health` as the plan and Railway healthcheckPath require
- **Fix:** Added `app.get('/health', ...)` directly in index.ts on the Express app object
- **Files modified:** server/src/index.ts

### Out-of-scope (Deferred to deferred-items.md)

Pre-existing TypeScript errors in `src/__tests__/narrative.test.ts` and `src/pdf/buildMapboxUrl.ts` were present before this plan and are not caused by these changes. Not fixed.

## Self-Check: PASSED
