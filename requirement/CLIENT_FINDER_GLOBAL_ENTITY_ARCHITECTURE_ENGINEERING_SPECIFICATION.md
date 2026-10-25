# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: ENGINEERING SPECIFICATION PACKAGE

**Status of this document: SPECIFICATION ONLY. READ-ONLY REVIEW.**
No production code, test, migration, configuration, or database was modified to produce this document. Nothing has been committed or pushed. No governance decision is made, invented, or silently converted from an engineering recommendation.

Every substantive claim below is tagged with exactly one of:
- **[FACT]** — EXISTING IMPLEMENTATION FACT, verified by reading the file/line cited.
- **[PO-DECIDED]** — EXISTING PO DECISION, cited to its governance record.
- **[SPEC]** — ENGINEERING SPECIFICATION (deterministic mechanics engineering can close now, within already-decided governance).
- **[REC]** — ENGINEERING RECOMMENDATION (a choice among several valid designs; not binding until a PO or follow-up engineering review confirms it).
- **[OPEN]** — OPEN PO QUESTION. Not decided here. Not invented here.

---

## 1. Executive Summary

The Global Entity Architecture (D1–D23, D20 deferred) is formally approved at the governance level (`CF-GLOBAL-ENTITY-ARCH-PO-DEC-001`, `CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001`). This package closes as much of the engineering specification as the existing governance record permits, and explicitly marks everything it does not permit as **[OPEN]**.

Headline findings:
- **No `DiscoveryEvent` concept exists in the codebase today** — not a table, not a type, not a partial implementation. **[FACT]**
- **No Google Place ID (or any other provider-stable ID) is captured anywhere in the repository** — not in the Places field mask, not in `DiscoveryCandidate`, not in `companies`, not in `research_signals`. **[FACT]**
- **`normalizeCandidate()` still rejects every website-less candidate outright** (`packages/core-discovery/src/normalize.ts:47`) — C-1 ("no-website ≠ exclusion") is decided but **not implemented**. **[FACT]**
- **The zero-AI MVP (C-3B) is blocked by exactly one boot-time design point**: `ANTHROPIC_API_KEY` is a mandatory, non-optional boot-time validation (`packages/config/src/env.ts:70`), and the worker's `createResearchModel(...)` is constructed *eagerly, unconditionally, at process start* (`apps/worker/src/index.ts`, inside `main()`), before the poll loop ever runs. The deterministic qualification/ranking/admission core is **already** AI-free today. **[FACT]**
- **`GOOGLE_PLACES_STATUS` — the one clearly public, already-implemented Entity-adjacent signal — is structurally excluded from the only caching mechanism that exists** (`research_signal_cache_index`'s `signal_kind` CHECK constraint was never widened to include it, unlike `research_signals`' own CHECK, which was). **[FACT]**
- Several identity/evidence/threshold questions are **explicitly and correctly left undecided by governance itself** (D12/D13 exact thresholds, D23 verification sufficiency for `websiteUri`, lead-unlock-contact promotion). This document does not close them; it isolates exactly what remains blocked.

**Overall status: BLOCKED — both PO DECISION REQUIRED and ENGINEERING SPECIFICATION REQUIRED on separate, named items** (see §20).

---

## 2. Governance Baseline

Read directly for this review:
- `requirement/CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_PO_DECISION_RECORD.md` — `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` (D1, D8–D19, D21–D23; D20 deferred). **[PO-DECIDED]**
- `requirement/CLIENT_FINDER_DEC005_GLOBAL_IDENTITY_SCOPE_SUPERSESSION_PO_DECISION.md` — `CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001`, narrowly superseding DEC-005's "NOT a global/shared identity" clause only. **[PO-DECIDED]**
- `requirement/CLIENT_FINDER_C_SERIES_PRODUCT_OWNER_DECISION_RECORD.md` — `CF-C-SERIES-PO-DEC-001` (C-1 through C-7). **[PO-DECIDED]**

Referenced by name inside the records above and treated as authoritative context, but **not independently re-read line-by-line in this pass** (their *existence and headline conclusion* is taken as given; where their exact content matters to a specific finding below, that is called out explicitly rather than assumed): cross-freelancer/same-freelancer evidence reuse, evidence transparency/conflict/staleness, evidence deletion/suppression, cache conflict, signal freshness/signal-specific freshness, Phase 8 Entity Reality Activation, Entity Reality Eligibility, service+geography-only search input/backend defaults, qualification-without-category-plausibility.

Explicitly **not reopened or touched** by this document, per the governance record's own boundary and per the brief's protected-area list: the 17-family service taxonomy, K1 contact-identifier semantics, the universal ranking framework's dimensions, the core-search state machine, Service+Geography-only input, the ₹1,499 commercial model, Razorpay/webhook logic, D20 merge/split.

---

## 3. D12 — Identity Evidence Specification

D12 **[PO-DECIDED]**: identity evidence strength is evidence-specific and deterministic, using D22's four categories. Categories 1–3 may participate in resolution (subject to D13); Category 4 never does. No numeric/universal threshold is to be invented here.

| Evidence type | Category | Source (today) | Normalization | Verification (D23) | Comparison | Resolution role | Conflict behavior |
|---|---|---|---|---|---|---|---|
| Google Place ID | 1 | Not captured today — **[FACT]**, see §6 | Exact-match on the opaque provider token, scoped to `(provider='GOOGLE_PLACES', id)` — a Place ID from one provider namespace must never be compared against another provider's ID space. **[SPEC]** | Received directly in a live Places API response for *this* place is a reliable source directly associating the value with the entity, per D23's own test. **[SPEC]**, see caveat in §5. | Byte-exact string equality after trim; no case-folding (opaque token, not human text). **[SPEC]** | Can it resolve alone? **[OPEN]** — D13 reserves this explicitly. | Two Entities each already matched to the *same* Place ID from independent discoveries → conflict; never auto-merge (D13). Exact disposition of the *new* discovery in that case is **[OPEN]** (see §7, Case I). |
| Website / domain | 2 | `DiscoveryCandidate.website`, normalized via `normalizeDomain()` (`packages/core-discovery/src/normalize.ts`) **[FACT]** | Existing `normalizeDomain()` behavior beyond "returns a bare domain or null" (www-stripping, case-folding, subdomain handling) was **not independently re-verified line-by-line in this audit** — flagged for a short follow-up read before an identity resolver consumes it. **[OPEN — ENGINEERING REVIEW REQUIRED]** | Whether Google Places' `websiteUri` field itself constitutes D23 "verification" (vs. a self-reported/unverified business listing field) is **explicitly not decided by this document** — see §5. **[OPEN]** | Exact-match on normalized domain. **[SPEC]** | Can it resolve alone? **[OPEN]** | Two Entities with the same normalized domain → conflict, never auto-merge; disposition of new discovery **[OPEN]**. |
| Official profile URL | 2 | Not captured in discovery today (no LinkedIn/profile producer found active — §9) | Normalize scheme+host (lower-case), preserve path (different companies have different paths on the same host, unlike a bare domain). **[SPEC]** | Same open question as domain — does the hosting platform's own curation constitute a "reliable source"? **[OPEN]** | Exact-match on normalized URL. **[SPEC]** | **[OPEN]** | Same pattern as above. |
| Verified business phone | 3 | Not captured in discovery today — Google Places field mask explicitly excludes phone (`packages/core-discovery/src/googlePlacesClient.ts:74`, comment: "never requests ratings/reviews/photos/hours/phone"). **[FACT]** | N/A until a producer exists. | N/A | N/A | **[OPEN]**, and moot until a producer exists. | N/A |
| Verified business-email domain | 3 | Not captured in discovery today; exists only post-purchase in `lead_unlock_contacts` (`BUSINESS_EMAIL` kind) — see §11, explicitly **not** authorized for promotion to global identity evidence. | N/A | N/A | N/A | **[OPEN]** and moot pending §11. | N/A |
| Name, geography, category, textual similarity, reviews/descriptions | 4 | Captured today (`companies.name`, `searches.geography`, etc.) | Lower-case + trim for display/dedup-hinting only — never binding, since Category 4 never resolves identity. **[SPEC]** | N/A — D12 forbids independent resolution regardless of verification. | N/A for identity purposes. | **Never resolves or merges alone — decided (D12).** May only surface an `UNCERTAIN_POSSIBLE_DUPLICATE` hint for human/freelancer review. **[SPEC]** | N/A |

