# INTENT INTAKE MVP

## Google Ads Provider Integration — Requirement (Preparation Only)

**Requirement ID:** INTENT-INTAKE-GOOGLE-ADS-REQ-001
**Date:** 2026-09-30
**Type:** requirement / governance preparation record. Not a decision record, not an implementation plan, not an
authorization.
**Author role:** requirements / governance assistant to the Product Owner.

```text
Requirement status: PROPOSED — PENDING PRODUCT OWNER DECISION (see §14 open questions)
Product Owner decision on Google Ads: NONE (Google Ads use has never been decided; see §1.2)
Implementation authority: NONE
Runtime-wiring authority: NONE
Provider-call authority: NONE
Database authority: NONE
Validation authority: NONE
Deployment authority: NONE
Integration-naming / key-registration authority: NONE
OD-13 runtime gate: IN FORCE (unchanged)
```

> **This record states what the system must eventually support if, and only if, the Product Owner separately decides
> to use Google Ads as an intent source. It does not decide that Google Ads will be used. It authorizes no
> implementation, integration naming, key registration, credentials, configuration, provider calls, external HTTP,
> runtime wiring, database access, validation or deployment.**

Labels used throughout:

- **REQUIREMENT** — what the system must eventually support, conditional on a future Product Owner decision to adopt
  Google Ads. No authority.
- **DECISION** — a Product Owner decision already recorded elsewhere, cited by record ID. Not reopened.
- **OPEN QUESTION** — needs a Product Owner or technical decision. Nothing in this record answers it.
- **[NOT ESTABLISHED]** — Google Ads behavior that no record in this repository verifies. It must not be relied on.

---

## §1 Audit of existing requirements

### 1.1 Baseline (verified before writing)

| Item | Value |
|---|---|
| Branch | `phase-17-r34-worker-orchestration` |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Staged files | 0 |
| Working-tree entries | 239 (before this record) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` (= INTENT-INTAKE-OD13-POSTSAVE-PREP-001 §1) |

**Governing records (sha256):**

| Record | ID | sha256 |
|---|---|---|
| `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | INTENT-INTAKE-PO-DEC-001 (D1–D5) | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION_PREPARATION.md` | DEC-003 preparation | `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md` | INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 (OD-1..OD-13) — master design | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` | INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 (OD13-M = Option B) | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_PROVIDER_AUTHENTICITY_IMPLEMENTATION_RECORD.md` | IA-OD13-B | `ac3c9d5f36d58a5eb7ee237832c2882577bd424a62ba1de6f7d4067d307ed035` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_RUNTIME_COMPONENT_DECISION.md` | INTENT-INTAKE-OD13-INGRESS-DEC-001 (Alternative I) | `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_RUNTIME_COMPONENT_IMPLEMENTATION_RECORD.md` | IA-OD13-INGRESS-I-IMPL-REC-001 | `8a89e582533180fdd93d18799658ed2fa150cf3717e561cbb0c434f278c7f6c0` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_POST_SAVE_RESEARCH_DECISION_PREPARATION.md` | INTENT-INTAKE-OD13-POSTSAVE-PREP-001 (PENDING at baseline; since decided by POSTSAVE-DEC-001) | `7f857d0e9a1dcd94bae768b8b958ea15a15757e75ea6562aeb57483e89c650d4` |
| `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-ADAPTER-IMPL-REC-001 | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |

### 1.2 Existing Google Ads references found (complete list)

A repository-wide search of `requirement/` for Google Ads / Ads / advertising / AdWords found **no Google Ads
requirement, decision or design**. The only references are:

| Where | What it says | Effect |
|---|---|---|
| DEC-003 preparation §4 "Out of scope" | "whether advertising platforms should be used; whether Google Search or Google Ads should be connected" | **Explicitly left undecided.** No later record decides it. |
| INTENT-SOURCE-ADAPTER-IMPL-REC-001 §3 | `AI_PLATFORM_ACQUISITION` family = "AI-platform ads, referrals, sponsored placement"; types `AI_PLATFORM_AD`, `AI_REFERRAL`, `SPONSORED_PLACEMENT` | Defines *AI-platform* ads. Whether Google Ads falls in this family is **not established** (§14 GA-Q2). |
| INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 §3 | Privacy screen rejects advertising IDs and click IDs (`gclid`, `gbraid`, `wbraid`, `dclid`, …) | Existing constraint that any Google Ads result must satisfy. |
| Execution counters in DEC-003, DEC-003 prep, DEC-005-SCHEMA prep, DEC-005-SCHEMA design (+prep), provider-contract record, adapter record | "Google Ads calls: 0" / "Google API calls (Search / Places / Ads): 0" | Confirms no Google Ads call has ever been made or authorized. |

