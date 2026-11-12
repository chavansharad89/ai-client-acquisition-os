# CLIENT INTENT DISCOVERY

## OQ-1 — Provider Finalization Decision Record

**Record ID:** CLIENT-INTENT-DISCOVERY-PROVIDER-FINALIZATION-DEC-001
**Date:** 2026-10-01
**Type:** Product Owner decision record (governance only). Not an implementation authorization.
**Resolves (to the extent the evidence permits):** CLIENT-INTENT-DISCOVERY-REQ-001 §10 OQ-1 — "Which providers will
be authorized first?"
**Author role:** governance recorder (prepares and records; does not make the Product Owner's selection).

```text
Record status: PREPARED — PRODUCT OWNER SELECTION INPUT NOT PRESENT
OQ-1: PENDING — EVIDENCE INSUFFICIENT (unchanged in substance)
Providers authorized by this record: NONE
Providers marked NOT AUTHORIZED by this record: NONE
Providers PENDING — EVIDENCE INSUFFICIENT: all eight named candidates
Other authorized providers: NOT AUTHORIZED BY THIS DECISION
Provider ranked / scored / recommended: NONE
```

> **No Product Owner answer to OQ-1 exists in any governing record, and the underlying OQ-2 and OQ-8 remain formally
> PENDING. Under the task's mandatory rule (§10 of the instruction: "Do not make the provider-selection decision
> yourself"), this record presents the evidence and records every named provider as `PENDING — EVIDENCE
> INSUFFICIENT`. It selects, authorizes, rejects, ranks and recommends no provider.**

---

## §0 Record identity

| Item | Value |
|---|---|
| Decision ID | CLIENT-INTENT-DISCOVERY-PROVIDER-FINALIZATION-DEC-001 |
| Status | PREPARED — PRODUCT OWNER SELECTION INPUT NOT PRESENT; no selection recorded |
| Date | 2026-10-01 |
| Baseline branch | `feature/client-intent-discovery-complete` |
| Baseline HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Working tree before this record | clean (0 entries) |

**Records used (sha256, computed at baseline):**

| Record | ID | Role | sha256 |
|---|---|---|---|
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (Amendment 1; canonical) | CLIENT-INTENT-DISCOVERY-REQ-001 | Canonical requirement | `e107b3e2ba42793f9a57937ef1946c0ef130e88840fe97039afd463de419860e` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-001 | **OQ-2 / OQ-8 evidence** | `2387838ff125c35a8f6bf19e88eab4e8f91ef43a5665aecd2c0d18ad7be31647` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-PREP-001 | OQ-2 / OQ-8 evidence requirements | `1f7e0af55c526aa491d443be297221860e116f4290a2aead52b29a7d70fb973f` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-PO-DEC-001 | OQ statuses (OQ-1/2/8 PENDING) | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` | CLIENT-INTENT-DISCOVERY-OQ-DEC-001 | OQ log (OQ-1/2/8 PENDING) | `ccf11dc7dad6de6ed617070974963042eac977da45a8e9c3bf630d36f0270bb2` |
| `CLIENT_INTENT_DISCOVERY_OQ_PRODUCT_OWNER_SESSION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-SESSION-PREP-001 | Session evidence pack | `4506a050d215805e483fbaf07c2f56a57a43655f80b47808472cbe94a62ebe44` |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT_HASH_RECONCILIATION.md` | CLIENT-INTENT-DISCOVERY-REQ-HASH-RECON-001 | Canonical-hash reconciliation | `a5973f4f644369b910547436ccadd4c31e66ee3787025173ece6c269a12b5765` |

## §1 Decision scope

This record addresses **only** the provider-selection question for Client Intent Discovery (OQ-1). It does not
answer OQ-2, OQ-3 to OQ-12, GA-Q0 to GA-Q15, or any other question, and does not modify any record listed in §0.

**Provider selection policy ≠ permission to execute.** Even a future `AUTHORIZED FOR CLIENT INTENT DISCOVERY —
SUBJECT TO EXISTING EXECUTION GATES` entry would be a product-policy selection only (REQ-001 R-9.1 item 1). Every
other R-9.1 item — provider / API access, credentials or keys, configuration, implementation, provider calls,
runtime wiring, evidence handling, validation, deployment — would remain separately unauthorized (§5).

## §2 Evidence basis

The sole provider-fact evidence in the repository is PROVIDER-EVIDENCE-001 (public official documentation consulted
2026-10-01, sources S1–S15; X1–X3 not retrievable). It covers **four** columns only: Google Search (G), Google Ads
(GA), OpenAI / ChatGPT (O), LinkedIn (L).

| Provider | Supporting records | Coverage in existing evidence |
|---|---|---|
| Google Search | PROVIDER-EVIDENCE-001 §3 col. G, §3.1, §4, §9–§12 (S1–S4); PREP-001 §3.1 P1 | Covered (Custom Search JSON API only) |
| Google Search Console | — | **No record names or evidences it.** Not in REQ-001 §2 / §2A, PREP-001 §3.1 or PROVIDER-EVIDENCE-001 |
| Google Ads | PROVIDER-EVIDENCE-001 §3 col. GA, §5 (S3, S5–S8); PREP-001 §3.1 P2; REQ-001 R-2C.1; GA-REQ (GA-Q0..GA-Q15) | Covered as evidence only; governed solely by GA-REQ |
| OpenAI / ChatGPT | PROVIDER-EVIDENCE-001 §3 col. O, §6 (S9, S10; X1–X3 not retrievable); PREP-001 §3.1 P3 | Covered partially |
| LinkedIn | PROVIDER-EVIDENCE-001 §3 col. L, §7 (S11–S15); PREP-001 §3.1 P5 | Covered |
| Reddit | REQ-001 §2A D (named example only) | **Not evidenced.** PROVIDER-EVIDENCE-001 §13: Communities not covered |
| Anthropic / Claude | REQ-001 §2A B (named example only); PREP-001 §3.1 P4 (privacy-boundary mention only); PROVIDER-EVIDENCE-001 §8 ("None included") | **Not evidenced** |
| Microsoft / Bing | — | **No record names or evidences it.** (Microsoft Learn appears only as LinkedIn's documentation host, S13–S15) |

OQ-PO-DEC-001 §2 OQ-1 and PROVIDER-EVIDENCE-001 §11 both record that OQ-1 depends on OQ-2 and OQ-8, and that the
evidence "is not sufficient on its own" to support an OQ-1 decision without the Product Owner first deciding OQ-2 and
OQ-8. OQ-2 and OQ-8 remain PENDING in OQ-PO-DEC-001 §2, the OQ decision log §3, and PROVIDER-EVIDENCE-001; **this
record does not rewrite those records or statuses.**

## §3 Provider decision matrix

NE = `NOT ESTABLISHED BY EXISTING EVIDENCE`. Evidence wording is summarized from PROVIDER-EVIDENCE-001 §3 rows 1–20;
row numbers cited as `#n`. No provider is ranked; order is the instruction's order.

| Provider | OQ-2 capability evidence | OQ-8 access/retention evidence | Evidence status | Product Owner decision |
|---|---|---|---|---|
| **Google Search** | Intent content: NE (#1). API exists: Custom Search JSON API (#2). Verbatim need: PARTIALLY — `snippet` only (#5). Organization identity: NE (#6). Website: PARTIALLY — result-page host (#7). Timestamp: none per result (#8). | Access: API key; **closed to new customers**, existing until 2027-01-01 (#3). Retention: no permanent copies / databases, no caching beyond cache header (S3 §5.e). Deletion: on termination (S3 §8.b). Attribution: required (S3 §6.b). Privacy: User Data Policy (S3 §3.d). Terms: no scraping / automated access contrary to robots.txt (S3, S4); no circumvention (S3 §2.d). | Capability NE; access PARTIALLY (closed to new customers); OQ-2 / OQ-8 PENDING | `PENDING — EVIDENCE INSUFFICIENT` |
| **Google Search Console** | NE | NE | No evidence in any existing record | `PENDING — EVIDENCE INSUFFICIENT` |
| **Google Ads** | PARTIALLY — lead-form submissions to **the advertiser's own** ads only (#1, S7, S8); intent about other businesses NE. API: Google Ads API; Lead Form Webhook (#2). Timestamp: `lead_submit_time` (#8). | Access: developer token + OAuth; webhook POST to advertiser URL (#3, #9); our eligibility NE. Retention: S3 general; no period in S6 (#13). Deletion: PARTIALLY (#14). Attribution: S3 §6.b (#15). Privacy: consent-consistent use (S6 §7(A)); payload includes `FULL_NAME`, `EMAIL`, `PHONE_NUMBER`, `gcl_id` (#16) — kinds the existing privacy screen rejects (PROVIDER-EVIDENCE-001 §5 analyst observation). Signing: `google_key` only; Ed25519 NE (#12). | Partial; **governed solely by GA-REQ (R-2C.1); GA-Q0 PENDING** — see §6 conflict note | `PENDING — EVIDENCE INSUFFICIENT` |
| **OpenAI / ChatGPT** | Intent content: NE (#1); no documented access to ChatGPT conversations (#17). API exists for model use only (#2). Delivery, verbatim, identity, website, timestamp: NE (#4–#8). | Access: API key, model API only (#3, #9). Retention: provider-side abuse logs ≤ 30 days; ZDR by approval (S9); our retention NE (#13). Deletion: NE. Attribution: NE. Personal-data restrictions: NE. Scraping / credential terms: NE (X1 not retrievable). Ads documentation (X2, X3): not retrievable. | Capability NE; terms largely NE | `PENDING — EVIDENCE INSUFFICIENT` |
| **LinkedIn** | PARTIALLY — Lead Sync returns responses to **the owner's own** lead forms (#1, S13). Verbatim / organization: PARTIALLY, form-dependent (#5, #6). Timestamp: PARTIALLY (#8). | Access: separate program requiring application; owner roles (#3); our eligibility NE. Retention: no storing Content unless permitted (S12 §4.1); profile ≤ 24 h, social activity ≤ 48 h (S14); lead-response retention NE. Deletion: on request / termination (S12 §4.4–4.5). Attribution: brand use only in app (S12 §6.1). Privacy / policy: member data **must not be used to identify sales prospects or create leads** (S14); scraping / bots prohibited (S11 §8.2). | Partial; restrictive use-case terms established; OQ-2 / OQ-8 PENDING | `PENDING — EVIDENCE INSUFFICIENT` |
| **Reddit** | NE | NE | Named example only (REQ-001 §2A D); no evidence | `PENDING — EVIDENCE INSUFFICIENT` |
| **Anthropic / Claude** | NE | NE | Named example only (REQ-001 §2A B); privacy-boundary mention only (DEC-003 §6); no evidence | `PENDING — EVIDENCE INSUFFICIENT` |
| **Microsoft / Bing** | NE | NE | No evidence in any existing record | `PENDING — EVIDENCE INSUFFICIENT` |

### 3.1 Per-provider evidence breakdown

| Provider | Capability established | Capability not established | Access req. established | Access req. not established | Retention established | Retention not established | Attribution | Deletion | Privacy | Policy / terms | Sufficient for PO authorization? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Google Search | Web-result API; `snippet`, `link`; no per-result timestamp | Intent content; organization identity; engine scope; Vertex AI Search | API key; closed to new customers | Route for new customers | S3 §5.e | Provider-specific period | S3 §6.b | S3 §8.b | S3 §3.d | S3, S4 | No (OQ-2/OQ-8 PENDING; capability NE) |
| Google Search Console | NE | All | NE | All | NE | All | NE | NE | NE | NE | No |
| Google Ads | Own-ad lead submissions; API; webhook | Non-advertiser intent; quotas; pricing | Dev token + OAuth; webhook | Our eligibility | S3 general | Lead-data period | S3 §6.b | PARTIALLY (S6 §15) | S6 §7(A); payload PII fields | S6 §1.4, S3 | No (GA-Q0 PENDING; R-2C.1) |
| OpenAI / ChatGPT | Model API; rate limits | Any intent product; conversation access | API key (model API) | Intent-data access | Provider-side logs ≤ 30 days | Our retention | NE | NE | NE | NE (X1 not retrievable) | No |
| LinkedIn | Own lead-form responses; pull + push; HMAC-SHA256 webhook | Non-owner intent; quotas; pricing | Application; owner roles; OAuth | Our eligibility | S12 §4.1; S14 limits | Lead-response retention | S12 §6.1 | S12 §4.4–4.5 | S14; S12 §3.1(7) | S11, S12, S14 | No |
| Reddit | NE | All | NE | All | NE | All | NE | NE | NE | NE | No |
| Anthropic / Claude | NE | All | NE | All | NE | All | NE | NE | NE | NE | No |
| Microsoft / Bing | NE | All | NE | All | NE | All | NE | NE | NE | NE | No |

"Sufficient for PO authorization? — No" states only that the existing records do not supply the inputs that
OQ-PO-DEC-001 §2 OQ-1 lists as required (documented access route returning business-level service-need statements;
permitted use; access prerequisites; OQ-2 and OQ-8 answers). It is not a Product Owner rejection.

## §4 Final provider policy

| Category | Providers |
|---|---|
| Authorized at the product-policy level | **NONE** |
| Not authorized (Product Owner decision) | **NONE recorded** — no Product Owner rejection exists |
| Pending evidence | Google Search; Google Search Console; Google Ads; OpenAI / ChatGPT; LinkedIn; Reddit; Anthropic / Claude; Microsoft / Bing |
| Unnamed / other providers | `Other authorized providers: NOT AUTHORIZED BY THIS DECISION` |

Future providers, and any of the eight above, may be evaluated through a subsequent Product Owner decision using the
same evidence requirements (PREP-001 §4–§5; REQ-001 R-2B.1). No open-ended authorization for unnamed providers is
created.

**Missing decision input (reported, not supplied):**

1. An explicit Product Owner answer to OQ-1 — none is recorded in OQ-PO-DEC-001, the OQ decision log or any other record.
2. Product Owner decisions on OQ-2 and OQ-8 — both formally PENDING; PROVIDER-EVIDENCE-001 §11 requires them first.
3. For Google Ads: a GA-Q0 decision under GA-REQ (this record cannot supply it; R-2C.1).
4. Any evidence at all for Google Search Console, Reddit, Anthropic / Claude, Microsoft / Bing.

## §5 Execution boundary

Provider selection (now or in any future amendment of this record) does **not** authorize:

```text
Provider calls: NONE
Credentials/API keys/OAuth: NONE
Production provider access: NONE
Integrations: NONE
Runtime wiring: NONE
Scraping/browser automation: NONE
Database access: NONE
Schema/migrations: NONE
Implementation: NONE
Validation: NONE
Outreach/contact: NONE
Deployment: NONE
```

## §6 Existing decisions preserved

No earlier decision is reopened or changed: OD-1..OD-13; OD-13 Option B; Alternative I (IG-1..IG-7); PS-1..PS-8;
D1–D5 (PO-DEC-001); DEC-003 (including §6 privacy boundary); X1 (exact-result binding); C-1 (legacy authenticity
check); INTENT-INTAKE-GOOGLE-ADS-REQ-001 and GA-Q0..GA-Q15; existing privacy boundaries (REQ-001 R-3.3, R-3A.3;
CONTRACT-REC §3–§4); outreach approval rules (PHASE_22 / PHASE_23 scope locks; OQ-10 PENDING); source / provenance
rules (R-6.1–R-6.2; OD-10; OD13-M Q9). OQ-2 and OQ-8 records and statuses are unchanged.

**Conflict reported, not resolved — Google Ads.** The instruction lists Google Ads for decision here, while REQ-001
R-2C.1 states Google Ads "is not part of the §2A taxonomy" and "remains governed solely by
INTENT-INTAKE-GOOGLE-ADS-REQ-001", whose GA-Q0 ("Should Google Ads be used as an intent source at all?") is PENDING.
Any `AUTHORIZED` or `NOT AUTHORIZED` entry for Google Ads in this record would pre-empt GA-Q0. Google Ads is therefore
left `PENDING — EVIDENCE INSUFFICIENT` here, and its disposition belongs to GA-REQ.

**Scope observation (not resolved).** Google Search Console and Microsoft / Bing are not named in REQ-001 §2 / §2A or
in any OQ / evidence record; their inclusion here records the instruction's list only and confers no candidate status
beyond REQ-001 §2A "other authorized" categories.

## §7 Unresolved evidence

None of the following is filled from model knowledge:

1. **Google Search:** any official product supplying organization-expressed need statements; Custom Search engine
   scope; Vertex AI Search capabilities and terms; an access route for new customers.
2. **Google Search Console:** every R-2B.1 item (1–13) — NOT ESTABLISHED BY EXISTING EVIDENCE.
3. **Google Ads:** quotas; pricing; lead-data retention / deletion periods; any non-advertiser intent source;
   signature mechanism beyond `google_key`; our eligibility.
4. **OpenAI / ChatGPT:** Terms of Use (X1); ChatGPT ads documentation (X2, X3); what, if anything, advertisers
   receive; any intent-data product; retention, deletion, attribution, personal-data and scraping terms.
5. **LinkedIn:** whether lead-form responses fall under S14 storage limits; Marketing API Terms and Data Storage
   Requirements (not consulted); quotas; pricing; Lead Sync eligibility.
6. **Reddit:** every R-2B.1 item (1–13) — NOT ESTABLISHED BY EXISTING EVIDENCE.
7. **Anthropic / Claude:** every R-2B.1 item (1–13) — NOT ESTABLISHED BY EXISTING EVIDENCE.
8. **Microsoft / Bing:** every R-2B.1 item (1–13) — NOT ESTABLISHED BY EXISTING EVIDENCE.
9. **All providers:** Ed25519 signing (OD13-M Option B) — NE; upstream evidence that a business authorized use for
   acquisition (DEC-003 Option A; OD-1..OD-5) — NE.
10. Repository conflicts carried forward unresolved: SESSION-PREP-001 §5 C-1, C-2, C-3, C-4, C-6, C-8 (as listed in
    PROVIDER-EVIDENCE-001 §12 item 7).

## §8 Audit / baseline

```text
Files created: 1 (this record)
Files modified: 0
Provider calls: 0
External HTTP: 0
Web browsing / search: 0
Credentials used: 0
Database activity: 0
Runtime changes: 0
Production / test / schema / config changes: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```

```text
PRODUCT OWNER PROVIDER FINALIZATION:
RECORDED / GOVERNED SELECTION ONLY

Provider calls: NONE
Credentials: NONE
Integrations: NONE
Runtime wiring: NONE
Scraping/browser automation: NONE
Database authority: NONE
Implementation authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
```