---

## 4. D13 — Resolution Specification

D13 **[PO-DECIDED]**: thresholds are evidence-specific; some identifiers *may* be sufficient alone; some *may* require corroboration; weak evidence never resolves; conflicting strong evidence never auto-merges. Exact numeric/categorical thresholds are explicitly **not** decided and must not be invented here.

**Naming check against repository convention [FACT]:** every existing enumerated-state field in this schema is `TEXT NOT NULL` + a `CHECK (... IN (...))` constraint, never a native Postgres enum type — e.g. `opportunities.state CHECK (... IN ('NEW','RESEARCHED'))`, `research_signals.classification CHECK (... IN ('OBSERVED','INFERRED','UNKNOWN'))`, `lead_unlock_contacts.kind CHECK (... IN ('BUSINESS_EMAIL','PERSONAL_EMAIL','UNCERTAIN_EMAIL','PHONE'))`. The proposed outcome names `DEFINITE_MATCH` / `UNCERTAIN_POSSIBLE_DUPLICATE` / `NO_MATCH_NEW_ENTITY` are syntactically consistent with this convention. **[SPEC]**

Resolution decision matrix, by evidence state:

| Evidence present | Can resolve alone? | Requires corroboration? | What counts as conflict? | Outcome |
|---|---|---|---|---|
| ≥1 Category 1 (Place ID) | **[OPEN]** | **[OPEN]** | Same Category-1 value already bound to a *different* existing Entity | If eventually authorized alone and unconflicted → `DEFINITE_MATCH`. Until authorized: cannot be used to bind to an existing Entity — falls through to the "no usable Category 1–3 evidence" row below. |
| ≥1 Category 2 (domain/profile URL) | **[OPEN]** | **[OPEN]** | Same normalized value bound to a different Entity | Same treatment as above, pending PO. |
| ≥1 Category 3 (phone/business-email) | **[OPEN]**, and moot — no producer exists today (§3) | **[OPEN]** | Same treatment as above, pending PO + pending a producer. |
| Two or more independent Category 1–3 anchors agreeing on one existing Entity | Not independently decided, but D13 states "multiple independent strong anchors may strengthen confidence" — the best-positioned case for eventual `DEFINITE_MATCH` once at least one corroboration rule is set. **[OPEN]**, but flagged as the lowest-risk candidate for a future PO decision. |
| Two strong (Category 1–3) anchors pointing to two *different* existing Entities | Never auto-merge (decided, D13/D1). Mark both Entities' evidence `CONFLICTED` (reusing the D18 relationship-evidence conflict pattern). Disposition of the *new* discovery itself (attach provisionally to one side, or spawn a third, independent Entity) is **[OPEN]**. **[REC]**: default to `NO_MATCH_NEW_ENTITY` for the new discovery until PO decides — this is the safe/conservative reading of D14's bias toward "unresolved → new Entity," not an invented threshold. |
| Only Category 4 (name/geography/category/similarity/reviews) | Never resolves alone — **decided (D12)**. | → `NO_MATCH_NEW_ENTITY`, every time, even on repeat discovery of the same real business (see §7, Cases F/G — this is a named, known consequence of D12/D14, not a defect). |
| No Category 1–3 evidence at all | Same as above row. | → `NO_MATCH_NEW_ENTITY` (per D14, decided). |

**ENGINEERING SPECIFICATION CANNOT BE CLOSED WITHOUT PO INPUT** on: (a) whether any single Category 1–3 evidence type resolves alone, (b) exact corroboration rule when two Category 1–3 anchors agree, (c) disposition of the *new* discovery when two existing Entities conflict. These are listed again, undiluted, in §19.

---

## 5. D23 — Verification Matrix

D23 **[PO-DECIDED]**: evidence is verified when a reliable source directly associates the value with the Entity; syntax alone is not verification; verification ≠ freshness; two independent sources are *not* universally required.

| Evidence type | Direct source today | Qualifies as verified? | Does NOT qualify as verified | Survives across discoveries? | Freshness vs. verification | Provenance to retain |
|---|---|---|---|---|---|---|
| Google Places Place ID | A live `places:searchText`/Place Details response for that specific place | **[OPEN]** — see note below | A value typed in manually, or copied from an unrelated listing | Yes, in principle — an ID issued by the same provider for the same place is a stable fact, not a point-in-time observation, so once verified it does not need re-verification on every discovery. **[SPEC]**, consistent with D23 "verification is separate from freshness." | Verification is a one-time structural fact about *how the value was obtained*; freshness is about whether the business *still* exists/operates — these are independent per D23. **[SPEC]** | Provider name, raw field name requested, timestamp of the API response, the DiscoveryEvent ID it was captured on. **[SPEC]** |
| Google Places `websiteUri` / domain | Same live response | **[OPEN]** — Google's own documentation does not claim to verify domain *ownership*; a `websiteUri` is Google's curated listing field, which may itself originate from unverified self-reported business-profile data. The brief explicitly instructs: do not assume `websiteUri` is automatically verified. This document does not assume it either. | Syntax-valid URL string alone, with no source association at all | Open, pending the verification question itself | Same structural independence as above, once/if verification is settled | Same as above |
| Official profile URL | Not currently captured (§3) | **[OPEN]**, moot until captured | — | — | — | — |
| Business phone | Not currently captured (§3) | **[OPEN]**, moot | — | — | — | — |
| Business-email domain | Not currently captured in discovery (only post-purchase, §11) | **[OPEN]**, moot pending §11 | — | — | — | — |

