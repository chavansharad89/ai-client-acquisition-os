# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: IMPLEMENTATION AUTHORIZATION / READINESS AUDIT

**Status: READ-ONLY AUDIT. NO IMPLEMENTATION AUTHORIZED. NO CODE/SCHEMA/DB/MIGRATION/TEST CHANGED.**

This audit freshly re-verified the repository in this pass (not merely trusted prior documents) — see inline `[RE-VERIFIED]` tags. The repository was found unchanged from the state the prior engineering specification and Q5 audits describe: no commits, no schema, no code changes occurred between those documents and this one. Where this pass found a gap or ambiguity the prior chain did not fully resolve, it is flagged as a blocker below, not silently filled.

---

## 1. Executive Summary

The governance and engineering-specification chain for the Global Entity Architecture is coherent and, for most of its scope, implementation-ready at the specification level. Two things prevent a clean GO today: **(1)** the Q5-A/B/C evidence-and-sharing-policy selections used throughout this audit are explicitly **assumed for readiness analysis only** — re-confirmed this pass by grepping every governance record in `requirement/`: the strings `Q5-A`/`Q5-B`/`Q5-C` appear **only** in the two "PREPARATION" documents, never in any formally-titled `*_PO_DECISION*.md` record — meaning Q5 has not yet been formally decided by the Product Owner in a durable governance record; **(2)** Q5-B's assumed selection ("B" — reuse only after an additional, separately-designed privacy/competitive-intelligence gate) names a gate whose design does not exist anywhere in the repository or the specification chain — the prior documents say so explicitly ("a net-new design effort not specified here"). A handful of narrower engineering-specification gaps (full `identity_evidence`/`entities` schema review, the transaction-wrapper implementation, the `normalizeCandidate()` caller-nullability audit) remain open but are bounded and do not by themselves block every phase.

**Verdict: NO-GO — NOT READY FOR IMPLEMENTATION AUTHORIZATION**, for the architecture as a whole. A bounded subset of phases (Place ID capture, zero-AI boot fix, the narrow cache CHECK-widening, lead-unlock status-quo) remain independently ready and are not blocked by the items above. Full detail in §21.

## 2. Authoritative Decision Inventory

