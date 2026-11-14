#!/usr/bin/env python3
"""Author the release report from actual versioned outputs/evaluation evidence.

Requires reportlab and pypdf; use the bundled PDF runtime or an authoring venv.
Screenshots are embedded without retouching. Runtime app setup needs only Node.
"""
from pathlib import Path
import json,math,re,html,datetime
from urllib.parse import urlparse
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak,Image,KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.enums import TA_LEFT,TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.graphics.shapes import Drawing,Rect,String,Line,Polygon
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
def load(path):return json.loads((ROOT/path).read_text())
public=[load(f'outputs/P{i}_output.json') for i in range(1,7)]
cases=load('evaluation/cases.json');evaluated=load('evaluation/results.json');sensitivity=load('evaluation/sensitivity.json');performance=load('evaluation/performance.json');setup=load('evaluation/setup.json')
core=load('packages/catalog/data/catalog.json');services=load('packages/catalog/data/services.json');research=load('docs/research/sources.json')
OUT=ROOT/'output/pdf/Report_SohamBanerjee.pdf';OUT.parent.mkdir(parents=True,exist_ok=True)
INK=colors.HexColor('#25232D');PURPLE=colors.HexColor('#6551C6');MUTED=colors.HexColor('#655F70');PALE=colors.HexColor('#F2EFF8');BORDER=colors.HexColor('#E2DDEB')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyReport',fontName='Helvetica',fontSize=11,leading=14.7,textColor=INK,spaceAfter=9))
styles.add(ParagraphStyle(name='SmallReport',fontName='Helvetica',fontSize=10,leading=12.6,textColor=MUTED,spaceAfter=7))
styles.add(ParagraphStyle(name='H1Report',fontName='Helvetica-Bold',fontSize=23,leading=27,textColor=INK,spaceAfter=15))
styles.add(ParagraphStyle(name='H2Report',fontName='Helvetica-Bold',fontSize=14,leading=18,textColor=PURPLE,spaceBefore=10,spaceAfter=9))
styles.add(ParagraphStyle(name='CaptionReport',fontName='Helvetica',fontSize=10,leading=12.5,textColor=MUTED,spaceBefore=5,spaceAfter=10))
styles.add(ParagraphStyle(name='RefReport',fontName='Helvetica',fontSize=10,leading=12.5,textColor=INK,spaceAfter=5))
styles.add(ParagraphStyle(name='CodeReport',fontName='Courier',fontSize=10,leading=14,textColor=INK,backColor=PALE,borderPadding=8,spaceAfter=10))
styles.add(ParagraphStyle(name='CoverReport',fontName='Helvetica-Bold',fontSize=37,leading=41,textColor=INK,spaceAfter=14))
story=[];prose=[]
def p(text,style='BodyReport'):
 text=text.translate({0x2011:'-',0x2013:'-',0x2014:'-',0x2018:"'",0x2019:"'",0x201C:'"',0x201D:'"'});story.append(Paragraph(text,styles[style]));prose.append(re.sub('<[^>]+>','',text))
def h(text):p(text,'H1Report')
def sub(text):p(text,'H2Report')
def page():story.append(PageBreak());prose.append('\n---\n')
def table(headers,rows,widths=None):
 data=[[Paragraph(html.escape(str(x)),styles['SmallReport']) for x in headers]]+[[Paragraph(str(x),styles['SmallReport']) for x in row] for row in rows]
 t=Table(data,colWidths=widths or [499/len(headers)]*len(headers),hAlign='LEFT',repeatRows=1)
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PALE),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),.8,BORDER),('LINEBELOW',(0,1),(-1,-1),.35,BORDER),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),5)]));story.append(t);story.append(Spacer(1,10))
def shot(id,width=499):
 image=Image(str(ROOT/f'docs/evidence/final/{id}.jpg'),width=width,height=width*520/900);image.hAlign='CENTER';story.append(image)
def caption(text):p(text,'CaptionReport')
def diagram():
 d=Drawing(499,155)
 boxes=[(0,96,'React workspace'),(174,96,'Local Fastify API'),(348,96,'Shared contracts'),(348,20,'Engine + plan search'),(174,20,'Cost / control checks'),(0,20,'Explained result / JSON')]
 for x,y,text in boxes:d.add(Rect(x,y,151,43,rx=6,fillColor=PALE,strokeColor=BORDER));d.add(String(x+75.5,y+18,text,textAnchor='middle',fontName='Helvetica',fontSize=9,fillColor=INK))
 for x1,y1,x2,y2 in [(151,118,174,118),(325,118,348,118),(423,96,423,63),(348,41,325,41),(174,41,151,41)]:
  d.add(Line(x1,y1,x2,y2,strokeColor=PURPLE,strokeWidth=1.3))
  if y1==y2:
   sign=1 if x2>x1 else -1;d.add(Polygon([x2,y2,x2-sign*5,y2+3,x2-sign*5,y2-3],fillColor=PURPLE,strokeColor=PURPLE))
  else:d.add(Polygon([x2,y2,x2-3,y2+5,x2+3,y2+5],fillColor=PURPLE,strokeColor=PURPLE))
 story.append(d)

