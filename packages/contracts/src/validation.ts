import { Ajv, type ErrorObject } from 'ajv';
import { scenarioSchema, recommendationSchema } from './schemas.js';
import { compare } from './canonical.js';
import type { ValidationIssue } from './types.js';

const ajv = new Ajv({ allErrors: true, coerceTypes: false, useDefaults: false, removeAdditional: false, strict: false, strictNumbers: true });
const inputValidator = ajv.compile(scenarioSchema);
const outputValidator = ajv.compile(recommendationSchema);
export const MAX_INPUT_BYTES = 2 * 1024 * 1024;
export const MAX_BATCH_ITEMS = 100;
export const MAX_DEPTH = 32;
const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor']);

function errorPath(error: ErrorObject): string {
  const segments = error.instancePath.split('/').slice(1).map(item => item.replace(/~1/g, '/').replace(/~0/g, '~'));
  if (error.keyword === 'required') segments.push(String(error.params.missingProperty));
  return segments.join('.') || '$';
}
export function sortIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const unique = new Map(issues.map(issue => [`${issue.field}\0${issue.message}`, issue]));
  return [...unique.values()].sort((a, b) => compare(a.field, b.field) || compare(a.message, b.message));
}
/** Guard even programmatic callers: finite JSON values, bounded nesting, no cycles/prototype keys. */
export function inspectJson(value: unknown): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  const ancestors = new Set<object>();
  let nodes = 0;
  function walk(item: unknown, path: string, depth: number): void {
    if (++nodes > 100_000) { if (nodes === 100_001) errors.push({ field: '$', message: 'Input exceeds 100,000 JSON values.' }); return; }
    if (depth > MAX_DEPTH) { errors.push({ field: path, message: `Input nesting exceeds ${MAX_DEPTH} levels.` }); return; }
    if (typeof item === 'number' && !Number.isFinite(item)) errors.push({ field: path, message: 'Must be a finite JSON number.' });
    if (['undefined', 'function', 'symbol', 'bigint'].includes(typeof item)) errors.push({ field: path, message: 'Must be a JSON value.' });
    if (item === null || typeof item !== 'object') return;
    if (ancestors.has(item)) { errors.push({ field: path, message: 'Circular references are not valid JSON.' }); return; }
    if (!Array.isArray(item) && ![Object.prototype, null].includes(Object.getPrototypeOf(item))) {
      errors.push({ field: path, message: 'Must be a plain JSON object.' }); return;
    }
    ancestors.add(item);
    for (const [key, child] of Object.entries(item)) {
      const childPath = path === '$' ? key : `${path}.${key}`;
      if (unsafeKeys.has(key)) errors.push({ field: childPath, message: 'Unsafe object key is not allowed.' });
      else walk(child, childPath, depth + 1);
    }
    ancestors.delete(item);
  }
  walk(value, '$', 0);
  return sortIssues(errors);
}
/** Parse only; validate each scenario separately so an unsafe batch item does not stop its siblings. */
export function parseJson(text: string): { value: unknown; errors: ValidationIssue[] } {
  if (Buffer.byteLength(text, 'utf8') > MAX_INPUT_BYTES) return { value: null, errors: [{ field: '$', message: 'JSON input exceeds the 2 MiB limit.' }] };
  try {
    const value: unknown = JSON.parse(text);
    return { value, errors: [] };
  } catch {
    return { value: null, errors: [{ field: '$', message: 'Invalid JSON. Check quotes, commas, and brackets.' }] };
  }
}
export function validateInput(value: unknown): ValidationIssue[] {
  const safety = inspectJson(value);
  if (safety.length) return safety;
  if (inputValidator(value)) return [];
  return sortIssues((inputValidator.errors ?? []).map(error => ({ field: errorPath(error), message: error.message ?? 'Invalid value.' })));
}
export function validateOutput(value: unknown): ValidationIssue[] {
  const safety = inspectJson(value);
  if (safety.length) return safety;
  if (!outputValidator(value)) return sortIssues((outputValidator.errors ?? []).map(error => ({ field: errorPath(error), message: error.message ?? 'Invalid value.' })));
  const result = value as { estimated_monthly_cost_usd: { min: number; max: number } };
  if (result.estimated_monthly_cost_usd.min > result.estimated_monthly_cost_usd.max) return [{ field: 'estimated_monthly_cost_usd', message: 'min must not exceed max.' }];
  return [];
}
