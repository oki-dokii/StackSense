import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

/** Bind actual screenshot captures to the exact batch supplied during capture. */
export async function verifyScreenshotInputBinding(root, manifest) {
  if (!/^[a-f0-9]{64}$/.test(manifest.input_sha256 ?? ''))
    throw new Error(
      'Screenshot input provenance hash is missing or malformed.',
    );
  const input = await readFile(join(root, 'evaluation/ui-scenarios.json'));
  const actual = createHash('sha256').update(input).digest('hex');
  if (actual !== manifest.input_sha256)
    throw new Error(
      'Screenshot input provenance changed after capture. Recapture evidence or restore the exact batch.',
    );
}
