export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  neighbors: string[];
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
