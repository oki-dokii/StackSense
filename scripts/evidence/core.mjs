import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Ajv } from 'ajv';
export const root = fileURLToPath(new URL('../../', import.meta.url));
export const sha = (value) => createHash('sha256').update(value).digest('hex');
export const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
export function day(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw Error(`Invalid calendar date: ${value}`);
  return Date.parse(`${value}T00:00:00Z`);
}
export async function json(file) {
  const info = await stat(file);
  if (!info.isFile() || info.size > 2 * 1024 * 1024)
    throw Error('JSON input must be a file no larger than 2 MiB');
  const bytes = await readFile(file);
  if (bytes.length > 2 * 1024 * 1024)
    throw Error('JSON input grew beyond 2 MiB');
  const value = JSON.parse(bytes.toString('utf8'));
  function depth(v, n = 0) {
    if (n > 40) throw Error('JSON nesting exceeds 40');
    if (v && typeof v === 'object')
      for (const x of Object.values(v)) depth(x, n + 1);
  }
  depth(value);
  return value;
}
const pointer = (key) =>
  String(key).replaceAll('~', '~0').replaceAll('/', '~1');
export function references(value) {
  const result = [];
  function visit(node, location = '', owner = null) {
    if (!node || typeof node !== 'object') return;
    const current =
      !Array.isArray(node) && typeof node.id === 'string' ? node.id : owner;
    if (Array.isArray(node.source_ids))
      for (const id of node.source_ids)
        result.push({ id, path: `${location}/source_ids`, owner: current });
    for (const [key, child] of Object.entries(node))
      if (key !== 'sources' && key !== 'source_ids')
        visit(child, `${location}/${pointer(key)}`, current);
  }
  visit(value);
  return result;
}
export async function loadBundle(directory) {
  const bundle = {};
  const ajv = new Ajv({ allErrors: true, strict: false });
  for (const [name, schema] of [
    ['core', 'catalog'],
    ['services', 'services'],
  ]) {
    const value = await json(path.join(directory, `${schema}.json`));
    const validate = ajv.compile(
      await json(path.join(root, 'schemas', `${schema}.schema.json`)),
    );
    if (!validate(value))
      throw Error(
        `Invalid ${name} catalog: ${ajv.errorsText(validate.errors)}`,
      );
    day(value.reviewed_on);
    const ids = new Set();
    for (const source of value.sources) {
      if (ids.has(source.id))
        throw Error(`Duplicate source ${name}:${source.id}`);
      ids.add(source.id);
      day(source.checked_on);
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password)
        throw Error(`Invalid HTTPS source ${source.id}`);
    }
    for (const ref of references(value))
      if (!ids.has(ref.id)) throw Error(`Unknown source ${name}:${ref.id}`);
    bundle[name] = value;
  }
  return bundle;
}
export function categories(paths) {
  const result = new Set();
  for (const location of paths) {
    if (/^\/pricing\//.test(location)) result.add('pricing');
    else if (/^\/lifecycle\//.test(location)) result.add('lifecycle');
    else if (
      /^\/frameworks\//.test(location) ||
      /\/(regions|controls|control_support|data_flows|residency|managed_databases)\//.test(
        location,
      )
    )
      result.add('region_or_controls');
    else result.add('capability');
  }
  return [...(result.size ? result : new Set(['capability']))].sort();
}
function mentions(output, source) {
  if (references(output).some((ref) => ref.id === source.id)) return true;
  function visit(node) {
    if (!node || typeof node !== 'object') return false;
    if (node.id === source.id && node.url === source.url) return true;
    return Object.values(node).some(visit);
  }
  return visit(output);
}
export function audit(bundle, asOf, policy, outputs = []) {
  const now = day(asOf);
  for (const name of [
    'pricing',
    'region_or_controls',
    'lifecycle',
    'capability',
  ])
    if (
      !Number.isInteger(policy.cadence_days?.[name]) ||
      policy.cadence_days[name] < 1 ||
      policy.cadence_days[name] > 365
    )
      throw Error('Invalid review cadence');
  const registered = new Set(
    Object.entries(bundle).flatMap(([ns, c]) =>
      c.sources.map((s) => `${ns}:${s.id}`),
    ),
  );
  for (const key of Object.keys(policy.source_categories ?? {}))
    if (!registered.has(key)) throw Error(`Unknown policy source ${key}`);
  const rows = [];
  for (const [namespace, catalog] of Object.entries(bundle)) {
    const refs = references(catalog);
    for (const source of catalog.sources) {
      const uses = refs.filter((ref) => ref.id === source.id);
      const overrides =
        policy.source_categories?.[`${namespace}:${source.id}`] ?? [];
      if (
        !Array.isArray(overrides) ||
        !overrides.every((k) => Object.hasOwn(policy.cadence_days, k))
      )
        throw Error('Invalid source category override');
      const kinds = [
        ...new Set([...categories(uses.map((ref) => ref.path)), ...overrides]),
      ].sort();
      const cadence = Math.min(
        ...kinds.map((kind) => policy.cadence_days[kind]),
      );
      const age = (now - day(source.checked_on)) / 86400000;
      const status =
        age < 0
          ? 'future_review_date'
          : age >= cadence
            ? 'review_due'
            : 'within_review_window';
      rows.push({
        key: `${namespace}:${source.id}`,
        ...source,
        categories: kinds,
        cadence_days: cadence,
        age_days: age,
        review_due_on: new Date(day(source.checked_on) + cadence * 86400000)
          .toISOString()
          .slice(0, 10),
        status,
        no_structured_catalog_reference: !uses.length,
        catalog_references: uses,
        public_output_mentions: outputs
          .filter((output) => mentions(output, source))
          .map((output) => output.scenario_id)
          .sort(),
      });
    }
  }
  rows.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return {
    schema_version: '0.1.0',
    as_of: asOf,
    policy,
    policy_sha256: sha(canonical(policy)),
    catalogs: Object.fromEntries(
      Object.entries(bundle).map(([key, value]) => [
        key,
        { version: value.version, sha256: sha(canonical(value)) },
      ]),
    ),
    counts: {
      sources: rows.length,
      review_due: rows.filter((r) => r.status === 'review_due').length,
      future_review_dates: rows.filter((r) => r.status === 'future_review_date')
        .length,
      no_structured_catalog_reference: rows.filter(
        (r) => r.no_structured_catalog_reference,
      ).length,
    },
    sources: rows,
    scope:
      'Offline reminders based on recorded checked_on dates and declared policy. Not live verification, certification or proof of unchanged claims. Output mentions include alternatives and review tasks; shared source IDs across namespaces conservatively match both. No engine or source dates are changed.',
  };
}
export function changes(before, after, location = '') {
  if (canonical(before) === canonical(after)) return [];
  if (
    before &&
    after &&
    typeof before === 'object' &&
    typeof after === 'object' &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  ) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .sort()
      .flatMap((key) =>
        changes(before[key], after[key], `${location}/${pointer(key)}`),
      );
  }
  if (
    Array.isArray(before) &&
    Array.isArray(after) &&
    before.every((v) => v && typeof v === 'object') &&
    after.every((v) => v && typeof v === 'object') &&
    before.length === after.length
  )
    return before.flatMap((v, i) => changes(v, after[i], `${location}/${i}`));
  return [
    {
      path: location || '/',
      kind:
        before === undefined
          ? 'added'
          : after === undefined
            ? 'removed'
            : 'changed',
      before: before ?? null,
      after: after ?? null,
    },
  ];
}
function sourceIdsAt(document, location) {
  const ids = new Set();
  let node = document;
  for (const segment of location.split('/').slice(1)) {
    if (!node || typeof node !== 'object') break;
    if (Array.isArray(node.source_ids))
      for (const id of node.source_ids) ids.add(id);
    node = node[segment.replaceAll('~1', '/').replaceAll('~0', '~')];
  }
  if (node && typeof node === 'object') {
    for (const ref of references(node)) ids.add(ref.id);
    if (Array.isArray(node.source_ids))
      for (const id of node.source_ids) ids.add(id);
  }
  const match = location.match(/^\/sources\/(\d+)/);
  if (match && document.sources[Number(match[1])])
    ids.add(document.sources[Number(match[1])].id);
  return [...ids].sort();
}
export function proposal(before, after, asOf, policy) {
  day(asOf);
  const all = Object.keys(before)
    .sort()
    .flatMap((namespace) =>
      changes(before[namespace], after[namespace]).map((change) => ({
        namespace,
        ...change,
        source_keys: [
          ...new Set([
            ...sourceIdsAt(before[namespace], change.path),
            ...sourceIdsAt(after[namespace], change.path),
          ]),
        ].map((id) => `${namespace}:${id}`),
      })),
    );
  if (all.length > 10000) throw Error('Proposal exceeds 10000 changes');
  return {
    schema_version: '0.1.0',
    created_on: asOf,
    status: 'pending_human_review',
    before_sha256: sha(canonical(before)),
    candidate_sha256: sha(canonical(after)),
    policy_sha256: sha(canonical(policy)),
    changes: all,
    review: {
      reviewer: null,
      reviewed_on: null,
      decision: 'pending',
      notes: null,
      supporting_references: [],
      checklist: [
        'Confirm changed claim scope, units, regions, dates and source authority',
        'Distinguish authored assumptions from provider facts',
        'Review compatibility and control implications',
        'Run scenario regressions and review changes',
        'Version accepted catalogs and refresh release evidence',
      ],
    },
    scope:
      'Structural catalog diff; array reordering may produce noise. Source keys are conservative ancestor/subtree references; empty keys require manual attribution. This proposal neither authenticates a reviewer nor applies, accepts or executes any candidate.',
  };
}
export async function capture(bundle, keys, fetcher = fetch) {
  if (
    !Array.isArray(keys) ||
    keys.length < 1 ||
    keys.length > 3 ||
    new Set(keys).size !== keys.length
  )
    throw Error('Capture requires 1–3 unique registered source keys');
  const registry = new Map(
    Object.entries(bundle).flatMap(([ns, c]) =>
      c.sources.map((s) => [`${ns}:${s.id}`, s]),
    ),
  );
  for (const key of keys)
    if (!registry.has(key)) throw Error(`Unknown registered source ${key}`);
  const snapshots = [];
  for (const key of keys) {
    const source = registry.get(key);
    let record = {
      key,
      url: source.url,
      observed_at: new Date().toISOString(),
      status: null,
      response_sha256: null,
      bytes: 0,
      content_type: null,
      etag: null,
      last_modified: null,
      retrieval: 'failed',
      error: null,
    };
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password)
        throw Error('HTTPS registry URL required');
      const response = await fetcher(source.url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
        headers: {
          'user-agent': 'StackSense-Evidence-Review/0.1',
          'accept-encoding': 'identity',
        },
      });
      record.status = response.status;
      if (response.status !== 200) {
        await response.body?.cancel();
        throw Error(
          `HTTP ${response.status}; redirects and conditional responses are not followed`,
        );
      }
      if (!response.body) throw Error('Missing response body');
      const hash = createHash('sha256');
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          record.bytes += value.byteLength;
          if (record.bytes > 2 * 1024 * 1024)
            throw Error('Response exceeds 2 MiB');
          hash.update(value);
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
      record = {
        ...record,
        response_sha256: hash.digest('hex'),
        content_type:
          response.headers.get('content-type')?.slice(0, 256) ?? null,
        etag: response.headers.get('etag')?.slice(0, 256) ?? null,
        last_modified:
          response.headers.get('last-modified')?.slice(0, 256) ?? null,
        retrieval: 'retrieved_unreviewed',
      };
    } catch (e) {
      record.error = String(e.message).slice(0, 300);
    }
    snapshots.push(record);
  }
  return {
    schema_version: '0.1.0',
    status: 'unreviewed_observations',
    registry_sha256: sha(canonical(bundle)),
    snapshots,
    scope:
      'Only response metadata and byte digests retained. Changed bytes do not establish changed facts; identical bytes do not establish claim validity. No checked_on date, catalog, control or pricing rule is changed.',
  };
}
export function compareCaptures(before, after) {
  for (const value of [before, after]) {
    if (
      !Array.isArray(value?.snapshots) ||
      value.snapshots.length > 3 ||
      new Set(value.snapshots.map((s) => s.key)).size !== value.snapshots.length
    )
      throw Error('Invalid capture bundle');
    for (const s of value.snapshots)
      if (
        typeof s.key !== 'string' ||
        typeof s.url !== 'string' ||
        !['failed', 'retrieved_unreviewed'].includes(s.retrieval) ||
        (s.retrieval === 'retrieved_unreviewed' &&
          (s.status !== 200 ||
            !/^[0-9a-f]{64}$/.test(s.response_sha256) ||
            !Number.isInteger(s.bytes) ||
            s.bytes < 0 ||
            s.bytes > 2 * 1024 * 1024))
      )
        throw Error('Invalid snapshot record');
  }
  const old = new Map(before.snapshots.map((s) => [s.key, s]));
  const current = new Map(after.snapshots.map((s) => [s.key, s]));
  return {
    schema_version: '0.1.0',
    status: 'pending_human_review',
    before_sha256: sha(canonical(before)),
    after_sha256: sha(canonical(after)),
    changes: [...new Set([...old.keys(), ...current.keys()])]
      .sort()
      .map((key) => {
        const a = old.get(key),
          b = current.get(key);
        return {
          key,
          state: !b
            ? 'missing_observation'
            : b.retrieval === 'failed'
              ? 'retrieval_failed'
              : !a
                ? 'first_observation'
                : a.url !== b.url
                  ? 'registered_url_changed'
                  : a.retrieval === 'failed'
                    ? 'first_successful_observation'
                    : a.response_sha256 !== b.response_sha256
                      ? 'representation_changed'
                      : 'representation_unchanged',
          before: a ?? null,
          after: b ?? null,
        };
      }),
    scope:
      'Representation digest comparison only. Dynamic markup can cause changes without fact changes. No semantic approval, catalog update or freshness reset.',
  };
}
export function markdown(report) {
  const escape = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('|', '&#124;')
      .replaceAll('`', '&#96;')
      .replaceAll('[', '&#91;')
      .replaceAll(']', '&#93;')
      .replace(/[\r\n]/g, ' ');
  let text = '# Evidence review\n\n';
  if (report.sources) {
    text += `As of ${escape(report.as_of)}: ${report.counts.sources} sources; ${report.counts.review_due} due; ${report.counts.future_review_dates} future review dates.\n\n| Source | Last review | Due | Status | Categories | Output mentions |\n|---|---|---|---|---|---|\n`;
    for (const s of report.sources)
      text += `| ${escape(s.key)} | ${escape(s.checked_on)} | ${escape(s.review_due_on)} | ${escape(s.status)} | ${escape(s.categories.join(', '))} | ${escape(s.public_output_mentions.join(', '))} |\n`;
  } else if (report.changes) {
    text += `Status: ${escape(report.status)}. ${report.changes.length} structural/representation entries.\n\n`;
    for (const c of report.changes)
      text += `- ${escape(c.namespace ?? '')} ${escape(c.path ?? c.key)}: ${escape(c.kind ?? c.state)}${c.source_keys ? '; sources: ' + escape(c.source_keys.join(', ')) : ''}\n`;
  } else
    text += `Status: ${escape(report.status)}; ${report.snapshots.length} observations. See JSON for response metadata.\n`;
  return text + '\n' + escape(report.scope) + '\n';
}