def footer(canvas,doc):
 canvas.saveState();canvas.setStrokeColor(BORDER);canvas.line(48,39,A4[0]-48,39);canvas.setFillColor(MUTED);canvas.setFont('Helvetica',9);canvas.drawString(48,25,'StackSense | Soham Banerjee | Release 0.7.0');canvas.drawRightString(A4[0]-48,25,str(doc.page));canvas.restoreState()

# Main report: fourteen deliberately bounded A4 pages, including title and AI disclosure.
p('SYNERGY 26 / ARCHITECTURE DECISION ENGINE','SmallReport');story.append(Spacer(1,16));p('StackSense','CoverReport');p('An explained technology stack, grounded in project constraints.','H2Report')
p('<b>Soham Banerjee</b><br/>IIIT-Bangalore<br/>Soham.Banerjee@iiitb.ac.in<br/><a href="https://github.com/oki-dokii/StackSense" color="#6551C6">github.com/oki-dokii/StackSense</a><br/>14 November 2026','BodyReport')
p('Application 0.7.0; recommendation engine/rules/services 0.6.0; analysis 0.1.0; core catalog 0.4.0. This is a local review package, not an assertion of online submission or independent owner review.','SmallReport')
sub('1. Abstract')
p('StackSense converts a structured software-project brief into a deterministic, explained architecture. A local TypeScript engine validates inputs, filters compatible core stacks, checks required supporting services and data flows, estimates month-12 cost bands, and ranks complete designs. A CLI, Fastify API and React workspace share the same engine. The release includes 34 core entries, 24 service profiles, source records, actual JSON outputs and browser evidence. Of six supplied scenarios, two receive usable recommendations and four retain explicit evidence-relative blockers. The evaluation includes 235 automated tests, fourteen author-designed unseen-style cases, input-sensitivity experiments and measured local setup/API timings. The system makes no runtime LLM calls and requires no paid key. Costs, performance targets and framework controls are disclosed assumptions and implementation tasks, not provider quotes, benchmarks of suggested stacks, or certification.')
sub('2. Problem understanding')
p('The task is one recommendation engine, not six applications. The supplied scenarios are inputs, not labeled expected answers. Recommendations must cover four core layers, required supporting capabilities, input drivers, alternatives, trade-offs and cost assumptions. Residency, explicit provider and deployment are strict; unsupported decisive evidence withholds the stack. Budget and timeline remain explicit preference/risk trade-offs under the documented brief ambiguities.')

page();h('3. System architecture');diagram()
p('The CLI calls the shared engine directly; web input uses the local HTTP API. Contracts and the same complete-plan engine are reused by every adapter. The API performs bounded parsing and transport checks, then calls the engine; the browser never selects technologies. Local files provide immutable catalog/rule data. Validation does not coerce types or discard unknown fields.')
table(['Layer','Implementation'],[['Runtime','Node 22.17.1 and npm 10.9.2 tested on macOS arm64; supported engines: Node 22.17+ within 22, or Node 24.'],['Shared engine','TypeScript 5.9.3, Ajv 8.20.0; generated contracts via json-schema-to-typescript 15.0.4.'],['Adapters','Fastify 5.12.8 / @fastify/static 10.1.10; bounded single/batch CLI.'],['Workspace','React / react-dom 19.3.1 and Vite 8.3.8; no project persistence or external analytics.'],['Testing / types','Vitest 5.1.0; tsx 4.23.15; @types/node 22.20.5 and React/DOM types 19.3.0; CLI, HTTP, model and engine checks.']],[100,399])
sub('Local execution')
p('npm ci<br/>npm run check<br/>npm run build<br/>npm start','CodeReport')
p('Open http://127.0.0.1:3000. The server binds loopback only and serves API and assets together; STACKSENSE_PORT optionally changes the port. The development UI at 5173 proxies the same API. The complete checkout must accompany dist because schemas/catalog/fixtures are local data.')
p('The UI supports guided briefs, sample/import/batch input and all four result statuses. Every edit invalidates export until rerun. Driver values use the evaluated snapshot. No-plan 0-0 placeholders render Not estimated. Inputs remain in memory; closing/reloading discards the draft.')

