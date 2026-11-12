# CLIENT INTENT DISCOVERY

## OQ-1, OQ-2, OQ-8 — Product Owner Decision (Questionnaire Answers)

**Record ID:** CLIENT-INTENT-DISCOVERY-OQ-1-2-8-PO-DEC-001
**Date:** 2026-10-01
**Type:** Product Owner decision record (governance only). Not an implementation authorization.
**Source of answers:** Product Owner, via the "Product Owner Decision Questionnaire — Client Intent Discovery — OQ-1,
OQ-2, OQ-8", answered in session on 2026-10-01.
**Author role:** governance recorder. The answers below are the Product Owner's; the recorder supplied only the
evidence-derived status tables the Product Owner adopted.

```text
OQ-1: DECIDED — Google Search selected for first consideration (policy level only)
OQ-2: DECIDED — evidence-derived capability statuses adopted (§3)
OQ-8: DECIDED — evidence-derived access/retention statuses adopted (§4)
Execution authority granted: NONE
```

> **This record does not modify any existing record.** OQ-PO-DEC-001, the OQ decision log, PROVIDER-EVIDENCE-001,
> PROVIDER-EVIDENCE-PREP-001 and PROVIDER-FINALIZATION-DEC-001 keep their own text and statuses; this record is the
> later Product Owner answer to OQ-1, OQ-2 and OQ-8.

---

## §0 Baseline

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Working tree before this record | 1 untracked entry (`CLIENT_INTENT_DISCOVERY_PROVIDER_FINALIZATION_DECISION.md`) |

