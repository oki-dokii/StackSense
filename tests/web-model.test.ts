import { describe, it, expect } from 'vitest';
import { parseImport, update, read, safeName } from '../apps/web/src/model.js';
describe('browser input model', () => {
  it('accepts a UTF-8 BOM and one JSON code fence without changing input values', () => {
    expect(parseImport('\uFEFF{"project":{"name":"A"}}')).toEqual([{project:{name:'A'}}]);
    expect(parseImport('```json\n[{"project":{"name":"A"}}]\n```')).toEqual([{project:{name:'A'}}]);
  });
  it('reports an actionable JSON syntax location and preserves strict validation', () => {
    expect(() => parseImport('{\n  "project": {"name": "A",}\n}')).toThrow(/Invalid JSON at line 2.*trailing comma/);
    expect(() => parseImport('{“project”: {}}')).toThrow(/straight double quotes/);
    expect(() => parseImport('Here is the brief: {}')).toThrow(/Paste JSON only/);
    expect(() => parseImport('')).toThrow(/Paste a JSON scenario/);
  });
  it('preserves unknown nested extensions through guided edits', () => {
    const [draft] = parseImport(
      '{"project":{"name":"First"},"extensions":{"custom":{"preserve":true}}}',
    );
    const next = update(draft as any, 'project.name', 'Second');
    expect(read(next, 'extensions.custom.preserve')).toBe(true);
    expect(read(draft, 'project.name')).toBe('First');
  });
  it('omits cleared optional values without changing unrelated fields', () => {
    const next = update(
      { scale: { users_12_months: 0, peak_concurrent_users: 20 } },
      'scale.peak_concurrent_users',
      undefined,
    );
    expect(next).toEqual({ scale: { users_12_months: 0 } });
  });
  it.each([
    '{',
    '[]',
    '[' + Array.from({ length: 101 }, () => '{}').join(',') + ']',
    '{"__proto__":{}}',
  ])('rejects unsafe/invalid import %s', (text) =>
    expect(() => parseImport(text)).toThrow(),
  );
  it('rejects overflowing JSON numbers before serialization can change them', () =>
    expect(() => parseImport('{"scale":{"users_12_months":1e999}}')).toThrow(
      /finite/,
    ));
  it('allows invalid batch items to receive independent engine errors', () =>
    expect(parseImport('[{},null,10]')).toEqual([{}, null, 10]));
  it('rejects imports above the byte limit and excessive nesting', () => {
    expect(() =>
      parseImport(JSON.stringify('x'.repeat(2 * 1024 * 1024))),
    ).toThrow(/2 MiB/);
    expect(() => parseImport('['.repeat(34) + '{}' + ']'.repeat(34))).toThrow(
      /nesting/,
    );
  });
  it('does not allow prototype mutation through field paths', () => {
    expect(() => update({}, '__proto__.polluted', true)).toThrow();
    expect(({} as any).polluted).toBeUndefined();
  });
  it('produces portable export filenames without path segments', () => {
    expect(safeName('../../private/file', 0)).not.toContain('/');
    expect(safeName(undefined, 2)).toBe('scenario_3_output.json');
  });
});
