---
phase: 03-routing-engine-core-demo-loop
plan: "06"
subsystem: sidebar-stream-ui
tags: [sse, typewriter, state-machine, react-hooks, sidebar]
dependency_graph:
  requires: [03-02, 03-03, 03-04]
  provides: [sidebar-state-machine, reasoning-stream-hook, stream-panel-ui]
  affects: [src/components/Sidebar/Sidebar.tsx, src/components/Sidebar/StreamPanel.tsx, src/hooks/useReasoningStream.ts]
tech_stack:
  added: []
  patterns: [ref-based-queue-drain, abortcontroller-sse, setTimeout-typewriter, zustand-state-machine]
key_files:
  created:
    - src/hooks/useReasoningStream.ts
    - src/components/Sidebar/StreamPanel.tsx
  modified:
    - src/components/Sidebar/Sidebar.tsx
decisions:
  - "Ref-based character queue (not state) for typewriter drain — avoids React batching interference"
  - "drainTick polls queue with 20ms retry when stream not done + queue empty — handles burst SSE chunks"
  - "runSimulation fires routes → recommend → parallel(triggers/alerts/summary) so data lands before stream ends"
  - "ResultsPanel placeholder stub in Sidebar — Plan 07 replaces with full results view"
metrics:
  duration: "2min"
  completed_date: "2026-04-18"
  tasks: 2
  files_changed: 3
---

# Phase 03 Plan 06: Sidebar State Machine + Agent Reasoning Stream Summary

**One-liner:** Character-by-character typewriter SSE stream hook with AbortController cancel, wired into Sidebar controls/running/complete state machine driven by Zustand simulationStatus.

## What Was Built

### useReasoningStream hook (src/hooks/useReasoningStream.ts)

Custom React hook that connects the sidebar to the `/api/stream/reasoning` SSE endpoint:

- Opens fetch with `AbortController` signal (not `EventSource` — supports abort)
- Reads `ReadableStream` chunks, buffers partial SSE lines, parses `data: {...}\n\n` format
- Each parsed `chunk` string: pushes individual characters into a `useRef` queue (not state)
- `drainTick` loop: `setTimeout(15ms)` per character — true character-by-character typewriter
- When queue empty + stream not done: polls at 20ms — handles burst chunk arrivals correctly
- `[DONE]` sentinel: stops pushing to queue; drain continues until empty, then calls `onComplete`
- `cancel()`: sets cancelled flag, calls `abort()`, clears queue, resets `isStreaming`
- `useEffect` cleanup: prevents React state updates on unmounted component
- Returns: `{ displayText, isStreaming, startStream, cancel }`

### StreamPanel component (src/components/Sidebar/StreamPanel.tsx)

The "demo moment" view that replaces the controls sidebar during simulation:

- Mounts and immediately calls `startStream` with source/dest/constraints params
- Monospace dark panel with `pre-wrap` text — narration text accumulates via typewriter
- Blinking cursor (`blink` CSS animation) stays at end of growing text
- Pulsing blue dot next to "Sierra Agent" header signals live activity
- Cancel `×` button (top-right): calls `cancel()` + `onCancel()` to return to controls
- `onComplete` callback: fires after drain finishes + 1.5s pause → transitions to results

### Sidebar state machine (src/components/Sidebar/Sidebar.tsx)

Three-state view driven by `simulationStatus` from Zustand store:

| Status | View Rendered |
|--------|--------------|
| `idle` / `error` | Full controls: pins, voltage, priority, constraints, overlays, Run button |
| `running` | StreamPanel (typewriter narration) |
| `complete` | ResultsPanel placeholder ("Results loading...") |

`runSimulation` async sequence (fires on button click):
1. `setSimulationStatus('running')` — immediately switches view
2. `POST /api/route` → `setRoutes(routes)` (fast, A* completes in ms)
3. `POST /api/recommend` → `setRecommendation + setSelectedRoute`
4. `Promise.all([POST /api/triggers, POST /api/alerts, POST /api/summary])` → sets all three

Run Simulation button: disabled (`opacity: 0.4`, `cursor: not-allowed`) until both `sourcePin` and `destinationPin` are non-null.

## Verification Results

- `npx tsc --noEmit`: exits 0, no errors
- `npx vitest run`: 7 test files passed, 51 tests passed, 21 todo (pre-existing)
- Hook exports `{ displayText, isStreaming, startStream, cancel }` — confirmed
- Sidebar renders correct view per simulationStatus — confirmed by code review

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

Minor adjustments:
- Removed unused `drainQueue` from `startStream` dependency array (was in plan code as `[drainQueue]`, but `drainTick` is defined inline within `startStream` so no external dependency needed — this avoids a lint warning)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: useReasoningStream hook | `9e0bccc` | feat(03-06): add useReasoningStream hook with typewriter and AbortController |
| Task 2: StreamPanel + Sidebar | `46df5b7` | feat(03-06): build StreamPanel + Sidebar state machine (controls/running/complete) |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/hooks/useReasoningStream.ts` exists | FOUND |
| `src/components/Sidebar/StreamPanel.tsx` exists | FOUND |
| Commit `9e0bccc` (Task 1) | FOUND |
| Commit `46df5b7` (Task 2) | FOUND |