| Record | ID | sha256 |
|---|---|---|
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (canonical) | CLIENT-INTENT-DISCOVERY-REQ-001 | `e107b3e2ba42793f9a57937ef1946c0ef130e88840fe97039afd463de419860e` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-001 | `2387838ff125c35a8f6bf19e88eab4e8f91ef43a5665aecd2c0d18ad7be31647` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-PREP-001 | `1f7e0af55c526aa491d443be297221860e116f4290a2aead52b29a7d70fb973f` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` | CLIENT-INTENT-DISCOVERY-OQ-DEC-001 | `ccf11dc7dad6de6ed617070974963042eac977da45a8e9c3bf630d36f0270bb2` |

## §1 Governance boundary

A Product Owner answer to OQ-1, OQ-2 or OQ-8 is a **governance decision only**. This record authorizes no provider /
API call, credential, authentication, integration or registration, runtime wiring, scraping or browser automation,
database access or schema change, implementation, validation, outreach / contact or deployment (REQ-001 R-9.1–R-9.2).

## §2 OQ-1 — Which providers will be authorized first?

**Product Owner answer:**

> Provider(s) selected for first consideration: `Google Search`

- **Meaning:** Google Search is the provider the Product Owner wants considered first under Client Intent Discovery
  (REQ-001 R-9.1 item 1, provider selection, at the product-policy level).
- **Not selected:** Google Search Console, Google Ads, OpenAI / ChatGPT, LinkedIn, Reddit, Anthropic / Claude,
  Microsoft / Bing. Not selecting them is not a rejection; they may be considered by a later Product Owner decision.
- **Other authorized providers:** NOT AUTHORIZED BY THIS DECISION.
- **Recorded caveat (evidence, not a reversal of the answer):** under the OQ-2 / OQ-8 answers adopted below, Google
  Search capability for client-intent content is `NOT ESTABLISHED`, and the only evidenced access route (Custom Search
  JSON API) is **closed to new customers** (PROVIDER-EVIDENCE-001 S1). The selection therefore does not establish that
  Google Search can supply Client Intent Signals, and it does not select any specific Google product or API.
- **Not affected:** Google Ads remains governed solely by INTENT-INTAKE-GOOGLE-ADS-REQ-001 (REQ-001 R-2C.1); GA-Q0
  remains PENDING.

## §3 OQ-2 — What provider / API capabilities are actually available?

**Product Owner answer:** the following statuses, derived strictly from PROVIDER-EVIDENCE-001 §3 / §9, are adopted.

| Provider | Capability status |
|---|---|
| Google Search | NOT ESTABLISHED (intent content); web-result API only, closed to new customers |
| Google Search Console | NOT ESTABLISHED BY EXISTING EVIDENCE |
| Google Ads | PENDING — GA-Q0 dependency (partial: own-ad lead forms only) |
| OpenAI / ChatGPT | NOT ESTABLISHED (intent content); model API only |
| LinkedIn | NOT ESTABLISHED for third-party intent; partial: own lead-form responses only |
| Reddit | NOT ESTABLISHED BY EXISTING EVIDENCE |
| Anthropic / Claude | NOT ESTABLISHED BY EXISTING EVIDENCE |
| Microsoft / Bing | NOT ESTABLISHED BY EXISTING EVIDENCE |

No capability gap is converted into an affirmative capability.

## §4 OQ-8 — What provider-specific access and retention constraints apply?

**Product Owner answer:** the following statuses, derived strictly from PROVIDER-EVIDENCE-001 §3 / §10, are adopted.
NE = NOT ESTABLISHED BY EXISTING EVIDENCE; EST = ESTABLISHED.

| Provider | Access | Retention | Attribution | Deletion | Privacy / policy |
|---|---|---|---|---|---|
| Google Search | EST — API key; closed to new customers (S1) | EST — no permanent copies / caching beyond header (S3 §5.e) | EST (S3 §6.b) | EST — on termination (S3 §8.b) | EST (S3 §3.d, §2, §5; S4) |
| Google Search Console | NE | NE | NE | NE | NE |
| Google Ads | EST — developer token + OAuth; webhook (S5, S7) | EST (general, S3) | EST (S3 §6.b) | PARTIAL (S6 §15) | PENDING — GA-Q0 (DEPENDENCY — SEPARATE DECISION REQUIRED) |
| OpenAI / ChatGPT | EST — model API only; no intent-data access (S10) | PARTIAL — provider-side logs ≤ 30 days (S9); our retention NE | NE | NE | NE |
| LinkedIn | EST — application required; our eligibility NE (S13) | EST (S12 §4.1; S14) | EST (S12 §6.1) | EST (S12 §4.4–4.5) | EST — incl. no prospecting / lead creation from member data (S14) |
| Reddit | NE | NE | NE | NE | NE |
| Anthropic / Claude | NE | NE | NE | NE | NE |
| Microsoft / Bing | NE | NE | NE | NE | NE |

`EST` means the constraint is documented by the cited source; it is not permission to access the provider.

## §5 Dependency and non-reopening

Not reopened or modified: OD-1..OD-13; OD-13 Option B; Alternative I; PS-1..PS-8; D1–D5; DEC-003 (incl. §6 privacy
boundary); X1; C-1; INTENT-INTAKE-GOOGLE-ADS-REQ-001 and GA-Q0..GA-Q15; outreach governance (PHASE_22 / PHASE_23;
OQ-10); source / provenance rules; existing implementation decisions.

`DEPENDENCY — SEPARATE DECISION REQUIRED`: Google Ads capability and privacy / policy (GA-Q0).

Remaining evidence gaps are those listed in PROVIDER-EVIDENCE-001 §12 and PROVIDER-FINALIZATION-DEC-001 §7; none is
filled here.

## §6 Audit

```text
Files created: 1 (this record)
Files modified: 0
Provider calls: 0
External HTTP: 0
Credentials used: 0
Database activity: 0
Runtime changes: 0
Production / test / schema / config changes: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```

## §7 Final authority state

```text
Provider calls: NONE
Credentials: NONE
External HTTP execution: NONE
Production provider access: NONE
Integrations: NONE
Runtime wiring: NONE
Scraping/browser automation: NONE
Database access: NONE
Schema/migration authority: NONE
Implementation: NONE
Validation: NONE
Outreach/contact: NONE
Deployment: NONE
```

**Provider selected for first consideration:** Google Search (policy level only)
**Execution authority granted:** NONE
