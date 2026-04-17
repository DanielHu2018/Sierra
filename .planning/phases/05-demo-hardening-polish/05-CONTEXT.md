# Phase 5: Demo Hardening & Polish - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Every possible judge interaction — bad inputs, slow networks, missing data — results in a graceful recovery, not a crash or blank screen. The app is deployed and ADA-compliant. Phase 5 is a hard feature freeze: no new features, only hardening what Phases 1–4 delivered.

**Requirements:** DATA-03, DATA-04, DATA-05, DATA-06

</domain>

<decisions>
## Implementation Decisions

### Error UX — Out-of-Bounds Pins (DATA-03)
- **Validation method:** ERCOT bounding box check (`[-106.6, 25.8, -93.5, 36.5]`) — simple rect, no turf.js dependency
- **Error display:** Map popup at the clicked location — small tooltip-style popup: "Outside ERCOT coverage area." Auto-dismisses after ~3 seconds
- **Pin behavior:** Invalid pin is never placed; no state change in Zustand; no sidebar update required

### Error UX — Server/API Failures (DATA-04)
- **Claude API failure:** Silent canned fallback (decided in Phase 3) — no visible indicator
- **Full server-down (`/api/route` unreachable):** Sidebar shows a persistent error state — "Route generation failed. Please retry." with a Retry button. Never a blank screen, never a crash.
- **GeoJSON overlay load failure:** Silent skip — layer simply doesn't render; toggle switch stays functional but does nothing; no error toast shown

### Mock Data Footnotes (DATA-05)
- **On the map:** Small `label-xs` text anchored bottom-left of the map canvas (above Mapbox attribution): "ⓘ Illustrative mock data — for demonstration purposes only." Persistent and unobtrusive.
- **In the PDF:** Slim footer on every page alongside the page number: "ⓘ Illustrative mock data — for demonstration purposes only."
- **Wording (both):** "ⓘ Illustrative mock data — for demonstration purposes only." — short, professional, single line.

### ADA Compliance (DATA-06)
- **Target:** WCAG AA only — contrast ratio ≥4.5:1 for normal text, ≥3:1 for large text and UI components (route line strokes count as UI components)
- **Scope:** Color and contrast audit only — no screen reader ARIA labels, no keyboard nav work beyond what React provides by default. Judges are sighted developers on desktop.
- **Heatmap gradient:** Switch from green→red to blue→red to eliminate red-green colorblindness issue. Blue: `#3291FF` (low friction) → Red: `#FF4444` (high friction). Add a small map legend: "Low Friction / High Friction."
- **Route colors:** Locked from Phase 1 (`#A7C8FF`, `#FFBC7C`, `#E8B3FF`) — audit these against `#131313` background for WCAG AA compliance; adjust only if they fail.

### Production Deploy
- **Architecture:** Two-service deploy — Vite frontend on Vercel, Express server on Railway
- **Env vars (Vercel):** `VITE_API_URL=https://[railway-url]` — frontend uses this for all `/api/*` calls instead of the Vite dev proxy
- **Env vars (Railway):** `MAPBOX_TOKEN`, `ANTHROPIC_API_KEY`
- **Server URL wiring:** `VITE_API_URL` env var in Vercel; no Railway URL hardcoded in source
- **Cache pre-warm:** Express reads `graph.json` and `friction_cache.json` into memory during startup (alongside RAG index) — first route request is instant; no cold-read latency on first judge interaction
- **Deploy trigger:** Both services deploy from the same monorepo; Vercel watches `/` (or `/src`), Railway watches `/server`

### Claude's Discretion
- Exact popup styling for the out-of-bounds error (match design system glassmorphism — tooltip card)
- Whether Retry button re-fires the original `POST /api/route` request or prompts the user to click Run Simulation again
- Specific contrast ratio audit tool/approach (manual calc or a11y library)
- Railway vs Render as Railway backup if Railway has issues at demo time
- Exact Mapbox heatmap layer `stops` values for the blue→red gradient

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/MapCanvas/MapCanvas.tsx` — out-of-bounds popup and mock data footnote text overlay both attach here
- `src/components/Sidebar/Sidebar.tsx` — server-down error state lives in the sidebar's state machine (new `error` state alongside `controls → stream → results`)
- `src/components/MapCanvas/OverlayLayers.tsx` — heatmap gradient updated here (blue→red stops)
- `src/store/useAppStore.ts` — `simulationStatus` already has `'error'` value in the type; use it to trigger sidebar error state
- `src/types.ts` — `AppState.simulationStatus: 'idle' | 'running' | 'complete' | 'error'` — `'error'` case wires to sidebar error state

### Established Patterns
- Glassmorphism for floating map elements (`rgba(28,27,27,0.6)`, `blur(12px)`) — apply to out-of-bounds popup
- Dark design system — footnote text uses `on-surface-variant` (`#C1C6D7`) at `label-xs` size
- Zustand `simulationStatus` drives sidebar state machine — `'error'` state already typed; Phase 5 implements its UI
- Silent fallback pattern (Phase 3) — Claude failures never surface to user; server-down is the one visible error state

### Integration Points
- Out-of-bounds check: fires in the map click handler (in `MapCanvas.tsx` or `PinMarkers.tsx`) before Zustand pin state is updated
- Server-down error state: fires in the `POST /api/route` catch block (currently unhandled in Phase 3 — Phase 5 adds the `simulationStatus = 'error'` dispatch here)
- GeoJSON silent skip: in `OverlayLayers.tsx` fetch/load logic — wrap in try/catch, log warning, continue rendering
- Footnote text: absolutely positioned element inside the map container div; z-index above map, below controls
- `VITE_API_URL`: all `fetch('/api/...')` calls need to read `import.meta.env.VITE_API_URL ?? ''` as the base URL prefix

</code_context>

<specifics>
## Specific Ideas

- The out-of-bounds popup should feel like Mapbox's own tooltip style (glassmorphism card, not a browser alert)
- The mock data footnote sits just above the Mapbox attribution line at bottom-left — small, `label-xs`, `on-surface-variant` color — barely visible unless you look for it
- Blue→red heatmap gradient should still look hot/cold directionally; the visual drama matters for judges even if red-green is avoided
- VITE_API_URL approach means the Vite proxy config (`vite.config.ts`) only applies in development — production calls go directly to Railway URL

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-demo-hardening-polish*
*Context gathered: 2026-04-16*
