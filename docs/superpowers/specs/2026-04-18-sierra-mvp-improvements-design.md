# Sierra MVP Improvements — Design Spec

**Date:** 2026-04-18  
**Context:** 12-hour hackathon sprint. Sierra is a working demo for transmission line routing in Texas. This spec covers all changes from `changes.txt`, structured as three tiers by impact-per-hour. Architecture is demo-first but scalable — real data and production integrations plug in post-hackathon without structural changes.

---

## Approach: Tiered by Impact-per-Hour (Option C)

| Tier | Time Budget | Focus |
|---|---|---|
| 1 | ~3 hrs | Core UX fixes + quick wins |
| 2 | ~4 hrs | Data Layers tab + Archive tab |
| 3 | ~3 hrs | Polish + impact scoring + route renaming |

Always shippable after each tier completes.

---

## Tier 1: Core UX Fixes

### 1. Exit Simulation / Reset

**What:** Add `resetSimulation()` to Zustand store. A "New Simulation" button appears in the sidebar when `simulationStatus` is `complete` or `running`.

**Store changes (`useAppStore.ts`):**
```ts
resetSimulation: () => set({
  simulationStatus: 'idle',
  sourcePin: null,
  destinationPin: null,
  routes: [],
  recommendation: null,
  alerts: [],
  envTriggers: [],
  projectSummary: null,
  narrativeByRoute: {},
})
```

**UI:** "New Simulation" button at bottom of `Sidebar.tsx` when status is `complete`. Confirm dialog if status is `running`. Small reset icon also added to `TopNav.tsx` (always visible).

**Scalability seam:** `resetSimulation` can be extended to also clear history or persist a snapshot before clearing.

---

### 2. Dark Map Theme

**What:** Switch default Mapbox style to `mapbox://styles/mapbox/dark-v11`. Preserves geographic labels, terrain, and global coverage. Style toggle in `MapControls` stays intact.

**Change:** In `useAppStore.ts`, change the `mapStyle` default from satellite to `mapbox://styles/mapbox/dark-v11`. Update `MapControls.tsx` option labels to "Dark" / "Satellite".

**Scalability seam:** Style URL is a Zustand state field — swappable for any Mapbox style or custom style post-hackathon.

---

### 3. Pin Interaction Enhancements

**Colors:**
- Source pin: `#22c55e` (green)
- Destination pin: `#ef4444` (red)

**Animations (`PinMarkers.css`):**
- `pinDrop`: scale 0 → 1.2 → 1 over 300ms on mount
- `pinPulse`: radial glow ring, plays once on placement then stops

**Cancel button:** Small `×` overlay on each marker. Calls `setSourcePin(null)` or `setDestinationPin(null)`. Resets placement mode accordingly.

**Placement mode indicator (`PinPlacementSection.tsx`):** Persistent status bar cycling through:
1. "Click map to place **SOURCE** pin" (when no source)
2. "Click map to place **DESTINATION** pin" (source placed, no dest)
3. "Both pins placed — ready to run simulation" (both placed)

---

### 4. Population-Served Metric

**Type extension (`types.ts`):**
```ts
// Added to RouteResult
populationServed: number; // estimated people served, illustrative
```

**Mock calculation:** Deterministic from route distance and proximity to Texas population centers (Houston, Dallas-Fort Worth, San Antonio corridors). Formula: `Math.round(distanceKm * populationDensityCoefficient)` where coefficient varies by route weight profile.

**Display:** "👥 2.3M served" badge in `RouteCards.tsx`. Primary differentiator for the Max Population Served route strategy (Tier 3).

**Scalability seam:** Replace mock coefficient with REPEAT model population grid post-hackathon.

---

### 5. Risk Markers on Map

**Type extension (`types.ts`):**
```ts
// Added to SierraAlert
location: { lat: number; lng: number };
```

**Rendering (`MapCanvas.tsx`):** Each alert renders as a pulsing red Mapbox `Marker` with a `⚠` icon. Marker position comes from `alert.location`.

**Interaction:** Clicking a marker calls `map.flyTo({ center: [lng, lat], zoom: 10 })` and dispatches a Zustand action `setFocusedAlertId(alert.id)` that auto-expands the `SierraAlerts` panel in the sidebar.

