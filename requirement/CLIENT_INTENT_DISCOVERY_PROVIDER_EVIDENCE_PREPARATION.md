# CLIENT INTENT DISCOVERY

## OQ-1, OQ-2, OQ-8 — Provider Evidence-Gathering Preparation

**Preparation ID:** CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-PREP-001
**Date:** 2026-09-30
**Type:** evidence-requirements preparation only. Not a decision record, not an evidence-gathering authorization,
not an implementation authorization.
**Prepares:** OQ-1, OQ-2 and OQ-8 of CLIENT-INTENT-DISCOVERY-REQ-001 §10, left PENDING by
CLIENT-INTENT-DISCOVERY-OQ-PO-DEC-001.
**Author role:** governance analyst.

```text
OQ-1: PENDING — external/provider evidence required
OQ-2: PENDING — external/provider evidence required
OQ-8: PENDING — external/provider evidence required
Provider selected: NONE
Provider ranking: NONE
Provider recommendation: NONE
```

> **This record defines what provider evidence a future Product Owner session needs. It answers none of OQ-1, OQ-2
> or OQ-8, selects, ranks or recommends no provider, and establishes no provider fact.**

---

## §1 Governance

### 1.1 Records

| Role | Path | ID | sha256 |
|---|---|---|---|
| Source requirement | `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | CLIENT-INTENT-DISCOVERY-REQ-001 | `606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68` |
| OQ preparation | `requirement/CLIENT_INTENT_DISCOVERY_OQ_DECISION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-PREP-001 | `4b60c6e3ad1052f321036dc1325ecc9b8d5f0b3df2cb159b94ce560fbdd83314` |
| OQ decision log | `requirement/CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` | CLIENT-INTENT-DISCOVERY-OQ-DEC-001 | `ccf11dc7dad6de6ed617070974963042eac977da45a8e9c3bf630d36f0270bb2` |
| Session preparation | `requirement/CLIENT_INTENT_DISCOVERY_OQ_PRODUCT_OWNER_SESSION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-SESSION-PREP-001 | `4506a050d215805e483fbaf07c2f56a57a43655f80b47808472cbe94a62ebe44` |
| OQ decision record | `requirement/CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |

### 1.2 Baseline (verified before writing)

| Item | Value |
|---|---|
| Branch | `phase-17-r34-worker-orchestration` |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Staged files | 0 |
| Working-tree entries | 246 (before this record) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` (= OQ-PO-DEC-001 §1.2) |

### 1.3 Governing-record hashes (all recomputed; all equal to OQ-PO-DEC-001 §1.3)

| Record | ID | sha256 |
|---|---|---|
| `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | INTENT-INTAKE-PO-DEC-001 | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION_PREPARATION.md` | DEC-003 preparation | `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md` | INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` | INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_RUNTIME_COMPONENT_DECISION.md` | INTENT-INTAKE-OD13-INGRESS-DEC-001 | `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_POST_SAVE_RESEARCH_DECISION.md` | INTENT-INTAKE-OD13-POSTSAVE-DEC-001 | `6ffd207561c2db580137ddb030df43f072359b2390ad75276ec918fe9b04b16d` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_EXACT_RESULT_BINDING_DECISION.md` | INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 | `c67d09a841187dad0854623d50958543f1d8aaa89454c48addf2c298e2832637` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_LEGACY_AUTHENTICITY_CHECK_DECISION.md` | INTENT-INTAKE-OD13-LEGACY-P3-DEC-001 | `55dd133e5b32a6932e4d68e7bc3e3779c9cffc11e100112d54ee7482aa0e1c95` |
| `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-ADAPTER-IMPL-REC-001 | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | INTENT-INTAKE-GOOGLE-ADS-REQ-001 (PROPOSED) | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |
| `MVP_SCOPE_BOUNDARY.md` | — | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |
| `PHASE_22_OUTREACH_PREPARATION_SCOPE_LOCK.md` | — | `6b59aa69bb8cd5a9b29a135402d30b682cf2960357f68bc2b05122f88e546294` |
| `PHASE_23_FOLLOWUP_PREPARATION_SCOPE_LOCK.md` | — | `176eff2b5532067a3dda9dbf9491470a3c30fec5352cb1507f6c6a74c5bec714` |

### 1.4 Evidence sources consulted

**None external.** The authority state of this task sets External HTTP authorization to NONE, so no provider
documentation, terms, API reference or other web page was fetched, and no general background knowledge is recorded
as a provider fact. Every provider-side cell in §3 is therefore unestablished. The only facts marked ESTABLISHED are
facts established by repository records, and they concern **our** product's constraints, not provider capability.

