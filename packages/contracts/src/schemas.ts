import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

// Works from source and compiled dist, independently of the caller's cwd.
function schemaDirectory(): string {
  let directory = dirname(fileURLToPath(import.meta.url));
  while (directory !== parse(directory).root) {
    const path = join(directory, 'schemas', 'scenario.schema.json');
    if (existsSync(path)) return dirname(path);
    directory = dirname(directory);
  }
  throw new Error('StackSense schemas are missing. Run from a complete repository checkout.');
}
const directory = schemaDirectory();
export function readSchema(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(directory, name), 'utf8')) as Record<string, unknown>;
}
export const scenarioSchema = readSchema('scenario.schema.json');
export const recommendationSchema = readSchema('recommendation.schema.json');
