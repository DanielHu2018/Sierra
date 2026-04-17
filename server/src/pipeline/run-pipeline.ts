/**
 * run-pipeline.ts — Sequential pipeline orchestrator with disk-checkpoint skip logic
 * Runs all three pipeline steps in sequence. If an output file already exists,
 * that step is skipped (disk-checkpoint pattern).
 *
 * To force a re-run of a single step, delete the corresponding output file before running.
 *
 * Run from repo root: npm run pipeline (in /server)
 * Or: ANTHROPIC_API_KEY=<key> OPENAI_API_KEY=<key> npx tsx server/src/pipeline/run-pipeline.ts
 */
import { existsSync } from 'fs';
import path from 'path';

const ROOT = path.resolve('./');

async function main() {
  console.log('Sierra Pipeline — starting');

  // Step 1: Scrape + embed regulations
  const ragPath = path.join(ROOT, 'server/data/regulations-embedded.json');
  if (existsSync(ragPath)) {
    console.log('Step 1: regulations-embedded.json exists — skipping scrape + embed');
  } else {
    console.log('Step 1: Scraping and embedding regulations...');
    await import('./1-scrape-embed.js');
  }

  // Step 2: Build graph
  const graphPath = path.join(ROOT, 'public/data/graph.json');
  if (existsSync(graphPath)) {
    console.log('Step 2: graph.json exists — skipping graph build');
  } else {
    console.log('Step 2: Building routing graph...');
    await import('./2-build-graph.js');
  }

  // Step 3: Score friction
  const frictionPath = path.join(ROOT, 'public/data/friction_cache.json');
  if (existsSync(frictionPath)) {
    console.log('Step 3: friction_cache.json exists — skipping friction scoring');
  } else {
    console.log('Step 3: Scoring node friction with Claude...');
    await import('./3-score-friction.js');
  }

  console.log('Pipeline complete. Artifacts ready for Phase 3.');
  console.log(`  graph.json: ${graphPath}`);
  console.log(`  friction_cache.json: ${frictionPath}`);
  console.log(`  regulations-embedded.json: ${ragPath}`);
}

main().catch(err => {
  console.error('Pipeline failed:', err.message);
  process.exit(1);
});
