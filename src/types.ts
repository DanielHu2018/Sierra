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
