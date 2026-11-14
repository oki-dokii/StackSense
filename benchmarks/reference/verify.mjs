import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const digest = (data) => createHash('sha256').update(data).digest('hex');
export async function verify(directory) {
  const report = JSON.parse(
    await readFile(path.join(directory, 'summary.json'), 'utf8'),
  );
  assert.equal(report.profile_sha256, digest(JSON.stringify(report.profile)));
  for (const name of ['run.mjs', 'workload.mjs', 'profile.json'])
    assert.equal(
      report.sources[name],
      digest(await readFile(new URL(name, import.meta.url))),
      `Changed source: ${name}`,
    );
  assert.equal(report.stages.length, report.profile.concurrency.length);
  for (const [i, stage] of report.stages.entries()) {
    assert.equal(stage.concurrency, report.profile.concurrency[i]);
    assert.equal(path.basename(stage.raw), stage.raw);
    const raw = await readFile(path.join(directory, stage.raw));
    assert.equal(digest(raw), stage.raw_sha256, 'Raw sample hash mismatch');
    const samples = raw.toString().trim().split('\n').map(JSON.parse);
    assert.equal(samples.length, stage.requests);
    for (const [index, sample] of samples.entries()) {
      assert.equal(sample.index, index);
      assert.equal(sample.kind, index % 5 === 0 ? 'search' : 'read');
      assert.ok(Number.isFinite(sample.latency_ms) && sample.latency_ms >= 0);
      assert.equal(typeof sample.ok, 'boolean');
      if (sample.ok) {
        assert.equal(sample.status, 200);
        assert.equal(sample.error, null);
      }
    }
    const times = samples.map((s) => s.latency_ms).sort((a, b) => a - b);
    for (const [field, rank] of [
      ['p50_ms', 0.5],
      ['p95_ms', 0.95],
      ['p99_ms', 0.99],
      ['max_ms', 1],
    ])
      assert.equal(stage[field], times[Math.ceil(times.length * rank) - 1]);
    assert.equal(stage.errors, samples.filter((s) => !s.ok).length);
    assert.equal(stage.error_rate, stage.errors / stage.requests);
    assert.ok(stage.elapsed_ms > 0);
    assert.ok(
      Math.abs(
        stage.requests_per_second - (stage.requests * 1000) / stage.elapsed_ms,
      ) < 1e-8,
    );
    assert.equal(
      stage.sample_cap_reached,
      stage.requests === report.profile.max_samples_per_stage,
    );
    const expected = {
      p95: stage.p95_ms <= report.profile.thresholds.p95_ms,
      error_rate: stage.error_rate <= report.profile.thresholds.error_rate,
      min_requests: stage.requests >= report.profile.thresholds.min_requests,
    };
    assert.deepEqual(stage.checks, expected);
    assert.equal(stage.passed, Object.values(expected).every(Boolean));
  }
  assert.equal(
    report.passed,
    report.stages.every((s) => s.passed),
  );
  return report;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 3) {
    console.error(
      'Usage: node benchmarks/reference/verify.mjs <run-directory>',
    );
    process.exitCode = 1;
  } else
    verify(fileURLToPath(pathToFileURL(path.resolve(process.argv[2]))))
      .then((r) =>
        console.log(
          `Verified ${r.stages.length} stages; acceptance passed: ${r.passed}`,
        ),
      )
      .catch((e) => {
        console.error(e.message);
        process.exitCode = 1;
      });
}
