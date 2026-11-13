import { link, mkdir, open, rename, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { MAX_INPUT_BYTES } from '../../../packages/contracts/src/index.js';

export async function readInput(path: string): Promise<string> {
  const file = await open(path, 'r');
  try {
    if (!(await file.stat()).isFile())
      throw new Error('Input must be a regular JSON file.');
    // Read at most limit+1 even if a file grows after stat.
    const data = Buffer.alloc(MAX_INPUT_BYTES + 1);
    let offset = 0;
    while (offset < data.length) {
      const { bytesRead } = await file.read(
        data,
        offset,
        data.length - offset,
        null,
      );
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset > MAX_INPUT_BYTES)
      throw new InputLimitError('JSON input exceeds the 2 MiB limit.');
    return new TextDecoder('utf-8', { fatal: true }).decode(
      data.subarray(0, offset),
    );
  } finally {
    await file.close();
  }
}
export class InputLimitError extends Error {}

/** Publish a complete sibling temporary file; hard-link creation refuses overwrite atomically. */
export async function writeJson(
  path: string,
  text: string,
  force = false,
): Promise<void> {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  const temporary = join(dirname(target), `.stacksense-${randomUUID()}.tmp`);
  try {
    const file = await open(temporary, 'wx', 0o600);
    try {
      await file.writeFile(text, 'utf8');
      await file.sync();
    } finally {
      await file.close();
    }
    if (force) await rename(temporary, target);
    else await link(temporary, target);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}
export function batchNames(
  values: unknown[],
  suffix: 'validation' | 'core_plan' = 'validation',
): string[] {
  const used = new Set<string>();
  return values.map((value, index) => {
    const id =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>).scenario_id
        : undefined;
    let base =
      typeof id === 'string'
        ? id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
        : '';
    if (!/[a-zA-Z0-9]/.test(base)) base = `scenario_${index + 1}`;
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(base))
      base = `scenario_${base}`;
    let name = `${base}_${suffix}.json`;
    for (let collision = index + 1; used.has(name.toLowerCase()); collision++)
      name = `${base}_${collision}_${suffix}.json`;
    used.add(name.toLowerCase());
    return name;
  });
}
