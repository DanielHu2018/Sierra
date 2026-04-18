/**
 * run-pipeline.ts — Sequential pipeline orchestrator with disk-checkpoint skip logic
 * Runs all three pipeline steps in sequence. If an output file already exists,
 * that step is skipped (disk-checkpoint pattern).
 *
 * To force a re-run of a single step, delete the corresponding output file before running.
 *
 * Run via: npm run pipeline (from server/)
 */
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, '../..'); // server/
const REPO_ROOT = path.resolve(__dirname, '../../..'); // repo root

function runStep(script: string): void {
  const result = spawnSync(
    'tsx',
    ['--env-file', '.env', script],
    { stdio: 'inherit', cwd: SERVER_ROOT, shell: true }
  );
  if (result.status !== 0) {
    throw new Error(`Step failed: ${script} (exit code ${result.status})`);
  }
}

async function main() {
  console.log('Sierra Pipeline — starting');

  const ragPath = path.join(REPO_ROOT, 'data/regulations-embedded.json');
  if (existsSync(ragPath)) {
    console.log('Step 1: regulations-embedded.json exists — skipping scrape + embed');
  } else {
    console.log('Step 1: Scraping and embedding regulations...');
    runStep('src/pipeline/1-scrape-embed.ts');
  }

  const graphPath = path.join(SERVER_ROOT, 'public/data/graph.json');
  if (existsSync(graphPath)) {
    console.log('Step 2: graph.json exists — skipping graph build');
  } else {
    console.log('Step 2: Building routing graph...');
    runStep('src/pipeline/2-build-graph.ts');
  }

  const frictionPath = path.join(SERVER_ROOT, 'public/data/friction_cache.json');
  if (existsSync(frictionPath)) {
    console.log('Step 3: friction_cache.json exists — skipping friction scoring');
  } else {
    console.log('Step 3: Scoring node friction with Claude...');
    runStep('src/pipeline/3-score-friction.ts');
  }

  console.log('Pipeline complete. Artifacts ready.');
  console.log(`  regulations-embedded.json: ${ragPath}`);
  console.log(`  graph.json: ${graphPath}`);
  console.log(`  friction_cache.json: ${frictionPath}`);
}

main().catch(err => {
  console.error('Pipeline failed:', err.message);
  process.exit(1);
});
