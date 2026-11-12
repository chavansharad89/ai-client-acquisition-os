# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: IMPLEMENTATION READINESS AUDIT

**Status of this document: SPECIFICATION / AUDIT ONLY. READ-ONLY REVIEW.**
No production code, test, migration, configuration, or database was modified to produce this document. Nothing has been committed or pushed. No governance decision is made, invented, or silently changed.

**Governance baseline treated as authoritative and NOT reopened:**
- `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` (D1, D8–D19, D21–D23; D20 deferred)
- `CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001` (narrow, unchanged)
- `CF-C-SERIES-PO-DEC-001` (C-1 through C-7)
- `CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001` (OQ-1 through OQ-9; OQ-5 deferred)
- Phase 7B, Phase 8 Entity Reality, K1 contact-identifier semantics, Service+Geography-only search input, ₹1,499 commercial model — all unchanged, none reopened.

Tags used throughout:
- **[FACT]** — verified directly against repository source in this pass (file:line cited).
- **[PO-DECIDED]** — already-decided governance, cited to its record.
- **[SPEC]** — deterministic engineering specification closable now, within already-decided governance.
- **[REC]** — engineering recommendation among valid designs; not binding.
- **[OPEN ENGINEERING QUESTION]** — cannot be closed from repository evidence or existing governance; analyzed below in §17.

This pass re-verified the repository directly rather than trusting the prior specification (`CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_ENGINEERING_SPECIFICATION.md`) at face value. One material correction is recorded in §1 Item 3 (`packages/core-identity/` scope).

---

## 1. Current Repository Audit