Other Google references (Google Places, Google Search, Google Gemini) belong to discovery, the public-web-search
family and the multi-model research provider. None governs Google Ads.

### 1.3 Existing framework this requirement must fit (DECISION, cited, not reopened)

| Topic | Governing record |
|---|---|
| Intent Intake scope, D1–D5 | INTENT-INTAKE-PO-DEC-001 |
| Source families, adapters, normalization, kind derived from disclosure (`PUBLISHED` → PUBLIC_INTENT; `SUPPLIED_TO_US` → FIRST_PARTY, AI-platform family only) | INTENT-SOURCE-ADAPTER-IMPL-REC-001 |
| Provider-neutral provider-result contract, outcome vocabulary, privacy boundary, operational contract | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 |
| FIRST_PARTY authorization basis (DEC-003 ans. 1–8) | INTENT-INTAKE-PO-DEC-003 |
| Five-field authorization evidence and OD-1..OD-13 | INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 §14 |
| Provider authenticity: Option B (inbound Ed25519, verify-before-parse, P2 + P3), Q1–Q12 | INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 |
| Ingress architecture: Alternative I, IG-1..IG-7 (owner/search binding IG-5) | INTENT-INTAKE-OD13-INGRESS-DEC-001 |
| Post-save research behavior on the ingress path | INTENT-INTAKE-OD13-POSTSAVE-DEC-001 (PS-1..PS-8; sha256 `6ffd2075…`, appeared in `requirement/` during drafting of this record; not reviewed here and not reopened) |

### 1.4 Why a new record

No existing record covers Google Ads, and the existing convention is one record per topic. Extending the master
design (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001) would place an undecided, provider-specific requirement inside a
decided record. A new record is therefore created; **no existing record is modified.**

---

## §2 Purpose — REQUIREMENT

**A.1** If adopted, a Google Ads integration must serve only as an **intent source** feeding the existing Intent
Intake path: it supplies business-level intent evidence about a business that becomes (or already is) a Prospect for
the owning user's Search.

**A.2** Business/user workflow supported: the existing client-acquisition workflow — intent source → Intent Intake →
Company / Prospect / signals → existing Research → Qualification → Opportunity / offer. No new downstream workflow
is introduced.

**A.3** Expected output to Intent Intake: provider results in the **existing provider-result contract**, each
normalizing to one of the existing outcomes (`NORMALIZED`, `NO_INTENT_EVIDENCE`, `UNATTRIBUTED`,
`DUPLICATE_IN_BATCH`, `REJECTED`). Only `NORMALIZED` results reach intake.

**A.4** What Google Ads data would evidence (e.g. a business's own advertising activity, a lead supplied to us, or
something else) is **[NOT ESTABLISHED]** — see GA-Q1, GA-Q3, GA-Q4. This record does not assume any of them.

## §3 Provider boundary — REQUIREMENT

| Party | Responsibilities |
|---|---|
| **Google Ads (provider)** | Supplying source data about a business, under Google's own terms. Anything beyond that — signing, push delivery, business-authorization evidence — is **[NOT ESTABLISHED]**. |
| **Provider integration (ours, future)** | Obtaining the data by the delivery model the PO decides (GA-Q5); mapping it into the existing provider-result contract; supplying no value it did not receive from the source. |
| **Application (existing)** | Privacy screen, normalization, kind derivation, OD-1..OD-12 validation, OD-13 Option B authenticity (where applicable), save path, research. Unchanged. |

**B.1** Google Ads does **not** assign kind, confidence or classification. Source-assigned values are rejected
(`not-allowed`) under the existing normalization rule.

