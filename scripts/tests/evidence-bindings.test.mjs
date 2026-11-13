import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { verifyScreenshotInputBinding } from '../evidence-bindings.mjs';
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'stacksense-capture-test-'));
  try {
    await mkdir(join(root, 'evaluation'));
    const text = '[{"scenario_id":"actual-capture"}]\n';
    await writeFile(join(root, 'evaluation/ui-scenarios.json'), text);
    await run(root, {
      input_sha256: createHash('sha256').update(text).digest('hex'),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
test('accepts the exact captured input bytes', () =>
  fixture(async (root, manifest) => {
    await verifyScreenshotInputBinding(root, manifest);
  }));
test('rejects a different scenario batch even while screenshot image hashes remain unchanged', () =>
  fixture(async (root, manifest) => {
    await writeFile(
      join(root, 'evaluation/ui-scenarios.json'),
      '[{"scenario_id":"different-project"}]\n',
    );
    await assert.rejects(
      verifyScreenshotInputBinding(root, manifest),
      /changed after capture/,
    );
  }));
test('rejects missing or malformed capture provenance', () =>
  fixture(async (root) => {
    for (const input_sha256 of [undefined, 'not-a-hash', 'a'.repeat(63)])
      await assert.rejects(
        verifyScreenshotInputBinding(root, { input_sha256 }),
        /missing or malformed/,
      );
  }));
