import { BudgetPlanning } from './budget-planning.js';
import { DecisionLabPanel } from './decision-lab';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { FinalRecommendation } from '../../../packages/engine/src/complete-types.js';
import type { Component } from '../../../packages/contracts/src/recommendation.generated.js';
import {
  starter,
  read,
  update,
  parseImport,
  label,
  safeName,
  download,
  type Draft,
  type Schema,
} from './model';
import './style.css';
type Source = { id: string; title: string; url: string; register: string };
type Method = {
  schema: Schema;
  sources: Source[];
  notes: string[];
  engine_version: string;
  catalog_version: string;
  services_version: string;
};
const sections = [
  ['project', 'Project'],
  ['scale', 'Scale'],
  ['team', 'Team'],
  ['budget', 'Budget'],
  ['timeline', 'Delivery'],
  ['infrastructure', 'Infrastructure'],
  ['requirements', 'Features & quality'],
  ['compliance', 'Compliance'],
  ['priorities', 'Priorities'],
  ['extensions', 'Usage estimates'],
];
const helpful: Record<string, string> = {
  scale:
    'Optional capacity fields can stay unknown. Users are not a throughput measurement.',
  team: 'Languages are lowercase tokens separated by commas.',
  infrastructure:
    'Provider, deployment and residency requirements are treated as constraints.',
  requirements:
    'Targets require deployment validation; a selected product does not guarantee an SLA.',
  compliance:
    'Control designs require implementation and scope-specific review. They are not certification.',
  priorities:
    '1 = lower preference · 5 = higher preference. Constraints still take precedence.',
  extensions:
    'Optional usage inputs refine costs. Unapplied or unknown fields remain visible in result warnings.',
};
const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
const quantity = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
function Mark() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
      <path
        d="m14 2 12 6-12 6L2 8Zm-12 12 12 6 12-6M2 20l12 6 12-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ListInput({
  id,
  value,
  help,
  onChange,
}: {
  id: string;
  value: unknown;
  help: string;
  onChange: (next: string[]) => void;
}) {
  const canonical = Array.isArray(value)
    ? value.join(', ')
    : String(value ?? '');
  const [text, setText] = useState(canonical);
  const lastEmitted = useRef(canonical);
  useEffect(() => {
    if (canonical !== lastEmitted.current) setText(canonical);
    lastEmitted.current = canonical;
  }, [canonical]);
  return (
    <input
      id={id}
      value={text}
      aria-describedby={help}
      onChange={(event) => {
        setText(event.target.value);
        const tokens = event.target.value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        lastEmitted.current = tokens.join(', ');
        onChange(tokens);
      }}
    />
  );
}
const display = (value: unknown, fallback = 'Not specified') =>
  value === undefined || value === null || value === ''
    ? fallback
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
const titles: Record<string, string> = {
  'scale.users_at_launch': 'Users at launch',
  'scale.users_12_months': 'Users after 12 months',
  'scale.data_volume_gb_12_months': 'Data after 12 months (GB)',
  'budget.monthly_infra_usd': 'Monthly infrastructure budget (USD)',
  'timeline.mvp_weeks': 'MVP delivery (weeks)',
  'team.has_devops': 'DevOps experience',
  'requirements.auth': 'Authentication',
  'requirements.ml_features': 'Machine learning',
  'requirements.p95_latency_ms': 'Target p95 latency (ms)',
  'requirements.availability': 'Availability target',
  'project.name': 'Project name',
};
export function App() {
  const [method, setMethod] = useState<Method>();
  const [samples, setSamples] = useState<Draft[]>([]);
  const [loadError, setLoadError] = useState('');
  const [items, setItems] = useState<unknown[]>([starter()]);
  const [active, setActive] = useState(0);
  const [sample, setSample] = useState('0');
  const [route, setRoute] = useState(location.pathname);
  const [importOpen, setImportOpen] = useState(false);
  const [text, setText] = useState('');
  const [pendingImport, setPendingImport] = useState(false);
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [revision, setRevision] = useState(0);
  const [run, setRun] = useState<{
    results: FinalRecommendation[];
    revision: number;
    inputs: unknown[];
  }>();
  const [selected, setSelected] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const previousRoute = useRef(route);
  const previousImport = useRef(false);
  const stale = Boolean(run && (run.revision !== revision || pendingImport));
  const raw = items[active];
  const draft =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Draft)
      : null;
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch('/api/methodology', { signal: controller.signal }).then(
        (response) => {
          if (!response.ok) throw new Error();
          return response.json();
        },
      ),
      fetch('/api/samples', { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      }),
    ])
      .then(([m, s]) => {
        setMethod(m);
        setSamples(s);
      })
      .catch((error) => {
        if (error.name !== 'AbortError')
          setLoadError(
            'The local API is unavailable. Start StackSense and reload this page.',
          );
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const handler = () => setRoute(location.pathname);
    addEventListener('popstate', handler);
    return () => removeEventListener('popstate', handler);
  }, []);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    addEventListener('beforeunload', handler);
    return () => removeEventListener('beforeunload', handler);
  }, [dirty]);
  useEffect(() => {
    if (message) errorRef.current?.focus();
  }, [message]);
  useEffect(() => {
    document.title = `${route === '/about' ? 'Methodology' : route === '/results' ? 'Results' : 'Workspace'} — StackSense`;
    if (previousRoute.current !== route) {
      const heading =
        (route === '/results'
          ? document.getElementById('validation-errors')
          : null) ?? document.querySelector<HTMLElement>('main h1');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
    previousRoute.current = route;
  }, [route]);
  useEffect(() => {
    if (importOpen) document.getElementById('json-editor')?.focus();
    else if (previousImport.current) importButtonRef.current?.focus();
    previousImport.current = importOpen;
  }, [importOpen]);
  function jumpToSection(key: string) {
    const section = document.getElementById(`section-${key}`);
    section?.scrollIntoView({ block: 'start' });
    section?.focus({ preventScroll: true });
  }
  function navigate(path: string) {
    history.pushState({}, '', path);
    setRoute(path);
    window.scrollTo({ top: 0 });
  }
  function edit(path: string, value: unknown) {
    if (!draft) return;
    setItems((current) =>
      current.map((item, index) =>
        index === active ? update(item as Draft, path, value) : item,
      ),
    );
    setRevision((value) => value + 1);
    setDirty(true);
    setMessage('');
  }
  function replace(next: unknown[]) {
    setItems(next);
    setActive(0);
    setRevision((value) => value + 1);
    setDirty(true);
    setPendingImport(false);
    setImportOpen(false);
    setMessage('');
    navigate('/');
  }
  function loadSample() {
    if (
      dirty &&
      !confirm('Replace the current inputs and unsaved edits with this sample?')
    )
      return;
    replace([structuredClone(samples[Number(sample)])]);
  }
  function importText() {
    try {
      replace(parseImport(text));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  async function fileInput(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage('JSON exceeds the 2 MiB limit.');
      return;
    }
    try {
      const content = new TextDecoder('utf-8', { fatal: true }).decode(
        await file.arrayBuffer(),
      );
      setText(content);
      setPendingImport(true);
    } catch {
      setMessage('The file must contain valid UTF-8 text.');
    }
  }
  async function evaluate() {
    if (running || pendingImport) return;
    setRunning(true);
    setMessage('');
    const captured = revision;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const batch = items.length > 1;
      const response = await fetch(
        batch ? '/api/recommend/batch' : '/api/recommend',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch ? items : items[0]),
          signal: controller.signal,
        },
      );
      const payload = await response.json();
      if (!response.ok && payload.error) throw new Error(payload.error.message);
      const results = batch && payload.results ? payload.results : [payload];
      setRun({ results, revision: captured, inputs: structuredClone(items) });
      setSelected(0);
      navigate('/results');
      setTimeout(() => {
        if (results[0]?.status === 'invalid_input')
          document.getElementById('validation-errors')?.focus();
        else resultRef.current?.focus();
      }, 0);
    } catch (error) {
      setMessage(
        (error as Error).name === 'AbortError'
          ? 'The request timed out. Your inputs are preserved; retry the evaluation.'
          : (error as Error).message || 'The local API could not be reached.',
      );
    } finally {
      clearTimeout(timeout);
      setRunning(false);
    }
  }
  function focusField(path: string) {
    navigate('/');
    setTimeout(() => {
      const id = path === '?' ? 'project.name' : path;
      const control =
        document.getElementById(id) ??
        document.getElementById(id.split('.')[0]) ??
        document.getElementById(`section-${id.split('.')[0]}`);
      control?.scrollIntoView({ block: 'center' });
      control?.focus();
    }, 0);
  }
  function field(path: string, node: Schema, required = false): ReactNode {
    if (
      [
        'extensions.primary_user_region',
        'extensions.vendor_lock_in_tolerance',
      ].includes(path)
    )
      return null;
    const value = read(draft, path);
    const fallback = node.default;
    const shown = value ?? fallback ?? '';
    const title = titles[path] ?? label(path.split('.').at(-1)!);
    const help = `${path}-help`;
    const inputId = path;
    const effective = node.anyOf?.find((item) => item.type !== 'null') ?? node;
    if (node.type === 'object')
      return (
        <div className="fields" key={path}>
          {Object.entries(node.properties ?? {}).map(([key, child]) =>
            field(`${path}.${key}`, child, node.required?.includes(key)),
          )}
        </div>
      );
    const hint =
      node.description ??
      (fallback !== undefined
        ? `If omitted: ${Array.isArray(fallback) ? fallback.join(', ') || 'none' : String(fallback)}.`
        : required
          ? 'Required.'
          : 'Optional. Leave blank if unknown.');
    let control: ReactNode;
    if (node.type === 'boolean')
      return (
        <label className="toggle" key={path}>
          <input
            id={inputId}
            type="checkbox"
            checked={Boolean(shown)}
            onChange={(event) => edit(path, event.target.checked)}
          />
          <span>{title}</span>
        </label>
      );
    if (node.type === 'array' && node.items?.enum) {
      const options = node.items.enum;
      const values = Array.isArray(shown) ? shown : [];
      return (
        <fieldset className="choices" key={path}>
          <legend>
            {title}
            {required ? ' *' : ''}
          </legend>
          {options.map((option) => (
            <label key={option}>
              <input
                id={`${inputId}.${option}`}
                type="checkbox"
                checked={values.includes(option)}
                onChange={(event) =>
                  edit(
                    path,
                    event.target.checked
                      ? [...values, option]
                      : values.filter((item: string) => item !== option),
                  )
                }
              />
              {label(option)}
            </label>
          ))}
          <small id={help}>{hint}</small>
        </fieldset>
      );
    }
    if (node.enum)
      control = (
        <select
          id={inputId}
          value={String(shown)}
          aria-describedby={help}
          onChange={(event) => edit(path, event.target.value || undefined)}
        >
          {((!required && fallback === undefined) ||
            (required && shown === '')) && (
            <option value="">Not specified</option>
          )}
          {!node.enum.includes(String(shown)) && shown !== '' && (
            <option value={String(shown)}>
              {String(shown)} (unrecognized)
            </option>
          )}
          {node.enum.map((option) => (
            <option value={option} key={option}>
              {path === 'requirements.availability'
                ? `${option}%`
                : label(option)}
            </option>
          ))}
        </select>
      );
    else if (node.type === 'array')
      control = (
        <ListInput
          key={path}
          id={inputId}
          value={shown}
          help={help}
          onChange={(value) => edit(path, value)}
        />
      );
    else if (path === 'project.description')
      control = (
        <textarea
          id={inputId}
          rows={4}
          value={String(shown)}
          aria-describedby={help}
          onChange={(event) => edit(path, event.target.value || undefined)}
        />
      );
    else
      control = (
        <input
          id={inputId}
          type={
            ['integer', 'number'].includes(effective.type ?? '')
              ? 'number'
              : 'text'
          }
          min={effective.minimum}
          max={effective.maximum}
          step={effective.type === 'integer' ? 1 : 'any'}
          value={String(shown)}
          aria-describedby={help}
          onChange={(event) =>
            edit(
              path,
              event.target.value === ''
                ? undefined
                : effective.type === 'integer' || effective.type === 'number'
                  ? Number(event.target.value)
                  : event.target.value,
            )
          }
        />
      );
    return (
      <div
        className={`field ${path === 'project.description' ? 'wide' : ''}`}
        key={path}
      >
        <label htmlFor={inputId}>
          {title}
          {required ? ' *' : ''}
        </label>
        {control}
        <small id={help}>{hint}</small>
      </div>
    );
  }
  const result = run?.results[selected];
  const sourceLinks = (component: Component) =>
    (component.source_ids as string[] | undefined)?.map((id) => {
      const register = component.service_id ? 'services' : 'core';
      const source = method?.sources.find(
        (item) => item.id === id && item.register === register,
      );
      return source ? (
        <a href={source.url} target="_blank" rel="noreferrer" key={id}>
          {source.title} ↗
        </a>
      ) : (
        <span key={id}>{id}</span>
      );
    });
  function card(component: Component, layer: string) {
    return (
      <article className="component" key={`${layer}-${component.choice}`}>
        <p className="eyebrow">{label(layer)}</p>
        <h3>{component.choice}</h3>
        <p>{component.justification}</p>
        <div className="chips">
          {component.driven_by.map((path) => (
            <button
              className="chip"
              key={path}
              onClick={() => {
                setActive(selected);
                focusField(path);
              }}
            >
              {path}
              <span>
                {JSON.stringify(read(run?.inputs[selected], path)) ??
                  'Default applied'}
              </span>
            </button>
          ))}
        </div>
        <details>
          <summary>Alternatives & trade-offs</summary>
          {component.alternatives.map((alternative, index) => (
            <p key={index}>
              <strong>{alternative.choice}</strong>
              <br />
              {alternative.why_not}
            </p>
          ))}
          <ul>
            {component.tradeoffs.map((tradeoff, index) => (
              <li key={index}>{tradeoff}</li>
            ))}
          </ul>
        </details>
        <details>
          <summary>Evidence sources</summary>
          <div className="sources">{sourceLinks(component)}</div>
        </details>
      </article>
    );
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to workspace
      </a>
      <header className="topbar">
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            navigate('/');
          }}
        >
          <Mark />
          StackSense<span className="brand-tag">WORKSPACE</span>
        </a>
        <nav aria-label="Main navigation">
          <button
            aria-current={route === '/' ? 'page' : undefined}
            onClick={() => navigate('/')}
          >
            Workspace
          </button>
          <button
            aria-current={route === '/results' ? 'page' : undefined}
            onClick={() => navigate('/results')}
          >
            Results
            {run && <span className="nav-count">{run.results.length}</span>}
          </button>
          <button
            aria-current={route === '/about' ? 'page' : undefined}
            onClick={() => navigate('/about')}
          >
            Methodology
          </button>
        </nav>
        <span className="local">
          <i />
          Local & private
        </span>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <p className="eyebrow">YOUR DECISION BRIEF</p>
          <nav aria-label="Input sections">
            {sections.map(([key, title], index) => (
              <button
                key={key}
                onClick={() => {
                  navigate('/');
                  setTimeout(() => jumpToSection(key), 0);
                }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {title}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <Mark />
            <strong>Reasoned, not guessed.</strong>
            <p>Local rules. Reviewed sources. Every choice explained.</p>
            <span>ENGINE {method?.engine_version ?? '…'}</span>
          </div>
        </aside>
        <main id="main" className="main" tabIndex={-1}>
          <div role="status" aria-live="polite" className="sr-only">
            {running
              ? 'Evaluating your project.'
              : stale
                ? 'Inputs changed. Previous results are stale.'
                : run
                  ? 'Evaluation completed.'
                  : ''}
          </div>
          {loadError && (
            <div className="alert critical" role="alert">
              {loadError}
            </div>
          )}
          {message && (
            <div
              className="alert critical"
              role="alert"
              tabIndex={-1}
              ref={errorRef}
            >
              {message}
            </div>
          )}
          {route === '/about' ? (
            <>
              <p className="eyebrow">HOW IT WORKS</p>
              <h1>Decisions you can inspect.</h1>
              <p className="lead">
                One shared engine, from your project brief to an explained
                stack.
              </p>
              <section className="panel prose">
                <h2>Constraints first. Preferences second.</h2>
                <ol>
                  <li>
                    Validate and normalize the standard scenario without
                    changing the original.
                  </li>
                  <li>
                    Find compatible core stacks and check required supporting
                    services and data flows.
                  </li>
                  <li>
                    Estimate complete plans, score stated preferences and use
                    stable tie-breaks.
                  </li>
                  <li>
                    Export the exact evaluated result, with warnings, evidence
                    and assumptions.
                  </li>
                </ol>
                {method?.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
                <p>
                  Your draft stays in memory. There is no account, analytics,
                  browser autosave or external recommendation request. Closing
                  or reloading the page discards the draft.
                </p>
                <dl className="facts">
                  <dt>Engine</dt>
                  <dd>{method?.engine_version}</dd>
                  <dt>Core catalog</dt>
                  <dd>{method?.catalog_version}</dd>
                  <dt>Service policies</dt>
                  <dd>{method?.services_version}</dd>
                </dl>
              </section>
              <section className="panel prose">
                <h2>Reviewed sources</h2>
                <p>
                  Review dates and scope are recorded in the repository. A
                  source documents a building block, not a certification of the
                  assembled application.
                </p>
                <div className="sources">
                  {method?.sources.map((source) => (
                    <a
                      key={`${source.register}-${source.id}`}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.title} ↗
                    </a>
                  ))}
                </div>
              </section>
            </>
          ) : route === '/results' ? (
            <>
              <div className="heading-row">
                <div>
                  <p className="eyebrow">DECISION REPORT</p>
                  <h1 ref={resultRef} tabIndex={-1}>
                    Your architecture, explained.
                  </h1>
                </div>
                <button
                  className="secondary"
                  onClick={() => {
                    setActive(selected);
                    navigate('/');
                  }}
                >
                  ← Edit inputs
                </button>
              </div>
              {!run ? (
                <section className="panel empty">
                  <Mark />
                  <h2>Your next decision starts here.</h2>
                  <p>
                    Describe a project or load a sample, then evaluate it to see
                    an actual recommendation.
                  </p>
                  <button className="primary" onClick={() => navigate('/')}>
                    Create a project brief →
                  </button>
                </section>
              ) : (
                <>
                  {stale && (
                    <div className="alert warning" role="status">
                      <strong>Inputs changed — this result is stale.</strong>
                      <p>
                        Rerun before exporting. The report below describes the
                        previous input snapshot.
                      </p>
                      <button
                        className="secondary"
                        disabled={running || pendingImport}
                        onClick={evaluate}
                      >
                        Rerun evaluation
                      </button>
                    </div>
                  )}
                  {run.results.length > 1 && (
                    <label className="batch-picker">
                      Scenario result
                      <select
                        value={selected}
                        onChange={(event) =>
                          setSelected(Number(event.target.value))
                        }
                      >
                        {run.results.map((item, index) => (
                          <option value={index} key={index}>
                            {item.scenario_id ?? `Scenario ${index + 1}`} ·{' '}
                            {label(item.status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {result && (
                    <>
                      <section className={`result-banner ${result.status}`}>
                        <div>
                          <span className="status-badge">
                            {label(result.status)}
                          </span>
                          <h2>
                            {result.stack
                              ? label(result.architecture_style)
                              : result.status === 'invalid_input'
                                ? 'Check the project brief'
                                : 'A reviewed complete plan is unavailable'}
                          </h2>
                          <p>{result.summary}</p>
                        </div>
                        <button
                          className="secondary"
                          disabled={stale || running}
                          onClick={() =>
                            download(
                              result,
                              safeName(result.scenario_id, selected),
                            )
                          }
                        >
                          Export JSON ↓
                        </button>
                      </section>
                      {run.results.length > 1 && (
                        <button
                          className="text-button"
                          disabled={stale || running}
                          onClick={() =>
                            download(
                              run.results,
                              'stacksense_batch_outputs.json',
                            )
                          }
                        >
                          Export all {run.results.length} results ↓
                        </button>
                      )}
                      {result.stack &&
                        result.warnings.some(
                          (w) => w.severity === 'critical',
                        ) && (
                          <div className="alert critical" role="alert">
                            <strong>
                              Provisional stack — critical constraints
                              unresolved.
                            </strong>{' '}
                            The features are proposed, but external residency or
                            contractual conditions named below are not verified.
                            Resolve these conditions before production.
                          </div>
                        )}
                      {result.validation_errors.length > 0 && (
                        <section
                          className="panel"
                          id="validation-errors"
                          tabIndex={-1}
                        >
                          <h2>Fields to review</h2>
                          <ul className="issues">
                            {result.validation_errors.map((error, index) => (
                              <li key={index}>
                                <button
                                  onClick={() => {
                                    setActive(selected);
                                    focusField(error.field);
                                  }}
                                >
                                  {error.field}
                                </button>
                                <span>{error.message}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                      {result.warnings.length > 0 && (
                        <section className="panel">
                          <div className="section-head">
                            <span className="section-number">!</span>
                            <div>
                              <h2>Review before you build</h2>
                              <p>
                                Risks and evidence gaps remain part of the
                                decision.
                              </p>
                            </div>
                          </div>
                          {['critical', 'warning', 'info'].map((severity) => (
                            <div key={severity}>
                              {result.warnings
                                .filter((w) => w.severity === severity)
                                .map((warning, index) => (
                                  <div
                                    className={`warning-row ${severity}`}
                                    key={index}
                                  >
                                    <strong>
                                      {label(warning.severity)} ·{' '}
                                      {label(warning.code)}
                                    </strong>
                                    <p>{warning.message}</p>
                                    <div className="chips">
                                      {warning.fields.map((path) => (
                                        <button
                                          className="chip"
                                          key={path}
                                          onClick={() => {
                                            setActive(selected);
                                            focusField(path);
                                          }}
                                        >
                                          {path}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ))}
                        </section>
                      )}
                      <DecisionLabPanel
                        key={`${run.revision}:${selected}`}
                        input={run.inputs[selected]}
                        result={result}
                        stale={stale}
                      />
                      {result.review_actions.length > 0 && (
                        <section
                          className="panel"
                          aria-labelledby="resolution-heading"
                        >
                          <h2 id="resolution-heading">
                            Critical conditions to resolve
                          </h2>
                          <p>
                            These tasks preserve your requirements. Completing a
                            checklist does not approve a deployment; reviewed
                            evidence and a new evaluation are required.
                          </p>
                          {result.review_actions.map((action) => (
                            <details key={action.id}>
                              <summary>
                                {action.affected_components.join(' / ')} ·{' '}
                                {label(action.kind)}
                              </summary>
                              <p>{action.next_action}</p>
                              <p>
                                <strong>Affected:</strong>{' '}
                                {action.affected_components.join(', ')}
                              </p>
                              <p>
                                <strong>Fields:</strong>{' '}
                                {action.fields.join(', ')}
                              </p>
                              <ul>
                                {action.evidence_required.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                              <div className="sources">
                                {action.references.map((source) => (
                                  <a
                                    key={source.id}
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {source.title} ↗
                                  </a>
                                ))}
                              </div>
                              <p className="muted">{action.resolution_gate}</p>
                            </details>
                          ))}
                        </section>
                      )}
                      {result.integration_reviews.length > 0 && (
                        <section
                          className="panel"
                          aria-labelledby="integration-heading"
                        >
                          <h2 id="integration-heading">
                            Existing-system integration review
                          </h2>
                          <p>
                            Reuse and migration need a separate decision from
                            the new application stack.
                          </p>
                          {result.integration_reviews.map(
                            (integration, index) => (
                              <details key={index}>
                                <summary>
                                  {integration.system} · Pending project
                                  evidence
                                </summary>
                                <p>{integration.protocol}</p>
                                <p>{integration.data_boundary}</p>
                                <ul>
                                  {integration.tasks.map((task) => (
                                    <li key={task}>{task}</li>
                                  ))}
                                </ul>
                                <p>{integration.cost_treatment}</p>
                                <div className="sources">
                                  {integration.references.map((source) => (
                                    <a
                                      key={source.id}
                                      href={source.url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {source.title} ↗
                                    </a>
                                  ))}
                                </div>
                              </details>
                            ),
                          )}
                        </section>
                      )}
                      {result.plan_comparison.length > 0 && (
                        <section
                          className="panel"
                          aria-labelledby="comparison-heading"
                        >
                          <h2 id="comparison-heading">
                            Compare complete plans
                          </h2>
                          <p>
                            Up to three compatible plans after service and
                            control checks. Scores are engineering preferences,
                            not confidence probabilities. Ties use cost upper
                            bound, operated components, fewer unrequested client
                            targets, then stable identifier.
                          </p>
                          {result.plan_comparison.map((plan) => (
                            <details key={plan.plan_id}>
                              <summary>
                                {plan.selected
                                  ? 'Selected'
                                  : plan.tied_on_score
                                    ? 'Equal-score alternative'
                                    : 'Alternative'}{' '}
                                · {plan.core.frontend} / {plan.core.backend} /{' '}
                                {plan.core.hosting} · {plan.score} points
                              </summary>
                              <dl>
                                <dt>Architecture</dt>
                                <dd>{label(plan.architecture_style)}</dd>
                                <dt>Database / hosting</dt>
                                <dd>
                                  {plan.core.database} / {plan.core.hosting}
                                </dd>
                                <dt>Regions</dt>
                                <dd>
                                  {plan.primary_region ??
                                    'Choose before provisioning'}{' '}
                                  /{' '}
                                  {plan.database_region ??
                                    'No fixed database region'}
                                </dd>
                                <dt>Monthly band</dt>
                                <dd>
                                  {money(plan.monthly_usd.min)} –{' '}
                                  {money(plan.monthly_usd.max)} ·{' '}
                                  {label(plan.budget_fit)}
                                </dd>
                                <dt>Score difference</dt>
                                <dd>{plan.score_delta}</dd>
                                <dt>Operated component units</dt>
                                <dd>{plan.operated_components} (heuristic)</dd>
                              </dl>
                              <p>
                                <strong>Supporting services:</strong>{' '}
                                {plan.supporting_services.join(', ') || 'None'}
                              </p>
                              <ul>
                                {plan.retained_constraints.map((constraint) => (
                                  <li key={constraint}>{constraint}</li>
                                ))}
                              </ul>
                              <p>
                                <strong>Review codes:</strong>{' '}
                                {plan.warning_codes.join(', ') ||
                                  'No additional service/control/budget notices'}
                                . Shared workload and sizing notices still
                                apply.
                              </p>
                              <ul>
                                {plan.cost_assumptions.map((assumption) => (
                                  <li key={assumption}>{assumption}</li>
                                ))}
                              </ul>
                            </details>
                          ))}
                        </section>
                      )}
                      {result.stack && (
                        <>
                          <div
                            className="topology"
                            aria-label="Architecture flow"
                          >
                            <span>
                              Client
                              <br />
                              <strong>{result.stack.frontend.choice}</strong>
                            </span>
                            <span aria-hidden="true">→</span>
                            <span>
                              Application
                              <br />
                              <strong>{result.stack.backend.choice}</strong>
                            </span>
                            <span aria-hidden="true">→</span>
                            <span>
                              Persistence
                              <br />
                              <strong>{result.stack.database.choice}</strong>
                            </span>
                          </div>
                          <h2 className="section-title">
                            The core stack <span>04 components</span>
                          </h2>
                          <div className="component-grid">
                            {(
                              [
                                'frontend',
                                'backend',
                                'database',
                                'hosting',
                              ] as const
                            ).map((layer) => card(result.stack![layer], layer))}
                          </div>
                          {Boolean(result.stack.supporting?.length) && (
                            <>
                              <h2 className="section-title">
                                Supporting services{' '}
                                <span>
                                  {result.stack.supporting!.length} selected
                                </span>
                              </h2>
                              <div className="component-grid">
                                {result.stack.supporting!.map((component) =>
                                  card(component, component.layer),
                                )}
                              </div>
                            </>
                          )}
                        </>
                      )}
                      <section className="panel cost">
                        <p className="eyebrow">
                          MONTHLY INFRASTRUCTURE · MONTH 12
                        </p>
                        <h2>
                          {result.estimate_status === 'not_estimated'
                            ? 'Not estimated'
                            : `${money(result.estimated_monthly_cost_usd.min)} – ${money(result.estimated_monthly_cost_usd.max)}`}
                          <span>
                            {result.estimate_status === 'estimated'
                              ? ' / month'
                              : ''}
                          </span>
                        </h2>
                        <p>
                          {result.estimate_status === 'not_estimated'
                            ? 'No usable stack was selected. The JSON 0–0 placeholder is not a free deployment.'
                            : 'Infrastructure and operations only. Payment and SMS activity scenarios below are additional and excluded from this headline and budget fit. Missing usage is assumed, not measured; labor, taxes, license entitlement and merchant-specific extras require separate quotes.'}
                        </p>
                        {result.estimate_status === 'estimated' &&
                          result.estimated_total_monthly_cost_usd && (
                            <div>
                              <h3>Including payment and SMS activity</h3>
                              <p>
                                <strong>
                                  {money(
                                    result.estimated_total_monthly_cost_usd.min,
                                  )}{' '}
                                  –{' '}
                                  {money(
                                    result.estimated_total_monthly_cost_usd.max,
                                  )}{' '}
                                  / month
                                </strong>
                              </p>
                              <p>
                                Additional activity volumes and fee rates are
                                scenarios, not measured bills. This total can
                                change with phone login or payments even when
                                infrastructure stays the same. Taxes, labor and
                                merchant-specific extras remain excluded.
                              </p>
                            </div>
                          )}
                        {result.cost_groups.length > 0 && (
                          <dl className="cost-groups">
                            {result.cost_groups.map((group) => (
                              <div key={group.category}>
                                <dt>{label(group.category)}</dt>
                                <dd>
                                  {money(group.min)} – {money(group.max)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        {result.cost_sensitivity.length > 0 && (
                          <details>
                            <summary>What changes the cost?</summary>
                            <p>
                              One usage input changes at a time while the
                              selected plan stays fixed. These experiments do
                              not rerank or replace your input. Supplying a
                              previously unknown volume also replaces its
                              uncertainty range. Unchanged totals can reflect
                              spare allocation headroom.
                            </p>
                            <div
                              className="table-scroll"
                              tabIndex={0}
                              role="region"
                              aria-label="Usage sensitivity table, scroll horizontally for all columns"
                            >
                              <table className="sensitivity-table">
                                <caption>
                                  Usage sensitivity on the selected plan
                                </caption>
                                <thead>
                                  <tr>
                                    <th>Usage input / baseline</th>
                                    <th>Trial value</th>
                                    <th>Monthly band</th>
                                    <th>Upper change</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.cost_sensitivity.flatMap((item) =>
                                    item.samples.map((sample, index) => (
                                      <tr key={`${item.field}-${index}`}>
                                        <th scope="row">
                                          {label(
                                            item.field.replace(
                                              'extensions.',
                                              '',
                                            ),
                                          )}
                                          <small>
                                            {quantity(item.baseline_value)} ·{' '}
                                            {item.baseline_origin}
                                            <br />
                                            {label(item.cost_category)}
                                          </small>
                                        </th>
                                        <td>{quantity(sample.value)}</td>
                                        <td>
                                          {sample.status === 'estimated'
                                            ? `${money(sample.min!)} – ${money(sample.max!)}`
                                            : 'Outside pricing model'}
                                        </td>
                                        <td>
                                          {sample.upper_delta_usd === null
                                            ? 'Not estimated'
                                            : money(sample.upper_delta_usd)}
                                        </td>
                                      </tr>
                                    )),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        )}
                        {result.cost_breakdown.length > 0 && (
                          <div className="table-scroll">
                            <table>
                              <caption>
                                Resource cost breakdown in USD per month
                              </caption>
                              <thead>
                                <tr>
                                  <th>Resource</th>
                                  <th>Lower</th>
                                  <th>Upper</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.cost_breakdown.map((line) => (
                                  <tr key={line.id}>
                                    <th scope="row">
                                      {label(line.id.replace(/-/g, ' '))}
                                      <small>{line.basis}</small>
                                      <small>
                                        {line.quantity.min}–{line.quantity.max}{' '}
                                        units × USD {line.unit_rate_usd.min}–
                                        {line.unit_rate_usd.max} per unit
                                      </small>
                                      <div className="sources">
                                        {line.source_ids.map((id) => {
                                          const source =
                                            method?.sources.find(
                                              (item) =>
                                                item.id === id &&
                                                item.register === 'services',
                                            ) ??
                                            method?.sources.find(
                                              (item) =>
                                                item.id === id &&
                                                item.register === 'core',
                                            );
                                          return source ? (
                                            <a
                                              href={source.url}
                                              key={id}
                                              target="_blank"
                                              rel="noreferrer"
                                            >
                                              {source.title} ↗
                                            </a>
                                          ) : (
                                            <span key={id}>{id}</span>
                                          );
                                        })}
                                      </div>
                                    </th>
                                    <td>{money(line.monthly_usd.min)}</td>
                                    <td>{money(line.monthly_usd.max)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <details>
                          <summary>Cost assumptions</summary>
                          <ul>
                            {result.estimated_monthly_cost_usd.assumptions.map(
                              (item, index) => (
                                <li key={index}>{item}</li>
                              ),
                            )}
                          </ul>
                        </details>
                      </section>
                      <BudgetPlanning result={result} />
                      <section className="panel">
                        <h2>Assumptions & provenance</h2>
                        <ul>
                          {result.assumptions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                        <p className="muted">
                          Engine {result.engine_version} · Catalog{' '}
                          {result.catalog_version} · Services{' '}
                          {result.services_version}
                        </p>
                        <details>
                          <summary>Control designs & data flows</summary>
                          <pre>
                            {JSON.stringify(
                              {
                                controls: result.control_plan,
                                data_flows: result.data_flows,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </details>
                        <details>
                          <summary>Decision trace</summary>
                          <pre>
                            {JSON.stringify(result.decision_trace, null, 2)}
                          </pre>
                        </details>
                      </section>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div className="heading-row">
                <div>
                  <p className="eyebrow">FROM PROJECT BRIEF TO BUILD PLAN</p>
                  <h1>
                    Choose your stack.
                    <br />
                    <span>Know the trade-offs.</span>
                  </h1>
                  <p className="lead">
                    Tell us what you’re building. Get a stack shaped by your
                    constraints,
                    <br className="desktop-break" /> with the reasoning, costs
                    and evidence to back it up.
                  </p>
                </div>
                <span className="edition">
                  LOCAL ENGINE
                  <br />
                  <strong>01 — 04</strong>
                  <br />
                  DESIGNED TO EXPLAIN
                </span>
              </div>
              <section className="toolbar" aria-label="Project actions">
                <button
                  className="secondary"
                  disabled={running}
                  onClick={() => {
                    if (
                      !dirty ||
                      confirm('Discard the current project inputs?')
                    )
                      replace([starter()]);
                  }}
                >
                  + New project
                </button>
                <button
                  className="secondary"
                  disabled={running}
                  ref={importButtonRef}
                  aria-controls="import-panel"
                  aria-expanded={importOpen}
                  onClick={() => setImportOpen(!importOpen)}
                >
                  ↥ Import / edit JSON
                </button>
                <div className="sample-actions">
                  <label className="sr-only" htmlFor="sample">
                    Public sample
                  </label>
                  <select
                    id="sample"
                    value={sample}
                    onChange={(event) => setSample(event.target.value)}
                  >
                    {samples.map((item, index) => (
                      <option key={index} value={index}>
                        {item.scenario_id} · {item.project.name}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={running || !samples.length}
                    onClick={loadSample}
                  >
                    Load sample
                  </button>
                </div>
              </section>
              {importOpen && (
                <section id="import-panel" className="panel import-panel">
                  <h2>Import a project brief</h2>
                  <p>
                    One scenario or an array of 1–100. Up to 2 MiB. Applying
                    replaces the current inputs; unknown fields are preserved.
                  </p>
                  <label htmlFor="json-file">Choose a JSON file</label>
                  <input
                    id="json-file"
                    type="file"
                    accept="application/json,.json"
                    disabled={running}
                    onChange={(event) =>
                      void fileInput(event.target.files?.[0])
                    }
                  />
                  <label htmlFor="json-editor">Paste or edit JSON</label>
                  <textarea
                    id="json-editor"
                    rows={10}
                    spellCheck={false}
                    value={text}
                    disabled={running}
                    onChange={(event) => {
                      setText(event.target.value);
                      setPendingImport(true);
                      setDirty(true);
                    }}
                  />
                  <div className="button-row">
                    <button
                      className="primary"
                      disabled={running || !text.trim()}
                      onClick={importText}
                    >
                      Replace inputs with this JSON
                    </button>
                    <button
                      className="secondary"
                      disabled={running}
                      onClick={() => {
                        setText(
                          JSON.stringify(
                            items.length > 1 ? items : items[0],
                            null,
                            2,
                          ),
                        );
                        setPendingImport(false);
                      }}
                    >
                      Copy current inputs into editor
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        setPendingImport(false);
                        setImportOpen(false);
                      }}
                    >
                      Cancel import
                    </button>
                  </div>
                  {pendingImport && (
                    <p className="muted">
                      Unapplied JSON edits: apply or cancel before evaluating or
                      exporting.
                    </p>
                  )}
                </section>
              )}
              {items.length > 1 && (
                <label className="batch-picker">
                  Editing scenario
                  <select
                    value={active}
                    disabled={running}
                    onChange={(event) => setActive(Number(event.target.value))}
                  >
                    {items.map((item: any, index) => (
                      <option key={index} value={index}>
                        {display(item?.scenario_id, `Scenario ${index + 1}`)}
                      </option>
                    ))}
                  </select>
                  <span>{items.length} scenarios will run together.</span>
                </label>
              )}
              <label className="mobile-sections">
                Jump to section
                <select
                  defaultValue="project"
                  onChange={(event) =>
                    document
                      .getElementById(`section-${event.target.value}`)
                      ?.scrollIntoView({ block: 'start' })
                  }
                >
                  {sections.map(([id, title]) => (
                    <option value={id} key={id}>
                      {title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="work-grid">
                <div className="form-stack">
                  {!draft ? (
                    <section className="panel">
                      <h2>This item is not a scenario object.</h2>
                      <p>
                        Use the JSON editor to correct it, or run the batch to
                        see its field errors alongside the other results.
                      </p>
                    </section>
                  ) : (
                    method && (
                      <fieldset className="form-body" disabled={running}>
                        {sections.map(([key, title], index) => {
                          const node = method.schema.properties?.[key];
                          return node ? (
                            <section
                              className="panel form-section"
                              id={`section-${key}`}
                              key={key}
                              tabIndex={-1}
                            >
                              <div className="section-head">
                                <span className="section-number">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <div>
                                  <h2>{title}</h2>
                                  <p>
                                    {helpful[key] ??
                                      'Start with the shape of your project. Required fields are marked *.'}
                                  </p>
                                </div>
                              </div>
                              {key === 'project' &&
                                method.schema.properties?.scenario_id &&
                                field(
                                  'scenario_id',
                                  method.schema.properties.scenario_id,
                                )}
                              {field(
                                key,
                                node,
                                method.schema.required?.includes(key),
                              )}
                            </section>
                          ) : null;
                        })}
                      </fieldset>
                    )
                  )}
                </div>
                <aside className="review">
                  <section className="brief">
                    <div className="brief-label">
                      <span className="status-dot" />
                      YOUR BRIEF
                    </div>
                    <h2>{display(draft?.project?.name, 'Untitled project')}</h2>
                    <p>
                      {label(
                        display(
                          draft?.project?.type,
                          'Project type unspecified',
                        ),
                      )}
                    </p>
                    <dl>
                      <dt>Platforms</dt>
                      <dd>
                        {Array.isArray(draft?.project?.platforms)
                          ? draft.project.platforms
                              .map((value: unknown) => display(value))
                              .join(', ')
                          : 'Not specified'}
                      </dd>
                      <dt>Year-one users</dt>
                      <dd>{display(draft?.scale?.users_12_months)}</dd>
                      <dt>Monthly budget</dt>
                      <dd>
                        {typeof draft?.budget?.monthly_infra_usd === 'number'
                          ? money(draft.budget.monthly_infra_usd)
                          : 'Not specified'}
                      </dd>
                      <dt>MVP timeline</dt>
                      <dd>{display(draft?.timeline?.mvp_weeks, '—')} weeks</dd>
                    </dl>
                    <button
                      className="primary"
                      disabled={running || !method || pendingImport}
                      onClick={evaluate}
                    >
                      {running
                        ? 'Evaluating…'
                        : items.length > 1
                          ? `Evaluate ${items.length} scenarios →`
                          : 'Recommend stack →'}
                    </button>
                    <p className="brief-foot">
                      Constraints checked first.
                      <br />
                      No account or API key needed.
                    </p>
                  </section>
                  <section className="review-note">
                    <strong>What you’ll get</strong>
                    <ul>
                      <li>Four core technology choices</li>
                      <li>Required supporting services</li>
                      <li>Costs, alternatives & trade-offs</li>
                      <li>Warnings and source evidence</li>
                    </ul>
                    <p>
                      Blank optional fields use recorded defaults. No silent
                      change to hard constraints.
                    </p>
                  </section>
                </aside>
              </div>
              <div className="bottom-action">
                <p>Ready for a reasoned recommendation?</p>
                <button
                  className="primary"
                  disabled={running || !method || pendingImport}
                  onClick={evaluate}
                >
                  {running
                    ? 'Evaluating…'
                    : items.length > 1
                      ? 'Evaluate all scenarios →'
                      : 'Recommend stack →'}
                </button>
              </div>
            </>
          )}
          <footer>
            StackSense{' '}
            <span>
              Built for considered decisions. Every recommendation is a starting
              point for review.
            </span>
            <span>No runtime LLM · No external requests</span>
          </footer>
        </main>
      </div>
    </>
  );
}
const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
