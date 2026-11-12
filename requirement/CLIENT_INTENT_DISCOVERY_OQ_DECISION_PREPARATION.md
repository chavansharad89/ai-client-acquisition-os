# CLIENT INTENT DISCOVERY

## Open Questions OQ-1 to OQ-12 — Product Owner Decision Preparation

**Preparation ID:** CLIENT-INTENT-DISCOVERY-OQ-PREP-001
**Decision ID (reserved):** CLIENT-INTENT-DISCOVERY-OQ-DEC-001 (not created; no decision exists)
**Date:** 2026-09-30
**Type:** Product Owner decision preparation only. Not a decision record, not an implementation authorization.
**Prepares:** CLIENT-INTENT-DISCOVERY-REQ-001 §10, OQ-1 to OQ-12
**Author role:** repository analyst / governance recorder.
**Convention:** separate preparation file; the source requirement is left unchanged. No option is selected, ranked,
recommended or preferred.

```text
Decision status: PENDING
Product Owner decision: REQUIRED
Implementation authority: NONE
Provider-call authority: NONE
Runtime-wiring authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
```

> **This record prepares questions only. It answers none of OQ-1 to OQ-12 and grants no implementation,
> provider-call, runtime-wiring, database, schema/migration, integration-naming, key-registration, validation,
> outreach/contact or deployment authority.**

---

## §1 Source and baseline (verified before writing)

| Item | Value |
|---|---|
| Source requirement path | `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` |
| Source requirement ID | CLIENT-INTENT-DISCOVERY-REQ-001 |
| Source requirement sha256 | `606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68` |
| Branch | `phase-17-r34-worker-orchestration` |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Staged files | 0 |
| Working-tree entries | 242 (before this record) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` (= REQ-001 §0) |

**Governing records cited by the source requirement (sha256; all equal to REQ-001 §0 where listed there):**

| Record | ID | sha256 |
|---|---|---|
| `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | INTENT-INTAKE-PO-DEC-001 (D1–D5) | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md` | INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 (OD-1..OD-13) | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` | INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_RUNTIME_COMPONENT_DECISION.md` | INTENT-INTAKE-OD13-INGRESS-DEC-001 | `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_POST_SAVE_RESEARCH_DECISION.md` | INTENT-INTAKE-OD13-POSTSAVE-DEC-001 | `6ffd207561c2db580137ddb030df43f072359b2390ad75276ec918fe9b04b16d` |
| `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-ADAPTER-IMPL-REC-001 | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | INTENT-INTAKE-GOOGLE-ADS-REQ-001 (PROPOSED) | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |
| `PHASE_22_OUTREACH_PREPARATION_SCOPE_LOCK.md` | — | `6b59aa69bb8cd5a9b29a135402d30b682cf2960357f68bc2b05122f88e546294` |
| `PHASE_23_FOLLOWUP_PREPARATION_SCOPE_LOCK.md` | — (cited by REQ-001 R-7.2; not hashed in REQ-001 §0) | `176eff2b5532067a3dda9dbf9491470a3c30fec5352cb1507f6c6a74c5bec714` |

The source requirement is not modified by this record.

## §2 Decision scope

This preparation record covers **only** OQ-1, OQ-2, OQ-3, OQ-4, OQ-5, OQ-6, OQ-7, OQ-8, OQ-9, OQ-10, OQ-11 and
OQ-12 of CLIENT-INTENT-DISCOVERY-REQ-001 §10. Its purpose is to prepare these questions for Product Owner
resolution. **No question is decided by this record.** The source lists them as "unranked; not answered"; their
order here is the source order and carries no priority.

## §3 Open questions

Wording in the "Question (verbatim)" lines is copied exactly from REQ-001 §10. "Decision boundary" cites only what
REQ-001 already states; where it states nothing, that is recorded.

### OQ-1

- **Question (verbatim):** Which providers will be authorized first?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** naming a provider in §2 is a product need only, not a selection or
  authorization (R-2.1); provider selection is item 1 of the per-provider authorization list (R-9.1); access and
  permissions need separate authorization (R-5.3). The named examples (Google, ChatGPT, LinkedIn) are examples, not
  candidates selected by the source.
- **Alternatives / sub-questions in source:** none stated.

### OQ-2

- **Question (verbatim):** What provider / API capabilities are actually available?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** the source makes no claim that any provider exposes the required data, API or
  permission (R-2.1). This question concerns provider facts that the repository does not establish.
- **Alternatives / sub-questions in source:** none stated.

### OQ-3

- **Question (verbatim):** What constitutes sufficient evidence of buying intent?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** "original source evidence" and "confidence / evidence quality" are conceptual
  elements only (R-3.1); extracted intent must be traceable to, and distinguishable from, the original evidence
  (R-3.2); the examples in §3 illustrate intent but are not stated as a sufficiency test.
