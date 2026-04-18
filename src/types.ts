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
  frictionScore: number;   // 0–1
  justification: string;
}

export type FrictionCache = Record<string, FrictionNode>;

export interface RouteResult {
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

export interface AppState {
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
