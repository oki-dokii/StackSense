#!/usr/bin/env python3
"""Check documentation links, JSON integrity, public splits and optional schemas.

This is documentation/contract verification, not a recommendation engine test.
"""
from pathlib import Path
import argparse
import copy
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--schemas', action='store_true', help='requires jsonschema >=4')
    args = parser.parse_args()
    problems = []
    files = list(ROOT.rglob('*.md'))
    for path in files:
        if '.venv' in path.parts or 'node_modules' in path.parts:
            continue
        text = path.read_text(encoding='utf-8')
        if text.count('```') % 2:
            problems.append(f'{path.relative_to(ROOT)}: unbalanced fenced code block')
        for target in re.findall(r'(?<!!)\[[^\]]+\]\(([^)]+)\)', text):
            target = target.split('#', 1)[0].strip('<>')
            if not target or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target):
                continue
            if not (path.parent / target).resolve().exists():
                problems.append(f'{path.relative_to(ROOT)}: missing link {target}')
    docs = {}
    for path in [*ROOT.glob('schemas/*.json'), *ROOT.glob('fixtures/**/*.json'), *ROOT.glob('docs/research/**/*.json'), *ROOT.glob('packages/catalog/data/*.json'), *ROOT.glob('outputs/*_output.json'), *ROOT.glob('evaluation/*.json'), *ROOT.glob('evaluation/outputs/*_output.json')]:
        try:
            docs[path] = json.loads(path.read_text(encoding='utf-8'), parse_constant=lambda x: (_ for _ in ()).throw(ValueError(x)))
        except (ValueError, OSError) as exc:
            problems.append(f'{path.relative_to(ROOT)}: {exc}')
    public_path = ROOT / 'fixtures/public/scenarios.json'
    public = docs.get(public_path, [])
    if len(public) != 6 or [x.get('scenario_id') for x in public] != [f'P{i}' for i in range(1, 7)]:
        problems.append('Public array must contain P1 through P6 in order')
    for item in public:
        individual = ROOT / 'fixtures/public' / (item['scenario_id'] + '.json')
        if docs.get(individual) != item:
            problems.append(f'{individual.name}: differs from original array object')
    provenance = (ROOT / 'fixtures/README.md').read_text()
    if hashlib.sha256(public_path.read_bytes()).hexdigest() not in provenance:
        problems.append('Public fixture SHA-256 differs from provenance record')
    for path in ROOT.glob('docs/flows/*.mmd'):
        if not path.read_text().startswith(('flowchart ', 'sequenceDiagram', 'stateDiagram-v2')):
            problems.append(f'Unrecognized Mermaid source: {path.name}')
    research_path = ROOT / 'docs/research/sources.json'
    if research_path in docs:
        records = docs[research_path]
        ids = [item.get('id') for item in records]
        if len(ids) != len(set(ids)):
            problems.append('Research source IDs must be unique')
        by_id = {item.get('id'): item for item in records}
        for item in records:
            for field in ['id', 'kind', 'authors', 'title', 'url', 'checked_on', 'review_depth']:
                if not item.get(field):problems.append(f"Research source {item.get('id')}: missing {field}")
            if not item.get('url', '').startswith('https://'):
                problems.append(f"Research source {item.get('id')}: expected HTTPS source URL")
        plan = ROOT / 'plan.md'
        if plan.exists():
            for ident, url in re.findall(r'\[([RP]\d{2})\]\((https://[^)]+)\)', plan.read_text()):
                if ident not in by_id or by_id[ident]['url'] != url:
                    problems.append(f'Plan source {ident}: citation differs from source register')
    if args.schemas:
        try:
            from jsonschema import Draft7Validator
        except ImportError:
            problems.append('Install jsonschema >=4,<5 or run without --schemas')
        else:
            inp = docs[ROOT / 'schemas/scenario.schema.json']
            out = docs[ROOT / 'schemas/recommendation.schema.json']
            try:
                for path, value in docs.items():
                    if path.parent == ROOT / 'schemas':
                        Draft7Validator.check_schema(value)
                catalog_path = ROOT / 'packages/catalog/data/catalog.json'
                if catalog_path in docs:
                    catalog_validator = Draft7Validator(docs[ROOT / 'schemas/catalog.schema.json'])
                    for error in catalog_validator.iter_errors(docs[catalog_path]):
                        problems.append(f'Catalog schema: {list(error.path)}: {error.message}')
                services_path = ROOT / 'packages/catalog/data/services.json'
                if services_path in docs:
                    for error in Draft7Validator(docs[ROOT / 'schemas/services.schema.json']).iter_errors(docs[services_path]):
                        problems.append(f'Services schema: {list(error.path)}: {error.message}')
                vin, vout = Draft7Validator(inp), Draft7Validator(out)
                for path, value in docs.items():
                    if path.parent.name == 'outputs':
                        for error in vout.iter_errors(value):
                            problems.append(f'{path.name}: {list(error.path)}: {error.message}')
                for path, value in docs.items():
                    if 'fixtures' not in path.parts:
                        continue
                    for item in (value if isinstance(value, list) else [value]):
                        for error in vin.iter_errors(item):
                            problems.append(f'{path.name}: {list(error.path)}: {error.message}')
                base = docs[ROOT / 'fixtures/minimal.json']
                negatives = []
                for group, field in [('project','type'), ('project','platforms'), ('scale','users_at_launch'), ('scale','users_12_months'), ('team','size'), ('team','experience'), ('team','languages'), ('budget','monthly_infra_usd'), ('timeline','mvp_weeks')]:
                    item = copy.deepcopy(base); del item[group][field]; negatives.append(item)
                for group, field, value in [('team','size',0), ('team','size','1'), ('project','platforms',[]), ('project','type','unknown'), ('budget','monthly_infra_usd',-1), ('timeline','mvp_weeks',1.5)]:
                    item=copy.deepcopy(base); item[group][field]=value; negatives.append(item)
                for value in [0,-1,'100']:
                    item=copy.deepcopy(base); item['requirements']={'p95_latency_ms':value}; negatives.append(item)
                item=copy.deepcopy(base); item['priorities']={'cost':6}; negatives.append(item)
                for i,item in enumerate(negatives):
                    if vin.is_valid(item): problems.append(f'Negative input contract example {i} incorrectly accepted')
                # Synthetic output tests: never saved as official scenario answers.
                comp={'choice':'None','justification':'Synthetic contract check only','driven_by':['project.type'],'alternatives':[{'choice':'Example alternative','why_not':'Synthetic contract check'}],'tradeoffs':['Synthetic trade-off']}
                result={'status':'ok','summary':'Synthetic contract check only','architecture_style':'static','stack':{k:copy.deepcopy(comp) for k in ['frontend','backend','database','hosting']},'estimated_monthly_cost_usd':{'min':0,'max':0,'assumptions':['Synthetic test']},'warnings':[],'assumptions':[],'validation_errors':[]}
                examples=[result]
                warned=copy.deepcopy(result); warned['status']='ok_with_warnings'; warned['warnings']=[{'code':'TEST','severity':'warning','message':'Synthetic','fields':[]}]; examples.append(warned)
                invalid=copy.deepcopy(result); invalid.update(status='invalid_input',stack=None,validation_errors=[{'field':'project.type','message':'Missing'}]); examples.append(invalid)
                infeasible=copy.deepcopy(result); infeasible.update(status='infeasible',stack=None,warnings=[{'code':'TEST','severity':'critical','message':'Synthetic','fields':[]}]); examples.append(infeasible)
                for item in examples:
                    for error in vout.iter_errors(item):problems.append(f"Output status {item['status']}: {error.message}")
                bad=copy.deepcopy(result); bad['stack']['backend']['alternatives']=[]
                if vout.is_valid(bad):problems.append('Empty core alternative list incorrectly accepted')
                bad=copy.deepcopy(result); bad['status']='invalid_input'
                if vout.is_valid(bad):problems.append('Invalid_input with stack/errors mismatch incorrectly accepted')
                bad=copy.deepcopy(infeasible); bad['warnings']=[]
                if vout.is_valid(bad):problems.append('Infeasible without critical warning incorrectly accepted')
                bad=copy.deepcopy(warned); bad['status']='ok'
                if vout.is_valid(bad):problems.append('ok with material warning incorrectly accepted')
            except Exception as exc:
                problems.append(f'Schema verification failed: {exc}')
    if problems:
        for problem in problems:print('ERROR:',problem,file=sys.stderr)
        return 1
    print(f'PASS: Markdown links/fences, {len(docs)} JSON files, six public splits, provenance, flow sources' + (', input/output schema and positive/negative contract checks' if args.schemas else ''))
    if research_path in docs:
        print(f'PASS: {len(docs[research_path])} research metadata records, unique IDs and plan citation mapping')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
