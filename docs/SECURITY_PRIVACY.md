# Security and privacy design

Scope: local challenge application. This is a design checklist, not a claim of certification or a production security review.

## Data handling

No account, telemetry, cloud persistence, or outbound runtime API is needed. Keep imported requirements and results in memory. Optional later draft saving must be explicit, local, clearable, and disclose storage. Logs exclude descriptions, raw payloads, environment secrets, and uploaded documents. No secrets belong in fixtures/catalog/repository.

## Trust boundaries and controls

| Boundary | Threat | Planned control |
|---|---|---|
| JSON import | Invalid/oversized/deep input, prototype keys | 2 MiB/100-item limits; structure/depth guard; safe schema validation; reject dangerous keys |
| Description / existing systems | Script/HTML injection | React text rendering; no raw HTML insertion; sanitize any future Markdown |
| API loopback | Unwanted remote access | Bind loopback; same-origin UI; no wildcard CORS; validate Origin for browser calls |
| CLI filesystem | Traversal/overwrite via IDs | Explicit caller paths; sanitize generated names; refuse overwrite unless `--force`; atomic writes |
| Sources/links | Malicious URLs | Curated http(s) source URLs; no arbitrary fetched input URLs; safe external-link attributes |
| Dependencies | Supply-chain drift | Lockfile, minimal packages, reviewed updates and dependency audit |
| Catalog | Unsupported compliance claims | Evidence per deployment/control; unknown facts flagged/excluded |

Descriptions and imported extension values are data, never executable code or instructions. The application does not invoke shell commands from scenario content. Do not treat user-provided catalog files as trusted until validated.

## Compliance output

Only claim supported technical controls and deployment compatibility. Recommend checks for residency, encryption, access control, audit, retention/deletion, backup locations, and third-party processors as applicable to supplied constraints. Regulations require researched interpretation and operational processes; product selection alone is insufficient. No legal-compliance assertions are made by this planning document.

## Release checks

No `.env`, tokens, private keys, personal scenario data, node_modules, virtualenv, or large binaries committed/submitted. `.env.example` contains placeholders only when introduced. Check export filenames, logs, escaping, body limits, and direct API use. Any hosted demo requires a separate security/deployment decision; it is outside MVP.
