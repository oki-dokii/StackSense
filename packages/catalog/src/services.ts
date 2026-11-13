import { Ajv } from 'ajv';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSchema } from '../../contracts/src/schemas.js';
import type { Source } from './types.js';
export type SupportingLayer =
  | 'cache'
  | 'queue'
  | 'search'
  | 'auth'
  | 'storage'
  | 'cdn'
  | 'realtime'
  | 'payments'
  | 'ml'
  | 'ci_cd'
  | 'observability'
  | 'other';
export interface ServiceProfile {
  id: string;
  layer: SupportingLayer;
  choice: string;
  capability: string;
  placement: 'host' | 'device' | 'database' | 'external' | 'build';
  source_ids: string[];
  compute_units: number;
  database_ids: string[];
  frontend_ids: string[];
  providers: string[];
  alternative: string;
  why_not: string;
  tradeoffs: string[];
}
export interface Rate {
  min: number;
  max: number;
  source_ids: string[];
  basis: string;
}
export interface Framework {
  id: string;
  source_ids: string[];
  technical_controls: string[];
  owner_actions: string[];
  verification: 'design_only_not_certified';
}
export interface Policies {
  version: string;
  reviewed_on: string;
  sources: Source[];
  services: ServiceProfile[];
  frameworks: Framework[];
  pricing: Record<string, Rate>;
  lifecycle: {
    id: string;
    product: string;
    pattern: string;
    ended: string;
    source_ids: string[];
  }[];
}
const validator = new Ajv({ allErrors: true, strict: false }).compile(
  readSchema('services.schema.json'),
);
export function assertPolicies(value: unknown): asserts value is Policies {
  if (!validator(value))
    throw new Error(
      `Invalid service/pricing policies: ${JSON.stringify(validator.errors)}`,
    );
  const p = value as Policies;
  const sources = new Set<string>();
  for (const source of p.sources) {
    if (sources.has(source.id) || !source.url.startsWith('https://'))
      throw new Error(`Invalid/duplicate policy source ${source.id}`);
    sources.add(source.id);
  }
  function refs(ids: string[]) {
    for (const id of ids)
      if (!sources.has(id)) throw new Error(`Unknown policy source ${id}`);
  }
  const ids = new Set<string>();
  for (const service of p.services) {
    if (ids.has(service.id)) throw new Error(`Duplicate service ${service.id}`);
    ids.add(service.id);
    refs(service.source_ids);
  }
  const lifecycleIds = new Set<string>();
  for (const item of p.lifecycle) {
    if (lifecycleIds.has(item.id))
      throw new Error(`Duplicate lifecycle ${item.id}`);
    lifecycleIds.add(item.id);
    refs(item.source_ids);
    new RegExp(item.pattern, 'i');
  }
  const frameworks = new Set<string>();
  for (const framework of p.frameworks) {
    if (frameworks.has(framework.id))
      throw new Error(`Duplicate framework ${framework.id}`);
    frameworks.add(framework.id);
    refs(framework.source_ids);
  }
  for (const [id, rate] of Object.entries(p.pricing)) {
    if (rate.min > rate.max) throw new Error(`Reversed price band ${id}`);
    refs(rate.source_ids);
  }
}
export function loadPolicies(): Policies {
  const local = dirname(fileURLToPath(import.meta.url));
  // Source: packages/catalog/src; compiled: dist/packages/catalog/src. Read from the shared root resolver.
  let directory = local;
  for (let depth = 0; depth < 8; depth++) {
    try {
      const data: unknown = JSON.parse(
        readFileSync(
          join(directory, 'packages/catalog/data/services.json'),
          'utf8',
        ),
      );
      assertPolicies(data);
      return freeze(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    directory = dirname(directory);
  }
  throw new Error('Service policies are missing from repository checkout.');
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
export const defaultPolicies = loadPolicies();