Gathering the external evidence defined here requires a **separate authorization** (§8), limited to reading publicly
accessible, official provider documentation, with source URL and access date recorded for every fact.

### 1.5 Authority state

```text
Implementation authorization: NONE
Provider-call authorization: NONE
Production provider access: NONE
External HTTP authorization: NONE
Database authority: NONE
Schema/migration authority: NONE
Runtime-wiring authorization: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
Scraping/browser automation authority: NONE
Credential-sharing authority: NONE
```

---

## §2 Unresolved Questions

Wording copied exactly from REQ-001 §10.

### OQ-1

```text
Which providers will be authorized first?
```

**Why PENDING (OQ-PO-DEC-001 §2 OQ-1):** choosing which provider to authorize first depends on which providers can
legitimately supply business-level intent evidence (OQ-2) and under what access and retention terms (OQ-8); the
repository establishes neither, and REQ-001 R-2.1 forbids assuming a capability.

### OQ-2

```text
What provider / API capabilities are actually available?
```

**Why PENDING (OQ-PO-DEC-001 §2 OQ-2):** a question of external fact, not product policy; the repository records no
provider's capabilities for intent discovery.

### OQ-8

```text
What provider-specific access and retention constraints apply?
```

**Why PENDING (OQ-PO-DEC-001 §2 OQ-8):** provider-specific constraints are set by each provider's terms and access
conditions; none is recorded in the repository.

---

## §3 Provider Evidence Matrix

### 3.1 Candidates

Candidates are those named by REQ-001 §2 or by the governing records. Listing is not selection; order is REQ-001 §2
order and carries no priority.

| # | Candidate | Basis for listing | Repository status |
|---|---|---|---|
| P1 | Google — search | REQ-001 §2 (search providers; "Google") | No intent-source integration. `PUBLIC_WEB_SEARCH` family exists as a provider-free contract ("Google Search / public web", `intentSource.ts`). |
| P2 | Google — Google Ads | GA-REQ (PROPOSED) | No integration; GA-Q0..GA-Q15 PENDING. |
| P3 | ChatGPT / OpenAI | REQ-001 §2 (AI / assistant providers; "ChatGPT") | No intent-source integration. (An OpenAI model adapter exists for the Research step only — `packages/core-research/src/openAIModel.ts` — not an intent source.) |
| P4 | Other AI / assistant providers | REQ-001 §2 ("other authorized AI / assistant providers"); Gemini and Claude are named in the repository only in DEC-003 §6 (privacy boundary) and DEC-003 prep §4 (out of scope) | No intent-source integration. |
| P5 | LinkedIn | REQ-001 §2 (professional / social platforms; "LinkedIn") | No intent-source integration; no source family covers professional / social platforms (OQ-PO-DEC-001 OQ-12). |
| P6 | Other authorized providers | REQ-001 §2 (other search, professional / social, and extensible providers) | None identified. |

Google Places (`packages/core-discovery/src/googlePlacesProvider.ts`) is configured as a business-discovery provider,
not an intent source; it is not named by REQ-001 §2 and is not listed as a candidate.

### 3.2 Status vocabulary

| Status | Meaning |
|---|---|
| `ESTABLISHED` | Established by a repository record (cited). Used only for our own product constraints. |
| `NOT ESTABLISHED` | No repository or external evidence establishes the fact. |
| `EVIDENCE REQUIRED` | Not established, and required before OQ-2 / OQ-8 can be decided for this candidate. Implies `NOT ESTABLISHED`. |
| `CONDITIONAL` | Required only if a precondition fact is established (stated in the row). Currently `NOT ESTABLISHED`. |

No status implies a Product Owner decision, a provider capability, availability to us, or authorization to use.

### 3.3 Three-way distinction (kept separate for every candidate)

| Concept | Status for P1–P6 |
|---|---|
| A. Provider capability exists | `NOT ESTABLISHED` for every candidate |
| B. Provider access is available / authorized to us | `NOT ESTABLISHED` for every candidate (no account, approval, contract or credential recorded) |
| C. Our product is authorized to implement / use it | **NONE** for every candidate (REQ-001 R-5.3, R-9.1, R-9.2; OQ-PO-DEC-001 §4) |

Establishing A does not establish B; establishing A and B does not establish C.

### 3.4 Matrix (evidence category × candidate)

Categories 1–20 are the required checklist. "Sub-question" states the exact fact to obtain.