No part of this matrix invents a universal rule such as "syntax = verified" or "Google-sourced = verified." Both remain **[OPEN]** exactly where the brief required.

---

## 6. Google Place ID Specification

All of the following are **[FACT]**, verified directly:

1. **Current field mask**: `packages/core-discovery/src/googlePlacesClient.ts:79` — `const FIELD_MASK = 'places.displayName,places.websiteUri,places.businessStatus';`. `places.id` is **not** requested.
2. **Current response type**: `ExternalDiscoveryResult` (`googlePlacesClient.ts:12-25`) has exactly `name`, `websiteUri`, `businessStatus` — no `id`/Place ID field.
3. **`DiscoveryCandidate`** (`packages/core-discovery/src/provider.ts:9-21`) has exactly `name?`, `website?`, `businessStatus?` — no provider-ID field.
4. **No field anywhere in the repository** (`companies`, `prospects`, `research_signals`, any cache, any type) stores a Google Place ID or any other provider-stable external ID — confirmed by a repository-wide grep for `placeId`/`place_id`/`providerId`/`provider_id`; every `providerId` hit found is the unrelated AI research-model provider identifier (e.g. `env.RESEARCH_PROVIDER`), not a Place ID.

**Engineering specification (what to change, not performed here):**

1. **Field to add**: `places.id` to `FIELD_MASK`. **[SPEC]**
   *Caveat on billing tier*: the existing comment at `googlePlacesClient.ts:69-78` confirms `businessStatus` was previously verified not to raise the request's billing tier above the `websiteUri`-driven Enterprise tier already in effect. Whether `places.id` is similarly billing-tier-neutral is **not established by anything in this repository** — Place ID is widely documented by Google as a Basic-tier (no additional cost) field in the current Places API, but that is external provider documentation, not a repository fact, and must be confirmed against Google's current billing documentation before implementation, exactly the same way the `businessStatus` addition was. **[OPEN — confirm against provider docs before implementation, not a repo fact]**
2. **`DiscoveryCandidate` carries**: an optional, nullable field, e.g. `placeId?: string | null`, following the exact existing pattern of `businessStatus?: string | null`. **[SPEC]**
3. **Where preserved**: in-memory from provider response through to wherever identity evidence is produced (today, nowhere persists it — see point 4). It must **not** be folded into `NormalizedCandidate` (which `normalizeCandidate()` intentionally keeps to exactly `{ name, normalizedDomain }`, per its existing minimal-surface design) — it is identity evidence, not discovery normalization. **[SPEC]**
4. **Where IdentityEvidence captures it**: as a new, distinct Category-1 evidence record (once an Entity/IdentityEvidence model exists — it does not exist today), not as a column bolted onto `companies` (which remains per-user, see §8). **[SPEC]**
5. **Tests required**: (a) field-mask string includes `places.id`; (b) `ExternalDiscoveryResult`/`DiscoveryCandidate` parsing handles a present, a missing, and a malformed `id`; (c) existing field-mask/billing-tier regression test pattern (mirroring the `businessStatus` precedent) extended to cover `places.id`. **[SPEC]**
6. **Existing behavior that must remain unchanged**: the `businessStatus`-driven Entity Reality elimination path (`detectPlacesEntityReality`, `eliminateDeterministically`) must not be touched by this addition — it is evidence-type-independent and already covered by its own tests. **[SPEC]**

**Effect on other areas** (restated from governance, not re-decided here): Place ID availability is a *precondition* for closing the website-less identity and dedup gaps (§7, §8) and for a non-fabricated DiscoveryEvent provenance record (§12) — but capturing it does **not** by itself authorize resolving on it alone (§4, still **[OPEN]**).

---

## 7. Website-less Identity Flow

Baseline facts **[FACT]**: `normalizeCandidate()` (`packages/core-discovery/src/normalize.ts:43-52`) rejects any candidate with a missing/falsy `website` (`if (!candidate.website) return null;`) *before* any Entity-level logic runs; a missing `name` is rejected the same way. Today, a website-less candidate is **silently dropped** (`service.ts:125-130`, counted only in an internal `skipped` counter) — it never reaches `CompanyRepository`, is never discoverable, and produces no Prospect. This is the exact behavior C-1 (Option C) has already decided must change, and has **not yet been implemented**.

The governing constraint, restated and never violated below: **name+geography is never identity** (D1/D12); an unresolved discovery always becomes a new Entity (D14); temporary provider failure is never confirmed absence (D14).

