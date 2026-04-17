---
phase: 2
slug: offline-data-pipeline-ai-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (or "none — Wave 0 installs") |
| **Quick run command** | `npm run test --workspace=server -- --run` |
| **Full suite command** | `npm run test --workspace=server -- --run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=server -- --run`
- **After every plan wave:** Run `npm run test --workspace=server -- --run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | ROUTE-03 | unit | `npm run test --workspace=server -- --run graph` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | ROUTE-03 | unit | `npm run test --workspace=server -- --run graph` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | ROUTE-03 | unit | `npm run test --workspace=server -- --run bfs` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | AI-01 | unit | `npm run test --workspace=server -- --run friction` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | AI-01 | unit | `npm run test --workspace=server -- --run friction` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | AI-02, AI-03 | unit | `npm run test --workspace=server -- --run rag` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 2 | AI-02 | unit | `npm run test --workspace=server -- --run rag` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/src/__tests__/graph.test.ts` — stubs for ROUTE-03, ROUTE-04
- [ ] `server/src/__tests__/friction.test.ts` — stubs for AI-01
- [ ] `server/src/__tests__/rag.test.ts` — stubs for AI-02, AI-03
- [ ] `server/src/__tests__/bfs.test.ts` — BFS connectivity check stubs for ROUTE-07
- [ ] vitest install if not present — `npm install --save-dev vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| friction_cache.json has 0–1 scores for every node | AI-01 | Requires real Claude API call and full graph | Run `npx tsx server/src/pipeline/score-friction.ts` and inspect output |
| RAG index loads correctly from embedded text | AI-02 | Requires full startup sequence | Start server and check startup logs for "RAG index ready" |
| Government regulation text chunks are indexed | AI-03 | Content quality requires human review | Check that indexed chunks include PUCT, NEPA, ESA, CWA terms |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
