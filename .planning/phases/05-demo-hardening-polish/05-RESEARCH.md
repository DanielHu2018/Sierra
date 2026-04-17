# Phase 5: Demo Hardening & Polish - Research

**Researched:** 2026-04-16
**Domain:** Error handling, ADA/WCAG contrast, production deployment (Vercel + Railway), Mapbox heatmap gradient
**Confidence:** HIGH

## Summary

Phase 5 is a feature-freeze hardening pass over an existing Vite + React + Mapbox GL JS (react-map-gl v8) app. All four requirements are surgical: add one map popup, wire one error state, add two text overlays, change one heatmap gradient, audit contrast, and configure production deploy. No new architectural patterns are needed — the existing Zustand store, glassmorphism design system, and react-map-gl Popup component cover every requirement.

The contrast audit (done inline below) confirms all three route colors and both heatmap endpoint colors already pass WCAG AA against the `#131313` background with significant margin. The only contrast change needed is the heatmap gradient swap (green→red to blue→red), which was already decided. No route color changes are required.

The production deploy is a two-service split: Vite static build to Vercel, Express server to Railway. The key integration point is `VITE_API_URL` — every `fetch('/api/...')` call must be prefixed with `import.meta.env.VITE_API_URL ?? ''` so production calls reach Railway instead of the Vite dev proxy.

**Primary recommendation:** Implement in four independent streams — (1) out-of-bounds popup in MapCanvas, (2) server-error state in Sidebar + store, (3) mock data footnote overlay + PDF footer, (4) heatmap gradient + legend — then deploy.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Error UX — Out-of-Bounds Pins (DATA-03)**
- Validation method: ERCOT bounding box check (`[-106.6, 25.8, -93.5, 36.5]`) — simple rect, no turf.js dependency
- Error display: Map popup at the clicked location — small tooltip-style popup: "Outside ERCOT coverage area." Auto-dismisses after ~3 seconds
- Pin behavior: Invalid pin is never placed; no state change in Zustand; no sidebar update required

**Error UX — Server/API Failures (DATA-04)**
- Claude API failure: Silent canned fallback (decided in Phase 3) — no visible indicator
- Full server-down (`/api/route` unreachable): Sidebar shows a persistent error state — "Route generation failed. Please retry." with a Retry button. Never a blank screen, never a crash.
- GeoJSON overlay load failure: Silent skip — layer simply doesn't render; toggle switch stays functional but does nothing; no error toast shown

**Mock Data Footnotes (DATA-05)**
- On the map: Small `label-xs` text anchored bottom-left of the map canvas (above Mapbox attribution): "ⓘ Illustrative mock data — for demonstration purposes only." Persistent and unobtrusive.
- In the PDF: Slim footer on every page alongside the page number: "ⓘ Illustrative mock data — for demonstration purposes only."
- Wording (both): "ⓘ Illustrative mock data — for demonstration purposes only." — short, professional, single line.

**ADA Compliance (DATA-06)**
- Target: WCAG AA only — contrast ratio ≥4.5:1 for normal text, ≥3:1 for large text and UI components (route line strokes count as UI components)
- Scope: Color and contrast audit only — no screen reader ARIA labels, no keyboard nav work beyond what React provides by default.
- Heatmap gradient: Switch from green→red to blue→red. Blue: `#3291FF` (low friction) → Red: `#FF4444` (high friction). Add a small map legend: "Low Friction / High Friction."
- Route colors: Locked from Phase 1 (`#A7C8FF`, `#FFBC7C`, `#E8B3FF`) — audit these against `#131313` background for WCAG AA compliance; adjust only if they fail.

**Production Deploy**
- Architecture: Two-service deploy — Vite frontend on Vercel, Express server on Railway
- Env vars (Vercel): `VITE_MAPBOX_TOKEN`, `VITE_API_URL=https://[railway-url]`
- Env vars (Railway): `MAPBOX_TOKEN`, `ANTHROPIC_API_KEY`
- Server URL wiring: `VITE_API_URL` env var in Vercel; no Railway URL hardcoded in source
- Cache pre-warm: Express reads `graph.json` and `friction_cache.json` into memory during startup
- Deploy trigger: Both services deploy from the same monorepo; Vercel watches `/` (or `/src`), Railway watches `/server`