page();h('4. Input design and research');p('Every standard field is accepted. Required leaves are checked before planning; optional defaults are recorded as assumptions. Schemas, source scopes and rule drivers provide an auditable mapping rather than a claim that a field predicts product quality.')
table(['Group / fields','Architectural relevance and validation'],[
['project: type*, platforms*; name, description; scenario_id','Type is a known enum; platforms is a nonempty enum array. Targets constrain client coverage and API-only frontend omission. Type/features distinguish static from stateful work. Names/IDs are metadata only. Bounded affirmative description hints cover Markdown, ledgers, collaboration and device memory; structured values take precedence.'],
['scale: users_at_launch*, users_12_months*; peak_concurrent_users, traffic_pattern, workload, data_volume_gb_12_months','Users/concurrency are nonnegative integers; data is nonnegative. Missing optional capacity stays unknown. Workload/traffic and concurrency affect sizing/rubrics; users alone do not measure RPS. Traffic defaults steady; workload balanced.'],
['team: size*, experience*, languages*; has_devops','Size is a positive integer; experience a known enum; languages a token array. Language familiarity affects delivery/maintenance. DevOps defaults false and influences operating burden.'],
['budget.monthly_infra_usd*; timeline.mvp_weeks*','Budget is a nonnegative number; delivery is a positive integer. Cost bands are compared to the same month-12 budget. Zero is valid, not a promise dynamic services are free. Short timelines produce explicit integration risk.'],
['infrastructure: cloud_preference, deployment_model, data_residency, existing_systems','Defaults: any, managed_cloud, none, empty list. Strict provider/deployment/residency filters require reviewed mappings. Existing systems affect reuse hints, identity integration, version/license/network review and known EOL warnings.']],[180,319])
p('* Mandatory input leaves. Field-path errors are aggregated; malformed/oversized inputs have root errors. Set-like arrays are deduplicated and sorted. Unknown input properties are preserved and warned. Maximum input is 2 MiB, nesting 32, 100,000 values and batch size 100.','SmallReport')

page();h('4. Input design (continued)')
table(['Standard fields','Decision effect / default'],[['requirements: realtime, offline_support, full_text_search, file_media_storage, payments, multi_tenant, seo_critical','Boolean flags default false. They require transport/shared state, device durability/sync, native search, private storage, checkout/webhooks, tenant isolation and crawlable rendering respectively. Required missing service coverage rejects the plan.'],['requirements: auth, ml_features, availability, p95_latency_ms','Auth/ML default none. Availability defaults string 99.9; allowed targets remain strings. Optional positive p95 can be null. Auth determines identity/delivery; CPU ONNX inference is scoped separately from unsupported training/RAG. SLA/latency are explicitly unverified targets.'],['compliance; priorities: cost, time_to_market, scalability, performance, maintainability, security','Compliance defaults empty and uses enumerated labels. Each priority is an integer 1-5, default 3. Frameworks produce non-exhaustive control designs and owner actions; no audit or legal applicability is inferred. Priorities cannot override hard constraints.']],[185,314])
sub('Extra usage inputs: actual sensitivity experiments')
rows=[]
for item in sensitivity:
 rows.append([item['field'],f"{item['values'][0]} to {item['values'][1]}",f"${item['low_cost']['max']:,.2f} to ${item['high_cost']['max']:,.2f}"])
table(['Optional extension','Changed input','Upper monthly band'],rows,[200,110,189])
p('These are paired experiments, holding other inputs fixed per pair; their baseline is not a public scenario. RPS changes compute, egress changes network charges, retention changes backups, and OTP/payment volume/value change their disclosed usage envelopes. A changed estimate need not change the core stack. Full inputs/method are reproducible in scripts/evaluate.mjs and evaluation/sensitivity.json.','SmallReport')
p('Legacy primary_user_region and vendor_lock_in_tolerance values are accepted from imports but remain explicitly unapplied; they are not actively collected in the guided form. No unsupported latency or portability advantage is inferred from them. New optional parameters are not hidden requirements.')

