import { readFile, access } from 'node:fs/promises';
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
const screenshots = await load('evaluation/screenshots.json');
for (const entry of screenshots.images) {
  const bytes = await readFile(join(root, screenshots.directory, entry.file));
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256)
    throw new Error(`Screenshot changed: ${entry.file}`);
}
async function exists(path) {
  try {
    await access(join(root, path));
    return true;
  } catch {
    return false;
  }
}
if (await exists('output/pdf/Report_SohamBanerjee.pdf')) {
  const report = await load('evaluation/report-checks.json');
  const bytes = await readFile(join(root, report.file));
  if (
    createHash('sha256').update(bytes).digest('hex') !== report.sha256 ||
    report.main_pages > 15 ||
    report.appendix_pages > 10 ||
    report.visual_review.startsWith('pending')
  )
    throw new Error('Report QA/hash gate failed.');
}
if (await exists('deliverables/StackSense26_SohamBanerjee.zip')) {
  const checked = await load('evaluation/package-checks.json');
  const bytes = await readFile(join(root, checked.archive));
  if (createHash('sha256').update(bytes).digest('hex') !== checked.sha256)
    throw new Error('Submission ZIP changed after verification.');
}
console.log(
  'PASS: 20 actual outputs match the current engine; case provenance and all 15 screenshot hashes verified. Report/ZIP hashes checked when present.',
);