**B.2** Google Ads does **not** supply, and the integration must not fabricate, any FIRST_PARTY authorization
evidence unless GA-Q6 establishes that such evidence genuinely originates upstream.

**B.3** Google Ads does **not** select the owner `userId` or `searchId` (IG-5).

**B.4** Everything after the provider-result contract remains governed by the existing Intent Intake contract,
OD-1..OD-13, Option B and Alternative I, without Google-specific exceptions.

## §4 Conceptual data flow — REQUIREMENT (not authorized)

```text
Google Ads
  → provider integration (delivery model: GA-Q5)
  → provider-result normalization (existing contract; privacy screen first)
  → provider authenticity / trust boundary (OD-13 Option B where SUPPLIED_TO_US is present; GA-Q7)
  → Intent Intake (recordIntentIntakeForOwner, P3)
  → existing validation (OD-1..OD-12, X1)
  → existing save path (OD-8 single transaction)
  → downstream research (as governed by INTENT-INTAKE-OD13-POSTSAVE-DEC-001)
```

**C.1** This flow is conceptual. It authorizes no step. Where the flow crosses the OD-13 gate, the gate stays in force
until every prerequisite in §15 is met.

## §5 Inputs — REQUIREMENT

**D.1** The integration may eventually need: a Google-side account/customer identifier, Google API credentials of
the type Google requires (GA-Q8), the query or subscription parameters for the chosen resource (GA-Q3), and the
owning user/search binding (IG-5, server-side only).

**D.2** No real credential, account identifier, developer token, OAuth client, key or configuration is recorded or
created by this document. Input values are set only under a future, separate authorization.

**D.3** No input may be taken from a request-supplied value for owner or search selection (IG-5 item 1).

## §6 Output contract — REQUIREMENT

The integration's output must map into the existing provider-result contract. It must not add a new contract shape
without a separate decision.

| Category | Requirement |
|---|---|
| **Provider-native fields** | Google Ads resource fields as returned by Google. Which resource and which fields: **OPEN** (GA-Q3). Provider-native fields are not persisted (existing non-persisted provenance rule; OD-13 Q9). |
| **Normalized fields** | Existing contract fields only: `externalId`, business identity, verbatim evidence / statement, `sourceReference`, `sourceLabel`, `observedAt`, `capturedAt`, `provenance` (`integration`, `retrieval`), and `authorization` only where FIRST_PARTY applies. |
| **FIRST_PARTY / PUBLIC_INTENT** | Kind is **derived centrally from disclosure**, never supplied. `SUPPLIED_TO_US` (→ FIRST_PARTY) is allowed only in `AI_PLATFORM_ACQUISITION` (DECISION: adapter record; OD-7 item 2). Whether any Google Ads data can be `SUPPLIED_TO_US` depends on GA-Q2 and GA-Q6; until decided, a Google Ads result may be treated at most as `PUBLISHED` / PUBLIC_INTENT, and only if GA-Q1–Q4 establish that it carries verbatim business-level intent. |
| **Authorization evidence** | Only for FIRST_PARTY: the five fields of OD-1..OD-5 (`integrationId`, `businessId`, `status` = `GRANTED`, `scope` = `ACQUISITION`, `authorizedAt`) plus `basis`, all supplied **verbatim by the upstream integration** (DEC-003 ans. 1; OD-6). No value derived, defaulted or inferred. Whether Google can supply them: **[NOT ESTABLISHED]** (GA-Q6). |
| **Company / business identity** | `business.{name, website}` for Company/Prospect resolution (unchanged). For FIRST_PARTY, `authorization.businessId` must be the integration's own opaque identifier of the authorizing business (OD-4); a Google customer ID is **not** assumed to qualify (GA-Q9). No identity inferred from a URL (`UNATTRIBUTED`). |
| **Source URL / label** | `sourceReference` must be an absolute URL with no click or tracking identifier (existing rule; `gclid`/`gbraid`/`wbraid`/`dclid` prohibited). `sourceLabel` follows the existing label rule. Which Google URL, if any, is a legitimate public reference: **OPEN** (GA-Q10). |
| **Observed timestamp** | `observedAt` = when the business statement was made/observed, supplied by the source; must not be after `capturedAt`; `capturedAt` not in the future (existing rules). Google's freshness semantics: **OPEN** (GA-Q11). |
| **Provider / integration identity** | `provenance.integration` (opaque label) and, for FIRST_PARTY, `authorization.integrationId`, which must be equal (OD-5) and equal the Option B verified identity (Q8, X1). No integration identifier is named here. |

