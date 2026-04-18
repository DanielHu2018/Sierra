# Sierra MVP Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all three tiers of Sierra improvements — core UX fixes, data layers + archive, and polish + impact scoring + route renaming — in a 12-hour hackathon sprint.

**Architecture:** Config-driven data layers with local GeoJSON (real data plugs in via `sourceUrl` post-hackathon). Simulation history stored in Zustand (capped at 10). Map always renders so data layer overlays work across tabs. Alert markers on map link to sidebar risk panel.

**Tech Stack:** React 18, TypeScript, Zustand, react-map-gl/mapbox, Mapbox GL JS, Express, Vitest

---

## File Map

### New Files
- `src/config/dataLayers.ts` — layer registry (id, name, color, sourceUrl, etc.)
- `src/config/routes.ts` — route color/label/profile constants (single source of truth)
- `src/components/MapCanvas/DataLayerRenderer.tsx` — renders active data layers on map
- `src/components/Sidebar/DataLayersPanel.tsx` — toggle UI for data layers tab
- `src/components/Sidebar/ArchivePanel.tsx` — simulation history list
- `src/components/Sidebar/results/ImpactScorePanel.tsx` — impact metrics panel
- `public/data/layers/wind-potential.geojson`
- `public/data/layers/solar-irradiance.geojson`
- `public/data/layers/co2-storage.geojson`
- `public/data/layers/tx-corridors-2030.geojson`
- `public/data/layers/tx-corridors-2050.geojson`
- `public/data/layers/constrained-land.geojson`

### Modified Files
- `src/types.ts` — extend RouteResult (populationServed, impactScore), AlertItem (coords?), add SimulationRun, DataLayerConfig
- `src/store/useAppStore.ts` — add resetSimulation, activeDatalayerIds, simulationHistory, focusedAlertId
- `src/App.tsx` — always render map, swap sidebar panels per tab
- `src/components/MapCanvas/MapCanvas.tsx` — mount DataLayerRenderer, alert markers + flyTo
- `src/components/MapCanvas/PinMarkers.tsx` — green/red colors + cancel button
- `src/components/Sidebar/Sidebar.tsx` — "New Simulation" button + snapshot on complete
- `src/components/Sidebar/PinPlacementSection.tsx` — placement mode status bar
- `src/components/Sidebar/results/RouteCards.tsx` — population badge
- `src/components/Sidebar/results/ResultsPanel.tsx` — add ImpactScorePanel
- `src/components/TopNav/TopNav.tsx` — reset icon
- `server/src/types.ts` — extend AlertItem (coords?), RouteResult (populationServed)
- `server/src/routes/api.ts` — add populationServed to cannedStubRoutes + real routes
- `server/src/cannedFallback.ts` — add coords to alerts, update route labels/colors

---

## Task 1: Extend types.ts (both client and server)

**Files:**
- Modify: `src/types.ts`
- Modify: `server/src/types.ts`

- [ ] **Step 1: Extend `src/types.ts`**

Replace the contents of `src/types.ts` with:

```ts
import type * as GeoJSON from 'geojson';

// ─── AI Endpoint Response Types ───────────────────────────────────────────────
export interface RouteRecommendation {
  routeId: 'A' | 'B' | 'C';
  rationale: string;
  timestamp: number;
}

export interface TriggerEntry {
  statute: string;
  explanation: string;
  timelineMonths: [number, number];
}

export interface EnvironmentalTrigger {
  routeId: 'A' | 'B' | 'C';
  triggers: TriggerEntry[];
}

export interface AlertItem {
  text: string;
  location: string;
  coords?: { lat: number; lng: number }; // for map marker — optional, canned data may omit
}

export interface SierraAlert {
  primary: AlertItem;
  secondary: AlertItem[];
}

export interface ProjectPhase {
  name: string;
  estimatedMonths: [number, number];
  keyDependency: string;
}

export interface ProjectSummary {
  phases: ProjectPhase[];
}

export interface FrictionNode {
  lat: number;
  lng: number;
  frictionScore: number;
  justification: string;
}

export type FrictionCache = Record<string, FrictionNode>;

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
  populationServed: number;       // illustrative — people served along corridor
  impactScore?: {
    jobsCreated: number;           // FTE, illustrative
    emissionsReduced_tCO2: number; // tonnes CO₂/year, illustrative
    healthImpactScore: number;     // 0–100 index, illustrative
  };
}

// ─── Phase 4: PDF Narrative ────────────────────────────────────────────────
export type NarrativeByRoute = Record<'A' | 'B' | 'C', string>;

// ─── Data Layers ──────────────────────────────────────────────────────────
export interface DataLayerConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  type: 'fill' | 'line';
  sourceUrl: string;   // local GeoJSON path today; swap to API/tileset post-hackathon
  opacity: number;
  attribution: string;
}

// ─── Archive ──────────────────────────────────────────────────────────────
export interface SimulationRun {
  id: string;
  timestamp: string;          // ISO 8601
  sourcePinLabel: string;
  destPinLabel: string;
  recommendedRouteId: 'A' | 'B' | 'C' | null;
  routes: RouteResult[];
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

- [ ] **Step 2: Extend `server/src/types.ts`**

Add `coords?` to `AlertItem` and `populationServed` + `impactScore?` to `RouteResult`:

```ts
export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  neighbors: string[];
}

export interface RouteResult {
  id: 'A' | 'B' | 'C';
  profile: 'lowest-cost' | 'balanced' | 'lowest-risk';
  label: string;
  color: string;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
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
  populationServed: number;
  impactScore?: {
    jobsCreated: number;
    emissionsReduced_tCO2: number;
    healthImpactScore: number;
  };
}

export interface RouteRecommendation {
  routeId: 'A' | 'B' | 'C';
  rationale: string;
  timestamp: number;
}

export interface TriggerEntry {
  statute: string;
  explanation: string;
  timelineMonths: [number, number];
}

export interface EnvironmentalTrigger {
  routeId: 'A' | 'B' | 'C';
  triggers: TriggerEntry[];
}

export interface AlertItem {
  text: string;
  location: string;
  coords?: { lat: number; lng: number };
}

export interface SierraAlert {
  primary: AlertItem;
  secondary: AlertItem[];
}

export interface ProjectPhase {
  name: string;
  estimatedMonths: [number, number];
  keyDependency: string;
}

export interface ProjectSummary {
  phases: ProjectPhase[];
}

export interface FrictionEntry {
  frictionScore: number;
  justification: string;
}