| Case | Entity creation/resolution | Prospect behavior | DiscoveryEvent behavior | Entity Reality | Opportunity eligibility | Discoverable? | Dedup possible? |
|---|---|---|---|---|---|---|---|
| **A. Place ID present, website absent** | Resolution-on-Place-ID-alone is **[OPEN]** (§4). Pending that: `NO_MATCH_NEW_ENTITY` (safe default). | Created — C-1 already forbids exclusion for website absence alone. | Would record the Place ID as `actual_query`/context once §12 exists. | Independent of website — governed only by `businessStatus` (§13), unaffected by this case. | Not excluded by website absence (C-1, decided). Standard Entity-Reality/qualification path applies. | Yes. | Not yet — Place ID isn't persisted today (§6). Once persisted, **[OPEN]** pending §4/§8. |
| **B. Place ID absent, verified phone present** | Phone isn't captured in discovery at all today (**[FACT]**, §3) — this case cannot occur in the current pipeline. If a future provider adds phone, same `NO_MATCH_NEW_ENTITY`-pending-PO treatment as Case A. | — | — | — | — | — | — |
| **C. Place ID + verified phone** | Two independent Category 1/3 anchors — the best-positioned case for a future corroboration-based `DEFINITE_MATCH` (§4), but **[OPEN]** until PO sets a corroboration rule. Today: moot (phone not captured). | Same as A. | Same as A. | Same as A. | Same as A. | Yes. | **[OPEN]**, pending §4. |
| **D. Official profile URL present, website absent** | Category 2 evidence, same open-resolve-alone question as domain (§3/§4). | Same as A. | Same as A. | Same as A. | Same as A. | Yes. | **[OPEN]**, pending §4. |
| **E. Business-email domain present, website absent** | Category 3; not captured in discovery (only post-purchase, §11, not promotable). | Same as A. | Same as A. | Same as A. | Same as A. | Yes. | **[OPEN]**/moot pending §11. |
| **F. Only name + geography** | Category 4 only → **never** resolves (decided, D12) → always `NO_MATCH_NEW_ENTITY`. **Known, accepted consequence**: the same real business rediscovered repeatedly with only name+geography will accumulate multiple distinct Entities over time — this is not a defect, it is what D12/D14 require until stronger evidence exists. **[SPEC]** | Created (C-1). | Created, entity_id = the new Entity each time. | Governed independently by `businessStatus`. | Not excluded. | Yes. | **No** — and none is authorized (D12 forbids name+geography uniqueness). |
| **G. Only name** | Same as F, strictly weaker. | Same as F. | Same as F. | Same as F. | Same as F. | Yes. | Same as F — no. |
| **H. No strong identity evidence at all (not even name)** | Structurally cannot occur as a persisted row today: `normalizeCandidate()` already rejects any candidate lacking a `name`, independent of the website question (**[FACT]**, `normalize.ts:44-45`). | N/A | N/A | N/A | N/A | No — dropped before persistence, same as today. | N/A |
| **I. Two strong identifiers conflict** | Never auto-merge (D13, decided). Mark `CONFLICTED`. Disposition of the *new* discovery: **[OPEN]** (§4). **[REC]** default `NO_MATCH_NEW_ENTITY` pending PO. | Created regardless (C-1; a conflicted identity doesn't mean the business isn't real). | Created; entity_id = whatever the conflict-resolution rule assigns (pending §4). | Independent, unaffected. | Not excluded by the identity conflict itself. | Yes. | Deferred to conflict resolution — **[OPEN]**. |
| **J. Website temporarily failed to fetch** | D14: temporary failure ≠ confirmed absence (decided). **Gap**: today's pipeline has no representation of "attempted and failed" distinct from "provider returned null" — both collapse to `websiteUri: null` / `candidate.website` falsy (**[FACT]**). This is the exact unresolved item the C-series record itself flags as still open: *"Any mechanism distinguishing 'confirmed no website' from a temporary fetch failure or ambiguous result — remains open per `CF-DISCOVERY-ARCH-002-Q1`."* **[OPEN — already flagged open in governance, not newly discovered here]** | Created (C-1 governs inclusion regardless of which sub-case caused the null). | Created. | Independent. | Not excluded. | Yes. | Same open status as Case A/D, plus the added precision gap above. |
| **K. Provider omitted website (never listed one)** | Same representation gap as Case J — `websiteUri: null` is indistinguishable in code from a fetch failure (**[FACT]**). C-1's baseline inclusion behavior is unaffected by this imprecision; only *downstream signal/messaging precision* is. | Same as J. | Same as J. | Same as J. | Same as J. | Yes. | Same as J. |
| **L. Provider explicitly indicates confirmed absence** | **NOT FOUND** — the current Google Places integration has no explicit "confirmed no website" indicator; `websiteUri` is simply nullable with no accompanying confidence/certainty field (**[FACT]**, `googlePlacesClient.ts:12-25`). If such a source is added by a future provider, it would be the one case where D14's "temporary failure" carve-out does *not* apply — but no such source exists today. | N/A today. | N/A today. | N/A today. | N/A today. | N/A today. | N/A today. |

**Hard constraint re-confirmed, no case above violates it**: no case uses name-only, geography-only, name+geography, or fuzzy similarity to establish identity.

---

## 8. Website-less Deduplication

Current state **[FACT]**: `companies.normalized_domain` is `TEXT NOT NULL` (`packages/db/prisma/migrations/0015_discovery/migration.sql:49`) under `UNIQUE("user_id","normalized_domain")`. Because the column is `NOT NULL`, the "does UNIQUE dedupe NULLs" question is **currently moot** — not because the constraint elegantly handles it, but because `normalizeCandidate()` already filters out every website-less candidate before any row is attempted (§7). **The NULL-dedup problem is real only once C-1 is implemented** and website-less candidates start reaching persistence — at that point, if `normalized_domain` becomes nullable, standard Postgres UNIQUE semantics treat every NULL as distinct, so `UNIQUE(user_id, normalized_domain)` would not deduplicate multiple website-less rows for the same user. This is a correct statement of ordinary Postgres behavior, not a claim about code that exists yet.

Options evaluated:

