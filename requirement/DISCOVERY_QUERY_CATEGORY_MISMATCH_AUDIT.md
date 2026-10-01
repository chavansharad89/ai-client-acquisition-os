# Discovery Query Category Mismatch Audit

**Status:** READ-ONLY AUDIT. No implementation. No code change. No live Google Places request made to produce this document. No commits.
**Date:** 2026-09-25

---

## 1. Audit Metadata

```text
HEAD:              5992b82b9adff492c480442d68a954f2a03bfb28
Branch:             phase-17-r34-worker-orchestration
Search ID:          b81ab156-edca-42e6-8b05-0c0f05bc0511
Service profile ID: 2049bf89-eefe-4f0a-97d1-66d5004076ef
Audit type:         READ-ONLY (persisted data + source code only; no new external calls)
```

Participant profile (verbatim, as persisted):

```text
Service:              Website development
Target customer:      Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators
Geography:             Mumbai
Minimum project value: ₹30,000 (3,000,000 paise)
Keywords:              [] (none supplied)
Triggers:              [] (none supplied)
```

---

## 2. Observed Live Run

```text
Search status:          FAILED (3/3 attempts exhausted)
Businesses discovered:  12
Businesses researched:  0
Opportunities created:  0
Opportunities qualified: 0
Anthropic blocker:      HTTP 400 "Your credit balance is too low to access the Anthropic API"
                        — Research never executed for any of the 12 discovered candidates
```

Discovery is therefore the **only** pipeline stage that produced output for this search. Everything downstream of Discovery (Normalize→Dedupe succeeded; Research→Evidence→Opportunity→Scoring→Qualification never ran) is out of scope for this audit by construction — there is no data there to inspect.

---

## 3. Participant Discovery Input

Confirmed identical at every layer (see §6 for the comparison). As persisted in `service_profiles` (id `2049bf89-eefe-4f0a-97d1-66d5004076ef`):

| Field | Value |
|---|---|
| `service` | `Website development` |
| `target_customer` | `Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators` |
| `geography` | `Mumbai` |
| `min_project_value_paise` | `3000000` |
| `keywords` | `[]` |
| `triggers` | `[]` |

---

## 4. Discovery Data Flow

```text
ServiceProfile (service_profiles row 2049bf89-...)
      ↓  copied verbatim, no transformation
      │  packages/core-search/src/service.ts:82-90 (createSearch) —
      │  "The parameters snapshot is copied from the resolved profile HERE,
      │   at creation time, and never read from it again (DEC-007)"
      ↓
Search.parameters (searches row b81ab156-..., immutable snapshot)
      ↓  read directly, no transformation
      │  packages/core-discovery/src/googlePlacesProvider.ts:11-15 (buildQuery)
      ↓
Query string: "Website development for Restaurants, Cafes; Boutique Retailers &
               E-commerce Brands; Hotels, Resorts & Tour Operators in Mumbai"
      ↓  packages/core-discovery/src/googlePlacesClient.ts:78-85 (performRequest)
      │  POST https://places.googleapis.com/v1/places:searchText
      │  body: { "textQuery": "<query string above>" }
      │  header: X-Goog-FieldMask: places.displayName,places.websiteUri  (ONLY)
      ↓
Google Places raw response ({ places: [{ displayName, websiteUri }, ...] })
      ↓  packages/core-discovery/src/googlePlacesClient.ts:119-136 (normalizeResponseBody)
      │  maps to { name, websiteUri } — no category/type field ever requested or read
      ↓
DiscoveryCandidate[] ({ name, website })
      ↓  packages/core-discovery/src/normalize.ts:43-52 (normalizeCandidate)
      │  ACCEPTS iff name is non-empty AND website parses to a hostname.
      │  Performs NO category, industry, or target-customer check of any kind.
      ↓
NormalizedCandidate { name, normalizedDomain }
      ↓  packages/core-discovery/src/pgRepository.ts (findOrCreateByDomain, findOrCreate)
      │  dedup key: UNIQUE(user_id, normalized_domain) / UNIQUE(search_id, company_id)
      ↓
companies / prospects rows (12 persisted, status DISCOVERED)
```

Every arrow above is a direct code citation, not an inference about behavior.

---

## 5. Exact Query Construction

**File:** [packages/core-discovery/src/googlePlacesProvider.ts:11-15](../packages/core-discovery/src/googlePlacesProvider.ts)

