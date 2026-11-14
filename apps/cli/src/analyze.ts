import { parseArgs } from 'node:util';
import { realpath } from 'node:fs/promises';
import { readInput } from './io.js';
import { parseJson, serialize } from '../../../packages/contracts/src/index.js';
import { analyzeDecision } from '../../../packages/engine/src/decision-lab.js';
try {
  const { values } = parseArgs({
    options: {
      input: { type: 'string' },
      format: { type: 'string', default: 'json' },
      help: { type: 'boolean' },
    },
    allowPositionals: false,
  });
  if (values.help)
    process.stdout.write(
      'StackSense Decision Lab\n  npm run --silent analyze -- --input scenario.json [--format json|adr]\nExplores a copy; never edits the input or approves changed requirements.\n',
    );
  else {
    if (!values.input || !['json', 'adr'].includes(values.format))
      throw Error('Use --input scenario.json and --format json|adr.');
    const parsed = parseJson(await readInput(await realpath(values.input)));
    if (parsed.errors.length) {
      process.stdout.write(
        serialize(
          { error: { code: 'INVALID_JSON', issues: parsed.errors } },
          true,
        ),
      );
      process.exitCode = 2;
    } else {
      const result = analyzeDecision(parsed.value);
      process.stdout.write(
        values.format === 'adr' ? result.adr_markdown : serialize(result, true),
      );
      process.exitCode =
        result.baseline.status === 'invalid_input'
          ? 2
          : result.baseline.status === 'infeasible'
            ? 3
            : 0;
    }
  }
} catch (error) {
  process.stderr.write(`Decision Lab: ${(error as Error).message}\n`);
  process.exitCode = 1;
}
