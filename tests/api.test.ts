import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createServer } from '../apps/api/src/server.js';
import { recommend } from '../packages/engine/src/index.js';
import { MAX_INPUT_BYTES } from '../packages/contracts/src/index.js';
const samples = JSON.parse(
  readFileSync(
    new URL('../fixtures/public/scenarios.json', import.meta.url),
    'utf8',
  ),
);
const apps: ReturnType<typeof createServer>[] = [];
function server() {
  const app = createServer({ serveWeb: false });
  apps.push(app);
  return app;
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
describe('local HTTP API', () => {
  it.each(samples.map((sample: any) => [sample.scenario_id, sample]))(
    'returns exact shared-engine output for %s',
    async (_, sample) => {
      const result = await server().inject({
        method: 'POST',
        url: '/api/recommend',
        payload: sample,
      });
      expect(result.statusCode).toBe(200);
      expect(result.json()).toEqual(recommend(sample));
      expect(result.headers['cache-control']).toBe('no-store');
      expect(result.headers['access-control-allow-origin']).toBeUndefined();
    },
  );
  it('preserves mixed-batch order, invalid items and all status counts', async () => {
    const result = await server().inject({
      method: 'POST',
      url: '/api/recommend/batch',
      payload: [samples[0], {}, samples[1]],
    });
    expect(result.statusCode).toBe(200);
    expect(result.json().results).toEqual([
      recommend(samples[0]),
      recommend({}),
      recommend(samples[1]),
    ]);
    expect(result.json().counts).toEqual({
      ok: 1,
      ok_with_warnings: 0,
      infeasible: 1,
      invalid_input: 1,
    });
  });
  it.each([[], Array.from({ length: 101 }, () => ({})), {}])(
    'rejects invalid batch containers',
    async (payload) => {
      const result = await server().inject({
        method: 'POST',
        url: '/api/recommend/batch',
        payload,
      });
      expect(result.statusCode).toBe(400);
      expect(result.json().status).toBe('invalid_input');
    },
  );
  it.each([null, [], 1, 'text'])(
    'rejects single-route container misuse',
    async (payload) => {
      const result = await server().inject({
        method: 'POST',
        url: '/api/recommend',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify(payload),
      });
      expect(result.statusCode).toBe(400);
      expect(result.json().stack).toBeNull();
    },
  );
  it('returns root field errors for malformed JSON', async () => {
    const result = await server().inject({
      method: 'POST',
      url: '/api/recommend',
      headers: { 'content-type': 'application/json' },
      payload: '{',
    });
    expect(result.statusCode).toBe(400);
    expect(result.json().validation_errors[0].field).toBe('$');
  });
  it('rejects invalid UTF-8', async () => {
    const result = await server().inject({
      method: 'POST',
      url: '/api/recommend',
      headers: { 'content-type': 'application/json' },
      payload: Buffer.from([0xff]),
    });
    expect(result.statusCode).toBe(400);
  });
  it('uses a transport error for bodies over 2 MiB', async () => {
    const result = await server().inject({
      method: 'POST',
      url: '/api/recommend',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ description: 'x'.repeat(MAX_INPUT_BYTES) }),
    });
    expect(result.statusCode).toBe(413);
    expect(result.json().error.code).toBe('BODY_TOO_LARGE');
  });
  it('does not silently strip unsafe keys or poison global objects', async () => {
    const result = await server().inject({
      method: 'POST',
      url: '/api/recommend/batch',
      headers: { 'content-type': 'application/json' },
      payload: '[{"__proto__":{"polluted":true}},{}]',
    });
    expect(result.statusCode).toBe(200);
    expect(result.json().results[0].status).toBe('invalid_input');
    expect(result.json().results[0].validation_errors[0].message).toContain(
      'Unsafe',
    );
    expect(({} as any).polluted).toBeUndefined();
  });
  it.each([
    { host: 'evil.example' },
    { host: 'localhost:3000', origin: 'https://evil.example' },
    { host: 'localhost:3000', 'sec-fetch-site': 'cross-site' },
  ])('rejects foreign browser origins and rebinding hosts', async (headers) => {
    const result = await server().inject({
      method: 'POST',
      url: '/api/recommend',
      payload: {},
      headers,
    });
    expect(result.statusCode).toBe(403);
  });
  it('accepts a same-origin loopback request', async () => {
    const result = await server().inject({
      method: 'POST',
      url: '/api/recommend',
      payload: samples[0],
      headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' },
    });
    expect(result.statusCode).toBe(200);
  });
  it('provides local samples and schema/source metadata without secrets', async () => {
    const app = server();
    expect((await app.inject('/api/samples')).json()).toEqual(samples);
    const metadata = (await app.inject('/api/methodology')).json();
    expect(metadata.schema.required).toContain('project');
    expect(metadata.sources.length).toBe(99);
    expect(metadata.notes.join(' ')).toContain('not certification');
    expect((await app.inject('/api/health')).json()).toMatchObject({
      status: 'ok',
      engine_version: '0.6.0',
      app_version: '0.6.0',
    });
  });
  it('keeps internal failures separate from invalid/infeasible outcomes', async () => {
    const app = createServer({
      serveWeb: false,
      evaluate: () => {
        throw new Error('private detail');
      },
    });
    apps.push(app);
    const result = await app.inject({
      method: 'POST',
      url: '/api/recommend',
      payload: {},
    });
    expect(result.statusCode).toBe(500);
    expect(result.json()).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          'Recommendation failed internally. No feasibility conclusion was produced.',
      },
    });
    expect(result.body).not.toContain('private detail');
  });
  it('rejects unsupported content types and unknown routes', async () => {
    const app = server();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/recommend',
          headers: { 'content-type': 'text/xml' },
          payload: '<xml/>',
        })
      ).statusCode,
    ).toBe(415);
    expect((await app.inject('/api/not-a-route')).statusCode).toBe(404);
  });
});

describe('production-local web serving', () => {
  it('serves real UI routes and bundled assets with same-origin security headers', async () => {
    const app = createServer();
    apps.push(app);
    for (const path of ['/', '/results', '/about']) {
      const response = await app.inject(path);
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.body).toContain('StackSense — Architecture workspace');
      expect(response.headers['content-security-policy']).toContain(
        "frame-ancestors 'none'",
      );
    }
    const index = await app.inject('/');
    const asset = index.body.match(/src="([^"]+\.js)"/)?.[1];
    expect(asset).toBeTruthy();
    const result = await app.inject(asset!);
    expect(result.statusCode).toBe(200);
    expect(result.headers['content-type']).toMatch(/javascript/);
    expect((await app.inject('/api/missing')).statusCode).toBe(404);
    expect((await app.inject('/not-a-route')).statusCode).toBe(404);
  });
});
