import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  analyzeDecision,
  assertDecisionLab,
} from '../dist/packages/engine/src/decision-lab.js';
import { serialize } from '../dist/packages/contracts/src/index.js';
import { createServer } from '../dist/apps/api/src/server.js';
const raw = await readFile(
  new URL('../fixtures/public/scenarios.json', import.meta.url),
  'utf8',
);
const inputs = JSON.parse(raw);
const directory = new URL('../evaluation/decision-lab/', import.meta.url);
await mkdir(directory, { recursive: true });
const records = [];
for (const input of inputs) {
  const report = analyzeDecision(input);
  assertDecisionLab(report);
  await writeFile(
    new URL(`${input.scenario_id}_analysis.json`, directory),
    serialize(report, true),
  );
  records.push({
    scenario_id: input.scenario_id,
    original_status: report.baseline.status,
    engine_evaluations: report.engine_evaluations,
    complete_candidates: report.priority_analysis.evaluated_plans.length,
    frontier_plans: report.priority_analysis.frontier_plan_ids.length,
    retained_winner_settings: report.priority_analysis.retained_winner_settings,
    tested_priority_settings: report.priority_analysis.tested_settings,
    functional_variants: report.functional_experiments.tested_variants,
    smallest_successful_edits:
      report.functional_experiments.smallest_successful_edit_count,
  });
}
const app = createServer({ serveWeb: false });
const measurements = [];
try {
  const url = await app.listen({ host: '127.0.0.1', port: 0 });
  for (const input of inputs) {
    const samples = [];
    for (let n = 0; n < 4; n++) {
      const start = performance.now();
      const response = await fetch(`${url}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw Error(`Analysis HTTP ${response.status}`);
      const result = await response.json();
      const elapsed = performance.now() - start;
      if (serialize(result) !== serialize(analyzeDecision(input)))
        throw Error('HTTP/engine analysis mismatch');
      if (n) samples.push(+elapsed.toFixed(3));
    }
    measurements.push({
      scenario_id: input.scenario_id,
      samples_ms: samples,
      max_ms: Math.max(...samples),
    });
  }
} finally {
  await app.close();
}
const record = {
  checked_on: '2026-11-14',
  analysis_version: '0.1.0',
  app_version: '0.7.0',
  engine_version: '0.6.0',
  input_sha256: createHash('sha256').update(raw).digest('hex'),
  records,
  measurements,
  measurement_scope:
    'Loopback HTTP through consumed JSON; parity validated separately after timing. Three measured runs per case after one warm-up; excludes browser rendering and performance of recommended architectures.',
};
await writeFile(
  new URL('../evaluation/decision-lab-results.json', import.meta.url),
  serialize(record, true),
);
if (measurements.some((m) => m.max_ms > 10000))
  throw Error('Measured analysis exceeded the 10-second local target.');
console.log(
  JSON.stringify({
    cases: records.length,
    measured_requests: 18,
    max_ms: Math.max(...measurements.map((m) => m.max_ms)),
  }),
);