```ts
function buildQuery(search: Parameters<DiscoveryProvider['discover']>[0]): string {
  const { service, targetCustomer, geography, keywords } = search.parameters;
  const parts = [`${service} for ${targetCustomer} in ${geography}`, ...keywords];
  return parts.join(' ').trim();
}
```

- **Fields used:** `service`, `targetCustomer`, `geography`, `keywords`. All four are read.
- **Fields ignored by query construction:** `minProjectValuePaise`, `triggers`, `rationale` — none of these three reach Google Places at all (confirmed: `buildQuery` destructures only `service`, `targetCustomer`, `geography`, `keywords`). This is consistent with `DiscoveryCandidate`/`DiscoveryProvider` being a minimal, provider-neutral contract (documented in `requirement/DISCOVERY_PROVIDER_SELECTION_AUDIT.md` §1) — not a defect specific to this run, since project value and triggers are not the kind of fact a text-search geocoding API could act on regardless of implementation.
- **`targetCustomer` handling:** the entire compound string is inserted **verbatim, unsplit** — the three participant-supplied segments (`Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators`) are not parsed into separate terms, not deduplicated against each other, and not weighted individually. All three ride inside one clause of one free-text sentence.
- **`service` position:** `service` is the **grammatical subject** of the constructed sentence — it appears first, unqualified, immediately followed by "for". The literal string sent for this run was:

```text
Website development for Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators in Mumbai
```

This exact reconstruction is deterministic from the persisted `search.parameters` and the unmodified `buildQuery()` source — it is not a guess, and required no new external call to produce.

- **Defaults injected:** none. No hardcoded terms are added by this function.
- **Minimum project value / keywords / triggers effect on discovery:** minimum project value has **zero** effect on the discovery query (never read by `buildQuery`); keywords, if present, would be appended as additional space-joined free-text tokens (none were supplied here, so none were appended); triggers have **zero** effect on discovery (never read anywhere in `core-discovery`).

---

## 6. UI Input vs. Persisted ServiceProfile vs. Search.parameters vs. DiscoveryProvider Input

| Layer | Service | Target customer | Geography | Transformation observed |
|---|---|---|---|---|
| UI form submission | `Website development` | `Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators` | `Mumbai` | — |
| Persisted `service_profiles` row | (identical) | (identical) | (identical) | **None** |
| Persisted `searches.parameters` (JSON snapshot) | (identical) | (identical) | (identical) | **None** — `core-search/service.ts:82-90` copies fields 1:1 |
| String passed to `ExternalDiscoveryClient.searchText()` | embedded, unsplit, as `service` in `${service} for ${targetCustomer} in ${geography}` | embedded, unsplit | embedded, unsplit | **None to the values themselves** — but they are concatenated into a single natural-language sentence, which is a structural transformation of *representation* (three fields → one free-text string), even though no field's *content* is altered or dropped |

**Conclusion: no participant input was lost.** All four investigated values reached the Google Places request byte-for-byte. The transformation that did occur is representational (structured fields → one blended sentence), not a loss.

---

## 7. Google Places Adapter — Exact Request Behavior

**File:** [packages/core-discovery/src/googlePlacesClient.ts](../packages/core-discovery/src/googlePlacesClient.ts)

```text
Endpoint:        POST {baseUrl}/places:searchText
Request body:    { "textQuery": "<the single blended string from §5>" }
Field mask sent: "places.displayName,places.websiteUri"   (line 64, FIELD_MASK constant)
```

Confirmed absent from the request, by reading the entire request-construction code path (`performRequest`, lines 66-117):

- No `includedType` / `excludedType` (Google Places category filter)
- No `locationBias` / `locationRestriction` (structured geography — geography rides inside the free-text string only)
- No `strictTypeFiltering`
- No `pageSize` / `pageToken` (pagination — capped at whatever Google returns for one un-paginated call; a pre-existing, separately documented limitation per `DISCOVERY_PROVIDER_SELECTION_AUDIT.md` §2, not newly discovered here)
- No `rankPreference`

The request is **pure unstructured free text**, asking Google's Text Search (New) NLP layer to interpret the entire sentence with no structural hints about what a "match" should look like (no type constraint, no separate location field). This is not a new finding — `DISCOVERY_PROVIDER_SELECTION_AUDIT.md` §2 documented this exact shape one day before this run: *"`buildQuery()` concatenates `service + targetCustomer + geography + keywords` into one free-text string... it does not map cleanly onto providers that expect structured query + location... inputs."* This audit's live run is the first concrete data point showing what that documented risk actually produces.

