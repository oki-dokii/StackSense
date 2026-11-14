import type { FinalRecommendation } from '../../../packages/engine/src/complete-types.js';
const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
export function BudgetPlanning({ result }: { result: FinalRecommendation }) {
  const planning = result.budget_planning;
  if (!planning?.cheapest_same_scope || result.estimate_status !== 'estimated')
    return null;
  const cheapest = planning.cheapest_same_scope;
  return (
    <section className="panel" aria-label="Budget planning">
      <p className="eyebrow">BUDGET OPTIONS · ORIGINAL BRIEF PRESERVED</p>
      <h2>What would a lower-cost deployment change?</h2>
      <p>
        The lowest upper estimate among reviewed complete plans under your
        unchanged requirements is{' '}
        <strong>
          {money(cheapest.monthly_infrastructure_usd.min)} –{' '}
          {money(cheapest.monthly_infrastructure_usd.max)} / month
        </strong>{' '}
        for infrastructure. This is a catalog planning result; vendor conditions
        and capacity tests still apply.
      </p>
      {planning.options.map((option) => (
        <article key={option.id}>
          <h3>Optional proposal — requires explicit acceptance</h3>
          <p>
            <strong>{option.core.hosting}</strong> ·{' '}
            {option.primary_region ?? 'region not specified'}
          </p>
          <dl className="cost-groups">
            <div>
              <dt>Infrastructure only</dt>
              <dd>
                {money(option.monthly_infrastructure_usd.min)} –{' '}
                {money(option.monthly_infrastructure_usd.max)}
              </dd>
            </div>
            <div>
              <dt>Including assumed payment/SMS activity</dt>
              <dd>
                {money(option.monthly_total_usd.min)} –{' '}
                {money(option.monthly_total_usd.max)}
              </dd>
            </div>
            <div>
              <dt>Infrastructure budget fit</dt>
              <dd>
                {option.budget_fit === 'within_upper'
                  ? 'Upper bound fits'
                  : option.budget_fit === 'range_risk'
                    ? 'Only the lower bound fits'
                    : 'Still over budget'}
              </dd>
            </div>
          </dl>
          <p>
            This proposal changes requirements. It is not applied to your brief,
            selected stack or exports of the original result.
          </p>
          <ul>
            {option.changes.map((change) => (
              <li key={change.field}>
                <strong>
                  {change.field}: {change.from} → {change.to}.
                </strong>{' '}
                {change.consequence}
              </li>
            ))}
          </ul>
          <p>
            {option.core.frontend} / {option.core.backend} /{' '}
            {option.core.database}
          </p>
          <details>
            <summary>Proposal conditions and cost assumptions</summary>
            <ul>
              {option.warnings.map((warning, i) => (
                <li key={`w${i}`}>
                  <strong>
                    {warning.severity.toUpperCase()} · {warning.code}:
                  </strong>{' '}
                  {warning.message}
                </li>
              ))}
            </ul>
            <ul>
              {option.assumptions.map((assumption, i) => (
                <li key={`a${i}`}>{assumption}</li>
              ))}
            </ul>
          </details>
        </article>
      ))}
      {planning.options.length === 0 && (
        <p>
          No cheaper usable proposal was found by the bounded
          availability/self-management experiment. This does not prove no
          real-world option exists.
        </p>
      )}
      <details>
        <summary>Why is the estimate uncertain?</summary>
        <ul>
          {planning.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
