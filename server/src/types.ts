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