---

## 8. Post-Discovery Filtering — Exact Code Path

Traced every line between the Google Places HTTP response and the persisted `companies`/`prospects` rows:

1. `normalizeResponseBody()` ([googlePlacesClient.ts:119-136](../packages/core-discovery/src/googlePlacesClient.ts)) — maps each raw place to `{ name, websiteUri }`. No category/type field is read even if Google returned one (it wasn't requested — §7).
2. `createGooglePlacesDiscoveryProvider().discover()` ([googlePlacesProvider.ts:19-28](../packages/core-discovery/src/googlePlacesProvider.ts)) — maps `{ name, websiteUri }` → `DiscoveryCandidate { name, website }`. No filtering of any kind.
3. `normalizeCandidate()` ([normalize.ts:43-52](../packages/core-discovery/src/normalize.ts)) — the **only** gate before persistence. Its entire test is:
   ```ts
   const name = candidate.name?.trim();
   if (!name) return null;
   if (!candidate.website) return null;
   const normalizedDomain = normalizeDomain(candidate.website);
   if (!normalizedDomain) return null;
   ```
   This checks presence and URL-parseability only. It does not, and structurally cannot, check category, industry, or target-customer fit — `DiscoveryCandidate` (the type it receives) carries no field that could express category (`packages/core-discovery/src/provider.ts:9-12`: `{ name?, website? }` only).
4. `runDiscoveryForOwner()` ([service.ts:107-129](../packages/core-discovery/src/service.ts)) — persists every candidate that survives step 3 via `findOrCreateByDomain` / `findOrCreate`. Dedup only (`UNIQUE(user_id, normalized_domain)`, `UNIQUE(search_id, company_id)`); no target-customer check.

**Explicit statement required by this audit's instructions: there is NO target-customer filtering anywhere in the discovery pipeline, at any stage, for any provider currently integrated.** This is confirmed by reading 100% of the code between the Google Places response and persistence — not inferred from absence of a symptom.

---

## 9. Actual 12 Results — Classification

Only `name` and `normalized_domain` are stored for any company (`packages/core-discovery/src/types.ts:7-14` — `StoredCompany` has no category/address/type field). Classification below uses **name text only**, since that is the entirety of the stored provider metadata. Per this audit's instruction, a name with no explicit sector language is marked `AMBIGUOUS`, not guessed.

| # | Business (as persisted) | Domain | Participant target segment | Match status | Evidence |
|---|---|---|---|---|---|
| 1 | Parashift Technologies \| Leading Web Development & Digital Marketing Agency in Mumbai | parashifttech.com | none | **MISMATCH** | Name states "Web Development & Digital Marketing Agency" — explicitly a service provider in the participant's own line of business, not a restaurant/retailer/hotel |
| 2 | Inventif Web LLP | inventifweb.com | none | **MISMATCH** | "Web" in registered name; domain `inventifweb.com` |
| 3 | Aimbeat - Software and Mobile App Development Company in Mumbai | aimbeat.com | none | **MISMATCH** | Name states "Software and Mobile App Development Company" |
| 4 | Waytoglobal Solutions | waytoglobal.com | — | **AMBIGUOUS** | Generic "Solutions" name; no sector stated in name or domain |
| 5 | Olio Global AdTech | olioglobaladtech.com | none | **MISMATCH** | Name states "AdTech" (advertising technology) — not a target segment, not hospitality/retail |
| 6 | Stymeta Technologies | stymeta.com | — | **AMBIGUOUS** | Generic "Technologies" name; no specific sector stated |
| 7 | Vipul Pore and Company | vipulpore.com | — | **AMBIGUOUS** | Proper/personal name only; no sector indicator at all |
| 8 | Innovins | innovins.com | — | **AMBIGUOUS** | Single coined brand word; no sector indicator |
| 9 | Syspree Web Designing & Digital Marketing Company in Thane | syspree.com | none | **MISMATCH** | Name states "Web Designing & Digital Marketing Company" |
| 10 | UdyogMART, E Commerce Website Design & Development Company Mumbai | web.udyogmart.com | none | **MISMATCH** | Name states "E Commerce Website Design & Development Company" — itself a website-development vendor, not an e-commerce *brand* (the participant's actual target segment #2) |
| 11 | Save As Web - Software Development Company in Mumbai \| Website Development \| eCommerce Website | saveasweb.com | none | **MISMATCH** | Name states "Software Development Company... Website Development" |
| 12 | Devki Infotech India Private Limited - Website Design Company in Mumbai, India | devkiinfotech.com | none | **MISMATCH** | Name states "Website Design Company" |

**Tally: 0 MATCH · 8 MISMATCH · 4 AMBIGUOUS (0 target-segment matches either way).**

Correction to this task's own framing: the live-validation report that preceded this audit described this as "12/12 category mismatch." Under the stricter, name-text-only evidentiary standard this audit's instructions require, 8 of 12 are confirmed mismatches by explicit self-description in the business name, and 4 are ambiguous by name alone (no stored data supports classifying them either way). **The finding that is fully supported by evidence, without qualification, is: 0 of 12 discovered businesses are identifiable as belonging to any of the participant's three target segments (Restaurants/Cafes, Boutique Retailers/E-commerce Brands, Hotels/Resorts/Tour Operators).** Whether the 4 ambiguous names are quietly more of the same (co-discovered alongside 8 explicit website/software vendors, via a query whose lead clause is "Website development... in Mumbai") or something else cannot be established from stored data without further research — which did not run.

One incidental observation, not part of the mismatch question: company #7 (Vipul Pore and Company) was `created_at` 2026-09-22 — three days before this search — meaning `findOrCreateByDomain` correctly reused a company row from an earlier search for this same user rather than duplicating it; only its `prospects` row is new to this search. This confirms deduplication (R-08) is functioning as documented and is unrelated to the mismatch question.

---

## 10. Mismatch Analysis — Where It Originates

Evaluating each candidate cause independently, per this audit's instructions:

**A. Participant input was lost.** **REFUTED.** §6 traces all three fields byte-for-byte from the UI submission through to the exact string sent to Google Places. `targetCustomer`'s full text is present in the request. Nothing was dropped.

**B. Query construction is semantically inverted** (querying for providers of the service rather than its buyers). **SUPPORTED, with the caveat that this is inferred from the query's construction plus the observed result set, not proven against Google's internal ranking logic** (which this audit cannot inspect without running another live query — explicitly disallowed). The evidence: the constructed sentence's grammatical subject and lead clause is `"Website development for..."` — the exact same phrase pattern a website-development vendor would use to describe itself ("Website Development ... Company in Mumbai," verbatim, appears in 5 of the 12 returned business names). `DISCOVERY_PROVIDER_SELECTION_AUDIT.md` §2 flagged this exact risk one day before this run, independently of this incident.

**C. Target-customer information is not incorporated sufficiently.** **PARTIALLY SUPPORTED.** The text is present (refuting "not used" in the literal sense — see §6), but it is a single 97-character compound clause containing three segments joined by commas, a semicolon, and an ampersand, positioned as a subordinate clause ("for X") after the dominant, short, simple lead phrase "Website development." Whether Google's NLP weighted the short/simple lead phrase over the long/compound trailing clause cannot be confirmed without a controlled comparison call (see cause D) — this audit can confirm the *structural imbalance* in the query, not Google's internal handling of it.

**D. Google Places provider behavior** (correct query, poor results). **UNDETERMINED.** No comparison experiment (e.g., the same participant profile with a restructured, type-filtered query) was run — doing so would require a new external Google Places call, which this read-only audit's rules disallow. `DISCOVERY_PROVIDER_SELECTION_AUDIT.md` §11 independently classified this exact question ("wrong category / wrong geography returned") as `UNKNOWN` prior to this run.

**E. Post-discovery filtering is insufficient.** **CONFIRMED BY CODE, independent of causes B–D.** §8 establishes there is no category/target-customer check anywhere after the Google Places response is received — not a weak filter, no filter at all. Even if Google Places' ranking were flawless for some other query shape, today's code has no mechanism to catch a mismatched candidate that Google itself feeds in. This is true regardless of which of B/C/D is the dominant cause of *this specific* result set.

**F. Some combination of the above.** **This is the accurate characterization.** A: refuted. B: supported (inferred, not proven). C: partially supported (structural imbalance confirmed; effect on Google's ranking unconfirmed). D: undetermined. E: confirmed by code, and stands as a real gap independent of the others.

---

## 11. Evidence Index

| Conclusion | File / Function | What it establishes |
|---|---|---|
| No transformation, ServiceProfile → Search.parameters | `packages/core-search/src/service.ts:78-95` (`createSearch`) | Rules out cause A |
| Exact query string construction | `packages/core-discovery/src/googlePlacesProvider.ts:11-15` (`buildQuery`) | Basis for causes B and C |
| Exact HTTP request shape (no type/location-structured fields) | `packages/core-discovery/src/googlePlacesClient.ts:64-117` (`FIELD_MASK`, `performRequest`) | Basis for cause D being untestable without a new call; confirms no category data even requested |
| No category field ever read from Google's response | `packages/core-discovery/src/googlePlacesClient.ts:119-136` (`normalizeResponseBody`) | Supports cause E |
| Sole persistence gate is presence/parseability, not relevance | `packages/core-discovery/src/normalize.ts:43-52` (`normalizeCandidate`) | Confirms cause E |
| `DiscoveryCandidate` contract has no category field | `packages/core-discovery/src/provider.ts:9-12` | Confirms cause E is structural, not an oversight in one function |
| `StoredCompany` has no category field | `packages/core-discovery/src/types.ts:7-14` | Confirms §9's classification could only use name text |
| Persisted search parameters, verbatim | Direct DB read, `searches.parameters` for `b81ab156-...` | Basis for §3, §5, §6 |
| Persisted service profile, verbatim | Direct DB read, `service_profiles` row `2049bf89-...` | Basis for §3, §6 |
| 12 discovered companies, names/domains | Direct DB read, `companies` joined via `prospects.search_id = 'b81ab156-...'` | Basis for §9 |
| Pre-existing, independent documentation of the query-shape risk | `requirement/DISCOVERY_PROVIDER_SELECTION_AUDIT.md` §2, §11, §16 | Corroborates cause B/C was a known, documented risk before this run produced concrete evidence of it |
| R-06 requirement text | `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` line 625-632 | Basis for §12's documentation-ambiguity finding |
| MVP Discovery scope (§5.2) | `requirement/MVP_SCOPE_BOUNDARY.md` lines 179-184 | Basis for §12's documentation-ambiguity finding |

---

## 12. Root Cause Classification

```text
QUERY CONSTRUCTION           — SUPPORTED (confirmed: single blended free-text sentence,
                                service-led, target-customer compounded into one clause)
SEMANTIC INVERSION           — SUPPORTED, INFERRED (query shape + 100%-non-match result
                                are consistent with this; not provable without a controlled
                                comparison call, which this audit did not run)
POST-DISCOVERY FILTERING     — CONFIRMED (zero category/relevance filtering exists anywhere
                                in the pipeline, for any provider, as a structural fact of
                                the current DiscoveryCandidate/normalizeCandidate contract)
DOCUMENTATION AMBIGUITY      — SUPPORTED (see §13 — no governance document assigns
                                category-correctness responsibility to a specific stage)
```

Explicitly NOT selected, with reason:

```text
INPUT LOSS                   — REFUTED (§6, §10.A): all participant input reached the query
TARGET CUSTOMER NOT USED     — NOT SELECTED as literally true: the text IS present in the
                                query (§6); its effective weight in Google's own ranking is
                                UNDETERMINED, not zero — selecting this category would overstate
                                what the evidence shows
PROVIDER BEHAVIOR            — UNDETERMINED, not selected as a confirmed cause: no comparison
                                experiment was run (disallowed under this audit's read-only rule)
NO ROOT CAUSE ESTABLISHED    — not selected: multiple causes above ARE evidenced
```

---

## 13. Documented Requirement vs. Implementation — Case Determination

Per this audit's required framing (§15 of the task):

**R-06 (Business Discovery), as literally worded** — *"Obtain candidate businesses from an external source behind a provider abstraction, so the source can change without changing the engine"* (PRD V2.2, line 627-628) — is satisfied. Discovery did obtain candidates, behind the documented `DiscoveryProvider` abstraction. Judged against this narrow, literal requirement text alone:

```text
DISCOVERY BEHAVIOR CONSISTENT WITH DOCUMENTED SCOPE  (for R-06's literal wording)
```

However, `MVP_SCOPE_BOUNDARY.md` §2's core MVP promise is broader: *"find approximately 20 businesses that appear to have a genuine need for that service."* Neither R-06/R-07/R-08 (PRD V2.2) nor MVP_SCOPE_BOUNDARY.md §5.2 states **which pipeline stage is responsible for ensuring a discovered candidate is even a plausible member of the participant's stated target-customer category** — as opposed to a business that plausibly belongs to the category but merely lacks strong evidence of need (a different, already-documented problem — see `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` and the Goregaon incident in `DISCOVERY_PROVIDER_SELECTION_AUDIT.md` §4, both about a *correctly-categorized* business with *wrong source attribution*, not a business of the *wrong category entirely*).

This run's evidence — 0 of 12 discovered businesses identifiable as any target segment — is a **different failure shape** than the one existing MVP documents already address. No document states whether this shape of failure is Discovery's responsibility (via better query construction and/or category filtering) or is assumed to be caught downstream, at Research/Need-Detection/Qualification, by simply failing to find evidence of "need" for an obviously wrong-category business.

```text
PRODUCT/SCOPE DECISION REQUIRED
```

**The precise ambiguity:** does "obtain candidate businesses" (R-06) implicitly include an obligation that candidates be plausible members of the stated target-customer category, or is category-plausibility intentionally deferred to Research/Qualification (R-09 onward) as part of "genuine need" detection? No governance document decides this.

---

## 14. MVP Scope Impact

Answering the four questions from the task, using only what the evidence establishes:

1. **Is this behavior already covered by the existing MVP acceptance criteria?** `MVP_SCOPE_BOUNDARY.md` §10's exit criteria list "Businesses are discovered" and "Duplicates are removed" as the Discovery-stage bar — both are true for this run (12 discovered, dedup functioning per §9's footnote). The exit criteria do not include a category-correctness or target-customer-match criterion for Discovery specifically. **UNDETERMINED whether this counts as "covered"** — the letter of §10 is met; whether §10's intent (in light of §2's "genuine need" promise) is met is exactly §13's undecided ambiguity.
2. **Does the MVP explicitly require target-customer-aware discovery?** **No** — confirmed by reading R-06/R-07/R-08 and MVP_SCOPE_BOUNDARY.md §5.2 in full; none mention target-customer matching as a Discovery-stage responsibility.
3. **Does the MVP explicitly require discovery results to belong to the target-customer category?** **No** — same basis as above.
4. **Is the observed mismatch a known, already-accepted MVP limitation?** **No** — the two existing, closely-related documents (`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md`, `DISCOVERY_PROVIDER_SELECTION_AUDIT.md`) both address a *different* failure shape (correctly-categorized business, wrong source attribution). Neither document discusses or accepts a wrong-category-entirely discovery result as a known limitation. `DISCOVERY_PROVIDER_SELECTION_AUDIT.md` §11 lists "wrong category / wrong geography returned" as `UNKNOWN — not observed... in this pass" — i.e., it was an open question, not an accepted limitation, as of one day before this run.

```text
MVP IMPACT: UNDETERMINED
```

Justification: the MVP's 19-criterion engineering exit (`requirement/MVP_SCOPE_BOUNDARY.md` §10) does not contain a criterion this finding fails — no criterion says "discovered businesses match the target-customer category." The MVP exit therefore is not mechanically reopened by this finding under its own stated criteria. But the same document's §2 core promise and §9 Criterion 9 ("the system does not fabricate business needs") are worded at a level where a systematic, wrong-category discovery result is at minimum in tension with the *intent* of the release, even though no single checklist line is violated. This tension is exactly what §13 asks a product decision to resolve — this audit does not resolve it.

---

## 15. Recommended Decision Surface

Presented for a product/scope decision — **not implemented, not recommended as the "correct" answer** by this audit:

**Decision needed:** Is category-plausibility of a discovered candidate (i) Discovery's responsibility, (ii) Research/Qualification's responsibility (via need-detection naturally failing on a wrong-category business), or (iii) not a requirement for this MVP at all (accepted noise, filtered by the human reviewer at USER REVIEWS PROSPECT)?

If a future decision assigns this to Discovery, the smallest possible scope — for a later, separately-authorized task, not this one — would be bounded to:

- Restructuring `buildQuery()`'s sentence shape (e.g., leading with `targetCustomer`/`geography` rather than `service`), and/or
- Requesting Google's `type`/`includedType` fields and adding one explicit relevance check inside (or immediately after) `normalizeCandidate()`.

Both are described here only to size the decision surface, per the task's instruction; neither is being proposed as a recommendation, and nothing has been implemented.

---

## 16. Safety / Repository Verification

```text
Production files modified:      0
Tests modified:                 0
PRD modified:                   0
Configuration modified:         0
Database modified:              0
Commits created:                0
Pushes performed:                0
New file created (only one):    requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md
```