- **Alternatives / sub-questions in source:** none stated.

### OQ-4

- **Question (verbatim):** How should intent confidence be determined?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** existing intake rules derive kind and confidence centrally and reject
  source-assigned kind / confidence / classification (R-3.3, citing INTENT-SOURCE-ADAPTER-IMPL-REC-001 and
  PO-DEC-001 D5), stated as "existing constraints that continue to apply".
- **Alternatives / sub-questions in source:** none stated.

### OQ-5

- **Question (verbatim):** How should duplicate intent across providers be handled?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** none stated beyond provider neutrality (R-4.1, R-4.3).
- **Alternatives / sub-questions in source:** none stated.

### OQ-6

- **Question (verbatim):** How should stale intent decay?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** "timestamp / freshness" is a conceptual element (R-3.1); provider-specific
  freshness behavior is handled separately per provider (R-4.2).
- **Alternatives / sub-questions in source:** none stated.

### OQ-7

- **Question (verbatim):** How should the same prospective client appearing across Google, ChatGPT, LinkedIn and other
  providers be unified?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** the downstream opportunity model must not depend on any single provider
  (R-4.1); adding or removing a provider must not change the meaning of a signal or canonical opportunity (R-4.3).
- **Alternatives / sub-questions in source:** none stated.

### OQ-8

- **Question (verbatim):** What provider-specific access and retention constraints apply?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** discovery uses only authorized sources and access mechanisms (R-5.1); no
  access mechanism is prescribed or implied (R-5.2); traceability is subject to the source's permitted access and
  retention constraints (R-6.1); storage schema, retention period, tables, evidence capture and provider-specific
  storage rules are not decided (R-6.2); existing non-persistence decisions remain in force where they apply (R-6.2).
- **Alternatives / sub-questions in source:** the question has two parts — access constraints and retention
  constraints — both provider-specific. Neither is selected.

### OQ-9

- **Question (verbatim):** When does an intent signal become a canonical opportunity?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** the goal is transformation of a signal into a canonical opportunity that then
  enters the existing workflow (R-1.2); the §7 flow places Intent Qualification before Canonical Opportunity, and is
  conceptual and authorizes no step (R-7.1).
- **Alternatives / sub-questions in source:** none stated.

### OQ-10

- **Question (verbatim):** What human approval is required before outreach?
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** outreach and follow-up remain under their existing governance (PHASE_22 /
  PHASE_23 scope locks); REQ-001 grants no outreach or contact authority (R-7.2).
- **Alternatives / sub-questions in source:** none stated.

### OQ-11

- **Question (verbatim):** May an individual person (not an organization) be a potential client, and if so, how does
  that fit the existing privacy boundary?
- **Framing preserved:** whether an individual person, rather than an organization, can be a potential client, given
  the existing privacy boundary.
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** §3 defines a signal as from "a person or organization"; R-3.3 states that the
  existing privacy boundary (DEC-003 §6 and the provider-contract privacy screen) continues to apply and prohibits
  individual-level AI-conversation access, prompt capture, personal email / phone harvesting, click / advertising /
  device identifiers and inference about named individuals; R-3.3 leaves the individual-person question open.
- **Alternatives / sub-questions in source:** (a) whether an individual person may be a potential client; (b) if so,
  how that fits the existing privacy boundary. Sub-question (b) is conditional on (a). Neither is answered.

### OQ-12

- **Question (verbatim):** How do the four source classes relate to the existing source families and to
  INTENT-INTAKE-GOOGLE-ADS-REQ-001?
- **Framing preserved:** how the four new source classes (search providers; AI / assistant providers; professional /
  social platforms; extensible providers) map onto the three existing source families (`PUBLIC_WEB_SEARCH`,
  `AI_PLATFORM_ACQUISITION`, `PUBLIC_INTENT_NOTICE`), and how this relates to the existing Google Ads requirement.
- **Status:** `PENDING — PRODUCT OWNER DECISION REQUIRED`
- **Decision boundary (from REQ-001):** the relationship is not decided (R-2.2); §0 records the three existing
  families and the Google Ads requirement (PROPOSED); R-8.2 states that a provider supplying FIRST_PARTY signals would
  be governed by OD-1..OD-13 unchanged.
- **Alternatives / sub-questions in source:** (a) relationship of the four source classes to the three existing
  source families; (b) relationship to INTENT-INTAKE-GOOGLE-ADS-REQ-001. Neither is answered.

## §4 Existing constraints (carried forward from REQ-001; not new decisions)