- **A. Place-ID-based identity**: a partial unique index `UNIQUE(user_id, google_place_id) WHERE google_place_id IS NOT NULL` once the column exists (§6). Solves dedup only when Place ID is present; does not help Cases F/G/H (§7). **[REC — partial]**
- **B. Entity resolver**: the full D1–D23 global layer. The eventual answer, but it requires D12/D13 closure first (§4, **[OPEN]**) — cannot be the *only* near-term mitigation.
- **C. Partial unique indexes**: `UNIQUE(user_id, normalized_domain) WHERE normalized_domain IS NOT NULL` (preserves exactly today's guarantee once the column is made nullable) plus the Place-ID partial index from (A). **Deliberately no unique index on name/geography** — none is authorized by D12, and none should be added. **[REC]**
- **D. Separate company/entity identity table**: introduce a new global `entities` table, with `companies.entity_id` as a nullable FK into it — this is the literal shape of D1/D8 (global Entity identity layered over the existing per-user sighting table). **[REC]**
- **E. Other**: none found superior given the stated constraints.

**[REC] Recommended target**: combine **C** (partial unique indexes, strong-identifier-only, never on weak evidence) with **D** (a new global `entities` table that `companies.entity_id` references). `companies` should **remain a per-user sighting table** — this preserves DEC-005's unmodified substance (user-owned Company, minimal fields, `UNIQUE(search_id, company_id)` Prospect dedup) exactly as the DEC-005 supersession record requires, and avoids retroactively inferring any `entity_id` onto historical rows (§15). This is a recommendation, not an authorization to migrate anything.

---

## 9. Public vs Private Evidence Audit

`research_signals` has **no visibility/scope/public column today** (**[FACT]**, confirmed absent in the base migration and in all three later widening migrations 0029/0030/0049). Ownership is inherited via `prospect_id → prospects.user_id`, by explicit design (DEC-008 pattern, quoted in the migration comment itself) — there is no denormalized owner column to carry a visibility flag onto even if one were added casually.

| Signal kind | Producer | Example content (quoted) | Public/private | Evidence category | Cross-user eligible? | Open question? |
|---|---|---|---|---|---|---|
| WEBSITE | `packages/core-research/src/mapping.ts` (`toNewResearchSignals`), fields mapped via `persist.ts` `FIELD_KIND` (`companySummary`, `businessModel`, `targetCustomers`, `visibleProblems`, `websiteIssues`, `contentOpportunities`) | Field names themselves (`websiteIssues`, `contentOpportunities`, `visibleProblems`) read as freelancer-facing *sales angle* framing, not bare public facts — e.g. "problems this site has that a freelancer could pitch fixing" | **C. Ambiguous** — mixed: some sub-fields (`companySummary`, `businessModel`) plausibly restate public facts; others (`websiteIssues`, `contentOpportunities`) are interpretive/outreach framing, not neutral observation | Research evidence, not D22 identity evidence | **[OPEN]** — do not assume public; recommend against blanket reuse until re-classified per sub-field | **[OPEN]** |
| JOB_POST | **NOT FOUND** — declared only in the `kind` type union and a freshness-window entry; no active producer | — | N/A — no current producer | — | N/A | Moot until implemented |
| LINKEDIN | **NOT FOUND** — same as JOB_POST | — | N/A | — | N/A | Moot until implemented |
| NEWS | Same code path as WEBSITE, field `growthOpportunities` | Interpretive ("growth opportunities" = sales angle, not a bare news fact) | **C. Ambiguous**, leaning private/interpretive | Research evidence | **[OPEN]** | **[OPEN]** |
| FUNDING | **NOT FOUND** — declared only in type union + freshness map; no active producer | — | N/A | — | N/A | Moot |
| TECH_STACK | Same code path, fields `aiOpportunities`/`automationOpportunities` | Interpretive sales framing, not neutral tech-stack fact | **C. Ambiguous**, leaning private | Research evidence | **[OPEN]** | **[OPEN]** |
| REVIEW | **NOT FOUND** — no active producer despite a freshness-window entry | — | N/A | — | N/A | Moot |
| MANUAL | **NOT FOUND** — no active producer; explicitly has *no* freshness window ("always STALE") | — | **B. Clearly freelancer/private** by nature (manually entered note) | N/A | No | N/A |
| PUBLIC_INTENT | `packages/core-research/src/intentSignal.ts` | "A captured, observed intent EVENT — a quote someone published" (code comment, `intentSignal.ts:8-9`) | **A. Clearly public factual**, by the producer's own definition | Research/intent evidence (governed by its own, separate, already-existing cross-freelancer public-evidence-reuse decision — referenced, not re-litigated here) | Per that existing, unchanged decision — not re-decided in this document | None raised here |
| FIRST_PARTY | `intentSignal.ts`, gated by `validateAuthorizationEvidence()` and the 0030 columns (`business_id/auth_status/auth_scope/auth_timestamp/integration_id`, frozen by trigger after insert) | Owner-authorized data tied to a specific integration/authorization grant | **C. Ambiguous** — this is governed by a separate, parallel governance track (the Client Intent Discovery / K1 / authorization-evidence work referenced in project memory) and is **explicitly out of scope for this document to reclassify** | Authorization-evidence-gated | Governed elsewhere, not reopened here | Out of scope here |
| GOOGLE_PLACES_STATUS | `packages/core-research/src/deterministicSignals.ts:154-186` (`detectPlacesEntityReality`) | "Google Places reports this business as permanently closed (CLOSED_PERMANENTLY)." (verbatim signal text) | **A. Clearly public factual** — describes the business itself (its operational status), sourced from a public provider API, not freelancer-authored | D22 Category 1-adjacent status evidence (not identity evidence, but public business fact) | Yes, in principle — it describes the Entity, not the freelancer's research | None raised here |

**No kind is assumed public by default.** Where the content is plausibly freelancer-authored interpretation (WEBSITE/NEWS/TECH_STACK's sales-angle fields), this document explicitly declines to classify it as public and flags it **[OPEN]**.

---

## 10. Global Evidence Architecture

Three architectures evaluated, per the brief:

- **A. Add visibility/scope to existing `research_signals`.** Lowest migration complexity (one nullable column + backfill-as-NULL). Risk: conflates freelancer-specific research with Entity-level public fact inside one table that was explicitly designed (DEC-008) to have no denormalized owner column at all — adding a visibility column here still leaves the *content* ambiguous per §9; the column alone doesn't resolve the WEBSITE/NEWS/TECH_STACK ambiguity.
- **B. Separate global public-evidence tables.** Cleanest privacy boundary — a kind that hasn't passed the §9 public-factual bar simply has no row in the global table, structurally, not just by a flag. Higher migration complexity (new tables, new write paths for the kinds that do qualify). Matches D11's "Entity evidence is append-only" model directly, and keeps `research_signals` exactly as-is for private/ambiguous research content.
- **C. Hybrid.** Keep `research_signals` unchanged for owner-scoped research (WEBSITE/NEWS/TECH_STACK/MANUAL and any future interpretive kinds); introduce a new, narrow global evidence store populated **only** from kinds already classified **A. Clearly public factual** in §9 (today: `GOOGLE_PLACES_STATUS`, and whatever the separate PUBLIC_INTENT track already authorizes) plus the new D22 Category 1–3 identity evidence types from §3/§6.

**[REC]**: **C (Hybrid)**. It requires no retroactive reclassification of ambiguous existing content, imposes zero migration risk on historical `research_signals` rows, and gives the clearest privacy boundary (a kind is global only if a human, not a column flag, decided it qualifies). This is a recommendation; no table is created by this document.

---

## 11. Lead Unlock Contact Analysis

`lead_unlock_contacts` (`packages/db/prisma/migrations/0042_lead_unlock_contacts/migration.sql`) stores `BUSINESS_EMAIL`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/`PHONE` values, scoped via `lead_unlock_id → lead_unlocks.user_id` (one freelancer, post-purchase reveal). **[FACT]**

No migration comment, column, or existing governance record authorizes promoting an unlocked contact into global Category-3 `IdentityEvidence`. **[FACT, confirmed by direct audit — no such authorization exists anywhere in the repository.]**

Per the brief's explicit instruction, and because the underlying K1 contact-identifier semantics are a protected area not to be touched by this document:

> **OPEN PO QUESTION — DO NOT PROMOTE.**

A phone or email being factually real and correctly extracted does not, by itself, make it globally shareable — that is a distinct privacy/consent question (the freelancer paid specifically to unlock it for their own outreach) that this document does not resolve and does not recommend bypassing.

---

## 12. DiscoveryEvent Specification

**No `DiscoveryEvent` table, type, or partial implementation exists anywhere in the repository today** — confirmed by a repository-wide search for `DiscoveryEvent`/`discovery_event` across `packages/` and `apps/`, with zero matches. **[FACT]**

**Minimum fields** (already decided, C-5 + D21): `provider`, `actual_query`, discovery `timestamp`, and (D21, additive) the `resolved Entity ID`. **[PO-DECIDED]**

Evaluated additional fields:
- `search_id`, `prospect_id` — structural foreign keys to already-existing records, not new evidentiary *content*. **[REC]** include them — they link the event to context that already exists, they don't "expand provenance into a richer raw-provider model" (the thing C-5 explicitly reserves for a future, separate PO decision). Flagged for PO confirmation out of caution, since the line between "structural FK" and "provenance expansion" is a judgment call this document should not make unilaterally. **[OPEN — confirm with PO before treating as closed]**
- Provider-specific discovery identifier (i.e., the Place ID itself, once captured per §6) — this is squarely within D21's "provider/source" minimum, not an expansion. **[SPEC]** include it.
- Raw result reference, status, failure reason — these *are* the richer raw-provider model C-5 explicitly defers to a future, separate PO decision. **[OPEN]**, not included by this specification.

**Retry**: each actual outbound provider call is itself the thing D21 requires provenance for ("the actual query sent") — a retry is a distinct, real call (even if its query string is identical), so **each attempt should create its own immutable event**. **[SPEC]**

**Duplicate discovery**: explicitly allowed — "multiple `DiscoveryEvent`s may refer to the same Entity" (D21, decided). **[PO-DECIDED]**

**Failed normalization**: a tension, not resolved here. D21's minimum fields include a *resolved* Entity ID — if a raw provider result fails to normalize into a candidate at all (e.g., garbage data), there is no Entity to resolve to, so the stated minimum schema cannot be satisfied for that case. **ENGINEERING SPECIFICATION CANNOT BE CLOSED WITHOUT PO INPUT**: does D21 intend `entity_id` to be strictly mandatory even for a failed-normalization record (implying such records live in a different, non-`DiscoveryEvent` log), or should the minimum-fields requirement be read as applying only once normalization succeeds? **[OPEN]**

**Failed Entity resolution**: not a tension — D14 (decided) means "failed to resolve" always yields a *new* Entity, never a null `entity_id`. So once normalization succeeds, `entity_id` is always populated (new or existing). **[SPEC]**

**Transaction boundary**: existing evidence shows Company and Prospect creation today use independent, per-statement `ON CONFLICT`-based idempotency (`pgRepository.ts`), not a shared multi-statement transaction wrapper, in the excerpts read. Whether a future Entity + DiscoveryEvent + Prospect write must be atomic is a genuinely new question current patterns don't answer either way. **ENGINEERING SPECIFICATION REQUIRED, not decided here.** **[REC, provisional only]**: these three writes should be wrapped in one transaction to avoid an orphaned Entity or DiscoveryEvent with no corresponding Prospect — but this is a recommendation for the implementation-design phase, not a closed specification.

---

## 13. Discovery Query Persistence

`buildQuery()` (`packages/core-discovery/src/googlePlacesProvider.ts:15-19`): exact current logic —
```ts
function buildQuery(search): string {
  const { service, geography, keywords } = search.parameters;
  const parts = [`${service} in ${geography}`, ...keywords];
  return parts.join(' ').trim();
}
```
Its single output is passed directly into the live `client.searchText(query)` call (`googlePlacesProvider.ts:24-25`). **Nothing persists this string anywhere today** — confirmed by the absence of any write of `query` to any repository/log/table in the files read. **[FACT]**

**Specification**: capture the literal string `buildQuery()` returns, at the moment of the actual call, into `DiscoveryEvent.actual_query`, written once at event-creation time and never recomputed or updated afterward (DiscoveryEvents are immutable, D21). Each retry captures its own `actual_query` value independently — even if `buildQuery()`'s logic later changes, every historical event remains an accurate record of what was *actually* sent at the time, which is exactly what C-7 requires ("why found" derived from authoritative provenance, never reconstructed from current/mutable query-building logic). **[SPEC]**

---

## 14. Zero-AI MVP Specification

C-3B (decided, `CF-C-SERIES-PO-DEC-001`): core functionality must be able to operate with zero AI/LLM calls; AI remains optional enrichment; mandatory per-search/per-lead LLM calls must not be introduced.

**What already works without AI today [FACT]**:
- `packages/core-qualification/src/evaluator.ts` — documented as "pure, deterministic... no I/O, no clock, no randomness, no LLM call" (its own doc comment); only consumes pre-computed `StoredResearchSignal`/`StoredCategoryPlausibilityDetermination` *types*.
- `packages/core-acquisition/src/universalRanking.ts` — `rankByUniversalProfile()` purely sorts pre-computed ranking profiles; no I/O.
- The worker's "Pass 1" (`apps/worker/src/searchWorker/worker.ts`, `runCanonicalPipeline`) already computes deterministic signals, Entity-Reality elimination, and an in-memory ranking preview with **zero AI calls**, before any admission/escalation decision is made.
- `evaluateAdmission()` (`packages/core-research/src/admission.ts`) is documented "pure, no I/O" and only *decides* AI eligibility — it never calls AI itself.

**What actually blocks zero-AI boot today [FACT]** — exactly two coupled points:
1. `packages/config/src/env.ts:70` — `ANTHROPIC_API_KEY: z.string().trim().min(1)` is **mandatory**, no default, throws at `loadEnv()` if absent.
2. `apps/worker/src/index.ts`, inside `main()` — `createResearchModel(...)` is called **eagerly and unconditionally**, twice (once for the primary research attempt, once for `targetCustomerMatch`), *before* the poll loop starts. `createResearchModel`'s `'anthropic'` branch throws synchronously if the (already-mandatory) key is empty.

**Specification for the zero-AI path** (mechanical, not a PO decision — C-3B already authorizes the *requirement*; this closes the *how*):
- **Configuration**: `ANTHROPIC_API_KEY` must become conditionally required — only when an AI provider is actually selected/enabled — not globally mandatory at `loadEnv()`. **[SPEC]**
- **Provider selection**: `RESEARCH_PROVIDER_NAMES` (`packages/core-research/src/researchModelFactory.ts:19-20`) currently allows only `'anthropic' | 'openai' | 'gemini'`, defaulting to `'anthropic'` — there is no legitimate "no AI" selection today. Two valid designs: (a) add a `'none'`/deterministic sentinel to the enum and a corresponding no-op branch in the factory, or (b) **[REC, preferred]** gate at the call site — never invoke `createResearchModel(...)` at all when a zero-AI mode flag is set, so the factory's credential requirement is simply never exercised. (b) avoids inventing a fake `ResearchModel` implementation and is lower-risk. **[SPEC + REC]**
- **Worker wiring**: the two eager `createResearchModel(...)` calls in `main()` must become conditional on whether AI is enabled for that deployment/run, so a zero-AI boot never reaches them. This is the single concrete code change this specification identifies as necessary and sufficient to unblock boot. **[SPEC]**
- **Research model factory behavior**: no change needed to the pure deterministic core (qualification/ranking/admission) — it already has no AI dependency, confirmed above.
- **Test expectations**: `packages/config/src/env.test.ts:98-103` ("missing ANTHROPIC_API_KEY is a boot failure, not a first-call failure") currently and correctly guards against a *different* regression (a silently-deferred failure when AI *is* selected) — it must be revised to assert that omission is a boot failure **only when an AI provider is selected**, while a new test must assert the worker boots and completes a full deterministic search→opportunity pipeline with zero Anthropic SDK invocations when zero-AI mode is active. **No test today exercises a successful AI-less boot** — confirmed absent. **[SPEC]**

---

## 15. Entity Status Specification

`GOOGLE_PLACES_STATUS` **[FACT]**:
- Exact source: Google Places API `businessStatus` field (`'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'`, or `null`).
- Exact producer: `detectPlacesEntityReality()`, `packages/core-research/src/deterministicSignals.ts:154-186`.
- `observedAt`: set to the clock value passed into the producer at signal-creation time.
- Freshness: 30-day window (`signalCache.ts`'s `FRESHNESS_WINDOW_DAYS.GOOGLE_PLACES_STATUS = 30`).
- Values actually produced: **only** `CLOSED_PERMANENTLY` and `CLOSED_TEMPORARILY` generate a signal at all; `'OPERATIONAL'`, `null`, or any unrecognized string cause the function to `return null` — **no signal is produced for an operational business.**

**Direct answer to the brief's question**: *"whether ACTIVE is explicitly observed today"* — **no**. The system currently only ever positively observes the two negative states; it never positively asserts `ACTIVE`. **[FACT]**

**How `UNKNOWN` should be derived [SPEC]**: the absence of any `GOOGLE_PLACES_STATUS` observation (including the `OPERATIONAL` case, which today produces silence rather than a signal) should map to Entity Status `UNKNOWN` by default, **not** be inferred as `ACTIVE`. Inferring `ACTIVE` from silence would fabricate an observation the system never actually made, which conflicts with D11 ("Entity evidence is append-only... each observation preserves... an actual observation"; absence of a row is not an observation). This conclusion follows directly from the two facts above, not from a new threshold.

**Status precedence under conflicting observations**: explicitly still open — the governance record's own "Open items" list (item 3) states "exact status-derivation precedence implementation detail under D15... is explicitly not decided by this record." Not invented here. **[OPEN — already flagged open by governance itself]**

**Separation restated (decided, not reopened)**: Entity Status (D15) ≠ Entity Reality (Phase 8) ≠ Opportunity Eligibility (D16: status is contextual, never a hard eligibility gate). This document does not alter the Entity Reality elimination behavior described in §7/§13 of the prior audit, and does not touch it here either.

---

## 16. Entity-aware Cache Specification

Current key **[FACT]**: `research_signal_cache_index` is keyed on `(user_id, normalized_domain, signal_kind)` for lookups (`pgRepository.ts` `findByKey`), with a 4-column unique pointer constraint `(user_id, normalized_domain, signal_kind, signal_id)` that deliberately allows multiple *live* signals per key (conflict is resolved at read time via `ORDER BY observed_at DESC`, not by uniqueness).

**Notable existing gap, directly relevant here [FACT]**: this table's `signal_kind` CHECK constraint was **never widened** to include `GOOGLE_PLACES_STATUS`, `PUBLIC_INTENT`, or `FIRST_PARTY` — even though `research_signals`' own `kind` CHECK *was* widened for all three across migrations 0029/0049. The effect: **`GOOGLE_PLACES_STATUS` signals — the clearest public, Entity-adjacent evidence that exists today — cannot be cached at all**, structurally, even for same-user reuse. Closing this specific, narrow gap (adding `GOOGLE_PLACES_STATUS` to the cache-index CHECK) is a low-risk improvement that affects only same-user caching and does not by itself require any part of the Entity layer. **[REC]**

**Target design** (not implemented here):
- **Lookup keys**: keep `(user_id, normalized_domain, signal_kind)` as the only supported path for every kind that has **not** cleared the §9 public-factual bar. For kinds that have (today: `GOOGLE_PLACES_STATUS`), add `entity_id` as an additional, parallel lookup dimension once an Entity layer exists — do not replace the existing key, to avoid breaking same-user reuse that works today. **[SPEC]**
- **Write keys**: public-cleared kinds write with both `user_id` (unchanged) and `entity_id` (new); ambiguous/private kinds (WEBSITE/NEWS/TECH_STACK, per §9) continue writing exactly as today, unchanged, until their classification is PO-resolved. **[SPEC]**
- **Migration/backfill**: **no retroactive `entity_id` inference onto historical rows** — any new column defaults `NULL` for every pre-existing row; only new writes populate it, and only for kinds cleared by §9. This is a direct, non-negotiable consequence of D1 ("not derived from... any external attribute") and the §17 historical-safety default. **[SPEC]**
- **Public/private partitioning**: enforced structurally by which kinds are permitted to write `entity_id` at all (the CHECK-constraint pattern already used elsewhere in this schema) — not by a mutable flag that could later be silently reinterpreted.
- **Conflict handling**: reuse the existing "multiple live rows, resolve by `observed_at DESC` at read time" pattern already in production — no new invention needed.
- **Freshness**: unchanged; reuse existing `SIGNAL_FRESHNESS`/per-kind windows exactly as-is (D15, decided — no new TTLs are introduced by this document).

---

## 17. Historical Safety

**Default, non-negotiable rule applied throughout this document: NO RETROACTIVE IDENTITY INFERENCE.**

| Data | Historical change? | Entity mapping? | Public/private change? | Risk | Safe treatment |
|---|---|---|---|---|---|
| `companies` | None required — stays per-user, unchanged | New `entity_id` FK, nullable, defaults NULL for all existing rows | No | Low, if `entity_id` stays nullable and unindexed-for-uniqueness on old rows | Add column only; never backfill a guessed `entity_id` |
| `prospects` | None | None directly (inherits via `company_id`) | No | Low | No change needed |
| `searches` | None | None (no entity concept applies here) | No | None | No change needed |
| `service_profiles` | None | None | No | None | No change needed |
| `research_signals` | None required for existing rows | None — stays ambiguous/private per §9 unless a kind is later individually re-classified public, which is itself an **[OPEN]** PO question, not performed here | **[OPEN]**, per §9 — no change made by this document | Medium if misclassified prematurely | Do not add any visibility column casually; resolve §9 classification first |
| `research_signal_sources` | None | None | Inherits `research_signals`' unresolved status | Low | No change needed |
| `research_signal_cache_index` | None for existing rows; only the `GOOGLE_PLACES_STATUS` CHECK-widening is a forward-only, additive change (§16) | New `entity_id` column, nullable, NULL for all historical rows | Only `GOOGLE_PLACES_STATUS` (already public, §9) would ever populate `entity_id` | Low | Additive only; no backfill |
| `opportunities` | None | None (Opportunity concept is independent of Entity identity) | No | None | No change needed |
| `opportunity_scores` | None | None | No | None | No change needed |
| `lead_unlock_contacts` | None | **Explicitly not to be mapped to any global Entity evidence** (§11) | **No** — remains private, undecided for promotion | High if promoted without authorization | **Do not promote; §11 stands** |
| `GOOGLE_PLACES_STATUS` evidence (within `research_signals`) | None for existing rows | Eligible to feed the D15 Entity Status model prospectively, per the governance record's own "Dependencies" section — "a future engineering/data-mapping task, not performed by this record [or this one]" | Already public (§9) | Low | Map prospectively only; do not reinterpret historical rows' meaning |
| Existing discovery history (website-less candidates silently dropped to date) | **Permanent, irreversible gap**: businesses discovered-but-dropped before C-1 is implemented were never recorded at all — there is no row to retroactively "fix." | N/A — nothing to map | N/A | None (nothing existed to misclassify) | No action possible or needed; purely forward-looking once C-1 ships |

---

## 18. Final Engineering Specification Matrix

| Topic | Specification closed? | Exact specification | PO decision needed? | Implementation prerequisite? |
|---|---|---|---|---|
| D12 normalization (mechanics) | Partially | §3 table — normalization/comparison mechanics specified per evidence type | No (mechanics only) | Yes — `normalizeDomain()` full read-through still pending (§3) |
| D13 thresholds (resolve-alone / corroboration) | **No** | §4 — matrix built, every threshold left **[OPEN]** | **Yes** | Yes |
| D23 verification sufficiency (`websiteUri` etc.) | **No** | §5 | **Yes** | Yes |
| Place ID capture | Yes | §6 — field, type, storage point, tests all specified | No | No (pure addition) |
| Website-less identity flow (12 cases) | Mostly | §7 — every case traced; Cases A/C/D/E/I still gated on §4's open thresholds; Cases J/K gated on the already-open `CF-DISCOVERY-ARCH-002-Q1` | Partially (inherits §4) | Yes |
| Website-less dedup | Recommendation only | §8 | No (architecture choice, not governance) | Yes |
| Public/private evidence classification | Partially | §9 — `GOOGLE_PLACES_STATUS`/`PUBLIC_INTENT` resolved; WEBSITE/NEWS/TECH_STACK left **[OPEN]** | **Yes**, for the ambiguous kinds | Yes |
| Global evidence architecture | Recommendation only | §10 | No | Yes |
| Lead-unlock-contact promotion | **No — explicitly blocked** | §11 | **Yes** | N/A until decided |
| DiscoveryEvent schema | Mostly | §12 — minimum fields closed; failed-normalization edge case and transaction boundary open | Partially | Yes |
| Query persistence | Yes | §13 | No | Yes |
| Zero-AI MVP | Yes (mechanics) | §14 — exact 2 blocking points identified and specified | No (C-3B already decided) | Yes |
| Entity status derivation | Mostly | §15 — `UNKNOWN`-by-default closed; precedence left open (already open in governance) | Partially (already flagged by governance) | Yes |
| Entity-aware cache | Recommendation + one concrete gap-fix identified | §16 | No | Yes |
| Historical safety | Yes | §17 | No | N/A (policy, not code) |

---

## 19. Remaining PO Decisions (consolidated)

1. Does any single Category 1–3 identity evidence type (Place ID, domain, profile URL, phone, business-email) resolve an Entity match **alone**, or does every category require corroboration? (§3, §4)
2. If corroboration is required, what is the corroboration rule (e.g., "two independent Category 1–3 anchors")? (§4)
3. When two existing Entities each hold a conflicting strong identifier, what happens to the *new* discovery that triggered the conflict — does it become a third new Entity (this document's conservative recommendation), attach provisionally to one side, or something else? (§4, §7 Case I)
4. Does a reliable-but-not-owner-verified field like Google Places' `websiteUri` satisfy D23 verification, or does verification require a stronger association than "the provider returned it in a listing"? (§5)
5. Is public LinkedIn/company-profile content beyond the bare profile URL globally reusable evidence under D9/D22? (already flagged open by the governance record itself, restated here for completeness)
6. Are the WEBSITE/NEWS/TECH_STACK `research_signals` sub-fields (`websiteIssues`, `contentOpportunities`, `aiOpportunities`, `growthOpportunities`, etc.) public factual evidence, freelancer-private interpretation, or a mix requiring field-level reclassification? (§9)
7. May `lead_unlock_contacts` data ever be promoted into global Category-3 identity evidence, under any circumstance? Current governance: **no authorization exists; do not promote.** (§11)
8. Does a `DiscoveryEvent` requiring a failed-normalization result (no resolvable Entity) belong in the same table as a normal event, or in a separate pre-Entity log? (§12)
9. Exact status-derivation precedence when conflicting Entity Status observations exist — already flagged open by the governance record's own "Open items" list. (§15)

None of the above is decided, implied, or silently resolved by this document.

---

## 20. Implementation Readiness

**READY FOR IMPLEMENTATION** (engineering is fully specified; no PO decision blocks starting):
- Google Place ID capture (§6)
- Discovery query persistence into a future DiscoveryEvent (§13)
- Zero-AI MVP boot-path change (§14) — C-3B already authorizes the requirement; only the mechanical fix (conditional `ANTHROPIC_API_KEY`, conditional eager model construction) remains
- `GOOGLE_PLACES_STATUS` cache-index CHECK widening (§16, narrow gap-fix)
- Historical-safety policy (no retroactive inference) — already a pure policy, needs no further spec (§17)

**READY AFTER PO DECISION** (engineering understood, PO choice required):
- D13 resolution thresholds and corroboration rules (§4, §19.1–§19.3)
- D23 verification sufficiency for provider-sourced fields (§5, §19.4)
- Public/private reclassification of WEBSITE/NEWS/TECH_STACK sub-fields (§9, §19.6)
- Lead-unlock-contact promotion (§11, §19.7) — currently **decided in the negative** (do not promote) pending any future authorization
- Website-less identity Cases A/C/D/E/I (§7) — inherit the §4 blockers

**READY AFTER ENGINEERING REVIEW** (no PO decision needed, but more engineering work required before closure):
- Full read-through of `normalizeDomain()`'s exact normalization behavior (§3)
- DiscoveryEvent failed-normalization representation and transaction-boundary design (§12)
- Entity-aware cache full design once an Entity table exists (§16)
- Website-less dedup schema design — partial indexes + new `entities` table (§8)

**NOT IN MVP** (explicitly deferred):
- D20 merge/split — explicitly deferred by governance, untouched here.
- Any complex corporate/legal relationship structure (D17 explicitly scopes this out).
- Any relationship-aware ranking/eligibility/discovery-expansion behavior (D19, MVP = contextual-only).

**Overall status:**

> **BLOCKED — PO DECISION REQUIRED** (on D13 thresholds, D23 verification sufficiency, and the WEBSITE/NEWS/TECH_STACK public/private classification) **AND BLOCKED — ENGINEERING SPECIFICATION REQUIRED** (on DiscoveryEvent's failed-normalization edge case and transaction boundary, and on `normalizeDomain()`'s full behavior), **on separate, independently-trackable items.** Several concrete items (§ "READY FOR IMPLEMENTATION" above) are not blocked by either and could proceed independently if and when implementation is separately authorized.

---

## 21. Recommended Next Step

Two independent, non-blocking tracks can proceed in parallel once implementation is separately authorized (this document authorizes neither):

1. **Governance track**: a short, scoped PO decision round on exactly the nine items in §19 — most are binary or narrow (e.g., "does Place ID alone resolve: yes/no/needs corroboration"), not a full re-litigation of D1–D23.
2. **Engineering track (no PO dependency)**: the five "READY FOR IMPLEMENTATION" items in §20 could be scoped as a single, self-contained implementation slice — Place ID capture, DiscoveryEvent minimum-fields persistence, the zero-AI boot-path fix, and the narrow cache CHECK-widening — each independently low-risk and additive, none requiring the still-open identity-resolution questions.

---

**NO IMPLEMENTATION AUTHORIZED BY THIS SPECIFICATION REVIEW.**
