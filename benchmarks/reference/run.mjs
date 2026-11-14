import { fork } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
export function validateProfile(p) {
  const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  if (
    p?.recipe !== 'node-http-in-memory-catalog-v1' ||
    !integer(p.warmup_requests, 0, 1000) ||
    !integer(p.duration_ms, 100, 30000) ||
    !integer(p.timeout_ms, 1, 10000) ||
    !integer(p.max_samples_per_stage, 1, 100000) ||
    !Array.isArray(p.concurrency) ||
    p.concurrency.length < 1 ||
    p.concurrency.length > 5 ||
    !p.concurrency.every((n) => integer(n, 1, 64)) ||
    !Number.isFinite(p.thresholds?.p95_ms) ||
    p.thresholds.p95_ms < 0 ||
    !Number.isFinite(p.thresholds.error_rate) ||
    p.thresholds.error_rate < 0 ||
    p.thresholds.error_rate > 1 ||
    !integer(p.thresholds.min_requests, 1, 100000)
  )
    throw Error('Invalid or unbounded workload profile');
  return p;
}
export function summarize(samples, elapsedMs, thresholds) {
  if (!samples.length) throw Error('Cannot summarize an empty run');
  const latencies = samples.map((s) => s.latency_ms).sort((a, b) => a - b);
  const percentile = (n) => latencies[Math.ceil(n * latencies.length) - 1];
  const errors = samples.filter((s) => !s.ok).length;
  const metrics = {
    requests: samples.length,
    errors,
    error_rate: errors / samples.length,
    elapsed_ms: elapsedMs,
    requests_per_second: samples.length / (elapsedMs / 1000),
    p50_ms: percentile(0.5),
    p95_ms: percentile(0.95),
    p99_ms: percentile(0.99),
    max_ms: latencies.at(-1),
  };
  const checks = {
    p95: metrics.p95_ms <= thresholds.p95_ms,
    error_rate: metrics.error_rate <= thresholds.error_rate,
    min_requests: metrics.requests >= thresholds.min_requests,
  };
  return { ...metrics, checks, passed: Object.values(checks).every(Boolean) };
}
export function correctBody(kind, id, body) {
  if (kind === 'read')
    return (
      body?.id === id &&
      body.name === `Product ${id}` &&
      body.category === id % 100 &&
      body.price_cents === 100 + id
    );
  return (
    body?.category === id &&
    Array.isArray(body.items) &&
    body.items.length === 100 &&
    body.items.every((p, i) => correctBody('read', id + i * 100, p))
  );
}
export async function run(profile, output) {
  validateProfile(profile);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output); // Exclusive run directory: never replace earlier evidence.
  const child = fork(path.join(directory, 'workload.mjs'), [], {
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });
  try {
    const ready = await Promise.race([
      once(child, 'message'),
      once(child, 'exit').then(() => {
        throw Error('Workload exited before readiness');
      }),
      new Promise((_, reject) => {
        const t = setTimeout(() => reject(Error('Readiness timeout')), 5000);
        t.unref();
      }),
    ]);
    const base = `http://127.0.0.1:${ready[0].port}`;
    async function request(index) {
      const kind = index % 5 === 0 ? 'search' : 'read';
      const id = kind === 'search' ? index % 100 : index % 10000;
      const start = performance.now();
      let ok = false,
        status = 0,
        error = null;
      try {
        const response = await fetch(
          `${base}/${kind === 'read' ? 'product' : 'search'}?id=${id}`,
          { signal: AbortSignal.timeout(profile.timeout_ms) },
        );
        status = response.status;
        ok = status === 200 && correctBody(kind, id, await response.json());
        if (!ok) error = 'status_or_body_mismatch';
      } catch (e) {
        error = e.name;
      }
      return {
        index,
        kind,
        id,
        latency_ms: performance.now() - start,
        ok,
        status,
        error,
      };
    }
    for (let i = 0; i < profile.warmup_requests; i++) {
      if (!(await request(i)).ok) throw Error('Warmup correctness failed');
    }
    const stages = [];
    for (const concurrency of profile.concurrency) {
      const start = performance.now();
      let next = 0;
      const samples = [];
      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          while (
            performance.now() - start < profile.duration_ms &&
            next < profile.max_samples_per_stage
          ) {
            const index = next++;
            samples.push(await request(index));
          }
        }),
      );
      const metrics = summarize(
        samples,
        performance.now() - start,
        profile.thresholds,
      );
      const raw = `samples-${stages.length + 1}.jsonl`;
      const data =
        samples
          .sort((a, b) => a.index - b.index)
          .map((s) => JSON.stringify(s))
          .join('\n') + '\n';
      await writeFile(path.join(output, raw), data, { flag: 'wx' });
      stages.push({
        concurrency,
        ...metrics,
        sample_cap_reached: next === profile.max_samples_per_stage,
        raw,
        raw_sha256: createHash('sha256').update(data).digest('hex'),
      });
    }
    const resources = once(child, 'message');
    const exit = once(child, 'exit');
    child.send('stop');
    const [message] = await resources;
    await exit;
    const sources = {};
    for (const file of ['run.mjs', 'workload.mjs', 'profile.json'])
      sources[file] = createHash('sha256')
        .update(await readFile(path.join(directory, file)))
        .digest('hex');
    const report = {
      schema_version: '1.0.0',
      measured_at: new Date().toISOString(),
      recipe: profile.recipe,
      profile,
      profile_sha256: createHash('sha256')
        .update(JSON.stringify(profile))
        .digest('hex'),
      sources,
      environment: {
        node: process.version,
        platform: process.platform,
        architecture: process.arch,
        os_release: os.release(),
        cpu_model: os.cpus()[0]?.model,
        logical_cpus: os.cpus().length,
        total_memory_bytes: os.totalmem(),
        server_process_separate: true,
        generator_on_same_host: true,
      },
      model:
        'closed-loop, zero think time; deterministic 80% read / 20% search by request index; warmup excluded; drain included; no retries',
      resources: message.resources,
      stages,
      passed: stages.every((s) => s.passed),
      scope:
        'Local Node HTTP in-memory catalog only. No database, persistence, auth, TLS, external network, deployment, cloud cost calibration, production capacity or SLA validation. Same-host generator competes for resources; closed-loop load omits demand during stalls. CPU/RSS span warmup and all stages, not individual requests.',
    };
    await writeFile(
      path.join(output, 'summary.json'),
      JSON.stringify(report, null, 2) + '\n',
      { flag: 'wx' },
    );
    return report;
  } finally {
    if (child.exitCode === null) child.kill();
  }
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--out')
    throw Error(
      'Usage: node benchmarks/reference/run.mjs --out <new-directory>',
    );
  const profile = JSON.parse(
    await readFile(path.join(directory, 'profile.json'), 'utf8'),
  );
  const report = await run(profile, path.resolve(args[1]));
  console.log(
    JSON.stringify(
      { passed: report.passed, stages: report.stages, output: args[1] },
      null,
      2,
    ),
  );
  if (!report.passed) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
