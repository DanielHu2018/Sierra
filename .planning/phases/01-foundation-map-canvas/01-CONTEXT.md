# Phase 1: Foundation & Map Canvas - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Source:** Google Stitch — "Sierra AI Routing Platform" project (id: 14848988508199794348)

<domain>
## Phase Boundary

Phase 1 delivers the full interactive map canvas + all UI chrome before any routing logic exists. A judge opens the app and can: see the Texas map, drop two pins, toggle all overlays, and adjust every constraint control. No routing, no AI — just the UI shell and the shared types contract.

</domain>

<decisions>
## Implementation Decisions

### Tech Stack
- **Map library:** Mapbox GL JS v3 (locked by MAP-01) — use `mapbox-gl` npm package
- **Framework:** React + TypeScript (implied by `types.ts` contract in DATA-02)
- **Build tool:** Vite (standard for React hackathon stacks; fast HMR)
- **Styling:** Tailwind CSS utility classes for layout; CSS custom properties for the design token colors below

### Layout Architecture
- **Full-screen map** as the primary canvas occupying 100vw × 100vh (`background` color: `#131313`)
- **Left sidebar HUD** — floating panel, NOT flush with the screen edge. Detached `1rem` from left edge, `1rem` from top/bottom, with `border-radius: 0.75rem` (`ROUND_FOUR` in design system). Background: `surface-container-low` (`#1C1B1B`). Width: ~320px.
- **No borders between sections** — tonal layering only (color shifts define boundaries, never 1px lines)
- **Floating map controls** (zoom, recenter, layers) anchored to the bottom-right of the map canvas. Use glassmorphism: `background: rgba(28, 27, 27, 0.6)`, `backdrop-filter: blur(12px)`

### Header / Top Nav
- Thin top bar with nav items: **Route Engine**, **Data Layers**, **Archive**
- Right-aligned secondary controls: notifications icon, settings icon, **Export PDF** button
- Background: `surface-container` (`#201F1F`) — slightly elevated from map to create depth
- Typography: `label-sm` Inter, all-caps, `0.05em` letter-spacing for nav items

### Sidebar Panel Contents (Phase 1 scope)
The sidebar shows all controls, but "Run Simulation" is disabled until both pins are dropped (engine not built yet in Phase 1).

**Section: PIN PLACEMENT**
- `Drop Source Pin` button — primary gradient style (Electric Blue `#A7C8FF` → `#3291FF`)
- `Drop Destination Pin` button — secondary/outlined style
- Pin status indicators (grayed out until dropped)

**Section: VOLTAGE**
- Radio group: `345 kV Double Circuit` / `500 kV HVDC` / `230 kV Single Circuit`
- Default: `345 kV Double Circuit`

**Section: ROUTE PRIORITY**
- Two toggle chips: `MINIMIZE COST` / `MINIMIZE RISK`
- Default: neither selected (neutral until Run Simulation)

**Section: CONSTRAINTS**
- Three toggle switches (not checkboxes — use toggle switch component per design system):
  - Co-Location (favor existing infrastructure corridors)
  - Eminent Domain Avoidance
  - Ecology Avoidance
- Active state: track transitions to `primary-container` (`#3291FF`) with subtle outer glow

**Section: OVERLAYS**
Five toggle switches for map layers (all off by default):
  1. ERCOT Grid
  2. Land Boundary
  3. Wildlife Habitat
  4. Topography
  5. Friction Heatmap *(placeholder — renders nothing in Phase 1, enabled in Phase 2)*

**Run Simulation Button**
- Full-width at bottom of sidebar
- Style: gradient fill `#A7C8FF` → `#3291FF`, `border-radius: 0.375rem`
- Disabled state in Phase 1 (engine not yet built) — greyed out, shows "Requires Phase 2" or just disabled

### Map Controls (Floating, Bottom-Right)
- Zoom In / Zoom Out (Mapbox default controls, restyled)
- Recenter / My Location button
- Layers button (baselayer switcher: Satellite / Terrain)
- Container: glassmorphism card (`rgba(28,27,27,0.6)`, `blur(12px)`)

### Baselayers
Two options accessible via the Layers button:
- **Satellite** (Mapbox `satellite-streets-v12`)
- **Terrain** (Mapbox `outdoors-v12` or `terrain` style)
- Default: Satellite

### Map Pins
- **Source pin:** `on-primary` icon (`#003061`) on `primary` circular background (`#A7C8FF`)
- **Destination pin:** Same style, differentiated by label ("Source" / "Destination")
- On drop: pin scales 1.2× and emits pulse animation using `primary_fixed` (`#D5E3FF`) at 30% opacity
- Map recenters to show both pins after second pin is placed

### GeoJSON Overlays (Phase 1 — static mock data)
All layers pre-simplified with mapshaper ≤10% (MAP-08). Loaded from `/public/data/`:
- `ercot-grid.geojson` — line layer, `primary` color (`#A7C8FF`), 1.5px width
- `land-boundary.geojson` — fill layer, `secondary` color (`#FFBC7C`), 10% opacity fill + 1px stroke
- `wildlife-habitat.geojson` — fill layer, `tertiary` color (`#E8B3FF`), 15% opacity fill
- `topography.geojson` — contour line layer, `outline-variant` (`#414755`), 1px
- Friction heatmap: placeholder only — no data in Phase 1

