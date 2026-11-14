import { useEffect, useRef, useState } from 'react';
import type {
  DecisionLab,
  LabPlan,
} from '../../../packages/engine/src/decision-lab.js';
import type { FinalRecommendation } from '../../../packages/engine/src/complete-types.js';
import { download, downloadText, label, safeName } from './model';
const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
function Frontier({
  analysis,
  original,
}: {
  analysis: DecisionLab['priority_analysis'];
  original: string | null;
}) {
  const [chosen, setChosen] = useState(
    original ?? analysis.frontier_plan_ids[0] ?? '',
  );
  const plans = analysis.evaluated_plans;
  const chosenPlan = plans.find((p) => p.plan_id === chosen) ?? plans[0]!;
  const frontier = new Set(analysis.frontier_plan_ids);
  const maxCost = Math.max(1, ...plans.map((p) => p.monthly_usd.max));
  const minScore = Math.min(...plans.map((p) => p.original_priority_score));
  const maxScore = Math.max(
    minScore + 1,
    ...plans.map((p) => p.original_priority_score),
  );
  const x = (p: LabPlan) => 65 + (570 * p.monthly_usd.max) / maxCost;
  const y = (p: LabPlan) =>
    210 -
    (165 * (p.original_priority_score - minScore)) / (maxScore - minScore);
  return (
    <>
      <h3>Explore the catalog tradeoff front</h3>
      <p>
        All {plans.length} complete candidates were evaluated. Purple points are
        nondominated on cost upper bound, operated components and
        original-priority score. Scores and operating units are heuristics; cost
        is a planning band.
      </p>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Tradeoff chart, scroll horizontally to read all axes"
      >
        <svg
          className="frontier-chart"
          viewBox="0 0 700 275"
          role="img"
          aria-label="All complete candidates; infrastructure cost only, activity fees additional: cost upper estimate horizontally and original-priority score vertically. Purple indicates the declared three-objective frontier; the dark ring marks the inspected plan. Operating units are listed below, not on an axis."
        >
          <line x1="65" y1="225" x2="650" y2="225" stroke="currentColor" />
          <line x1="65" y1="30" x2="65" y2="225" stroke="currentColor" />
          <text x="65" y="250">
            $0
          </text>
          <text x="645" y="250" textAnchor="end">
            {money(maxCost)}
          </text>
          <text x="350" y="271" textAnchor="middle">
            Monthly cost upper estimate →
          </text>
          <text x="55" y="40" textAnchor="end">
            {maxScore}
          </text>
          <text x="55" y="214" textAnchor="end">
            {minScore}
          </text>
          <text
            x="12"
            y="125"
            transform="rotate(-90 12 125)"
            textAnchor="middle"
          >
            Original-priority score →
          </text>
          {plans.map((p) => (
            <circle
              key={p.plan_id}
              cx={x(p)}
              cy={y(p)}
              r={frontier.has(p.plan_id) ? 4 : 2.5}
              fill={frontier.has(p.plan_id) ? '#7254b6' : '#c9c2d4'}
            >
              <title>
                {p.core.frontend} / {p.core.backend}: {money(p.monthly_usd.max)}
                , score {p.original_priority_score}, {p.operated_components}{' '}
                operated units
              </title>
            </circle>
          ))}
          <circle
            cx={x(chosenPlan)}
            cy={y(chosenPlan)}
            r="7"
            fill="none"
            stroke="#25232d"
            strokeWidth="2"
          />
        </svg>
      </div>
      <label htmlFor="frontier-plan">
        Inspect a complete plan · original recommendation stays unchanged
      </label>
      <select
        id="frontier-plan"
        value={chosenPlan.plan_id}
        onChange={(event) => setChosen(event.target.value)}
      >
        {plans
          .filter((p) => frontier.has(p.plan_id) || p.plan_id === original)
          .map((p) => (
            <option key={p.plan_id} value={p.plan_id}>
              {p.plan_id === original ? 'Original · ' : ''}
              {p.core.frontend} / {p.core.backend} / {p.core.database} /{' '}
              {p.core.hosting} · {money(p.monthly_usd.max)} upper
            </option>
          ))}
      </select>
      <dl>
        <dt>Monthly band</dt>
        <dd>
          {money(chosenPlan.monthly_usd.min)} –{' '}
          {money(chosenPlan.monthly_usd.max)}
        </dd>
        <dt>Original-priority score</dt>
        <dd>{chosenPlan.original_priority_score}</dd>
        <dt>Operated component units</dt>
        <dd>{chosenPlan.operated_components} · heuristic</dd>
        <dt>Catalog plan</dt>
        <dd className="plan-id">{chosenPlan.plan_id}</dd>
      </dl>
      <details>
        <summary>Criterion fits for this plan</summary>
        <ul>
          {Object.entries(chosenPlan.fit).map(([criterion, fit]) => (
            <li key={criterion}>
              {label(criterion)}: {fit}/5 · authored heuristic
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
export function DecisionLabPanel({
  input,
  result,
  stale,
}: {
  input: unknown;
  result: FinalRecommendation;
  stale: boolean;
}) {
  const [analysis, setAnalysis] = useState<DecisionLab>();
  const [running, setRunning] = useState(false),
    [error, setError] = useState('');
  const controller = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (stale) {
      controller.current?.abort();
      setAnalysis(undefined);
    }
  }, [stale]);
  async function analyze() {
    if (stale || running) return;
    const request = new AbortController();
    controller.current = request;
    setRunning(true);
    setError('');
    const timeout = setTimeout(() => request.abort(), 30000);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: request.signal,
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error?.message ?? 'Analysis failed.');
      if (JSON.stringify(data.baseline) !== JSON.stringify(result))
        throw Error(
          'The original recommendation changed. Rerun your brief before analyzing.',
        );
      if (!request.signal.aborted) setAnalysis(data);
    } catch (e) {
      if (!request.signal.aborted) setError((e as Error).message);
    } finally {
      clearTimeout(timeout);
      setRunning(false);
    }
  }
  const filename = safeName(result.scenario_id, 0).replace(
    '_output.json',
    '_decision_lab',
  );
  return (
    <section
      className="panel decision-lab"
      aria-labelledby="decision-lab-heading"
    >
      <p className="eyebrow">STRESS-TEST THE REASONING</p>
      <h2 id="decision-lab-heading">Decision Lab</h2>
      <p>
        Challenge the recommendation before committing: inspect priority
        stability, the catalog tradeoff front and carefully bounded functional
        experiments. Your original brief and result stay unchanged.
      </p>
      <button
        className="primary"
        disabled={stale || running || result.status === 'invalid_input'}
        onClick={analyze}
      >
        {running
          ? 'Analyzing decisions…'
          : analysis
            ? 'Rerun Decision Lab'
            : 'Analyze this decision'}
      </button>
      {stale && (
        <p role="status">
          Rerun your changed brief before using or exporting the Decision Lab.
        </p>
      )}
      {result.status === 'invalid_input' && (
        <p>Fix the validation errors before exploring decisions.</p>
      )}
      {error && (
        <p className="alert critical" role="alert">
          {error}
        </p>
      )}
      {analysis && !stale && (
        <>
          <div className="lab-actions">
            <button onClick={() => download(analysis, filename + '.json')}>
              Export decision evidence JSON ↓
            </button>
            <button
              onClick={() =>
                downloadText(analysis.adr_markdown, filename + '.md')
              }
            >
              Export proposed ADR ↓
            </button>
          </div>
          {analysis.priority_analysis.status === 'evaluated' && (
            <>
              <h3>Does changing priorities change the winner?</h3>
              <p>
                <strong>
                  {analysis.priority_analysis.retained_winner_settings} of{' '}
                  {analysis.priority_analysis.tested_settings}
                </strong>{' '}
                tested settings retained the original winner.{' '}
                {analysis.priority_analysis.distinct_winners} distinct winners
                were observed.
              </p>
              <p>
                Six priorities are varied one at a time through values 1–5,
                keeping all other inputs fixed. Stability is not a confidence
                probability. Equal-score alternatives can remain even when the
                same identifier wins every trial.
              </p>
              <details>
                <summary>Inspect all 24 priority changes</summary>
                <div
                  className="table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="Priority sensitivity table, scroll for all columns"
                >
                  <table className="sensitivity-table">
                    <caption>
                      Actual reruns of the unchanged requirements
                    </caption>
                    <thead>
                      <tr>
                        <th>Priority</th>
                        <th>Weight</th>
                        <th>Winner</th>
                        <th>Displayed equal-score alternatives</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.priority_analysis.trials.map((trial) => (
                        <tr key={`${trial.criterion}-${trial.trial_weight}`}>
                          <th scope="row">{label(trial.criterion)}</th>
                          <td>
                            {trial.original_weight} → {trial.trial_weight}
                          </td>
                          <td>
                            {trial.changed_winner ? 'Changed' : 'Retained'}
                            <small className="plan-id">
                              {trial.selected_plan_id}
                            </small>
                          </td>
                          <td>{trial.displayed_equal_score_alternatives}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
              <Frontier
                analysis={analysis.priority_analysis}
                original={result.decision_trace.selected_plan_id}
              />
            </>
          )}
          {analysis.functional_experiments.status === 'evaluated' && (
            <>
              <h3>Which functional changes alter the blocker?</h3>
              <div className="alert warning">
                <strong>Changed-project experiments</strong>
                <p>
                  These results do not satisfy the original requirements. No
                  edit is applied. Compliance, residency/provider/deployment,
                  tenant isolation and quality targets are never relaxed.
                </p>
              </div>
              <p>
                {analysis.functional_experiments.tested_variants} eligible
                single/pair variants checked.{' '}
                {analysis.functional_experiments
                  .smallest_successful_edit_count === null
                  ? 'No usable variant was found within this bounded set.'
                  : `The smallest successful variant found uses ${analysis.functional_experiments.smallest_successful_edit_count} functional edit(s).`}{' '}
                This is not a globally minimal conflict explanation.
              </p>
              {analysis.functional_experiments.successful_variants.map(
                (variant, index) => (
                  <article className="experiment" key={index}>
                    <h4>Hypothetical variant {index + 1}</h4>
                    <ul>
                      {variant.edits.map((edit) => (
                        <li key={edit.field}>
                          {edit.field}:{' '}
                          <strong>
                            {JSON.stringify(edit.before)} →{' '}
                            {JSON.stringify(edit.after)}
                          </strong>
                        </li>
                      ))}
                    </ul>
                    <p>
                      {label(variant.status)} under the changed brief ·{' '}
                      {variant.monthly_usd
                        ? `${money(variant.monthly_usd.min)} – ${money(variant.monthly_usd.max)}/month`
                        : 'Not estimated'}
                      . Review all changed requirements before proceeding.
                    </p>
                    <p>
                      <strong>Review codes:</strong>{' '}
                      {variant.warning_codes.join(', ') || 'None'}
                    </p>
                  </article>
                ),
              )}
              <details>
                <summary>Every tested variant and remaining blockers</summary>
                {analysis.functional_experiments.trials.map((trial, index) => (
                  <p key={index}>
                    {trial.edits
                      .map(
                        (edit) => `${edit.field}=${JSON.stringify(edit.after)}`,
                      )
                      .join('; ')}{' '}
                    · {label(trial.status)} ·{' '}
                    {trial.remaining_blocker_codes.join(', ') ||
                      'No critical engine blocker under this changed brief'}
                  </p>
                ))}
              </details>
            </>
          )}
          <details>
            <summary>Evidence passport and analysis limits</summary>
            <p>
              Analysis {analysis.analysis_version} ·{' '}
              {analysis.engine_evaluations} engine evaluations · Input SHA-256{' '}
              <span className="plan-id">{analysis.input_sha256}</span>
            </p>
            <ul>
              {analysis.limitations.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
            <div className="sources">
              {analysis.evidence.map((source) => (
                <p key={source.id}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title} ↗
                  </a>
                  <small>
                    Reviewed {source.checked_on} · {source.scope}
                  </small>
                </p>
              ))}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