| # | Area | Current file/module | Current data model | Current behavior | Ownership model | Identity/dedup logic | Gap vs. PO decisions | Change type |
|---|---|---|---|---|---|---|---|---|
| 1 | `companies` | `packages/db/prisma/migrations/0015_discovery/migration.sql:45-66` | `id, user_id, name, normalized_domain (NOT NULL), created_at`. **[FACT]** | Upserted via `ON CONFLICT (user_id, normalized_domain)` in `packages/core-discovery/src/pgRepository.ts:35-49`. **[FACT]** | Strictly per-user: `UNIQUE(user_id, normalized_domain)`, FK to `users`, every read filtered on `user_id`. **[FACT]** | `normalized_domain` (website-derived) is the only identity key; explicitly described in the migration's own comment as the future reconciliation join key, not yet a global identity. **[FACT]** | No global/cross-user identity exists; no Place ID column; `normalized_domain` is `NOT NULL` so website-less rows cannot be persisted today (see §6). | **Additive** — new `entity_id` nullable FK; `companies` itself is not restructured. |
| 2 | `prospects` | `0015_discovery/migration.sql:87-116` | `id, user_id, search_id, company_id, status (CHECK ∈ {'DISCOVERED'}), created_at`. **[FACT]** | Upserted via `ON CONFLICT (search_id, company_id)`, `pgRepository.ts:85-98`. **[FACT]** | Per-user via FK; dedup key is `(search_id, company_id)`, deliberately **not** `(user_id, company_id)` — same business legitimately gets a new Prospect row per later Search, per the migration's own comment. **[FACT]** | Not a global identity concept; purely a per-Search sighting record. | None directly — `prospects` does not need an `entity_id`; it inherits via `company_id`. | **None required.** |
| 3 | `packages/core-identity/` | `src/index.ts`, `src/repository.ts`, `src/pgRepository.ts`, `src/types.ts`, `src/session.ts`, `src/activationToken.ts` | `IdentityRepository`, `StoredUser`, session/activation-token types. **[FACT]** | Owns authenticated-user/session/account-activation identity only — header comment: "who the authenticated user is… never product access… never payment." Operates exclusively on `users`/`activation_tokens`/`access_tokens`. **[FACT]** | User-authentication scoped, unrelated to business/Entity identity. | None relevant — no business-identity concept anywhere in this package. | **Correction to prior specification**: despite its name and its currently-uncommitted git status, this package is **not** related to the Global Entity Architecture and must not be assumed to be, or reused as, its implementation. No gap; no change needed here for this architecture. | **None** — out of scope for this architecture. |
| 4 | Company/Prospect repository | `packages/core-discovery/src/pgRepository.ts` | N/A (repository layer) | Every lookup filters on `user_id` in the WHERE/ON CONFLICT clause itself (header comment, lines 11-13); zero cross-user lookups found anywhere in the file. **[FACT]** | Strictly per-user. | Confirms Item 1's dedup key is the only mechanism; no resolver exists. | A resolver/Entity lookup layer must be added alongside, not instead of, this per-user repository. | **Additive.** |
| 5 | `packages/core-opportunity/` | `0017_opportunities/migration.sql:58-111` | `opportunities.prospect_id → prospects.id` (UNIQUE — one Opportunity per Prospect); `opportunities.user_id → users.id` directly. No FK to `companies`. **[FACT]** | Company resolved indirectly: `service.ts:132-139` reads Prospect then Company by `prospect.companyId`. **[FACT]** | Per-user, inherited. | None — Opportunity identity is independent of Entity identity (consistent with D16/D19: relationships/status don't touch eligibility). | None required for OQ-1–OQ-9; `opportunities` is untouched by this architecture. | **None required.** |
| 6 | `research_signals` | `0016_research_signals/migration.sql:56-95`; widened by `0029`, `0030`, `0049` | `kind` CHECK currently = `WEBSITE, JOB_POST, LINKEDIN, NEWS, FUNDING, TECH_STACK, REVIEW, MANUAL, PUBLIC_INTENT, FIRST_PARTY, GOOGLE_PLACES_STATUS`. One row per claim (`field` scalar column), not a JSON blob. **[FACT]** | No visibility/scope/public column exists. Ownership inherited only via `prospect_id → prospects.user_id` (DEC-008 pattern), by explicit design. **[FACT]** | Per-user/per-prospect, no denormalized owner. | Field-level granularity already exists via the `field` column (`companySummary`, `websiteIssues`, etc. are already separate rows) — **this materially simplifies OQ-6**: no schema restructuring is needed to filter by field, only an additive classification. | **Additive** — new nullable classification column/table; no restructuring of existing rows. |
| 7 | `research_signal_cache_index` | `0045_research_signal_cache_index/migration.sql` | `signal_kind` CHECK = `WEBSITE, JOB_POST, LINKEDIN, NEWS, FUNDING, TECH_STACK, REVIEW, MANUAL` only — **confirmed still missing** `GOOGLE_PLACES_STATUS`, `PUBLIC_INTENT`, `FIRST_PARTY`, deliberately per its own comment. **[FACT]** | Key: `UNIQUE(user_id, normalized_domain, signal_kind, signal_id)`; lookup index `(user_id, normalized_domain, signal_kind)`. **[FACT]** | Per-user. | `GOOGLE_PLACES_STATUS` — the one clearly-public signal that exists today — cannot be cached at all, even for same-user reuse. Confirmed still true. | **Additive** — widen CHECK constraint (narrow, low-risk) + later add `entity_id` lookup dimension. |
| 8 | `lead_unlock_contacts` | `0042_lead_unlock_contacts/migration.sql:26-49` | `kind` CHECK = `BUSINESS_EMAIL, PERSONAL_EMAIL, UNCERTAIN_EMAIL, PHONE`. Ownership: `lead_unlock_id → lead_unlocks.id → lead_unlocks.user_id`. **[FACT]** | Exactly two SQL touch points in the entire repo (`leadUnlockRepository.ts:75` SELECT, `:124-127` INSERT), both inside one transaction in `revealAtomically`. **[FACT]** | Strictly freelancer-scoped. | **Confirmed clean**: no code path anywhere copies this data into `research_signals`, `research_signal_cache_index`, `companies`, or any Entity-adjacent store — the unlock flow only *reads* companies/prospects/signals in memory to compute contact candidates, never writes back. **[FACT]** | **None required** — OQ-7's "never promote" rule is already structurally true today; no code change is needed to comply, only a guard against ever introducing such a path later. |
| 9 | Google Places discovery | `packages/core-discovery/src/googlePlacesClient.ts:12-79` | `FIELD_MASK = 'places.displayName,places.websiteUri,places.businessStatus'`; `places.id` **not requested**, confirmed by zero repo-wide hits for `places.id`/`placeId`/`place_id`. **[FACT]** | `ExternalDiscoveryResult { name, websiteUri, businessStatus }` — 3 fields only. **[FACT]** | N/A | No Place ID anywhere in the pipeline. | **Additive** — add `places.id` to field mask + type; confirm billing tier against provider docs first (still **[OPEN ENGINEERING QUESTION]**, see §17). |
| 10 | Candidate normalization | `packages/core-discovery/src/normalize.ts:43-52` | `normalizeCandidate()`: rejects missing/blank `name` (line 44-45) **and** missing/falsy `website` (line 47) before any Entity logic runs. **[FACT]** | `normalizeDomain()` fully read this pass (previously flagged open): lowercases, strips exactly one trailing dot, strips only a leading `www.` (not other subdomains, not recursive), drops port/path/query via `URL.hostname`. **[FACT — closes the previously-open engineering-review item from the prior specification §3.** | N/A | C-1 ("no-website ≠ exclusion") is decided but **still not implemented** — confirmed unchanged. | **Modifying** — relaxing the website-required branch is a behavior change to existing, shipped code (not purely additive); must be done carefully (see §6). |
| 11 | Website-less drop accounting | `packages/core-discovery/src/service.ts:123-142` | Rejected candidates increment a `skipped` counter only; **no per-candidate log, no reason code, no identifying info retained**. **[FACT]** | Silently dropped — zero persistence. | N/A | This is the exact gap OQ-8's failed-normalization log must fill, but note: today's "skip" is a **normalization** rejection (missing name/website), which is a different case from "provider call succeeded but result was unusable garbage" — both would route to the same future log under OQ-8's rule, but the *reason* fields differ. | **Additive** — new log table; existing skip-counting logic is superseded, not removed (historical counts stay meaningful). |
| 12 | Entity Reality | `packages/core-research/src/deterministicSignals.ts:154-186` | `detectPlacesEntityReality()`: produces a signal **only** for `CLOSED_PERMANENTLY`/`CLOSED_TEMPORARILY`; `'OPERATIONAL'`/`null`/unrecognized → `null` (no signal). **[FACT]** | Confirmed: never positively asserts `ACTIVE`. | N/A | Directly confirms OQ-9's "absence ≠ ACTIVE" rule is already the correct, consistent reading of existing producer behavior — no producer change needed for OQ-9. | **None required** on this producer; only the (not-yet-existing) Entity Status *read-path* needs building. |
| 13 | Deterministic signal persistence | `apps/worker/src/searchWorker/worker.ts:494,567,613,655`; `deterministicSignalPersistence.ts` | Persists `GOOGLE_PLACES_STATUS` signals into `research_signals` (per-user). **[FACT]** | Functions today; unaffected by any OQ decision. | Per-user. | None relevant to OQ-1–OQ-9 directly; relevant only as the future feed into Entity Status once an Entity layer exists (unchanged dependency already noted in the base governance record). | **None required** now. |
| 14 | Cache lookup | `packages/core-research/src/signalCache.ts:61-91` | `FRESHNESS_WINDOW_DAYS` per kind; `MANUAL`/`PUBLIC_INTENT`/`FIRST_PARTY` always stale (not listed). **[FACT]** | Confirmed unchanged from prior spec. | Per-user. | Reused as-is by OQ-9's precedence rule (freshness-gated, most-recent-wins) — no new TTL invented. | **None required** — OQ-9 reuses this mechanism exactly. |
| 15 | Search provenance | `packages/db/prisma/migrations/0014_searches/migration.sql:56-95`; `packages/core-discovery/src/googlePlacesProvider.ts:15-25` | `searches` persists **input parameters** (`service`, `geography`, `keywords`, etc.) — an immutable ServiceProfile snapshot — **not** the literal query string sent to the provider. `buildQuery()` constructs the literal query in-memory only; it is **never persisted anywhere** (zero hits for `actual_query`, zero hits for `DiscoveryEvent`). **[FACT]** | N/A | N/A | This is exactly the gap D21/C-5/OQ-8 require `DiscoveryEvent` to close — confirmed still a from-scratch build, no partial implementation exists. | **Additive** — wholly new table/concept; does not touch `searches`. |
| 16 | Per-user dedup (summary) | Items 1, 2, 4, 9 above | — | — | Per-user, per-domain, per-search — never cross-user. | Confirmed: **zero code anywhere** (`grep` for `Entity`, `GlobalEntity`, `IdentityEvidence`, `DiscoveryEvent`, `EntityStatus`) implements any part of a global/cross-freelancer identity concept today — every "Entity" hit in the repo belongs to the separate, already-decided Entity Reality feature or to Razorpay's unrelated `entity` JSON field. **[FACT]** | Confirms: this architecture starts from a clean slate. No existing code is being extended or renamed; only new, additive structures are needed, layered on top of the unchanged per-user tables. | **Additive**, repo-wide. |
| 17 | `opportunities` provenance columns | `0017_opportunities/migration.sql`; `0047_opportunity_ai_enrichment_provenance/migration.sql:45-55` | No `provider`/`query`/`discovered_at` column exists. The closest related column, `ai_enrichment`/`ai_enrichment_reason` (added 0047), records an AI-escalation classification only — not discovery provenance. **[FACT]** | N/A | N/A | Confirms "why found" (C-7) must be derived from the new `DiscoveryEvent`, not from any existing `opportunities` column. | **None on `opportunities` itself** — it is read-only context for `DiscoveryEvent`'s design. |
| 18 | Zero-AI boot blockers | `packages/config/src/env.ts:72`; `apps/worker/src/index.ts:105-124`; `packages/core-research/src/researchModelFactory.ts:19-20` | `ANTHROPIC_API_KEY` is mandatory (`z.string().trim().min(1)`, no default/optional). `createResearchModel(...)` is called unconditionally inside `main()`, before the poll loop, for both the primary and fallback provider. `RESEARCH_PROVIDER_NAMES = ['anthropic','openai','gemini']` — no "none" sentinel. **[FACT]** | N/A | N/A | Confirmed unchanged from prior spec — exactly two coupled blocking points, nothing more, nothing less. | **Modifying** — existing boot sequence and env schema both change (see §16). |
| 19 | AI admission | `packages/core-research/src/admission.ts:11-103` | Pure, no I/O; decides AI eligibility only, never invokes AI. **[FACT]** | Confirmed unchanged. | N/A | None — already AI-call-free, confirmed again this pass. | **None required.** |
| 20 | K1 / lead-unlock isolation (cross-check) | See Item 8 | — | — | — | Confirmed via full file-list read-through (20 files) that no accidental leakage path exists from `lead_unlock_contacts` into any Entity-adjacent store. | No change required; OQ-7 compliance is already structural, not a future risk requiring new guards. | **None required.** |

---

## 2. Global Entity Data Model

**Can `companies` safely become the Entity table? No. [SPEC]**

Reasons, each independently sufficient:
1. `companies` is keyed `UNIQUE(user_id, normalized_domain)` — its entire identity is *per-user*. Converting it to a global table would require either (a) breaking that uniqueness constraint for every existing row (destructive, touches live production data), or (b) keeping the constraint and bolting global identity on top anyway, which defeats the point of reusing the table.
2. `companies.normalized_domain` is `NOT NULL` today. Website-less Entities (the entire point of C-1) cannot be represented in this table without first making that column nullable — a breaking schema change to a table other, unrelated code already depends on being non-null.
3. DEC-005 (narrowly superseded only on the "not global" framing by `CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001`) otherwise still stands: `companies` remains the user-owned MVP sighting table, with its `UNIQUE(search_id, company_id)`-adjacent Prospect dedup unaffected. Repurposing the table itself would retroactively alter a decision that was only narrowly, not broadly, superseded.

**Proposed model: [SPEC]**

```
entities                         (NEW — global, independent of user_id)
  id                   PK, permanent, never derived from any attribute (D1)
  status               TEXT CHECK IN ('ACTIVE','CLOSED_TEMPORARILY','CLOSED_PERMANENTLY','UNKNOWN')  -- derived, see §12; not stored as a mutable "current status" column, see OPEN ENGINEERING QUESTION in §17
  created_at           TIMESTAMP
  -- no name/domain/geography column: D1 forbids deriving identity from any external attribute

identity_evidence                (NEW — global)
  id                   PK
  entity_id            FK -> entities.id
  category             TEXT CHECK IN (1,2,3,4)        -- D22
  evidence_type        TEXT CHECK IN ('PLACE_ID','DOMAIN','PROFILE_URL','PHONE','BUSINESS_EMAIL', ...)  -- D12's table, not invented beyond it
  normalized_value      TEXT                            -- comparison form (byte-exact for Place ID; normalizeDomain() output for domain; scheme+host for profile URL)
  source                TEXT                            -- provider name
  verified              BOOLEAN                          -- D23
  observed_at           TIMESTAMP
  discovery_event_id    FK -> discovery_events.id        -- provenance, see §7
  conflict_state        TEXT CHECK IN ('ACTIVE','CONFLICTED')  -- D13/D18 pattern reuse

companies                         (UNCHANGED structurally)
  ...existing columns...
  entity_id            FK -> entities.id, NULLABLE        -- new, additive column only
```

Relationship chain requested:
```
Entity (global, new)
  ↓ entity_id (nullable FK, additive column on existing table)
Company (per-user, UNCHANGED — DEC-005 substance preserved)
  ↓ company_id (existing FK, UNCHANGED)
Prospect (per-search, UNCHANGED)
  ↓ search_id (existing FK, UNCHANGED)
Search (UNCHANGED)
```

**Uniqueness/indexes [SPEC]:** `identity_evidence` needs a partial unique index per evidence type that is authorized to resolve alone or participate in conflict detection — e.g. `UNIQUE(evidence_type, normalized_value) WHERE evidence_type = 'PLACE_ID'` and similarly for `DOMAIN`. No index is created on Category 4 (name/geography) values, consistent with D12.

**Historical behavior [SPEC]:** `entities`/`identity_evidence` start empty; `companies.entity_id` defaults `NULL` for every existing row (no backfill — see §14). This is purely additive to `companies`; no existing column, constraint, or row is altered.

**Global scope [PO-DECIDED, D8]:** `entities` has no `user_id` column at all — this is the structural expression of "Entity identity is global, not user-owned."

---

## 3. Identity Evidence Specification

Per D22's four categories, now resolved for alone/corroboration status by OQ-1/OQ-2:

| Evidence type | Category | Source today | Can resolve alone? | Participates in corroboration? | Globally reusable? | Public/private | Freshness relevance | Conflict behavior |
|---|---|---|---|---|---|---|---|---|
| Google Place ID | 1 | Not captured — **[FACT]**, §1 Item 9, §5 | **Yes** — OQ-1 | N/A (already sufficient alone) | Yes, once captured (it is the provider-stable identifier D22 Category 1 describes) | Public (provider-issued technical identifier, not freelancer content) | None — not a point-in-time observation, a stable fact (D23: verification ≠ freshness) | Conflict → OQ-3 (spawn 3rd Entity); never auto-merge |
| Domain | 2 | `DiscoveryCandidate.website` → `normalizeDomain()` — **[FACT]** | **No** — OQ-1 | **Yes**, one of two required anchors — OQ-2 | Yes, once D23-verified (OQ-4) and corroborated | Public (the bare domain value itself; `websiteUri` verification per OQ-4) | None for the value itself; verification ≠ freshness (D23) | Same as above |
| Official profile URL | 2 | Not captured today | **No** — OQ-1 (same category as domain) | **Yes** | **[OPEN]** per OQ-5 (deferred — no producer exists) | **[OPEN]** per OQ-5 | N/A, moot until captured | Same pattern, moot until captured |
| Verified business phone | 3 | Not captured; Places field mask excludes phone — **[FACT]** | **No** — OQ-1 | **Yes**, but moot — no producer exists | Moot | Moot | Moot | Moot |
| Verified business-email domain | 3 | Only post-purchase, `lead_unlock_contacts` — never promotable per OQ-7 | **No** — OQ-1, and **permanently moot** per OQ-7 | **No** — OQ-7 forecloses this path entirely for the existing data source; a *different*, independent future producer could in principle supply Category 3 evidence, but that is a separate, not-yet-made decision | No | N/A | N/A | N/A |
| Name, geography, category, similarity, reviews | 4 | Captured today (`companies.name`, `searches.geography`) | **Never** — D12, unconditional | **Never** — D12, unconditional | No | N/A for identity purposes | N/A | May only surface `UNCERTAIN_POSSIBLE_DUPLICATE` hint; never resolves |

No evidence type beyond this table is introduced, per both the base governance record and OQ-1/OQ-2's explicit "do not invent additional identity evidence types" instruction.

---

## 4. Resolution Algorithm

Deterministic resolver specification, every case traced per the user's required cases, strictly inside OQ-1/OQ-2/OQ-3:

**Case A — Place ID matches one existing Entity → `DEFINITE_MATCH`. [SPEC]**
Exact match on `identity_evidence.normalized_value` where `evidence_type = 'PLACE_ID'`, scoped to the Place ID provider namespace (never compared cross-provider). Resolves alone per OQ-1. No corroboration needed.

**Case B — No Place ID; domain/profile/phone/email evidence available. [SPEC]**
None of these resolve alone (OQ-1). Apply OQ-2: search for a second, independent anchor **from a different category** also pointing at the same existing Entity (e.g. domain evidence + a (currently nonexistent) phone evidence, or domain + a future profile-URL evidence). If found → `DEFINITE_MATCH`. If only one anchor total, or multiple anchors all from the *same* category (e.g. two domain observations) → falls through to Case E/F treatment (no match via strong evidence).

**Case C — Two different-category anchors agree on one Entity → `DEFINITE_MATCH`. [SPEC]**
This is OQ-2's corroboration rule applied positively. Both anchors must be Category 1–3 and from different `evidence_type` categories; two Category-2 observations (e.g. domain twice) do **not** satisfy this per OQ-2's explicit text.

**Case D — Strong anchors point to different existing Entities → conflict. [SPEC, per OQ-3]**
Both existing Entities' conflicting evidence rows are marked `conflict_state = 'CONFLICTED'` (reusing the D18 pattern). The triggering discovery itself becomes a **brand-new, third, independent Entity** — never provisionally attached to either side, never a manual-review queue, never a `NULL entity_id`. This is now a closed decision (OQ-3), not a recommendation.

**Case E — Only weak Category-4 evidence exists → never resolve. [SPEC, per D12, unconditional]**
Always produces `NO_MATCH_NEW_ENTITY`. A same-business-rediscovered-with-only-name+geography scenario will accumulate multiple distinct Entities over time — a known, accepted consequence of D12/D14, not a defect.

**Case F — No sufficient identity evidence at all → create new global Entity. [SPEC, per D14]**
Same outcome as Case E.

**Case G — Uncertain/ambiguous identity → create new Entity rather than guess. [SPEC]**
Any state not explicitly satisfying Case A or Case C above (including Case B's "only one anchor, or only same-category anchors" fallthrough) resolves to `NO_MATCH_NEW_ENTITY`, never to an invented provisional/uncertain-but-attached state.

**State vocabulary, explicitly closed to exactly four outcomes [SPEC]:**
- `DEFINITE_MATCH` — Case A or Case C.
- `NO_MATCH_NEW_ENTITY` — Cases E, F, G, and Case B's fallthrough.
- `CONFLICTED` (on the two *existing* Entities) + a fresh `NO_MATCH_NEW_ENTITY` for the *triggering* discovery — Case D.
- No fifth, "provisional" or "uncertain match" state is introduced — explicitly forbidden by OQ-1/OQ-3's "do not invent" instructions.

---

## 5. Place ID

**Current state, re-verified this pass [FACT]:**
- `FIELD_MASK` (`googlePlacesClient.ts:79`) requests exactly `places.displayName,places.websiteUri,places.businessStatus` — no `places.id`.
- `ExternalDiscoveryResult` and `DiscoveryCandidate` both have exactly 3 fields, none of them a Place ID.
- Zero repository-wide references to `placeId`/`place_id`/`places.id`.

**Required changes, specification only [SPEC]:**
1. Add `places.id` to `FIELD_MASK`.
2. Add `placeId?: string | null` to `ExternalDiscoveryResult` and `DiscoveryCandidate`, following the exact existing optional-nullable pattern already used for `businessStatus`.
3. **Do not** fold it into `NormalizedCandidate` (`{ name, normalizedDomain }`) — it is identity evidence, not discovery normalization, consistent with `normalize.ts`'s existing minimal-surface design.
4. Persist it as a new `identity_evidence` row (`evidence_type = 'PLACE_ID'`, `category = 1`), once the Entity model (§2) exists — never as a column on `companies`.
5. Tests required: field-mask string assertion; parsing of present/missing/malformed `id`; a billing-tier regression test mirroring the existing `businessStatus` precedent (`googlePlacesClient.ts:69-78`'s comment explicitly documents that precedent).
6. The `businessStatus`-driven Entity Reality path must remain untouched — confirmed independent of this addition (§1 Item 12).

**Billing tier confirmation is explicitly [OPEN ENGINEERING QUESTION]** — see §17, Q1.

---

## 6. Website-less Discovery

Full flow, specified end to end [SPEC]:

```
Google Places result (websiteUri possibly null, businessStatus possibly null, name required)
  ↓
normalizeCandidate() — MODIFIED behavior (see below)
  ↓
Identity anchor selection:
  - Place ID present?           → Case A resolver path (§4)
  - else domain present?        → Case B resolver path, needs corroboration
  - else name only?             → Case E — never resolves, always NO_MATCH_NEW_ENTITY
  ↓
Entity creation/match (per §4's four outcomes)
  ↓
Company representation — UNCHANGED upsert, PLUS entity_id populated from the resolver outcome
  ↓
Prospect — UNCHANGED upsert logic
  ↓
DiscoveryEvent (NEW, §7) — records provider/actual_query/timestamp/entity_id regardless of website presence
  ↓
Opportunity pipeline — UNCHANGED, C-1 already requires non-exclusion on website absence
```

**What becomes the identity anchor when website is absent [SPEC]:** Place ID if present (resolves alone, OQ-1); otherwise, no Category 1–3 anchor exists at all today (no phone/profile-URL producer), so the discovery falls to Case E/F — a new, unresolvable-to-existing Entity is created every time, by design, until a second evidence type exists.

**Required, non-additive change to `normalizeCandidate()` [SPEC — this is the one deliberately MODIFYING change this document identifies]:**
The current unconditional `if (!candidate.website) return null;` (`normalize.ts:47`) must become conditional — a candidate with a `name` but no `website` must proceed (not be rejected), with `normalizedDomain` simply absent/null on the resulting value, rather than the whole candidate being discarded. This is C-1's already-decided requirement, still unimplemented, and is squarely a **modifying** change to shipped code, not a purely additive one — it changes the return value shape of an existing, tested function (`NormalizedCandidate` currently guarantees `normalizedDomain: string`; it would need to become `string | null`). Every caller of `NormalizedCandidate.normalizedDomain` (at minimum `findOrCreateByDomain` in `pgRepository.ts`) must be re-examined for this nullability change.

**`companies.normalized_domain NOT NULL` must become nullable [SPEC]** — a schema-breaking change to an existing, populated, production column. This is the second deliberately **modifying** (not additive) change in this architecture. A new partial unique index `UNIQUE(user_id, normalized_domain) WHERE normalized_domain IS NOT NULL` preserves today's exact dedup guarantee for website-having companies; `UNIQUE(user_id, google_place_id) WHERE google_place_id IS NOT NULL` is needed for Place-ID-based per-user dedup once that column exists. No unique index is added on name/geography (D12 forbids it).

**Duplicate Google Place results within one discovery run:** unaffected by this architecture — `prospects`' existing `(search_id, company_id)` conflict handling already deduplicates within one Search; the Entity layer adds global reconciliation on top, it does not replace this.

**Repeated discoveries across time / cross-provider:** governed entirely by §4's resolver; a future second provider supplying, e.g., a verified phone number for the same business would participate in the same `identity_evidence`/corroboration mechanism without any provider-specific resolver code — this is confirmed by the resolver spec being evidence-type-based, not provider-based.

**Name+geography is never used as identity** — confirmed nowhere in this flow (Case E/F always wins when only Category 4 evidence exists).

**Website is NOT silently reintroduced as mandatory** — confirmed: the resolver (§4) treats website/domain exactly as OQ-1/OQ-2 require (corroboration-only, not alone, but never excluded from discovery/persistence per C-1).

---

## 7. DiscoveryEvent

Specification, per C-5/D21 minimums plus OQ-8's boundary [SPEC]:

```
discovery_events                  (NEW)
  id                   PK
  provider             TEXT          -- e.g. 'GOOGLE_PLACES'
  actual_query         TEXT          -- the literal buildQuery() output at call time, captured once, immutable
  discovered_at        TIMESTAMP
  entity_id            FK -> entities.id, NOT NULL      -- D21 minimum field, kept strictly non-nullable per OQ-8
  search_id            FK -> searches.id                  -- structural FK, [REC], flagged for PO confirmation in the base spec but not reopened here
  prospect_id          FK -> prospects.id                  -- same as above
  place_id             TEXT NULLABLE                        -- the provider-specific discovery identifier itself, within D21's minimum "provider/source"
```

- **Primary key:** synthetic `id`; no natural key, since multiple events may legitimately reference the same Entity (D21, decided) and even the same provider+query (retries).
- **Uniqueness/idempotency:** none required at the DB level beyond the PK — D21 explicitly allows duplicates; idempotency is handled at the write-path level (each actual outbound call creates one row, full stop).
- **Retry behavior [SPEC]:** each distinct outbound provider call creates its own immutable row, even if `actual_query` is byte-identical to a prior attempt — a retry is a distinct real call, per D21's "the actual query sent."
- **Relationship to Search/Entity:** both are structural FKs (see above); `entity_id` is mandatory because, per D14 (decided), a discovery that fails to *resolve* (not fails to *normalize* — see §8) always yields a new Entity, so `entity_id` is always populated by the time a `DiscoveryEvent` row is written.
- **Query snapshot immutability [SPEC]:** `actual_query` is written once at event-creation time and never recomputed, so a later change to `buildQuery()`'s logic never alters a historical event's accuracy (C-7 requirement).
- **Duplicate events:** explicitly allowed (D21) — no constraint prevents two rows with the same `entity_id`.
- **Provenance rendering ("why found"):** derived entirely from `discovery_events.provider` + `actual_query`, never from a separately stored free-text field (C-7, decided) and never from re-running the current/mutable `buildQuery()` logic against old inputs.
- **Transaction boundary** between Entity + DiscoveryEvent + Prospect writes: **[OPEN ENGINEERING QUESTION]** — see §17, Q2 (already flagged by the prior specification, re-confirmed still open this pass; not a §19 PO item).

---

## 8. Failed-Normalization Log

Specification for the OQ-8-mandated separate pre-Entity log [SPEC]:

```
discovery_attempts                (NEW — separate from discovery_events)
  id                   PK
  provider             TEXT
  actual_query         TEXT
  attempted_at         TIMESTAMP
  failure_reason       TEXT CHECK IN ('MISSING_NAME','MISSING_WEBSITE_UNPARSEABLE', ...)  -- enumerated, not free text, following the repo's existing CHECK-constraint-over-enum convention
  raw_candidate_ref    JSONB NULLABLE   -- see privacy caveat below
  search_id            FK -> searches.id
```

- **Purpose:** capture every outbound provider call that could not produce a normalizable candidate (today: missing `name`, or `website` present but unparseable per `normalizeDomain()`), so provenance is preserved per C-7's intent even when no Entity could be derived — without weakening `discovery_events.entity_id`'s non-nullable guarantee (OQ-8).
- **Minimum fields:** `provider`, `actual_query`, `attempted_at` — mirroring D21's minimum, minus `entity_id` (structurally impossible here).
- **Failure reason:** required, enumerated — note from §1 Item 10/11 that today's single `skipped` counter conflates "missing name" and "missing/unparseable website" into one bucket; this log should distinguish them for future debugging value, but that distinction only matters to this new table, not to any existing code.
- **Raw provider payload storage:** **[OPEN ENGINEERING QUESTION]** — whether to store the raw candidate (`name`/`website` as received, pre-rejection) for debugging, versus storing nothing beyond the failure reason, is a retention/privacy trade-off not dictated by any existing governance record. See §17, Q3.
- **Relationship to `DiscoveryEvent`:** siblings, not parent/child — a single outbound call produces exactly one row in exactly one of the two tables (`discovery_events` on successful normalization, `discovery_attempts` on failure), never both, never neither.
- **No fake Entity is ever created** from a `discovery_attempts` row — confirmed by construction, since this table has no `entity_id` column at all.

---

## 9. Website / D23 Verification

**How `websiteUri` becomes D23-verified evidence [SPEC, per OQ-4]:**
The moment a live Places response for a specific, matched place returns a non-null `websiteUri`, the resulting `identity_evidence` row is written with `verified = true`. No DNS ownership check, no owner-confirmation step, and no second independent source is required — OQ-4 settles this directly, and D23 itself already states two independent sources are not universally required.

**Three distinct concepts, kept separate as instructed [SPEC]:**
- **Provider association** — the raw fact that Google's API returned this `websiteUri` for this place in this response. This alone is not yet "verification" under D23's general test; it becomes verification only because OQ-4 specifically rules that this provider association *does* satisfy D23 for this field.
- **Verification** — the boolean `identity_evidence.verified` flag set by OQ-4's rule above. A one-time structural fact about *how* the value was obtained.
- **Freshness** — entirely separate (D23: "verification ≠ freshness"); a verified domain value does not need periodic re-verification, since it describes how the evidence was obtained, not whether the business still operates there.
- **Identity resolution authority** — entirely separate again: `verified = true` on a domain's `identity_evidence` row does **not** change its OQ-1 status. Domain still cannot resolve an Entity alone; it still requires the OQ-2 corroboration rule (a second, different-category anchor). Verification answers "is this evidence trustworthy," not "is this evidence sufficient by itself."

---

## 10. Public/Private Evidence

**Can the existing `research_signals` schema support OQ-6 safely? Yes, additively. [SPEC]**
Confirmed this pass: each claim (`companySummary`, `websiteIssues`, etc.) is already a **separate row**, distinguished by the existing `field` column — not a JSON blob, not multiple sub-keys merged into one row. This means a field-level classification can be implemented as a simple additive lookup (either a new nullable column on `research_signals`, or a separate small reference table mapping `field → visibility`), **without** restructuring any existing row or column. This is a materially simpler starting point than the prior specification's "JSON-level metadata or normalized columns" framing assumed, now that row granularity is confirmed.

**Does `research_signals` need a visibility/scope column, or can field-level classification live elsewhere? [REC]**
A separate, small static reference table (`research_signal_field_classification: field TEXT PK, visibility TEXT CHECK IN ('PUBLIC_ELIGIBLE','PRIVATE')`) is recommended over adding a column directly to `research_signals`. Reasons: (a) it keeps `research_signals` itself unchanged (zero migration risk to the DEC-008 no-denormalized-owner design); (b) classification is a property of the *field name*, not of any individual row, so a static lookup table is a more accurate model than a per-row column that would just repeat the same value for every row of that field; (c) it is trivially extensible when OQ-5's producer eventually exists.

**Minimum classification from the PO decision, confirmed against actual producers [FACT + SPEC]:**
- `companySummary`, `businessModel` → `kind = WEBSITE` → classified `PUBLIC_ELIGIBLE` per OQ-6.
- `websiteIssues`, `contentOpportunities` → `kind = WEBSITE` → `PRIVATE` per OQ-6.
- `aiOpportunities` → `kind = TECH_STACK` → `PRIVATE` per OQ-6.
- `growthOpportunities` → `kind = NEWS` → `PRIVATE` per OQ-6.
- `targetCustomers`, `visibleProblems`, `automationOpportunities` → **not named in OQ-6's "at minimum" list** — **[OPEN ENGINEERING QUESTION]**, see §17, Q4.

**Are `companySummary`/`businessModel` actually safe to classify public given their current producer? [OPEN ENGINEERING QUESTION — flagged exactly as the task instructs, not guessed.]**
All six fields in question (including these two) are confirmed this pass to be **LLM-generated output fields** from the same `leadResearchSchema` (`packages/core-research/src/schema.ts:287-319`) — there is no separate, more clearly "factual" code path producing `companySummary`/`businessModel` versus the interpretive fields. The OQ-6 decision itself already treats them as "factual-sounding" by field-naming convention, not by verified production method. Whether an LLM-generated company summary is safe to share cross-freelancer without first checking it for inadvertent interpretive leakage (e.g. a summary that happens to mention a competitive angle) is a genuine implementation risk the PO decision's own text anticipates ("does not authorize immediate cross-freelancer sharing… exact field mapping may be specified during engineering planning"). See §17, Q5.

**Does this require JSON-level metadata, or normalized columns? [SPEC]** Normalized columns/reference table, per the recommendation above — not JSON-level metadata, since row granularity is already field-level.

**Critical leak-prevention requirement, restated as a design constraint [SPEC]:** the write path for any future "public evidence" consumer must read *only* from rows whose `field` matches a `PUBLIC_ELIGIBLE` entry in the classification table — never a whole `kind` (since `WEBSITE` kind mixes both public-eligible and private fields). A kind-level filter would leak `websiteIssues`/`contentOpportunities` alongside `companySummary`/`businessModel`; this document explicitly flags that risk so it is not reintroduced by an implementation shortcut.

---

## 11. Lead Unlock Contacts

**Confirmed, this pass, read-only [FACT]:** `lead_unlock_contacts` remains strictly freelancer-scoped. Every one of the 20 files in the repository that reference lead-unlock functionality was read; the only two SQL touch points for the table itself are the SELECT and INSERT inside `leadUnlockRepository.ts`'s `revealAtomically` transaction. The unlock service (`leadUnlockService.ts`) *reads* `companies`/`prospects`/`research_signals` in memory to compute candidate contact values, but writes back only to `lead_unlocks`/`lead_unlock_contacts` — never to `research_signals`, `research_signal_cache_index`, `companies`, or any other table.

**Every possible accidental-entry path audited:**
- → Entity identity evidence: **no path found.** No code constructs an `identity_evidence`-shaped write from `lead_unlock_contacts` data (and no such table exists yet to even target).
- → global cache: **no path found.** `research_signal_cache_index` has no code reference anywhere in the lead-unlock file set.
- → public research: **no path found.** `research_signals` is only read, never written, by the unlock flow.
- → cross-freelancer reuse: **no path found.** `lead_unlock_id → lead_unlocks.user_id` is the only ownership chain; no query anywhere relaxes this to a cross-user read.

**Safeguards specified [SPEC]:** since no leakage path exists today, the only safeguard required going forward is a **negative constraint on future code**: any future Category-3 evidence producer (phone/business-email) must be built as an independent pipeline that never reads from `lead_unlock_contacts`/`lead_unlocks`, consistent with OQ-7's explicit carve-out ("a future independent, non-purchase-gated producer... may be considered separately"). No schema change is needed to enforce this today; it is a code-review/architecture-review constraint for whenever that future producer is scoped.

**K1 is not modified** — confirmed no change to `lead_unlock_contacts.kind` or its CHECK constraint, and no change to the unlock service's contact-extraction logic.

---

## 12. Entity Status

**EntityStatusEvidence specification [SPEC]:**

```
entity_status_evidence            (NEW, append-only, mirrors D11's evidence pattern)
  id                   PK
  entity_id            FK -> entities.id
  status               TEXT CHECK IN ('CLOSED_TEMPORARILY','CLOSED_PERMANENTLY')   -- never 'ACTIVE', confirmed never positively observed (§1 Item 12); 'UNKNOWN' is a derived absence-state, not a storable observation
  source               TEXT                                                          -- 'GOOGLE_PLACES_STATUS' today
  observed_at          TIMESTAMP
```

**Derivation algorithm, exactly per OQ-9 [SPEC]:**
1. Filter `entity_status_evidence` rows for this Entity to those within the applicable freshness window (reusing the existing 30-day `GOOGLE_PLACES_STATUS` window from `FRESHNESS_WINDOW_DAYS`, confirmed unchanged this pass — `signalCache.ts:61-73`).
2. Among the surviving rows, take the one with the latest `observed_at`.
3. If none survive step 1 → current status = `UNKNOWN`.
4. Never infer `ACTIVE` from the absence of a negative observation — confirmed structurally guaranteed, since `'ACTIVE'` is not even a storable value in this table's CHECK constraint; it can only ever be the *derived default* when no fresh negative observation exists, and this document specifies that default as `UNKNOWN`, not `ACTIVE`.
5. Stale observations (outside the freshness window) are excluded by step 1, never consulted.

**Phase 8 `GOOGLE_PLACES_STATUS` interaction, audited [FACT]:** `detectPlacesEntityReality()` (`deterministicSignals.ts:154-186`) is the sole producer; it writes into `research_signals` (per-user) today, not into any Entity-level table (which doesn't exist yet). Mapping this per-user signal into the new global `entity_status_evidence` table is itself a **[OPEN ENGINEERING QUESTION]** — see §17, Q6 — because the existing signal is scoped to a `prospect_id`, and the mapping to a global `entity_id` requires the Entity resolver (§4) to exist first.

**Unchanged, not reopened [PO-DECIDED]:** Entity Status ≠ Entity Reality ≠ Opportunity Eligibility. `CLOSED_TEMPORARILY`/`CLOSED_PERMANENTLY` remain informational/contextual; no new hard eligibility rule is introduced; D16's separation is preserved exactly.

---

## 13. Cache Architecture

**Current state, re-confirmed this pass [FACT]:** `research_signal_cache_index`'s `signal_kind` CHECK constraint (`0045_research_signal_cache_index/migration.sql:65-66`) is unchanged from the prior audit — still missing `GOOGLE_PLACES_STATUS`, `PUBLIC_INTENT`, `FIRST_PARTY`. Lookup key is `(user_id, normalized_domain, signal_kind)`; uniqueness is `(user_id, normalized_domain, signal_kind, signal_id)`, deliberately allowing multiple live rows per key (conflict resolved at read time via `observed_at DESC`).

**Required future identity dimensions, specified as a choice set [SPEC]:**

| Lookup identity | When used |
|---|---|
| `(user_id, normalized_domain, signal_kind)` | **Unchanged**, for every kind that has not cleared the OQ-6 public bar — i.e. `WEBSITE`/`NEWS`/`TECH_STACK` continue exactly as today, per-user only. |
| `(user_id, entity_id, signal_kind)` | Not required — an Entity-scoped *private* cache dimension adds complexity without a stated benefit; not specified further here since OQ-6 does not ask for this. |
| `(entity_id, signal_kind)` — no `user_id` | For kinds that **have** cleared the public bar (`GOOGLE_PLACES_STATUS` today; the `PUBLIC_ELIGIBLE` subset of `WEBSITE`/`NEWS`/`TECH_STACK` fields per OQ-6, once §10's classification table exists) — this is the **global, cross-freelancer reuse** dimension. |

**Exactly when evidence can be reused [SPEC]:**
- **Same freelancer:** unchanged — existing `(user_id, normalized_domain, signal_kind)` path, governed by existing per-kind freshness windows.
- **Different freelancer:** only for rows that are both (a) a public-cleared kind/field (OQ-6) and (b) resolved to a shared `entity_id` (§4) — never via `normalized_domain` alone, since two different freelancers' `companies` rows for the same business are only linked through the Entity layer, not through matching domains directly (two users could have independently created two different `companies` rows for the same domain before this architecture existed — see §14).
- **Public factual evidence** (`GOOGLE_PLACES_STATUS`, future public-cleared fields): reusable cross-freelancer once keyed by `entity_id`.
- **Private research** (everything not cleared by OQ-6): never cross-freelancer, regardless of Entity resolution.
- **Stale evidence:** excluded by the existing per-kind freshness windows, unchanged (reused exactly as today, per OQ-9's own instruction not to introduce new TTLs).
- **Conflicting evidence:** reuse the existing "multiple live rows, resolve by `observed_at DESC` at read time" pattern already in production — no new invention needed, confirmed still applicable.

**Migration approach [SPEC]:** widen the `signal_kind` CHECK to include `GOOGLE_PLACES_STATUS` now (narrow, additive, independently valuable even before the Entity layer exists — this was already flagged "READY FOR IMPLEMENTATION" in the prior specification and remains true). Add `entity_id` as a new, nullable column once the Entity layer exists; do not replace the existing key.

---

## 14. Historical Safety

| Data | Historical change? | Entity mapping? | Public/private change? | Risk | Safe treatment |
|---|---|---|---|---|---|
| `companies` | None required | New `entity_id`, nullable, defaults `NULL` for all existing rows | No | Low, if nullable and never backfilled by inference | Add column only |
| `prospects` | None | None directly | No | Low | No change |
| `research_signals` | None required | None — stays private/ambiguous except via the new §10 classification table, which is purely additive metadata, not a row change | Only for kinds/fields OQ-6 already cleared (`companySummary`/`businessModel`) | Medium if the §17 Q5 LLM-output-safety question is skipped | Apply §10's classification table prospectively; do not retroactively "publish" historical rows without re-screening them against Q5's concern |
| `research_signal_cache_index` | None for existing rows; `GOOGLE_PLACES_STATUS` CHECK-widening is forward-only/additive | New `entity_id`, nullable, `NULL` for all historical rows | Only `GOOGLE_PLACES_STATUS` and OQ-6-cleared fields populate `entity_id` going forward | Low | Additive only |
| `lead_unlock_contacts` | None | **Never mapped** (OQ-7) | No | High if ever promoted without a new, separate authorization | Confirmed no path exists today (§11); keep it that way |
| Existing website-less-dropped discoveries (pre-C-1-fix) | **Permanent, irreversible gap** — nothing was ever persisted for these, so there is no row to retroactively fix | N/A | N/A | None (nothing existed to misclassify) | No action possible; purely forward-looking once the normalization fix ships |

**Should `entity_id` initially be nullable on historical rows? Yes — the only safe answer. [SPEC]** Any non-null default would require inventing a resolution for rows the resolver never actually evaluated, which is exactly the "no retroactive identity inference" rule this entire architecture is built to avoid (D1: Entity ID never derived from an external attribute; this applies with equal force to *not inventing* a value for old rows).

**No backfill is specified or implied by this document**, per the instruction not to invent one.

---

## 15. C-1 Through C-7 Compatibility

| Decision | Status | Why |
|---|---|---|
| C-1 (no-website discovery) | **Requires implementation change** | `normalizeCandidate()` still rejects website-less candidates today (§1 Item 10, re-confirmed this pass); C-1 itself is not reopened, but its implementation is the modifying change specified in §6. |
| C-2 (zero-result messaging) | **Compatible** | Untouched by this architecture; no interaction found. |
| C-3A (all 17 services) | **Compatible** | Untouched; no interaction. |
| C-3B (zero-AI operation) | **Requires implementation change** | Confirmed still blocked by exactly the two coupled points in §1 Item 18/§16 below; C-3B's requirement is unchanged, only its implementation remains open. |
| C-4 (UNKNOWN ranking dimensions) | **Compatible** | No interaction with identity/Entity work found. |
| C-5 (discovery provenance) | **Requires implementation change** | Extended, not contradicted, by the new `DiscoveryEvent`/`discovery_attempts` tables (§7, §8) — C-5's stated minimum (provider/query/timestamp) is a subset of what `DiscoveryEvent` now specifies. |
| C-6 (opportunity list) | **Compatible** | No interaction found; `opportunities` schema is unchanged by this architecture (§1 Item 5/17). |
| C-7 (why found) | **Requires implementation change** | Currently cannot be satisfied at all — no provenance is persisted anywhere (§1 Item 15, confirmed zero hits for `actual_query`). `DiscoveryEvent` (§7) is the required implementation, not a reopening of the C-7 decision itself. |

No C-series decision is **blocked** or **requires engineering clarification** beyond what is already specified above — each either needs no change or has a fully specified (if not yet built) implementation path.

---

## 16. Zero-AI Operation

**Re-verified this pass, unchanged from prior audit [FACT]:**
- `packages/config/src/env.ts:72` — `ANTHROPIC_API_KEY: z.string().trim().min(1)` — mandatory, no default, no `.optional()`.
- `apps/worker/src/index.ts:105-124` — `createResearchModel(...)` called unconditionally for both primary and fallback provider, inside `main()`, before `runSearchWorkerPollLoop(...)` is ever invoked.
- `packages/core-research/src/researchModelFactory.ts:19-20` — `RESEARCH_PROVIDER_NAMES = ['anthropic','openai','gemini']`, no "none" sentinel.
- `packages/core-research/src/admission.ts:11-103` — pure, no I/O, decides AI eligibility only; confirmed does not itself call AI (re-verified, unchanged).

**Exact engineering changes required [SPEC]:**
1. `ANTHROPIC_API_KEY` becomes conditionally required — only when an AI provider is actually selected/enabled — not globally mandatory at `loadEnv()`.
2. Gate at the call site: never invoke `createResearchModel(...)` at all when a zero-AI mode flag is set, rather than inventing a fake `'none'` provider in the factory's enum. **[REC]**, same reasoning as the prior specification (lower-risk than a fake implementation).
3. Both eager `createResearchModel(...)` calls in `main()` become conditional on that flag.
4. `env.test.ts`'s existing assertion ("missing `ANTHROPIC_API_KEY` is a boot failure") must be revised to apply only when an AI provider is selected; a new test must assert a full deterministic search→opportunity pipeline completes with zero Anthropic SDK invocations when zero-AI mode is active — confirmed **no such test exists today**.
5. The deterministic core (`evaluator.ts`, `universalRanking.ts`, worker "Pass 1", `admission.ts`) needs **no change** — all confirmed already AI-free this pass, exactly as before.

---

## 17. Engineering Open Questions

Strictly the genuinely unresolved items surfaced by this pass — not manufactured for length.

### Q1 — Does requesting `places.id` change the Google Places billing tier?
1. **Why it matters:** if it moves the request into a higher billing tier, the cost model for every discovery call changes — a product-economics concern, not just an engineering one.
2. **Repository evidence:** the existing `businessStatus` addition was verified billing-tier-neutral and documented as such (`googlePlacesClient.ts:69-78`); no equivalent verification exists for `places.id` anywhere in the repo.
3. **Options:** (a) confirm via Google's current Places API billing documentation before implementation; (b) implement behind a flag and verify via a staging-environment billing check before full rollout.
4. **Analyst recommendation:** (a) — Place ID is commonly documented as a Basic-tier (no extra cost) field, but this must be confirmed against live provider documentation, not assumed from this repository.
5. **Requires PO decision?** No — this is a factual/cost-verification question, not a product trade-off, unless the answer turns out to be "yes, it raises cost materially," in which case a PO cost/benefit decision would follow.
6. **Can implementation proceed without resolving it?** No — implementing the field-mask change without this confirmation risks an unbudgeted cost increase.

### Q2 — Transaction boundary for Entity + DiscoveryEvent + Prospect writes
1. **Why it matters:** without atomicity, a partial failure could leave an orphaned Entity or DiscoveryEvent with no corresponding Prospect, corrupting the audit trail C-5/C-7 depend on.
2. **Repository evidence:** existing Company/Prospect writes use independent, per-statement `ON CONFLICT` idempotency (`pgRepository.ts`), not a shared multi-statement transaction — this pattern doesn't directly answer whether a three-way Entity write needs one, since no such three-way write exists today.
3. **Options:** (a) wrap all three writes in one DB transaction; (b) keep them independent and rely on a reconciliation/cleanup job for orphans; (c) make Entity/DiscoveryEvent creation idempotent enough that a retry after partial failure is always safe without a transaction.
4. **Analyst recommendation:** (a) — simplest to reason about, avoids needing a cleanup job, and matches the audit-trail integrity goal directly.
5. **Requires PO decision?** No — purely an engineering reliability question.
6. **Can implementation proceed without resolving it?** No — this must be settled before the Entity-creation write path is built, or the orphan risk is baked in from day one.

### Q3 — Does `discovery_attempts` store the raw failed candidate payload?
1. **Why it matters:** storing raw provider output aids debugging but increases the data-retention/privacy surface for data that, by definition, couldn't even be normalized into a candidate.
2. **Repository evidence:** no precedent exists — no table in the repo stores raw, unvalidated provider payloads today; `research_signals` and `companies` only ever store normalized/validated data.
3. **Options:** (a) store the raw `{name, website, businessStatus}` as received; (b) store only the enumerated failure reason, no raw payload; (c) store raw payload with a short, separate retention/TTL policy distinct from the rest of the schema.
4. **Analyst recommendation:** (b) — lowest privacy/retention risk, and the failure reason alone is normally sufficient for debugging a normalization rule, consistent with this repo's general pattern of not storing raw external payloads outside the one documented Razorpay webhook-retention exception.
5. **Requires PO decision?** Arguably yes, if "raw payload retention" is considered a data-handling policy question rather than a pure engineering one — flagging for PO awareness even though it's framed here as engineering.
6. **Can implementation proceed without resolving it?** Yes, with option (b) as the safe default — the table design (§8) does not require raw storage to be useful.

### Q4 — Classification of `targetCustomers`, `visibleProblems`, `automationOpportunities`
1. **Why it matters:** OQ-6's "at minimum" list named only 6 of the 9 fields currently produced; these 3 are left unclassified, meaning a future implementer has no instruction for them.
2. **Repository evidence:** all three are confirmed LLM-generated output fields in the same `leadResearchSchema`, mapped to `kind = WEBSITE` (`targetCustomers`, `visibleProblems`) or `kind = TECH_STACK` (`automationOpportunities`) via `FIELD_KIND`.
3. **Options:** (a) treat as private by default (safest, consistent with OQ-6's own framing that interpretive content defaults private); (b) classify by analogy — `visibleProblems` groups with the interpretive/private set, `targetCustomers` is ambiguous; (c) explicitly ask the PO to extend OQ-6's list.
4. **Analyst recommendation:** (a) as the immediate safe default, with (c) recommended before any implementation that actually exposes a public-evidence read path.
5. **Requires PO decision?** Yes — OQ-6 named specific fields; these three were not named, and classifying them is a product judgment (is a target-customer description "public fact" or "freelancer framing"?), not something this document should decide.
6. **Can implementation proceed without resolving it?** Yes — implementation can proceed using only the 6 named fields; these 3 simply stay private (the safe default) until classified.

### Q5 — Are LLM-generated `companySummary`/`businessModel` actually safe to expose cross-freelancer without a content-safety check?
1. **Why it matters:** OQ-6 classifies these as public-eligible based on field *naming*, not on any verification that the LLM never injects freelancer-specific or competitively-sensitive framing into a "summary" field in practice.
2. **Repository evidence:** `leadResearchSchema`'s own field descriptions (not fully quoted in this audit) define what the model is *asked* to produce, but nothing in the repository verifies what it *actually* produces is free of interpretive leakage — no test or validation of this exists today.
3. **Options:** (a) ship the classification as-is, trusting the field-naming distinction; (b) add a lightweight automated check (e.g. a secondary classifier or heuristic) before any row is served cross-freelancer; (c) require a human spot-check period before fully enabling cross-freelancer reads of these two fields.
4. **Analyst recommendation:** (c) as a pragmatic middle ground — avoids both the cost of (b) and the risk of (a), given this is explicitly flagged by the PO decision's own text as not-yet-authorizing "immediate cross-freelancer sharing."
5. **Requires PO decision?** Likely yes, if a spot-check/rollout-gating process has cost/timeline implications; otherwise this is engineering judgment within OQ-6's already-granted scope.
6. **Can implementation proceed without resolving it?** The schema/classification-table work (§10) can proceed; the point at which a read path actually serves these fields cross-freelancer should wait for this question's resolution.

### Q6 — Mapping the existing per-user `GOOGLE_PLACES_STATUS` signal into the new global `entity_status_evidence` table
1. **Why it matters:** `detectPlacesEntityReality()` writes a per-`prospect_id`-scoped signal today; `entity_status_evidence` (§12) is keyed by `entity_id`. Someone must decide exactly when/how a per-user signal becomes a global status observation.
2. **Repository evidence:** no existing code performs any per-user-to-global mapping of any kind (confirmed repo-wide, §1 Item 16) — this is a wholly new write path.
3. **Options:** (a) write to both tables at signal-creation time, once the Entity resolver (§4) has already run for that discovery; (b) a separate, asynchronous backfill/sync process; (c) derive `entity_status_evidence` lazily, at read time, by joining through `companies.entity_id` rather than maintaining a separate table at all.
4. **Analyst recommendation:** (a) — keeps provenance tight (one write transaction per discovery, same timing as the Entity resolution itself) and avoids the staleness risk of (b) or the join complexity of (c).
5. **Requires PO decision?** No — this is purely a data-flow/timing design question within already-decided D15/OQ-9 semantics.
6. **Can implementation proceed without resolving it?** No — the Entity Status model (§12) cannot be populated at all until this write path is designed, since it is the *only* planned producer today.

### Q7 — Exact `identity_evidence` write path when the Entity resolver runs mid-discovery
1. **Why it matters:** §4's resolver needs to run somewhere in the discovery pipeline, read existing `identity_evidence` rows, decide an outcome, and then write new rows — this orchestration doesn't exist and its placement (synchronous in the discovery service vs. a separate worker step) affects discovery latency and failure handling.
2. **Repository evidence:** `runDiscoveryForOwner` (`service.ts:123-142`) is the only current per-candidate loop; it has no resolver step today because none is needed yet.
3. **Options:** (a) inline the resolver call inside the existing per-candidate loop, synchronously; (b) a separate, subsequent worker pass (mirroring the existing "Pass 1"/"Pass 2" structure already used for deterministic signals/AI escalation).
4. **Analyst recommendation:** (b) — consistent with the existing codebase's own pattern of separating discovery from later deterministic/AI passes, and avoids slowing down the initial discovery write path while the resolver logic is first built and tested.
5. **Requires PO decision?** No.
6. **Can implementation proceed without resolving it?** No — this is a prerequisite design decision for building the resolver at all.

---

## 18. Implementation Readiness Matrix

| Area | PO status | Engineering status | Ready to implement? | Blocking question | Required artifact |
|---|---|---|---|---|---|
| Place ID capture | PO-decided (OQ-1, OQ-4 context) | Fully specified (§5) | **READY FOR IMPLEMENTATION** (pending Q1) | Q1 (billing tier) | Field-mask change, type change, tests |
| `DiscoveryEvent` minimum schema | PO-decided (D21, C-5, OQ-8) | Specified (§7); transaction boundary open | **NEEDS ENGINEERING SPEC** | Q2 | Transaction-design note |
| `discovery_attempts` (failed-normalization log) | PO-decided (OQ-8) | Specified (§8); raw-payload question open | **NEEDS ENGINEERING SPEC** | Q3 | Retention-policy decision |
| Zero-AI boot path | PO-decided (C-3B) | Fully specified (§16) | **READY FOR IMPLEMENTATION** | None | Env schema + worker boot change + tests |
| `research_signal_cache_index` CHECK widening (`GOOGLE_PLACES_STATUS`) | N/A (narrow gap-fix, pre-existing) | Fully specified (§13) | **READY FOR IMPLEMENTATION** | None | Migration (additive CHECK widen) |
| Entity/IdentityEvidence core model | PO-decided (D1/D8/D12/D22, OQ-1–OQ-3) | Specified (§2, §3, §4) | **NEEDS ENGINEERING SPEC** (new tables, no destructive migration, but non-trivial build) | None PO-blocking | Schema design review, resolver test plan |
| Website-less normalization fix (C-1) | PO-decided (C-1) | Specified (§6); this is a **modifying**, not additive, change | **NEEDS ENGINEERING SPEC** (nullability ripple-effect audit of `NormalizedCandidate` callers) | None PO-blocking | Caller audit + migration making `normalized_domain` nullable |
| D23 verification of `websiteUri` | PO-decided (OQ-4) | Specified (§9) | **READY FOR IMPLEMENTATION**, once Entity model exists | None | Verification-flag logic in `identity_evidence` writer |
| OQ-6 field classification | PO-decided (OQ-6) | Specified (§10); 3 fields unclassified | **PARTIALLY READY** — 6 of 9 fields ready, 3 need Q4 | Q4, Q5 | Classification reference table + Q4/Q5 resolution |
| Lead-unlock isolation | PO-decided (OQ-7) | Confirmed already compliant (§11) | **READY FOR IMPLEMENTATION** (no change needed — already correct) | None | None — status-quo preservation only |
| Entity Status derivation | PO-decided (OQ-9) | Specified (§12); mapping write path open | **NEEDS ENGINEERING SPEC** | Q6 | Write-path design |
| Entity-aware cache | PO-decided (implicitly, via OQ-6/D15) | Specified (§13) | **NEEDS ENGINEERING SPEC** (depends on Entity model existing first) | None PO-blocking, but depends on the Entity model item above | Cache-key migration design |
| Historical safety | PO-decided (implicit in D1/D10) | Fully specified (§14) | **READY FOR IMPLEMENTATION** (pure additive-column policy) | None | None beyond the additive columns already specified elsewhere |
| OQ-5 (LinkedIn/profile evidence) | **Still PO-open** (deferred) | N/A | **BLOCKED** | OQ-5 itself | A producer must exist first; then a PO decision |
| Resolver orchestration placement | N/A | Open (§17 Q7) | **NEEDS ENGINEERING SPEC** | Q7 | Pipeline-placement design note |

---

## 19. Implementation Boundary

**Explicitly NOT authorized by this audit:**
- No code was written or changed.
- No schema was created or altered.
- No migration was created or applied.
- No database was changed.
- No test was added.
- No commit was made.
- No push was made.
- No governance decision (D1–D23, C-1–C-7, OQ-1–OQ-9, Phase 7B, Phase 8, K1) was reopened, reinterpreted, or silently altered.

This document is specification and audit output only.

---

## 20. Final Recommendation

**B. READY AFTER ENGINEERING SPECIFICATION.**

Rationale: every one of the nine PO decisions (OQ-1 through OQ-9) is now closed, and no item in this audit identifies a remaining **PO**-level blocker except OQ-5, which is intentionally deferred by PO choice, not blocking. However, the Entity/IdentityEvidence core model, the resolver orchestration, the `DiscoveryEvent`/`discovery_attempts` transaction and retention design, and the website-less normalization change's ripple effects on `NormalizedCandidate` callers all require engineering design work this document specifies but does not itself build. A small subset — Place ID field-mask capture (pending Q1's billing confirmation), the zero-AI boot-path fix, the `GOOGLE_PLACES_STATUS` cache CHECK-widening, and the lead-unlock-isolation status-quo — are independently **READY FOR IMPLEMENTATION** today and do not need to wait for the rest.

**NO IMPLEMENTATION IS AUTHORIZED BY THIS AUDIT.**
