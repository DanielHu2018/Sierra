# Phase 1: Foundation & Map Canvas - Research

**Researched:** 2026-04-16
**Domain:** React + Vite + Mapbox GL JS v3 + react-map-gl v8 + Zustand v5 + Tailwind CSS v4
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Map library:** Mapbox GL JS v3 (locked by MAP-01) — use `mapbox-gl` npm package
- **Framework:** React + TypeScript (implied by `types.ts` contract in DATA-02)
- **Build tool:** Vite (standard for React hackathon stacks; fast HMR)
- **Styling:** Tailwind CSS utility classes for layout; CSS custom properties for the design token colors
- **Full-screen map** as the primary canvas occupying 100vw × 100vh (`background` color: `#131313`)
- **Left sidebar HUD** — floating panel, detached `1rem` from left edge, `1rem` from top/bottom, `border-radius: 0.75rem`. Background: `surface-container-low` (`#1C1B1B`). Width: ~320px.
- **No borders between sections** — tonal layering only
- **Floating map controls** (zoom, recenter, layers) anchored to bottom-right. Glassmorphism: `rgba(28,27,27,0.6)` + `backdrop-filter: blur(12px)`
- **Baselayers:** Satellite (`satellite-streets-v12`) and Terrain (`outdoors-v12`), default: Satellite
- **Initial map center:** `[-99.9018, 31.9686]`, zoom: ~6
- **Design system colors, typography, and component specs** are locked (see CONTEXT.md `## Implementation Decisions`)
- **shared types.ts contract** must be created at `/src/types.ts` with exact `RouteResult` and `AppState` interfaces as specified
- **"Run Simulation" button** disabled in Phase 1 (engine not built yet)
- **GeoJSON overlay files** loaded from `/public/data/` — must be pre-simplified with mapshaper ≤10%
- **Friction heatmap** is a placeholder in Phase 1 — toggle switch exists, renders nothing

### Claude's Discretion
- State management library (Zustand vs React Context — Zustand recommended for map + sidebar sync)
- File/folder structure within `/src`
- Specific Mapbox style IDs for satellite/terrain
- How overlay GeoJSON mock data is structured (exact feature count, coordinate precision)
- Whether `react-map-gl` wrapper is used or raw `mapbox-gl` imperative API
- Pin click-to-drop vs toolbar-then-click UX flow (either works; pick one)

### Deferred Ideas (OUT OF SCOPE)
- Friction heatmap actual data rendering (Phase 2)
- Route lines on map (Phase 3)
- Results dashboard cards with real metrics (Phase 3)
- Hover justification popups (Phase 3)
- "Run Simulation" enabled + progress animation (Phase 3)
- PDF export functionality (Phase 4)
- Error state for out-of-bounds pins (Phase 3)
- ADA color/contrast audit (Phase 5)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAP-01 | Full-screen Texas map on load with satellite and terrain baselayer options (Mapbox GL JS v3, no login) | react-map-gl v8 `<Map mapStyle=...>` with `satellite-streets-v12` default; `NavigationControl` + custom layer switcher |
| MAP-02 | Drop Source pin by clicking map; label appears, map recenters | `<Map onClick>` handler → Zustand store → `<Marker>` component + `mapRef.current.flyTo()` |
| MAP-03 | Drop Destination pin by clicking map; label appears, map recenters; `fitBounds` on second pin | Same pattern as MAP-02; call `mapRef.current.fitBounds()` after second pin set |
| MAP-04 | Toggle ERCOT grid overlay on/off | `<Source>` + `<Layer>` with `layout: { visibility }` driven by Zustand `overlays.ercotGrid` |
| MAP-05 | Toggle land boundary overlay on/off | Same pattern, `overlays.landBoundary` |
| MAP-06 | Toggle wildlife habitat overlay on/off | Same pattern, `overlays.wildlifeHabitat` |
| MAP-07 | Toggle topography overlay on/off | Same pattern, `overlays.topography` |
| MAP-08 | All overlay GeoJSON pre-simplified (mapshaper ≤10%) to prevent browser freeze | Offline mapshaper CLI processing before committing to `/public/data/`; no runtime concern |
| DATA-01 | All geospatial layers use static/mock GeoJSON — no live API calls | GeoJSON files in `/public/data/`, fetched via `fetch()` or imported as JSON modules |
| DATA-02 | Shared types.ts data contract defines route result shape | Create `/src/types.ts` with exact `RouteResult` and `AppState` interfaces from CONTEXT.md |
| CTRL-01 | Cost vs. Risk priority toggle chips | Controlled UI component bound to Zustand `priority` field (`'cost' \| 'risk' \| 'balanced'`) — two chip toggles |
| CTRL-02 | Co-Location preference toggle | Toggle switch component bound to Zustand `constraints.coLocation` |
| CTRL-03 | Eminent Domain avoidance toggle | Toggle switch component bound to `constraints.eminentDomainAvoidance` |
| CTRL-04 | Ecology Avoidance toggle | Toggle switch component bound to `constraints.ecologyAvoidance` |
| CTRL-05 | Voltage type selector | Radio group bound to Zustand `voltage` field; three options |
</phase_requirements>