**E.1** A verbatim-evidence rule applies: a result is an acquisition signal only if it carries a business-level
intent statement that appears verbatim in its own text (provider-contract record §2). An ad impression, click or
spend metric alone is not intent evidence and must yield `NO_INTENT_EVIDENCE` unless a future decision says
otherwise.

## §7 Authenticity — DECISION referenced, no new mechanism

**F.1** DECISION (INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001): any result containing `SUPPLIED_TO_US` must pass Option B
— inbound Ed25519 signature over the exact received bytes, verified before parsing, 5-minute freshness, public keys
only, enforced at P2 and P3. **This record creates no other authenticity mechanism.**

**F.2** DECISION (OD-13 Q1): FIRST_PARTY results arrive **only by integration push**; no pull and no operator import
for FIRST_PARTY. DECISION (OD-13 §13.4 assumption 1): if an integration cannot sign its pushed payloads with
Ed25519, **the gate stays in force for that integration and the question returns to the Product Owner.** Whether
Google Ads can push signed Ed25519 envelopes is **[NOT ESTABLISHED]** (GA-Q5, GA-Q7).

**F.3** DECISION (OD-13 Q12): `PUBLISHED`-only results are outside the Option B mandate but still need their own
runtime-wiring and provider-call authorizations.

**F.4** REQUIREMENT: a Google Ads integration **cannot become active** until, separately: it is named and authorized;
its public key and IG-5 binding are registered (OD-13 §13.6 item 2); runtime wiring is authorized (item 3); and any
provider-call, validation and deployment authorizations are granted (item 4).

## §8 Owner / search binding — DECISION referenced

**G.1** DECISION (IG-5): owner `userId` and `searchId` are resolved server-side, only after P1 succeeds, from the
registration of the **verified** integration identity; never from payload, headers, query string,
`authorization.businessId`, `business.*`, `provenance.integration` or asserted `integrationId`. One integration →
one owner/search binding; multi-owner integrations return to the Product Owner.

**G.2** DECISION (IG-6): enablement = presence of the registration in validated server configuration; disabling =
removing it.

**G.3** No owner, search, integration identifier or key is named or created here. Whether one Google Ads account maps
to one owner/search (IG-5 item 6) is **OPEN** (GA-Q9).

**G.4** IG-5/IG-6 are defined for the Alternative I **push** ingress. If Google Ads is a pull source (GA-Q5), the
owner/search binding for a pull integration has no governing decision and is **OPEN** (GA-Q12).

## §9 Rate limits / API usage — REQUIREMENT

**H.1** Before any implementation authorization, the following must be resolved from Google's documentation and a
PO decision, not assumed: API quotas and daily limits, request rate limits, pagination model, result-set size,
retry guidance, access-level/approval requirements, and cost (GA-Q13).

**H.2** DECISION (provider-contract record §5): max **1** provider call per acquisition event; **no automatic retry**;
manual retry operator-initiated only; finite per-call timeout set at authorization time. A Google Ads pull model that
needs pagination or several calls per event would conflict with the 1-call budget and requires a separate decision
(GA-Q13). No limit value is chosen here.

**H.3** No provider call is made or authorized by this record.

## §10 Failure modes — REQUIREMENT (existing decided behavior cited where it exists)