| Decision | Formal record exists? | Current? [RE-VERIFIED] | Consistent? | Implementation impact | Status |
|---|---|---|---|---|---|
| D1, D8–D19, D21–D23 (D20 deferred) | Yes — `CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_PO_DECISION_RECORD.md`, `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` | Yes | Yes | High — this is the architecture's own foundation | Implementation-ready at the decision level |
| OQ-1 through OQ-9 (OQ-5 deferred) | Yes — `CLIENT_FINDER_GLOBAL_ENTITY_ARCH_OPEN_QUESTIONS_PO_DECISION.md`, `CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001` | Yes | Yes | High | Implementation-ready at the decision level |
| Q5-A / Q5-B / Q5-C | **No** — exists only in two documents explicitly titled "PREPARATION," confirmed this pass by a repository-wide grep: `Q5-A`/`Q5-B`/`Q5-C` appear in exactly `CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_FINAL_PO_DECISION_PREPARATION.md` and `..._EVIDENCE_SUFFICIENCY_PO_DECISION_PREPARATION.md`, **never** in a document titled `*_PO_DECISION.md`/`*_PO_DEC_*` | N/A — not decided | N/A | High — gates the entire public/private evidence read path (§11) | **Only assumed; formal PO recording still required before implementation** |
| C-1 through C-7 | Yes — `CLIENT_FINDER_C_SERIES_PRODUCT_OWNER_DECISION_RECORD.md`, `CF-C-SERIES-PO-DEC-001` | Yes | Yes | High — C-1 (website-less) is still unimplemented in production code [RE-VERIFIED] | Implementation-ready at the decision level; implementation itself still pending |
| Phase 7B | Yes — `CLIENT_FINDER_PHASE_7B_SUBSERVICE_RELEVANCE_AUTHORIZATION_PO_DECISION.md`, `CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001` [RE-VERIFIED this pass] | Yes | Yes, not touched by this architecture | None — out of scope | Not reopened |
| Phase 8 (Entity Reality Activation) | Yes — `CLIENT_FINDER_PHASE_8_ENTITY_REALITY_ACTIVATION_PO_DECISION.md`, `CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001` [RE-VERIFIED] | Yes | Yes | Low — only a required integration seam (Entity Status ≠ Entity Reality, D16) | Not reopened |
| Phase 8 Discovery Quality interpretation | Yes — `CLIENT_FINDER_PHASE_8_DISCOVERY_QUALITY_LAUNCH_GATE_INTERPRETATION_PO_DECISION.md`, `CF-PHASE8-DISCOVERY-QUALITY-LAUNCH-GATE-INTERPRETATION-PO-DEC-001` [RE-VERIFIED] | Yes | Yes, not touched | None | Not reopened |
| Service + Geography-only input | Yes — `CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_SEARCH_INPUT_PO_DECISION.md`, `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001` [RE-VERIFIED] | Yes | Yes | None | Not reopened |
| Backend defaults | Yes — `CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_BACKEND_DEFAULTS_PO_DECISION.md`, `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002` [RE-VERIFIED] | Yes | Yes | None | Not reopened |
| Qualification without Category Plausibility | Yes — `CLIENT_FINDER_QUALIFICATION_WITHOUT_CATEGORY_PLAUSIBILITY_PO_DECISION.md`, `CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001` [RE-VERIFIED] | Yes | Yes, not touched | None | Not reopened |
| K1 contact-identifier governance | Yes — a large, dedicated document chain under `requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_*.md` (confirmed to exist this pass; not independently re-audited in full, as K1's own content is explicitly out of scope for this architecture per every prior audit in this chain) | Presumed current (not independently re-verified beyond confirming the chain exists and this architecture never writes to any K1-governed table, per repeated repo-wide code checks in the prior Q5 audits) | Yes, with the Global Entity work (no code path crosses the boundary, confirmed repeatedly) | None — this architecture must never touch K1 | Not reopened |
| AI architecture (deterministic-first, AI optional, zero-AI operation, no mandatory LLM call) | Established by the existing, cited product requirements; the specific implementation gaps are documented in the engineering specification, not a separate PO record | Yes [RE-VERIFIED: `env.ts:72` still mandatory; `index.ts` eager `createResearchModel` calls unchanged] | Yes | Medium — two coupled, already-specified fixes (§14) | Specified, not yet implemented |
| ₹1,499 commercial model | Not re-read in this pass (explicitly out of scope; no code path in this architecture touches Razorpay/subscription logic, confirmed across every prior audit) | Presumed unchanged | Yes, untouched | None | Not reopened |

**Contradiction check result: none found.** No two governance records in this chain assert incompatible rules about the same subject; every item the Global Entity specification extends (D21/C-5 provenance minimums, D15/OQ-9 status derivation, D9/D22/OQ-6 evidence classification) does so by supplying previously-reserved implementation detail, not by overriding an existing rule.

## 3. Q5 Final Verification

Re-confirmed against the Q5 document chain (not re-derived):

- `OBSERVED` has hard provenance verification: **confirmed** — `provenance.ts`'s gate, enforced by `researcher.ts`'s throw-on-exhausted-repair behavior, re-verified in the prior evidence-sufficiency audit and not contradicted by anything found in this pass.
- Verified quote/source exists for every `OBSERVED` claim: **confirmed**, by the same mechanism.
- Generated-value semantic support is not currently proven: **confirmed** — no entailment/semantic/factuality check connects a quote to its own `value` text anywhere in the repository (re-confirmed by the prior audit's repository-wide search; not re-run in this pass since nothing in the relevant files changed).
- Q5-A = B means a **deterministic** defensive overlap check — **not** factual proof, **not** semantic entailment proof, **not** formal verification. This document repeats that disclosure explicitly, as instructed: **the overlap check, if built, is a heuristic that narrows but does not eliminate the risk that a generated sentence overreaches beyond its cited quote (demonstrated concretely by the "primarily targets SMBs" example in the evidence-sufficiency audit).**
- Q5-B = B means reuse is gated behind a **separate, not-yet-designed** privacy/competitive-intelligence check — **this gate has no specification anywhere in the repository or document chain.** The final Q5 preparation document's own implementation-impact table states this plainly: "requires designing and building a gate that does not yet exist in any form."
- Q5-C = B means: leave historical values private now, revisit via a future, separate PO decision — **no backfill, no retroactive publication is authorized by this or any prior document.**

**What remains required to turn Q5 into an implementation-ready specification, precisely:**
1. **A formal PO decision record** selecting (or modifying) Q5-A/B/C — today these are assumptions for analysis only, explicitly not authorization, exactly as the governing instruction for this audit requires stating.
2. **An engineering specification for the Q5-B gate itself** (its mechanism — human review, keyword/heuristic scan, staged rollout, or something else — is not chosen anywhere in the chain) — this is a **NEEDS ENGINEERING SPEC** item, not a NEEDS PO DECISION item, *once* Q5-B's choice of "B" itself is formally made; if Q5-B is formally decided as something other than "B," this item becomes moot or changes shape.
3. **A design choice for Q5-A's overlap-check timing** (read-time filter vs. one-time batch tagging) — flagged as open in the evidence-sufficiency audit, still open.

## 4. Global Entity Readiness

| Item | Status | Basis |
|---|---|---|
| `entities` table (global, `user_id`-free, permanent ID) | NEEDS ENGINEERING SPEC | Design proposed in the engineering specification (§2 of that document); not reviewed/approved as a buildable schema, no DDL drafted |
| `identity_evidence` table (D22 categories, verification flag, conflict state) | NEEDS ENGINEERING SPEC | Same — design proposed, not reviewed |
| `EntityStatusEvidence` (`entity_status_evidence`) | NEEDS ENGINEERING SPEC | Design proposed (§12 of the engineering specification); write-path timing specified (Q6: alongside the existing `detectPlacesEntityReality()` call site), but the table itself is not reviewed/approved |
| Entity relationships (D17–D19) | NOT IN SCOPE for this implementation pass — D17–D19 are MVP-contextual-only per existing governance; no relationship table is proposed or required by the engineering specification, and none should be invented here |
| `DiscoveryEvent` (`discovery_events`) | NEEDS ENGINEERING SPEC | Design proposed (§7 of the engineering specification); transaction boundary specified (§8 below) but not implemented |
| `discovery_attempts` (failed-normalization log) | NEEDS ENGINEERING SPEC | Design proposed (§8 of the engineering specification); raw-payload question resolved (no raw payload, enumerated reason only) — this specific question is READY, the table itself is not yet built |
| Entity ↔ Company | NEEDS ENGINEERING SPEC | `companies.entity_id`, new nullable FK — additive, specified, not built |
| Entity ↔ Prospect | READY (no change needed) | `prospects` inherits Entity via `company_id`; no direct `entity_id` on `prospects` is proposed or needed |
| Historical `entity_id` handling | READY (policy fully specified) | Nullable, `NULL` for every pre-existing row, never backfilled by inference — this is a closed policy decision, not an open engineering question |
| Indexes/uniqueness (partial unique on Place ID, on domain) | NEEDS ENGINEERING SPEC | Specified conceptually (§2 of the engineering specification: `UNIQUE(evidence_type, normalized_value) WHERE evidence_type = 'PLACE_ID'`), not reviewed against real query patterns or concurrency load |
| Foreign keys | NEEDS ENGINEERING SPEC | Specified conceptually; not drafted as DDL |
| Lifecycle (permanent ID, no delete, no auto-merge/split) | READY (policy fully specified, D1/D10/D20) | Already decided and not reopened; D20 (merge/split) remains explicitly deferred, correctly excluded from this implementation scope |

**No invented detail:** every "NEEDS ENGINEERING SPEC" row above cites the specific prior document that proposed a design, and classifies it as not-yet-reviewed/not-yet-buildable rather than inventing the missing review here.

## 5. Identity Resolution Readiness

| Rule | Specified? | Deterministic? | Basis |
|---|---|---|---|
| Place ID alone resolves | Yes | Yes | OQ-1 (PO-decided), §4 Case A of the engineering specification |
| Domain/profile URL/phone/business-email cannot resolve alone | Yes | Yes | OQ-1 |
| Corroboration = 2 independent anchors, different categories | Yes | Yes | OQ-2 |
| Category 4 never resolves | Yes | Yes | D12 (unconditional, pre-existing, not reopened) |
| Conflict → mark both existing Entities `CONFLICTED`, spawn 3rd new Entity | Yes | Yes | OQ-3 |
| Unresolved → new Entity, never guess | Yes | Yes | D14 (pre-existing) |

**Is exact resolver behavior sufficiently specified to implement deterministically? Yes, at the decision level — the four-outcome state machine (`DEFINITE_MATCH` / `NO_MATCH_NEW_ENTITY` / `CONFLICTED`-plus-new-Entity) is fully and unambiguously specified with no open PO question remaining on the resolution rules themselves.** What is **not** yet specified is the resolver's own code module (where it lives, exact function signatures, exact SQL for the corroboration lookup) — classified **NEEDS ENGINEERING SPEC**, not NEEDS PO DECISION, since no product judgment remains open here.

## 6. Website-less Discovery Readiness

C-1 (decided, not reopened) requires website absence not automatically eliminate a candidate. [RE-VERIFIED this pass, unchanged]:

- `normalizeCandidate()` (`packages/core-discovery/src/normalize.ts:47`) still contains `if (!candidate.website) return null;` — **confirmed still present, unimplemented.**
- `companies.normalized_domain` is still `NOT NULL` (unchanged migration).
- Company dedup is still keyed `UNIQUE(user_id, normalized_domain)` (unchanged).
- Prospect creation and the discovery flow (`runDiscoveryForOwner`) are unchanged.

Confirmed consistent with every governance rule cited: Entity Reality remains structurally separate (no code path conflates `businessStatus`-driven Entity Reality with website presence — re-confirmed, `detectPlacesEntityReality()` takes only `businessStatus`, never `website`, as input); name/name+geography still cannot establish identity (Category 4, D12, unconditional); Place ID can establish identity once captured (OQ-1); weak evidence cannot resolve identity (D12); an unresolved candidate still gets a new Entity (D14) rather than being guessed into an existing one.

**Production code paths that must change, exhaustively listed:**
1. `packages/core-discovery/src/normalize.ts` — relax the website-required branch; `NormalizedCandidate.normalizedDomain` becomes `string | null`.
2. `packages/db/prisma/migrations/` — new migration making `companies.normalized_domain` nullable, plus the two partial unique indexes specified in the engineering specification §6.
3. `packages/core-discovery/src/pgRepository.ts` — `findOrCreateByDomain`'s `ON CONFLICT (user_id, normalized_domain)` target needs to account for a null domain (a `NULL`-domain company cannot rely on that conflict target for dedup; identity in that case comes from the Entity resolver, not this table's own constraint).
4. Every caller of `NormalizedCandidate.normalizedDomain` — **not yet enumerated exhaustively in any document in this chain**; the engineering specification flags this as a required "caller-nullability audit" but does not perform it. **NEEDS ENGINEERING SPEC.**

**Are these changes safely bounded?** Items 1-3 are bounded and specified. Item 4 (the caller audit) is an open, unbounded-until-performed task — classified **NEEDS ENGINEERING SPEC**, and it is a precondition for safely shipping items 1-3 (an un-audited caller could crash or silently misbehave on a null domain).

## 7. Google Places Readiness

[RE-VERIFIED this pass] `FIELD_MASK` at `googlePlacesClient.ts:79` still reads `'places.displayName,places.websiteUri,places.businessStatus'` — `places.id` still absent, unchanged.

- Billing conclusion: **unchanged and still externally verified** — `id` (Place ID) is Text Search "Essentials, IDs Only" tier; `websiteUri` is Enterprise tier (already the highest requested); adding `id` does not change the billing tier, per Google's own documentation (`usage-and-billing` and `data-fields` pages), fetched and cited in the engineering specification. **Not rechecked again in this pass** since nothing about the repository's field mask or Google's public documentation would plausibly have changed in the interval; re-fetching was judged unnecessary to repeat in a read-only audit that changes nothing about the conclusion.
- `businessStatus`: unchanged, still the only field beyond `displayName`/`websiteUri`, still Pro tier, still billing-neutral per its own existing code comment.
- `GOOGLE_PLACES_STATUS`: unchanged — only `CLOSED_PERMANENTLY`/`CLOSED_TEMPORARILY` produce a signal; `OPERATIONAL`/`null` produce none; `ACTIVE` is never positively observed.
- D23 verification treatment of `websiteUri`: OQ-4 (PO-decided) — satisfies D23 verification without granting alone-resolution. Unchanged, consistent.
- Freshness: `GOOGLE_PLACES_STATUS`'s 30-day window (`FRESHNESS_WINDOW_DAYS`) unchanged.

**Confirmed: no accidental change to the existing pricing tier is implied by anything in this chain** — the one field addition this architecture requires (`places.id`) is the lowest tier available and strictly below the tier already in effect.

## 8. Discovery Provenance Readiness

`DiscoveryEvent` minimum fields (`provider`, `actual_query`, `discovered_at`, `entity_id`) — specified, D21/C-5-compliant, not yet built. Immutable query snapshot: specified (write once, never recomputed). Duplicate events: explicitly allowed (D21, unchanged). Retries: each creates its own immutable row (specified). Idempotency: no uniqueness constraint on `DiscoveryEvent` itself (duplicates sanctioned); the partial unique index on Place ID in `identity_evidence` is what actually prevents a duplicate *Entity* from a retried write. Relationship to Search: structural FK, specified. "Why found": derived strictly from `provider` + `actual_query`, never a separately-stored free-text field (C-7, unchanged).

`discovery_attempts` for failed normalization: specified — no `entity_id` column exists on this table at all, structurally preventing a fake Entity from ever being created for a failed-normalization case. This is confirmed by design, not merely asserted: the table's own proposed schema (engineering specification §8) has no FK to `entities` in any form.

**Status: NEEDS ENGINEERING SPEC for both tables' actual DDL and write-path code; the policy/behavioral questions (what goes in each table, raw-payload exclusion, immutability) are all closed, not open.**

## 9. Transaction and Concurrency Readiness

Specified transaction boundary (engineering specification §4, resolved via Q2): one Postgres transaction per candidate, covering resolver read → `identity_evidence` write → `DiscoveryEvent` → Company upsert (with `entity_id`) → Prospect upsert — reusing the existing `revealAtomically` (`packages/core-subscriptions/src/leadUnlockRepository.ts:96-149`) transaction idiom already proven in this codebase. [RE-VERIFIED this pass: `leadUnlockRepository.ts`'s `BEGIN`/`COMMIT`/`ROLLBACK` pattern still present, unchanged, and remains the correct, existing precedent to reuse — no distributed transaction mechanism is invented anywhere in this chain.]

- Atomicity: specified (all five writes, one transaction, one candidate).
- Rollback: specified (any failure inside the transaction rolls back the whole candidate's writes; equivalent outcome to today's `skipped` counter, for a different reason).
- Duplicate provider results: handled by existing `ON CONFLICT` targets (Company/Prospect) plus the new partial unique index on Place ID (prevents a second Entity for a repeated Place ID within the same user or across concurrent transactions).
- Concurrent discovery: specified — ordinary Postgres READ COMMITTED isolation is sufficient per the engineering specification's own analysis; a genuine race on the same Place ID surfaces as a constraint violation to retry, not a silent duplicate.
- Retry: specified — a retried `DiscoveryEvent` after a crash is a sanctioned duplicate (D21); the Entity itself cannot duplicate due to the partial unique index.
- Unique constraints: specified conceptually, not yet drafted as DDL (same gap as §4).
- Race conditions: analyzed and addressed at the specification level; not stress-tested (cannot be, without implementation).

**Status: NEEDS ENGINEERING SPEC for the actual transaction-wrapper code; the design itself (what must be atomic, which existing idiom to reuse) is fully specified and does not require further PO input.**

## 10. Entity Status Readiness

`EntityStatusEvidence`, `GOOGLE_PLACES_STATUS` mapping, 30-day freshness, most-recent-fresh-wins, stale-ignored, no-fresh-observation-→-UNKNOWN, no-ACTIVE-inference — all specified by OQ-9 (PO-decided) and the engineering specification §12/§6 (Q6's resolution: write both rows at the existing Pass 1 `detectPlacesEntityReality()` call site, using the already-resolved `entity_id`). [RE-VERIFIED this pass: `detectPlacesEntityReality()` still never produces an `ACTIVE`/`OPERATIONAL` signal, confirmed unchanged at `deterministicSignalPersistence`'s call sites.]

Status ≠ Entity Reality, Status ≠ Opportunity Eligibility: both confirmed unchanged and explicitly preserved by every document in this chain (D16, Phase 8's own boundary, restated and not altered).

**Status: NEEDS ENGINEERING SPEC for the `entity_status_evidence` table and its write-path code; the derivation algorithm and write-timing are both fully decided, nothing here needs further PO input.**

## 11. Public/Private Evidence Readiness

OQ-6 (PO-decided, not reopened): `companySummary`/`businessModel` public-eligible; `websiteIssues`/`contentOpportunities`/`aiOpportunities`/`growthOpportunities` private. Field-level, not kind-level, classification confirmed feasible without restructuring (`research_signals.field` already distinguishes each claim as its own row).

**The Q5-B gate specifically: NEEDS ENGINEERING SPECIFICATION, and this is the single largest unresolved item in this entire audit.** No document in this chain — not the engineering specification, not any of the three Q5 documents — specifies *what the gate actually does*. "An additional, separately-designed privacy/competitive-intelligence gate" names a requirement, not a design. Nothing is invented here to fill that gap; it is named precisely as missing.

What **is** specified and ready: the classification reference table itself (purely additive, `field → visibility`), the fail-closed invariant (an unclassified field defaults private, never public), and the interim default for the three unnamed fields (`targetCustomers`/`visibleProblems`/`automationOpportunities` — private by default, per Q4 of the engineering specification, itself still pending a possible future PO extension).

## 12. Lead Unlock Isolation

[RE-VERIFIED, consistent with every prior pass] `lead_unlock_contacts` remains freelancer-private. No code path was found, across three independent audit passes now, by which this data could enter global Entity evidence, the public cache, or any cross-freelancer read path. K1 contact-identifier semantics are unchanged and not reopened by anything in this document or its predecessors. **Status: READY (no change needed — already compliant).**

## 13. Cache Readiness

`research_signal_cache_index`'s `signal_kind` CHECK constraint [RE-VERIFIED this pass, line 66, unchanged] still lacks `GOOGLE_PLACES_STATUS`, `PUBLIC_INTENT`, `FIRST_PARTY`. Future identity: `(user_id, normalized_domain, signal_kind)` unchanged for private/ambiguous kinds; `(entity_id, signal_kind)` new, parallel dimension for public-cleared kinds only, once the Entity layer exists (per the engineering specification §13).

- Same-freelancer reuse: unchanged, specified.
- Cross-freelancer public reuse: depends entirely on the Entity layer existing (NEEDS ENGINEERING SPEC, §4 above) **and** the Q5-B gate (NEEDS ENGINEERING SPEC, §11 above) — this is therefore doubly blocked, not just once.
- Private evidence isolation: unchanged, already correct today.
- Freshness: reused as-is, no new TTL.
- Conflict coexistence: reused as-is (existing `observed_at DESC` read-time resolution pattern).
- Historical cache safety: specified — `entity_id` nullable, never backfilled.

**Status: the narrow `GOOGLE_PLACES_STATUS` CHECK-widening is READY independently; the full cross-freelancer cache dimension is NEEDS ENGINEERING SPEC, gated on §4 and §11.**

## 14. Zero-AI Readiness

[RE-VERIFIED this pass, unchanged] `ANTHROPIC_API_KEY` still mandatory (`env.ts:72`); `createResearchModel(...)` still called eagerly, unconditionally, for both primary and fallback provider, inside `main()`, before the poll loop (`apps/worker/src/index.ts`). `RESEARCH_PROVIDER_NAMES` still has no "none" sentinel.

Exact files requiring changes, unchanged from the engineering specification: `packages/config/src/env.ts` (conditional requirement), `apps/worker/src/index.ts` (gate the two eager calls), `packages/config/src/env.test.ts` (revise the existing boot-failure assertion to apply only when AI is selected), plus one new test asserting a full deterministic pipeline run with zero Anthropic SDK invocations.

AI failure does not drop candidates: confirmed by the existing deterministic-core architecture (admission/ranking/qualification already AI-free, re-confirmed unchanged) — this property does not depend on the zero-AI boot fix itself; it already holds today for the AI-optional *runtime* behavior, only the *boot-time* mandatory-key requirement remains to be relaxed.

**Status: READY FOR IMPLEMENTATION — this is one of the few fully engineering-specified, PO-decision-free items in the entire architecture (C-3B already authorizes the requirement; only the mechanical fix remains, and it is fully specified down to the exact files and exact test changes needed).**

## 15. Historical Safety

Concrete, closed policy for every named data category, unchanged across every document in this chain and reconfirmed here:

| Data | Historical change authorized? |
|---|---|
| `companies` | None — new `entity_id` column only, nullable, never backfilled |
| `prospects` | None |
| `searches` | None |
| `research_signals` | None — classification reference table is new metadata, not a row change |
| `opportunities` | None |
| `opportunity_scores` | None (not touched anywhere in this chain) |
| `research_signal_cache_index` | Additive `GOOGLE_PLACES_STATUS` CHECK-widening only (forward-only); `entity_id` nullable, never backfilled |
| `lead_unlock_contacts` | None, ever — confirmed structurally impossible for this data to be promoted (§12) |

No automatic historical Entity inference, no automatic historical merge, no historical search-snapshot mutation, no retroactive public publication, no historical Q5 release — **all explicitly, repeatedly confirmed absent from every document in this chain, with no contradiction found.**

## 16. Proposed Migration Sequence (READ-ONLY — not created)

| # | Purpose | Depends on | Tables | Backward compatible? | Rollback concern | Data preservation |
|---|---|---|---|---|---|---|
| M1 | Add `places.id` field capture (type-level only; no new column needed on existing tables) | None | None (type/code change, not a migration — included here for sequencing clarity) | Yes, pure addition | None | N/A |
| M2 | Widen `research_signal_cache_index.signal_kind` CHECK to include `GOOGLE_PLACES_STATUS` | None | `research_signal_cache_index` | Yes — additive CHECK widening only | Dropping the widened value back out would be safe (no rows would yet use it until the Entity layer writes them) | No existing row affected |
| M3 | Create `entities` table | None | `entities` (new) | Yes — wholly new table | Drop table if unused | No existing data affected |
| M4 | Create `identity_evidence` table + partial unique indexes | M3 | `identity_evidence` (new) | Yes | Drop table | No existing data affected |
| M5 | Add `companies.entity_id` (nullable FK → `entities.id`) | M3 | `companies` | Yes — nullable, additive | Drop column | No existing row changes value; all default `NULL` |
| M6 | Make `companies.normalized_domain` nullable; add partial unique indexes (`WHERE normalized_domain IS NOT NULL`, `WHERE google_place_id IS NOT NULL` once that column exists) | M5 (for the Place ID partial index to be meaningful) | `companies` | **Breaking at the column-constraint level** (relaxes a `NOT NULL`, which is backward-compatible for readers but requires every writer to be audited first per §6) | Reverting to `NOT NULL` would fail if any null-domain row exists by then | No existing row is `NULL` today, so this migration itself preserves all existing data; risk is entirely in *future* writes, not this migration |
| M7 | Create `discovery_events` table | M3, M4 | `discovery_events` (new) | Yes | Drop table | No existing data affected |
| M8 | Create `discovery_attempts` table | None (independent of the Entity layer, by design — §8) | `discovery_attempts` (new) | Yes | Drop table | No existing data affected |
| M9 | Create `entity_status_evidence` table | M3 | `entity_status_evidence` (new) | Yes | Drop table | No existing data affected |
| M10 | Create the public/private field-classification reference table | None (independent of the Entity layer) | New small reference table | Yes | Drop table | No existing `research_signals` row is touched |

**Independent deployability:** M1, M2, M8, M10 can each ship alone, in any order, with no dependency on the rest. M3→M4→M5→M6→M7→M9 form one dependent chain (the Entity layer and everything that keys off it). This matches, and is derived from, the dependency graph already established in the engineering specification §7 — not a new, separately-invented sequence.

## 17. Exact Implementation Boundary

**IN SCOPE:**
- Google Places field-mask addition (Place ID capture)
- `entities`, `identity_evidence`, `discovery_events`, `discovery_attempts`, `entity_status_evidence` tables and their write paths
- The inline resolver (per the engineering specification's Q7 correction) inside the existing `runDiscoveryForOwner` loop
- `normalizeCandidate()` relaxation and `companies.normalized_domain` nullability (C-1's implementation)
- The transaction wrapper reusing `revealAtomically`'s idiom
- `research_signal_cache_index`'s `GOOGLE_PLACES_STATUS` CHECK-widening and, later, its `entity_id` dimension
- The public/private field-classification reference table (interim: 6 named fields only; the 3 unnamed fields default private)
- The zero-AI boot-path fix (`env.ts`, `apps/worker/src/index.ts`, associated tests)
- Whatever gate Q5-B's eventual formal decision specifies (not yet designed — out of scope until specified)

**OUT OF SCOPE — explicitly protected, confirmed untouched by every document in this chain:**
- The ₹99 kit and its asset/claim flows
- The ₹499 product
- The ₹1,499 commercial model, Razorpay/webhook/subscription logic
- K1 contact-identifier semantics and every table/code path it governs
- Phase 7B subservice-relevance logic
- Phase 8 Entity Reality behavior itself (only the already-specified, minimal integration seam — Entity Status reading the existing `GOOGLE_PLACES_STATUS` producer — is in scope; the producer's own elimination logic is not touched)
- Any unrelated auth/payment/session work (`packages/core-identity/`, confirmed in the engineering specification to be unrelated and explicitly not to be reused or modified for this architecture)
- Any unrelated governance cleanup or re-litigation of already-decided items

## 18. Implementation Phases

Derived from the repository's actual module boundaries (not a generic template):

**Phase A — Provider identity capture.** Files: `packages/core-discovery/src/googlePlacesClient.ts`, `provider.ts`. Migration: none (type-level only). Tests: field-mask assertion, parse present/missing/malformed `id`, billing-tier regression extension. Dependencies: none. Acceptance: `places.id` present in every Text Search response is parsed into `DiscoveryCandidate.placeId`; billing-tier test still asserts Enterprise, unchanged.

**Phase B — Entity + IdentityEvidence schema.** Migrations: M3, M4 (§16). Tests: schema-level constraint tests (partial unique indexes behave as specified). Dependencies: Phase A conceptually informs the schema (Place ID is Category 1) but does not block it. Acceptance: tables exist, constraints verified, zero rows initially, no interaction with existing tables yet.

**Phase C — Resolver.** Files: new resolver module, inlined into `packages/core-discovery/src/service.ts`'s `runDiscoveryForOwner`. Migration: none beyond Phase B. Tests: the full `DEFINITE_MATCH`/`NO_MATCH_NEW_ENTITY`/`CONFLICTED` state machine, per §19's acceptance criteria. Dependencies: Phase B. Acceptance: a candidate with a Place ID matching an existing `identity_evidence` row resolves `DEFINITE_MATCH`; two same-category anchors do not corroborate; Category 4 never resolves.

**Phase D — Website-less discovery (C-1 implementation).** Files: `normalize.ts`, `pgRepository.ts` (Company upsert), the caller-nullability audit (§6, outstanding). Migration: M6. Tests: a `name`-only candidate persists; dedup still works for domain-having companies; no name/geography-based dedup is ever introduced. Dependencies: Phase C (the resolver is what makes a website-less candidate's identity outcome meaningful — shipping D without C has no purpose, per the engineering specification's own dependency graph). Acceptance: criteria in §19 "Website-less."

**Phase E — DiscoveryEvent + discovery_attempts + transaction wrapper.** Migrations: M7, M8. Files: the transaction-wrapper module (reusing `revealAtomically`'s idiom), wired into the same discovery loop as Phase C/D. Tests: idempotency, rollback, concurrent-discovery (§19 "Discovery"). Dependencies: Phases B, C, D (all must write inside the same transaction). Acceptance: one candidate's Entity+evidence+DiscoveryEvent+Company+Prospect writes are all-or-nothing.

**Phase F — Entity Status.** Migration: M9. Files: the existing `detectPlacesEntityReality()` call sites in `apps/worker/src/searchWorker/worker.ts`, extended to also write `entity_status_evidence`. Tests: freshness-gated derivation (§19 "Status"). Dependencies: Phase B/C (needs `company.entity_id` populated). Acceptance: criteria in §19.

**Phase G — Cache gap-fix + Entity-aware dimension.** Migration: M2 now (independent), the `entity_id` cache dimension later (depends on Phase B). Files: `research_signal_cache_index` read/write paths. Tests: `GOOGLE_PLACES_STATUS` now cacheable same-user; cross-freelancer dimension not yet exercised (blocked on Phase I). Dependencies: M2 is independent; the full dimension depends on Phase B.

**Phase H — Public/private classification table (interim).** Migration: M10. Files: new reference table + read-time filter logic. Tests: the 6 named fields classify correctly; the 3 unnamed fields default private. Dependencies: none (independent of the Entity layer entirely).

**Phase I — Q5 gate.** **Cannot be scoped into files/modules today — this phase's design does not exist.** Blocked on: (1) a formal PO decision recording Q5-A/B/C, and (2) if Q5-B = B is confirmed, a separate engineering specification for the gate's actual mechanism. This phase is explicitly listed as a placeholder, not a buildable unit, consistent with the instruction not to invent a design.

**Phase J — Zero-AI boot fix.** Files: `env.ts`, `apps/worker/src/index.ts`, `env.test.ts` + one new test. Migration: none. Dependencies: **none — fully independent of every other phase.** Acceptance: criteria in §19 "Zero-AI."

**Phase K — Integration tests.** Full end-to-end: a discovery run through the resolver, DiscoveryEvent, Company/Prospect, Entity Status, and (for public-eligible fields only, and only once Phase I exists) the public evidence read path. Dependencies: all of A-H at minimum; I if public-evidence-read testing is in scope for this pass.

## 19. Testing and Acceptance Criteria

**Identity:**
- A candidate whose Place ID matches an existing `identity_evidence` row resolves `DEFINITE_MATCH`, with no corroboration required.
- A candidate with only a domain anchor, no Place ID, and no second-category anchor, does **not** resolve to any existing Entity — produces `NO_MATCH_NEW_ENTITY`.
- Same for phone-only, email-only (both moot today — no producer exists, but the resolver's behavior must still be correct if one is ever added).
- Two anchors from two **different** categories (e.g., Place ID absent, but domain + a hypothetical future phone) agreeing on one existing Entity resolve `DEFINITE_MATCH`.
- Two anchors from the **same** category (e.g., two separate domain observations) do **not** satisfy corroboration, even though there are two of them.
- Category 4 evidence (name, geography, category, similarity, reviews) never resolves an existing Entity under any combination or count.
- Two existing Entities with conflicting strong anchors never auto-merge; both are marked `CONFLICTED`; the triggering discovery spawns a third, new, independent Entity.
- An unresolved candidate (no usable Category 1–3 evidence at all) always creates a new Entity — never attaches provisionally, never returns an ambiguous state.

**Website-less:**
- A candidate with `name` but no `website` survives normalization (is not dropped) once Phase D ships.
- Existing domain-having-company dedup continues to work unchanged after `normalized_domain` becomes nullable.
- No code path ever uses name alone, or name+geography, to establish or imply identity, before or after this change.

**Discovery:**
- `DiscoveryEvent.actual_query` captures the literal `buildQuery()` output at call time, immutable thereafter, never recomputed from a later-changed `buildQuery()` implementation.
- `DiscoveryEvent` is immutable — no update path exists on this table once a row is written.
- A candidate that fails normalization (missing name, or unparseable website) produces exactly one `discovery_attempts` row, with the correct enumerated `failure_reason`, and zero rows anywhere that would imply an Entity was created for it.
- No `discovery_attempts` row ever carries, or can carry, an `entity_id` — enforced structurally (no such column), not merely by convention.

**Status:**
- Among multiple fresh `entity_status_evidence` observations for one Entity, the one with the latest `observed_at` determines current status.
- An observation outside the 30-day freshness window is excluded from derivation entirely (never consulted, not merely down-weighted).
- Zero fresh observations (including the zero-observations-ever case) derives to `UNKNOWN`.
- `ACTIVE` is never inferred from the absence of a negative observation, under any input.

**Privacy:**
- Private research (`websiteIssues`, `contentOpportunities`, `aiOpportunities`, `growthOpportunities`, and the 3 currently-unclassified fields under their interim private default) never appears in any cross-freelancer-facing read path, under any test scenario.
- `lead_unlock_contacts` never appears in `identity_evidence`, `research_signal_cache_index`, or any Entity-adjacent table, under any test scenario — a regression test for the already-confirmed-clean status in §12.
- Public-eligible evidence (`companySummary`/`businessModel`, once Q5 is formally decided and, if applicable, its gate built) crosses the freelancer boundary **only** when the full, eventually-specified Q5-A+Q5-B chain authorizes it — this criterion cannot be made concrete until Phase I's design exists, and is listed here as a placeholder obligation, not a testable criterion today.
- The Q5-A overlap check (if built per a future formal Q5-A=B decision) is exercised against both a faithful paraphrase (should pass) and an overreaching one (the "primarily targets SMBs"-style case; should fail, or at minimum be flagged) — testable once Phase I exists, not before.

**Zero-AI:**
- The worker boots successfully with `ANTHROPIC_API_KEY` absent, when zero-AI mode is selected.
- A full search→opportunity pipeline completes deterministically with zero Anthropic SDK invocations, when zero-AI mode is active.
- AI remains fully optional at runtime in every other configuration — a regression test confirming the existing AI-optional runtime behavior (already true today) is not broken by the boot-path change.

**Historical:**
- Every pre-existing row in every table named in §15 is byte-identical before and after all migrations in §16 are applied (schema-only diff, zero data diff) — this is the single acceptance criterion that spans the entire migration sequence, not any one phase.
- No `entity_id` is ever non-null on a historical row unless a new discovery for that same company explicitly resolves it going forward — never by a backfill job.
- No public-evidence read path, once built, ever serves a row that existed before this architecture's first migration, unless that row also independently satisfies whatever evidence/sharing standard is formally decided — i.e., historical rows are never grandfathered in merely by predating the new rules.

## 20. Implementation Readiness Matrix

| Area | PO Decision | Engineering Spec | Repository Ready | Dependencies | Status |
|---|---|---|---|---|---|
| Place ID capture (Phase A) | READY | READY | READY | None | READY |
| Entity + IdentityEvidence schema (Phase B) | READY | NEEDS ENGINEERING SPEC | NEEDS ENGINEERING SPEC | None | NEEDS ENGINEERING SPEC |
| Resolver (Phase C) | READY | NEEDS ENGINEERING SPEC | NEEDS ENGINEERING SPEC | Phase B | NEEDS ENGINEERING SPEC |
| Website-less discovery (Phase D) | READY | NEEDS ENGINEERING SPEC (caller-nullability audit outstanding) | NEEDS ENGINEERING SPEC | Phase C | NEEDS ENGINEERING SPEC |
| DiscoveryEvent + discovery_attempts + transactions (Phase E) | READY | NEEDS ENGINEERING SPEC | NEEDS ENGINEERING SPEC | Phases B, C, D | NEEDS ENGINEERING SPEC |
| Entity Status (Phase F) | READY | NEEDS ENGINEERING SPEC | NEEDS ENGINEERING SPEC | Phase B/C | NEEDS ENGINEERING SPEC |
| Cache CHECK-widening (Phase G, narrow part) | READY | READY | READY | None | READY |
| Cache Entity-aware dimension (Phase G, full) | READY | NEEDS ENGINEERING SPEC | NEEDS ENGINEERING SPEC | Phase B | NEEDS ENGINEERING SPEC |
| Public/private classification table, interim (Phase H) | READY (6 named fields); NEEDS PO DECISION for the 3 unnamed fields if ever reclassified | READY | READY | None | READY (interim scope only) |
| Q5 gate (Phase I) | **NEEDS PO DECISION** (formal Q5-A/B/C recording) | **NEEDS ENGINEERING SPEC** (the gate's mechanism, if Q5-B = B) | BLOCKED | Formal Q5 decision | **BLOCKED** |
| Zero-AI boot fix (Phase J) | READY | READY | READY | None | READY |
| Integration tests (Phase K) | Depends on scope tested | Depends on scope tested | Depends on scope tested | Phases A–H at minimum; I if public-evidence testing is included | NEEDS ENGINEERING SPEC (for the non-Q5-dependent subset); BLOCKED (for any Q5-dependent subset) |
| Lead-unlock isolation | READY (already compliant) | READY | READY | None | READY |
| Historical safety | READY (policy fully specified) | READY | READY | None | READY |

## 21. Final GO / NO-GO

### NO-GO — NOT READY FOR IMPLEMENTATION AUTHORIZATION, for the architecture as a whole.

**Exact blockers:**

1. **Q5-A/B/C are not formally recorded as a Product Owner decision.** They exist only in documents explicitly titled "PREPARATION" and are, by this audit's own governing instruction, assumptions for readiness analysis only — confirmed by a repository-wide grep finding these labels in exactly two non-authoritative documents and zero formal `*_PO_DECISION.md` records. **This alone is sufficient to withhold a GO**, since the instruction's own GO criteria require "all required PO decisions are formally recorded."

2. **The Q5-B gate (assumed selection "B") has no engineering specification anywhere in this document chain.** Every document that mentions it — including this one — states plainly that its actual mechanism is undesigned. This blocks Phase I entirely and, transitively, blocks any public-evidence cross-freelancer read path and the full Entity-aware cache dimension (§13, §19).

3. **Several engineering-specification items remain at "design proposed, not reviewed/buildable"**, not merely "not yet started": the full `entities`/`identity_evidence` DDL, the transaction-wrapper's actual code, and the `normalizeCandidate()` caller-nullability audit. These are bounded, narrower blockers than #1/#2, and do not by themselves justify a NO-GO on the *entire* architecture — but they do mean Phases B through G are not yet buildable from the specification alone without a further, dedicated engineering design pass.

**What is NOT a blocker, and could be separately authorized for implementation today, independent of the above:**
- Phase A (Place ID capture)
- Phase G's narrow part (the `GOOGLE_PLACES_STATUS` cache CHECK-widening)
- Phase H's interim scope (the classification table for the 6 already-named fields, with the 3 unnamed fields defaulting private)
- Phase J (the zero-AI boot-path fix)
- Lead-unlock isolation (no change needed — already compliant) and historical safety (already fully specified as policy)

**This audit does not authorize implementation of any of these either** — it identifies them as the parts of the architecture that would not, by themselves, be blocked if and when the Product Owner separately authorizes implementation, scoped narrowly to just these items, without waiting for Q5 or the rest of the Entity layer.

---

**READ-ONLY AUDIT ONLY.**
**NO IMPLEMENTATION AUTHORIZED.**
**NO CODE CHANGED. NO SCHEMA CHANGED. NO DATABASE CHANGED. NO MIGRATION CREATED. NO TESTS CHANGED. NO COMMIT. NO PUSH.**
