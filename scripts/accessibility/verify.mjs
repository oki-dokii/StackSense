import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const cases = [
  'provisional-p2',
  'desktop-workspace',
  'methodology',
  'import-error',
  'invalid-result',
  'desktop-lab',
  'mobile-workspace',
  'mobile-lab',
];
const images = [
  'workspace',
  'import-error',
  'validation-focus',
  'desktop-lab',
  'mobile-chart',
];
const sources = [
  'apps/web/src/main.tsx',
  'apps/web/src/style.css',
  'apps/web/src/decision-lab.tsx',
  'apps/web/src/model.ts',
  'scripts/accessibility/dom-audit.mjs',
  'package.json',
  'package-lock.json',
  'tests/web-accessibility.test.ts',
];
const files = [
  ...sources,
  ...cases.map((name) => `evaluation/accessibility/${name}.json`),
  ...images.map((name) => `docs/evidence/phase11/${name}.png`),
];
const manifestPath = path.join(root, 'evaluation/accessibility/manifest.json');
async function record() {
  const manifest = {
    schema_version: '0.1.0',
    method:
      'Actual in-app Chromium browser snapshots and keyboard activations; custom read-only leaf-text audit. No axe, screen-reader, multi-browser or WCAG-conformance claim.',
    checks: {
      skip_link_focus: 'main (native Tab/Enter checked before patch)',
      route_focus: 'h1',
      section_focus: 'section-budget',
      import_open_focus: 'json-editor',
      import_close_focus: 'trigger button',
      invalid_summary_focus: 'validation-errors',
      error_link_focus: 'section-budget',
      mobile_chart: {
        width: 244,
        scrollWidth: 600,
        scrollLeft_after_arrow: 40,
      },
      p3_export: 'JSON data exactly matched committed P3 output',
      stale_export_disabled: true,
    },
    files: [],
  };
  for (const file of files)
    manifest.files.push({
      path: file,
      sha256: sha(await readFile(path.join(root, file))),
    });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
export async function verify() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.deepEqual(
    manifest.files.map((f) => f.path),
    files,
  );
  for (const file of manifest.files)
    assert.equal(
      sha(await readFile(path.join(root, file.path))),
      file.sha256,
      `Stale UI/accessibility evidence: ${file.path}`,
    );
  for (const name of cases) {
    const result = JSON.parse(
      await readFile(
        path.join(root, `evaluation/accessibility/${name}.json`),
        'utf8',
      ),
    );
    assert.ok(result.testedTextElements > 0);
    assert.equal(result.landmarks.main, 1);
    assert.equal(result.landmarks.h1, 1);
    for (const failures of Object.values(result.issues))
      assert.equal(failures.length, 0, `${name} has recorded audit findings`);
    assert.ok(result.viewport.documentWidth <= result.viewport.width);
    if (name.startsWith('mobile')) assert.equal(result.viewport.width, 320);
    if (name === 'invalid-result')
      assert.equal(result.activeElement.id, 'validation-errors');
  }
  return { cases: cases.length, images: images.length };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  (async () => {
    if (
      process.argv.length > 3 ||
      (process.argv[2] && process.argv[2] !== '--record')
    )
      throw Error('Usage: node scripts/accessibility/verify.mjs [--record]');
    if (process.argv[2] === '--record') await record();
    const result = await verify();
    console.log(
      `Verified ${result.cases} scoped accessibility snapshots and ${result.images} captures.`,
    );
  })().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