---

## Summary

Phase 1 is a pure frontend scaffolding phase: no routing logic, no AI, no server. The deliverable is a fully interactive map canvas with sidebar controls that look and function exactly as the final product will, using stub/disabled state for anything that requires Phase 2+ engine work.

The recommended approach uses **react-map-gl v8** (the `react-map-gl/mapbox` endpoint) as a thin React wrapper over **mapbox-gl v3**, rather than raw imperative Mapbox GL JS. This gives declarative `<Source>`, `<Layer>`, and `<Marker>` components for the overlay toggle and pin patterns, while still exposing the native map instance via `mapRef` for imperative calls (`flyTo`, `fitBounds`). State is managed entirely by a **Zustand v5** store that holds the `AppState` shape defined in `types.ts`. **Tailwind CSS v4** with the `@tailwindcss/vite` plugin handles layout utility classes; design token colors (non-Tailwind values like `#131313`, `#1C1B1B`) are implemented as CSS custom properties.

The project is a fresh Vite scaffold. No existing test infrastructure exists, so Vitest + React Testing Library must be set up in Wave 0 before implementation tests are written. Mapbox GL JS requires special mocking in the jsdom test environment since it depends on WebGL and `createObjectURL`, both unavailable in Node.

**Primary recommendation:** Use `react-map-gl/mapbox` v8 + `mapbox-gl` v3 + Zustand v5 + Tailwind v4 + Vite v8. Build the Zustand store first (it defines `AppState`), then the map canvas, then the sidebar, then wire the overlay layers.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mapbox-gl | 3.21.0 | Map engine (tiles, rendering, WebGL) | Locked by MAP-01; only library with Mapbox satellite+terrain styles |
| react-map-gl | 8.1.1 | React wrapper for mapbox-gl | Provides declarative `<Map>`, `<Source>`, `<Layer>`, `<Marker>` — avoids imperative DOM management |
| react | 18.x | UI framework | Project decision |
| typescript | 5.x | Type safety; required for types.ts contract | Project decision |
| vite | 8.0.8 | Build tool with fast HMR | Project decision |
| zustand | 5.0.12 | Client state management | Recommended in CONTEXT.md; no Provider boilerplate; syncs map+sidebar without prop drilling |
| tailwindcss | 4.2.2 | Layout utility classes | Project decision |
| @tailwindcss/vite | 4.2.2 | Vite plugin for Tailwind v4 (replaces PostCSS+Autoprefixer) | Required by Tailwind v4 — no tailwind.config.js needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/geojson | 7946.0.16 | TypeScript types for GeoJSON spec | Required for `RouteResult.geometry` and overlay data typing |
| @vitejs/plugin-react | 6.0.1 | React fast refresh in Vite | Standard Vite+React scaffold |
| vitest | 4.1.4 | Unit test runner | jsdom environment + vi.mock for mapbox-gl |
| @testing-library/react | 16.3.2 | Component testing utilities | Testing sidebar controls and state transitions |
| @testing-library/user-event | latest | Simulates user interactions | Toggle clicks, radio selections |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-map-gl | Raw mapbox-gl imperative API | Raw API gives more control but requires manual DOM management, ref juggling, and lifecycle cleanup in useEffect — react-map-gl handles all of this |
| Zustand | React Context + useReducer | Context causes full tree re-renders on every state change; Zustand subscriptions are granular — critical when map re-renders on every drag |
| Tailwind CSS v4 | Tailwind CSS v3 | v4 setup is slightly different (no tailwind.config.js by default, uses `@import "tailwindcss"`) but is the current standard |

