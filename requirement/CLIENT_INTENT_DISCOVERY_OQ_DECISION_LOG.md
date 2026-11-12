# CLIENT INTENT DISCOVERY

## Open Questions OQ-1 to OQ-12 — Product Owner Decision Log

**Decision-log ID:** CLIENT-INTENT-DISCOVERY-OQ-DEC-001 (the ID reserved by CLIENT-INTENT-DISCOVERY-OQ-PREP-001;
used here for the decision surface only — no decision is recorded)
**Date:** 2026-09-30
**Type:** Product Owner decision log (decision surface only). Not a decision, not an implementation authorization.
**Logs:** CLIENT-INTENT-DISCOVERY-REQ-001 §10, OQ-1 to OQ-12
**Prepared by:** CLIENT-INTENT-DISCOVERY-OQ-PREP-001
**Author role:** Product Owner decision recorder.

```text
Decision-log status: OPEN
Product Owner decisions recorded: 0 of 12
OQ-1 through OQ-12: ALL PENDING
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

> **This record creates the formal surface on which the Product Owner may later record answers to OQ-1 to OQ-12.
> It answers no question, selects no option, ranks no alternative, recommends nothing and infers no Product Owner
> preference.**

---

## §1 Decision scope

This log covers exactly:

- OQ-1
- OQ-2
- OQ-3
- OQ-4
- OQ-5
- OQ-6
- OQ-7
- OQ-8
- OQ-9
- OQ-10
- OQ-11
- OQ-12

of CLIENT-INTENT-DISCOVERY-REQ-001 §10. **No question is resolved by this record.** Order is source order and
carries no priority (the source lists them as "unranked; not answered").

Outside this record (not decided here, and not decided by any later answer entered in this log unless a separate
record says so): provider selection; provider availability; API access; provider authentication; scraping / access
mechanisms; evidence storage; schema; deduplication; freshness; opportunity-creation implementation; runtime
architecture; outreach; validation; deployment.

## §2 Source integrity (verified before writing)

| Item | Value |
|---|---|
| Source requirement path | `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` |
| Source requirement ID | CLIENT-INTENT-DISCOVERY-REQ-001 |
| Source requirement sha256 | `606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68` |
| Preparation-record path | `requirement/CLIENT_INTENT_DISCOVERY_OQ_DECISION_PREPARATION.md` |
| Preparation-record ID | CLIENT-INTENT-DISCOVERY-OQ-PREP-001 |
| Preparation-record sha256 | `4b60c6e3ad1052f321036dc1325ecc9b8d5f0b3df2cb159b94ce560fbdd83314` |
| Branch | `phase-17-r34-worker-orchestration` |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Staged files | 0 |
| Working-tree entries | 243 (before this record) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` (= REQ-001 §0 = PREP-001 §1) |

**Governing records (sha256 recomputed; all equal to PREP-001 §1):**

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
| `PHASE_23_FOLLOWUP_PREPARATION_SCOPE_LOCK.md` | — | `176eff2b5532067a3dda9dbf9491470a3c30fec5352cb1507f6c6a74c5bec714` |

**Verbatim-source rule.** Each "Question" below is copied byte-for-byte from the REQ-001 §10 table cell (source
lines 229–240). REQ-001 §10 states no sub-questions, alternatives, examples or constraints beyond the question text
itself; none are added here. Where PREP-001 adds "Framing preserved" or "Alternatives / sub-questions" analysis
(OQ-8, OQ-11, OQ-12), that analysis is PREP-001's own and is **not** reproduced as question text.

**Source / preparation comparison.** PREP-001's "Question (verbatim)" text matches REQ-001 §10 for all twelve
questions. The only difference is Markdown source line-wrapping in PREP-001 for OQ-7, OQ-11 and OQ-12 (a soft
wrap, no word changed). No wording discrepancy exists; REQ-001 is treated as authoritative regardless.

## §3 OQ-1 through OQ-12

### OQ-1

```text
Question:
Which providers will be authorized first?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-2

```text
Question:
What provider / API capabilities are actually available?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-3

```text
Question:
What constitutes sufficient evidence of buying intent?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-4

```text
Question:
How should intent confidence be determined?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-5

```text
Question:
How should duplicate intent across providers be handled?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-6

```text
Question:
How should stale intent decay?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-7

```text
Question:
How should the same prospective client appearing across Google, ChatGPT, LinkedIn and other providers be unified?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-8

```text
Question:
What provider-specific access and retention constraints apply?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-9

```text
Question:
When does an intent signal become a canonical opportunity?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-10

```text
Question:
What human approval is required before outreach?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-11

```text
Question:
May an individual person (not an organization) be a potential client, and if so, how does that fit the existing privacy boundary?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

### OQ-12

```text
Question:
How do the four source classes relate to the existing source families and to INTENT-INTAKE-GOOGLE-ADS-REQ-001?

Status:
PENDING

Product Owner decision:
NONE

Selected answer:
NONE

Decision rationale:
NONE — no Product Owner decision has been recorded.

Implementation consequence:
NONE — no implementation authority is granted by this record.
```

## §4 Decision matrix

| Question | Status  | Product Owner decision | Selected answer |
| -------- | ------- | ---------------------- | --------------- |
| OQ-1     | PENDING | NONE                   | NONE            |
| OQ-2     | PENDING | NONE                   | NONE            |
| OQ-3     | PENDING | NONE                   | NONE            |
| OQ-4     | PENDING | NONE                   | NONE            |
| OQ-5     | PENDING | NONE                   | NONE            |
| OQ-6     | PENDING | NONE                   | NONE            |
| OQ-7     | PENDING | NONE                   | NONE            |
| OQ-8     | PENDING | NONE                   | NONE            |
| OQ-9     | PENDING | NONE                   | NONE            |
| OQ-10    | PENDING | NONE                   | NONE            |
| OQ-11    | PENDING | NONE                   | NONE            |
| OQ-12    | PENDING | NONE                   | NONE            |

## §5 No authorization

This decision log grants **no** authority to:

- implement Client Intent Discovery;
- implement Google integration;
- implement ChatGPT integration;
- implement LinkedIn integration;
- implement any other provider;
- make provider/API calls;
- register or use credentials/API keys;
- modify provider configuration;
- modify production code;
- modify tests;
- modify database/schema/migrations;
- modify runtime wiring;
- perform validation;
- contact or outreach to prospective clients;
- deploy.

A later Product Owner answer recorded against any OQ is distinct from, and does not imply, any of the above; each
requires its own separate record (REQ-001 R-9.1, R-9.2).

```text
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

## §6 Execution counters (this record)

```text
Files created: 1 (this record)
Files modified: 0 (source requirement and preparation record unchanged)
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