page();h('5. Knowledge base and decision logic')
p(f"The core catalog has {len(core['entries'])} entries and {len(core['sources'])} dated primary-source records; service policies add {len(services['services'])} profiles, {len(services['sources'])} source records and two known lifecycle rules. Records describe product family, runtime, client coverage, driver edges, deployment/provider mappings, regions, complexity/operating burden, trade-offs and source scope. Active status is required; maintained product families still need supported versions pinned during a real build.")
sub('Evaluate complete plans before ranking')
p('1. Validate, normalize and record defaults.<br/>2. Derive bounded, field-linked architecture hints.<br/>3. Filter core domains by target, rendering, deployment, provider and reviewed primary regions.<br/>4. Enumerate compatible frontend/backend/database/host combinations; prune unsupported driver/runtime/storage edges.<br/>5. Add required services; reject incompatible client/database/provider, restricted external flow or missing decisive evidence.<br/>6. Build controls and estimate only complete compatible designs.<br/>7. Rank, attach alternative/driver evidence, then validate the organiser-format result.')
p('Search uses smallest domains and stable IDs, without a top-K core shortlist. An assignment limit raises an internal failure; it never turns interrupted search into infeasibility. Infeasibility means no complete design in this reviewed catalog, not impossibility in the real world.')
table(['Fit','Meaning'],[['Cost','5 if upper cost fits; 3 if only lower fits; 1 when lower is within twice budget; otherwise 0.'],['Delivery / maintenance','Language familiarity, implementation complexity, team capacity and operated services.'],['Scale / performance','Explicit workload/growth/embedded-writer heuristics; no measured framework throughput or latency is credited.'],['Security','Configured-control coverage; reviewed tenant isolation can increase fit. No certification credit.']],[115,384])
p('Each 0-5 fit is multiplied by its supplied 1-5 priority. Ties use lower cost upper bound, fewer operated resources and stable plan ID. Rubrics are transparent but uncalibrated; rounding and stable ties can select among similarly scored technologies. No scenario ID/name or runtime LLM chooses a stack.')

page();h('5. Evidence, services and costs')
p('Service profiles cover identity, SMS OTP, realtime collaboration, local offline data, full-text search, forced RLS, media, hosted checkout, transactional outbox/workers, CPU inference, telemetry and build/deploy support. Keycloak TOTP is not mislabeled as phone delivery. Dynamic offline writes need application reconciliation/idempotency; public static offline reads use Workbox without inventing a database/queue.')
sub('Scope and residency are checked separately')
p('GCP reviewed mappings include Mumbai, Belgium and Iowa. The release adds AWS Fargate and RDS PostgreSQL primary mapping in Mumbai using Fargate/region/RDS documentation [core:fargate-regions, core:aws-regions, core:rds-regions]. This does not approve external identity, SMS or payment handling. Central India now has a separate App Service Environment v3 Linux Isolated v2 profile, PostgreSQL Flexible Server with in-region backups, and private Blob LRS. This evidence is not applied to shared App Service or other regions. Entra tenant flows are assessed separately.')
p('Strict residency rejects external providers without reviewed end-to-end country scope. Framework designs require configuration, retention/deletion, access/restore tests and qualified review. HIPAA cloud/external services need eligible scope and executed BAA evidence. Explicit RBI localisation derives India only when the label requests it; contradictory regions reject. Known Python 2 and AngularJS support endings warn on existing systems without mislabeling Python 3 or maintained Angular.')
sub('Month-12 planning bands')
p('Resource lines expose quantities, USD rate intervals, source IDs and assumptions. Fixed-point BigInt multiplication rounds line bounds outward to cents; totals use integer cents. Shared hosting/CDN and database auth/search/outbox capacity are not double billed. Separate compute includes workers, identity, telemetry and inference allocations. Database CPU/RAM/storage, backups, media, network, CI, SMS and payment assumptions are included when selected.')
p('Published reference cloud rates are distinguished from authored allowances/proxies. They are not selected-region quotes or measured capacity. Missing RPS, egress and transaction activity use visible hypotheses. Taxes, development/on-call labor, domains, new owned-hardware procurement and specialized model acquisition are excluded. Higher availability provisions redundancy hypotheses without guaranteeing an SLA.')
p('An over-budget usable plan is explicitly ok_with_warnings. Hard evidence blockers withhold the stack and use estimate_status: not_estimated; the required 0-0 serialization is never a free-price claim. Source/rules versions make every result reproducible.')

page();h('6. Sample recommendations: P1');shot('P1');caption('P1 / DevFolio - actual local release UI, engine 0.6.0. The complete output is outputs/P1_output.json.')
p('<b>Inputs:</b> a solo beginner, JavaScript/HTML/CSS, two weeks, Markdown portfolio/blog, web-only SEO, no dynamic features, 3,000 year-one users and USD 0 infrastructure budget.')
p('<b>Selected:</b> Astro produces static content; None backend and None database avoid services that the stated features do not need. Cloudflare Pages serves the static build; CDN delivery is the same bundle and local Git/build scripts avoid assumed paid CI. The month-12 hosting band is USD 0-0 under static-asset, build/file and add-on limits.')
p('<b>Why this combination:</b> static rendering covers SEO and Markdown authoring. HTML/CSS is a real compatible alternative, scored 82 versus 86 for the selected plan under the manual content-conversion rubric. A complete Cloud Run plan scored 61. Dynamic backend/database alternatives do not survive the static requirement profile; their omission is explained rather than represented by empty component fields.')
p('<b>Trade-offs:</b> publishing is a content build, not a dynamic application. Functions, paid domains, external identity, uploads and private/country-restricted global-edge data are outside the selected profile. Free delivery does not establish an SLA. These constraints are visible in assumptions and the informational deployment-limit warning.')