### Claude's Discretion
- Exact popup styling for the out-of-bounds error (match design system glassmorphism — tooltip card)
- Whether Retry button re-fires the original `POST /api/route` request or prompts the user to click Run Simulation again
- Specific contrast ratio audit tool/approach (manual calc or a11y library)
- Railway vs Render as Railway backup if Railway has issues at demo time
- Exact Mapbox heatmap layer `stops` values for the blue→red gradient

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-03 | Out-of-bounds pin placement shows a graceful error state (not a crash or blank screen) | react-map-gl Popup component renders at clicked lng/lat; React `setTimeout` + state flag drives auto-dismiss; bounding box check runs before Zustand setSourcePin/setDestinationPin |
| DATA-04 | Missing or unavailable data shows a graceful fallback — no dead ends during demo | `simulationStatus: 'error'` already typed in AppState; sidebar renders new error branch; GeoJSON fetch wrapped in try/catch with silent continue |
| DATA-05 | All mock data is visually marked as such (small footnote on map and PDF) | Absolutely-positioned div inside map container; PDF footer via existing jsPDF/Puppeteer page footer API (Phase 4 PDF pipeline) |
| DATA-06 | ADA-compliant color/contrast for all route colors, overlays, and heatmap | All 3 route colors pass WCAG AA at >10:1 against #131313 (verified inline); heatmap endpoint colors #3291FF (5.87:1) and #FF4444 (5.45:1) both pass; gradient swap is the only change needed |
</phase_requirements>

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| react-map-gl | 8.1.1 | Popup, Source, Layer components | `Popup` component handles out-of-bounds tooltip |
| mapbox-gl | 3.21.0 | Heatmap layer paint properties | `heatmap-color` interpolate expression |
| zustand | 5.0.12 | simulationStatus state machine | `'error'` value already typed |
| vitest | 4.1.4 | Test runner | jsdom env, setup at `src/test/setup.ts` |

### No New Dependencies Required
All requirements can be satisfied with the existing stack. No new packages to install.

**WCAG audit approach:** Inline calculation using the standard luminance formula — no library needed. Calculations done below confirm all colors pass.

## Contrast Audit Results (HIGH confidence — computed)

Computed contrast against `#131313` background using WCAG relative luminance formula:

| Color | Hex | Ratio | WCAG AA Normal Text (4.5:1) | WCAG AA UI Component (3:1) |
|-------|-----|-------|-----------------------------|---------------------------|
| Route A (blue) | `#A7C8FF` | **10.93:1** | PASS | PASS |
| Route B (orange) | `#FFBC7C` | **11.27:1** | PASS | PASS |
| Route C (purple) | `#E8B3FF` | **10.90:1** | PASS | PASS |
| Heatmap low (blue) | `#3291FF` | **5.87:1** | PASS | PASS |
| Heatmap high (red) | `#FF4444` | **5.45:1** | PASS | PASS |
| Footnote text | `#C1C6D7` | **10.91:1** | PASS | PASS |

**Conclusion:** Route colors require NO adjustment. Heatmap gradient swap (green→red to blue→red) is the only color change required, and the new colors pass comfortably.

## Architecture Patterns

### Pattern 1: Out-of-Bounds Popup (DATA-03)

**What:** Bounding-box check fires inside `handleClick` in `MapCanvas.tsx` before Zustand state is mutated. If the click falls outside the ERCOT rect, a React state flag shows a `<Popup>` at the clicked coordinates. A `setTimeout` of 3000ms clears the flag (auto-dismiss). Pin state is never set.

**Location:** `src/components/MapCanvas/MapCanvas.tsx`

