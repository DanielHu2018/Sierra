---
phase: 4
slug: pdf-dossier-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.4 |
| **Config file** | `vitest.config.ts` (root, jsdom) + `server/vitest.config.ts` (from Phase 3) |
| **Quick run command** | `cd server && npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run && cd server && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd server && npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run && cd server && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-W0-01 | 01 | 0 | PDF-01 | unit | `npx vitest run src/components/TopNav/TopNav.test.tsx` | ❌ W0 | ⬜ pending |
| 4-W0-02 | 01 | 0 | PDF-03 | unit | `cd server && npx vitest run src/__tests__/pdfGenerator.test.ts` | ❌ W0 | ⬜ pending |
| 4-W0-03 | 01 | 0 | PDF-04 | unit | `cd server && npx vitest run src/__tests__/buildMapboxUrl.test.ts` | ❌ W0 | ⬜ pending |
| 4-W0-04 | 01 | 0 | PDF-02 | unit | `cd server && npx vitest run src/__tests__/narrative.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-01 | 01 | 1 | PDF-04 | unit | `cd server && npx vitest run src/__tests__/buildMapboxUrl.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | PDF-03 | unit | `cd server && npx vitest run src/__tests__/pdfGenerator.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | PDF-02 | manual | Manual smoke test — Puppeteer PDF endpoint | manual-only | ⬜ pending |
| 4-03-01 | 03 | 2 | PDF-01 | unit | `npx vitest run src/components/TopNav/TopNav.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/TopNav/TopNav.test.tsx` — button enabled/disabled by simulationStatus (PDF-01)
- [ ] `server/src/__tests__/pdfGenerator.test.ts` — generatePdf data contract + template render without undefined (PDF-03)
- [ ] `server/src/__tests__/buildMapboxUrl.test.ts` — URL structure, bbox calculation, polyline encoding, coordinate swap (PDF-04)
- [ ] `server/src/__tests__/narrative.test.ts` — canned narrative fallback shape validation (PDF-02 partial)
- [ ] `cd server && npm install puppeteer ejs @mapbox/polyline @types/ejs` — install dependencies if not present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `POST /api/export/pdf` returns PDF buffer with correct Content-Type | PDF-02 | Puppeteer with headless Chrome cannot run in jsdom vitest environment | Start dev server, click Export PDF Dossier, verify browser downloads .pdf file, open and confirm all sections render correctly |
| PDF visual design matches spec (cover page, running header, section order) | PDF-02 | Visual/design validation requires human review | Open downloaded PDF, verify: cover page has map thumbnail + route label, pages 2-6 match section order spec, footer shows "Sierra — Illustrative data only" |
| Mock contacts display correctly in table layout | PDF-02 | PDF rendering requires human visual check | Verify contacts table on page 6 shows 8-10 contacts with correct fields per route |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
