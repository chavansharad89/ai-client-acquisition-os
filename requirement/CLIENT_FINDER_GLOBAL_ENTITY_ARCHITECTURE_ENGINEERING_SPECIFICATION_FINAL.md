# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: ENGINEERING SPECIFICATION RESOLUTION PACKAGE

**Status: READ-ONLY. NO IMPLEMENTATION AUTHORIZED.**
No code, schema, migration, test, or database was modified to produce this document. Nothing has been committed or pushed. No governance decision is modified, reinterpreted, or silently resolved.

---

## 1. Purpose

This document resolves, as far as existing repository facts, already-decided governance, and verifiable external provider documentation allow, the seven genuinely open engineering questions identified in `requirement/CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_IMPLEMENTATION_READINESS_AUDIT.md` §17. It is the next read-only step after that audit's conclusion (**B — READY AFTER ENGINEERING SPECIFICATION**). It does not reopen any PO decision. Where a question's answer is found to require a product, commercial, or privacy-policy judgment, it is classified **REQUIRES PO DECISION** and left to the Product Owner, not decided here.

## 2. Authoritative Inputs

Treated as authoritative and **not reopened**:
1. `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` — D1, D8–D19, D21–D23 (D20 deferred)
2. `CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001` — OQ-1 through OQ-9 (OQ-5 deferred)
3. `CF-C-SERIES-PO-DEC-001` — C-1 through C-7
4. `CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001`
5. `CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001`
6. `CF-PHASE8-DISCOVERY-QUALITY-LAUNCH-GATE-INTERPRETATION-PO-DEC-001`
7. `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001`
8. `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002`
9. `CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001`
10. K1 contact-identifier governance and implementation
11. Existing AI architecture: deterministic-first, AI optional, no mandatory LLM calls, zero-AI operation must be possible
12. ₹1,499 commercial model (30-day AI Client Finder subscription) — unmodified

Also carried forward without re-litigation: `requirement/CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_ENGINEERING_SPECIFICATION.md` and `requirement/CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_IMPLEMENTATION_READINESS_AUDIT.md` — this document corrects two specific points from the latter (flagged explicitly in §3) rather than silently overwriting it.

## 3. Repository Verification Summary

This pass re-read repository source directly rather than trusting the prior audit at face value, per instruction. Two corrections/refinements to the prior audit's §17 recommendations are recorded here, each with its own citation:

**Correction A — Q5's premise is weaker than the prior audit characterized it.** The prior audit treated `companySummary`/`businessModel` as "factual-sounding" by field-naming convention. Reading `packages/core-research/src/prompt.ts` (`SYSTEM_PROMPT`, lines 13–31) directly shows the LLM is given **one single, generic evidence-classification methodology** (OBSERVED/INFERRED/UNKNOWN, quote-and-cite) applied uniformly to every field in `leadResearchSchema` — there is no field-specific prompt instruction distinguishing "restate a public fact" from "frame a sales angle" for any of the nine fields. `packages/core-research/src/schema.ts` (lines 287–304) and `packages/core-research/src/jsonSchema.ts` confirm no per-field `.describe()` text exists either. **This means the repository provides no evidence that `companySummary`/`businessModel` are produced any differently, in process, from `websiteIssues`/`contentOpportunities` — the only difference is the English field name itself.** This does not reopen OQ-6's classification (which remains the PO's decision), but it materially sharpens Q5's risk assessment in §4.

**Correction B — Q7's recommended placement in the prior audit is revised.** The prior audit recommended placing the Entity resolver in a *separate worker pass*, by analogy to the existing Pass 1/Pass 2 structure. Reading `apps/worker/src/searchWorker/worker.ts` directly (lines 438, 469, 520 — `runCanonicalPipeline`'s Pass 1/Pass 2 comments) shows Pass 1/Pass 2 operate on **already-created Prospects**, for signal production and ranking/admission — not for identity. Company/Prospect creation itself happens earlier and separately, inside `packages/core-discovery/src/service.ts`'s `runDiscoveryForOwner` loop (lines 123–142), which is also where `candidate.businessStatus` is captured into an in-memory map later consumed by Pass 1. Since Entity resolution must set `companies.entity_id` *before or during* Company creation (to satisfy Q2's transaction-boundary requirement), the better-supported placement is **inline inside the existing discovery loop**, not a new, separate worker pass. Revised recommendation is given in Q7 below.

No other correction to the prior audit's facts was found necessary; all other citations in §1 of the implementation-readiness audit were re-confirmed as still accurate at the time of this pass.

---

## 4. Seven Engineering Questions

### Q1 — Does adding `places.id` to the Google Places field mask change the billing tier?

**A. Exact question:** "Does adding `places.id` to the existing Google Places field mask change the current pricing/billing tier? Can the existing field mask safely add Place ID without changing the existing highest-priced tier?"

**B. Repository facts:** `packages/core-discovery/src/googlePlacesClient.ts:79` — `FIELD_MASK = 'places.displayName,places.websiteUri,places.businessStatus'`. No `places.id` requested today (confirmed, zero repo-wide hits for `placeId`/`place_id`/`places.id`). The existing code comment (`googlePlacesClient.ts:69-78`) documents a precedent: `businessStatus` was added only after confirming it did not raise the billing tier above what `websiteUri` already requires.

**C. Existing decisions constraining the answer:** None — this is a pure external-fact question, not a product decision. D21/C-5 require Place ID capture as a prerequisite for the Global Entity Architecture, but do not speak to billing.

**External provider verification performed this pass** (per instruction, not assumed):
- Fetched `https://developers.google.com/maps/documentation/places/web-service/usage-and-billing` — confirms Places API (New) SKUs include **"Text Search Essentials (IDs Only)"**, **"Text Search Pro"**, and **"Text Search Enterprise"**, and states explicitly: "You are then billed at the highest SKU applicable to your request" (i.e., billing is determined by the single highest-tier field requested, not additively per field).
- Fetched `https://developers.google.com/maps/documentation/places/web-service/data-fields` — the field-to-SKU table confirms:

| Field | SKU (Text Search) |
|---|---|
| `id` (Place ID) | **Text Search Essentials (IDs Only)** — the lowest tier |
| `displayName` | Text Search Pro |
| `businessStatus` | Text Search Pro |
| `websiteUri` | **Text Search Enterprise** — the highest tier currently requested |

