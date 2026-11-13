import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import { createHash } from 'node:crypto';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reservation = createServer();
await new Promise((resolve, reject) => {
  reservation.once('error', reject);
  reservation.listen(0, '127.0.0.1', resolve);
});
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const started = performance.now();
const child = spawn(
  process.execPath,
  [join(root, 'dist/apps/api/src/main.js')],
  {
    cwd: root,
    env: { ...process.env, STACKSENSE_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let log = '';
child.stderr.on('data', (chunk) => (log += chunk.toString()));
const url = `http://127.0.0.1:${port}`;
try {
  let health;
  while (performance.now() - started < 10000) {
    if (child.exitCode !== null) throw new Error(`Server exited: ${log}`);
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        health = await response.json();
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  if (!health) throw new Error('Cold API startup exceeded 10 seconds.');
  const cold = performance.now() - started;
  const raw = await readFile(
    join(root, 'fixtures/public/scenarios.json'),
    'utf8',
  );
  const inputs = JSON.parse(raw);
  const measurements = [];
  async function request(input) {
    const start = performance.now();
    const response = await fetch(`${url}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return { ms: performance.now() - start, status: result.status };
  }
  for (const input of inputs) await request(input);
  for (const input of inputs) {
    const samples = [];
    let status;
    for (let i = 0; i < 20; i++) {
      const result = await request(input);
      samples.push(result.ms);
      status = result.status;
    }
    const sorted = [...samples].sort((a, b) => a - b);
    measurements.push({
      scenario_id: input.scenario_id,
      status,
      samples_ms: samples.map((value) => +value.toFixed(3)),
      min_ms: +sorted[0].toFixed(3),
      median_ms: +((sorted[9] + sorted[10]) / 2).toFixed(3),
      p95_ms: +sorted[Math.ceil(sorted.length * 0.95) - 1].toFixed(3),
      max_ms: +sorted.at(-1).toFixed(3),
    });
  }
  const record = {
    measured_at: new Date().toISOString(),
    scope:
      'Real loopback HTTP POST through JSON response consumption; warm after one request/case. Excludes browser rendering and provisioning of recommended stacks.',
    environment: {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      cpu: os.cpus()[0]?.model,
      logical_cpus: os.cpus().length,
      memory_gb: +(os.totalmem() / 1024 ** 3).toFixed(2),
      node: process.version,
      npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
    },
    versions: health,
    input_sha256: createHash('sha256').update(raw).digest('hex'),
    cold_start_to_health_ms: +cold.toFixed(3),
    measurements,
  };
  await writeFile(
    join(root, 'evaluation/performance.json'),
    JSON.stringify(record, null, 2) + '\n',
  );
  if (measurements.some((item) => item.max_ms > 10000))
    throw new Error('A measured evaluation exceeded the 10-second target.');
  console.log(
    JSON.stringify({
      cold_start_ms: record.cold_start_to_health_ms,
      maximum_request_ms: Math.max(...measurements.map((item) => item.max_ms)),
      warm_requests: 120,
    }),
  );
} finally {
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once('exit', resolve);
    setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 3000).unref();
  });
}
