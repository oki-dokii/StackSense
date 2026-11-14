import { Ajv } from 'ajv';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Catalog, Entry, Layer, Region } from './types.js';
export * from './types.js';

function repositoryRoot(): string {
  let path = dirname(fileURLToPath(import.meta.url));
  while (path !== parse(path).root) {
    if (existsSync(join(path, 'schemas/catalog.schema.json'))) return path;
    path = dirname(path);
  }
  throw new Error(
    'Catalog/schema files are missing from the repository checkout.',
  );
}
const root = repositoryRoot();
const schema = JSON.parse(
  readFileSync(join(root, 'schemas/catalog.schema.json'), 'utf8'),
);
const validator = new Ajv({ allErrors: true, strict: false }).compile(schema);

export function assertCatalog(value: unknown): asserts value is Catalog {
  if (!validator(value))
    throw new Error(`Invalid catalog: ${JSON.stringify(validator.errors)}`);
  const catalog = value as Catalog;
  const sources = new Set<string>();
  for (const source of catalog.sources) {
    if (sources.has(source.id))
      throw new Error(`Duplicate source ID: ${source.id}`);
    if (
      !/^https:\/\//.test(source.url) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(source.checked_on)
    )
      throw new Error(`Invalid source metadata: ${source.id}`);
    sources.add(source.id);
  }
  const entries = new Map<string, Entry>();
  for (const entry of catalog.entries) {
    if (entries.has(entry.id))
      throw new Error(`Duplicate catalog ID: ${entry.id}`);
    entries.set(entry.id, entry);
  }
  function checkSources(ids: string[]): void {
    for (const id of ids)
      if (!sources.has(id)) throw new Error(`Unknown source: ${id}`);
  }
  function checkRegions(regions: Region[]): void {
    const seen = new Set<string>();
    for (const region of regions) {
      if (seen.has(region.residency))
        throw new Error(`Duplicate residency mapping: ${region.residency}`);
      seen.add(region.residency);
      checkSources(region.source_ids);
    }
  }
  for (const entry of catalog.entries) {
    checkSources(entry.source_ids);
    checkRegions(entry.regions ?? []);
    if (
      entry.fixed_region &&
      (entry.layer !== 'hosting' ||
        !entry.regions?.some((r) => r.region === entry.fixed_region))
    )
      throw new Error(
        `Fixed region lacks reviewed hosting evidence: ${entry.id}`,
      );
    for (const id of entry.databases ?? [])
      if (entries.get(id)?.layer !== 'database')
        throw new Error(
          `Invalid database compatibility edge: ${entry.id} -> ${id}`,
        );
    for (const database of entry.managed_databases ?? []) {
      if (entries.get(database.database_id)?.layer !== 'database')
        throw new Error(
          `Invalid managed database edge: ${database.database_id}`,
        );
      checkSources(database.source_ids);
      checkRegions(database.regions);
    }
    if (
      entry.layer === 'hosting' &&
      entry.provider === 'none' &&
      entry.deployments?.some(
        (mode) => !['on_premise', 'air_gapped'].includes(mode),
      )
    )
      throw new Error(
        'A provider-none host cannot claim a public-cloud deployment.',
      );
  }
  for (const layer of ['frontend', 'backend', 'database', 'hosting'] as Layer[])
    if (
      !catalog.entries.some(
        (entry) => entry.layer === layer && entry.status === 'active',
      )
    )
      throw new Error(`No active catalog entries for ${layer}`);
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
export function loadCatalog(): Catalog {
  const catalog: unknown = JSON.parse(
    readFileSync(join(root, 'packages/catalog/data/catalog.json'), 'utf8'),
  );
  assertCatalog(catalog);
  return deepFreeze(catalog);
}
export const defaultCatalog = loadCatalog();
