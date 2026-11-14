import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  root,
  json,
  audit,
  loadBundle,
  canonical,
  sha,
  compareCaptures,
  markdown,
} from './core.mjs';
const directory = path.join(root, 'evaluation/evidence-review');
const sourceFiles = [
  'scripts/evidence.mjs',
  'scripts/evidence/core.mjs',
  'scripts/evidence/policy.json',
  'scripts/evidence/verify.mjs',
];
const artifacts = [
  'current',
  'observations-1',
  'observations-2',
  'representation-comparison',
  'synthetic-tariff-proposal',
];
export async function record() {
  const files = [
    ...sourceFiles,
    ...artifacts.flatMap((name) => [
      `evaluation/evidence-review/${name}/report.json`,
      `evaluation/evidence-review/${name}/report.md`,
    ]),
  ];
  const manifest = {
    schema_version: '0.1.0',
    status: 'integrity_only_not_human_approval',
    files: [],
  };
  for (const file of files)
    manifest.files.push({
      path: file,
      sha256: sha(await readFile(path.join(root, file))),
    });
  await writeFile(
    path.join(directory, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
}
export async function verify() {
  const manifest = await json(path.join(directory, 'manifest.json'));
  const expectedFiles = [
    ...sourceFiles,
    ...artifacts.flatMap((name) => [
      `evaluation/evidence-review/${name}/report.json`,
      `evaluation/evidence-review/${name}/report.md`,
    ]),
  ];
  assert.deepEqual(
    manifest.files.map((f) => f.path),
    expectedFiles,
  );
  for (const file of manifest.files)
    assert.equal(
      sha(await readFile(path.join(root, file.path))),
      file.sha256,
      `Changed evidence/source: ${file.path}`,
    );
  const bundle = await loadBundle(path.join(root, 'packages/catalog/data'));
  const policy = await json(path.join(root, 'scripts/evidence/policy.json'));
  const saved = await json(path.join(directory, 'current/report.json'));
  const outputs = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      json(path.join(root, `outputs/P${i + 1}_output.json`)),
    ),
  );
  assert.equal(
    canonical(saved),
    canonical(audit(bundle, saved.as_of, policy, outputs)),
    'Stale source audit',
  );
  const captures = [];
  const registry = new Map(
    Object.entries(bundle).flatMap(([ns, c]) =>
      c.sources.map((s) => [`${ns}:${s.id}`, s]),
    ),
  );
  for (const name of ['observations-1', 'observations-2']) {
    const capture = await json(path.join(directory, `${name}/report.json`));
    compareCaptures(capture, capture);
    assert.equal(capture.registry_sha256, sha(canonical(bundle)));
    for (const observation of capture.snapshots)
      assert.equal(
        registry.get(observation.key)?.url,
        observation.url,
        'Snapshot URL differs from registry',
      );
    captures.push(capture);
  }
  assert.equal(
    canonical(
      await json(path.join(directory, 'representation-comparison/report.json')),
    ),
    canonical(compareCaptures(...captures)),
  );
  const proposal = await json(
    path.join(directory, 'synthetic-tariff-proposal/report.json'),
  );
  assert.equal(proposal.before_sha256, sha(canonical(bundle)));
  assert.equal(proposal.policy_sha256, sha(canonical(policy)));
  assert.equal(proposal.status, 'pending_human_review');
  assert.equal(proposal.review.reviewer, null);
  // Reconstruct this explicitly synthetic example on a copy; never apply to catalogs.
  const synthetic = structuredClone(bundle);
  synthetic.services.pricing.cloudrun_hour.min += 0.01;
  synthetic.services.pricing.cloudrun_hour.basis =
    'SYNTHETIC DEMO ONLY: +0.01 USD change to exercise review tooling; not an observed provider tariff.';
  assert.equal(proposal.candidate_sha256, sha(canonical(synthetic)));
  const { proposal: makeProposal } = await import('./core.mjs');
  assert.equal(
    canonical(proposal),
    canonical(makeProposal(bundle, synthetic, proposal.created_on, policy)),
  );
  for (const artifact of artifacts) {
    const report = await json(path.join(directory, `${artifact}/report.json`));
    assert.equal(
      await readFile(path.join(directory, `${artifact}/report.md`), 'utf8'),
      markdown(report),
    );
  }
  return { sources: saved.counts.sources, artifacts: artifacts.length };
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
      throw Error('Usage: node scripts/evidence/verify.mjs [--record]');
    if (process.argv[2] === '--record') await record();
    const result = await verify();
    console.log(
      `Verified ${result.sources} audited sources and ${result.artifacts} evidence artifacts; no human approval inferred.`,
    );
  })().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
