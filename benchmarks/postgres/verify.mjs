import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const sha = (value) => createHash('sha256').update(value).digest('hex');
export async function verify(directory) {
  const report = JSON.parse(
    await readFile(path.join(directory, 'summary.json'), 'utf8'),
  );
  assert.equal(report.recipe, 'fastify-postgres-catalog-v1');
  assert.equal(report.profile_sha256, sha(JSON.stringify(report.profile)));
  for (const file of [
    'package.json',
    'package-lock.json',
    'profile.json',
    'seed.sql',
    'load.mjs',
    'workload.mjs',
    'run.mjs',
  ])
    assert.equal(
      report.sources[file],
      sha(await readFile(new URL(file, import.meta.url))),
      `Changed source: ${file}`,
    );
  assert.equal(
    report.stages.length,
    report.profile.rates_per_second.length * report.profile.repetitions,
  );
  for (const [stageIndex, stage] of report.stages.entries()) {
    const rate =
      report.profile.rates_per_second[
        stageIndex % report.profile.rates_per_second.length
      ];
    assert.equal(stage.rate_per_second, rate);
    assert.equal(
      stage.repetition,
      Math.floor(stageIndex / report.profile.rates_per_second.length) + 1,
    );
    assert.equal(path.basename(stage.raw), stage.raw);
    const bytes = await readFile(path.join(directory, stage.raw));
    assert.equal(sha(bytes), stage.raw_sha256, 'Raw sample hash mismatch');
    const samples = bytes.toString().trim().split('\n').map(JSON.parse);
    assert.equal(
      samples.length,
      Math.floor((rate * report.profile.duration_ms) / 1000),
    );
    assert.equal(stage.planned, samples.length);
    for (const [i, sample] of samples.entries()) {
      assert.equal(sample.index, i);
      assert.equal(sample.scheduled_ms, (i * 1000) / rate);
      assert.ok(
        Number.isFinite(sample.start_ms) &&
          sample.start_ms >= sample.scheduled_ms,
      );
      assert.equal(sample.lag_ms, sample.start_ms - sample.scheduled_ms);
      if (sample.dropped)
        assert.ok(['scheduler_lag', 'inflight_limit'].includes(sample.dropped));
      else {
        assert.equal(
          sample.kind,
          i % 10 === 9 ? 'write' : i % 10 === 8 ? 'search' : 'read',
        );
        assert.equal(sample.id, i % 10000);
        assert.equal(typeof sample.ok, 'boolean');
        assert.ok(Number.isFinite(sample.latency_ms) && sample.latency_ms >= 0);
        assert.ok(
          Math.abs(sample.end_to_end_ms - sample.lag_ms - sample.latency_ms) <
            1e-7,
        );
        if (sample.ok) {
          assert.equal(sample.status, 200);
          assert.equal(sample.error, null);
        }
      }
    }
    const issued = samples.filter((s) => !s.dropped);
    assert.equal(stage.issued, issued.length);
    assert.equal(stage.dropped, samples.length - issued.length);
    assert.equal(stage.errors, issued.filter((s) => !s.ok).length);
    assert.equal(stage.drop_rate, stage.dropped / stage.planned);
    assert.equal(
      stage.error_rate,
      stage.issued ? stage.errors / stage.issued : 1,
    );
    const times = issued.map((s) => s.end_to_end_ms).sort((a, b) => a - b);
    assert.equal(
      stage.p95_end_to_end_ms,
      times.length ? times[Math.ceil(times.length * 0.95) - 1] : null,
    );
    assert.ok(stage.elapsed_ms >= report.profile.duration_ms - 1);
    assert.ok(
      Math.abs(
        stage.completed_per_second - (stage.issued * 1000) / stage.elapsed_ms,
      ) < 1e-8,
    );
    const checks = {
      p95:
        stage.p95_end_to_end_ms !== null &&
        stage.p95_end_to_end_ms <= report.profile.thresholds.p95_end_to_end_ms,
      error_rate: stage.error_rate <= report.profile.thresholds.error_rate,
      drop_rate: stage.drop_rate <= report.profile.thresholds.drop_rate,
    };
    assert.deepEqual(stage.checks, checks);
    assert.equal(stage.passed, Object.values(checks).every(Boolean));
  }
  const db = report.database;
  assert.equal(
    db.matches_acknowledged_writes,
    db.committed_events === db.acknowledged_writes_including_warmup,
  );
  assert.equal(db.before.products, 10000);
  for (const name of ['fsync', 'synchronous_commit', 'full_page_writes'])
    assert.equal(db.settings.find((s) => s.name === name).setting, 'on');
  assert.equal(
    db.settings.find((s) => s.name === 'listen_addresses').setting,
    '',
  );
  assert.equal(
    report.passed,
    report.stages.every((s) => s.passed) && db.matches_acknowledged_writes,
  );
  return report;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 3) {
    console.error('Usage: node benchmarks/postgres/verify.mjs <run-directory>');
    process.exitCode = 1;
  } else
    verify(path.resolve(process.argv[2]))
      .then((r) =>
        console.log(
          `Verified ${r.stages.length} database stages; acceptance passed: ${r.passed}`,
        ),
      )
      .catch((e) => {
        console.error(e.message);
        process.exitCode = 1;
      });
}