**Installation:**
```bash
npm create vite@latest sierra -- --template react-ts
cd sierra
npm install mapbox-gl react-map-gl zustand @types/geojson
npm install tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── types.ts              # Shared RouteResult + AppState contract (DATA-02)
├── store/
│   └── useAppStore.ts    # Zustand store — single source of truth for AppState
├── components/
│   ├── MapCanvas/
│   │   ├── MapCanvas.tsx          # <Map> root, onClick handler, fitBounds logic
│   │   ├── PinMarkers.tsx         # <Marker> for source/destination pins
│   │   ├── OverlayLayers.tsx      # <Source>+<Layer> for 4 GeoJSON overlays
│   │   └── MapControls.tsx        # Floating zoom/recenter/baselayer panel (bottom-right)
│   ├── Sidebar/
│   │   ├── Sidebar.tsx            # Container: sections in order
│   │   ├── PinPlacementSection.tsx
│   │   ├── VoltageSection.tsx
│   │   ├── RoutePrioritySection.tsx
│   │   ├── ConstraintsSection.tsx
│   │   └── OverlaysSection.tsx
│   ├── TopNav/
│   │   └── TopNav.tsx             # Header bar with nav + right controls
│   └── ui/
│       ├── ToggleSwitch.tsx       # Reusable toggle switch component
│       ├── RadioGroup.tsx         # Reusable radio group
│       └── ChipToggle.tsx         # Reusable chip/pill toggle
├── data/
│   └── mockGeoJson.ts             # Type-safe re-exports of /public/data/* (optional)
└── main.tsx                       # App entry; import 'mapbox-gl/dist/mapbox-gl.css'
public/
└── data/
    ├── ercot-grid.geojson
    ├── land-boundary.geojson
    ├── wildlife-habitat.geojson
    └── topography.geojson
```

### Pattern 1: react-map-gl Map with onClick Pin Placement
**What:** `<Map onClick>` fires with `{lngLat}`. On click, the store's `sourcePin` or `destinationPin` is set based on which is null. After second pin, call `mapRef.current.fitBounds()`.

**When to use:** Always — this is the correct react-map-gl v8 pattern for map interaction events.

```typescript
// Source: https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/map
import Map, { Marker, MapRef } from 'react-map-gl/mapbox';
import { useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { MapLayerMouseEvent } from 'mapbox-gl';

export function MapCanvas() {
  const mapRef = useRef<MapRef>(null);
  const { sourcePin, destinationPin, setSourcePin, setDestinationPin } = useAppStore();

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const { lng, lat } = e.lngLat;
    if (!sourcePin) {
      setSourcePin([lng, lat]);
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 8 });
    } else if (!destinationPin) {
      setDestinationPin([lng, lat]);
      // Fit both pins in view
      const bounds: [[number, number], [number, number]] = [
        [Math.min(sourcePin[0], lng), Math.min(sourcePin[1], lat)],
        [Math.max(sourcePin[0], lng), Math.max(sourcePin[1], lat)],
      ];
      mapRef.current?.fitBounds(bounds, { padding: 80 });
    }
  }, [sourcePin, destinationPin, setSourcePin, setDestinationPin]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={{ longitude: -99.9018, latitude: 31.9686, zoom: 6 }}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      style={{ width: '100vw', height: '100vh' }}
      onClick={handleClick}
    >
      {/* Markers, Sources, Controls as children */}
    </Map>
  );
}
```

### Pattern 2: GeoJSON Overlay Layer with Visibility Toggle
**What:** `<Source>` + `<Layer>` with `layout.visibility` driven by Zustand boolean. This is the correct pattern — do NOT conditionally mount/unmount `<Source>` to toggle visibility (causes "source cannot be removed while layer is using it" error).

**When to use:** All 4 GeoJSON overlay layers.

```typescript
// Source: https://visgl.github.io/react-map-gl/docs/get-started/adding-custom-data
import { Source, Layer } from 'react-map-gl/mapbox';
import type { LayerProps } from 'react-map-gl/mapbox';
import { useAppStore } from '../store/useAppStore';
import ercotData from '/public/data/ercot-grid.geojson';

const ercotLayerStyle: LayerProps = {
  id: 'ercot-grid',
  type: 'line',
  paint: { 'line-color': '#A7C8FF', 'line-width': 1.5 },
};

export function OverlayLayers() {
  const { overlays } = useAppStore();
  const ercotVisibility = overlays.ercotGrid ? 'visible' : 'none';

  return (
    <Source id="ercot-grid-source" type="geojson" data={ercotData}>
      <Layer
        {...ercotLayerStyle}
        layout={{ visibility: ercotVisibility }}
      />
    </Source>
  );
}
```