**What was verified, exactly:** that `id` belongs to the lowest documented SKU tier for Text Search ("Essentials, IDs Only"), strictly below the Pro tier (`displayName`/`businessStatus`) and the Enterprise tier (`websiteUri`) the request already incurs, and that Google's own billing rule charges the single highest applicable tier per request, not a sum across fields.

**Conclusion [FACT, externally verified, no price invented]:** Adding `places.id` to the field mask does **not** change the billing tier. The request is already billed at the Enterprise tier because `websiteUri` is requested; `id` is a strictly lower-tier field and billing is determined by the highest tier present, which `websiteUri` already sets. This closes Q1 without needing a PO decision.

**D. Options:** Only one real option given the verified fact — add `places.id` to the field mask. No alternative (e.g., a separate, second API call just for Place ID) is justified once the tier-neutrality is confirmed; a second call would double request volume for no billing benefit.

**E. Engineering recommendation:** Add `places.id` to `FIELD_MASK`, following the exact precedent already used for `businessStatus` (comment + billing-tier regression test).

**F. PO dependency: ENGINEERING-RESOLVED.** Existing decisions (D21 requires Place ID capture) plus now-verified external fact are sufficient; no PO judgment call remains.

**G. Implementation contract:**
- **Affected modules:** `packages/core-discovery/src/googlePlacesClient.ts` (`FIELD_MASK`, `ExternalDiscoveryResult`), `packages/core-discovery/src/provider.ts` (`DiscoveryCandidate`).
- **Affected data structures:** add `placeId?: string | null` to both types above, following the exact existing optional/nullable pattern used for `businessStatus`. Not added to `NormalizedCandidate` (stays `{ name, normalizedDomain }`) — Place ID is identity evidence, consumed by the future resolver, not discovery normalization.
- **Invariants:** the `businessStatus`-driven Entity Reality path (`detectPlacesEntityReality`) must remain untouched by this addition.
- **Failure behavior:** a present-but-malformed `id` string is treated as absent (same pattern as a malformed `website`), never as a parse error that drops the whole candidate.
- **Idempotency:** N/A at this layer — Place ID is read-only provider data, not written anywhere yet until the Entity model (Q to come in a later spec) exists.
- **Historical-data behavior:** no backfill of `placeId` onto historical rows (none exist to backfill — the field has never been captured).
- **Tests required:** field-mask string assertion includes `places.id`; parsing of present/missing/malformed `id`; a billing-tier regression test mirroring the existing `businessStatus` precedent, extended to assert `places.id`'s presence does not change the asserted tier.

---

### Q2 — What is the safest transaction boundary for Entity + DiscoveryEvent + Prospect writes?

**A. Exact question:** "This is a data-integrity question. Determine the safest transaction boundary for: Discovery result → Entity resolution/creation → DiscoveryEvent → Company representation → Prospect → downstream search linkage. Specify exactly what must be atomic."

**B. Repository facts:**
- Today's Company/Prospect writes use **independent, per-statement `ON CONFLICT` idempotency**, not a shared transaction — `packages/core-discovery/src/pgRepository.ts:35-49` (Company upsert) and `:85-98` (Prospect upsert) are two separate, sequential `INSERT ... ON CONFLICT ... RETURNING` statements, called back-to-back inside the `runDiscoveryForOwner` loop (`service.ts:123-142`), with no `BEGIN`/`COMMIT` wrapping them.
- A genuine multi-statement transaction precedent **does exist elsewhere** in this repository: `packages/core-subscriptions/src/leadUnlockRepository.ts`'s `revealAtomically` (lines 96-149) wraps a `lead_unlocks` insert and a `lead_unlock_contacts` insert in one explicit `BEGIN`/`COMMIT`/`ROLLBACK` block. This is the existing transaction infrastructure the instruction asks to prefer over inventing something new.

**C. Existing decisions:** D21 requires `DiscoveryEvent`'s minimum fields including a resolved `entity_id`; D13/D1 require that conflicting strong evidence never auto-merges; none of these decide the transaction mechanics, which is squarely an engineering question.

**D. Options:**