**Key pattern:**
```typescript
// Source: react-map-gl Popup API (visgl.github.io/react-map-gl/docs/api-reference/mapbox/popup)
const ERCOT_BOUNDS = { minLng: -106.6, minLat: 25.8, maxLng: -93.5, maxLat: 36.5 };

const [oobPopup, setOobPopup] = useState<{ lng: number; lat: number } | null>(null);

const handleClick = useCallback((e: MapLayerMouseEvent) => {
  const { lng, lat } = e.lngLat;
  const inBounds =
    lng >= ERCOT_BOUNDS.minLng && lng <= ERCOT_BOUNDS.maxLng &&
    lat >= ERCOT_BOUNDS.minLat && lat <= ERCOT_BOUNDS.maxLat;
  if (!inBounds) {
    setOobPopup({ lng, lat });
    setTimeout(() => setOobPopup(null), 3000);
    return; // ← early return; Zustand never touched
  }
  // existing pin placement logic...
}, [sourcePin, destinationPin, setSourcePin, setDestinationPin]);

// In JSX, inside <Map>:
{oobPopup && (
  <Popup
    longitude={oobPopup.lng}
    latitude={oobPopup.lat}
    closeButton={false}
    closeOnClick={false}
    anchor="bottom"
    onClose={() => setOobPopup(null)}
  >
    <div style={{ /* glassmorphism card styles */ }}>
      Outside ERCOT coverage area.
    </div>
  </Popup>
)}
```

**Glassmorphism card style** (matches existing design system):
```typescript
{
  background: 'rgba(28,27,27,0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.5rem',
  padding: '8px 12px',
  color: '#C1C6D7',
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
  whiteSpace: 'nowrap',
}
```

**react-map-gl Popup props (HIGH confidence — official docs):**
- `longitude`, `latitude` — required, positions popup
- `closeButton={false}` — removes X button for tooltip feel
- `closeOnClick={false}` — prevents accidental dismiss on map click
- `onClose` — fires when native close triggers (e.g., Escape key); wire to `setOobPopup(null)`
- `anchor="bottom"` — tip points down to the clicked location

### Pattern 2: Server-Down Error State (DATA-04)

**What:** The `POST /api/route` catch block dispatches `simulationStatus = 'error'` to Zustand. Sidebar renders a new `error` branch showing the retry message. GeoJSON fetch failures are silently swallowed.

**Locations:**
- Error dispatch: wherever `POST /api/route` is called (Phase 3, likely in `Sidebar.tsx` or a custom hook)
- Error UI: `src/components/Sidebar/Sidebar.tsx` — new conditional branch
- GeoJSON silent skip: `src/components/MapCanvas/OverlayLayers.tsx`

**Server-down pattern:**
```typescript
// In the POST /api/route fetch call (Phase 3 location):
try {
  const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/route`, { ... });
  if (!res.ok) throw new Error('route-failed');
  // handle success...
} catch {
  useAppStore.getState().setSimulationStatus('error');
}
```

**Sidebar error branch:**
```tsx
// simulationStatus === 'error' renders this instead of results:
<div style={{ padding: '16px 20px' }}>
  <p style={{ color: '#C1C6D7', fontSize: 13, marginBottom: 12 }}>
    Route generation failed. Please retry.
  </p>
  <button onClick={handleRetry} style={{ /* primary button style */ }}>
    Retry
  </button>
</div>
```

**Retry behavior (Claude's discretion):** Reset `simulationStatus` to `'idle'` so the user can click Run Simulation again. Do NOT re-fire POST automatically — keeps the UX deterministic and avoids hidden retry loops.

**GeoJSON silent skip pattern:**
```typescript
// In OverlayLayers.tsx — when switching from URL-string data to fetched data:
// The react-map-gl Source component's onError callback absorbs failures:
<Source
  id="ercot-grid-source"
  type="geojson"
  data={ERCOT_DATA_URL}
  onError={(e) => console.warn('ERCOT overlay failed to load', e)}