| Failure | Required behavior |
|---|---|
| Authentication failure — **inbound** (push, Option B) | DECIDED (Q8, IG-4): `REJECTED` per result before parsing, nothing persisted, no halt, no retry; HTTP `401` generic body. |
| Authentication failure — **outbound** (our credential to Google, pull) | DECIDED (operational contract): `FAILED`, run halted. Applicability to Google depends on GA-Q5. |
| Malformed provider result | DECIDED: `REJECTED`; one bad result never aborts the batch. |
| Provider timeout | DECIDED: finite timeout required; `FAILED`, no retry. Value: OPEN (GA-Q13). |
| Quota / rate-limit failure | DECIDED: `FAILED`, run halted; later calls refused; no automatic retry. |
| Invalid business identity | No identity → `UNATTRIBUTED` (never inferred). FIRST_PARTY with invalid/prohibited `businessId` → `REJECTED` (OD-4, OD-6). |
| Missing evidence | FIRST_PARTY: whole result `REJECTED`, no downgrade to PUBLIC_INTENT (OD-6). No verbatim intent statement → `NO_INTENT_EVIDENCE`. |
| Unsupported result | Type not in family, disallowed disclosure, or source-assigned kind/confidence/classification → `REJECTED` (existing normalization). Unsupported Google resource types: OPEN (GA-Q3). |
| Duplicate result | In-batch → `DUPLICATE_IN_BATCH` / `SKIPPED_DUPLICATE`. Cross-batch duplicates are an accepted known limitation (OD-12 item 3); no dedup store (Q5). Google-specific duplicate semantics: OPEN (GA-Q14). |
| Stale result | Envelope `signedAt` outside ±5 min → `REJECTED` (Q5). `authorizedAt` > 90 days before receipt → `REJECTED` (OD-2). `capturedAt` in future / `observedAt` after `capturedAt` → `REJECTED`. Business-level staleness of Google data: OPEN (GA-Q11). |
| Privacy violation (e.g. `gclid`, advertising ID, personal data) | DECIDED: `REJECTED`, never stripped (provider-contract record §3). |

## §11 Security / privacy — REQUIREMENT

**J.1 Credentials:** any Google credential must be held server-side only, never in the client, repository, logs,
payloads or database rows; provisioned only under a separate authorization.

**J.2 Secret storage:** in validated server configuration following the existing `packages/config` pattern, or a
mechanism the PO separately decides. OD-13 Q3 governs **public verification keys** only; storage of any outbound
Google credential (a private secret) has **no governing decision** and is OPEN (GA-Q8).

**J.3 Least privilege:** read-only access to the minimum Google resources needed; no write, mutate or campaign-
management scope.

**J.4 Data minimization:** only the fields needed to populate the existing contract are read; no personal data. The
existing privacy boundary (DEC-003 §6, DEC-004 §7, provider-contract §3) applies in full: no individual users, no
click/advertising/device IDs, no search terms, no personal lead data. Whether any Google Ads resource can be read
without receiving personal data is OPEN (GA-Q15).

**J.5 Logging:** redacted `@acos/observability` Logger only, with `externalId`, `field`, `reason` (OD-11); never raw
payloads, credentials, tokens or evidence values.

**J.6 Raw payload retention:** none. Signatures, raw payloads, key IDs and verification outcomes are not persisted
(Q9); provider-native provenance is not persisted; `basis`/`reference` not persisted (OD-10).

**J.7 Tenant/user isolation:** one integration registration → one owner/search (IG-5); P3 ownership check
`searches.getById(userId, searchId)` unchanged; no cross-user data.

## §12 Observability — REQUIREMENT

**K.1** Must eventually be observable: each `REJECTED` outcome (identifier, field, reason only), each operational
`FAILED` kind (timeout, rate limit, authentication, unavailable), call-budget use, and accepted-save count — through
the existing redacted Logger.

**K.2** Must not be introduced without a separate decision: a persisted rejection audit table or log-aggregator
integration (OD-11), persistence of verification artefacts (Q9), or new evidence columns (DEC-005).

**K.3** Accepted FIRST_PARTY evidence is auditable through the existing five DEC-005 columns only.

## §13 Testing requirements — REQUIREMENT (not run)

| Layer | Must eventually cover |
|---|---|
| Provider contract | Google result → existing contract shape; required/forbidden fields; no source-assigned kind/confidence. |
| Normalization | Verbatim-evidence rule; `NO_INTENT_EVIDENCE` for metrics-only data; privacy screen rejects click/advertising IDs; URL rules. |
| Authenticity | Option B with generated test key pairs and signed fixtures only (OD-13 §13.5 item 10); gate refusal when unregistered. |
| Failure | Every row of §10, including halt vs. no-halt distinctions and no retry. |
| Integration / database | Save boundary on the local test database only, under its own DB authorization. |
| End-to-end ingress | Alternative I route with fixtures: 200/400/401/500 per IG-4; IG-5 binding. |

