import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

// Deliberately small and dependency-free: no persistence, authentication or cloud.
export const products = Array.from({ length: 10000 }, (_, id) => ({
  id,
  name: `Product ${id}`,
  category: id % 100,
  price_cents: 100 + id,
}));
export function createWorkload() {
  return createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const id = Number(url.searchParams.get('id'));
    let body;
    if (
      req.method === 'GET' &&
      url.pathname === '/product' &&
      /^\d+$/.test(url.searchParams.get('id') ?? '') &&
      id < products.length
    ) {
      body = products[id];
    } else if (
      req.method === 'GET' &&
      url.pathname === '/search' &&
      /^\d+$/.test(url.searchParams.get('id') ?? '') &&
      id < 100
    ) {
      body = { category: id, items: products.filter((p) => p.category === id) };
    } else {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    });
    res.end(JSON.stringify(body));
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const server = createWorkload();
  const cpu = process.cpuUsage();
  server.listen(0, '127.0.0.1', () =>
    process.send?.({ port: server.address().port }),
  );
  process.on('message', (message) => {
    if (message === 'stop') {
      process.send?.({
        resources: {
          cpu_microseconds: process.cpuUsage(cpu),
          peak_rss_bytes: process.resourceUsage().maxRSS * 1024,
        },
      });
      server.close(() => process.exit(0));
      server.closeAllConnections();
    }
  });
  process.on('disconnect', () => process.exit(0));
}
