---
phase: 1
slug: foundation-map-canvas
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library 16.x |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | infra | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | DATA-02 | unit | `npm run test -- --run src/types` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | DATA-01 | unit | `npm run test -- --run src/store` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | MAP-01 | component | `npm run test -- --run MapCanvas` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | MAP-02/03 | component | `npm run test -- --run PinMarkers` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | MAP-04–07 | component | `npm run test -- --run OverlayLayers` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | CTRL-01–05 | component | `npm run test -- --run Sidebar` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — jsdom environment, mapbox-gl mock alias
- [ ] `src/test/setup.ts` — RTL matchers, URL.createObjectURL mock
- [ ] `src/test/__mocks__/mapbox-gl.ts` — WebGL mock for jsdom
- [ ] `src/store/useAppStore.test.ts` — stub tests for AppState shape
- [ ] `src/types.test.ts` — type-check stub (compile-only)
- [ ] `package.json` test script pointing to vitest

*Framework install: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom @vitest/coverage-v8`*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Satellite/terrain baselayer visually correct | MAP-01 | WebGL map render; jsdom can't render tiles | Open browser, click layer switcher, verify map style changes |
| Pin pulse animation on drop | MAP-02/03 | CSS animation; jsdom has no compositing | Drop a pin, observe scale + pulse ring animation |
| Map recenters to fit both pins | MAP-02/03 | flyTo/fitBounds are mapbox-gl imperative; mock can't verify visually | Drop two pins in distant corners of Texas; map should zoom to show both |
| GeoJSON overlays render correctly at zoom 6 | MAP-04–07 | Tile rendering; jsdom can't verify | Toggle each overlay, verify lines/fills appear on map at Texas scale |
| Sidebar HUD is floating (not flush) | Design | Visual layout; no automated equivalent | Check sidebar has 1rem gap from screen edge and rounded corners |
| Dark theme colors match Stitch design system | Design | Visual; no automated equivalent | Compare sidebar `#1C1B1B` background and gradient button against Stitch mockup |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