**Scalability seam:** `location` field is typed and optional for backwards compat. Post-hackathon: populate from real geospatial risk data.

---

## Tier 2: Data Layers + Archive

### 6. Data Layers Tab

**Architecture:**
```
src/config/dataLayers.ts                        ← layer registry
public/data/layers/                             ← mock GeoJSON files
src/components/MapCanvas/DataLayerRenderer.tsx  ← renders active layers on map
src/components/Sidebar/DataLayersPanel.tsx      ← toggle UI in Data Layers tab
```

**Layer config type (`dataLayers.ts`):**
```ts
export interface DataLayerConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  type: 'fill' | 'line';
  sourceUrl: string;       // local path today; API/tileset URL post-hackathon
  opacity: number;
  attribution: string;
}
```

**Six layers (Princeton NZA-inspired, all illustrative):**

| ID | Name | Type | Color | File |
|---|---|---|---|---|
| `wind-potential` | Wind Potential Zones | fill | `#7c3aed` | `wind-potential.geojson` |
| `solar-irradiance` | Solar Irradiance | fill | `#f59e0b` | `solar-irradiance.geojson` |
| `co2-storage` | CO₂ Storage Formations | fill | `#0d9488` | `co2-storage.geojson` |
| `tx-corridors-2030` | Transmission Corridors 2030 | line | `#f97316` | `tx-corridors-2030.geojson` |
| `tx-corridors-2050` | Transmission Corridors 2050 | line | `#ef4444` | `tx-corridors-2050.geojson` |
| `constrained-land` | Constrained Land (CLUA) | fill | `#6b7280` | `constrained-land.geojson` |

**GeoJSON coverage:**
- Wind: West Texas panhandle polygons
- Solar: South/West Texas polygons
- CO₂: Permian Basin + Gulf Coast polygons
- Corridors: LineStrings along major ERCOT expansion paths
- CLUA: Protected/no-go zone polygons (state parks, wildlife refuges)

**Zustand:** Add `activeDatalayerIds: string[]` to `AppState`. `DataLayersPanel` toggles IDs in/out of this set.

**`DataLayerRenderer.tsx`:** Reads `activeDatalayerIds`, maps to configs, renders a Mapbox `Source` + `Layer` pair for each. Mounts inside `MapCanvas` so layers render regardless of active tab.

**`DataLayersPanel.tsx`:** List of toggle cards — color chip, name, description, switch. Source attribution: "Princeton NZA / REPEAT Project (illustrative)" footer.

**Scalability seam:** Swap `sourceUrl` from local GeoJSON to a real Mapbox tileset or API endpoint. No other changes needed.

---

### 7. Archive Tab

**Type (`types.ts`):**
```ts
export interface SimulationRun {
  id: string;
  timestamp: string;        // ISO 8601
  sourcePinLabel: string;   // formatted lat/lng
  destPinLabel: string;
  recommendedRouteId: 'A' | 'B' | 'C';
  routes: RouteResult[];
}
```

**Store:** Add `simulationHistory: SimulationRun[]` (capped at 10). When `simulationStatus` transitions to `complete`, push a snapshot.

**`ArchivePanel.tsx`:** Stack of run cards showing timestamp, pin labels, recommended route badge, and key metrics (distance, cost, population served). Clicking a card opens a read-only result summary modal or inline expanded view.

**Scalability seam:** Persist `simulationHistory` to `localStorage` on write. Post-hackathon: sync to a backend endpoint.

---

## Tier 3: Polish + Impact Scoring + Route Renaming

### 8. Pin Animations + Placement Mode (Polish Pass)

Full `PinMarkers.css` keyframe implementation:
- `pinDrop`: mount animation applied via React `useEffect` on pin state change
- `pinPulse`: applied once on first render of each pin, removed after 1s via `animationend` handler

Placement mode status bar: styled with dark background, white bold text, color-coded accent (green for source phase, red for destination phase, grey when complete).

---

### 9. Impact Scoring Panel