page();h('6. Sample recommendations: P3');shot('P3');caption('P3 / BoardRoom - actual warned result. Selected plan score 85; alternatives are relative whole-plan comparisons, not intrinsic product rankings.')
p('<b>Inputs:</b> collaborative whiteboard, web, 5,000 peak concurrent users, tenant isolation, social login, media, payments, 100 ms p95 target, 99.9% availability and a USD 1,500 month-12 budget. No country residency is specified; full-text search is false and is omitted.')
p('<b>Selected:</b> Angular, Fastify, PostgreSQL and Cloud Run. Yjs + ws covers shared CRDT state/transport; PostgreSQL outbox workers persist/retry updates, forced RLS supports tenant boundaries, Keycloak brokers identity, regional private object storage handles uploads and Stripe Checkout isolates card credentials. Telemetry and hosted CI are included with stated limits.')
p('<b>Alternatives and limits:</b> React/Vite and a Go-backend plan tied on score; published cost/operation/ID tie-breaks selected this result. AWS hosting scored 81. This is not proof Angular is best. Application auth, document persistence, cross-instance coordination and conflict UX must still be built.')
p('<b>Costs:</b> USD 875.51-7,785.95/month. Application compute contributes USD 600.16-4,321.23; unknown payment activity contributes up to USD 2,500. Remaining database/storage/backup/network/telemetry/CI lines are exposed in JSON. The upper band exceeds budget. SLA, latency, social identity terms and GDPR control implementation require review; none is certified by this recommendation.')

page();h('6. Public scenarios: P2 and P4');shot('P2',430);caption('P2 / FixIt Now - infeasible relative to reviewed evidence. Marketplace web/Android features are not silently removed to meet USD 150. Both phone delivery and payment data-flow India scope lack reviewed assurance; no monthly estimate is fabricated.');shot('P4',430);caption('P4 / QuickCredit - AWS Mumbai primary compute/database evidence is now available. The lending/ledger design still cannot approve required India-only external OTP/payment flows. RBI/PCI/DPDP/ISO labels do not substitute for contract, application and configuration evidence. Output stack is null; cost is Not estimated.')

page();h('6. Public scenarios: P5 and P6');shot('P5',430);caption('P5 / PeopleDesk - A distinct Azure Central India isolated compute/PostgreSQL/storage profile is now reviewed. P5 still cannot approve existing Entra tenant data flows from the supplied input; on-prem SQL Server 2019 reuse, connectivity, licenses and capacity also need project evidence. No silent migration, public region substitution or certified ISO status is asserted.');shot('P6',430);caption('P6 / KhetSurvey - offline Android durability, retries, resumable media and a server outbox are modeled building blocks. The complete design remains blocked by phone-OTP India data-flow evidence. A device-memory hint requires measurement, not an invented framework benchmark. No-plan cost 0-0 means Not estimated, not a free deployment.')

page();h('7. Edge-case handling');p('All nine categories below have actual release evaluations and unedited overview screenshots in Appendix A. Full errors/warnings/choices are in evaluation/outputs. These are author-designed unseen-style cases, not organiser hidden tests or independent expert judgments.')
table(['Case / category','Detection and actual response'],[
['E01 Missing fields','Schema reports project, scale, team, budget and timeline paths; invalid_input and null stack. Optional defaults do not excuse missing required leaves.'],['E02 Invalid values','Negative launch users, string team size and priority 6 produce aggregated field errors; no coercion or crash.'],['E03 Contradictions','Multi-platform realtime, extreme concurrency/SLA, solo beginner, one week and USD 0 produce a clearly over-budget warned design with timeline and unverified-availability notices. No feature is silently dropped.'],['E04 Over-engineering','Five million users of static public content still select static delivery with no backend/database; traffic alone does not justify Kubernetes/microservices.'],['E05 Regulation','HIPAA cloud request lacks BAA evidence; infeasible and no fabricated stack or cost.'],['E06 Existing systems','Enterprise identity is integrated through an OIDC/SAML design; SQL Server 2019 reuse requires connectivity/license/version review. Existing systems are not assumed migrated.'],['E07 Restricted deployment','Air-gapped case selects the local host and local CI; no external runtime SaaS, public hosted CI or CDN is selected. Offline artifacts remain an owner task.'],['E08 Skill mismatch','Go language input affects familiarity/delivery and is cited by backend drivers; whole-plan trade-offs remain explicit.'],['E09 Deprecated tech','Known Python 2 and AngularJS upstream support endings are reported with sources. Maintained Python 3/Angular and SQL Server 2019 are not mislabeled by these rules.']],[142,357])
p('Additional cases test reviewed AWS India, offline native writes, cloud-none/managed contradiction, unsupported RAG and an unknown extension. Invalid catalog data or exhausted search remains an internal failure. No result claims all conflicts are minimal or all EOL technologies are known.','SmallReport')

