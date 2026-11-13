import { parseArgs } from 'node:util';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { access, realpath } from 'node:fs/promises';
import { invalidReport, normalizeScenario, parseJson, serialize, MAX_BATCH_ITEMS } from '../../../packages/contracts/src/index.js';
import type { ValidationReport } from '../../../packages/contracts/src/index.js';
import { batchNames, InputLimitError, readInput, writeJson } from './io.js';

const help = `StackSense Phase 1: scenario validation and normalization

  npm run validate -- --input scenario.json [--output report.json] [--pretty]
  npm run validate:batch -- --input scenarios.json [--output-dir reports] [--pretty]

Options:
  --input       Required path to a standard scenario (or an array in batch mode)
  --output      Single validation report file; otherwise JSON goes to stdout
  --output-dir  Batch report directory; otherwise batch JSON goes to stdout
  --batch       Validate 1–100 items independently
  --force       Replace existing report files (never the input)
  --pretty      Indent JSON output
  --no-llm      Accepted no-op; Phase 1 performs no LLM or network calls
  --help        Show this message

Exit codes: 0 all valid; 2 invalid input; 1 usage, filesystem or internal failure.
These are validation reports, not stack recommendations.
`;

export async function run(args = process.argv.slice(2)): Promise<number> {
  try {
    const { values } = parseArgs({ args, options: {
      input: { type: 'string' }, output: { type: 'string' }, 'output-dir': { type: 'string' },
      batch: { type: 'boolean' }, force: { type: 'boolean' }, pretty: { type: 'boolean' },
      'no-llm': { type: 'boolean' }, help: { type: 'boolean' },
    }, strict: true, allowPositionals: false });
    if (values.help) { process.stdout.write(help); return 0; }
    if (!values.input) throw new Error('--input is required. Use --help for examples.');
    if (values.batch && values.output) throw new Error('Use --output-dir with --batch, not --output.');
    if (!values.batch && values['output-dir']) throw new Error('--output-dir requires --batch.');
    const input = await realpath(resolve(values.input));
    let parsed: ReturnType<typeof parseJson>;
    try { parsed = parseJson(await readInput(input)); }
    catch (error) {
      if (!(error instanceof InputLimitError || error instanceof TypeError)) throw error;
      parsed = { value: null, errors: [{ field: '$', message: error instanceof InputLimitError ? error.message : 'Input must contain valid UTF-8 text.' }] };
    }
    async function ensureNotInput(output: string): Promise<void> {
      let existing = output;
      try { existing = await realpath(output); } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      if (existing === input) throw new Error('Refusing to overwrite the input file, even with --force.');
    }
    let reports: ValidationReport[];
    let items: unknown[] = [];
    if (parsed.errors.length) reports = [invalidReport(parsed.errors)];
    else if (values.batch) {
      if (!Array.isArray(parsed.value) || parsed.value.length < 1 || parsed.value.length > MAX_BATCH_ITEMS) {
        reports = [invalidReport([{ field: '$', message: `Batch input must be an array of 1–${MAX_BATCH_ITEMS} scenarios.` }])];
      } else { items = parsed.value; reports = items.map(normalizeScenario); }
    } else reports = [normalizeScenario(parsed.value)];

    if (values.output) {
      const output = resolve(values.output);
      await ensureNotInput(output);
      await writeJson(output, serialize(reports[0], values.pretty), values.force);
    } else if (values['output-dir'] && items.length) {
      const names = batchNames(items);
      const directory = resolve(values['output-dir']);
      const destinations = [...names, 'validation_manifest.json'].map(name => join(directory, name));
      for (const destination of destinations) await ensureNotInput(destination);
      // Detect existing paths before publishing any batch files. Individual writes still enforce exclusivity.
      if (!values.force) {
        for (const destination of destinations) {
          try { await access(destination); } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
            throw error;
          }
          throw new Error(`Output exists: ${destination}. Use --force to replace reports.`);
        }
      }
      for (const [index, report] of reports.entries()) await writeJson(destinations[index]!, serialize(report, values.pretty), values.force);
      const manifest = { schema_version: '0.1.0', files: names, valid: reports.filter(report => report.status === 'valid').length, invalid_input: reports.filter(report => report.status === 'invalid_input').length };
      await writeJson(join(directory, 'validation_manifest.json'), serialize(manifest, values.pretty), values.force);
    } else process.stdout.write(serialize(values.batch && items.length ? reports : reports[0], values.pretty));
    return reports.some(report => report.status === 'invalid_input') ? 2 : 0;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const message = code === 'EEXIST' ? 'Output already exists. Use --force to replace reports.' : error instanceof Error ? error.message : 'Unexpected failure.';
    process.stderr.write(`StackSense: ${message}\n`);
    return 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = await run();
