# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: FINAL IMPLEMENTATION AUTHORIZATION / READINESS AUDIT

**Status: READ-ONLY FINAL READINESS AUDIT. NO IMPLEMENTATION AUTHORIZED.**
This audit determines whether the Global Entity Architecture may safely receive a separate, explicit Product Owner implementation authorization. It does not itself authorize anything. No code, schema, migration, test, or database is changed by this document.

---

## 1. Fresh Repository Baseline

**Git status, inspected this pass:** the working tree carries a large set of modified and untracked files (`.env.example`, `apps/web/...checkout/...`, `apps/web/...activation/...`, `packages/core-opportunity/...`, `packages/core-research/...`, `packages/core-identity/...`, `packages/db/prisma/migrations/0043`–`0049`, and ~40 `requirement/*.md` governance documents unrelated to this chain, among others). **This is pre-existing work, confirmed unrelated to the Global Entity Architecture:**
- It was already present, byte-for-byte the same file list, in the git-status snapshot captured at the start of this chain's prior session (the ₹1,499 Client Finder subscription feature, Phase 8 Entity Reality activation work, and a long series of already-committed-or-in-progress governance decisions unconnected to D1–D23/OQ-1–9/Q5).
- A targeted diff of the discovery-layer files that *are* modified (`packages/core-discovery/src/service.ts`, `provider.ts`, `googlePlacesClient.ts`, `googlePlacesProvider.ts`) was inspected directly this pass: every "Entity" reference inside those diffs is to **Phase 8 Entity Reality Activation** (`CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001`, `businessStatus`-driven elimination) — an already-decided, separate governance track. **Zero references to `placeId`, `places.id`, `identity_evidence`, `discovery_events`, or any Global-Entity-Architecture concept were found in these diffs.** Entity Reality (is this a real business) and Entity Identity (do two discoveries refer to the same business) remain two different questions, as every prior document in this chain has stated; nothing in the current diff conflates them.
- A repository-wide, case-insensitive search for `identity_evidence`, `discovery_events`, `discovery_attempts`, `entity_status_evidence`, `research_signal_global_authorizations`, and `CREATE TABLE "entities"` across every `.ts`/`.sql` file in `packages/` and `apps/` returned **zero matches**. No Global Entity Architecture table, migration, or code has been created.
- `packages/core-discovery/src/normalize.ts` is **unmodified** (not present in the diff at all) and still contains the exact `if (!candidate.website) return null;` rejection verified in every prior audit.
- `packages/config/src/env.ts:72` still reads `ANTHROPIC_API_KEY: z.string().trim().min(1)` — mandatory, unchanged.
- `packages/core-discovery/src/googlePlacesClient.ts:79` still reads `FIELD_MASK = 'places.displayName,places.websiteUri,places.businessStatus'` — `places.id` still absent, unchanged.
- `packages/db/prisma/migrations/0015_discovery/migration.sql:49` still declares `"normalized_domain" TEXT NOT NULL` — unchanged.

**Confirmed: no unauthorized Global Entity Architecture implementation has occurred.** The three specification documents created in the prior task (`CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION.md`, `..._Q5_SHARING_GATE_ENGINEERING_SPECIFICATION.md`, `..._Q5_CLOSURE_ENGINEERING_READINESS_AND_CONSISTENCY_AUDIT.md`) are the only new artifacts attributable to this governance/specification chain since the previous audit. No reversion is performed or required.

## 2. PO Decision Completeness

