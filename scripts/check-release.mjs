import { readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { verify as verifyPostgres } from '../benchmarks/postgres/verify.mjs';
import { verify as verifyCalibration } from '../benchmarks/reference/verify.mjs';
import { verifyScreenshotInputBinding } from './evidence-bindings.mjs';
import { analyzeDecision } from '../dist/packages/engine/src/decision-lab.js';
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
let labCount = 0;
if (await exists('evaluation/decision-lab-results.json')) {
  for (const input of publicCases) {
    const saved = await readFile(
      join(root, `evaluation/decision-lab/${input.scenario_id}_analysis.json`),
      'utf8',
    );
    if (saved !== serialize(analyzeDecision(input), true))
      throw Error(`Stale Decision Lab output: ${input.scenario_id}`);
    labCount++;
  }
}
const results = await load('evaluation/results.json');
const hash = createHash('sha256')
  .update(await readFile(join(root, 'evaluation/cases.json')))
  .digest('hex');
if (hash !== results.case_set_sha256)
  throw new Error('Evaluation case-set hash is stale.');
const screenshots = await load('evaluation/screenshots.json');
const current = recommend(publicCases[0]);
for (const field of ['engine_version', 'catalog_version', 'services_version'])
  if (screenshots[field] !== current[field])
    throw new Error(`Screenshot version is stale: ${field}`);
await verifyScreenshotInputBinding(root, screenshots);
for (const entry of screenshots.images) {
  const bytes = await readFile(join(root, screenshots.directory, entry.file));
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256)
    throw new Error(`Screenshot changed: ${entry.file}`);
}
if (await exists('evaluation/phase7-browser-checks.json')) {
  const browser = await load('evaluation/phase7-browser-checks.json');
  if (
    browser.app_version !== (await load('package.json')).version ||
    browser.input_sha256 !==
      createHash('sha256')
        .update(await readFile(join(root, browser.input_fixture)))
        .digest('hex')
  )
    throw Error('Decision Lab browser provenance is stale.');
  for (const capture of browser.captures)
    if (
      createHash('sha256')
        .update(await readFile(join(root, capture.file)))
        .digest('hex') !== capture.sha256
    )
      throw Error(`Decision Lab capture changed: ${capture.file}`);
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
    report.engine_version !== current.engine_version ||
    report.application_version !== (await load('package.json')).version ||
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
await verifyCalibration(join(root, 'evaluation/calibration/reference-run-1'));
await verifyPostgres(join(root, 'evaluation/calibration/postgres-run-1'));
console.log(
  `PASS: 20 actual outputs and ${labCount} Decision Lab reports match the current engine; case provenance, capture versions and all ${screenshots.images.length} screenshot hashes verified. HTTP and PostgreSQL workload raw/source evidence verified; report/ZIP hashes checked when present.`,
);