>
```
Note: react-map-gl `<Source>` with a URL `data` prop already handles fetch errors gracefully — the layer simply doesn't render. A `console.warn` in `onError` (if the prop is exposed) is sufficient. No user-visible toast is shown.

### Pattern 3: Mock Data Footnote (DATA-05)

**What:** Absolutely-positioned text overlay in the map container. The map container is the `<Map>` component's wrapping `<div>` — child elements inside `<Map>` that are NOT react-map-gl layer components render as standard DOM elements over the canvas.

**Location:** `src/components/MapCanvas/MapCanvas.tsx` — sibling to `<PinMarkers>` inside `<Map>`

```tsx
{/* Inside <Map> JSX — renders as DOM overlay, not GL layer */}
<div
  style={{
    position: 'absolute',
    bottom: 30,   // above Mapbox attribution bar (~24px tall)
    left: 10,
    zIndex: 1,
    color: '#C1C6D7',    // on-surface-variant
    fontFamily: 'Inter, sans-serif',
    fontSize: 10,        // label-xs
    pointerEvents: 'none',
    userSelect: 'none',
  }}
>
  ⓘ Illustrative mock data — for demonstration purposes only.
</div>
```

**PDF footer:** Handled in the Phase 4 PDF pipeline (server-side). The PDF generation code (jsPDF or Puppeteer) adds a footer on each page. Phase 5 ensures the wording "ⓘ Illustrative mock data — for demonstration purposes only." is added alongside the page number. The exact implementation depends on what Phase 4 built — this is a one-line addition to the footer render loop.

### Pattern 4: Heatmap Gradient Swap (DATA-06)

**What:** Update `heatmap-color` paint property in `OverlayLayers.tsx` from green→red to blue→red. Add a small legend div.

**Location:** `src/components/MapCanvas/OverlayLayers.tsx`

```typescript
// Source: Mapbox GL JS heatmap-layer docs (docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/)
// Replaces existing green→red gradient
const frictionHeatmapStyle: LayerProps = {
  id: 'friction-heatmap',
  type: 'heatmap',
  paint: {
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,   'rgba(0,0,0,0)',        // transparent at zero density
      0.1, '#3291FF',              // low friction (blue)
      0.5, '#9B6FFF',              // mid (violet transition)
      1,   '#FF4444',              // high friction (red)
    ],
    'heatmap-radius': 20,
    'heatmap-intensity': 1,
    'heatmap-opacity': 0.7,
  },
};
```

**Legend overlay** (inside `<Map>` JSX, similar to footnote pattern):
```tsx
{overlays.frictionHeatmap && (
  <div style={{
    position: 'absolute',
    bottom: 50,
    right: 10,
    zIndex: 1,
    background: 'rgba(28,27,27,0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.375rem',
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    pointerEvents: 'none',
  }}>
    <span style={{ color: '#3291FF', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>Low Friction</span>
    <div style={{ width: 48, height: 6, borderRadius: 3, background: 'linear-gradient(to right, #3291FF, #FF4444)' }} />
    <span style={{ color: '#FF4444', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>High Friction</span>
  </div>
)}
```

### Pattern 5: VITE_API_URL Wiring

**What:** All `fetch('/api/...')` calls across the codebase must use `import.meta.env.VITE_API_URL ?? ''` as a URL prefix. In dev, `VITE_API_URL` is unset (empty string) so the Vite proxy handles it. In production, `VITE_API_URL=https://[railway-url]` so calls go directly to Railway.

**Search pattern to find all API calls:**
```
grep -r "fetch('/api" src/
grep -r 'fetch(`/api' src/
```

**Pattern:**
```typescript
// Before:
await fetch('/api/route', { method: 'POST', ... })
// After:
await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/route`, { method: 'POST', ... })
```

### Pattern 6: Production Deploy Config

**Vercel (frontend):**
- Build command: `npm run build` (or `tsc -b && vite build` from root)
- Output directory: `dist`
- Root directory: `/` (repo root, since Vite config is at root)
- Environment variables: `VITE_MAPBOX_TOKEN`, `VITE_API_URL`

**Railway (server):**
- Root directory: `/server` (the Express subdirectory)
- Start command: `node index.js` (or whatever Phase 3/4 established)
- Environment variables: `MAPBOX_TOKEN`, `ANTHROPIC_API_KEY`, `PORT` (Railway auto-sets)

**Cache pre-warm in Express startup:**
```typescript
// server/index.ts — load heavy assets once at startup, not per-request
import graphData from './data/graph.json' assert { type: 'json' };
import frictionCache from './data/friction_cache.json' assert { type: 'json' };
// These are now in memory; route handler reads from module scope
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Map popup tooltip | Custom DOM tooltip positioned relative to map coords | `react-map-gl <Popup>` | Handles coordinate projection, viewport edges, anchor positioning automatically |
| Contrast ratio math | Custom hex parser + luminance calc from scratch | Inline 10-line calculation (already proven below) or WebAIM | WCAG formula is simple; no library needed for a one-time audit |
| Auto-dismiss timer | Complex interval management | `setTimeout` + React state boolean | Simple state flag + timeout is correct; no cleanup needed for 3s dismiss |

## Common Pitfalls

### Pitfall 1: Popup Renders Outside Map After Scroll/Resize
**What goes wrong:** Positioning a custom `<div>` at absolute coords rather than using `<Popup longitude lat>` means the tooltip doesn't move when the map pans.
**Why it happens:** DOM overlay divs don't track map projection.
**How to avoid:** Use `react-map-gl <Popup>` for the out-of-bounds tooltip (it tracks map coordinates). Use DOM overlay divs only for static labels (footnote, legend) that don't need to track a geographic point.

### Pitfall 2: GeoJSON Fetch Failure Throws Uncaught Exception
**What goes wrong:** `OverlayLayers.tsx` currently passes URL strings directly to `<Source data={URL}>`. If the file is missing (404), react-map-gl logs a warning internally but does not throw. However, if Phase 2/3 switched to manual `fetch()` + `setData()`, an unhandled rejection will surface.
**How to avoid:** Keep the URL-string `data` prop pattern (`<Source data="/data/ercot-grid.geojson">`). react-map-gl handles fetch failures silently. If manual fetch is used, wrap in try/catch with console.warn only.

### Pitfall 3: VITE_API_URL Missing in Vercel Breaks All API Calls
**What goes wrong:** `import.meta.env.VITE_API_URL` returns `undefined` in production if the env var was not set in Vercel dashboard. The fetch becomes `fetch('undefined/api/route')`.
**How to avoid:** The `?? ''` fallback handles dev (empty string = relative path via Vite proxy). For production, explicitly set `VITE_API_URL` in Vercel project settings before first deploy. Test with `curl https://[vercel-url]/api/route` to confirm it reaches Railway.

### Pitfall 4: react-map-gl Popup Appears Behind Other Map Overlays
**What goes wrong:** Default z-index of Popup is lower than some custom overlay divs.
**How to avoid:** react-map-gl Popup renders in Mapbox's own overlay container, which stacks above GL layers but may be below custom `position:absolute` DOM elements. The glassmorphism card for the footnote and legend must have a lower z-index than the Popup, or be placed inside `<Map>` as children (which share the same stacking context correctly).

### Pitfall 5: Mapbox Attribution Bar Obscures Footnote
**What goes wrong:** The Mapbox attribution is ~24px tall. A footnote at `bottom: 0` will overlap it.
**How to avoid:** Use `bottom: 30` for the footnote overlay to clear the attribution bar (24px bar + 6px gap).

### Pitfall 6: Railway Cold Start on First Judge Interaction
**What goes wrong:** Railway spins down free-tier services after inactivity. First request takes 5–15s.
**How to avoid:** Pre-warm the server by hitting any endpoint (e.g., `GET /health`) immediately after deploy. If Railway's hobby tier is used, configure a cron-based keep-alive ping. Alternatively, keep the Railway service running by upgrading to a paid plan for the demo window.

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual DOM popup positioning | `react-map-gl <Popup>` component | Automatic coordinate tracking, edge collision |
| Green→red heatmap (colorblind-inaccessible) | Blue→red with WCAG-passing endpoints | Eliminates red-green colorblindness barrier |
| Vite proxy for all API calls | `VITE_API_URL` prefix with `?? ''` fallback | Works in both dev (proxy) and production (direct) |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `vitest.config.ts` (repo root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-03 | `handleClick` with out-of-bounds coords does NOT call setSourcePin/setDestinationPin | unit | `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` | ❌ Wave 0 |
| DATA-03 | `handleClick` with out-of-bounds coords sets oobPopup state | unit | `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` | ❌ Wave 0 |
| DATA-03 | `handleClick` with in-bounds coords calls setSourcePin | unit | `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` | ✅ (extend existing) |
| DATA-04 | simulationStatus='error' renders Sidebar error branch | unit | `npx vitest run src/components/Sidebar/Sidebar.test.tsx` | ❌ Wave 0 |
| DATA-04 | simulationStatus='error' branch renders Retry button | unit | `npx vitest run src/components/Sidebar/Sidebar.test.tsx` | ❌ Wave 0 |
| DATA-05 | Map footnote text is present in MapCanvas render | unit | `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` | ❌ Wave 0 |
| DATA-06 | Route color contrast ratios pass WCAG AA (static assertion) | unit | `npx vitest run src/utils/contrast.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/MapCanvas/MapCanvas.test.tsx` — extend existing file with DATA-03 bounds check tests and DATA-05 footnote test
- [ ] `src/components/Sidebar/Sidebar.test.tsx` — new file covering DATA-04 error state branch
- [ ] `src/utils/contrast.test.ts` — new file with static WCAG AA assertions for all route/heatmap colors

## Open Questions

1. **Phase 4 PDF footer API**
   - What we know: Phase 4 builds a server-side PDF with jsPDF or Puppeteer
   - What's unclear: Which library and which footer API (jsPDF `doc.text()` at fixed y-coord vs Puppeteer `footerTemplate` HTML)
   - Recommendation: Planner should note that DATA-05 PDF footer is a 1–2 line addition to Phase 4's page render loop; the exact call depends on what Phase 4 built

2. **Phase 3 fetch location**
   - What we know: `POST /api/route` is initiated somewhere in Phase 3 code (Sidebar or a custom hook)
   - What's unclear: Exact file/function name until Phase 3 is implemented
   - Recommendation: Phase 5 plan should instruct the implementer to locate the fetch call by searching for `POST.*api/route` and add the error dispatch there

3. **Railway cold-start risk**
   - What we know: Free-tier Railway services sleep after inactivity
   - What's unclear: Whether the project uses free or paid Railway tier
   - Recommendation: Add a `/health` GET endpoint to the Express server and document a manual pre-warm step in the deploy checklist

## Sources

### Primary (HIGH confidence)
- react-map-gl Popup API — https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/popup
- Mapbox GL JS heatmap-layer example — https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/
- Railway monorepo deploy guide — https://docs.railway.com/guides/deploying-a-monorepo
- WCAG contrast formula — computed locally using standard relative luminance formula

### Secondary (MEDIUM confidence)
- Vercel monorepo docs — https://vercel.com/docs/monorepos
- WCAG 2.0 contrast requirements — https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast

### Tertiary (LOW confidence)
- None — all findings verified against official sources

## Metadata

**Confidence breakdown:**
- DATA-03 out-of-bounds popup: HIGH — react-map-gl Popup API verified, bounding box logic is trivial
- DATA-04 error state: HIGH — simulationStatus='error' already typed in AppState; sidebar pattern is standard React conditional rendering
- DATA-05 footnote overlay: HIGH — DOM child of react-map-gl Map component is standard pattern; PDF footer depends on Phase 4 implementation details (MEDIUM for PDF portion)
- DATA-06 contrast audit: HIGH — computed inline with verified WCAG formula; all colors pass
- Production deploy: MEDIUM-HIGH — Railway + Vercel split deploy is well-documented; Railway cold-start risk is a real concern for demo day

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable APIs; harden closer to demo if Railway free tier behavior changes)
