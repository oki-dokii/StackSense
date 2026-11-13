export type Draft = Record<string, any>;
export type Schema = {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  items?: Schema;
  anyOf?: Schema[];
  properties?: Record<string, Schema>;
  required?: string[];
};
export const starter = (): Draft => ({
  project: { name: 'Untitled project', type: 'web_app', platforms: ['web'] },
  scale: { users_at_launch: 0, users_12_months: 100 },
  team: { size: 1, experience: 'beginner', languages: [] },
  budget: { monthly_infra_usd: 100 },
  timeline: { mvp_weeks: 4 },
});
export function read(value: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], value);
}
export function update(value: Draft, path: string, next: unknown): Draft {
  const result = structuredClone(value);
  const keys = path.split('.');
  let current = result;
  for (const key of keys.slice(0, -1)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key))
      throw new Error('Unsafe field.');
    if (
      !current[key] ||
      typeof current[key] !== 'object' ||
      Array.isArray(current[key])
    )
      current[key] = {};
    current = current[key];
  }
  const last = keys.at(-1)!;
  if (['__proto__', 'constructor', 'prototype'].includes(last))
    throw new Error('Unsafe field.');
  if (next === undefined) delete current[last];
  else current[last] = next;
  return result;
}
export function parseImport(text: string): unknown[] {
  if (new TextEncoder().encode(text).length > 2 * 1024 * 1024)
    throw new Error('JSON exceeds the 2 MiB limit.');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON. Check quotes, commas and brackets.');
  }
  let nodes = 0;
  function inspect(item: unknown, depth: number) {
    if (typeof item === 'number' && !Number.isFinite(item))
      throw new Error('Numbers must be finite.');
    if (++nodes > 100000 || depth > 32)
      throw new Error('JSON exceeds the nesting/value limit.');
    if (item && typeof item === 'object')
      for (const [key, child] of Object.entries(item)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key))
          throw new Error('Unsafe object key in JSON.');
        inspect(child, depth + 1);
      }
  }
  inspect(value, 0);
  const items = Array.isArray(value) ? value : [value];
  if (items.length < 1 || items.length > 100)
    throw new Error('Import 1–100 scenarios.');
  return items;
}
export const label = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
export function safeName(id: unknown, index: number) {
  const name =
    typeof id === 'string'
      ? id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
      : '';
  return `${/[a-zA-Z0-9]/.test(name) ? name : `scenario_${index + 1}`}_output.json`;
}
export function download(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2) + '\n'], {
      type: 'application/json',
    }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