| Area | Constraint as stated in REQ-001 |
|---|---|
| Authorized sources / access | Only sources and access mechanisms authorized for the product's use (R-5.1); no scraping, browser automation, credential sharing, access-control circumvention or other mechanism prescribed or implied (R-5.2); provider access and permissions need separate authorization (R-5.3). |
| Provenance | Every discovered opportunity traceable to available source evidence, subject to the source's access and retention constraints (R-6.1); schema, retention, tables, capture and provider storage rules undecided (R-6.2). |
| Privacy | Existing privacy boundary applies (R-3.3: DEC-003 §6; provider-contract privacy screen). |
| Kind / confidence | Source-assigned kind / confidence / classification rejected; derived centrally (R-3.3: adapter record; PO-DEC-001 D5). |
| Individual-person data | Open (R-3.3; OQ-11); the privacy prohibitions above continue to apply meanwhile. |
| Provider-specific authorization | Each provider integration needs its own future authorization for the ten R-9.1 items; REQ-001 grants none (R-9.2). |
| Provider neutrality | Downstream model independent of any single provider (R-4.1–R-4.3). |
| Separation from OD-13 | Client Intent Discovery is separate from OD-13 push-ingress work; no OD-13 decision is reopened, modified or implied; the OD-13 runtime gate stays in force (R-8.1, R-8.2). |
| Outreach | Existing outreach / follow-up governance applies; no outreach or contact authority (R-7.2). |

## §5 Dependencies and possible reopenings

Only dependencies stated by REQ-001 are listed. REQ-001 states no possible reopening of any existing decision for
any OQ; R-8.2 states that no OD-13 decision is reopened.

| OQ | Existing decisions / requirements REQ-001 connects to the question |
|---|---|
| OQ-1 | No dependency established by the available record. (Internal to REQ-001: R-2.1, R-5.3, R-9.1 item 1.) |
| OQ-2 | No dependency established by the available record. |
| OQ-3 | No dependency established by the available record. |
| OQ-4 | INTENT-SOURCE-ADAPTER-IMPL-REC-001 and PO-DEC-001 D5 (R-3.3), stated as constraints that continue to apply; REQ-001 does not state they may be reopened. |
| OQ-5 | No dependency established by the available record. |
| OQ-6 | No dependency established by the available record. |
| OQ-7 | No dependency established by the available record. |
| OQ-8 | Existing non-persistence decisions — provider-contract record, OD-10, OD-13 Q9 — "remain in force where they apply" (R-6.2); REQ-001 does not state they may be reopened. |
| OQ-9 | No dependency established by the available record. |
| OQ-10 | PHASE_22 / PHASE_23 scope locks (R-7.2); REQ-001 does not state they may be reopened. |
| OQ-11 | DEC-003 §6 privacy boundary and the provider-contract privacy screen (R-3.3); REQ-001 does not state they may be reopened. |
| OQ-12 | INTENT-SOURCE-ADAPTER-IMPL-REC-001 source families (§0, R-2.2); INTENT-INTAKE-GOOGLE-ADS-REQ-001 (§0); OD-1..OD-13 for any FIRST_PARTY path, unchanged (R-8.2). REQ-001 does not state any of them may be reopened. |

**Separate authorities (unchanged by any answer to OQ-1..OQ-12):** a Product Owner decision on an OQ is distinct
from, and does not imply, implementation authorization, provider-call authorization, runtime-wiring authorization,
validation authorization, outreach authorization or deployment authorization. Each requires its own record (R-9.1).

## §6 Explicit non-decisions

This preparation record does **not** decide: which provider is selected; whether Google is used; whether ChatGPT is
used; whether LinkedIn is used; provider / API availability; access mechanism; authentication mechanism;
credentials or key registration; provider configuration; source schema; database persistence; evidence-retention
policy; deduplication implementation; freshness implementation; opportunity-generation implementation; runtime
architecture; outreach mechanism; validation protocol; deployment. These remain subject to subsequent Product Owner
decisions and / or separate implementation authorizations.

## §7 Product Owner decision table

| OQ | Status | Product Owner decision required | Selected answer |
|---|---|---|---|
| OQ-1 | PENDING | YES | NONE |
| OQ-2 | PENDING | YES | NONE |
| OQ-3 | PENDING | YES | NONE |
| OQ-4 | PENDING | YES | NONE |
| OQ-5 | PENDING | YES | NONE |
| OQ-6 | PENDING | YES | NONE |
| OQ-7 | PENDING | YES | NONE |
| OQ-8 | PENDING | YES | NONE |
| OQ-9 | PENDING | YES | NONE |
| OQ-10 | PENDING | YES | NONE |
| OQ-11 | PENDING | YES | NONE |
| OQ-12 | PENDING | YES | NONE |

## §8 Authorization state

```text
Requirement definition: EXISTING
Decision preparation: CREATED
Product Owner decisions: PENDING
Implementation authorization: NONE
Provider-call authorization: NONE
Runtime-wiring authorization: NONE
Database authority: NONE
Schema/migration authority: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
```

## §9 Execution counters (this record)

```text
Files created: 1 (this record)
Files modified: 0 (source requirement unchanged)
Production code changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Runtime wiring: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```