### Pattern 3: Zustand Store for AppState
**What:** A single Zustand store typed to `AppState` from `types.ts`, with action functions as part of the store.

**When to use:** All sidebar controls and map interaction handlers read/write this store.

```typescript
// Source: https://github.com/pmndrs/zustand
import { create } from 'zustand';
import type { AppState } from '../types';

interface AppStore extends AppState {
  setSourcePin: (pin: [number, number]) => void;
  setDestinationPin: (pin: [number, number]) => void;
  setVoltage: (v: AppState['voltage']) => void;
  setPriority: (p: AppState['priority']) => void;
  toggleConstraint: (key: keyof AppState['constraints']) => void;
  toggleOverlay: (key: keyof AppState['overlays']) => void;
  resetPins: () => void;
}

export const useAppStore = create<AppStore>()((set) => ({
  sourcePin: null,
  destinationPin: null,
  voltage: '345kv-double',
  priority: 'cost',
  constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
  overlays: { ercotGrid: false, landBoundary: false, wildlifeHabitat: false, topography: false, frictionHeatmap: false },
  routes: null,
  simulationStatus: 'idle',
  setSourcePin: (pin) => set({ sourcePin: pin }),
  setDestinationPin: (pin) => set({ destinationPin: pin }),
  setVoltage: (voltage) => set({ voltage }),
  setPriority: (priority) => set({ priority }),
  toggleConstraint: (key) => set((s) => ({
    constraints: { ...s.constraints, [key]: !s.constraints[key] }
  })),
  toggleOverlay: (key) => set((s) => ({
    overlays: { ...s.overlays, [key]: !s.overlays[key] }
  })),
  resetPins: () => set({ sourcePin: null, destinationPin: null }),
}));
```

### Pattern 4: Tailwind v4 + CSS Custom Properties for Design Tokens
**What:** Tailwind v4 is configured via CSS. Design-system colors (non-standard values like `#1C1B1B`) are declared as CSS custom properties and consumed by Tailwind utilities via `@theme`.

**When to use:** All components.

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-background: #131313;
  --color-surface-container-low: #1C1B1B;
  --color-surface-container: #201F1F;
  --color-surface-container-high: #2A2A2A;
  --color-primary: #A7C8FF;
  --color-primary-container: #3291FF;
  --color-secondary: #FFBC7C;
  --color-tertiary: #E8B3FF;
  --color-on-surface: #E5E2E1;
  --color-on-surface-variant: #C1C6D7;
  --color-outline: #8B90A0;
  --color-outline-variant: #414755;
}
```

This enables Tailwind utilities like `bg-surface-container-low`, `text-on-surface`, `text-primary` etc.

### Pattern 5: Vite Configuration for mapbox-gl + Tailwind v4
**What:** Standard Vite config with `@tailwindcss/vite` plugin. No special `optimizeDeps` exclusions needed for mapbox-gl v3 in current versions.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### Pattern 6: CSS Import for mapbox-gl
**What:** mapbox-gl v3 requires its stylesheet to be imported. Import it in `main.tsx` before any component.

```typescript
// src/main.tsx
import 'mapbox-gl/dist/mapbox-gl.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
```

### Pattern 7: NavigationControl Customization
**What:** Use `<NavigationControl>` from react-map-gl with `showCompass={false}` to show only zoom buttons. For the custom glassmorphism container, wrap it in a custom positioned div (not the Mapbox default position slot).

```typescript
import { NavigationControl } from 'react-map-gl/mapbox';