| Option | Implementation impact | Data-integrity impact | Backward-compat | Privacy/security | Operational impact | Testing impact | Complexity |
|---|---|---|---|---|---|---|---|
| (a) Wrap Entity-resolve/create + `identity_evidence` write + `DiscoveryEvent` + Company (incl. `entity_id`) + Prospect in **one** Postgres transaction, mirroring `revealAtomically`'s existing pattern | Moderate — one new transactional function, reusing the existing `pg` `Pool`/client-transaction idiom already in the codebase | High — eliminates orphaned Entities/DiscoveryEvents with no Prospect | None — purely additive to a new code path | None | A longer-held transaction per candidate, but bounded (one candidate, not a batch) | Straightforward — one integration test can assert all-or-nothing | Low (reuses existing idiom) |
| (b) Keep each write independent (today's pattern), add a reconciliation/cleanup job for orphans | No new transaction code | Lower — a crash mid-sequence can leave an orphaned Entity or DiscoveryEvent | None | None | Requires a new scheduled job, new monitoring | Higher — must test the cleanup job itself, plus every partial-failure permutation | Higher net complexity despite simpler individual writes |
| (c) Make every write idempotent enough that a retry after partial failure is self-healing, without a transaction | No new transaction code | Medium — depends entirely on getting every idempotency key right across 3+ tables | None | None | Simpler ops than (b), but subtler bugs | Hardest to test exhaustively — must enumerate every possible partial-failure point | Highest design complexity, hidden in edge cases |

**E. Engineering recommendation:** **Option (a)** — one Postgres transaction spanning Entity resolution/creation, the `identity_evidence` write(s), `DiscoveryEvent` creation, and the existing Company/Prospect upserts for that single candidate. This is derived directly from the minimal-change principle (reuses `revealAtomically`'s already-proven transaction idiom rather than inventing a distributed-transaction mechanism, cleanup job, or new idempotency scheme) and from historical safety (a transaction either fully commits a consistent Entity+Company+Prospect+DiscoveryEvent set, or commits nothing — there is never a partially-written state to reason about later). Downstream search linkage (the `search_id` FK on `DiscoveryEvent`/`Prospect`) is already established data (the `Search` row exists before discovery runs) and does not need to be inside this same transaction — it is a read, not a write, at this point.

**What must be atomic, exactly:** (i) the Entity resolver's read of existing `identity_evidence` to decide `DEFINITE_MATCH`/`NO_MATCH_NEW_ENTITY`/conflict, (ii) the resulting `entities`/`identity_evidence` write(s), (iii) the `DiscoveryEvent` insert, (iv) the Company upsert (now carrying `entity_id`), and (v) the Prospect upsert — all for **one candidate**, in **one transaction**. Each candidate in a discovery run gets its own transaction (not one transaction for the whole batch), consistent with today's per-candidate loop structure and avoiding a long-held transaction across many candidates.

**Concurrent discovery / duplicate provider results:** two concurrent discoveries resolving to the same Place ID (e.g. two different users' searches hitting the same business) each run their own transaction; the second transaction's resolver read will see the first's committed `identity_evidence` row (once committed) and correctly produce `DEFINITE_MATCH` rather than a duplicate Entity — ordinary transaction isolation (READ COMMITTED, Postgres's default) is sufficient here since there is no read-modify-write race on the *same* row (the partial unique index from §2/§8 of the historical-safety discussion protects against a true race creating two Entities for the same Place ID, which would surface as a constraint violation to be retried, not a silent duplicate).

**F. PO dependency: ENGINEERING-RESOLVED.** Purely a reliability/design question with existing precedent to follow.

**G. Implementation contract:**
- **Affected modules:** `packages/core-discovery/src/pgRepository.ts` and/or a new resolver module; `packages/core-discovery/src/service.ts`'s `runDiscoveryForOwner`.
- **Affected data structures:** `entities`, `identity_evidence`, `discovery_events`, `companies` (new `entity_id` column), `prospects` (unchanged).
- **Invariants:** no `DiscoveryEvent` row ever exists without a corresponding `entity_id`; no Company row with a non-null `entity_id` ever points to an Entity that doesn't exist (enforced by FK).
- **Transaction boundary:** one Postgres transaction per candidate, as specified above.
- **Failure behavior:** on any failure inside the transaction, the entire candidate's writes roll back; the candidate is simply not persisted for this discovery run (equivalent to today's `skipped` outcome, but for a different reason — a transient DB failure, not a normalization rejection).
- **Idempotency:** unchanged from today's `ON CONFLICT`-based idempotency for Company/Prospect; `identity_evidence`'s partial unique index(es) provide the equivalent idempotency for Entity-evidence rows; `DiscoveryEvent` has no uniqueness constraint (duplicates are allowed by D21) so a retried transaction after a crash may create a second `DiscoveryEvent` for what was actually one real attempt — this is an accepted, D21-sanctioned consequence, not a bug.
- **Historical-data behavior:** no existing row is touched; this transaction boundary applies only to new writes going forward.
- **Tests required:** all-or-nothing commit on simulated mid-sequence failure; concurrent-transaction test for the same Place ID (second transaction correctly sees the first's committed evidence); retry-after-crash test confirming at most a duplicate `DiscoveryEvent` (sanctioned) but never a duplicate Entity for the same Place ID (prevented by the partial unique index).

---

### Q3 — Does `discovery_attempts` (the failed-normalization log) store the raw failed candidate payload?

**A. Exact question:** "Does `discovery_attempts` store the raw failed candidate payload? ... increases the data-retention/privacy surface for data that, by definition, couldn't even be normalized into a candidate."

**B. Repository facts:** No table in the repository stores a raw, unvalidated external payload today **except one, instructive precedent**: `webhook_events.payload` (Razorpay webhooks), which was found, by its own migration's account, to have accumulated indefinitely with no reader and real PII exposure (`packages/db/prisma/migrations/0011_webhook_payload_retention/migration.sql`, `packages/core-payments/src/webhookRetention.ts`). That migration's remedy — an **allowlist-based rebuild** (`redact_webhook_payload(jsonb)`) plus a **180-day, externally-justified retention window** (card-network chargeback window) — is the only existing precedent in this codebase for "store raw provider data, but bound it."

**C. Existing decisions:** None speak to this directly; OQ-8 only requires that failed-normalization attempts be logged separately from `DiscoveryEvent` and that they not be silently discarded "if the future discovery architecture is intended to preserve provenance" — it does not require raw payload storage specifically.

**D. Options:**

| Option | Implementation impact | Data-integrity | Backward-compat | Privacy/security | Operational | Testing | Complexity |
|---|---|---|---|---|---|---|---|
| (a) Store raw `{name, website, businessStatus}` as received | Trivial — just persist the input object | N/A (not an Entity-bearing table) | N/A, new table | Low-but-nonzero — a scraped business name/website is not sensitive personal data the way a webhook payload is, but it is still externally-sourced, unvalidated text with no defined retention | None beyond normal storage growth | Simple | Low |
| (b) Store only the enumerated `failure_reason`, no raw payload | Trivial | N/A | N/A | Lowest — nothing beyond a classification code is retained | None | Simplest | Lowest |
| (c) Store raw payload under an allowlist + defined retention window, mirroring migration 0011's pattern | Moderate — requires defining the allowlist and a redaction/expiry job, like `webhookRetention.ts` | N/A | N/A | Bounded — matches the one pattern this repo has already decided is an acceptable way to keep raw data | New redaction job to build/maintain | Moderate (needs the same tests webhookRetention.ts has) | Moderate |

**E. Engineering recommendation:** **Option (b)** as the primary recommendation — a failed-normalization attempt, by definition, never became a candidate the system could act on; the enumerated `failure_reason` (e.g. `MISSING_NAME`, `MISSING_WEBSITE_UNPARSEABLE`) is normally sufficient for debugging a normalization rule, and this repo's own precedent (migration 0011) treats "nothing reads it, it just accumulates" as the exact failure mode to avoid, not to repeat. If debugging value from raw payloads later proves necessary, option (c) is the fallback design, reusing the already-proven allowlist+retention idiom rather than inventing a new one — this should not be built pre-emptively without a demonstrated need.

**F. PO dependency: ENGINEERING-RESOLVED WITH DOCUMENTATION.** No PO judgment is required to pick the privacy-minimal default (b); the rule (no raw payload storage, enumerated reason only) must be explicitly recorded as the implementation rule so a future engineer does not casually add raw storage later without revisiting this analysis.

**G. Implementation contract:**
- **Affected modules:** new table + a small write function alongside `runDiscoveryForOwner`'s normalization-rejection branch (`service.ts:123-142`).
- **Affected data structures:** `discovery_attempts(id, provider, actual_query, attempted_at, failure_reason TEXT CHECK IN (...), search_id FK)` — no raw-payload column.
- **Invariants:** a row here never has, and never gains, an `entity_id` column — structurally prevents a "fake Entity" from ever being associated with a failed normalization.
- **Transaction boundary:** independent, single-statement insert — no multi-table atomicity needed (unlike Q2, there is nothing else to keep consistent with it).
- **Failure behavior:** if this insert itself fails, the candidate is simply dropped exactly as today (the `skipped` counter already represents this outcome; this table is additive observability, not a new failure path).
- **Idempotency:** not required — each failed attempt is its own row, duplicates are expected and harmless (mirrors `DiscoveryEvent`'s own allowed-duplicates stance).
- **Historical-data behavior:** none — this table starts empty; no historical website-less-dropped candidates can be retroactively recovered into it (the prior audit's §14 already notes this is a permanent, irreversible gap).
- **Tests required:** a `MISSING_NAME` rejection produces exactly one row with that reason; a `MISSING_WEBSITE_UNPARSEABLE` rejection produces exactly one row with that reason; no raw candidate text is persisted anywhere in either case.

---

### Q4 — Classification of `targetCustomers`, `visibleProblems`, `automationOpportunities`

**A. Exact question:** "OQ-6's 'at minimum' list named only 6 of the 9 fields currently produced; these 3 are left unclassified."

**B. Repository facts (re-verified, confirms prior audit):** `packages/core-research/src/persist.ts:53-63`'s `FIELD_KIND` maps `targetCustomers → WEBSITE`, `visibleProblems → WEBSITE`, `automationOpportunities → TECH_STACK`. All three are produced by the identical, generic OBSERVED/INFERRED/UNKNOWN methodology in `prompt.ts`'s `SYSTEM_PROMPT` — confirmed this pass, no field-specific treatment distinguishes them from either the public-eligible pair or the private four named in OQ-6.

**C. Existing decisions:** OQ-6 explicitly names only `companySummary`/`businessModel` as public-eligible and `websiteIssues`/`contentOpportunities`/`aiOpportunities`/`growthOpportunities` as private — "at minimum," implying the list was not meant to be exhaustive, but it does not say how to classify the remaining three.

**D. Options:**
- (a) Default all three to private — consistent with OQ-6's own stated bias ("interpretive, sales-angle, recommendation, opportunity, or freelancer-specific research framing remains private") being the default for anything not explicitly cleared.
- (b) Classify by analogy to field semantics: `visibleProblems` groups naturally with the interpretive/private set (it is, by name, about a specific business's shortcomings — arguably more sensitive than even the four already-private fields); `targetCustomers` and `automationOpportunities` are genuinely ambiguous between "factual restatement" and "interpretive framing."
- (c) Explicitly extend OQ-6's named list via a follow-up PO decision before implementation.

**E. Engineering recommendation:** (a) as the immediate implementation default — it requires no new judgment call and matches OQ-6's own stated bias precisely. (c) is recommended as the appropriate next governance step before any implementation actually exposes a public-evidence read path for these three fields, since classifying them is explicitly a product judgment, not something this document should decide.

**F. PO dependency: REQUIRES PO DECISION**, if and when these three fields are to be considered for public-eligible status. Until then, **ENGINEERING-RESOLVED WITH DOCUMENTATION** applies to the interim default (private), which requires no PO input to implement safely.

**G. Implementation contract (for the interim default only):**
- **Affected modules:** the §10-pattern classification reference table (`research_signal_field_classification`), populated per the implementation-readiness audit.
- **Affected data structures:** the table simply omits rows for `targetCustomers`/`visibleProblems`/`automationOpportunities`, or includes them explicitly with `visibility = 'PRIVATE'` (either is equivalent under a "default private" read-path design, but explicit rows are recommended for clarity/auditability).
- **Invariants:** any future read path that serves "public-eligible" fields must treat an unlisted `field` value as private by default (fail closed), never as public by default (fail open) — this is the single most important invariant this document specifies for §10's design.
- **Test requirement:** a query against the public-evidence read path for any of these three fields returns nothing, until/unless a future PO decision and corresponding table update changes that.

---

### Q5 — Are LLM-generated `companySummary`/`businessModel` actually safe to expose cross-freelancer?

**A. Exact question:** "Are LLM-generated `companySummary`/`businessModel` actually safe to expose cross-freelancer without a content-safety check? ... Treat this VERY carefully. Do not assume 'source is public' therefore 'LLM-generated interpretation is public.'"

**B. Repository facts, examined specifically for this question:**
- **Is the value directly copied from a public source, or transformed?** Transformed. `observationSchema` (`schema.ts`, referenced in `leadResearchSchema:287-304`) requires the model to produce a `value` plus a `classification` (OBSERVED/INFERRED/UNKNOWN), `evidence` (quotes), `basis`, and `confidence` — this is model-synthesized text, not a verbatim copy of source material, even when the underlying claim is OBSERVED.
- **Is it summarized by an LLM?** Yes — `companySummary` and `businessModel` are both `observationSchema` entries, produced by the same Anthropic model call (`anthropicModel.ts`) as every other field in the object.
- **Does it contain freelancer-specific interpretation?** **The repository provides no mechanism that would prevent this.** The system prompt (`prompt.ts:13-31`) instructs the model to research "for a freelancer deciding who to approach and what to offer" — i.e., the entire research call is framed around one freelancer's outreach decision, not a neutral third-party encyclopedia entry. There is nothing in the prompt or schema that constrains `companySummary` to exclude outreach-relevant framing while specifically permitting it in `websiteIssues`.
- **Is provenance preserved?** Yes, at the row level — each `research_signals` row for these fields retains its `research_signal_sources` (quotes/URLs). This does not resolve the interpretation-leakage concern; provenance tells you *where a quote came from*, not whether the model's synthesized `value` text itself contains competitively-sensitive framing.
- **Could the same value reveal a sales strategy or competitive research?** Cannot be ruled out from the code. Because the generation prompt is explicitly outreach-oriented and the schema does not differentiate field *purpose*, a `companySummary` could, in principle, already contain the kind of angle-oriented synthesis OQ-6 intends to keep private in `websiteIssues`/`contentOpportunities` — the only thing preventing this today is the model's own judgment about what belongs in a "summary" versus an "opportunity," not an enforced system constraint.
- **Is the current value deterministic/public-factual or model-generated interpretation?** **Model-generated interpretation**, confirmed directly — there is no non-AI producer for any of these nine fields (the only non-AI producers in the whole research pipeline are `detectPlacesEntityReality()`, producing `GOOGLE_PLACES_STATUS` only, and the intent-intake pipeline, producing `PUBLIC_INTENT`/`FIRST_PARTY` only — neither touches these nine fields).

**C. Existing decisions:** OQ-6 (PO-decided) already classifies `companySummary`/`businessModel` as public-eligible, and this record does **not** reopen that classification. OQ-6's own text, however, explicitly anticipates this exact gap: "Do not assume 'public-eligible' automatically means that cross-freelancer sharing is already implemented... the exact implementation-level field mapping... may be specified during engineering planning before implementation." This document treats the *implementation gate* (whether any actual read path exposing these fields needs a safety check first) as the open sub-question OQ-6 itself deferred — not as a reopening of OQ-6's classification.

**D. Options:**
- (a) Implement the cross-freelancer read path for these two fields with no additional safety gate, trusting the field-naming classification alone.
- (b) Add an automated content-safety check (e.g. a secondary classifier, or a keyword/heuristic scan for outreach-angle language) before any row is served cross-freelancer.
- (c) Require a human spot-check/rollout-gating period before fully enabling cross-freelancer reads of these two fields, then widen based on observed results.
- (d) Do not build the cross-freelancer *read path* for these fields at all yet, independent of the classification table — i.e., implement §10's classification table (which is harmless, purely additive metadata) but leave the actual consuming read path for a later, separately-scoped piece of work.

**E. Engineering recommendation:** **(d)**, as the minimal-change, risk-bounded answer. The classification *table* (§10 of the readiness audit) is safe to build now — it changes nothing about who can read what. The *read path* that would actually let one freelancer see another freelancer's `companySummary`/`businessModel` is the component carrying real risk, and per Correction A in §3 above, the repository provides **no evidence of a safety difference** between these two fields and the four already-private ones beyond their English names. Building that read path should wait for whichever of (b) or (c) the Product Owner decides is the right gate — this document does not pick between them, since that is a cost/risk trade-off, not an engineering fact.

**F. PO dependency: REQUIRES PO DECISION.** Not on OQ-6's classification (unchanged), but specifically on: *should the cross-freelancer read path for `companySummary`/`businessModel` ship with a safety gate (and if so, automated (b) or human-reviewed (c)), or ship ungated (a)?* This is a product-risk/cost trade-off the repository cannot resolve, and this document explicitly declines to silently authorize cross-freelancer sharing of these fields by picking an option itself.

**G. Implementation contract:** Deferred until the PO decision above is made. The one safe, immediately-buildable piece is the classification table itself (§10), which carries no exposure risk on its own and is specified under Q4 above.

---

### Q6 — Mapping the existing per-user `GOOGLE_PLACES_STATUS` signal into the new global `entity_status_evidence` table

**A. Exact question:** "Someone must decide exactly when/how a per-user signal becomes a global status observation."

**B. Repository facts, re-verified:** `detectPlacesEntityReality()` (`packages/core-research/src/deterministicSignals.ts:154-186`) is called from `apps/worker/src/searchWorker/worker.ts` during **Pass 1** (lines 494, 567, 613, 655), using a `businessStatus` value that was captured earlier, at discovery time, into an in-memory map keyed by `prospect.id` (`service.ts:123-142`, `businessStatusByProspectId`). By the time Pass 1 runs, each Prospect already has a resolved `company_id` (set at discovery time) — and, per Q7's revised recommendation below, Entity resolution will *also* have already happened at discovery time, meaning `company.entity_id` is already known by the time Pass 1 computes the `GOOGLE_PLACES_STATUS` signal.

**C. Existing decisions:** D15 requires Entity Status to be derived from append-only observations; OQ-9 (closed) specifies the exact freshness-gated, most-recent-wins derivation algorithm; neither decides the write-path timing, which is the engineering question here.

**D. Options:**
- (a) Write to **both** `research_signals` (unchanged, per-user) and the new `entity_status_evidence` table **at the same point in Pass 1** where `detectPlacesEntityReality()` already runs, using the already-resolved `entity_id` available via `prospect → company → entity_id`.
- (b) A separate, asynchronous backfill/sync job that periodically scans `research_signals` for `GOOGLE_PLACES_STATUS` rows and projects them into `entity_status_evidence`.
- (c) Derive Entity Status lazily, at read time, by joining through `companies.entity_id` directly against `research_signals`, with no separate `entity_status_evidence` table at all.

**E. Engineering recommendation:** **(a)**. Given Q7's revised finding that Entity resolution happens at discovery time (before Pass 1 ever runs), `entity_id` is already available with zero additional lookup cost at the exact point `detectPlacesEntityReality()` already executes — writing both rows in the same step keeps provenance tight (one write transaction per discovery/signal event, matching this architecture's general preference for atomic, co-located writes established in Q2) and avoids both the staleness risk of (b) and the join complexity/performance cost of (c) on every status read.

**F. PO dependency: ENGINEERING-RESOLVED.** Purely a data-flow/timing design question within already-decided D15/OQ-9 semantics; no product judgment remains.

**G. Implementation contract:**
- **Affected modules:** `apps/worker/src/searchWorker/worker.ts` (the existing `detectPlacesEntityReality()` call sites at lines 494/567/613/655), and the new `entity_status_evidence` write function.
- **Affected data structures:** `entity_status_evidence(id, entity_id, status, source, observed_at)` — written alongside, not instead of, the existing `research_signals` `GOOGLE_PLACES_STATUS` write.
- **Invariants:** `entity_status_evidence.status` is only ever `'CLOSED_TEMPORARILY'`/`'CLOSED_PERMANENTLY'` (never `'ACTIVE'`, per the already-confirmed fact that the producer never positively observes `ACTIVE`) — enforced by the same CHECK-constraint-over-enum convention already used elsewhere in this schema.
- **Transaction boundary:** the `entity_status_evidence` insert should be in the same transaction as the existing `research_signals` insert for that signal (both represent one observation).
- **Failure behavior:** if `company.entity_id` is `NULL` (Entity resolution not yet implemented, or this Company predates it), skip the `entity_status_evidence` write entirely — write only to `research_signals` as today. This is not an error state; it is the expected historical-safety behavior (§14 of the prior audit).
- **Idempotency:** mirrors `research_signals`' own append-only, no-delete, no-update pattern — a repeat observation is simply a new row, never an overwrite.
- **Historical-data behavior:** no backfill of `entity_status_evidence` for historical `GOOGLE_PLACES_STATUS` rows already in `research_signals` — those predate any Entity resolution and have no `entity_id` to attach to; they remain exactly as they are, read only through the existing per-user path.
- **Tests required:** a fresh `CLOSED_PERMANENTLY` observation with a resolved `entity_id` produces rows in both tables; a company with `entity_id IS NULL` produces a row only in `research_signals`; the derivation algorithm (OQ-9, already specified) correctly ignores stale rows and defaults to `UNKNOWN` with no `entity_status_evidence` rows at all.

---

### Q7 — Resolver orchestration placement

**A. Exact question:** "§4's resolver needs to run somewhere in the discovery pipeline... this orchestration doesn't exist and its placement... affects discovery latency and failure handling."

**B. Repository facts (re-verified this pass, see Correction B in §3):** `runDiscoveryForOwner` (`packages/core-discovery/src/service.ts:123-142`) is the existing per-candidate loop that creates Company/Prospect rows synchronously, today. The worker's Pass 1/Pass 2 (`apps/worker/src/searchWorker/worker.ts:438-525`) run later, after Company/Prospect already exist, and are scoped to signal production and ranking/admission — not identity. No existing orchestration point sits between candidate normalization and Company creation other than this same loop.

**C. Existing decisions:** None decide placement directly; D1/D8 require that Entity identity resolution happen deterministically and consistently, which is best satisfied by resolving identity at the same point Company rows are created (to avoid a window where a Company exists with an unresolved `entity_id`).

**D. Options:**
- (a) **Inline**, inside the existing `runDiscoveryForOwner` per-candidate loop, synchronously, immediately before the existing Company upsert — resolver runs, decides the Entity outcome, and the Company upsert carries the resulting `entity_id` in the same statement/transaction (per Q2).
- (b) A separate, subsequent worker pass (the prior audit's original recommendation), mirroring the existing Pass 1/Pass 2 split.

**E. Engineering recommendation (revised from the prior audit's §17 Q7, per Correction B):** **(a)**. Option (b) would require either (i) creating Company rows with `entity_id = NULL` initially and updating them later once the separate pass runs — introducing exactly the "window of inconsistency" Q2's atomicity requirement is designed to avoid — or (ii) duplicating per-candidate iteration logic across two separate loops for no benefit. Since Entity resolution's natural inputs (the candidate's Place ID/domain) are already fully available at the exact point `runDiscoveryForOwner` already iterates, and since Q2 already establishes that Entity + Company + DiscoveryEvent writes must be transactionally co-located, inlining the resolver into the existing loop is both simpler and more consistent with the rest of this architecture than introducing a new pass.

**F. PO dependency: ENGINEERING-RESOLVED.**

**G. Implementation contract:**
- **Affected modules:** `packages/core-discovery/src/service.ts` (`runDiscoveryForOwner`), plus the new resolver module and the `pgRepository.ts` changes from Q2.
- **Affected data structures:** none beyond those already specified in §2/§4 of the prior audit and Q2 above.
- **Invariants:** a Company row is never created with a `NULL` `entity_id` as a *transient* state awaiting a later pass — it is either resolved to an existing Entity, resolved to a brand-new Entity, or (only for historical rows predating this feature) permanently `NULL` by design (§14).
- **Transaction boundary:** as specified in Q2 — resolver read + Entity/evidence write + DiscoveryEvent + Company + Prospect, one transaction, one candidate.
- **Failure behavior:** a resolver failure (e.g. a DB error during the identity-evidence read) fails the whole candidate's transaction, exactly like any other failure inside that boundary — the candidate is not partially persisted.
- **Idempotency:** unchanged from Q2's specification.
- **Historical-data behavior:** unaffected — this only changes the code path for candidates processed *after* this feature ships.
- **Tests required:** a candidate with a Place ID matching an existing Entity resolves inline and the resulting Company row carries the correct `entity_id` in the same test transaction; a candidate with no matching evidence creates a new Entity inline, synchronously, with no separate pass or job involved.

---

## 5. Consolidated Engineering Decisions

| ID | Question | Resolution | Basis | PO Decision Needed? | Implementation Ready? |
|---|---|---|---|---|---|
| Q1 | Place ID billing tier | Does not change tier — `id` is Essentials/IDs-Only tier, strictly below the Enterprise tier `websiteUri` already incurs | External verification (Google Maps Platform docs, fetched this pass) | No | Yes |
| Q2 | Entity+DiscoveryEvent+Prospect transaction boundary | One Postgres transaction per candidate, covering resolver read, Entity/evidence write, DiscoveryEvent, Company, Prospect — reusing `revealAtomically`'s existing transaction idiom | Repository precedent + minimal-change principle | No | Needs engineering spec (design exists; not built) |
| Q3 | `discovery_attempts` raw payload | No raw payload; enumerated `failure_reason` only | Repository precedent (migration 0011's own lesson) + privacy-minimal default | No (documented rule only) | Needs engineering spec (design exists; not built) |
| Q4 | Classification of `targetCustomers`/`visibleProblems`/`automationOpportunities` | Default private, pending a future PO extension of OQ-6's named list | OQ-6's own stated bias | Yes, if ever reclassified public | Yes, for the private-default interim state |
| Q5 | `companySummary`/`businessModel` cross-freelancer safety | Classification table is safe to build now; the cross-freelancer *read path* must not ship until the PO picks a safety gate | Repository evidence shows no field-level production difference beyond naming — cannot self-certify safety | **Yes** | No — blocked until PO decision |
| Q6 | `GOOGLE_PLACES_STATUS` → `entity_status_evidence` mapping | Write both rows at the existing Pass 1 signal-creation point, using the already-resolved `entity_id` | Repository structure (existing call sites) + Q7's resolver timing | No | Needs engineering spec (design exists; not built) |
| Q7 | Resolver orchestration placement | Inline inside the existing `runDiscoveryForOwner` loop, not a separate worker pass (revises the prior audit) | Repository structure + Q2's atomicity requirement | No | Needs engineering spec (design exists; not built) |

---

## 6. Final Architecture Rules

**Entity:** global, `user_id`-free table; permanent ID never derived from any attribute (D1); status is a *derived* read, not a stored mutable column (see Entity Status below).

**IdentityEvidence:** exactly D22's four categories; Category 4 never independently resolves (D12, unconditional); Place ID resolves alone (OQ-1); domain/profile-URL/phone/business-email require two independent anchors from **different** categories (OQ-2); `websiteUri` is D23-verified without requiring DNS/owner proof (OQ-4), but verification does not grant alone-resolution.

**Resolution:** exactly four outcomes — `DEFINITE_MATCH`, `NO_MATCH_NEW_ENTITY`, and (on conflict) `CONFLICTED` on the two existing Entities plus a fresh `NO_MATCH_NEW_ENTITY` for the triggering discovery (OQ-3). No fifth "provisional"/"uncertain" state.

**Corroboration:** two anchors from different categories; two same-category observations never satisfy it, regardless of count (OQ-2, explicit).

**Conflict:** never auto-merge; mark both existing Entities `CONFLICTED` (D13/D18 pattern); the triggering discovery always spawns a new, third, independent Entity (OQ-3) — never attached provisionally, never a manual-review queue, never a `NULL` `entity_id`.

**Website-less discovery:** `normalizeCandidate()`'s website-required branch is relaxed (a **modifying**, not additive, change); `companies.normalized_domain` becomes nullable (also modifying); the resolver (inlined per Q7) runs for every candidate regardless of website presence; absence of a website is never Entity Reality evidence, never an identity anchor by itself, and never grounds for automatic exclusion (C-1, unchanged).

**DiscoveryEvent:** minimum fields `provider`, `actual_query`, `discovered_at`, `entity_id` (non-nullable) (D21/C-5); each retry is its own immutable row; duplicates across the same Entity are allowed (D21); written inside the same transaction as Entity/Company/Prospect (Q2).

**Failed-normalization log:** a separate `discovery_attempts` table, never carrying an `entity_id` column, storing only an enumerated `failure_reason` (Q3) — never a raw payload by default.

**Entity Status:** append-only `entity_status_evidence`; derivation is freshness-gated, most-recent-wins, defaulting to `UNKNOWN` on no fresh observation, never inferring `ACTIVE` from absence (OQ-9); written at the same point the existing `GOOGLE_PLACES_STATUS` producer already runs (Q6); separate from Entity Reality and Opportunity Eligibility (D16, unchanged).

**Public/private evidence:** field-level, not kind-level, classification via an additive reference table; `companySummary`/`businessModel` classified public-eligible per OQ-6, but their cross-freelancer *read path* is gated pending a PO decision on a safety check (Q5); `websiteIssues`/`contentOpportunities`/`aiOpportunities`/`growthOpportunities` private (OQ-6); `targetCustomers`/`visibleProblems`/`automationOpportunities` default private pending a future PO extension (Q4). Fail closed: an unclassified field is private by default, never public by default.

**Cache:** `research_signal_cache_index`'s `signal_kind` CHECK widened to include `GOOGLE_PLACES_STATUS` (narrow, additive, independently valuable); `entity_id` added as a new, nullable, parallel lookup dimension for public-cleared kinds only, once the Entity layer exists; the existing `(user_id, normalized_domain, signal_kind)` key is never replaced, only supplemented.

**Historical safety:** `entity_id` nullable, `NULL` for every pre-existing row, never backfilled by inference; `lead_unlock_contacts` never promoted to identity evidence (OQ-7, confirmed already structurally true); no historical `research_signals`/`companies`/`prospects`/`opportunities`/`searches`/`lead_unlocks` row is rewritten by this architecture.

---

## 7. Implementation Dependency Graph

Derived from the actual repository structure verified in this pass and the two prior audits — not copied from a generic template:

```
Place ID field-mask capture (Q1 — independently ready now, zero dependencies)
        │
        ▼
Entity + IdentityEvidence core tables  (new, additive — companies.entity_id nullable FK)
        │
        ▼
Resolver (inline in runDiscoveryForOwner, per Q7's revised placement)
        │
        ├──► Website-less normalization fix (normalizeCandidate() + normalized_domain
        │     nullability — MODIFYING change, must land together with the resolver,
        │     since the resolver is what makes a website-less candidate's identity
        │     outcome meaningful; shipping one without the other has no purpose)
        │
        ▼
DiscoveryEvent + discovery_attempts  (same transaction boundary as the resolver, per Q2/Q3 —
        │                              cannot precede the resolver, since entity_id is
        │                              DiscoveryEvent's mandatory field)
        ▼
Company/Prospect integration  (entity_id column populated — this is the existing
        │                       upsert code, now carrying one new field; depends on
        │                       the resolver already having run in the same transaction)
        ▼
Entity Status evidence + derivation  (Q6 — depends on company.entity_id already being
        │                              populated, since it writes alongside the existing
        │                              Pass 1 GOOGLE_PLACES_STATUS producer)
        ▼
Entity-aware cache (GOOGLE_PLACES_STATUS CHECK-widening is independently ready now;
        │            the entity_id lookup dimension depends on the Entity layer above)
        ▼
Public/private evidence classification table (Q4 — independently buildable any time
        │                                       after/alongside the above, since it is
        │                                       pure additive metadata with no runtime
        │                                       dependency on the Entity layer)
        ▼
Cross-freelancer public-evidence READ PATH (Q5 — the one node in this graph that is
                                              BLOCKED, not just "needs engineering spec" —
                                              waits on a PO decision regardless of how
                                              far everything else above has progressed)
```

Two items are **independent of this entire chain** and can proceed in any order relative to it: the zero-AI boot-path fix and the lead-unlock-isolation status-quo (both already "READY FOR IMPLEMENTATION" per the prior audit, neither touches Entity/identity code at all).

---

## 8. Remaining PO Decisions

Only genuine, newly-surfaced items — not a restatement of OQ-5:

1. **Q4 — classification of `targetCustomers`, `visibleProblems`, `automationOpportunities`.** Currently defaults to private (safe, requires no PO input to ship); becomes a live PO question only if/when reclassifying any of them public-eligible is desired.
2. **Q5 — the cross-freelancer read-path safety gate for `companySummary`/`businessModel`.** Does not reopen OQ-6's classification. The specific question: should the read path that actually exposes these fields cross-freelancer ship with an automated content-safety check, a human-reviewed rollout period, or no additional gate — given the repository shows no field-level production difference beyond naming between these two fields and the four already-private ones.

**OQ-5 (LinkedIn/company-profile evidence beyond the bare URL) remains explicitly deferred**, as before — not restated as a new decision, carried forward unchanged from `CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001`.

No other PO decision is introduced by this document.

## 9. Remaining External Verification

**None.** Q1 — the only question in this set requiring external provider verification — was resolved this pass via direct citation to Google Maps Platform's own documentation (`usage-and-billing` and `data-fields` pages, fetched 2026-10-19). No other question in this package required external verification, and none remains outstanding.

## 10. Implementation Readiness Matrix

| Area | Status | Blocking Issue | Required Before Implementation |
|---|---|---|---|
| Place ID field-mask capture | **READY** | None | — |
| Zero-AI boot-path fix | **READY** | None | — |
| `GOOGLE_PLACES_STATUS` cache CHECK-widening | **READY** | None | — |
| Lead-unlock isolation | **READY** (status quo, no change needed) | None | — |
| Entity + IdentityEvidence core schema | **READY AFTER SPECIFICATION** | None PO-blocking | Schema review of §2/§3's table design |
| Resolver (inline placement, Q7) | **READY AFTER SPECIFICATION** | None PO-blocking | Build on top of the transaction design in Q2 |
| Website-less normalization fix | **READY AFTER SPECIFICATION** | None PO-blocking | Caller-nullability audit of every `NormalizedCandidate.normalizedDomain` consumer |
| Entity + DiscoveryEvent + Prospect transaction (Q2) | **READY AFTER SPECIFICATION** | None PO-blocking | Implement the single-transaction wrapper per Q2's contract |
| `discovery_attempts` failed-normalization log (Q3) | **READY AFTER SPECIFICATION** | None PO-blocking | Implement per Q3's contract (no raw payload) |
| Entity Status evidence + derivation (Q6) | **READY AFTER SPECIFICATION** | None PO-blocking | Depends on the Entity layer existing first |
| Entity-aware cache `entity_id` dimension | **READY AFTER SPECIFICATION** | None PO-blocking | Depends on the Entity layer existing first |
| Public/private classification table (Q4, interim) | **READY AFTER SPECIFICATION** | None PO-blocking, for the private-default interim state | Build the reference table; leave the 3 unnamed fields private |
| Public/private classification (Q4, full) | **REQUIRES PO DECISION** | Whether `targetCustomers`/`visibleProblems`/`automationOpportunities` are ever reclassified public | A future PO decision, only if reclassification is desired |
| Cross-freelancer public-evidence read path (Q5) | **BLOCKED** | PO decision on the safety-gate question (§8 item 2) | PO decision |
| OQ-5 (LinkedIn/profile evidence) | **BLOCKED** | Deferred by standing PO decision | A producer must exist, then a PO decision |

## 11. Historical Safety Plan

No existing row in `companies`, `prospects`, `searches`, `opportunities`, `opportunity_scores`, `research_signals`, `research_signal_cache_index`, `research_signal_sources`, `lead_unlocks`, or `lead_unlock_contacts` is modified, merged, re-keyed, or re-interpreted by any rule in this document. Every new concept (`entities`, `identity_evidence`, `discovery_events`, `discovery_attempts`, `entity_status_evidence`, the public/private classification reference table) is a wholly new, additive structure. The only change to an *existing* table's schema is a new, nullable `entity_id` column on `companies` (defaulting `NULL`, never backfilled by inference) and the nullability relaxation of `companies.normalized_domain` (required by C-1's still-unimplemented website-less fix, independent of this package's seven questions, and already flagged as a **modifying** change in the implementation-readiness audit). No historical `lead_unlock_contacts` ownership changes. No historical search/service-profile snapshot is rewritten. No retroactive merge or identity inference is performed or authorized anywhere in this document.

## 12. Testing Specification

To be built later (not implemented by this document); each item below maps to a contract already specified in §4:

- **Place ID identity resolution** — a candidate with a Place ID matching an existing Entity's `identity_evidence` resolves to `DEFINITE_MATCH` (Q1/§4 Case A in the prior audit).
- **Domain corroboration** — a domain anchor alone never resolves; paired with a second, different-category anchor on the same Entity, it resolves (OQ-1/OQ-2).
- **Cross-category corroboration** — two anchors from different categories agreeing on one Entity → `DEFINITE_MATCH`.
- **Same-category non-corroboration** — two domain observations (same category) never satisfy corroboration, even as two separate rows (OQ-2, explicit negative test).
- **Conflicting Entities** — strong anchors pointing to two different existing Entities mark both `CONFLICTED` and spawn a new, third Entity for the triggering discovery; never provisional attachment (OQ-3).
- **Website-less candidates** — a candidate with `name` but no `website` is persisted (not dropped), with `normalizedDomain` absent and the resolver still running against whatever Category 1–3 evidence (if any) exists.
- **Failed normalization** — a candidate missing `name` entirely produces exactly one `discovery_attempts` row with `failure_reason = 'MISSING_NAME'`, no `DiscoveryEvent`, no Entity, no raw payload persisted.
- **DiscoveryEvent idempotency** — a retried outbound call after a crash produces a second `DiscoveryEvent` row (sanctioned duplicate, D21) but never a second Entity for the same Place ID (prevented by the partial unique index).
- **Transaction rollback** — a simulated mid-sequence failure (e.g. the Prospect insert fails) rolls back the Entity/evidence/DiscoveryEvent/Company writes for that candidate entirely; no orphan of any kind is left behind.
- **Concurrent discovery** — two concurrent transactions resolving the same Place ID; the second correctly observes the first's committed evidence and produces `DEFINITE_MATCH` rather than a duplicate Entity.
- **Stale status** — an `entity_status_evidence` row older than the freshness window is excluded from derivation.
- **Fresh status** — the most recent fresh row wins, even if an older fresh row disagrees.
- **UNKNOWN status** — no fresh row at all (including the zero-row case) derives to `UNKNOWN`, never `ACTIVE`.
- **Public/private evidence boundaries** — a read path for public-eligible fields never returns a row for an unclassified or explicitly-private field, even if that field shares a `kind` with a public-eligible one (the kind-vs-field-level leak scenario flagged in the prior audit's §10).
- **`lead_unlock_contacts` isolation** — no code path under test ever causes a `lead_unlock_contacts` row to appear in `identity_evidence`, `research_signal_cache_index`, or any Entity-adjacent table (regression test for OQ-7's already-confirmed-clean status).
- **Zero-AI boot/runtime** — the worker boots and completes a full deterministic search→opportunity pipeline with zero Anthropic SDK invocations when zero-AI mode is active (already specified in the prior audit §16, restated here for completeness).
- **Historical-data preservation** — every pre-existing row in every table named in §11 above is byte-identical before and after this architecture's migrations are applied (schema-only diff, zero data diff).

## 13. Final Implementation Gate

**IMPLEMENTATION IS NOT AUTHORIZED BY THIS DOCUMENT.**