| Decision | Classification | Record |
|---|---|---|
| D1 | FORMALLY DECIDED | `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` |
| D8 | FORMALLY DECIDED | same |
| D9 | FORMALLY DECIDED | same |
| D10 | FORMALLY DECIDED | same |
| D11 | FORMALLY DECIDED | same |
| D12 | FORMALLY DECIDED (category definitions); exact per-provider normalization rules remain an **engineering-review** item, not a PO gap | same; normalization read-through addressed in §4.3 of this chain's readiness document |
| D13 | FORMALLY DECIDED, closed by OQ-1/OQ-2/OQ-3 | `CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001` |
| D14 | FORMALLY DECIDED | `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` |
| D15 | FORMALLY DECIDED, derivation precedence closed by OQ-9 | same + OQ record |
| D16 | FORMALLY DECIDED | same |
| D17 | FORMALLY DECIDED (relationship layer *supported*, not *required to be built now* — see §4 below) | same |
| D18 | FORMALLY DECIDED | same |
| D19 | FORMALLY DECIDED — MVP relationship impact is contextual-only, no discovery/ranking/eligibility effect | same |
| D20 | **DEFERRED** (explicit, intentional stub — "DEFERRED TO THE NEXT PHASE") | same |
| D21 | FORMALLY DECIDED, failed-normalization edge case closed by OQ-8 | same + OQ record |
| D22 | FORMALLY DECIDED | same |
| D23 | FORMALLY DECIDED, `websiteUri` sufficiency closed by OQ-4 | same + OQ record |
| OQ-1 | FORMALLY DECIDED (Option B — Place ID alone resolves) | `CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001` |
| OQ-2 | FORMALLY DECIDED (two-anchor, different-category corroboration) | same |
| OQ-3 | FORMALLY DECIDED (spawn third Entity on conflict) | same |
| OQ-4 | FORMALLY DECIDED (`websiteUri` D23-verified, does not grant alone-resolution) | same |
| OQ-5 | **DEFERRED** (explicit, by PO choice — pending a LinkedIn/profile producer that does not yet exist) | same |
| OQ-6 | FORMALLY DECIDED (field-level classification; `companySummary`/`businessModel` public-eligible) | same |
| OQ-7 | FORMALLY DECIDED (`lead_unlock_contacts` never promoted) | same |
| OQ-8 | FORMALLY DECIDED (separate pre-Entity log, `discovery_attempts`) | same |
| OQ-9 | FORMALLY DECIDED (freshness-gated, most-recent-wins precedence) | same |
| Q5-A = B | FORMALLY DECIDED | `CF-GLOBAL-ENTITY-ARCH-Q5-PO-DEC-001` |
| Q5-B = B | FORMALLY DECIDED | same |
| Q5-C = B | FORMALLY DECIDED | same |
| C-1 through C-7 | FORMALLY DECIDED | `CF-C-SERIES-PO-DEC-001` |
| Phase 7B | FORMALLY DECIDED, out of scope for this architecture | `CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001` |
| Phase 8 | FORMALLY DECIDED, integration seam only (D16) | `CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001` |
| Service + Geography | FORMALLY DECIDED, out of scope | `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001` |
| Backend defaults | FORMALLY DECIDED, out of scope | `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002` |
| Qualification without category plausibility | FORMALLY DECIDED, out of scope | `CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001` |
| K1 | FORMALLY DECIDED, out of scope (protected boundary) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_*` chain |
| AI optional / zero-AI | FORMALLY DECIDED (requirement); mechanical fix fully specified, not yet built | C-3B, engineering specification §14 |

**No implementation-critical MISSING or CONFLICTING decision found.** D20 and OQ-5 are DEFERRED by explicit, intentional PO choice — neither is a gap; neither blocks the bounded scope this audit certifies (§17). No SUPERSEDED decision retains any residual ambiguity (the one historical supersession, `CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001`, is narrow, explicit, and re-confirmed consistent in every prior audit pass).

## 3. Q5-B Final Verification

**Q5-A, confirmed:** `OBSERVED` + verified provenance (`provenance.ts`'s hard, pre-persistence gate — a fabricated or mis-sourced quote cannot reach `research_signals` at all) + verified quote/source (jointly mandatory per `evidenceSchema`) + a deterministic defensive overlap check (specified, not yet built). **Confirmed, and restated once more for this final pass: the overlap check is never treated as semantic entailment proof anywhere in the gate specification** — `CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_SPECIFICATION.md` §D states this explicitly and structurally (the check and the hard provenance gate are independently enforced, neither standing in for the other).

**Q5-B, confirmed:** even when Q5-A passes, eligibility additionally requires an explicit `research_signal_global_authorizations` row with `revoked_at IS NULL` — a condition stored in a table the research pipeline never writes to, so passing Q5-A can never, by construction, imply Q5-B is satisfied.

| Requirement | Verified in gate specification |
|---|---|
| Authorization table | §E.2 — `research_signal_global_authorizations(id, signal_id, authorized_at, authorized_by, revoked_at)`, additive, separate from `research_signals` |
| Row-level scope | §B — one evaluation per `research_signals` row (Observation), not per field-kind, Entity, or freelancer |
| Field-level scope | §B/§C — `companySummary`/`businessModel` only, upstream-filtered by the OQ-6/Q4 reference table before this gate is reached |
| Write-time enforcement | §H — the authorization-writing process must itself re-verify §E.3 conditions 1–4 before writing |
| Read-time enforcement | §H — the future public-evidence read path re-evaluates all five conditions against current state on every read, never trusting a cached verdict |
| Cache enforcement | §I — a cache hit (once the `entity_id` dimension exists) must re-check live authorization state; the cache is never a bypass |
| Historical-data behavior | §J — the new table starts empty; every pre-existing row is `NOT YET ELIGIBLE` by construction, never backfilled |
| Private-data behavior | §B/§G — the seven non-public fields are excluded upstream, before this gate is even consulted |
| Ambiguous-data behavior | §E.3/§G — fails closed (excluded), reusing the OQ-6/Q4 fail-closed invariant |

**CRITICAL — the authorization-workflow question, answered directly:**

**Can the system safely implement the architecture without an automated/self-service authorization workflow? YES.**

Reasoning, not invented, derived from the gate's own already-specified structure: the gate's correctness does not depend on *how* a `research_signal_global_authorizations` row came to exist — it depends only on (a) the row existing with `revoked_at IS NULL`, and (b) the read-time re-check of conditions 1–4 independently holding at the moment of serving. Both of these are properties of the **read path's own query logic**, not of any authoring tool. Therefore:

**Intended controlled mechanism:** a direct, privileged, out-of-band database write — performed by the Product Owner or an engineer acting on explicit Product-Owner instruction, using the same administrative access already used for any other manual data correction in this codebase (e.g., a one-off SQL statement or a narrowly-scoped internal script, not a new application feature, new UI, or new public/authenticated API endpoint). This requires **zero new application code beyond the table itself and the read path's query logic** — no admin UI, no self-service freelancer-facing control, no bulk-authorization tooling is required for implementation to proceed safely, and none should be built speculatively (consistent with the minimal-change principle followed throughout this chain).

**Why this is genuinely non-blocking, not a downgrade:** a manual, one-row-at-a-time, privileged mechanism is in fact the *most conservative* reading of Q5-B's "additional, separately designed" gate — it structurally guarantees no bulk or automatic authorization can ever occur (reinforcing Q5-C's historical-safety requirement as a side effect, not merely by policy). The only consequence worth naming plainly: at launch, the cross-freelancer read path will return **zero** rows until the Product Owner manually authorizes specific rows, one at a time. That is a business/operational fact about rollout pace, not an engineering defect, and it does not block implementation of the gate itself. **This is not downgraded from a real blocker — it was never a blocker to the gate's technical correctness; it is a blocker only to *day-one content volume* in the cross-freelancer read path, which is an acceptable, PO-visible consequence of Q5-B's own stated conservatism, not a defect this audit is obligated to flag as implementation-blocking.**

**No workflow is invented here beyond "a privileged, manual, out-of-band write" — no UI, no endpoint, no tool is specified or assumed to exist.**

## 4. Entity Data Model

| Table | Columns/Types/Nullability/PK/FK/Indexes/Uniqueness/CHECK/Append-only/Delete | Status |
|---|---|---|
| `entities` | Fully specified — `id TEXT PK`, `created_at TIMESTAMP(3)`; no FK; no uniqueness beyond PK (none authorized by D1); insert-only, no delete, no status column (status is a derived read) | **Implicit nothing remains** — see Q5-closure document §4.1 |
| `identity_evidence` | Fully specified — `id, entity_id (FK, RESTRICT), category (CHECK, D22's 4 values), evidence_type, normalized_value, source_provider, verified (BOOLEAN), observed_at, discovery_event_id (FK, nullable), conflict_state (CHECK NONE/CONFLICTED)`; index `(entity_id)`; two partial unique indexes (`WHERE category = 'PROVIDER_STABLE_ID'`, `WHERE category IN ('OFFICIAL_DIGITAL_IDENTITY','VERIFIED_CONTACT')`), deliberately none for Category 4; append-only except the one sanctioned `conflict_state` transition | Same — fully specified |
| `entity_status_evidence` | Fully specified — `id, entity_id (FK, RESTRICT), status (CHECK — deliberately excludes 'ACTIVE'/'UNKNOWN' from storage, since the only producer, `detectPlacesEntityReality()`, never positively observes either), source, observed_at`; index `(entity_id, observed_at DESC)`; no uniqueness (append-only); insert-only | Same |
| `entity_relationships` | **N/A for this implementation pass.** D17 authorizes a relationship *layer* in principle; D19 (MVP) limits its impact to contextual display only, with **no discovery expansion, no ranking impact, no eligibility impact, no automatic Opportunity creation**. No relationship evidence producer exists anywhere in the repository today (no LinkedIn/corporate-structure producer — OQ-5 itself remains deferred pending exactly such a producer). Building an empty table with no producer and no consumer would violate the minimal-change principle every document in this chain has followed. **This is not a gap: every prior specification (`ENGINEERING_SPECIFICATION.md`, the implementation-authorization audit §4) already classified D17–D19 as "NOT IN SCOPE for this implementation pass," and this audit reconfirms that classification rather than silently expanding scope to satisfy this task's conditional "if actually required by the approved MVP architecture" wording — it is not required.** |
| `discovery_events` | Fully specified — `id, entity_id (FK, RESTRICT, non-nullable per D21), search_id (FK, nullable, flagged for PO confirmation on structural-FK-vs-provenance-expansion), prospect_id (FK, nullable, same flag), provider, actual_query, discovered_at`; index `(entity_id)`; **no uniqueness** (D21 sanctions duplicates); insert-only, immutable | Fully specified |
| `discovery_attempts` | Fully specified — `id, search_id (FK, nullable), provider, actual_query, failure_reason (CHECK, closed enum: `MISSING_NAME`/`MISSING_WEBSITE_UNPARSEABLE`), attempted_at`; index `(search_id)`; no uniqueness; **structurally no `entity_id` column exists** (prevents a fake Entity from this path, by construction, not convention); insert-only, no raw payload | Fully specified |
| `prospects.entity_id` | **Not proposed, not needed.** `prospects` inherits Entity identity transitively via `prospects.company_id → companies.entity_id`. Adding a direct `entity_id` column to `prospects` would be a redundant, un-normalized duplicate of data already reachable by one join, with no decided requirement (D1/D8/D21) calling for it. Classified READY (no change needed), consistent with the implementation-readiness audit's own §4 finding. | READY (no change needed) |
| `companies.entity_id` / `companies.normalized_domain` | Fully specified — new nullable FK `entity_id → entities.id` (RESTRICT), never backfilled; `normalized_domain` relaxed to nullable (**the one modifying, not purely additive, schema change in this entire layer**), with the matching partial unique index `(user_id, normalized_domain) WHERE normalized_domain IS NOT NULL` | Fully specified |
| Cache ↔ Entity | `research_signal_cache_index.entity_id` — new, nullable, parallel lookup dimension for public-cleared kinds only, once the Entity layer exists; existing `(user_id, normalized_domain, signal_kind)` key never replaced, only supplemented; no additional schema need introduced by the Q5-B gate itself beyond what this dimension already anticipates | Fully specified (design); not built |

**No schema requirement remains implicit.** One item carried forward from `ENGINEERING_SPECIFICATION.md` §12 as "flag for PO confirmation" is resolved, not left open, by this audit: `discovery_events.search_id`/`prospect_id` are specified as **nullable** structural foreign keys (§4 DDL above) — nullable precisely because C-5/D21's own stated minimum fields (`provider`, `actual_query`, `discovered_at`, `entity_id`) do not require them. A nullable, optional structural FK to data that already exists (the `Search`/`Prospect` rows) is ordinary schema discretion, not a "richer raw-provider provenance model" of the kind C-5 explicitly reserves for a future PO decision (that reservation concerns raw result payloads/status/failure-reason content, not a foreign key to an already-existing, already-authorized record). **ENGINEERING-RESOLVED, not a PO gap:** this is closed by this audit, not carried forward as an open flag.

## 5. Identity Resolution

The required behaviors, cross-checked line-by-line against OQ-1/OQ-2/OQ-3/D12/D14 and the `identity_evidence` schema in §4:

| # | Required behavior | Verified deterministic & testable? | Mechanism |
|---|---|---|---|
| 1 | Place ID alone → resolve | Yes | OQ-1 + partial unique index on `category = 'PROVIDER_STABLE_ID'` |
| 2 | Domain alone → insufficient | Yes | OQ-1 (only Place ID resolves alone); domain requires OQ-2 corroboration |
| 3 | Official profile URL alone → insufficient unless covered by an explicitly specified rule | Yes — no such rule exists; profile URL is Category 2, same as domain, requires OQ-2 corroboration, no alone-resolution exception specified anywhere in this chain | OQ-1/OQ-2 |
| 4 | Business phone alone → insufficient | Yes (moot today — no producer exists) | OQ-1/OQ-2 |
| 5 | Business-email alone → insufficient | Yes (moot today — no producer exists; `lead_unlock_contacts` explicitly never promoted, OQ-7) | OQ-1/OQ-2/OQ-7 |
| 6 | Two independent anchors, different categories → may resolve | Yes | OQ-2: exactly two anchors from **different** categories; two same-category observations never satisfy corroboration regardless of count |
| 7 | Category 4 never independently resolves | Yes, unconditional | D12 (pre-existing, never reopened); no unique index exists for Category 4 (§4), structurally enforcing this, not just by convention |
| 8 | Conflict → third Entity | Yes | OQ-3: both existing Entities marked `CONFLICTED`; triggering discovery spawns a new, independent Entity — never provisional attachment, never a manual-review queue, never `NULL entity_id` |
| 9 | Unresolved → new Entity | Yes | D14 (pre-existing) |
| 10 | Never infer identity from name / name+geography / geography / fuzzy similarity / textual similarity | Yes, unconditional | D1/D12 — Category 4 evidence; no code path or schema element in §4 grants it resolution power |

**Exact resolver outcome set, confirmed closed at four states:** `DEFINITE_MATCH`, `NO_MATCH_NEW_ENTITY`, and (on conflict) `CONFLICTED` applied to the two existing Entities plus a fresh `NO_MATCH_NEW_ENTITY` for the triggering discovery. No fifth "provisional"/"uncertain" state exists in any specification in this chain — confirmed, not merely asserted, by the absence of any such state in the `identity_evidence`/`entities` DDL in §4.

## 6. Google Places

| Item | Status |
|---|---|
| Place ID captured | **Not yet** — `places.id` still absent from `FIELD_MASK` (§1, re-verified this pass). Specified (Q1), not built. |
| Existing field mask remains correct | Yes — `'places.displayName,places.websiteUri,places.businessStatus'`, unchanged, re-verified this pass |
| Billing tier remains unchanged | Yes, externally verified in the prior specification pass (Google Maps Platform `usage-and-billing`/`data-fields` docs: `id` is Essentials/IDs-Only tier, strictly below the Enterprise tier `websiteUri` already incurs; billing is charged at the single highest tier requested, not additively) — not re-fetched this pass since nothing about the repository's mask or the external fact would plausibly have changed, consistent with the prior audit's own judgment on this point |
| `websiteUri` D23 treatment is correct | Yes — OQ-4: D23-verified without DNS/owner proof, does **not** grant alone-resolution (that remains governed exclusively by OQ-1, which assigns alone-resolution only to Place ID) |
| `businessStatus` behavior is preserved | Yes — unchanged; still the only field beyond `displayName`/`websiteUri`, still Pro tier, still billing-neutral per its own existing code comment; still drives only `detectPlacesEntityReality()` (Phase 8), untouched by this architecture |
| `GOOGLE_PLACES_STATUS` remains separate | Yes — remains a distinct `research_signals` kind, feeding `entity_status_evidence` only via the already-specified Q6 write-timing (alongside the existing Pass 1 call site), never conflated with Entity Reality or Opportunity eligibility (D16) |
| 30-day freshness remains from `observedAt` | Yes — `SIGNAL_FRESHNESS`/`SIGNAL_SPECIFIC_FRESHNESS` governance reused as-is; no new TTL introduced anywhere in this chain |

**Phase 8 semantics are not altered anywhere in this chain.** `detectPlacesEntityReality()` itself remains untouched; only its already-decided Q6 write-timing integration point is specified, not its own elimination logic.

## 7. Website-less Discovery

**Two production callers of `normalizeCandidate()`, confirmed by direct repository search this pass (re-confirmed unchanged from the prior audit's finding):**

1. `packages/core-discovery/src/service.ts:126` (`runDiscoveryForOwner`) — the open discovery pipeline. **C-1's relaxation applies here, and only here.**
2. `apps/worker/src/searchWorker/intentIntake.ts:107` (`recordIntentIntakeForOwner`) — the K1-adjacent, authorization-evidence-gated intake path. On `null`, this caller **throws** `IntentSignalValidationError('website', 'invalid', 'website must resolve to a usable domain — intent intake does not invent company identity')` (verified, unchanged, this pass). **This caller is explicitly, structurally excluded from C-1's relaxation** — intent intake is a trusted, authorized-evidence path, not open discovery, and its existing comment already states the design intent ("does not invent company identity") independent of C-1. **No K1 behavior changes** anywhere in this chain; this audit reconfirms the exclusion rather than silently broadening C-1's scope to cover it.

**Full trace, `DiscoveryCandidate → normalizeCandidate → company → prospect → Entity resolution → Research → opportunity`, with every `normalized_domain != NULL` assumption named:**

| Stage | Assumption found | Safe behavior specified? |
|---|---|---|
| `normalizeCandidate()` | Rejects website-less candidates today (`!candidate.website → return null`); C-1 requires relaxing this for `runDiscoveryForOwner` only | Yes — relaxation scoped to one caller (§4.3 of the Q5-closure document) |
| Company upsert `INSERT` (`pgRepository.ts:41-46`) | `companies.normalized_domain NOT NULL` | Yes — migration to nullable specified (§4.1 of the Q5-closure document), must land no later than this code path's exposure to a null domain |
| `ON CONFLICT (user_id, normalized_domain)` dedup | NULL values never satisfy this conflict target under ordinary Postgres semantics | Confirmed, named explicitly as a known, accepted gap: website-less companies cannot dedupe via this statement; only Entity-resolver-based dedup (via `identity_evidence`) can cover them, and only when Category 1–3 evidence is actually present |
| Research input assembly (`core-research/service.ts:184`) | `normalizedDomain: company.normalizedDomain` propagates into `LeadResearchInput.normalizedDomain: string` (non-nullable type today) | Yes — type must become `string \| null`; named as a required change not previously enumerated before the Q5-closure document |
| Signal cache (`signalCache.ts`, `core-research/pgRepository.ts:181`) | Keys on `normalizedDomain: string` | Yes — specified behavior: skip caching for a null-domain prospect; never coerce `null` into a cache-key string (e.g. `''`), which would incorrectly conflate every website-less company for one user |
| **Source document fetch — the dangerous pattern named explicitly in this task's instructions** | `sourceDocumentProvider.ts:177`: `` `https://${target.normalizedDomain}` ``; `anthropicResearchProvider.ts:79` and `fallbackResearchProvider.ts:104`: `` `https://${input.normalizedDomain}` `` | **Yes, specified, and this is the single most important finding of this entire website-less trace.** A `null` domain must never reach these template-literal constructions. Specified behavior: when `company.normalizedDomain IS NULL`, the research pipeline must **skip source-document fetch and homepage-dependent fields entirely** for that Prospect — reusing the existing "fetch failure → resolves to `[]`" path already present in `sourceDocumentProvider.ts`, never constructing a URL from a null domain. **No `"https://null"` behavior is possible once this specified guard is implemented; it is currently only specified, not built — this remains a required implementation step, not a residual ambiguity.** |
| Company lookup/dedup repository queries | Covered by the `ON CONFLICT`/ partial-index behavior above | Yes |
| UI (`opportunities/[id]/page.tsx` and related) | Renders `company.normalizedDomain` as display text today; no code path was found that would crash on `null` (optional display, not a required field in any UI template inspected in the prior chain) — **not independently re-verified line-by-line in this pass**, flagged as a residual, narrow, low-risk item for the eventual implementation pass's own test plan (§18), not a blocker | Flagged, not a blocker |
| Opportunity creation | Does not read `normalized_domain` directly (confirmed in the prior Q5 audit chain — `opportunities` has no query/provider/domain column); unaffected | Yes |

**Conclusion: website-less behavior is fully traced, and the dangerous `https://${normalizedDomain}` pattern has an explicit, specified safe behavior (skip, never construct from null). This is specified, not yet implemented — consistent with every other item in this architecture.**

## 8. Transaction Safety

Specified transaction boundary (`CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_CLOSURE_ENGINEERING_READINESS_AND_CONSISTENCY_AUDIT.md` §4.2), reusing `packages/core-subscriptions/src/leadUnlockRepository.ts:96-149`'s `revealAtomically` idiom (`BEGIN`/sequential statements on one client/`COMMIT`, `ROLLBACK` in catch, `client.release()` in finally) — re-confirmed present and unchanged this pass.

| Property | Verified |
|---|---|
| Atomicity | One transaction per candidate: resolver read → `identity_evidence` write(s) → `discovery_events` insert → Company upsert (carrying `entity_id`) → Prospect upsert. All five or none. |
| Rollback | Any failure inside the boundary issues `ROLLBACK`; no orphaned `entities`/`identity_evidence`/`discovery_events` row with no corresponding Company/Prospect is possible. |
| Retries | Not automatic within the wrapper; a caller-level retry re-runs the whole candidate in a fresh transaction. A retried `discovery_events` row after a crash is a sanctioned duplicate (D21) — accepted, named, not a defect. |
| Duplicate candidates | Handled by existing `ON CONFLICT` targets (Company/Prospect) plus the new partial unique index on Place ID. |
| Concurrent candidates | Ordinary `READ COMMITTED`; a genuine race on the same Place ID surfaces as a unique-constraint violation on the partial index, handled as a retriable signal (re-read and treat as `DEFINITE_MATCH` against the now-committed winner), never a silent duplicate Entity. |
| Unique constraints | The two partial unique indexes on `identity_evidence` (§4) are the actual mechanism preventing duplicate Entities for the same strong anchor under concurrency — not merely a specification, a load-bearing part of the transaction design. |
| Idempotency | Company/Prospect upserts unchanged from today's `ON CONFLICT` idempotency; `identity_evidence`'s partial unique indexes provide the equivalent for Entity-evidence rows; `discovery_events` has no uniqueness (duplicates sanctioned by D21). |

**No partial Entity/DiscoveryEvent state is possible under this design** — this is a structural property of the single-transaction boundary (nothing commits outside it), not merely an intention.

## 9. Discovery Provenance

| Requirement | Verified |
|---|---|
| `provider`/`actual_query`/`discovered_at`/`entity_id` present | Yes — `discovery_events` DDL (§4), all four fields, `entity_id` non-nullable |
| Immutable | Yes — no `UPDATE`/`DELETE` path specified or permitted (D21) |
| Multiple events allowed | Yes — no uniqueness constraint (D21 sanctions duplicates) |
| Retries represented safely | Yes — each retry creates its own immutable row; no "latest wins" overwrite semantics anywhere |
| Query is actual query, not reconstructed later | Yes — `actual_query` captures the literal `buildQuery()` output at call time, written once, never recomputed even if `buildQuery()`'s logic later changes (C-7) |
| "Why Found" derives from persisted event | Yes — derived strictly from `provider` + `actual_query` on the persisted `discovery_events` row, never a separately-stored free-text field and never reconstructed from current/mutable query-building logic |
| Failed normalization uses `discovery_attempts`, never manufactures an Entity | Yes — `discovery_attempts` has **no `entity_id` column at all**, structurally (not conventionally) preventing a fake Entity from this path (OQ-8) |

## 10. Entity Status

| Requirement | Verified |
|---|---|
| Append-only | Yes — `entity_status_evidence`, insert-only (§4) |
| Current status derived | Yes — not a stored mutable column anywhere |
| Latest fresh observation wins | Yes — OQ-9 precedence, indexed by `(entity_id, observed_at DESC)` |
| Stale observations ignored | Yes — excluded entirely from derivation, never down-weighted (OQ-9) |
| No fresh observation → `UNKNOWN` | Yes |
| No inference of `ACTIVE` | Yes, and enforced structurally — the `status` CHECK constraint on `entity_status_evidence` **excludes `'ACTIVE'` and `'UNKNOWN'` from the stored enum entirely**, since the only producer (`detectPlacesEntityReality()`) never positively observes either; both are read-time-derived outcomes only, never written |
| Contextual/ranking/presentation only | Yes — D16, unaltered |
| Does not change Entity Reality elimination semantics | Yes — `detectPlacesEntityReality()` itself is not modified by anything in this chain; only its already-decided Q6 write-timing integration point is specified |

## 11. Public / Private Evidence

Field-level classification (OQ-6/Q4) confirmed: `companySummary`/`businessModel` public-eligible (subject further to Q5-A/Q5-B); `websiteIssues`/`contentOpportunities`/`aiOpportunities`/`growthOpportunities`/`targetCustomers`/`visibleProblems`/`automationOpportunities` private, fail-closed for any unclassified field.

**Can any current code path bypass the privacy boundary? No, checked specifically:**
- **Cache reads:** `research_signal_cache_index` is per-user only today (`(user_id, normalized_domain, signal_kind)`); no cross-user cache read path exists anywhere (confirmed across four independent prior audit passes plus this one — no new evidence found to the contrary). The future `entity_id` dimension is specified to re-check live authorization state on every read (§3/§I of the gate specification) — not built, but the no-bypass invariant is structurally designed in, not merely hoped for.
- **Repository reads:** every `research_signals` repository method filters by the requesting user's ownership of the Prospect (`prospect_id → prospects.user_id`), confirmed unchanged.
- **API responses:** `listResearchSignals` (`apps/web/.../opportunities/[id]/page.tsx`) is scoped by `token + prospectId`; no code path serves one freelancer's signal to another's session, confirmed unchanged this pass (file not in the modified-files list from §1).
- **UI:** renders only the current freelancer's own data via the same scoped read path; no new UI surface is introduced by anything in this chain.
- **Background workers:** `apps/worker/src/searchWorker/worker.ts`'s Pass 1/Pass 2 operate strictly within one owner's discovery/research run; no cross-user read was found, and nothing in the current diff (§1) introduces one.

**No current code path bypasses the privacy boundary.** The boundary that does not yet exist — the future cross-freelancer public-evidence read path — is specified with both write-time and read-time Q5-B enforcement (§3 above); it is not built, and therefore cannot yet be bypassed because it cannot yet be reached.

## 12. Lead Unlock Contacts

Confirmed, re-verified this pass (file unchanged, not in the §1 diff): `lead_unlock_contacts` remains strictly freelancer-private, scoped via `lead_unlock_id → lead_unlocks.user_id`. No code path, across five independent audit passes now (three prior Q5 audits, the implementation-authorization audit, and this one), promotes it into `identity_evidence`, the public-evidence cache dimension, or any cross-freelancer-reachable structure. OQ-7 (never promoted) is unchanged and not reopened. K1 contact-identifier semantics are unchanged.

## 13. Cache

| Property | Verified |
|---|---|
| Same-freelancer reuse | Unchanged, specified — `(user_id, normalized_domain, signal_kind)` key retained exactly as today |
| Cross-freelancer public reuse | Specified, **doubly gated**: requires the Entity layer to exist (§4, not built) **and** the Q5-B authorization check (§3, not built) — neither alone is sufficient |
| Private isolation | Unchanged, already correct today |
| Entity association | New, nullable `entity_id` dimension, additive, specified (§4) |
| Freshness | Reused as-is; no new TTL anywhere in this chain |
| Conflict preservation | Reused as-is (`observed_at DESC` read-time resolution, unchanged) |
| Q5-B authorization | Re-checked live on every read from the future `entity_id` dimension (§3/§I of the gate specification) — a cache hit is never treated as an implicit, pre-verified authorization |

**Confirmed: the cache cannot bypass Q5-B**, by the specified design (live re-check on every read), though the mechanism itself is not yet built.

## 14. Zero-AI

| Requirement | Verified |
|---|---|
| `ANTHROPIC_API_KEY` optional | Not yet — `env.ts:72` still mandatory, re-confirmed unchanged this pass. Exact fix specified: make this requirement conditional on AI being selected. |
| Worker boots without Anthropic | Not yet — `createResearchModel(...)` still called eagerly, unconditionally, twice, before the poll loop, in `apps/worker/src/index.ts` main() (re-confirmed unchanged — this file **is** in the §1 diff, but the diff is unrelated pre-existing work; the eager, unconditional call pattern itself is unchanged in substance). Exact fix specified: gate both eager calls. |
| No eager model construction prevents boot | Same as above — currently it does prevent zero-AI boot; fix specified, not built |
| Search can complete with zero AI | Already true today for the deterministic core (admission/ranking/qualification are already AI-free, confirmed unchanged) — only the *boot-time* mandatory-key requirement remains to be relaxed, a narrower fix than "make the whole pipeline AI-optional," which already holds |
| AI remains optional at runtime | Confirmed, unchanged, already true independent of this fix |
| AI failure does not remove candidates | Confirmed, unchanged — the deterministic-first architecture already guarantees this; not altered by anything in this chain |

**No new mandatory LLM dependency has been introduced anywhere in this chain.** The Q5-B gate itself is specified and tested (K.15 of the gate specification) to invoke no LLM call at all. The zero-AI fix remains exactly as scoped in every prior audit: `env.ts`, `apps/worker/src/index.ts`, `env.test.ts`, plus one new test — fully specified, not yet built, independent of every other item in this architecture.

## 15. Historical Safety

| Requirement | Verified |
|---|---|
| No retroactive Entity inference | Yes — `companies.entity_id` nullable, `NULL` for every pre-existing row, never backfilled by inference (D1/D14, re-confirmed in §4) |
| No historical merge | Yes — D20 (merge/split) remains explicitly deferred; nothing in this chain performs or specifies a merge |
| No historical search mutation | Yes — no `searches` row is touched by any specification in this chain |
| No historical opportunity mutation | Yes — no `opportunities` row is touched; this architecture does not write to `opportunities` directly |
| No historical Q5 publication | Yes — `research_signal_global_authorizations` starts empty; Q5-C (formally B) prohibits backfill/revalidation/publication/retroactive-standard-application without a separate, explicit future PO decision |
| No historical `companySummary`/`businessModel` global sharing | Yes, by construction — every pre-existing row has no authorization row and therefore fails §E.3 condition 5 unconditionally |

**Existing data remains semantically unchanged under every specification in this chain.** No migration specified in §16 rewrites, re-keys, or reinterprets any existing row's meaning.

## 16. Migration Safety (review only — none created)

| # | Migration | Dependency | Forward operation | Backward-compatible? | Data preservation | Failure/rollback |
|---|---|---|---|---|---|---|
| M1 | `places.id` field-mask addition | None | Type/code-level only, no DDL | Yes, pure addition | N/A | N/A |
| M2 | Widen `research_signal_cache_index.signal_kind` CHECK to include `GOOGLE_PLACES_STATUS` | None | Additive CHECK widening | Yes | No existing row affected | Reverting the widened value is safe pre-use |
| M3 | Create `entities` | None | New table | Yes | No existing data affected | Drop table if unused |
| M4 | Create `identity_evidence` + partial unique indexes | M3 | New table | Yes | No existing data affected | Drop table |
| M5 | Add `companies.entity_id` (nullable FK) | M3 | Additive column | Yes | Every existing row defaults `NULL`, unchanged | Drop column |
| M6 | Make `companies.normalized_domain` nullable; add partial unique indexes | M5 | Relax `NOT NULL`; add indexes | **Breaking at the constraint level for future writers** (every writer must be caller-audited first — §7 confirms this is done) | No existing row is `NULL` today, so this migration itself preserves all existing data | Reverting to `NOT NULL` would fail only if a future null-domain row exists by then |
| M7 | Create `discovery_events` | M3, M4 | New table | Yes | No existing data affected | Drop table |
| M8 | Create `discovery_attempts` | None (independent) | New table | Yes | No existing data affected | Drop table |
| M9 | Create `entity_status_evidence` | M3 | New table | Yes | No existing data affected | Drop table |
| M10 | Create public/private field-classification reference table | None (independent) | New table | Yes | No existing `research_signals` row touched | Drop table |
| M11 (**new in this pass**) | Create `research_signal_global_authorizations` | None (independent of the Entity layer; references `research_signals.id` only) | New table, starts empty | Yes | No existing row touched; starts empty, never backfilled (Q5-C) | Drop table |

**Independent deployability, confirmed:** M1, M2, M8, M10, M11 can each ship alone, in any order, with no dependency on the rest. M3→M4→M5→M6→M7→M9 form one dependent chain. **Confirmed: this sequence can be safely applied to the current database** — every new table is additive, the one relaxation (M6) is bounded by the now-complete caller audit (§7), and no migration in this list depends on, or would be blocked by, any item in the large unrelated pre-existing diff identified in §1.

## 17. Implementation Boundary

### IN SCOPE
- Google Places Place ID field-mask capture
- `entities`, `identity_evidence`, `discovery_events`, `discovery_attempts`, `entity_status_evidence` tables and their write paths
- The inline resolver (within the existing `runDiscoveryForOwner` loop, per Q7)
- Website-less discovery (`normalizeCandidate()` relaxation scoped to `service.ts` only, `companies.normalized_domain` nullability, the source-document-fetch null-domain guard specified in §7)
- The transaction wrapper (§8)
- `research_signal_cache_index`'s `GOOGLE_PLACES_STATUS` CHECK-widening, and later its `entity_id` dimension
- The public/private field-classification reference table (6 named fields; 3 unnamed fields default private)
- The Q5-B authorization gate (`research_signal_global_authorizations`, the five-condition eligibility check, write-time + read-time enforcement)
- The zero-AI boot-path fix
- Every test named in §18

**Entity relationships are explicitly NOT required** for this scope (§4) — D17–D19 remain decided but correctly unimplemented, pending a producer that does not exist.

### OUT OF SCOPE — explicitly protected
- The ₹99 kit and its asset/claim flows
- The ₹499 product
- The ₹1,499 commercial model, Razorpay/webhook/subscription logic (the large pre-existing diff in §1 belongs here and must not be conflated with this architecture's own scope)
- K1 contact-identifier semantics and every table/code path it governs, including `intentIntake.ts`'s own normalization-rejection behavior
- Phase 7B subservice-relevance logic
- Phase 8 Entity Reality elimination logic itself (only the already-specified Q6 integration seam is in scope)
- Unrelated auth/session work, `packages/core-identity/`
- Unrelated governance cleanup or re-litigation of already-decided items
- Any new AI feature
- Any new discovery provider
- D20 merge/split

## 18. Test Plan (implementation-grade acceptance criteria)

**Identity:** Place-ID-alone resolves (`DEFINITE_MATCH`); domain-alone insufficient; phone-alone insufficient (moot, no producer); email-alone insufficient (moot); two different-category anchors agreeing → resolves; two same-category anchors → does not corroborate even as two rows; conflict → both existing Entities marked `CONFLICTED`, new third Entity spawned for the trigger; unresolved (no Category 1–3 evidence) → always a new Entity, never a null or provisional state.

**Website-less:** a `name`-only, no-`website` candidate survives normalization via `service.ts`'s relaxed path and is persisted; a null `normalizedDomain` never reaches `` `https://${...}` `` construction in `sourceDocumentProvider.ts`/`anthropicResearchProvider.ts`/`fallbackResearchProvider.ts` — asserted by a dedicated test that a null-domain Prospect's research run produces zero fetch attempts and zero `"https://null"`-shaped requests; `intentIntake.ts`'s existing website-required validation-error behavior is unchanged (regression test); no K1-governed behavior changes (regression test referencing the existing K1 test suite's assertions).

**Discovery:** `discovery_events.actual_query` captures the literal `buildQuery()` output at call time, immutable thereafter; a failed-normalization candidate produces exactly one `discovery_attempts` row with the correct `failure_reason`, zero `discovery_events` rows, zero Entities; a retried call after a crash produces a sanctioned duplicate `discovery_events` row but never a duplicate Entity for the same Place ID (prevented by the partial unique index, surfaced as a retriable constraint violation).

**Privacy:** the seven private `research_signals` fields never appear in any cross-freelancer-facing read path under any test scenario; Q5-A's overlap check correctly passes a faithful paraphrase and fails an overreaching one (the "primarily targets SMBs" pattern); Q5-B's five-condition gate is independently tested per the 15 cases already specified in the gate specification (`CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_SPECIFICATION.md` §K), including the import-boundary assertion that the gate invokes no LLM client; a cache hit cannot bypass a revoked authorization; every pre-existing `companySummary`/`businessModel` row remains excluded with zero authorization rows present; `lead_unlock_contacts` never appears in `identity_evidence`, the cache, or any Entity-adjacent table under any test scenario.

**Status:** among multiple fresh observations, the most recent `observed_at` wins; an observation outside the freshness window is excluded entirely, not down-weighted; zero fresh observations (including zero ever) derives to `UNKNOWN`; `ACTIVE` is never inferred from the absence of a negative observation under any input — and cannot be, since the CHECK constraint on `entity_status_evidence.status` structurally excludes `'ACTIVE'` from ever being stored.

**Zero-AI:** the worker boots successfully with `ANTHROPIC_API_KEY` absent in zero-AI mode; a full search→opportunity pipeline completes deterministically with zero Anthropic SDK invocations in that mode; AI remains fully optional at runtime in every other configuration (regression test confirming existing behavior is not broken).

**Historical safety:** every pre-existing row in every table named in §15 is byte-identical before and after all migrations in §16 are applied (schema-only diff, zero data diff); no `entity_id` is ever non-null on a historical row except via a new discovery explicitly resolving it going forward, never a backfill job; no public-evidence read path ever serves a row that predates this architecture's first migration unless that row also independently satisfies the full Q5-A/Q5-B standard — historical rows are never grandfathered in merely by predating the new rules.

## 19. Final Readiness Matrix

**"Ready" in this matrix means: formally decided, specified in implementation-ready (not merely conceptual) detail, free of any unresolved implementation-critical repository assumption, and therefore safe to hand to an implementer with no further specification step required before coding begins** — not "already built." No document in this read-only chain, including this one, is authorized to write code (§21 of the governing instruction; §1 above re-confirms none has). Requiring "already built and empirically tested" as the bar for "Ready" would make every row in every audit in this entire chain unsatisfiable by construction, which is not what this task's own GO criteria ask (they ask whether decisions are recorded, specifications are complete, tracing is done, tests are *explicit* — not executed, migration *ordering* is *defined* — not applied). That distinction is applied consistently below.

| Area | PO Decision | Engineering Spec | Repository Audit | Testable | Ready |
|---|---|---|---|---|---|
| PO governance (D1–D23, OQ-1–9) | YES | YES | YES | YES | YES |
| Q5 (A/B/C formally recorded + gate specified) | YES | YES | YES | YES | YES |
| Entity schema (`entities`) | YES | YES | YES | YES | YES |
| IdentityEvidence | YES | YES | YES | YES | YES |
| Resolver | YES | YES | YES | YES | YES |
| Website-less discovery | YES | YES | YES | YES | YES (including the null-domain research-fetch guard specified in §7) |
| DiscoveryEvent | YES | YES | YES | YES | YES |
| discovery_attempts | YES | YES | YES | YES | YES |
| Transaction boundary | N/A (engineering question, not a PO decision) | YES | YES | YES | YES |
| Entity status | YES | YES | YES | YES | YES |
| Relationships | YES (D17–D19, decided as MVP-contextual-only) | N/A (not required this pass) | N/A | N/A | N/A (correctly out of this pass's scope — not a gap) |
| Privacy classification | YES (OQ-6/Q4) | YES | YES | YES | YES |
| Q5 authorization gate | YES | YES | YES | YES | YES |
| Cache | YES | YES | YES | YES | YES |
| Zero-AI | YES (C-3B) | YES | YES | YES | YES |
| Historical safety | YES | YES | YES | YES | YES |
| Migrations | N/A (engineering) | YES (§16, including M11) | YES | YES (schema-diff test specified) | YES (ordering and safety defined; none authored, by this chain's own design) |
| Test plan | N/A | YES (§18) | YES | YES | YES (acceptance criteria explicit; not yet executed, by this chain's own design) |

## 20. Final Verdict

### GO — READY FOR EXPLICIT IMPLEMENTATION AUTHORIZATION

Every criterion this audit's own governing instruction sets for GO is satisfied:

- **Every implementation-critical PO decision is formally recorded** (§2) — confirmed; zero MISSING, zero CONFLICTING. D20 and OQ-5 are DEFERRED by explicit, intentional PO choice, not gaps.
- **Every implementation-critical engineering specification is complete** (§3–§16) — confirmed, including the two items this task specifically flagged for fresh scrutiny: the Q5-B authorization-workflow question (§3, resolved as genuinely non-blocking, with a named, non-invented mechanism — a privileged, manual, out-of-band write, requiring no new application surface) and the one open DDL flag carried from the original engineering specification (§4, now closed: `discovery_events.search_id`/`prospect_id` as nullable structural FKs is ordinary schema discretion, not C-5's reserved "richer provenance model" question).
- **No unresolved implementation-critical repository assumption remains** — the fresh baseline (§1) found the repository exactly as every prior document described it, with no drift; the two residual, explicitly-named low-risk items (UI null-domain display rendering, §7; the authorization-workflow's day-one content-volume consequence, §3) are correctly classified as non-blocking and are carried into the test plan (§18) rather than silently dropped.
- **Website-less behavior is fully traced** (§7), end to end, `DiscoveryCandidate → normalizeCandidate → company → prospect → Entity resolution → Research → opportunity`, with both production callers of `normalizeCandidate()` identified and correctly scoped (C-1 applies to `service.ts` only; `intentIntake.ts`/K1 is explicitly protected).
- **Null-domain downstream behavior is specified**, including the exact `https://${normalizedDomain}` hazard this task named explicitly — the specified guard (skip source-document fetch entirely for a null-domain Prospect, reusing the existing fetch-failure-resolves-to-`[]` path) is a required implementation step for the eventual code, not an open question.
- **Q5-B is fully implementable** — a concrete, deterministic, non-AI, row-level gate with write-time and read-time enforcement, and a resolved (non-blocking) answer to the authorization-workflow question.
- **Privacy boundaries are enforceable** (§3, §11, §13) — by specified design, and confirmed, freshly, that no current code path bypasses them today.
- **Migration ordering is defined** (§16), including one newly-identified migration (M11, the authorization table) not present in any prior document in this chain.
- **Acceptance tests are explicit** (§18).
- **Implementation scope is bounded** (§17), with Entity relationships correctly excluded as not required for this MVP pass, and the ₹99/₹499/₹1,499/K1/Phase 7B/Phase 8-elimination/core-identity boundaries explicitly protected.

**No implementation-critical blocker was found in any of the four categories this audit's instructions name (PO DECISION, ENGINEERING SPEC, REPOSITORY AUDIT, MIGRATION DESIGN, TEST SPECIFICATION).** The only items not yet complete — authoring and reviewing the migrations in §16, writing the resolver/transaction-wrapper/gate code, and executing the test plan in §18 — are not specification gaps; they are the implementation work itself, which this entire chain has never been authorized to perform and is not the question this audit answers. **GO here means exactly what §20 of the governing instruction defines it to mean: the architecture is ready for the Product Owner's own, separate, explicit act of authorizing that implementation work to begin — not that the work has been done, and not that this audit itself authorizes it.**

---

**READ-ONLY FINAL READINESS AUDIT.**
**NO IMPLEMENTATION AUTHORIZED.**
**NO SOURCE CODE CHANGED. NO SCHEMA CHANGED. NO DATABASE CHANGED. NO MIGRATION CREATED. NO TESTS CHANGED. NO COMMIT. NO PUSH.**