page();h('8. Validation and measurements')
p('<b>235 automated tests</b> pass across nine files: contract/default/provenance, catalog/driver integrity, compatible search, complete services/costs, metadata/order mutations, CLI subprocess IO, exact API/engine parity, transport/security, browser model and fourteen release cases. Generated TypeScript freshness, compiler and production browser/server builds pass. Twenty recommendation snapshots and six Decision Lab artifacts are checked byte-for-byte against current code; three additional capture-provenance tests pass.')
p('Fourteen author-designed case expectations cover statuses, field errors, required services, local deployment, region retention and simplicity. Metamorphic checks rename metadata/reorder set-like inputs and ensure hard constraints remain filters. Six paired usage experiments show real cost effects. No external expert review, organiser hidden-case results or calibrated recommendation-quality accuracy is claimed.')
sub('Observed local API timings')
rows=[[m['scenario_id'],f"{m['median_ms']:.3f}",f"{m['p95_ms']:.3f}",f"{m['max_ms']:.3f}"] for m in performance['measurements']]
table(['Case','Median ms','p95 ms','Max ms'],rows,[100,133,133,133])
p(f"Measured on {performance['environment']['cpu']}, {performance['environment']['memory_gb']:g} GB RAM, macOS arm64, Node {performance['environment']['node']}, npm {performance['environment']['npm']}. Cold Node/API startup to health: {performance['cold_start_to_health_ms']:.3f} ms. Each case had one warm-up and twenty real loopback HTTP POSTs through consumed JSON. Browser rendering, recommended workload performance and cloud provisioning are excluded.")
sub('Clean setup rehearsal')
p(f"A source ZIP was extracted to a fresh directory. Cached offline npm ci, all checks, build, evaluation and output verification completed in {setup['total_seconds']:.3f} seconds. Runtime/test source digest is recorded and checked during final packaging. The populated dependency cache avoids a new network download; online installation speed and Windows/Linux execution are not claimed. The CI matrix covers macOS, Ubuntu and Windows on Node 22/24; remote run results are separate from this local measurement.")
p('Browser evidence covers sample/import/batch, all statuses, export parity, stale-export blocking, keyboard controls and 360 px overflow checks. This is not a full accessibility or browser conformance audit. Official product/source alignment is reviewed; no paper experiment was reproduced.','SmallReport')

page();h('Decision Lab: application 0.7.0')
image=Image(str(ROOT/'docs/evidence/phase7/tradeoffs.jpg'),width=499,height=499*720/1280);image.hAlign='CENTER';story.append(image)
caption('Actual P3 Decision Lab view. All 168 completed catalog plans are plotted; 12 identifiers are nondominated under the three declared model objectives. Inspecting an alternative never changes the original recommendation.')
p('The separate analysis endpoint runs the original recommendation plus 24 one-priority-at-a-time changes. P3 retains its winner in 25/25 settings while equal-score alternatives remain. This count is not a confidence probability, unique superiority or global sensitivity analysis; interactions are not exhaustively explored.')
p('The tradeoff front minimizes monthly cost upper bound and operated component units while maximizing the ORIGINAL-priority weighted score. It uses every completed candidate, not just the top three. All metrics retain their heuristic/planning scope. A lower upper cost can still have a higher lower cost, so inspect both bounds and assumptions.')
p('Blocked briefs receive bounded single/pair functional experiments on copies. P2 needs two functional changes within the checked set and still exceeds its budget; P6 has a one-edit login experiment. Neither satisfies its original brief. P5 tenant evidence is not invented. Compliance, infrastructure/residency/provider, isolation and quality targets remain fixed; no automatic Apply action exists.')
p('Proposed ADR Markdown and exact JSON exports include the original result, input digest, versions, alternatives, scoped references and owner tasks. Browser exports match API/engine artifacts; stale exports are blocked after edits. The standard 0.6.0 recommendations remain byte-for-byte unchanged. Counterfactual, Pareto evaluation, sensitivity and ADR sources are N01-N04 in Appendix B; their experiments were not reproduced.','SmallReport')

