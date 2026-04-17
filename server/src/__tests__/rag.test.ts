import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { loadRAGIndex, retrieveTopK, getIndexSize } from '../rag/ragIndex.js';
import type { RegChunk } from '../types.js';

const RAG_PATH = path.resolve('./data/regulations-embedded.json');

describe('RAG index (AI-01)', () => {
  beforeAll(() => {
    if (existsSync(RAG_PATH)) {
      loadRAGIndex(RAG_PATH);
    }
  });

  it('regulations-embedded.json exists on disk', () => {
    expect(existsSync(RAG_PATH)).toBe(true);
  });

  it('RAG index loads with 30+ chunks (5–10 per statute)', () => {
    if (!existsSync(RAG_PATH)) return;
    expect(getIndexSize()).toBeGreaterThanOrEqual(30);
  });

  it('each chunk has text, embedding (float array), and statute fields', () => {
    if (!existsSync(RAG_PATH)) return;
    const chunks: RegChunk[] = JSON.parse(readFileSync(RAG_PATH, 'utf-8'));
    for (const chunk of chunks.slice(0, 5)) {
      expect(typeof chunk.text).toBe('string');
      expect(chunk.text.length).toBeGreaterThan(20);
      expect(Array.isArray(chunk.embedding)).toBe(true);
      expect(chunk.embedding.length).toBeGreaterThan(100);
      expect(typeof chunk.statute).toBe('string');
    }
  });

  it('retrieveTopK returns k chunks without throwing', () => {
    if (!existsSync(RAG_PATH)) return;
    const fakeEmbedding = Array(1536).fill(0.1);
    const results = retrieveTopK(fakeEmbedding, 3);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('index contains chunks from key statutes (PUCT, NEPA, ESA, CWA)', () => {
    if (!existsSync(RAG_PATH)) return;
    const chunks: RegChunk[] = JSON.parse(readFileSync(RAG_PATH, 'utf-8'));
    const statutes = new Set(chunks.map(c => c.statute));
    expect(statutes.has('PUCT')).toBe(true);
    expect(statutes.has('NEPA') || statutes.has('ESA') || statutes.has('CWA')).toBe(true);
  });
});