| # | Category | Sub-question (exact fact to obtain) | P1 Google search | P2 Google Ads | P3 ChatGPT / OpenAI | P4 Other AI | P5 LinkedIn | P6 Other |
|---|---|---|---|---|---|---|---|---|
| 1 | Client-intent exposure | Does the provider officially expose content in which an organization states a current need for a service? | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-REQ §2 A.4 "[NOT ESTABLISHED]") | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 2 | Product / API name | Exact official product / API / endpoint name and version | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q1) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 3 | Access mechanism | Official, documented access route (API, feed, push, export); eligibility and approval process | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q5) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 4 | Delivery model | Provider-supplied / publicly published / user-authorized / other documented model; maps to PUBLISHED vs SUPPLIED_TO_US | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q4, GA-Q5) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 5 | Verbatim need statement | Is the organization's statement returned word-for-word (required by OQ-PO-DEC-001 OQ-3 item 1)? | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q3) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 6 | Organization identity | Is business / organization identity returned by the source (not inferred)? | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q3, GA-Q9) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 7 | Website / domain | Is a business website / domain returned (required by OQ-PO-DEC-001 OQ-7)? Is the reference URL free of click / tracking IDs? | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q10) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 8 | Timestamp | Is the time the need was expressed and / or observed returned? Format and time zone | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q11) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 9 | Authentication | Official authentication method (API key, OAuth scope, service account, partner approval) | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q8) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 10 | Limits / quotas | Documented rate limits, quotas, pagination, access tiers | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q13) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 11 | Pricing / cost | Officially documented price per request / tier, if any | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q13) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 12 | Authenticity / signing | Can the provider push payloads signed with Ed25519 per Option B? | CONDITIONAL — only if category 4 shows a SUPPLIED_TO_US push model | CONDITIONAL (GA-Q7) | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL |
| 13 | Retention | Permitted storage duration of retrieved content (quotes, URLs, identity, timestamps) | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q15) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 14 | Deletion | Mandatory deletion / refresh obligations and triggers | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 15 | Attribution | Required attribution / display / branding when data is shown | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 16 | Personal-data restrictions | Provider rules on personal data in returned content and its use for prospecting | EVIDENCE REQUIRED | EVIDENCE REQUIRED (GA-Q15) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 17 | Individual AI conversations | Provider rules on collecting / exposing individual AI conversations or prompts | NOT ESTABLISHED (relevance depends on category 1) | NOT ESTABLISHED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | NOT ESTABLISHED | NOT ESTABLISHED |
| 18 | Scraping / automation / credentials / access controls | Provider terms on scraping, browser automation, credential sharing, bypassing access controls | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 19 | Other restrictions | Use-case restrictions (e.g. lead generation, prospecting, commercial reuse, combining with other data, geography) | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |
| 20 | Source and date | Official source URL, document title / version and access date for every fact in rows 1–19 | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED | EVIDENCE REQUIRED |

### 3.5 Our-side constraints that apply regardless of provider evidence (ESTABLISHED by repository records)

These do not describe any provider; they constrain how any provider evidence could be used.

| Constraint | Source | Status |
|---|---|---|
| Only authorized sources and access mechanisms; no scraping, browser automation, credential sharing or access-control circumvention prescribed or implied | REQ-001 R-5.1, R-5.2 | ESTABLISHED |
| No individual-level AI conversation access; no ChatGPT / Gemini / Claude prompt capture; no search history, cookies, device / account / click IDs; no personal email / phone harvesting; no inference about named individuals | DEC-003 §6 | ESTABLISHED |
| Provider-assigned kind / confidence / classification rejected; confidence fixed by kind | PO-DEC-001 D5; OQ-PO-DEC-001 OQ-4 | ESTABLISHED |
| Sufficient evidence = verbatim, business-attributable, traceable, privacy-compliant | OQ-PO-DEC-001 OQ-3 | ESTABLISHED |
| Organizations (or persons acting as a business) only | OQ-PO-DEC-001 OQ-11 | ESTABLISHED |
| FIRST_PARTY path requires push with Option B authenticity, OD-1..OD-13, X1, C-1 | DESIGN-001 §14; AUTHENTICITY-DEC-001; X1; C-1 | ESTABLISHED |
| Non-persistence of `basis` / `reference`, signatures, raw signed payloads, verification outcomes | OD-10; OD13-M Q9 | ESTABLISHED |

---

## §4 OQ-2 Evidence Requirements

OQ-2 is not answered here. Before OQ-2 can be decided for a candidate, the following facts must be established from
official sources (hierarchy: official provider documentation → official API / reference documentation → official
terms / privacy / developer policy → official product documentation → other authoritative primary sources;
third-party commentary is not proof):

