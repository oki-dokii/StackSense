import Fastify from 'fastify';
import pg from 'pg';
import { pathToFileURL } from 'node:url';
export function operation(index) {
  const slot = index % 10;
  return {
    kind: slot === 9 ? 'write' : slot === 8 ? 'search' : 'read',
    id: index % 10000,
  };
}
export function validProduct(value, id) {
  return (
    value?.id === id &&
    value.name === `Product ${id}` &&
    value.category === id % 100 &&
    value.price_cents === 100 + id &&
    value.description === 'x'.repeat(256)
  );
}
export function correctBody(kind, id, eventId, body) {
  if (kind === 'read') return validProduct(body, id);
  if (kind === 'write') return body?.id === eventId && body.product_id === id;
  return (
    body?.category === id % 100 &&
    body.items?.length === 20 &&
    body.items.every((p, i) => validProduct(p, (id % 100) + i * 100))
  );
}
export async function createWorkload(config) {
  const pool = new pg.Pool({
    ...config,
    max: 8,
    connectionTimeoutMillis: 1000,
    query_timeout: 1000,
    statement_timeout: 1000,
  });
  const app = Fastify({ logger: false, bodyLimit: 1024, requestTimeout: 2000 });
  pool.on('error', () => {
    process.exitCode = 1;
  });
  const idSchema = {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer', minimum: 0, maximum: 9999 } },
  };
  app.get(
    '/product/:id',
    { schema: { params: idSchema } },
    async (req) =>
      (
        await pool.query('SELECT * FROM products WHERE id = $1', [
          req.params.id,
        ])
      ).rows[0],
  );
  app.get('/search/:id', { schema: { params: idSchema } }, async (req) => ({
    category: req.params.id % 100,
    items: (
      await pool.query(
        'SELECT * FROM products WHERE category = $1 ORDER BY id LIMIT 20',
        [req.params.id % 100],
      )
    ).rows,
  }));
  app.post(
    '/events',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'product_id'],
          properties: {
            id: { type: 'integer', minimum: 0, maximum: 1000000 },
            product_id: { type: 'integer', minimum: 0, maximum: 9999 },
          },
        },
      },
    },
    async (req) =>
      (
        await pool.query(
          'INSERT INTO events (id, product_id) VALUES ($1, $2) RETURNING *',
          [req.body.id, req.body.product_id],
        )
      ).rows[0],
  );
  app.addHook('onClose', () => pool.end());
  return app;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const app = await createWorkload({
    host: process.env.STACKSENSE_BENCH_SOCKET,
    user: 'stacksense',
    database: 'postgres',
  });
  await app.listen({ port: 0, host: '127.0.0.1' });
  process.send({ port: app.server.address().port });
  process.on('message', async (message) => {
    if (message === 'stop') {
      await app.close();
      process.exit(0);
    }
  });
  process.on('disconnect', () => process.exit(0));
}