**Type extension (`RouteResult` in `types.ts`):**
```ts
impactScore: {
  populationServed: number;      // people, illustrative
  jobsCreated: number;           // FTE, illustrative
  emissionsReduced_tCO2: number; // tonnes CO₂/year, illustrative
  healthImpactScore: number;     // 0–100 index, illustrative
};
```

**`ImpactScorePanel.tsx`:** Four metric tiles, one column per route, recommended route column highlighted. Icons: 👥 💼 🌿 ❤️. "Illustrative estimates based on Princeton NZA coefficients" footnote.

Mock value generation: deterministic coefficients per route profile, consistent across simulation runs for demo stability.

**Scalability seam:** Replace mock coefficients with REPEAT model outputs via a new `/api/impact` endpoint.

---

### 10. Route Strategy Renaming

Rename three routes to align with NZA scenario framing:

| Old Name | New Name | Color | Weight Profile |
|---|---|---|---|
| Lowest Cost | Least-Cost | Blue `#3b82f6` | Unchanged |
| Balanced | Max Population Served | Green `#22c55e` | Population density weighting |
| Lowest Regulatory Risk | Renewable-Optimized | Purple `#a855f7` | Wind/solar zone proximity |

**Files to update:** `cannedFallback.ts`, `RouteCards.tsx`, `SierraRecommends.tsx`, `SierraAlerts.tsx`, `EnvTriggerPanel.tsx`, route color constants in `types.ts` or a new `src/config/routes.ts`.

Orange (`#f97316`) for Balanced is retired; green takes that slot. All other route logic (A* weights, PDF export, radar chart) references route ID (`A`/`B`/`C`), not the label — so renaming is display-only except for the population density weight tweak.

---

## File Change Summary

### New Files
- `src/config/dataLayers.ts`
- `src/config/routes.ts` (route color/label constants)
- `src/components/MapCanvas/DataLayerRenderer.tsx`
- `src/components/Sidebar/DataLayersPanel.tsx`
- `src/components/Sidebar/ArchivePanel.tsx`
- `src/components/Sidebar/results/ImpactScorePanel.tsx`
- `public/data/layers/wind-potential.geojson`
- `public/data/layers/solar-irradiance.geojson`
- `public/data/layers/co2-storage.geojson`
- `public/data/layers/tx-corridors-2030.geojson`
- `public/data/layers/tx-corridors-2050.geojson`
- `public/data/layers/constrained-land.geojson`

### Modified Files
- `src/types.ts` — extend `RouteResult` (populationServed, impactScore), `SierraAlert` (location), add `SimulationRun`, `DataLayerConfig`
- `src/store/useAppStore.ts` — add `resetSimulation`, `activeDatalayerIds`, `simulationHistory`, `focusedAlertId`
- `src/components/MapCanvas/MapCanvas.tsx` — mount `DataLayerRenderer`, add alert markers, flyTo on alert click
- `src/components/MapCanvas/PinMarkers.tsx` + `PinMarkers.css` — colors, animations, cancel button
- `src/components/Sidebar/Sidebar.tsx` — "New Simulation" button, archive/data-layers panel routing
- `src/components/Sidebar/PinPlacementSection.tsx` — placement mode status bar
- `src/components/Sidebar/results/RouteCards.tsx` — population served badge, new labels/colors
- `src/components/Sidebar/results/SierraRecommends.tsx` — route label update
- `src/components/Sidebar/results/SierraAlerts.tsx` — focusedAlertId highlighting
- `src/components/TopNav/TopNav.tsx` — reset icon
- `src/App.tsx` — wire DataLayersPanel and ArchivePanel to their tabs
- `server/src/cannedFallback.ts` — route label + color + location + impact score updates

---

## Post-Hackathon Extension Points

| Feature | What to swap in |
|---|---|
| Data layer GeoJSON | Real Princeton NZA / Mapbox tilesets via `sourceUrl` |
| Population metric | REPEAT model population grid API |
| Impact scoring | REPEAT `/api/impact` endpoint replacing mock coefficients |
| Archive persistence | `localStorage` → backend sync |
| Alert locations | Real geospatial risk data |
| Route weight profiles | Real friction data from Princeton NZA CLUA |
