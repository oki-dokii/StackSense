import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { recommend } from '../dist/packages/engine/src/index.js';
import {
  serialize,
  validateOutput,
} from '../dist/packages/contracts/src/index.js';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const load = async (path) =>
  JSON.parse(await readFile(join(root, path), 'utf8'));
const publicCases = await load('fixtures/public/scenarios.json');
const cases = await load('evaluation/cases.json');
for (const [directory, inputs] of [
  ['outputs', publicCases],
  ['evaluation/outputs', cases.map((item) => item.scenario)],
])
  for (const input of inputs) {
    const path = `${directory}/${input.scenario_id}_output.json`;
    const actual = await readFile(join(root, path), 'utf8');
    const report = JSON.parse(actual);
    if (
      validateOutput(report).length ||
      actual !== serialize(recommend(input), true)
    )
      throw new Error(`Stale or invalid release output: ${path}`);
  }
const results = await load('evaluation/results.json');
const hash = createHash('sha256')
  .update(await readFile(join(root, 'evaluation/cases.json')))
  .digest('hex');
if (hash !== results.case_set_sha256)
  throw new Error('Evaluation case-set hash is stale.');
console.log(
  'PASS: all 20 public/evaluation output files match the current engine byte-for-byte; case-set provenance verified.',
);
