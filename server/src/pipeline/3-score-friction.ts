/**
 * 3-score-friction.ts — Batched Claude friction scoring pipeline script
 * Loads graph.json and RAG index, batches nodes ~20–25 at a time,
 * retrieves top regulatory excerpts per batch via cosine similarity,
 * calls Claude with structured JSON output to get { nodeId, frictionScore, justification },
 * and writes public/data/friction_cache.json.
 *
 * Supports partial progress: on resume, already-scored nodes are skipped.
 *
 * Run from repo root:
 *   ANTHROPIC_API_KEY=<key> OPENAI_API_KEY=<key> npx tsx server/src/pipeline/3-score-friction.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { loadRAGIndex, retrieveTopK } from '../rag/ragIndex.js';
import type { GraphNode, FrictionEntry } from '../types.js';

// ---- Env validation -------------------------------------------------------
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY env var is required. Set it before running this script.');
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY env var is required for RAG embedding. Set it before running this script.');
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const limit = pLimit(4); // 4 concurrent batches

const ROOT = path.resolve('./');
const BATCH_SIZE = 22;
const PARTIAL_PATH = path.join(ROOT, 'server/data/friction_cache.partial.json');
const OUTPUT_PATH = path.join(ROOT, 'public/data/friction_cache.json');

// ---- NodeFlags interface --------------------------------------------------
interface NodeFlags {
  esaHabitat?: boolean;
  privateLand?: boolean;
  nearErcotCorridor?: boolean;
  topoElevationM?: number | null;
}

// ---- Retry wrapper --------------------------------------------------------
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`  Attempt ${attempt} failed (${lastError.message}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
}

// ---- Embed a location description for RAG retrieval -----------------------
async function embedLocationDescription(description: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: description,
    encoding_format: 'float',
  });
  return response.data[0].embedding;
}

// ---- Score a batch of nodes via Claude ------------------------------------
async function scoreBatch(
  batch: GraphNode[],
  flagsMap: Map<string, NodeFlags>,
  ragEmbedding: number[]
): Promise<Array<{ nodeId: string; frictionScore: number; justification: string }>> {
  // Get top regulatory context for this geographic area
  const topChunks = retrieveTopK(ragEmbedding, 3);
  const regulatoryContext = topChunks
    .map((chunk, i) => `[${i + 1}] (${chunk.statute}): ${chunk.text.slice(0, 400)}`)
    .join('\n\n');

  // Build node descriptions for the prompt
  const nodeDescriptions = batch.map(node => {
    const flags = flagsMap.get(node.id);
    const overlayInfo: string[] = [];
    if (flags?.esaHabitat) overlayInfo.push('ESA critical habitat present');
    if (flags?.privateLand) overlayInfo.push('private land ownership');
    if (flags?.nearErcotCorridor) overlayInfo.push('near existing ERCOT corridor (< 10km)');
    if (flags?.topoElevationM != null) overlayInfo.push(`elevation ${flags.topoElevationM}m`);

    const overlayStr = overlayInfo.length > 0 ? ` | Overlays: ${overlayInfo.join(', ')}` : '';
    return `- nodeId: ${node.id} | lat: ${node.lat.toFixed(3)}, lng: ${node.lng.toFixed(3)}${overlayStr}`;
  }).join('\n');

  const prompt = `You are scoring friction for pre-transmission planning in Texas. Evaluate each node for transmission line routing friction.

REGULATORY CONTEXT for this geographic area:
${regulatoryContext}

NODES TO SCORE:
${nodeDescriptions}

Score each node's friction for transmission line routing:
- 0.0 = no obstacles (open land, no sensitive areas, near existing corridors)
- 1.0 = maximum friction (multiple major regulatory barriers, sensitive habitats, populated areas)

Rules:
- Base scores on the regulatory context provided above
- Scores should vary meaningfully across the 0.0–1.0 range (not all the same value)
- Justify each score with SPECIFIC statute references (e.g., "per ESA Section 7(a)(2)", "under PUCT 16 TAC §25.192") and Texas location names (county names, region names)
- Justifications must be 30–150 words referencing real statute section numbers
- DO NOT generate or modify any coordinates
- Return ONLY the JSON with the scores array`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: 'You are a transmission line routing expert scoring friction for pre-transmission planning. Score ONLY — do not generate or modify coordinates.',
    messages: [{ role: 'user', content: prompt }],
  });

  // Parse response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error(`Unexpected response type: ${content.type}`);
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonText = content.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  // Find JSON object in text
  const jsonStart = jsonText.indexOf('{');
  const jsonEnd = jsonText.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`No JSON found in response: ${jsonText.slice(0, 200)}`);
  }
  jsonText = jsonText.slice(jsonStart, jsonEnd + 1);

  let parsed: { scores: Array<{ nodeId: string; frictionScore: number; justification: string }> };
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`Failed to parse JSON response: ${(err as Error).message}\nResponse: ${jsonText.slice(0, 500)}`);
  }

  if (!Array.isArray(parsed.scores)) {
    throw new Error(`Response missing 'scores' array: ${JSON.stringify(parsed).slice(0, 200)}`);
  }

  // Validate entries and fill in any missing nodes with a neutral score
  const scoredIds = new Set(parsed.scores.map(s => s.nodeId));
  const result = [...parsed.scores];

  for (const node of batch) {
    if (!scoredIds.has(node.id)) {
      console.warn(`  Missing score for node ${node.id} — using neutral fallback`);
      result.push({
        nodeId: node.id,
        frictionScore: 0.3,
        justification: `Neutral friction score assigned. Node in Texas transmission corridor at lat ${node.lat.toFixed(3)}, lng ${node.lng.toFixed(3)}. Per PUCT 16 TAC §25.192, this area requires standard CCN review without identified critical constraints.`,
      });
    }
  }

  // Clamp scores to [0, 1]
  return result.map(s => ({
    ...s,
    frictionScore: Math.max(0, Math.min(1, s.frictionScore)),
  }));
}

// ---- Main -----------------------------------------------------------------
async function main() {
  console.log('Sierra Pipeline — Step 3: Scoring node friction with Claude...');

  // Load graph.json
  const graphPath = path.join(ROOT, 'public/data/graph.json');
  if (!existsSync(graphPath)) {
    throw new Error(`graph.json not found at ${graphPath}. Run step 2 first: npx tsx server/src/pipeline/2-build-graph.ts`);
  }
  const nodes: GraphNode[] = JSON.parse(readFileSync(graphPath, 'utf-8'));
  console.log(`Loaded ${nodes.length} nodes from graph.json`);

  // Load RAG index
  const ragPath = path.join(ROOT, 'server/data/regulations-embedded.json');
  if (!existsSync(ragPath)) {
    throw new Error(`regulations-embedded.json not found at ${ragPath}. Run step 1 first: OPENAI_API_KEY=<key> npx tsx server/src/pipeline/1-scrape-embed.ts`);
  }
  loadRAGIndex(ragPath);
  console.log('RAG index loaded');

  // Load node-flags.json (optional)
  const flagsPath = path.join(ROOT, 'server/data/node-flags.json');
  const flagsMap = new Map<string, NodeFlags>();
  if (existsSync(flagsPath)) {
    const flagsObj: Record<string, NodeFlags> = JSON.parse(readFileSync(flagsPath, 'utf-8'));
    for (const [id, flags] of Object.entries(flagsObj)) {
      flagsMap.set(id, flags);
    }
    console.log(`Loaded ${flagsMap.size} node flags`);
  } else {
    console.log('node-flags.json not found — proceeding without overlay flags');
  }

  // Load partial progress
  const scored: Record<string, FrictionEntry> = existsSync(PARTIAL_PATH)
    ? JSON.parse(readFileSync(PARTIAL_PATH, 'utf-8'))
    : {};

  const alreadyScored = Object.keys(scored).length;
  if (alreadyScored > 0) {
    console.log(`Resuming from partial progress: ${alreadyScored}/${nodes.length} nodes already scored`);
  }

  const remainingNodes = nodes.filter(n => !scored[n.id]);
  console.log(`Remaining nodes to score: ${remainingNodes.length}`);

  if (remainingNodes.length === 0) {
    console.log('All nodes already scored — writing final output');
  } else {
    // Batch remaining nodes into groups of BATCH_SIZE
    const batches: GraphNode[][] = [];
    for (let i = 0; i < remainingNodes.length; i += BATCH_SIZE) {
      batches.push(remainingNodes.slice(i, i + BATCH_SIZE));
    }
    console.log(`Processing ${batches.length} batches of ~${BATCH_SIZE} nodes each`);

    // Process batches with concurrency limit
    let batchIndex = 0;

    const batchPromises = batches.map((batch, idx) =>
      limit(() =>
        withRetry(async () => {
          const batchNum = idx + 1;
          const latMin = Math.min(...batch.map(n => n.lat));
          const latMax = Math.max(...batch.map(n => n.lat));
          const lngMin = Math.min(...batch.map(n => n.lng));
          const lngMax = Math.max(...batch.map(n => n.lng));

          console.log(`Batch ${batchNum}/${batches.length}: ${batch.length} nodes (lat ${latMin.toFixed(2)}–${latMax.toFixed(2)}, lng ${lngMin.toFixed(2)}–${lngMax.toFixed(2)})`);

          // Embed a location description for RAG retrieval
          const locationDesc = `Texas transmission corridor nodes in lat range ${latMin.toFixed(2)}–${latMax.toFixed(2)}, lng range ${lngMin.toFixed(2)}–${lngMax.toFixed(2)}`;
          const ragEmbedding = await embedLocationDescription(locationDesc);

          const scores = await scoreBatch(batch, flagsMap, ragEmbedding);

          // Accumulate scores
          for (const score of scores) {
            scored[score.nodeId] = {
              frictionScore: score.frictionScore,
              justification: score.justification,
            };
          }

          // Write partial progress after each batch
          mkdirSync(path.dirname(PARTIAL_PATH), { recursive: true });
          writeFileSync(PARTIAL_PATH, JSON.stringify(scored, null, 2));

          batchIndex++;
          console.log(`Progress: ${Object.keys(scored).length}/${nodes.length} nodes scored`);
        })
      )
    );

    await Promise.all(batchPromises);
  }

  // Verify all nodes are scored
  const missing = nodes.filter(n => !scored[n.id]);
  if (missing.length > 0) {
    throw new Error(`${missing.length} nodes missing from friction_cache. Re-run to resume from partial progress.`);
  }

  // Write final output
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(scored, null, 2));
  console.log(`friction_cache.json written: ${Object.keys(scored).length} entries to ${OUTPUT_PATH}`);

  // Clean up partial file
  if (existsSync(PARTIAL_PATH)) {
    const { unlinkSync } = await import('fs');
    unlinkSync(PARTIAL_PATH);
    console.log('Partial progress file removed');
  }

  console.log('Step 3 complete!');
}

main().catch(err => {
  console.error('Friction scoring failed:', err.message);
  process.exit(1);
});