No live Google call, real credential or real account is used in any test layer.

## §14 Open questions (not answered by this record)

| # | Question |
|---|---|
| GA-Q0 | Should Google Ads be used as an intent source at all? (Left out of scope in DEC-003 prep §4; never decided.) |
| GA-Q1 | Which Google Ads API/service/product is intended? |
| GA-Q2 | Which source family does Google Ads belong to — `AI_PLATFORM_ACQUISITION`, an existing public family, or a new family (which would need its own decision)? Is Google Ads an "AI platform" under DEC-003? |
| GA-Q3 | What exact Google resource represents the business / opportunity, and which fields are read? What is an eligible Google result? |
| GA-Q4 | Whose Google Ads account is read — our own, a client's, or a prospect's — and what customer/ownership model applies? |
| GA-Q5 | Push or pull? (FIRST_PARTY is push-only under OD-13 Q1; pull would limit Google Ads to PUBLISHED at most.) |
| GA-Q6 | What evidence can Google legitimately provide? Can it supply the five OD-1..OD-5 values verbatim, as upstream evidence that the business authorized use for acquisition? |
| GA-Q7 | Can Google sign pushed payloads with Ed25519 per Option B? If not, the gate stays in force and the question returns to the PO (OD-13 §13.4 assumption 1). |
| GA-Q8 | What authentication does Google require, and how/where are outbound credentials stored? |
| GA-Q9 | Can a Google customer/account ID serve as `authorization.businessId` (OD-4) or does it identify an account holder rather than the authorizing business? One account → one owner/search? |
| GA-Q10 | Which URL is a legitimate `sourceReference` without click/tracking identifiers? |
| GA-Q11 | How is freshness of Google data established (`observedAt`), and what makes a result stale? |
| GA-Q12 | If pull, how are owner/search bound (IG-5 covers push ingress only)? |
| GA-Q13 | Which quotas, rate limits, pagination, retries, timeouts, access levels and costs apply; how does pagination fit the 1-call-per-event budget? |
| GA-Q14 | How are Google-side duplicates identified (`externalId` source) given no persistence dedup (OD-12)? |
| GA-Q15 | What data may be read and retained under Google's terms and our privacy boundary; can any resource be read without personal data? |

## §15 Activation gate

This requirement does **not** authorize: integration naming; key registration; credentials; configuration; provider
calls; external HTTP; runtime wiring; database access; validation; deployment; commits. It changes no DECISION cited
in §1.3 (DEC-001, DEC-003, DEC-004, DEC-005, OD-1..OD-13, OD13-M/Q1–Q12, IG-1..IG-7, X1, C-1).

**Before any Google Ads activation, each separately:** PO decision on GA-Q0–GA-Q2 and GA-Q5–GA-Q7; implementation
authorization; integration naming + key/binding registration (OD-13 §13.6 item 2); runtime-wiring authorization;
provider-call authorization; database, validation and deployment authorizations as needed.

## §16 Final state

```text
Requirement: INTENT-INTAKE-GOOGLE-ADS-REQ-001 — PROPOSED, PENDING PRODUCT OWNER DECISION
Open questions: GA-Q0 .. GA-Q15
IMPLEMENTATION AUTHORITY: NONE
PROVIDER-CALL AUTHORITY: NONE
RUNTIME-WIRING AUTHORITY: NONE
DATABASE AUTHORITY: NONE
VALIDATION AUTHORITY: NONE
DEPLOYMENT AUTHORITY: NONE
OD-13 runtime gate: IN FORCE
```

## §17 Execution counters (this record)

```text
Files created: 1 (this record)
Files modified: 0
Production files changed: 0
Test files changed: 0
Schema/migration changes: 0
Configuration changes: 0
Provider calls: 0
External HTTP requests: 0
Database connections: 0
Database writes: 0
Runtime wiring: 0
Validation sessions: 0
Deployment: 0
Commits: 0
```