1. Whether the candidate exposes organization-expressed service-need content at all (§3.4 row 1).
2. The exact product / API / endpoint (row 2).
3. The documented access mechanism and eligibility / approval process (row 3).
4. The delivery model and whether results are PUBLISHED or SUPPLIED_TO_US (row 4).
5. Whether the need statement is returned verbatim (row 5).
6. Whether organization identity is returned by the source (row 6).
7. Whether a business website / domain is returned, and whether reference URLs carry tracking parameters (row 7).
8. Timestamp availability and semantics (row 8).
9. Authentication method (row 9).
10. Limits, quotas, pagination (row 10).
11. Official pricing (row 11).
12. If row 4 shows a SUPPLIED_TO_US push model: whether Ed25519-signed push per Option B is supported (row 12).
13. For every fact: source URL, document title / version, access date (row 20).

For each candidate, rows A and B of §3.3 must be recorded separately; OQ-2 concerns A, with B recorded alongside.

## §5 OQ-8 Evidence Requirements

OQ-8 is not answered here. Before OQ-8 can be decided for a candidate, the following facts must be established from
official terms / privacy / developer-policy documentation:

1. Permitted retention period for retrieved content, including verbatim quotes, source URLs, identity and timestamps
   (§3.4 row 13).
2. Deletion / refresh obligations (row 14).
3. Attribution / display requirements (row 15).
4. Personal-data restrictions, and their fit with DEC-003 §6 (row 16).
5. Restrictions on individual AI conversations or prompts, where relevant (row 17).
6. Terms on scraping, browser automation, credential sharing and bypassing access controls (row 18).
7. Use-case restrictions affecting business prospecting, lead generation, commercial reuse or combining data with
   other sources (row 19).
8. Access conditions: account type, approval, contractual prerequisites (rows 3, 9).
9. For every fact: source URL, document title / version, access date (row 20).

Each fact must be compared against §3.5 by the future session; where provider terms are stricter than our
constraints, or ours stricter than theirs, both must be recorded — this record does not decide which applies.

## §6 OQ-1 Dependency

OQ-PO-DEC-001 §2 OQ-1 records that OQ-1 depends on OQ-2 (capability) and OQ-8 (access and retention constraints) and
lists the evidence required: an official access route returning business-level service-need statements; permission
under the provider's terms; access prerequisites; and the OQ-2 / OQ-8 answers per provider.

OQ-1 therefore cannot be decided until §4 and §5 evidence is complete for the candidates the Product Owner wishes to
consider. OQ-1 also overlaps GA-Q0 (Google Ads). **No first provider is selected, ranked or recommended here.**

## §7 Evidence Gaps

Every provider-side fact is currently `NOT ESTABLISHED`:

- Rows 1–20 of §3.4 for all six candidates (P1–P6): no official source has been consulted (§1.4), and the repository
  records none.
- §3.3 concept A (capability) and concept B (access available to us) for all candidates.
- Row 12 (Ed25519 signing) for all candidates, pending row 4.
- Whether any candidate belongs to an existing source family (`PUBLIC_WEB_SEARCH`, `AI_PLATFORM_ACQUISITION`,
  `PUBLIC_INTENT_NOTICE`) — depends on row 4 and on per-provider mapping (OQ-PO-DEC-001 OQ-12). No family exists for
  professional / social platforms (P5).
- GA-Q0 to GA-Q15 (Google Ads) remain PENDING in GA-REQ.
- Whether "Other AI" (P4) and "Other" (P6) include any specific provider: not identified by any record.

Repository-side gaps carried forward (not resolved here): SESSION-PREP-001 §5 C-1, C-2, C-3, C-4, C-6, C-8.

## §8 Future Decision Gate

1. **Evidence-gathering authorization (separate, required first).** Obtaining the §4 / §5 evidence requires its own
   authorization record, limited to reading publicly accessible official documentation without authentication,
   recording source and access date, and excluding API calls, credentials, account creation, provider contact,
   scraping and browser automation for data collection. This record does not grant it.
2. **Evidence package.** The gathered evidence must be recorded per candidate against §3.4 rows 1–20 and §3.3 A / B,
   using `ESTABLISHED` only with a cited official source and date, otherwise `NOT ESTABLISHED`.
3. **Product Owner decision session (separate, required after the package is complete).** That session may decide
   OQ-1, OQ-2 and OQ-8. **This record decides none of them.**
4. A future decision on OQ-1, OQ-2 or OQ-8 still grants no implementation, provider-call, credential, configuration,
   runtime-wiring, database, validation, outreach or deployment authority (REQ-001 R-9.1).

## §9 Execution counters (this record)

```text
Files created: 1 (this record)
Files modified: 0
Production code changes: 0
Test changes: 0
Package / dependency changes: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Web searches / documentation fetches: 0
Credentials used: 0
Provider contact: 0
Scraping / browser automation: 0
Runtime wiring: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```

```text
OQ-1/OQ-2/OQ-8: PENDING — PROVIDER EVIDENCE REQUIRED
ALL EXECUTION AUTHORITIES: NONE
```