### Design System Colors (locked)
```
background:                #131313
surface:                   #131313
surface-dim:               #131313
surface-container-lowest:  #0E0E0E
surface-container-low:     #1C1B1B   ← sidebar background
surface-container:         #201F1F
surface-container-high:    #2A2A2A   ← data cards
surface-container-highest: #353534   ← active/focused cards
surface-bright:            #393939
primary:                   #A7C8FF   ← Electric Blue (Lowest Cost route)
primary-container:         #3291FF
secondary:                 #FFBC7C   ← Vibrant Orange (Balanced route)
tertiary:                  #E8B3FF   ← Royal Purple (Lowest Risk route)
on-surface:                #E5E2E1
on-surface-variant:        #C1C6D7
outline:                   #8B90A0
outline-variant:           #414755
```

### Typography (locked)
- **Headlines / Display:** Manrope (Google Font)
- **Body / Labels / Data:** Inter (Google Font)
- Section headers: `title-sm` weight, ALL-CAPS, `letter-spacing: 0.05em`
- Primary metric values (cost, distance): `headline-sm` Manrope for editorial weight
- Data density labels: `label-sm` Inter (11px) — must stay legible

### Key Design Rules (from design system)
- **No 1px borders.** Boundaries defined by background color shifts only. Ghost border fallback: `outline-variant` at 15% opacity only if accessibility requires it.
- **No pure black (#000000).** Use `#0E0E0E` minimum.
- **No bright red** in UI chrome — only for High Friction/Critical Error areas.
- **Glassmorphism** for all floating map widgets: `surface-container-low` at 60% opacity + `blur(12px)`
- **Sidebar** is a floating HUD, not a flush sidebar — detached `1rem` from edge with `xl` rounding
- **Gradient buttons:** `primary` → `primary-container` linear gradient; on hover brighten via `surface-tint` overlay +10%

### shared types.ts Contract (DATA-02)
Must be created in Phase 1 at `/src/types.ts` (or `/src/lib/types.ts`). Must define at minimum:
```typescript
// Route result shape — consumed by map, dashboard, and PDF without modification
interface RouteResult {
  id: 'A' | 'B' | 'C';
  profile: 'lowest-cost' | 'balanced' | 'lowest-risk';
  label: string;
  color: string;           // hex — A: #A7C8FF, B: #FFBC7C, C: #E8B3FF
  geometry: GeoJSON.LineString;
  metrics: {
    distanceMiles: number;
    estimatedCapexUSD: number;
    permittingMonths: [number, number]; // [min, max]
  };
  segmentJustifications: Array<{
    segmentIndex: number;
    frictionScore: number;  // 0–1
    justification: string;
  }>;
  narrativeSummary: string;
}

interface AppState {
  sourcePin: [number, number] | null;   // [lng, lat]
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

### Claude's Discretion
- State management library (Zustand vs React Context — Zustand recommended for map + sidebar sync)
- File/folder structure within `/src`
- Specific Mapbox style IDs for satellite/terrain
- How overlay GeoJSON mock data is structured (exact feature count, coordinate precision)
- Whether `react-map-gl` wrapper is used or raw `mapbox-gl` imperative API
- Pin click-to-drop vs toolbar-then-click UX flow (either works; pick one)

</decisions>

<specifics>
## Specific References

### Stitch Screens (source of truth for visual design)
- **Main Interface - Initial State** (`screens/20497fb5202b4d8d9ba79f5163607a31`): Primary layout reference — sidebar, map canvas, controls
- **Risk Analysis - Friction Heatmap** (`screens/84b512c12289411e83df459b1267003c`): Overlay panel and heatmap legend reference
- **Simulation Results (3 Routes)** (`screens/098b0c86fe934436938ad2b84fba81ee`): Route card design — useful for types.ts contract shape
- **Design System** in project `14848988508199794348`: Full color tokens, typography rules, component specs (see `designMd` field)

### Initial Map View
- Center: Texas geographic center approximately `[−99.9018, 31.9686]`
- Zoom: ~6 (shows full Texas + some border)
- Status indicator in sidebar: `ERCOT_WEST_ACTIVE`

### Stitch Design System Reference
The project's `designTheme.designMd` contains authoritative component specs for buttons, toggles, cards, nav sidebar, and the "No-Line Rule." This is locked — do not deviate.

</specifics>

<deferred>
## Deferred to Later Phases

- Friction heatmap actual data rendering (Phase 2 — needs `friction_cache.json`)
- Route lines on map (Phase 3)
- Results dashboard cards with real metrics (Phase 3)
- Hover justification popups (Phase 3)
- "Run Simulation" enabled + progress animation (Phase 3)
- PDF export functionality (Phase 4)
- Error state for out-of-bounds pins (Phase 3)
- ADA color/contrast audit (Phase 5)

</deferred>

---

*Phase: 01-foundation-map-canvas*
*Context gathered: 2026-04-16 from Google Stitch project "Sierra AI Routing Platform" (14848988508199794348)*
