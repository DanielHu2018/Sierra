---
phase: 5
slug: demo-hardening-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.4 |
| **Config file** | `vitest.config.ts` (repo root) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | DATA-03 | unit | `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | DATA-03 | unit | `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | DATA-03 | unit | `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` | ✅ extend | ⬜ pending |
| 5-02-01 | 02 | 1 | DATA-04 | unit | `npx vitest run src/components/Sidebar/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 1 | DATA-04 | unit | `npx vitest run src/components/Sidebar/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 5-03-01 | 03 | 1 | DATA-05 | unit | `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` | ❌ W0 | ⬜ pending |
| 5-04-01 | 04 | 2 | DATA-06 | unit | `npx vitest run src/utils/contrast.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/MapCanvas/MapCanvas.test.tsx` — extend existing file with DATA-03 bounds check tests (out-of-bounds does not call setSourcePin; in-bounds does) and DATA-05 footnote text presence test
- [ ] `src/components/Sidebar/Sidebar.test.tsx` — new file covering DATA-04 error state branch (renders error message and Retry button when simulationStatus='error')
- [ ] `src/utils/contrast.test.ts` — new file with static WCAG AA assertions for all route colors (#A7C8FF, #FFBC7C, #E8B3FF) and heatmap colors (#3291FF, #FF4444) against #131313

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Out-of-bounds popup auto-dismisses after 3 seconds | DATA-03 | Timer-based visual behavior; hard to test without real-time assertions | Click outside Texas bbox; observe popup appears and disappears in ~3s |
| Sidebar error state shows "Route generation failed. Please retry." with Retry button | DATA-04 | Visual verification of rendered text | Simulate network failure (DevTools offline mode), click Run Simulation |
| PDF footnote appears on every page | DATA-05 | PDF rendering; no headless test infrastructure | Generate a PDF dossier, inspect each page for footnote text |
| Heatmap blue→red gradient renders with legend | DATA-06 | Visual; depends on live Mapbox GL canvas | Enable friction heatmap overlay; verify gradient and legend appear |
| All Vercel env vars set; Railway responds to /health | Deploy | Infrastructure, not code | `curl https://[vercel-url]` loads app; `curl https://[railway-url]/health` returns 200 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