page();h('9. Limitations and future work')
p('Four of six public scenarios remain unusable under the current evidence policy. The engine deliberately does not equate a regional app host, an Indian vendor or a compliance badge with complete identity/payment data-flow assurance. Broader Azure variants and existing-tenant boundaries need deeper review; Central India isolated compute/database/storage is now separately scoped. This conservative coverage has a real recommendation-quality cost; it is not presented as complete scenario support.')
p('The catalog is finite and product-family based. Framework/API/driver versions, regional quotas, contract eligibility, data retention and all application controls need deployment review. Training/RAG, broader search/storage options, comprehensive lifecycle coverage, private network integration and general prose understanding remain limited.')
p('Costs use capacity hypotheses and authored allowances as well as reference prices. SLA/latency are targets, not guarantees. Ordinal fits are not statistically calibrated; close plans may tie and stable IDs can determine the winner. Independent architecture review, tariff validation, target-device/load tests and calibrated capacity examples and tenant/vendor evidence remain high-value improvements. Release 0.6.0 guidance/cost features are retained; application 0.7.0 adds the separate Decision Lab. Measured workload calibration, reviewed source diffs and independent assessment remain next work.')
sub('10. References and third-party tools')
p('Appendix B enumerates the complete core, service/control/lifecycle and research source registers with clickable links and their versioned IDs. Source scope/review dates are recorded in packages/catalog/data and docs/research/sources.json. Relevant IDs appear in outputs; referenced availability evidence does not establish legal or pricing approval.')
table(['Tool / source','Role'],[['Node.js / npm / TypeScript / tsx','Local execution, exact dependency installation, compilation and development.'],['Ajv / json-schema-to-typescript / Vitest','Authoritative JSON Schema validation, generated types and tests.'],['Fastify / @fastify/static / React / react-dom / Vite','Local API and browser workspace.'],['ReportLab / pypdf / Poppler / Python standard library','Report authoring/text/page checks/rendering and ZIP packaging; not required to run the engine.'],['Original challenge PDF and six supplied JSON scenarios','Requirement interpretation and public evaluations. No official expected stack labels were supplied.'],['GitHub Actions checkout/setup-node','Read-only CI workflow; pinned official revisions. CI success is not preclaimed.']],[210,289])

page();h('11. AI assistance declaration')
p('OpenAI Codex was used for requirement interpretation, research/source lookup, planning documents, catalog/rule/rubric drafts, TypeScript implementation, tests, browser checks, measurement scripts, report authoring and packaging. The Sites skill guided the local repository UI workflow; the PDF skill guided report generation and visual QA. No other person or team was delegated implementation work in this release.')
p('There are no runtime LLM calls, model-selected stacks or paid-key requirements. The accepted --no-llm CLI flag is a no-op because selection is entirely local rules/search/scoring. Research papers were used as design guidance with recorded review depth; their experiments were not replicated. AI-generated choices are not independent expert verification.')
p('The participant must understand, review, revise where appropriate and own the AI-assisted design, research and reasoning before submitting. This report does not assert that independent owner review or unaided authorship has already happened. The name, college and email on the title page were explicitly supplied by Soham Banerjee, with permission to include the report in the public repository.')
sub('Release package and owner handoff')
p('The local StackSense26_SohamBanerjee package contains source/source.zip with README at its root, the six actual public output JSON files, this PDF, submission notes and a SHA-256 manifest. Dependencies, build output, caches, credentials and Git internals are excluded. A runtime/test source digest connects the package to its setup rehearsal; ZIP integrity and size are checked.')
p('Owner actions remain: review the complete implementation/research and AI disclosure; create the correctly named Drive folder; set and verify link-view access in a private browser; submit the folder link on Unstop before the stated deadline; and stop changing the submitted folder after that deadline. This package has not been uploaded, shared or submitted by the coding agent.')
p('The release evidence is a reproducible engineering record with disclosed limitations. It is not a compliance certificate, production deployment validation, independent review or promise that all project requirements are covered.','SmallReport')

# Appendices: 5 pages of nine case screenshots, followed by <=5 source-ledger pages.
for start in range(0,9,2):
 page();h(f'Appendix A. Edge evidence {start+1}' + (f'-{min(start+2,9)}' if start+1<9 else ''))
 for item in cases[start:min(start+2,9)]:
  shot(item['id'],430);caption(f"{item['id']} / {item['category']} - {item['expect']['status']}. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/{item['id']}_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.")
 if start==8:
  sub('E09 structured diagnostics')
  for warning in load('evaluation/outputs/E09_output.json')['warnings']:
   if warning['code']=='EXISTING_TECH_EOL':p(html.escape(warning['message']))