export interface RegChunk {
  text: string;
  embedding: number[];
  statute: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts server/src/types.ts
git commit -m "feat: extend types — populationServed, impactScore, alert coords, SimulationRun, DataLayerConfig"
```

---

## Task 2: Extend Zustand store

**Files:**
- Modify: `src/store/useAppStore.ts`

- [ ] **Step 1: Write failing test**

In `src/store/useAppStore.test.ts`, add after the existing tests:

```ts
describe('resetSimulation', () => {
  it('clears simulation state back to idle', () => {
    const store = useAppStore.getState();
    store.setSimulationStatus('complete');
    store.setSourcePin([-100, 31]);
    store.setDestinationPin([-99, 30]);
    store.resetSimulation();
    const s = useAppStore.getState();
    expect(s.simulationStatus).toBe('idle');
    expect(s.sourcePin).toBeNull();
    expect(s.destinationPin).toBeNull();
    expect(s.routes).toBeNull();
    expect(s.recommendation).toBeNull();
  });
});

describe('activeDatalayerIds', () => {
  it('starts empty', () => {
    expect(useAppStore.getState().activeDatalayerIds).toEqual([]);
  });

  it('toggleDataLayer adds and removes ids', () => {
    const store = useAppStore.getState();
    store.toggleDataLayer('wind-potential');
    expect(useAppStore.getState().activeDatalayerIds).toContain('wind-potential');
    store.toggleDataLayer('wind-potential');
    expect(useAppStore.getState().activeDatalayerIds).not.toContain('wind-potential');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/store/useAppStore.test.ts
```

Expected: FAIL — `resetSimulation is not a function`, `activeDatalayerIds is not a property`

- [ ] **Step 3: Replace `src/store/useAppStore.ts` with the extended version**

```ts
import { create } from 'zustand';
import type {
  AppState, RouteResult, RouteRecommendation, EnvironmentalTrigger,
  SierraAlert, ProjectSummary, FrictionCache, NarrativeByRoute, SimulationRun,
} from '../types';

interface AppStore extends AppState {
  mapStyle: string;
  recommendation: RouteRecommendation | null;
  triggers: EnvironmentalTrigger[];
  alerts: SierraAlert | null;
  projectSummary: ProjectSummary | null;
  selectedRoute: 'A' | 'B' | 'C' | null;
  frictionCache: FrictionCache | null;
  narrativeByRoute: Partial<NarrativeByRoute>;
  activeTab: 'route-engine' | 'data-layers' | 'archive';
  activeDatalayerIds: string[];
  simulationHistory: SimulationRun[];
  focusedAlertId: number | null; // index into alerts.secondary (-1 = primary)

  // Existing actions
  setSourcePin: (pin: [number, number]) => void;
  setDestinationPin: (pin: [number, number]) => void;
  setVoltage: (v: AppState['voltage']) => void;
  setPriority: (p: AppState['priority']) => void;
  toggleConstraint: (key: keyof AppState['constraints']) => void;
  toggleOverlay: (key: keyof AppState['overlays']) => void;
  resetPins: () => void;
  setMapStyle: (style: string) => void;

  // Phase 3 actions
  setRoutes: (routes: RouteResult[]) => void;
  setSimulationStatus: (status: AppState['simulationStatus']) => void;
  setRecommendation: (r: RouteRecommendation | null) => void;
  setTriggers: (t: EnvironmentalTrigger[]) => void;
  setAlerts: (a: SierraAlert | null) => void;
  setProjectSummary: (s: ProjectSummary | null) => void;
  setSelectedRoute: (id: 'A' | 'B' | 'C' | null) => void;
  setFrictionCache: (cache: FrictionCache) => void;

  // Phase 4 actions
  setNarrativeByRoute: (routeId: 'A' | 'B' | 'C', narrative: string) => void;

  // Navigation actions
  setActiveTab: (tab: 'route-engine' | 'data-layers' | 'archive') => void;

  // New actions
  resetSimulation: () => void;
  toggleDataLayer: (id: string) => void;
  pushSimulationRun: (run: SimulationRun) => void;
  setFocusedAlertId: (idx: number | null) => void;
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
  mapStyle: 'mapbox://styles/mapbox/dark-v11',
  recommendation: null,
  triggers: [],
  alerts: null,
  projectSummary: null,
  selectedRoute: null,
  frictionCache: null,
  narrativeByRoute: {},
  activeTab: 'route-engine',
  activeDatalayerIds: [],
  simulationHistory: [],
  focusedAlertId: null,

  setSourcePin: (pin) => set({ sourcePin: pin }),
  setDestinationPin: (pin) => set({ destinationPin: pin }),
  setVoltage: (voltage) => set({ voltage }),
  setPriority: (priority) => set({ priority }),
  toggleConstraint: (key) => set((s) => ({ constraints: { ...s.constraints, [key]: !s.constraints[key] } })),
  toggleOverlay: (key) => set((s) => ({ overlays: { ...s.overlays, [key]: !s.overlays[key] } })),
  resetPins: () => set({ sourcePin: null, destinationPin: null }),
  setMapStyle: (style) => set({ mapStyle: style }),

  setRoutes: (routes) => set({ routes }),
  setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
  setRecommendation: (recommendation) => set({ recommendation }),
  setTriggers: (triggers) => set({ triggers }),
  setAlerts: (alerts) => set({ alerts }),
  setProjectSummary: (projectSummary) => set({ projectSummary }),
  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),
  setFrictionCache: (frictionCache) => set({ frictionCache }),

  setNarrativeByRoute: (routeId, narrative) =>
    set((state) => ({ narrativeByRoute: { ...state.narrativeByRoute, [routeId]: narrative } })),

  setActiveTab: (activeTab) => set({ activeTab }),

  resetSimulation: () => set({
    simulationStatus: 'idle',
    sourcePin: null,
    destinationPin: null,
    routes: null,
    recommendation: null,
    alerts: null,
    triggers: [],
    projectSummary: null,
    selectedRoute: null,
    narrativeByRoute: {},
    focusedAlertId: null,
  }),

  toggleDataLayer: (id) => set((s) => ({
    activeDatalayerIds: s.activeDatalayerIds.includes(id)
      ? s.activeDatalayerIds.filter((x) => x !== id)
      : [...s.activeDatalayerIds, id],
  })),

  pushSimulationRun: (run) => set((s) => ({
    simulationHistory: [run, ...s.simulationHistory].slice(0, 10),
  })),

  setFocusedAlertId: (focusedAlertId) => set({ focusedAlertId }),
}));
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run src/store/useAppStore.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/useAppStore.ts
git commit -m "feat: store — resetSimulation, toggleDataLayer, pushSimulationRun, focusedAlertId"
```

---

## Task 3: Dark map default + reset UI

**Files:**
- Modify: `src/components/TopNav/TopNav.tsx`
- Modify: `src/components/Sidebar/Sidebar.tsx`

Note: The map style default was already changed to `dark-v11` in Task 2's store replacement.

- [ ] **Step 1: Add reset icon to TopNav**

In `src/components/TopNav/TopNav.tsx`, import `useAppStore` reset action and add a reset icon button. Replace the right controls section:

```tsx
export function TopNav() {
  const exportPdf = useExportPdf();
  const simulationStatus = useAppStore((s) => s.simulationStatus);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const resetSimulation = useAppStore((s) => s.resetSimulation);
  const isReady = simulationStatus === 'complete';

  return (
    <nav style={navStyle}>
      <span style={logoStyle}>SIERRA</span>
      <div style={navItemsStyle}>
        <button
          style={activeTab === 'route-engine' ? navItemActiveStyle : navItemStyle}
          onClick={() => setActiveTab('route-engine')}
        >
          Route Engine
        </button>
        <button
          style={activeTab === 'data-layers' ? navItemActiveStyle : navItemStyle}
          onClick={() => setActiveTab('data-layers')}
        >
          Data Layers
        </button>
        <button
          style={activeTab === 'archive' ? navItemActiveStyle : navItemStyle}
          onClick={() => setActiveTab('archive')}
        >
          Archive
        </button>
      </div>
      <div style={rightControlsStyle}>
        <button
          style={iconButtonStyle}
          aria-label="New simulation"
          title="New simulation"
          onClick={() => {
            if (simulationStatus === 'running') {
              if (!window.confirm('Cancel current simulation?')) return;
            }
            resetSimulation();
            setActiveTab('route-engine');
          }}
        >
          &#8635;
        </button>
        <button style={iconButtonStyle} aria-label="Notifications">
          &#128276;
        </button>
        <button style={iconButtonStyle} aria-label="Settings">
          &#9881;
        </button>
        <button
          style={{
            ...exportButtonBaseStyle,
            cursor: isReady ? 'pointer' : 'not-allowed',
            opacity: isReady ? 1 : 0.4,
          }}
          onClick={isReady ? exportPdf : undefined}
          disabled={!isReady}
        >
          Export PDF
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add "New Simulation" button to Sidebar**

In `src/components/Sidebar/Sidebar.tsx`, add `resetSimulation` to the destructured store values at the top of `Sidebar()`:

```tsx
const resetSimulation = useAppStore((s) => s.resetSimulation);
```

Replace the `complete` branch return:

```tsx
if (simulationStatus === 'complete') {
  return (
    <div style={sidebarContainerStyle}>
      <ResultsPanel />
      <div style={{ padding: '12px 20px', borderTop: '1px solid #2E3140' }}>
        <button
          onClick={resetSimulation}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '0.375rem',
            background: 'transparent',
            border: '1px solid #414755',
            color: '#C1C6D7',
            fontFamily: 'Manrope, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ↺ New Simulation
        </button>
      </div>
    </div>
  );
}
```

Also update the `running` branch to include a cancel button that calls `resetSimulation`:

```tsx
if (simulationStatus === 'running') {
  return (
    <div style={sidebarContainerStyle}>
      <StreamPanel onComplete={handleStreamComplete} onCancel={() => {
        handleCancel();
        resetSimulation();
      }} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TopNav/TopNav.tsx src/components/Sidebar/Sidebar.tsx
git commit -m "feat: reset simulation — TopNav icon + Sidebar New Simulation button"
```

---

## Task 4: Pin colors + placement mode indicator

**Files:**
- Modify: `src/components/MapCanvas/PinMarkers.tsx`
- Modify: `src/components/Sidebar/PinPlacementSection.tsx`

- [ ] **Step 1: Update PinMarkers colors and add cancel button**

Replace `src/components/MapCanvas/PinMarkers.tsx`:

```tsx
import { Marker } from 'react-map-gl/mapbox';
import { useAppStore } from '../../store/useAppStore';
import './PinMarkers.css';

interface PinProps {
  coordinates: [number, number];
  label: string;
  bgColor: string;
  iconColor: string;
  pulseColor: string;
  onCancel: () => void;
}

function Pin({ coordinates, label, bgColor, iconColor, pulseColor, onCancel }: PinProps) {
  return (
    <Marker longitude={coordinates[0]} latitude={coordinates[1]} anchor="bottom">
      <div className="pin-marker">
        <div className="pin-pulse" style={{ backgroundColor: pulseColor }} />
        <div className="pin-icon" style={{ backgroundColor: bgColor }}>
          <span className="pin-icon-inner" style={{ color: iconColor }}>
            {label[0]}
          </span>
        </div>
        <div className="pin-label">{label}</div>
        <button
          className="pin-cancel"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          aria-label={`Remove ${label} pin`}
        >
          ×
        </button>
      </div>
    </Marker>
  );
}

export function PinMarkers() {
  const sourcePin = useAppStore((s) => s.sourcePin);
  const destinationPin = useAppStore((s) => s.destinationPin);
  const setSourcePin = useAppStore((s) => s.setSourcePin);
  const setDestinationPin = useAppStore((s) => s.setDestinationPin);

  return (
    <>
      {sourcePin && (
        <Pin
          coordinates={sourcePin}
          label="Source"
          bgColor="#22c55e"
          iconColor="#052e16"
          pulseColor="rgba(34, 197, 94, 0.25)"
          onCancel={() => setSourcePin(null as unknown as [number, number])}
        />
      )}
      {destinationPin && (
        <Pin
          coordinates={destinationPin}
          label="Destination"
          bgColor="#ef4444"
          iconColor="#450a0a"
          pulseColor="rgba(239, 68, 68, 0.25)"
          onCancel={() => setDestinationPin(null as unknown as [number, number])}
        />
      )}
    </>
  );
}
```

Note: `setSourcePin` / `setDestinationPin` accept `[number,number]` — the store currently has no `clearSourcePin` action. We use `resetPins` for both, but we need individual clear actions. Instead of changing the store, update `PinMarkers` to call `useAppStore.getState()` directly:

```tsx
onCancel={() => useAppStore.setState({ sourcePin: null })}
// and
onCancel={() => useAppStore.setState({ destinationPin: null })}
```

Replace the two `onCancel` props:

```tsx
onCancel={() => useAppStore.setState({ sourcePin: null })}
// ...
onCancel={() => useAppStore.setState({ destinationPin: null })}
```

- [ ] **Step 2: Add `.pin-cancel` style to `PinMarkers.css`**

Append to the end of `src/components/MapCanvas/PinMarkers.css`:

```css
.pin-cancel {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1C1B1B;
  border: 1px solid #414755;
  color: #C1C6D7;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  z-index: 2;
}
.pin-cancel:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}
```

- [ ] **Step 3: Replace PinPlacementSection with status bar**

Replace `src/components/Sidebar/PinPlacementSection.tsx`:

```tsx
import { useAppStore } from '../../store/useAppStore';

function formatPin(pin: [number, number] | null): string {
  if (!pin) return '';
  return `${pin[1].toFixed(4)}, ${pin[0].toFixed(4)}`;
}

export function PinPlacementSection() {
  const sourcePin = useAppStore((s) => s.sourcePin);
  const destinationPin = useAppStore((s) => s.destinationPin);

  const phase = !sourcePin ? 'source' : !destinationPin ? 'destination' : 'ready';

  const statusColors: Record<typeof phase, string> = {
    source: '#22c55e',
    destination: '#ef4444',
    ready: '#A7C8FF',
  };

  const statusMessages: Record<typeof phase, string> = {
    source: 'Click map to place SOURCE pin',
    destination: 'Click map to place DESTINATION pin',
    ready: 'Both pins placed — ready to run simulation',
  };

  return (
    <div style={{ padding: '12px 20px' }}>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#C1C6D7',
          marginBottom: 8,
        }}
      >
        Pin Placement
      </p>
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${statusColors[phase]}55`,
          borderRadius: 6,
          padding: '8px 12px',
        }}
      >
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: statusColors[phase],
            margin: 0,
          }}
        >
          {statusMessages[phase]}
        </p>
        {sourcePin && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7280', margin: '4px 0 0' }}>
            Source: {formatPin(sourcePin)}
          </p>
        )}
        {destinationPin && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7280', margin: '2px 0 0' }}>
            Dest: {formatPin(destinationPin)}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/MapCanvas/PinMarkers.tsx src/components/MapCanvas/PinMarkers.css src/components/Sidebar/PinPlacementSection.tsx
git commit -m "feat: pin colors (green/red), cancel button, placement mode status bar"
```

---

## Task 5: Population metric — server + client

**Files:**
- Modify: `server/src/routes/api.ts`
- Modify: `src/components/Sidebar/results/RouteCards.tsx`

- [ ] **Step 1: Add populationServed to cannedStubRoutes in `server/src/routes/api.ts`**

In the `cannedStubRoutes` function, add `populationServed` and `impactScore` to each route object. Find the three route objects and add the fields:

Route A (after `narrativeSummary: ''`):
```ts
populationServed: 1_020_000,
impactScore: { jobsCreated: 3_200, emissionsReduced_tCO2: 980_000, healthImpactScore: 62 },
```

Route B (after `narrativeSummary: ''`):
```ts
populationServed: 2_150_000,
impactScore: { jobsCreated: 5_800, emissionsReduced_tCO2: 1_840_000, healthImpactScore: 78 },
```

Route C (after `narrativeSummary: ''`):
```ts
populationServed: 1_380_000,
impactScore: { jobsCreated: 4_100, emissionsReduced_tCO2: 1_420_000, healthImpactScore: 71 },
```

- [ ] **Step 2: Add populationServed to real route computation in `api.ts`**

In the `routes = routeDefs.map(...)` section, add `populationServed` computation after `narrativeSummary: ''`:

```ts
// Population coefficients per profile — B (Max Population) scores highest
const popCoeff: Record<string, number> = {
  'lowest-cost': 8_000,
  'balanced': 15_000,
  'lowest-risk': 6_500,
};
// ...
return {
  // ...existing fields...
  narrativeSummary: '',
  populationServed: Math.round(miles * (popCoeff[r.profile] ?? 8_000)),
  impactScore: {
    jobsCreated: Math.round(miles * 25),
    emissionsReduced_tCO2: Math.round(miles * 8_200),
    healthImpactScore: Math.round(55 + (popCoeff[r.profile] ?? 8_000) / 1_000),
  },
};
```

The full modified `routes` map should look like:

```ts
const popCoeff: Record<string, number> = {
  'lowest-cost': 8_000,
  'balanced': 15_000,
  'lowest-risk': 6_500,
};

const routes = routeDefs.map((r) => {
  const miles = totalDistanceMiles(r.path);
  const segs = buildSegmentJustifications(r.path);
  const avgFriction = segs.length
    ? segs.reduce((s, j) => s + j.frictionScore, 0) / segs.length
    : 0.5;
  const frictionMultiplier = 0.75 + avgFriction * 0.75;
  const [pMin, pMax] = r.permitting;
  const permittingScale = 0.8 + avgFriction * 0.6;
  return {
    id: r.id,
    profile: r.profile,
    label: r.label,
    color: r.color,
    geometry: nodeIdPathToLineString(r.path),
    metrics: {
      distanceMiles: Math.round(miles),
      estimatedCapexUSD: Math.round(miles * r.capexPerMile * frictionMultiplier),
      permittingMonths: [
        Math.round(pMin * permittingScale),
        Math.round(pMax * permittingScale),
      ] as [number, number],
    },
    segmentJustifications: segs,
    narrativeSummary: '',
    populationServed: Math.round(miles * (popCoeff[r.profile] ?? 8_000)),
    impactScore: {
      jobsCreated: Math.round(miles * 25),
      emissionsReduced_tCO2: Math.round(miles * 8_200),
      healthImpactScore: Math.round(55 + (popCoeff[r.profile] ?? 8_000) / 1_000),
    },
  };
});
```

- [ ] **Step 3: Add population badge to RouteCards**

In `src/components/Sidebar/results/RouteCards.tsx`, add a helper at the top:

```tsx
function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}
```

In the compact header section (after the distance/cost/permitting line), add:

```tsx
{route.populationServed != null && (
  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#4ade80', marginTop: 2 }}>
    👥 {formatPop(route.populationServed)} served
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/api.ts src/components/Sidebar/results/RouteCards.tsx
git commit -m "feat: population served metric — server computation + RouteCards badge"
```

---

## Task 6: Alert coords + risk markers on map

**Files:**
- Modify: `server/src/cannedFallback.ts`
- Modify: `src/components/MapCanvas/MapCanvas.tsx`

- [ ] **Step 1: Add coords to CANNED_ALERTS in `server/src/cannedFallback.ts`**

Update the `CANNED_ALERTS` export. Add `coords` to primary and secondary:

```ts
export const CANNED_ALERTS: SierraAlert = {
  primary: {
    text: 'Nolan County landowner opposition cluster identified. Historical parcel records show three adjacent agricultural landowners (approximately 8,400 acres combined) who actively contested a 2019 wind transmission project. Eminent domain proceedings may extend ROW acquisition timeline by 18–24 months and add $4–7M in legal costs.',
    location: 'Nolan County',
    coords: { lat: 32.298, lng: -100.399 },
  },
  secondary: [
    {
      text: 'Edwards Aquifer Authority coordination required. Route C alignment in Sutton County falls within the Edwards Aquifer Protection Program boundary — a separate state-level review process running concurrently with federal NEPA.',
      location: 'Sutton County',
      coords: { lat: 30.536, lng: -100.517 },
    },
    {
      text: 'PUCT Certificate of Convenience and Necessity (CCN) application processing times have increased from an average of 14 months to 22 months since 2022 due to ERCOT Competitive Renewable Energy Zone (CREZ) backlog.',
      location: 'Austin, TX (PUCT)',
      coords: { lat: 30.267, lng: -97.743 },
    },
  ],
};
```

- [ ] **Step 2: Add alert markers to MapCanvas**

In `src/components/MapCanvas/MapCanvas.tsx`, add these imports at the top:

```tsx
import { Marker } from 'react-map-gl/mapbox';
```

Add store subscriptions after the existing ones:

```tsx
const alerts = useAppStore((s) => s.alerts);
const setFocusedAlertId = useAppStore((s) => s.setFocusedAlertId);
const setActiveTab = useAppStore((s) => s.setActiveTab);
```

Add the alert markers JSX inside the `<Map>` element, after `<MapControls mapRef={mapRef} />`:

```tsx
{/* Alert risk markers — only shown when simulation is complete */}
{alerts?.primary.coords && (
  <Marker
    longitude={alerts.primary.coords.lng}
    latitude={alerts.primary.coords.lat}
    anchor="center"
  >
    <button
      aria-label="Primary risk alert"
      onClick={() => {
        mapRef.current?.flyTo({ center: [alerts.primary.coords!.lng, alerts.primary.coords!.lat], zoom: 10 });
        setFocusedAlertId(-1);
        setActiveTab('route-engine');
      }}
      style={{
        background: 'rgba(239,68,68,0.9)',
        border: '2px solid #ef4444',
        borderRadius: '50%',
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 14,
        animation: 'pulse-ring 2s ease-out infinite',
        boxShadow: '0 0 0 4px rgba(239,68,68,0.3)',
      }}
    >
      ⚠
    </button>
  </Marker>
)}
{alerts?.secondary.map((alert, i) =>
  alert.coords ? (
    <Marker
      key={i}
      longitude={alert.coords.lng}
      latitude={alert.coords.lat}
      anchor="center"
    >
      <button
        aria-label={`Risk alert: ${alert.location}`}
        onClick={() => {
          mapRef.current?.flyTo({ center: [alert.coords!.lng, alert.coords!.lat], zoom: 10 });
          setFocusedAlertId(i);
          setActiveTab('route-engine');
        }}
        style={{
          background: 'rgba(251,191,36,0.85)',
          border: '2px solid #fbbf24',
          borderRadius: '50%',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        ⚠
      </button>
    </Marker>
  ) : null,
)}
```

- [ ] **Step 3: Highlight focused alert in SierraAlerts**

In `src/components/Sidebar/results/SierraAlerts.tsx`, subscribe to `focusedAlertId`:

```tsx
const focusedAlertId = useAppStore((s) => s.focusedAlertId);
```

Add a highlight border to the primary alert div when `focusedAlertId === -1`:

```tsx
<div
  style={{
    borderRadius: 8,
    border: `1px solid ${focusedAlertId === -1 ? 'rgba(248,113,113,0.8)' : 'rgba(248,113,113,0.35)'}`,
    background: focusedAlertId === -1 ? 'rgba(248,113,113,0.12)' : 'rgba(248,113,113,0.07)',
    padding: '10px 12px',
    marginBottom: 6,
    transition: 'border-color 0.2s, background 0.2s',
  }}
>
```

For secondary alerts, add `focusedAlertId === i` check to their border style similarly.

Also auto-expand secondary alerts when `focusedAlertId >= 0`:

```tsx
const [showSecondary, setShowSecondary] = useState(false);

// Auto-expand when a secondary alert is focused via map click
useEffect(() => {
  if (focusedAlertId !== null && focusedAlertId >= 0) setShowSecondary(true);
}, [focusedAlertId]);
```

Add `import { useState, useEffect } from 'react';` at the top.

- [ ] **Step 4: Commit**

```bash
git add server/src/cannedFallback.ts src/components/MapCanvas/MapCanvas.tsx src/components/Sidebar/results/SierraAlerts.tsx
git commit -m "feat: risk markers on map — alert coords, Mapbox markers, flyTo + sidebar highlight"
```

---

## Task 7: Data layer config + GeoJSON files

**Files:**
- Create: `src/config/dataLayers.ts`
- Create: `public/data/layers/*.geojson` (6 files)

- [ ] **Step 1: Create `src/config/dataLayers.ts`**

```ts
import type { DataLayerConfig } from '../types';

export const DATA_LAYERS: DataLayerConfig[] = [
  {
    id: 'wind-potential',
    name: 'Wind Potential Zones',
    description: 'High-yield wind resource areas identified by Princeton NZA Optimal Renewable Buildout',
    color: '#7c3aed',
    type: 'fill',
    sourceUrl: '/data/layers/wind-potential.geojson',
    opacity: 0.35,
    attribution: 'Princeton NZA (illustrative)',
  },
  {
    id: 'solar-irradiance',
    name: 'Solar Irradiance',
    description: 'High-irradiance zones suitable for utility-scale solar development',
    color: '#f59e0b',
    type: 'fill',
    sourceUrl: '/data/layers/solar-irradiance.geojson',
    opacity: 0.35,
    attribution: 'Princeton NZA (illustrative)',
  },
  {
    id: 'co2-storage',
    name: 'CO₂ Storage Formations',
    description: 'Saline aquifers and depleted reservoirs for geologic carbon sequestration',
    color: '#0d9488',
    type: 'fill',
    sourceUrl: '/data/layers/co2-storage.geojson',
    opacity: 0.4,
    attribution: 'Princeton NZA (illustrative)',
  },
  {
    id: 'tx-corridors-2030',
    name: 'Transmission Corridors 2030',
    description: 'Projected high-voltage transmission expansion paths by 2030',
    color: '#f97316',
    type: 'line',
    sourceUrl: '/data/layers/tx-corridors-2030.geojson',
    opacity: 0.8,
    attribution: 'REPEAT Project (illustrative)',
  },
  {
    id: 'tx-corridors-2050',
    name: 'Transmission Corridors 2050',
    description: 'Long-range transmission buildout corridors for 2050 net-zero scenarios',
    color: '#ef4444',
    type: 'line',
    sourceUrl: '/data/layers/tx-corridors-2050.geojson',
    opacity: 0.7,
    attribution: 'REPEAT Project (illustrative)',
  },
  {
    id: 'constrained-land',
    name: 'Constrained Land (CLUA)',
    description: 'Protected areas, ecological constraints, and no-go zones per Princeton CLUA assumptions',
    color: '#6b7280',
    type: 'fill',
    sourceUrl: '/data/layers/constrained-land.geojson',
    opacity: 0.3,
    attribution: 'Princeton NZA CLUA (illustrative)',
  },
];
```

- [ ] **Step 2: Create `public/data/layers/wind-potential.geojson`**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "West Texas Panhandle Wind Zone", "capacity_gw": 45 },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-103.0, 33.5], [-100.0, 33.5], [-100.0, 35.5],
          [-103.0, 35.5], [-103.0, 33.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Permian Basin Wind Zone", "capacity_gw": 28 },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-103.5, 31.0], [-100.5, 31.0], [-100.5, 33.0],
          [-103.5, 33.0], [-103.5, 31.0]
        ]]
      }
    }
  ]
}
```

- [ ] **Step 3: Create `public/data/layers/solar-irradiance.geojson`**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Trans-Pecos Solar Zone", "irradiance_kwh_m2": 6.2 },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-105.0, 29.5], [-102.0, 29.5], [-102.0, 31.5],
          [-105.0, 31.5], [-105.0, 29.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "South Texas Solar Zone", "irradiance_kwh_m2": 5.8 },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-100.0, 26.5], [-97.0, 26.5], [-97.0, 28.5],
          [-100.0, 28.5], [-100.0, 26.5]
        ]]
      }
    }
  ]
}
```

- [ ] **Step 4: Create `public/data/layers/co2-storage.geojson`**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Permian Basin CO₂ Storage", "capacity_gt": 50 },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-104.0, 30.5], [-101.0, 30.5], [-101.0, 32.5],
          [-104.0, 32.5], [-104.0, 30.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Gulf Coast Saline Aquifer", "capacity_gt": 120 },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-97.5, 26.5], [-94.5, 26.5], [-94.5, 29.0],
          [-97.5, 29.0], [-97.5, 26.5]
        ]]
      }
    }
  ]
}
```

- [ ] **Step 5: Create `public/data/layers/tx-corridors-2030.geojson`**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "West TX → Dallas 2030 Corridor", "voltage_kv": 765, "capacity_gw": 12 },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-102.5, 31.8], [-101.0, 32.5], [-99.0, 32.8], [-97.0, 32.7], [-96.8, 32.8]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Permian Basin → San Antonio 2030", "voltage_kv": 500, "capacity_gw": 8 },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-102.5, 31.5], [-101.0, 30.5], [-99.5, 29.8], [-98.5, 29.4]
        ]
      }
    }
  ]
}
```

- [ ] **Step 6: Create `public/data/layers/tx-corridors-2050.geojson`**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Gulf Wind → Houston 2050", "voltage_kv": 765, "capacity_gw": 20 },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-97.0, 27.5], [-96.5, 28.5], [-96.0, 29.5], [-95.5, 29.8], [-95.3, 29.7]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Pan-Texas HVDC Backbone 2050", "voltage_kv": 800, "capacity_gw": 30 },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-104.5, 31.5], [-102.0, 31.8], [-100.0, 32.2],
          [-98.0, 32.5], [-96.5, 32.7], [-95.0, 30.0], [-94.5, 29.5]
        ]
      }
    }
  ]
}
```

- [ ] **Step 7: Create `public/data/layers/constrained-land.geojson`**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Big Bend National Park", "constraint_type": "protected" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-103.7, 29.0], [-102.9, 29.0], [-102.9, 29.7],
          [-103.7, 29.7], [-103.7, 29.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Dunes Sagebrush Lizard ESA Habitat", "constraint_type": "esa_critical" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-103.5, 31.5], [-102.5, 31.5], [-102.5, 32.5],
          [-103.5, 32.5], [-103.5, 31.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Edwards Aquifer Recharge Zone", "constraint_type": "water_resource" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-100.5, 29.5], [-99.0, 29.5], [-99.0, 30.5],
          [-100.5, 30.5], [-100.5, 29.5]
        ]]
      }
    }
  ]
}
```

- [ ] **Step 8: Commit**

```bash
git add src/config/dataLayers.ts public/data/
git commit -m "feat: data layer config + 6 Princeton NZA-inspired GeoJSON layers"
```

---

## Task 8: DataLayerRenderer (map component)

**Files:**
- Create: `src/components/MapCanvas/DataLayerRenderer.tsx`

- [ ] **Step 1: Create `src/components/MapCanvas/DataLayerRenderer.tsx`**

```tsx
import { Source, Layer } from 'react-map-gl/mapbox';
import { useAppStore } from '../../store/useAppStore';
import { DATA_LAYERS } from '../../config/dataLayers';

export function DataLayerRenderer() {
  const activeDatalayerIds = useAppStore((s) => s.activeDatalayerIds);

  const activeLayers = DATA_LAYERS.filter((l) => activeDatalayerIds.includes(l.id));

  return (
    <>
      {activeLayers.map((layer) => (
        <Source key={layer.id} id={layer.id} type="geojson" data={layer.sourceUrl}>
          {layer.type === 'fill' ? (
            <Layer
              id={`${layer.id}-fill`}
              type="fill"
              paint={{
                'fill-color': layer.color,
                'fill-opacity': layer.opacity,
              }}
            />
          ) : (
            <Layer
              id={`${layer.id}-line`}
              type="line"
              paint={{
                'line-color': layer.color,
                'line-opacity': layer.opacity,
                'line-width': 3,
                'line-dasharray': [4, 2],
              }}
            />
          )}
        </Source>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Mount DataLayerRenderer inside MapCanvas**

In `src/components/MapCanvas/MapCanvas.tsx`, add the import:

```tsx
import { DataLayerRenderer } from './DataLayerRenderer';
```

Add `<DataLayerRenderer />` inside the `<Map>` element, after `<OverlayLayers />`:

```tsx
<OverlayLayers />
<DataLayerRenderer />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MapCanvas/DataLayerRenderer.tsx src/components/MapCanvas/MapCanvas.tsx
git commit -m "feat: DataLayerRenderer — renders active NZA data layers on map"
```

---

## Task 9: DataLayersPanel (sidebar UI)

**Files:**
- Create: `src/components/Sidebar/DataLayersPanel.tsx`

- [ ] **Step 1: Create `src/components/Sidebar/DataLayersPanel.tsx`**

```tsx
import { useAppStore } from '../../store/useAppStore';
import { DATA_LAYERS } from '../../config/dataLayers';

export function DataLayersPanel() {
  const activeDatalayerIds = useAppStore((s) => s.activeDatalayerIds);
  const toggleDataLayer = useAppStore((s) => s.toggleDataLayer);

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        bottom: '1rem',
        width: 320,
        zIndex: 10,
        backgroundColor: '#1C1B1B',
        borderRadius: '0.75rem',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2E3140' }}>
        <p
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: '#E5E2E1',
            margin: '0 0 4px',
          }}
        >
          Data Layers
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7280', margin: 0 }}>
          Toggle Princeton NZA and REPEAT geospatial overlays
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DATA_LAYERS.map((layer) => {
          const isActive = activeDatalayerIds.includes(layer.id);
          return (
            <div
              key={layer.id}
              style={{
                borderRadius: 8,
                border: `1px solid ${isActive ? layer.color + '66' : '#2E3140'}`,
                background: isActive ? `${layer.color}11` : 'rgba(255,255,255,0.02)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onClick={() => toggleDataLayer(layer.id)}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: layer.type === 'line' ? 2 : 4,
                  background: layer.color,
                  flexShrink: 0,
                  marginTop: 2,
                  opacity: isActive ? 1 : 0.4,
                }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    color: isActive ? '#E5E2E1' : '#9BA3B5',
                    margin: '0 0 2px',
                  }}
                >
                  {layer.name}
                </p>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 10,
                    color: '#6B7280',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {layer.description}
                </p>
              </div>
              <div
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 9,
                  background: isActive ? layer.color : '#2E3140',
                  flexShrink: 0,
                  position: 'relative',
                  transition: 'background 0.15s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: isActive ? 15 : 3,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.15s',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #2E3140',
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          color: '#414755',
          textAlign: 'center',
        }}
      >
        Princeton NZA / REPEAT Project — illustrative data for demonstration purposes
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar/DataLayersPanel.tsx
git commit -m "feat: DataLayersPanel — toggle cards for NZA data layers"
```

---

## Task 10: Refactor App.tsx — always render map

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx to always render the map**

```tsx
import { MapCanvas } from './components/MapCanvas/MapCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TopNav } from './components/TopNav/TopNav';
import { DataLayersPanel } from './components/Sidebar/DataLayersPanel';
import { ArchivePanel } from './components/Sidebar/ArchivePanel';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const activeTab = useAppStore((s) => s.activeTab);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#131313',
      }}
    >
      <TopNav />
      {/* Map always renders — data layer overlays need it to persist across tabs */}
      <MapCanvas />
      {activeTab === 'route-engine' && <Sidebar />}
      {activeTab === 'data-layers' && <DataLayersPanel />}
      {activeTab === 'archive' && <ArchivePanel />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: always render MapCanvas — data layers visible across all tabs"
```

---

## Task 11: Archive — history capture + ArchivePanel

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`
- Create: `src/components/Sidebar/ArchivePanel.tsx`

- [ ] **Step 1: Push simulation snapshot in Sidebar on complete**

In `src/components/Sidebar/Sidebar.tsx`, add `pushSimulationRun` to the store destructuring:

```tsx
const pushSimulationRun = useAppStore((s) => s.pushSimulationRun);
```

Update `handleStreamComplete` to push the run before marking status:

```tsx
const handleStreamComplete = useCallback(() => {
  const state = useAppStore.getState();
  if (state.routes && state.routes.length > 0) {
    const formatPin = (p: [number, number] | null) =>
      p ? `${p[1].toFixed(3)}, ${p[0].toFixed(3)}` : 'Unknown';
    pushSimulationRun({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      sourcePinLabel: formatPin(state.sourcePin),
      destPinLabel: formatPin(state.destinationPin),
      recommendedRouteId: state.recommendation?.routeId ?? null,
      routes: state.routes,
    });
  }
  setSimulationStatus('complete');
}, [setSimulationStatus, pushSimulationRun]);
```

- [ ] **Step 2: Create `src/components/Sidebar/ArchivePanel.tsx`**

```tsx
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { SimulationRun } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}

function RunCard({ run }: { run: SimulationRun }) {
  const [expanded, setExpanded] = useState(false);
  const recommended = run.routes.find((r) => r.id === run.recommendedRouteId);

  return (
    <div
      style={{
        borderRadius: 8,
        border: '1px solid #2E3140',
        background: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}
        onClick={() => setExpanded((x) => !x)}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              color: '#9BA3B5',
              margin: '0 0 4px',
            }}
          >
            {formatDate(run.timestamp)}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#C1C6D7', margin: '0 0 2px' }}>
            {run.sourcePinLabel} → {run.destPinLabel}
          </p>
          {run.recommendedRouteId && (
            <span
              style={{
                display: 'inline-block',
                background: `${recommended?.color ?? '#A7C8FF'}22`,
                border: `1px solid ${recommended?.color ?? '#A7C8FF'}66`,
                borderRadius: 4,
                padding: '1px 6px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                color: recommended?.color ?? '#A7C8FF',
              }}
            >
              ★ {recommended?.label ?? `Route ${run.recommendedRouteId}`}
            </span>
          )}
        </div>
        <span style={{ color: '#6B7280', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #2E3140', padding: '8px 12px 10px' }}>
          {run.routes.map((route) => (
            <div key={route.id} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: route.color }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#E8ECF4' }}>
                  {route.label}
                </span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7280', margin: '0 0 0 14px' }}>
                {route.metrics.distanceMiles} mi · 👥 {formatPop(route.populationServed)} served
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ArchivePanel() {
  const simulationHistory = useAppStore((s) => s.simulationHistory);

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        bottom: '1rem',
        width: 320,
        zIndex: 10,
        backgroundColor: '#1C1B1B',
        borderRadius: '0.75rem',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2E3140' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, color: '#E5E2E1', margin: '0 0 4px' }}>
          Archive
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7280', margin: 0 }}>
          {simulationHistory.length} simulation{simulationHistory.length !== 1 ? 's' : ''} recorded this session
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {simulationHistory.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#414755', textAlign: 'center', margin: 0 }}>
              No simulations yet.
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#3a3f4b', textAlign: 'center', margin: 0 }}>
              Run a simulation to see results here.
            </p>
          </div>
        ) : (
          simulationHistory.map((run) => <RunCard key={run.id} run={run} />)
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar/Sidebar.tsx src/components/Sidebar/ArchivePanel.tsx
git commit -m "feat: archive — simulation history capture + ArchivePanel with expand/collapse run cards"
```

---

## Task 12: Route renaming (Tier 3)

**Files:**
- Modify: `server/src/routes/api.ts`
- Modify: `server/src/cannedFallback.ts`

- [ ] **Step 1: Update route labels and colors in `api.ts` cannedStubRoutes**

Find and replace the three route label/color pairs in `cannedStubRoutes`:

Route A: `label: 'Route A — Least-Cost'`, color stays `'#A7C8FF'`
Route B: `label: 'Route B — Max Population Served'`, color changes to `'#4ade80'`
Route C: `label: 'Route C — Renewable-Optimized'`, color stays `'#E8B3FF'`

- [ ] **Step 2: Update route labels and colors in `routeDefs` array in `api.ts`**

In the real routing `routeDefs` array:

```ts
const routeDefs = [
  {
    id: 'A',
    profile: 'lowest-cost',
    label: 'Route A — Least-Cost',
    color: '#A7C8FF',
    path: pathA,
    capexPerMile: 3_500_000,
    permitting: [18, 24] as [number, number],
  },
  {
    id: 'B',
    profile: 'balanced',
    label: 'Route B — Max Population Served',
    color: '#4ade80',
    path: pathB,
    capexPerMile: 4_200_000,
    permitting: [24, 36] as [number, number],
  },
  {
    id: 'C',
    profile: 'lowest-risk',
    label: 'Route C — Renewable-Optimized',
    color: '#E8B3FF',
    path: pathC,
    capexPerMile: 5_000_000,
    permitting: [30, 48] as [number, number],
  },
];
```

- [ ] **Step 3: Update cannedFallback.ts reasoning stream and recommendation**

In `CANNED_REASONING_STREAM`, update the final three lines:

```
Route A finalized: 118 miles via Pecos Basin — leverages US-385 ROW corridor, least-cost profile, moderate regulatory exposure.
Route B finalized: 134 miles via Permian Basin midpoint — maximizes population served along I-20 and US-87 corridors.
Route C finalized: 152 miles via Edwards Plateau bypass — renewable-optimized, connects wind and solar resource zones.

Sierra Recommends: Route C. Preparing justification and risk summary.
```

Update `CANNED_RECOMMENDATION.rationale`:

```ts
rationale: 'Route C — Renewable-Optimized is the recommended corridor because it fully bypasses the Edwards Aquifer recharge zone in Sutton County, avoids the ESA-designated Dunes Sagebrush Lizard habitat in Reeves County, and traverses the highest-density wind and solar resource zones identified by the Princeton NZA Optimal Renewable Buildout analysis. Although Route C adds approximately 34 miles versus Route A, the avoided ESA Section 7 consultation and CWA Section 404 individual permit reduce the permitting timeline by an estimated 12–18 months, while the route\'s alignment through renewable corridors positions the infrastructure for long-term grid integration with projected 2030–2050 buildout scenarios.',
```

Update the three narrative fetch labels in `Sidebar.tsx` to match new route labels:

```tsx
body: JSON.stringify({ routeId: 'A', routeLabel: 'Route A — Least-Cost', constraints: routeBody.constraints }),
// ...
body: JSON.stringify({ routeId: 'B', routeLabel: 'Route B — Max Population Served', constraints: routeBody.constraints }),
// ...
body: JSON.stringify({ routeId: 'C', routeLabel: 'Route C — Renewable-Optimized', constraints: routeBody.constraints }),
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/api.ts server/src/cannedFallback.ts src/components/Sidebar/Sidebar.tsx
git commit -m "feat: route renaming — Least-Cost / Max Population Served / Renewable-Optimized + NZA rationale"
```

---

## Task 13: ImpactScorePanel (Tier 3)

**Files:**
- Create: `src/components/Sidebar/results/ImpactScorePanel.tsx`
- Modify: `src/components/Sidebar/results/ResultsPanel.tsx`

- [ ] **Step 1: Create `src/components/Sidebar/results/ImpactScorePanel.tsx`**

```tsx
import { useAppStore } from '../../../store/useAppStore';

function formatNum(n: number, unit: string) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ${unit}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ${unit}`;
  return `${n} ${unit}`;
}

function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}

export function ImpactScorePanel() {
  const routes = useAppStore((s) => s.routes);
  const recommendation = useAppStore((s) => s.recommendation);

  if (!routes || routes.length === 0) return null;

  const metrics = [
    {
      icon: '👥',
      label: 'Population Served',
      getValue: (r: typeof routes[0]) => formatPop(r.populationServed),
    },
    {
      icon: '💼',
      label: 'Jobs Created',
      getValue: (r: typeof routes[0]) => formatNum(r.impactScore?.jobsCreated ?? 0, 'FTE'),
    },
    {
      icon: '🌿',
      label: 'CO₂ Reduced',
      getValue: (r: typeof routes[0]) => formatNum(r.impactScore?.emissionsReduced_tCO2 ?? 0, 't/yr'),
    },
    {
      icon: '❤️',
      label: 'Health Index',
      getValue: (r: typeof routes[0]) => `${r.impactScore?.healthImpactScore ?? 0}/100`,
    },
  ];

  return (
    <div style={{ padding: '16px 20px 0' }}>
      <div
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: '#9BA3B5',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Impact Estimates
      </div>

      <div
        style={{
          borderRadius: 8,
          border: '1px solid #2E3140',
          overflow: 'hidden',
        }}
      >
        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr repeat(3, 64px)',
            padding: '6px 10px',
            borderBottom: '1px solid #2E3140',
          }}
        >
          <span />
          {routes.map((r) => (
            <span
              key={r.id}
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                color: recommendation?.routeId === r.id ? r.color : '#6B7280',
                textAlign: 'center',
              }}
            >
              {r.id}
            </span>
          ))}
        </div>

        {/* Metric rows */}
        {metrics.map((metric, idx) => (
          <div
            key={metric.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr repeat(3, 64px)',
              padding: '6px 10px',
              borderBottom: idx < metrics.length - 1 ? '1px solid #1C1B1B' : 'none',
              background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                color: '#9BA3B5',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {metric.icon} {metric.label}
            </span>
            {routes.map((r) => (
              <span
                key={r.id}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 10,
                  color: recommendation?.routeId === r.id ? '#E8ECF4' : '#6B7280',
                  fontWeight: recommendation?.routeId === r.id ? 600 : 400,
                  textAlign: 'center',
                }}
              >
                {metric.getValue(r)}
              </span>
            ))}
          </div>
        ))}
      </div>

      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 9,
          color: '#414755',
          margin: '6px 0 0',
          textAlign: 'center',
        }}
      >
        Illustrative estimates based on Princeton NZA coefficients
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Add ImpactScorePanel to ResultsPanel**

