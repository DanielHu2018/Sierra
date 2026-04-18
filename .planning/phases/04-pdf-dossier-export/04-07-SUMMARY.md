---
phase: 04-pdf-dossier-export
plan: "07"
subsystem: navigation-tabs + pdf-map-thumbnail
tags: [navigation, zustand, topnav, mapbox, pdf, env-config, bugfix]
dependency_graph:
  requires: [04-06]
  provides: [working-nav-tabs, mapbox-server-env, styled-pdf-placeholder]
  affects: [TopNav, App, useAppStore, server-env, pdf-template]
tech_stack:
  added: []
  patterns: [tsx-env-file, activeTab-zustand, conditional-render]
key_files:
  created:
    - server/.env (gitignored — MAPBOX_TOKEN for server-side static image fetch)
  modified:
    - src/store/useAppStore.ts
    - src/components/TopNav/TopNav.tsx
    - src/App.tsx
    - server/package.json
    - server/src/pdf/template.ejs
decisions:
  - "activeTab state added to Zustand store (not local component state) so any component can read current tab"
  - "Data Layers and Archive tabs render styled placeholder panels — no map rendered outside route-engine tab"
  - "server/.env loaded via tsx --env-file .env (Node native, no dotenv dependency needed)"
  - "Map thumbnail placeholder replaced with dark-panel design: route-colored border, Sierra Route Visualization label — polished even without Mapbox access"
  - "server/.env is gitignored (correct); consumers must create it from .env VITE_MAPBOX_TOKEN"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-18"
  tasks_completed: 2
  files_changed: 5
---

# Phase 04 Plan 07: Human Verification Fix-Up Summary

One-liner: Fixed nav tab switching via activeTab Zustand state + wired MAPBOX_TOKEN into server env for satellite map thumbnail in PDF.

## What Was Built

This plan resolved two issues found during human verification of the PDF dossier export feature.

### Fix 1 — Navigation Tabs

The TopNav buttons had no `onClick` handlers and there was no `activeTab` state anywhere in the app. Clicking "Data Layers" or "Archive" did nothing — the Route Engine view always showed.

Changes:
- Added `activeTab: 'route-engine' | 'data-layers' | 'archive'` state field and `setActiveTab` action to `useAppStore`
- TopNav now reads `activeTab` and `setActiveTab` from the store; each button has an `onClick` handler calling `setActiveTab`
- Active tab button uses `navItemActiveStyle` (brighter color); inactive tabs use `navItemStyle`
- App.tsx conditionally renders content based on `activeTab`: Route Engine shows MapCanvas + Sidebar, Data Layers and Archive show styled placeholder panels

### Fix 2 — Mapbox Token for Server + Styled PDF Placeholder

The server's `/api/export/pdf` endpoint reads `process.env.MAPBOX_TOKEN` to fetch the satellite map thumbnail. `server/.env` did not exist, so the token was always empty — the endpoint skipped the fetch and the PDF showed "Map thumbnail unavailable — Mapbox Static API not reachable."

Changes:
- Created `server/.env` (gitignored) with `MAPBOX_TOKEN` copied from the root `.env`'s `VITE_MAPBOX_TOKEN`
- Updated `server/package.json` `dev` and `start` scripts to pass `--env-file .env` to tsx, using Node's native env file loading (no dotenv dependency needed — Node 24)
- Improved the PDF template's map placeholder: replaced plain text with a styled dark panel (`#1a1e2b` background, route-color border with thicker top edge, "Sierra Route Visualization" label and "ERCOT Texas Corridor — Route X" subtitle)

## Test Results

- Frontend: 71 passed, 15 todo — all green
- Server: 40 passed, 3 todo — all green

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Navigation tab onClick handlers missing entirely**
- **Found during:** Human verification (user stuck on Route Engine tab)
- **Issue:** TopNav rendered three `<button>` elements with hardcoded active/inactive styles but no `onClick` handlers; no `activeTab` state existed in the store
- **Fix:** Added `activeTab` + `setActiveTab` to Zustand store; wired TopNav button clicks; App.tsx now conditionally renders content per tab
- **Files modified:** `src/store/useAppStore.ts`, `src/components/TopNav/TopNav.tsx`, `src/App.tsx`
- **Commits:** ee1a6df

**2. [Rule 1 - Bug] MAPBOX_TOKEN not provided to server process**
- **Found during:** Human verification (PDF cover shows "Map thumbnail unavailable")
- **Issue:** `server/.env` did not exist; server scripts did not load any env file; `process.env.MAPBOX_TOKEN` was always `''`
- **Fix:** Created `server/.env` with token; added `--env-file .env` to tsx scripts; improved template placeholder styling
- **Files modified:** `server/.env` (gitignored, created), `server/package.json`, `server/src/pdf/template.ejs`
- **Commits:** 8313241

## Self-Check: PASSED