// Inside <Map> children — position via CSS, not via Mapbox position prop
<NavigationControl showCompass={false} />
```

### Anti-Patterns to Avoid
- **Conditionally mounting/unmounting `<Source>` to toggle visibility:** Causes "Source cannot be removed while layer is using it" runtime error. Use `layout.visibility: 'visible' | 'none'` instead.
- **Setting `mapboxgl.accessToken` globally:** Use the `mapboxAccessToken` prop on `<Map>` — the global setter is deprecated in react-map-gl v8 patterns.
- **Calling `mapRef.current.setStyle()` directly:** This bypasses React state and causes the `mapStyle` prop to desync. Change baselayers by updating the `mapStyle` prop in state.
- **CSS `canvas { display: none }` in global reset:** Causes blank map. Audit any CSS resets for canvas rules.
- **Using `@types/mapbox-gl` with mapbox-gl v3.5+:** mapbox-gl v3.5+ ships its own TypeScript types. Installing `@types/mapbox-gl` causes type conflicts. Remove it.
- **Using `import.meta.env.REACT_APP_MAPBOX_TOKEN`:** Vite uses `VITE_` prefix. The env var must be `VITE_MAPBOX_TOKEN`.
- **Loading large unoptimized GeoJSON at Texas scale:** A raw ERCOT grid shapefile is 50–200MB. It MUST be pre-simplified with mapshaper before being committed. The browser will freeze otherwise (MAP-08).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Map rendering, tile loading, WebGL management | Custom canvas map | mapbox-gl v3 | WebGL context management alone is thousands of lines |
| React bindings for Mapbox lifecycle | useEffect + ref juggling for Source/Layer | react-map-gl v8 `<Source>`, `<Layer>` | Handles add/remove/update lifecycle, prevents stale closure bugs |
| State management with selectors | React Context with value object | Zustand subscriptions | Context causes full subtree re-render; Zustand is selector-based and only re-renders consumers of changed slices |
| GeoJSON simplification | Custom coordinate reduction | mapshaper CLI | mapshaper's Visvalingam-Whyatt implementation is battle-tested for cartographic data |
| Toggle switch component | `<input type="checkbox">` styled with CSS | Custom `<ToggleSwitch>` component (build once) | Needs specific active/glow style from design system; worth encapsulating |
| Gradient button | Inline styles per button | CSS class `.btn-primary` | Reused on "Drop Source Pin" and "Run Simulation" |

**Key insight:** The entire map infrastructure (tiles, WebGL, touch gestures, accessibility for zoom) is handled by mapbox-gl + react-map-gl. The team's effort in Phase 1 is purely in React component structure and state wiring.

---

## Common Pitfalls

### Pitfall 1: Blank Map (CSS reset conflict)
**What goes wrong:** Map container renders but canvas is invisible.
**Why it happens:** A CSS reset rule (e.g. from a browser default reset or third-party reset) applies `display: none` to canvas elements, or `.mapboxgl-canvas` gets zeroed out.
**How to avoid:** Ensure `mapbox-gl/dist/mapbox-gl.css` is imported in `main.tsx` BEFORE any other styles. Audit global CSS for canvas rules.
**Warning signs:** Map container div is present in DOM but has zero visible content; no WebGL errors in console.

### Pitfall 2: Access Token Not Found
**What goes wrong:** "An API access token is required to use Mapbox GL." console error; map renders nothing.
**Why it happens:** `import.meta.env.VITE_MAPBOX_TOKEN` is undefined because: (a) `.env` file is missing, (b) using wrong prefix (`REACT_APP_` instead of `VITE_`), or (c) Vite dev server not restarted after adding `.env`.
**How to avoid:** Create `.env` with `VITE_MAPBOX_TOKEN=pk.xxx`. Add `.env` to `.gitignore`. Restart Vite after creating.
**Warning signs:** `import.meta.env.VITE_MAPBOX_TOKEN` logs as `undefined`.

### Pitfall 3: Source/Layer Unmount Race Condition
**What goes wrong:** "Cannot remove source — layer is using it" error when toggling overlay visibility.
**Why it happens:** Conditionally rendering `{isVisible && <Source>...}` means React unmounts the Source while the Layer still references it.
**How to avoid:** Always keep `<Source>` mounted. Toggle via `layout={{ visibility: show ? 'visible' : 'none' }}` on the `<Layer>`.
**Warning signs:** Console error on toggle; works first time, breaks on second toggle.

### Pitfall 4: mapStyle Prop Desync on Baselayer Switch
**What goes wrong:** Calling `mapRef.current.getMap().setStyle(...)` directly causes React's `mapStyle` prop to be stale on next render, leading to unexpected style resets.
**Why it happens:** react-map-gl v8 hides `setStyle` from the ref deliberately to prevent this.
**How to avoid:** Store the current baselayer style URL in Zustand. Pass it as the `mapStyle` prop. Switching baselayer = updating the store value.
**Warning signs:** Map style resets to initial after an interaction that triggers re-render.

### Pitfall 5: GeoJSON Files Too Large — Browser Freeze
**What goes wrong:** Map freezes or tab crashes when toggling ERCOT grid or land boundary overlay.
**Why it happens:** Raw Texas-scale GeoJSON files can be 10–200MB. Mapbox GL parses and renders all features client-side.
**How to avoid:** Run `mapshaper -i input.geojson -simplify 10% -o output.geojson` on all layers before committing to `/public/data/`. Target <1MB per file for instant rendering.
**Warning signs:** File size >2MB in `/public/data/`.

### Pitfall 6: fitBounds Padding Accumulation
**What goes wrong:** After calling `fitBounds` with `padding`, subsequent `flyTo` calls apply the same padding, causing the map to appear off-center.
**Why it happens:** `fitBounds` with `padding` sets the global map padding as a side effect.
**How to avoid:** After `fitBounds`, call `mapRef.current.setPadding({ top: 0, bottom: 0, left: 0, right: 0 })` or apply padding accounting for the sidebar width explicitly.
**Warning signs:** Camera feels offset from expected center after pin placement.

### Pitfall 7: Tailwind v4 Config Confusion
**What goes wrong:** Tailwind classes don't apply; developer installs PostCSS + autoprefixer expecting v3 setup.
**Why it happens:** Tailwind v4 has a completely different setup — Vite plugin replaces PostCSS, no `tailwind.config.js` by default, `@import "tailwindcss"` replaces `@tailwind` directives.
**How to avoid:** Follow v4 setup exactly: `npm install tailwindcss @tailwindcss/vite`; add plugin to `vite.config.ts`; use `@import "tailwindcss"` in CSS.
**Warning signs:** Tailwind classes present in HTML but no styles applied.

---

## Code Examples

### Environment Variable Setup
```bash
# .env (add to .gitignore)
VITE_MAPBOX_TOKEN=pk.your_public_token_here
```

### types.ts Contract (DATA-02, exact from CONTEXT.md)
```typescript
// src/types.ts
export interface RouteResult {
  id: 'A' | 'B' | 'C';
  profile: 'lowest-cost' | 'balanced' | 'lowest-risk';
  label: string;
  color: string;
  geometry: GeoJSON.LineString;
  metrics: {
    distanceMiles: number;
    estimatedCapexUSD: number;
    permittingMonths: [number, number];
  };
  segmentJustifications: Array<{
    segmentIndex: number;
    frictionScore: number;
    justification: string;
  }>;
  narrativeSummary: string;
}

