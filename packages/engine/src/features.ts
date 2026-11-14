import type { NormalizedScenario, Warning } from '../../contracts/src/index.js';
import type { Feature, Features } from './types.js';

function positiveHint(text: string, pattern: RegExp): string | undefined {
  const regex = new RegExp(pattern.source, 'gi');
  for (const match of text.matchAll(regex)) {
    const prefix =
      text
        .slice(Math.max(0, match.index! - 45), match.index)
        .split(/\bbut\b|[.;!?]/i)
        .at(-1) ?? '';
    if (!/\b(?:no|not|without)\s+(?:[a-z-]+\s+){0,3}$/i.test(prefix))
      return match[0];
  }
  return undefined;
}
export function deriveFeatures(scenario: NormalizedScenario): Features {
  const requirements = scenario.requirements;
  const text = scenario.project.description;
  const assumptions: string[] = [];
  const warnings: Warning[] = [];
  const evidence: Feature[] = [];
  const ledgerPhrase = positiveHint(
    text,
    /\bdouble[- ]entry(?:\s+ledger)?\b|\bledger\b/,
  );
  const collaborationPhrase = positiveHint(
    text,
    /\blive\s+cursors\b|\bwhiteboard\b|\bcollaborative\s+editing\b/,
  );
  const memoryPhrase = positiveHint(
    text,
    /\b(?:1|2)\s*(?:gb|gib)\s*ram\b|\blow[- ]end\s+(?:android\s+)?phones?\b/,
  );
  const markdownPhrase = positiveHint(text, /\bmarkdown\b/);
  const markdown = Boolean(markdownPhrase);
  const ledger = Boolean(ledgerPhrase);
  const collaborative =
    requirements.realtime &&
    Boolean(collaborationPhrase || scenario.project.type === 'realtime_collab');
  const lowMemory = Boolean(memoryPhrase);
  for (const [id, phrase, value] of [
    ['ledger', ledgerPhrase, ledger],
    ['markdown', markdownPhrase, markdown],
    ['collaboration_hint', collaborationPhrase, collaborative],
    ['low_memory', memoryPhrase, lowMemory],
  ] as const) {
    if (!phrase) continue;
    assumptions.push(
      `Interpreted project.description phrase ${JSON.stringify(phrase)} as ${id}; this bounded hint does not infer legal or regional requirements.`,
    );
    evidence.push({
      id,
      value,
      rule_id: `DESC_${id.toUpperCase()}`,
      driven_by: ['project.description'],
      reason: `Description contains ${JSON.stringify(phrase)}.`,
    });
  }
  if (collaborationPhrase && !requirements.realtime)
    warnings.push({
      code: 'DESCRIPTION_CONFLICT',
      severity: 'warning',
      message:
        'Description suggests collaborative editing, but structured requirements.realtime=false takes precedence.',
      fields: ['project.description', 'requirements.realtime'],
    });
  const dynamic =
    requirements.realtime ||
    requirements.payments ||
    requirements.file_media_storage ||
    requirements.full_text_search ||
    requirements.multi_tenant ||
    requirements.auth !== 'none' ||
    requirements.ml_features !== 'none' ||
    ledger;
  const staticEligible =
    scenario.project.type === 'content_site' &&
    scenario.project.platforms.every((platform) => platform === 'web') &&
    !dynamic;
  const stateful = [
    'web_app',
    'saas_b2b',
    'ecommerce',
    'marketplace',
    'social',
    'realtime_collab',
    'fintech',
    'healthtech',
    'internal_tool',
    'gaming',
    'iot',
  ].includes(scenario.project.type);
  const databaseRequired =
    !staticEligible &&
    (stateful ||
      requirements.auth !== 'none' ||
      requirements.payments ||
      requirements.file_media_storage ||
      requirements.full_text_search ||
      requirements.multi_tenant ||
      requirements.offline_support ||
      requirements.realtime ||
      ledger);
  evidence.push({
    id: 'static_eligible',
    value: staticEligible,
    rule_id: 'ARCH_STATIC_CONTENT',
    driven_by: [
      'project.type',
      'project.platforms',
      'requirements.realtime',
      'requirements.payments',
      'requirements.auth',
      'requirements.file_media_storage',
      'requirements.full_text_search',
      'requirements.multi_tenant',
      'requirements.ml_features',
    ],
    reason: staticEligible
      ? 'Content-only web project with no structured server-side feature requirement.'
      : 'Client/API or dynamic requirements require an application backend in this catalog.',
  });
  evidence.push({
    id: 'database_required',
    value: databaseRequired,
    rule_id: 'DOMAIN_PERSISTENCE',
    driven_by: [
      'project.type',
      'requirements.auth',
      'requirements.payments',
      'requirements.offline_support',
      'requirements.file_media_storage',
      'requirements.full_text_search',
      'requirements.multi_tenant',
      'requirements.realtime',
      ...(ledger ? ['project.description'] : []),
    ],
    reason: databaseRequired
      ? 'Domain/features imply persistent application data; storage semantics still need review.'
      : 'No server-side persistence requirement inferred; a stateless API or static site can omit a database.',
  });
  if (stateful && !staticEligible)
    assumptions.push(
      `Persistent application data is inferred from project.type=${scenario.project.type}; domain data modeling remains required.`,
    );
  return {
    staticEligible,
    databaseRequired,
    ledger,
    markdown,
    collaborative,
    lowMemory,
    evidence,
    assumptions,
    warnings,
  };
}
