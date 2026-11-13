import { createServer } from './server.js';
const port = Number(process.env.STACKSENSE_PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('STACKSENSE_PORT must be an integer from 1 to 65535.');
const app = createServer();
await app.listen({ host: '127.0.0.1', port });
console.log(`StackSense is ready at http://127.0.0.1:${port}`);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
