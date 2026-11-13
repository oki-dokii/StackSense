/** Stable key order for deterministic JSON, without changing array semantics. */
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => compare(a, b)).map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}
export function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
export function serialize(value: unknown, pretty = false): string {
  return `${JSON.stringify(canonicalize(value), null, pretty ? 2 : undefined)}\n`;
}
