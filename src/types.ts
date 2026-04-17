import type * as GeoJSON from 'geojson';

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