refs=[]
for prefix,data in [('core',core['sources']),('svc',services['sources'])]:
 for source in data:refs.append((f"{prefix}:{source['id']}",source['title'],source['url'],source.get('checked_on','2026-11-13')))
for source in research:refs.append((source['id'],source['title'],source['url'],str(source.get('year') or source.get('checked_on') or '2026-11-13')))
# Include implementation/authoring references not in the knowledge-base registers.
extra=[('tool:node','Node.js release information','https://nodejs.org/en/about/previous-releases'),('tool:npm','npm CLI documentation','https://docs.npmjs.com/cli/'),('tool:types','DefinitelyTyped type definitions','https://github.com/DefinitelyTyped/DefinitelyTyped'),('tool:fastify','Fastify server reference','https://fastify.dev/docs/latest/Reference/Server/'),('tool:react','React state reference','https://react.dev/reference/react/useState'),('tool:vite','Vite guide','https://vite.dev/guide/'),('tool:ajv','Ajv documentation','https://ajv.js.org/'),('tool:vitest','Vitest guide','https://vitest.dev/guide/'),('tool:typescript','TypeScript documentation','https://www.typescriptlang.org/docs/'),('tool:tsx','tsx documentation','https://tsx.is/'),('tool:jstt','json-schema-to-typescript','https://github.com/bcherny/json-schema-to-typescript'),('tool:static','Fastify static assets plugin','https://github.com/fastify/fastify-static'),('tool:reportlab','ReportLab PDF toolkit','https://www.reportlab.com/docs/reportlab-userguide.pdf'),('tool:pypdf','pypdf documentation','https://pypdf.readthedocs.io/'),('tool:poppler','Poppler utilities','https://poppler.freedesktop.org/'),('tool:checkout','GitHub Actions checkout','https://github.com/actions/checkout'),('tool:setup-node','GitHub Actions setup-node','https://github.com/actions/setup-node')]
for id,title,url in extra:refs.append((id,title,url,'2026-11-13'))
# Include the four method references used by the new Decision Lab section.
for source in load('docs/research/phase7/sources.json')[:4]:refs.append((source['id'],source['title'],source['url'],source['checked_on']))
# 150 scoped records across five pages; body remains 10 pt.
for start in range(0,len(refs),30):
 page();h(f'Appendix B. Source ledger {start//30+1}')
 p('Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.','SmallReport')
 for id,title,url,date in refs[start:start+30]:
  domain=urlparse(url).netloc.removeprefix('www.');p(f'<b>{html.escape(id)}</b> - {html.escape(title)}. <a href="{html.escape(url,quote=True)}" color="#6551C6">{html.escape(domain)}</a> ({html.escape(date)}).','RefReport')

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=48,bottomMargin=55,title='StackSense - Project Report',author='Soham Banerjee',subject='Synergy 26 explained stack recommendation engine, release 0.7.0')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(str(OUT));text='\n'.join(page.extract_text() or '' for page in reader.pages)
appendix=next((i for i,page in enumerate(reader.pages) if 'Appendix A. Edge evidence' in (page.extract_text() or '')),None)
if appendix is None or appendix>15 or len(reader.pages)-appendix>10:raise RuntimeError(f'Report page budget exceeded: main={appendix}, appendix={len(reader.pages)-(appendix or 0)}, total={len(reader.pages)}')
for token in ['Soham Banerjee','IIIT-Bangalore','Soham.Banerjee@iiitb.ac.in','1. Abstract','11. AI assistance']:
 if token not in text:raise RuntimeError(f'Missing report content: {token}')
(ROOT/'docs/REPORT_FINAL.md').write_text('# StackSense report narrative\n\nGenerated alongside the PDF; tables, images and complete source ledger are in the PDF and versioned evaluation data.\n\n'+'\n\n'.join(prose)+'\n')
(ROOT/'evaluation/report-checks.json').write_text(json.dumps({'file':'output/pdf/Report_SohamBanerjee.pdf','pages':len(reader.pages),'main_pages':appendix,'appendix_pages':len(reader.pages)-appendix,'page_size':'A4','body_font_pt':11,'table_reference_font_pt':10,'source_records':len(refs),'screenshots':16,'engine_version':'0.6.0','application_version':'0.7.0','owner_metadata_confirmed':True,'visual_review':'pending render inspection'},indent=2)+'\n')
print(json.dumps({'pdf':str(OUT),'pages':len(reader.pages),'main_pages':appendix,'appendix_pages':len(reader.pages)-appendix,'source_records':len(refs)},indent=2))
