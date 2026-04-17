import fs from 'fs';
import type { RegChunk } from '../types.js';

let index: RegChunk[] = [];

export function loadRAGIndex(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.warn(`RAG index not found at ${filePath} — run the pipeline first.`);
    return;
  }
  index = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RegChunk[];
  console.log(`RAG index loaded: ${index.length} chunks`);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export function retrieveTopK(queryEmbedding: number[], k = 3): RegChunk[] {
  return index
    .map(chunk => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(r => r.chunk);
}

export function getIndexSize(): number {
  return index.length;
}
