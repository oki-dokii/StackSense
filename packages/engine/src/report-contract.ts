import { Ajv } from 'ajv';
import { readSchema } from '../../contracts/src/schemas.js';
import type { CorePlanningReport } from './types.js';
const validator = new Ajv({ allErrors: true, strict: false }).compile(
  readSchema('core-planning.schema.json'),
);
export function assertCoreReport(
  report: unknown,
): asserts report is CorePlanningReport {
  if (!validator(report))
    throw new Error(
      `Invalid core-planning output: ${JSON.stringify(validator.errors)}`,
    );
  const typed = report as CorePlanningReport;
  if (
    typed.score !== null &&
    typed.score !==
      typed.score_breakdown.reduce((sum, part) => sum + part.contribution, 0)
  )
    throw new Error('Core score does not equal its contribution breakdown.');
  for (const part of typed.score_breakdown)
    if (part.contribution !== part.fit * part.weight)
      throw new Error('Invalid score contribution.');
}