export interface AppState {
  sourcePin: [number, number] | null;
  destinationPin: [number, number] | null;
  voltage: '345kv-double' | '500kv-hvdc' | '230kv-single';
  priority: 'cost' | 'risk' | 'balanced';
  constraints: {
    coLocation: boolean;
    eminentDomainAvoidance: boolean;
    ecologyAvoidance: boolean;
  };
  overlays: {
    ercotGrid: boolean;
    landBoundary: boolean;
    wildlifeHabitat: boolean;
    topography: boolean;
    frictionHeatmap: boolean;
  };
  routes: RouteResult[] | null;
  simulationStatus: 'idle' | 'running' | 'complete' | 'error';
}
```

### Pin Drop Marker with Pulse Animation
```typescript
// src/components/MapCanvas/PinMarkers.tsx
import { Marker } from 'react-map-gl/mapbox';
import { useAppStore } from '../../store/useAppStore';

export function PinMarkers() {
  const { sourcePin, destinationPin } = useAppStore();
  return (
    <>
      {sourcePin && (
        <Marker longitude={sourcePin[0]} latitude={sourcePin[1]}>
          <div className="pin-marker pin-source">
            <div className="pin-pulse" />
            <span>Source</span>
          </div>
        </Marker>
      )}
      {destinationPin && (
        <Marker longitude={destinationPin[0]} latitude={destinationPin[1]}>
          <div className="pin-marker pin-destination">
            <div className="pin-pulse" />
            <span>Destination</span>
          </div>
        </Marker>
      )}
    </>
  );
}
```

```css
/* Pin styles — use CSS, not Tailwind, for keyframe animations */
.pin-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #A7C8FF;
  color: #003061;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pin-drop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pin-pulse {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(213, 227, 255, 0.3); /* primary_fixed at 30% */
  animation: pulse-ring 0.6s ease-out;
}

@keyframes pin-drop {
  from { transform: scale(0) translateY(-20px); opacity: 0; }
  to   { transform: scale(1) translateY(0);   opacity: 1; }
}

@keyframes pulse-ring {
  from { transform: scale(1); opacity: 0.6; }
  to   { transform: scale(2); opacity: 0; }
}
```

### mapshaper Simplification Command (MAP-08)
```bash
# Install mapshaper globally once
npm install -g mapshaper

