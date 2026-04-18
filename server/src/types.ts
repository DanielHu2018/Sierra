export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  neighbors: string[];
}

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

export interface FrictionEntry {
  frictionScore: number;  // 0–1 float
  justification: string;
}

export interface RegChunk {
  text: string;
  embedding: number[];
  statute: string;
}
