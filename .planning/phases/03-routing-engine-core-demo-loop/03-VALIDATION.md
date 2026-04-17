---
phase: 3
slug: routing-engine-core-demo-loop
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (or package.json scripts) |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

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
| 3-01-01 | 01 | 0 | ROUTE-01 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | ROUTE-01,ROUTE-02 | integration | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | ROUTE-05 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | AGENT-01,AGENT-02,AGENT-03 | integration | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | AI-04 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | HEAT-01,HEAT-02,HEAT-03 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 2 | DASH-01,DASH-02 | manual | N/A | N/A | ⬜ pending |
| 3-04-01 | 04 | 2 | REC-01,REC-02,REC-03 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 2 | ENV-01,ENV-02,ENV-03 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-04-03 | 04 | 2 | ALERT-01,ALERT-02,ALERT-03 | manual | N/A | N/A | ⬜ pending |
| 3-04-04 | 04 | 2 | SUMM-01,SUMM-02,SUMM-03 | manual | N/A | N/A | ⬜ pending |
| 3-04-05 | 04 | 2 | HOVER-01,HOVER-02 | manual | N/A | N/A | ⬜ pending |
| 3-04-06 | 04 | 2 | DASH-03,DASH-04,DASH-05 | manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/routing.test.ts` — stubs for ROUTE-01, ROUTE-02, ROUTE-05
- [ ] `src/__tests__/agentStream.test.ts` — stubs for AGENT-01, AGENT-02, AGENT-03, AI-04
- [ ] `src/__tests__/recommendations.test.ts` — stubs for REC-01, REC-02, REC-03, ENV-01, ENV-02, ENV-03
- [ ] `src/__tests__/heatmap.test.ts` — stubs for HEAT-01, HEAT-02, HEAT-03
- [ ] `recharts` — install via `npm install recharts` if not already present
- [ ] `ngraph.graph` + `ngraph.path` — install on server side if not present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent Reasoning Panel streams for 20–40s with Texas location names | AGENT-01 | Live SSE timing + visual verification | Click Run Simulation, observe panel, confirm narration runs 20-40s |
| Three color-coded routes visible on map | DASH-01 | Visual map rendering check | Drop two pins, run sim, verify blue/orange/purple routes appear |
| Sierra Recommends callout auto-appears | REC-01 | Conditional UI render from LLM call | Run simulation to completion, verify callout appears unprompted |
| Sierra Alerts ⚠️ appears unprompted | ALERT-01 | Event-driven UI render | Run simulation, verify alert panel appears without user action |
| Hover segment shows popup | HOVER-01 | Mouse interaction | Hover over route segment on map, verify popup with friction text |
| Project Summary timeline accessible | SUMM-01 | UI navigation | Run simulation, check timeline section in results dashboard |
| Environmental triggers expand for recommended route | ENV-01 | Conditional expansion logic | Run simulation, check recommended route's triggers are expanded |
| Radar chart appears as first results element | DASH-03 | Visual ordering check | After routes appear, verify radar/spider chart renders first |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