# Simplify each GeoJSON to ≤10% — run offline, commit results to /public/data/
mapshaper -i raw/ercot-grid.geojson -simplify 10% keep-shapes -o public/data/ercot-grid.geojson
mapshaper -i raw/land-boundary.geojson -simplify 10% keep-shapes -o public/data/land-boundary.geojson
mapshaper -i raw/wildlife-habitat.geojson -simplify 10% keep-shapes -o public/data/wildlife-habitat.geojson
mapshaper -i raw/topography.geojson -simplify 10% keep-shapes -o public/data/topography.geojson
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import from 'react-map-gl'` (generic) | `import from 'react-map-gl/mapbox'` | v8.0 (Jan 2025) | Smaller bundle, precise types per renderer |
| `mapboxgl.accessToken = token` global setter | `mapboxAccessToken` prop on `<Map>` | v7+ | Cleaner, supports multiple maps with different tokens |
| `@types/mapbox-gl` community types | Built-in TypeScript types in mapbox-gl | v3.5.0 | Remove `@types/mapbox-gl` — it conflicts |
| `@tailwind base/components/utilities` directives | `@import "tailwindcss"` | v4.0 (Jan 2025) | Simpler CSS entry point |
| `tailwind.config.js` | CSS `@theme {}` block | v4.0 (Jan 2025) | Config lives in CSS; no separate config file required for standard usage |
| PostCSS + Autoprefixer for Tailwind | `@tailwindcss/vite` plugin | v4.0 (Jan 2025) | One plugin replaces the PostCSS chain |
| Zustand `useStore` with no type param | `create<State>()()` curried form | v4+ | Required for proper TypeScript inference |

**Deprecated/outdated:**
- `FlyToInterpolator`, `LinearInterpolator` from react-map-gl: removed in v7+. Use `map.flyTo()` / `map.easeTo()` directly.
- `MapContext` / `useMapControl` from react-map-gl: removed in v7+. Use `useMap()` / `useControl()`.
- `@types/mapbox-gl`: conflicts with mapbox-gl v3.5+ built-in types. Do not install.

---

## Open Questions

1. **GeoJSON mock data sourcing**
   - What we know: Files need to live in `/public/data/` and be pre-simplified to <10% with mapshaper.
   - What's unclear: Actual source URLs for Texas ERCOT grid, land boundary, wildlife habitat, and topography GeoJSON. These may need to be found from public datasets (USGS, Texas Parks and Wildlife, ERCOT open data) or hand-crafted stubs.
   - Recommendation: In Wave 1, create minimal stub GeoJSON files (5–10 features each covering Texas bbox) to unblock development. Real data can be substituted in without code changes.

2. **Mapbox access token distribution for hackathon**
   - What we know: The token must be in `.env` as `VITE_MAPBOX_TOKEN`, added to `.gitignore`.
   - What's unclear: Whether the team has a token, and whether URL restrictions should be applied.
   - Recommendation: Use a public-scoped token with URL restriction to `localhost` during development; widen restriction for demo deployment.

3. **Pin UX flow — mode-based vs always-on**
   - What we know: CONTEXT.md marks this as Claude's Discretion.
   - What's unclear: Whether pins drop on ANY map click (simpler) or only when a mode is active (safer against accidental drops).
   - Recommendation: Always-on click-to-place for the first null pin slot. This is the simpler implementation and typical for hackathon demos. First click = Source, second click = Destination. Clicking a placed pin could reset it (Phase 3 concern).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` — Wave 0 gap, does not exist yet |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-01 | Map renders with satellite style; baselayer switcher present | smoke | `npx vitest run src/components/MapCanvas/MapCanvas.test.tsx` | Wave 0 |
