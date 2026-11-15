import type { NormalizedScenario } from '../../contracts/src/index.js';
import type { Policies } from '../../catalog/src/services.js';
import type {
  CompleteCandidate,
  CostEstimate,
  CostLine,
} from './complete-types.js';
import { estimateCost, CostModelLimitError } from './costs.js';
export interface CostGroup {
  category: 'infrastructure_and_operations' | 'payment_and_message_activity';
  min: number;
  max: number;
  line_ids: string[];
}
export interface CostSensitivity {
  cost_category: CostGroup['category'];
  field: string;
  baseline_value: number;
  baseline_origin: 'supplied' | 'assumed';
  scope: 'selected_plan_fixed_no_reranking';
  samples: {
    value: number;
    status: 'estimated' | 'model_limit';
    min: number | null;
    max: number | null;
    upper_delta_usd: number | null;
  }[];
}
export function costGroups(lines: CostLine[]): CostGroup[] {
  return (
    ['infrastructure_and_operations', 'payment_and_message_activity'] as const
  ).map((category) => {
    const chosen = lines.filter(
      (line) =>
        (line.category === 'payments' || line.id === 'otp-delivery') ===
        (category === 'payment_and_message_activity'),
    );
    return {
      category,
      min:
        chosen.reduce((n, l) => n + Math.round(l.monthly_usd.min * 100), 0) /
        100,
      max:
        chosen.reduce((n, l) => n + Math.round(l.monthly_usd.max * 100), 0) /
        100,
      line_ids: chosen.map((l) => l.id),
    };
  });
}
import { traffic } from './traffic.js';
export function costSensitivity(
  candidate: CompleteCandidate,
  s: NormalizedScenario,
  p: Policies,
): CostSensitivity[] {
  if (candidate.plan.style === 'static') return [];
  const ext = s.extensions ?? {};
  const users = s.scale.users_12_months;
  const inputs: [string, number][] = [
    ['expected_requests_per_second', traffic(s).rps],
    ...(typeof ext.expected_requests_per_second !== 'number'
      ? [
          ['daily_active_user_fraction', traffic(s).fraction] as [
            string,
            number,
          ],
        ]
      : []),
    ['monthly_egress_gb', Math.max(1, users * 0.01)],
    ['retention_months', 1],
    ...(s.requirements.auth === 'phone_otp'
      ? [['monthly_otp_count', users * 2] as [string, number]]
      : []),
    ...(s.requirements.payments
      ? ([
          ['monthly_payment_transactions', Math.ceil(users * 0.02)],
          ['average_payment_value_usd', 50],
        ] as [string, number][])
      : []),
  ];
  return inputs.map(([field, fallback]) => {
    const supplied = typeof ext[field] === 'number';
    const baseline = supplied ? (ext[field] as number) : fallback;
    const values = [
      ...new Set([
        field === 'retention_months'
          ? Math.max(1, Math.floor(baseline / 2))
          : field.endsWith('_count') || field === 'monthly_payment_transactions'
            ? Math.floor(baseline / 2)
            : baseline / 2,
        field === 'daily_active_user_fraction'
          ? Math.min(1, baseline * 2)
          : baseline * 2,
      ]),
    ];
    const category: CostGroup['category'] = [
      'monthly_otp_count',
      'monthly_payment_transactions',
      'average_payment_value_usd',
    ].includes(field)
      ? 'payment_and_message_activity'
      : 'infrastructure_and_operations';
    const baselineCost = costGroups(candidate.cost.line_items).find(
      (g) => g.category === category,
    )!;
    return {
      cost_category: category,
      field: `extensions.${field}`,
      baseline_value: baseline,
      baseline_origin: supplied ? 'supplied' : 'assumed',
      scope: 'selected_plan_fixed_no_reranking',
      samples: values.map((value) => {
        const changed = structuredClone(s);
        changed.extensions = { ...changed.extensions, [field]: value };
        let cost: CostEstimate;
        try {
          cost = estimateCost(candidate.plan, changed, candidate.support, p);
        } catch (error) {
          if (!(error instanceof CostModelLimitError)) throw error;
          return {
            value,
            status: 'model_limit' as const,
            min: null,
            max: null,
            upper_delta_usd: null,
          };
        }
        const measured = costGroups(cost.line_items).find(
          (g) => g.category === category,
        )!;
        return {
          value,
          status: 'estimated' as const,
          min: measured.min,
          max: measured.max,
          upper_delta_usd:
            (Math.round(measured.max * 100) -
              Math.round(baselineCost.max * 100)) /
            100,
        };
      }),
    };
  });
}
