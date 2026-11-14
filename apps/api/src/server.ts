import Fastify from 'fastify';
import { analyzeDecision } from '../../../packages/engine/src/decision-lab.js';
import staticFiles from '@fastify/static';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  recommend,
  invalidRecommendation,
} from '../../../packages/engine/src/index.js';
import {
  MAX_INPUT_BYTES,
  MAX_BATCH_ITEMS,
  parseJson,
  serialize,
} from '../../../packages/contracts/src/index.js';
import { scenarioSchema } from '../../../packages/contracts/src/schemas.js';
import { defaultCatalog } from '../../../packages/catalog/src/index.js';
import { defaultPolicies } from '../../../packages/catalog/src/services.js';
export function repositoryRoot(): string {
  let directory = dirname(fileURLToPath(import.meta.url));
  while (directory !== parse(directory).root) {
    if (existsSync(join(directory, 'fixtures/public/scenarios.json')))
      return directory;
    directory = dirname(directory);
  }
  throw new Error('Run from a complete StackSense checkout.');
}
export function createServer(
  options: { serveWeb?: boolean; evaluate?: typeof recommend } = {},
) {
  const app = Fastify({
    logger: false,
    bodyLimit: MAX_INPUT_BYTES,
    requestTimeout: 30000,
    onProtoPoisoning: 'error',
    onConstructorPoisoning: 'error',
  });
  const evaluate = options.evaluate ?? recommend;
  const root = repositoryRoot();
  app.addHook('onRequest', async (request, reply) => {
    const host = request.headers.host ?? '';
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host))
      return reply.code(403).send({
        error: { code: 'HOST_FORBIDDEN', message: 'Use a loopback address.' },
      });
    const origin = request.headers.origin;
    if (
      (origin && origin !== `http://${host}`) ||
      request.headers['sec-fetch-site'] === 'cross-site'
    )
      return reply.code(403).send({
        error: {
          code: 'ORIGIN_FORBIDDEN',
          message: 'Use the local same-origin workspace.',
        },
      });
  });
  app.addHook('onSend', async (_request, reply, payload) => {
    reply
      .header('Cache-Control', 'no-store')
      .header('X-Content-Type-Options', 'nosniff')
      .header('Referrer-Policy', 'no-referrer')
      .header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      );
    return payload;
  });
  // Preserve per-item domain validation, including unsafe keys, rather than dropping fields.
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_request, body, done) => {
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(
          body as Buffer,
        );
        const parsed = parseJson(text);
        if (parsed.errors.length) {
          const error = Object.assign(new Error('Malformed JSON.'), {
            statusCode: 400,
            code: 'INVALID_JSON',
          });
          done(error);
          return;
        }
        done(null, parsed.value);
      } catch {
        done(
          Object.assign(new Error('JSON must be valid UTF-8.'), {
            statusCode: 400,
            code: 'INVALID_JSON',
          }),
        );
      }
    },
  );
  app.setErrorHandler((error, _request, reply) => {
    const code = (error as { code?: string }).code;
    if (code === 'FST_ERR_CTP_BODY_TOO_LARGE')
      return reply.code(413).send({
        error: {
          code: 'BODY_TOO_LARGE',
          message: 'JSON body exceeds 2 MiB.',
        },
      });
    if (code === 'INVALID_JSON' || code === 'FST_ERR_CTP_EMPTY_JSON_BODY')
      return reply
        .code(400)
        .send(
          invalidRecommendation([
            { field: '$', message: 'Malformed JSON or invalid UTF-8.' },
          ]),
        );
    if ((error as { statusCode?: number }).statusCode === 415)
      return reply.code(415).send({
        error: { code: 'CONTENT_TYPE', message: 'Send application/json.' },
      });
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          'Recommendation failed internally. No feasibility conclusion was produced.',
      },
    });
  });
  const versions = {
    engine_version: '0.6.0',
    catalog_version: defaultCatalog.version,
    rules_version: '0.6.0',
    services_version: defaultPolicies.version,
    app_version: '0.7.0',
  };
  app.get('/api/health', async () => ({ status: 'ok', ...versions }));
  app.get(
    '/api/samples',
    async () =>
      JSON.parse(
        readFileSync(join(root, 'fixtures/public/scenarios.json'), 'utf8'),
      ) as unknown,
  );
  app.get('/api/methodology', async () => ({
    ...versions,
    schema: scenarioSchema,
    sources: [
      ...defaultCatalog.sources.map((source) => ({
        ...source,
        register: 'core',
      })),
      ...defaultPolicies.sources.map((source) => ({
        ...source,
        register: 'services',
      })),
    ],
    limits: { body_bytes: MAX_INPUT_BYTES, batch_items: MAX_BATCH_ITEMS },
    notes: [
      'Local deterministic rules; no runtime LLM or paid API calls.',
      'Costs are month-12 planning bands with assumptions, not regional quotes.',
      'Framework controls are designs requiring implementation and review, not certification.',
      'Infeasibility is relative to reviewed catalog/service evidence.',
    ],
  }));
  app.post('/api/recommend', async (request, reply) => {
    if (
      !request.body ||
      typeof request.body !== 'object' ||
      Array.isArray(request.body)
    )
      return reply
        .code(400)
        .send(
          invalidRecommendation([
            { field: '$', message: 'Expected one scenario object.' },
          ]),
        );
    return reply
      .type('application/json')
      .send(serialize(evaluate(request.body)));
  });
  app.post('/api/recommend/batch', async (request, reply) => {
    if (
      !Array.isArray(request.body) ||
      request.body.length < 1 ||
      request.body.length > MAX_BATCH_ITEMS
    )
      return reply
        .code(400)
        .send(
          invalidRecommendation([
            { field: '$', message: 'Batch must contain 1–100 scenarios.' },
          ]),
        );
    const results = request.body.map((item) => evaluate(item));
    const counts = Object.fromEntries(
      ['ok', 'ok_with_warnings', 'infeasible', 'invalid_input'].map(
        (status) => [
          status,
          results.filter((item) => item.status === status).length,
        ],
      ),
    );
    return reply.type('application/json').send(serialize({ results, counts }));
  });
  app.post('/api/analyze', async (request, reply) => {
    if (
      !request.body ||
      typeof request.body !== 'object' ||
      Array.isArray(request.body)
    )
      return reply
        .code(400)
        .send({
          error: {
            code: 'ANALYSIS_INPUT',
            message:
              'Send one scenario object; analysis is bounded to one brief per request.',
          },
        });
    return reply
      .type('application/json')
      .send(serialize(analyzeDecision(request.body)));
  });
  const web = join(root, 'dist/web');
  if (options.serveWeb !== false && existsSync(join(web, 'index.html'))) {
    app.register(staticFiles, { root: web, index: false });
    app.get('/', (_request, reply) => reply.sendFile('index.html'));
    app.get('/results', (_request, reply) => reply.sendFile('index.html'));
    app.get('/about', (_request, reply) => reply.sendFile('index.html'));
  }
  app.setNotFoundHandler((_request, reply) =>
    reply
      .code(404)
      .send({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }),
  );
  return app;
}