| MAP-02 | Clicking map sets sourcePin in store; Marker appears | unit | `npx vitest run src/store/useAppStore.test.ts` | Wave 0 |
| MAP-03 | Second click sets destinationPin; fitBounds called | unit | `npx vitest run src/store/useAppStore.test.ts` | Wave 0 |
| MAP-04 | Toggling ercotGrid overlay changes store value | unit | `npx vitest run src/store/useAppStore.test.ts` | Wave 0 |
| MAP-05 | Toggling landBoundary overlay changes store value | unit | (same file) | Wave 0 |
| MAP-06 | Toggling wildlifeHabitat overlay changes store value | unit | (same file) | Wave 0 |
| MAP-07 | Toggling topography overlay changes store value | unit | (same file) | Wave 0 |
| MAP-08 | GeoJSON files in /public/data/ each ≤ 2MB | manual | check file sizes | N/A |
| DATA-01 | No network requests to external APIs during render | manual | browser devtools | N/A |
| DATA-02 | types.ts exports RouteResult and AppState matching spec | unit | `npx vitest run src/types.test.ts` | Wave 0 |
| CTRL-01 | Priority chip click updates store.priority | unit | `npx vitest run src/components/Sidebar/RoutePrioritySection.test.tsx` | Wave 0 |
| CTRL-02 | Co-location toggle click updates store.constraints.coLocation | unit | `npx vitest run src/components/Sidebar/ConstraintsSection.test.tsx` | Wave 0 |
| CTRL-03 | Eminent domain toggle updates store | unit | (same file) | Wave 0 |
| CTRL-04 | Ecology avoidance toggle updates store | unit | (same file) | Wave 0 |
| CTRL-05 | Voltage radio selection updates store.voltage | unit | `npx vitest run src/components/Sidebar/VoltageSection.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/store/useAppStore.test.ts` (store unit tests — fast, no DOM)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest config with jsdom environment + mapbox-gl mock
- [ ] `src/test/setup.ts` — global test setup; mock for `mapbox-gl` (WebGL unavailable in jsdom)
- [ ] `src/store/useAppStore.test.ts` — covers MAP-02, MAP-03, MAP-04–07, CTRL-01–05
- [ ] `src/types.test.ts` — covers DATA-02 (TypeScript structural type check)
- [ ] `src/components/MapCanvas/MapCanvas.test.tsx` — covers MAP-01 (smoke; map mock)
- [ ] `src/components/Sidebar/ConstraintsSection.test.tsx` — covers CTRL-02–04
- [ ] `src/components/Sidebar/RoutePrioritySection.test.tsx` — covers CTRL-01
- [ ] `src/components/Sidebar/VoltageSection.test.tsx` — covers CTRL-05
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom`

**mapbox-gl mock pattern for Vitest jsdom environment:**
```typescript
// src/test/setup.ts
import { vi } from 'vitest';

vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(() => ({
      on: vi.fn(), off: vi.fn(), remove: vi.fn(),
      addControl: vi.fn(), removeControl: vi.fn(),
      getCanvas: vi.fn(() => ({ style: {} })),
    })),
    Marker: vi.fn(() => ({ setLngLat: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis(), remove: vi.fn() })),
    NavigationControl: vi.fn(),
    accessToken: '',
  },
}));
```

---

## Sources

### Primary (HIGH confidence)
- Context7 + npm registry — confirmed package versions: `mapbox-gl@3.21.0`, `react-map-gl@8.1.1`, `zustand@5.0.12`, `tailwindcss@4.2.2`, `@tailwindcss/vite@4.2.2`, `vite@8.0.8`
- https://visgl.github.io/react-map-gl/docs/whats-new — v8 breaking changes, endpoint separation
- https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/map — Map component props, ref API
- https://visgl.github.io/react-map-gl/docs/get-started/adding-custom-data — Source/Layer pattern
- https://github.com/pmndrs/zustand — Zustand v5 TypeScript patterns

### Secondary (MEDIUM confidence)
- https://tailwindcss.com/docs — Tailwind v4 setup (Vite plugin, `@import "tailwindcss"`, `@theme`)
- https://docs.mapbox.com/mapbox-gl-js/guides/migrate-to-v3/ — v3 migration: classic styles still work, `@types/mapbox-gl` conflicts
- https://docs.mapbox.com/mapbox-gl-js/example/toggle-layers/ — `setLayoutProperty` visibility pattern
- https://github.com/visgl/react-map-gl/discussions/2388 — Blank map root cause (CSS canvas override)

### Tertiary (LOW confidence)
- Various community posts on `optimizeDeps.exclude` for mapbox-gl — the alias workaround may be needed for older Vite versions but should not be necessary with Vite v8 + mapbox-gl v3.21

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed via npm registry live query
- Architecture: HIGH — patterns from official react-map-gl docs; Zustand from official docs
- Pitfalls: HIGH (CSS blank map, source unmount error, fitBounds padding) — confirmed from official GitHub issues; MEDIUM (mapStyle desync) — confirmed from react-map-gl docs warning
- Validation: HIGH — Vitest/RTL standard patterns; mapbox-gl mock is well-documented community pattern

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable stack; react-map-gl ships frequently but v8 API is settled)