In `src/components/Sidebar/results/ResultsPanel.tsx`:

```tsx
import { SierraRecommends } from './SierraRecommends';
import { RadarChartPanel } from './RadarChartPanel';
import { RouteCards } from './RouteCards';
import { ImpactScorePanel } from './ImpactScorePanel';
import { OverlayControls } from './OverlayControls';
import { SierraAlerts } from './SierraAlerts';
import { EnvTriggerPanel } from './EnvTriggerPanel';
import { ProjectSummary } from './ProjectSummary';

export function ResultsPanel() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
      <SierraRecommends />
      <RadarChartPanel />
      <RouteCards />
      <ImpactScorePanel />
      <OverlayControls />
      <SierraAlerts />
      <EnvTriggerPanel />
      <ProjectSummary />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar/results/ImpactScorePanel.tsx src/components/Sidebar/results/ResultsPanel.tsx
git commit -m "feat: ImpactScorePanel — population/jobs/emissions/health grid per route"
```

---

## Self-Review Notes

After all tasks complete, verify:

1. `resetSimulation` in TopNav also switches to `route-engine` tab so the map/sidebar are visible
2. PinMarkers cancel button uses `useAppStore.setState({ sourcePin: null })` directly — no type casting needed since `setState` accepts a partial
3. Alert markers only appear when `alerts !== null` (post-simulation) — confirmed by the `alerts?.primary.coords &&` guard
4. `DataLayerRenderer` mounts inside `MapCanvas` — it always renders regardless of active tab because the map always renders now
5. `handleStreamComplete` in Sidebar reads `useAppStore.getState()` directly (not from hook closure) to avoid stale closures on the routes/recommendation state
6. Route renaming changes `color` for Route B from `#FFBC7C` (orange) to `#4ade80` (green) — verify this doesn't break the radar chart which uses `route.color`
7. `impactScore` is typed as optional (`impactScore?`) on `RouteResult` — `ImpactScorePanel` uses `?? 0` fallbacks throughout
