import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compile } from 'json-schema-to-typescript';
const root = fileURLToPath(new URL('../', import.meta.url));
let changed = false;
for (const [schema, name, output] of [
  ['scenario', 'Scenario', 'scenario.generated.ts'],
  ['recommendation', 'Recommendation', 'recommendation.generated.ts'],
]) {
  const source = JSON.parse(await readFile(`${root}schemas/${schema}.schema.json`, 'utf8'));
  source.title = name;
  const types = await compile(source, name, {
    bannerComment: '/* Generated from schemas/. Run npm run generate:types; do not edit by hand. */',
    style: { singleQuote: true, semi: true },
    format: true,
  });
  const path = `${root}packages/contracts/src/${output}`;
  if (process.argv.includes('--check')) {
    let current = '';
    try { current = await readFile(path, 'utf8'); } catch {}
    if (current !== types) { console.error(`Generated type is out of date: ${output}`); changed = true; }
  } else {
    await mkdir(`${root}packages/contracts/src`, { recursive: true });
    await writeFile(path, types);
  }
}
if (changed) process.exitCode = 1;
