# CLIENT INTENT DISCOVERY — PROVIDER-NEUTRAL MVP READINESS

**Record ID:** CLIENT-INTENT-DISCOVERY-PROVIDER-NEUTRAL-MVP-READINESS-001
**Date:** 2026-10-01
**Type:** `PLANNING / READINESS ANALYSIS — NOT IMPLEMENTATION AUTHORIZATION`
**Basis:** CLIENT-INTENT-DISCOVERY-REQ-001 (post-Amendment-2, sha256 `ccf88646…`) and the governing records in §2.
**Author role:** requirements / governance analyst.

```text
Record status: PLANNING / READINESS ANALYSIS — NOT IMPLEMENTATION AUTHORIZATION
Decisions made by this record: NONE
Existing decisions reopened: NONE
Providers selected / ranked / authorized: NONE
Execution authority granted: NONE
```

> **This record analyzes what the requirement and existing decisions already define, separates provider-neutral
> capability from provider-specific dependency, and lists what remains undecided. It designs no schema, selects no
> API / SDK / credential / integration name / table / queue / webhook / runtime mechanism, and authorizes nothing.
> Where it describes a capability as "provider-independent", that means only that the capability does not require
> live provider access — not that it is authorized, designed or ready to implement.**

Labels: **DECIDED** (cited from an existing decision record); **REQUIREMENT** (cited from REQ-001); **OPEN** (not
decided; listed in §9); **GAP** (evidence missing; listed in §10). Repository code facts are cited only as recorded in
the governing records' evidence bases; this record did not re-inspect source code.

---

## §1 Baseline

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Working-tree entries before this record | 4: `M CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (Amendment 2); untracked `CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md`, `CLIENT_INTENT_DISCOVERY_PROVIDER_FINALIZATION_DECISION.md`, `CLIENT_INTENT_DISCOVERY_REQUIREMENT_HASH_RECONCILIATION_AMENDMENT_2.md` |
| Canonical requirement sha256 (independently computed) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` — equals the expected value |

**Stop-condition check (all clear):**

| Condition | Result |
|---|---|
| Canonical hash differs from `ccf88646…` | No |
| A Product Owner decision conflicts with Amendment 2 | No — Amendment 2 R-13.5, R-13.14, R-13.22, R-13.23 and R-13.28 defer to OQ-3, OQ-7, OQ-9, OQ-10, OQ-11 and D5 |
| Provider-neutral architecture requires reopening a decision | No — the Amendment 2 flow maps onto existing decisions (§4.0) |
| Requirement indistinguishable from implementation decision | No — implementation-level items are listed as OPEN (§9) |
| Contradictory governance not classifiable | No — see classification note below |

**Classification note.** OQ-PO-DEC-001 (2026-09-30) records OQ-1, OQ-2 and OQ-8 as PENDING, and
PROVIDER-FINALIZATION-DEC-001 records OQ-1 as `PENDING — EVIDENCE INSUFFICIENT`. OQ-1-2-8-PO-DEC-001 (2026-10-01)
states that it is the **later** Product Owner answer to those three questions and that it modifies no earlier record.
This record therefore treats OQ-1-2-8-PO-DEC-001 as the current answers and the earlier PENDING statuses as historical
states of those records. REQ-001 §10 (which still describes OQ-1..OQ-12 as "not answered") is the unchanged question
list. Its answers live in the decision records.

## §2 Governing records

| Record | ID | Role | sha256 (verified) |
|---|---|---|---|
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | CLIENT-INTENT-DISCOVERY-REQ-001 (Amendments 1, 2) | Canonical requirement | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-PO-DEC-001 | OQ-3..OQ-7, OQ-9..OQ-12 DECIDED | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| `CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-1-2-8-PO-DEC-001 | OQ-1, OQ-2, OQ-8 DECIDED | `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` | CLIENT-INTENT-DISCOVERY-OQ-DEC-001 | OQ log (historical) | `ccf11dc7dad6de6ed617070974963042eac977da45a8e9c3bf630d36f0270bb2` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-PREP-001 | Preparation (historical) | `4b60c6e3ad1052f321036dc1325ecc9b8d5f0b3df2cb159b94ce560fbdd83314` |
| `CLIENT_INTENT_DISCOVERY_OQ_PRODUCT_OWNER_SESSION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-SESSION-PREP-001 | Session evidence pack; conflicts C-1..C-8 | `4506a050d215805e483fbaf07c2f56a57a43655f80b47808472cbe94a62ebe44` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-001 | Provider evidence S1–S15 | `2387838ff125c35a8f6bf19e88eab4e8f91ef43a5665aecd2c0d18ad7be31647` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-PREP-001 | Evidence requirements | `1f7e0af55c526aa491d443be297221860e116f4290a2aead52b29a7d70fb973f` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_FINALIZATION_DECISION.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-FINALIZATION-DEC-001 | Provider matrix (prepared; no selection) | `adcb7f5333511cdc673bd4046b86217d1c6e889801521c80c34bd9fae2ab6bab` |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT_HASH_RECONCILIATION.md` | CLIENT-INTENT-DISCOVERY-REQ-HASH-RECON-001 | Amendment 1 reconciliation | `a5973f4f644369b910547436ccadd4c31e66ee3787025173ece6c269a12b5765` |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT_HASH_RECONCILIATION_AMENDMENT_2.md` | CLIENT-INTENT-DISCOVERY-REQ-HASH-RECON-002 | Amendment 2 reconciliation | `3579a0460446097bbd5ed86c5f47684f4be7d5a16ee3a4eb3a01199a2a65cf7f` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | INTENT-INTAKE-GOOGLE-ADS-REQ-001 (PROPOSED) | Google Ads provider requirement; GA-Q0..GA-Q15 PENDING | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |

Other records cited by ID only, as cited in the records above: INTENT-INTAKE-PO-DEC-001 (D1–D5, E1, E2),
INTENT-INTAKE-PO-DEC-003 (DEC-003 §6), INTENT-SOURCE-ADAPTER-IMPL-REC-001 (ADAPTER-REC),
INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 (CONTRACT-REC), DESIGN-001 (OD-1..OD-13), OD13-M, IG-1..IG-7, PS-1..PS-8,
`MVP_SCOPE_BOUNDARY.md` (§6.2, C-5), PHASE_22 / PHASE_23 scope locks.

## §3 Existing decisions preserved

None of the following is reopened, reinterpreted or extended:

| Decision | Content relied on in this record |
|---|---|
| OQ-1 (OQ-1-2-8-PO-DEC-001 §2) | Google Search selected **for first consideration, policy level only**; no product / API selected; other providers not authorized |
| OQ-2 (§3) | Capability statuses as adopted; no gap converted into a capability |
| OQ-8 (§4) | Access / retention statuses as adopted; `EST` ≠ permission |
| OQ-3 | Sufficient evidence = verbatim statement + business-level attribution (source-supplied identity) + traceability (source reference, observed time) + privacy compliance |
| OQ-4 / D5 | Confidence central, fixed by kind (`PUBLIC_INTENT` 70, `FIRST_PARTY` 90); provider-supplied kind / confidence / classification rejected |
| OQ-5 / OD-12 | Evidence kept per provider, append-only; consolidation at client level; no new dedup mechanism |
| OQ-6 | Age from observed time; single existing decay rule (30 / 180 days); evidence never deleted |
| OQ-7 | Unification only by source-supplied normalized business website domain within the owning user's Search; no inferred / probabilistic / personal-data matching |
| OQ-9 | Opportunity only via existing intake → Research (D4) → post-research pipeline (E1); "Intent Qualification" = OQ-3 / OQ-7 / privacy checks; adapters never create Prospects / Opportunities |
| OQ-10 | Explicit per-message human approval by owning user; no autonomous outreach; no outreach until C-5 gate and separate authorization |
| OQ-11 | Organizations (or persons acting as a business) only; no private individuals |
| OQ-12 | Source classes ≠ source families; mapping per provider; kind from disclosure (PUBLISHED → PUBLIC_INTENT; SUPPLIED_TO_US → FIRST_PARTY); GA-REQ subordinate |
| R-2C.1 / GA-REQ | Google Ads governed solely by GA-REQ; GA-Q0..GA-Q15 PENDING |
| DEC-003 §6; CONTRACT-REC §3–§4; R-3.3; R-3A.3; R-13.20–R-13.23 | Privacy boundary and privacy screen |
| OD-1..OD-13, Option B, Alternative I, X1, C-1, R-8.1–R-8.2 | FIRST_PARTY push-ingress path, separate and unchanged; OD-13 runtime gate in force |
| OD-10; OD13-M Q9 | Raw provider payload / basis / signature material not persisted |

## §4 Provider-neutral core

### 4.0 Mapping of the Amendment 2 flow to existing decisions

| Amendment 2 step (R-13.9) | Governing decision(s) | Readiness observation |
|---|---|---|
| Provider / source | R-5.1, R-9.1; OQ-1..OQ-2 | No provider authorized. Outside the core (§6, §7). |
| Source-specific evidence | R-13.15–R-13.17; OQ-8; CONTRACT-REC §3–§4 | Provider-specific. Handled by an adapter (§6). |
| Canonical Intent Signal | R-3.1, R-3.2, R-13.10; OQ-3; OQ-12 | Provider-neutral (§5). |
| Intent classification | OQ-4 / D5; OQ-12 item 3; R-3A.1; D3 | Central. Kind from disclosure. No provider classification accepted (§4.3). |
| Business identification | OQ-7; OQ-11; OQ-3 item 2 | Source-supplied domain only. No resolution or inference (§4.4). |
| Qualification | OQ-9 item 2; D4 | Intent qualification = OQ-3 / OQ-7 / privacy checks at intake. Existing Research / qualification follows (§4.6). |
| Opportunity creation | OQ-9 item 1; E1 | Existing pipeline only. No new states (§4.5). |
| Human approval | OQ-10 | Per message, by owning user (§4.7). |
| Outreach workflow | OQ-10 item 3; R-7.2; C-5; PHASE_22 / PHASE_23 | Blocked. No authority. |

The Amendment 2 ordering (business identification before qualification) is conceptual (R-7.1, R-13.14). Under OQ-9,
the OQ-3 / OQ-7 / privacy checks occur together at normalization and intake, and existing Research / qualification
follows. No reordering of existing behavior is implied.

### 4.1 Evidence intake (requirements level)

The core must conceptually accept evidence from any source class (§2A A–F; R-13.6) through one representation
(R-13.10), provided the evidence arrives through a permitted mechanism (R-13.15) and not through any excluded one
(R-13.17).

Three evidence classes must remain distinct and must not be collapsed (R-3A.1, R-13.4):

| Class | Can it be a Client Intent Signal under OQ-3? | Status |
|---|---|---|
| Search intent | Only if it carries a verbatim statement attributable to an organization by source-supplied identity, plus traceability and privacy compliance. Whether and when search intent can contribute to an opportunity is undecided. | OPEN (AMD1-DEP-2) |
| Published / self-declared client intent | Yes, when all OQ-3 conditions hold. Kind = `PUBLIC_INTENT` if PUBLISHED (OQ-12). | DECIDED (OQ-3, OQ-12) |
| Inferred business need | No. OQ-3 excludes "inferred, summarized or model-generated need" as evidence. Its representation relative to explicit intent is undecided. | OQ-3 DECIDED; representation OPEN (AMD1-DEP-3) |

Disclosure governs kind (OQ-12 item 3):
- SUPPLIED_TO_US evidence is FIRST_PARTY and falls under OD-1..OD-13 (R-8.2), not under this core path.

### 4.2 Canonical Intent Signal

See §5.

### 4.3 Intent classification

Requirements already decided:

- **Who classifies:** the system, centrally. Source-assigned kind, confidence or classification is rejected (R-3.3;
  OQ-4; D5).
- **Kind:** derived from disclosure, not from source class or provider (OQ-12 item 3).
- **Confidence:** fixed by kind (D5). There is no scoring formula, provider weighting or model-assigned confidence. A
  finer evidence-quality measure would require reopening D5 by a separate record (OQ-4 limitation).
- **Evidence vs inference:** extracted intent must be traceable to and distinguishable from the verbatim source
  statement, and must not be presented as the source's own words (R-3.2, R-3A.1).
- **Service relevance:** the user defines what they sell (R-1.3, R-3A.2). Matching a need to the user's offerings
  uses the existing ServiceProfile trigger (D3) and Research (D4) path. Matching beyond D3 is **not decided** (OQ-3
  limitation).

Service categories:
- Website development, web application development, mobile application development, SaaS / product development,
  website redesign, e-commerce development, React / Node development, internal business software and agency /
  development-team requirements appear in the requirement only as **examples** (R-3A.2, R-13.3).
- No governing record defines a fixed service-category vocabulary, a classification method or thresholds. Whether
  one is required is OPEN (§9 PD-3).

### 4.4 Business identification

What the requirement and decisions currently permit:

- **Who may be a client:** an organization, or a person acting as a business, only (OQ-11; R-13.22–R-13.23).
- **What identity is:** the normalized business website domain **supplied by the source**, within the owning user's
  Search (OQ-7). The existing identity anchor applies.
- **What is prohibited:**
  - inferring identity from a URL, company-name similarity, personal names, email, phone or any personal identifier
    (OQ-3 item 2; OQ-7 item 3);
  - identifying anonymous searchers or AI users (R-13.21);
  - private-person identity resolution of any kind (DEC-003 §6; R-3A.3).
- **No usable identity:** a signal without source-supplied, usable business identity is not unified or ingested.
  Existing `UNATTRIBUTED` / rejection outcomes apply (OQ-7 item 4).

Consequence for readiness:
- "Business identification" in the Amendment 2 flow currently means **validating and normalizing source-supplied
  business identity**. It does not mean discovering or resolving identity.
- Any broader identification step would require a separate decision and could not reopen OQ-7 implicitly (§9 PD-4).
- Clients without a usable website cannot be ingested under OQ-7 (accepted limitation).

### 4.5 Opportunity creation

Requirements-level conditions (OQ-9; all DECIDED):

1. sufficient evidence (OQ-3);
2. attributable organization (OQ-7, OQ-11);
3. Company / Prospect in the owning user's existing Search;
4. signals saved, append-only (OQ-5);
5. existing Research where required (D4);
6. the existing post-research pipeline finds or creates the Opportunity (E1).

Further constraints:
- Duplicate intent across providers never creates a second Opportunity for the same Prospect (OQ-5).
- Adapters never create Prospects, Opportunities, determinations, offers or outreach (OQ-9 item 3).
- The existing opportunity state machine is unchanged and no state is added.

OPEN: how discovered signals from **pull-style** sources are bound to a user's Search (OQ-9 limitation; cf. GA-Q12;
IG-5 covers push ingress only). See §9 PD-5.

### 4.6 Qualification

Provider-neutral qualification that requires no provider access, as defined by existing decisions:

- **Intent qualification** (OQ-9 item 2): the OQ-3 sufficiency checks, OQ-7 attribution check and privacy screen.
  These operate on the canonical signal, whatever its provider.
- **Existing Research / qualification / scoring:** D3, D4, the D1 intake weights (`SOURCE_WEIGHT` 0) and the OQ-6
  decay rule. All are unchanged.
- **Separation:** source evidence (verbatim quote, source reference, observed time) stays separate from system
  inference (extracted intent, requested-service match, inferred business need) (R-3A.1).
- **Evidence:** no evidence may be invented. Model-generated or summarized needs are not evidence (OQ-3 item 1).

### 4.7 Human approval

Preserved unchanged (OQ-10; R-7.2; MVP §6.2, C-5; PHASE_22 / PHASE_23):

- explicit per-message approval by the owning user;
- no bulk, implicit, default or time-based approval;
- drafts at most, with terminal state "ready for human review";
- no outreach wiring until the C-5 gate is enforceable and outreach is separately authorized.

This record grants no outreach or contact authority.

Carried-forward conflicts: SESSION-PREP-001 §5 C-2 (PHASE_22 DRAFT / PHASE_23 PROPOSED) and C-4 (C-5 gate not
currently restorable) remain unresolved.

### 4.8 Provider adapters

See §6.

## §5 Canonical intent / evidence requirements

This section lists requirements-level information only. It defines no fields, types, schema, tables or persistence.

| Information to be represented | Source of requirement | Supplied by source/adapter, or derived by core? | Notes |
|---|---|---|---|
| Original source evidence: the verbatim statement of need | R-3.1; R-3.2; OQ-3 item 1 | Source / adapter | Must appear verbatim. Subject to provider retention terms (OQ-8; GAP). |
| Source / provider identity | R-3.1; R-6.1 | Source / adapter | Provider-specific values. Their meaning stays provider-neutral (R-13.10). |
| Source reference for traceability | OQ-3 item 3; R-6.1 | Source / adapter | Per CONTRACT-REC §3–§4, persisted provenance is limited to label, URL, quote, observed time and system capture time. Raw payload, basis and reference are not persisted (OD-10; OD13-M Q9). |
| Observed time | OQ-3 item 3; OQ-6 | Source / adapter | The basis for decay. |
| Expressed time (as distinct from observed time) | R-3.1 "when the need was expressed" | Source / adapter where available | Not distinguished in the existing persisted model (OQ-6 limitation). OPEN (§9 PD-6). |
| System capture time | CONTRACT-REC §3–§4 | Core | Existing. |
| Disclosure (published vs supplied to us) | OQ-12 item 3 | Source / adapter declares; core derives kind | Determines `PUBLIC_INTENT` vs `FIRST_PARTY`. FIRST_PARTY falls under OD-1..OD-13. |
| Business-level identity: business website domain | OQ-3 item 2; OQ-7 | Source / adapter | Never inferred. Absence leads to `UNATTRIBUTED`. |
| Evidence class: search intent / published client intent / inferred business need | R-3A.1; R-13.4 | Core | Must remain distinguishable. Representation of inferred need is OPEN (AMD1-DEP-3). |
| Extracted intent / requested service | R-3.1; R-3.2 | Core | System inference. Must be traceable to, and kept separate from, evidence. |
| Kind and confidence | OQ-4; D5; OQ-12 | Core only | Provider values rejected. |
| Privacy-screen outcome | OQ-3 item 4; DEC-003 §6 | Core | Existing screen. Personal identifiers are rejected. |
| Resulting opportunity (link) | R-3.1; OQ-9 | Core, via existing pipeline | Only via E1. |
| No individual identity required | OQ-11; R-13.21 | Core invariant | Existing `individualIdentityRequired = false` per OQ-11 evidence basis. |

## §6 Provider adapter boundary

```text
Provider Adapter            (provider-specific; per-provider requirement + authorization; R-4.2, R-9.1)
        ↓  supplies source evidence only
Canonical Intent Signal     (provider-neutral; R-13.10)
        ↓
Provider-Neutral Core       (classification, identity validation, qualification, intake → existing pipeline)
```

**An adapter must conceptually supply** (the "Source / adapter" rows of §5):

- the verbatim statement;
- the source / provider identity;
- the source reference;
- the observed time, and the expressed time where available;
- the disclosure;
- the source-supplied business website domain.

It must supply these only from a permitted mechanism (R-13.15).

**An adapter must not:**

- assign kind, confidence or classification (R-3.3; D5);
- infer business identity (OQ-7);
- supply personal identifiers, private conversations, private queries, advertising IDs or click IDs (R-3A.3; R-13.21);
- create Prospects, Opportunities, determinations, offers or outreach (OQ-9 item 3);
- persist raw payloads where existing decisions forbid it (OD-10; OD13-M Q9);
- use any excluded mechanism (R-13.17).

**Provider-specific concerns that stay inside the adapter boundary** (R-4.2):
- access and authentication;
- limits;
- terms;
- attribution;
- retention and deletion obligations;
- freshness behavior;
- mapping to an existing source family (OQ-12 item 2).

**Existing implemented contract.** Per the OQ-PO-DEC-001 evidence bases, an intent-source adapter and provider
contract already exist for three families (`PUBLIC_WEB_SEARCH`, `AI_PLATFORM_ACQUISITION`, `PUBLIC_INTENT_NOTICE`;
ADAPTER-REC; CONTRACT-REC). This record does not re-evaluate, modify or extend them. Whether the existing contract
fully covers this conceptual boundary is OPEN, specifically the expressed-time distinction and evidence-class
representation (§9 PD-6, PD-2). No existing family covers professional / social platforms (OQ-12; C-1).

This record selects no API, SDK, credential, integration name, table, queue, webhook or runtime mechanism.

## §7 Provider-specific dependencies

Abbreviations:
- **NE** = NOT ESTABLISHED BY EXISTING EVIDENCE.
- **Impl. dep.** = whether a provider-specific implementation dependency would exist if the source were later
  authorized. It is not an indication that implementation is permitted.

| Provider / source | Requirement-level source category | Existing evidence | Capability established? | Access established? | Authorization established? | Impl. dep.? | Missing evidence / decision |
|---|---|---|---|---|---|---|---|
| **Google Search** | §2A A | PROVIDER-EVIDENCE-001 S1–S4; OQ-1-2-8 §3–§4 | NE (intent content); web-result API only | Partial: API key; **closed to new customers** (S1) | **No.** Selected for first consideration only (OQ-1, policy level) | Yes (adapter, if ever authorized) | Any route supplying business-attributable statements; access for new customers; R-9.1 authorization |
| **Google Search Console** | §2A A (scope observation: not named in REQ-001 §2 / §2A) | None | NE | NE | No | Unknown | All R-2B.1 items; any decision to consider it |
| **Google Ads** | Outside §2A (R-2C.1); GA-REQ | S3, S5–S8 | PENDING — GA-Q0; partial: own-ad lead forms only | Established mechanism (dev token + OAuth; webhook); our eligibility NE | No | Yes | GA-Q0..GA-Q15; payload personal fields vs privacy screen; FIRST_PARTY routing (OQ-12 item 3) |
| **OpenAI / ChatGPT** | §2A B | S9, S10 (X1–X3 not retrievable) | NE (intent content); model API only | Model API only | No | Not as an intent source | Terms (X1); any intent-data product; R-13.1 excludes private conversations |
| **LinkedIn** | §2A C | S11–S15 | NE for third-party intent; partial: own lead-form responses | Partial: application required; our eligibility NE | No | Yes | Own-form responses are SUPPLIED_TO_US (OQ-12) → OD-13 path; member data barred for prospecting (S14); no family for professional / social (C-1) |
| **Reddit** | §2A D | None | NE | NE | No | Unknown | All R-2B.1 items |
| **Anthropic / Claude** | §2A B | None (privacy-boundary mention only) | NE | NE | No | Unknown | All R-2B.1 items; R-13.1 excludes private conversations |
| **Microsoft / Bing** | §2A A (scope observation: not named in REQ-001) | None | NE | NE | No | Unknown | All R-2B.1 items |
| **Other authorized providers** | §2A F | None | NE | NE | No — `NOT AUTHORIZED` | Unknown | Per-provider requirement + R-2B.1 + R-9.1 |
| **Freelance / marketplace / RFP sources** | §2A E (as described by R-13.6) | None (named examples only: Upwork, Fiverr, Freelancer) | NE | NE | No | Unknown | All R-2B.1 items; family mapping (OQ-12 item 2) |
| **Public web / community sources** | §2A A / D | None (Custom Search evidence only, above) | NE | NE | No | Unknown | All R-2B.1 items; R-13.16: being public is not authorization |

Further notes:
- No "possible" source is recorded as available.
- No "selected for consideration" source is recorded as authorized.
- OQ-1, OQ-2 and OQ-8 answers are reproduced as adopted and are not altered.

## §8 Provider-independent vs provider-dependent capabilities

Both columns describe requirements-level capability only. Neither is authorized or designed by this record.

| Provider-independent (no live provider access required) | Basis |
|---|---|
| Canonical Intent Signal concept and its three-class evidence distinction | R-3.1, R-3A, R-13.4, R-13.10 |
| Evidence / provenance concepts (verbatim, source reference, observed time, capture time) | R-3.2, R-6.1, OQ-3, CONTRACT-REC §3–§4 |
| Central intent classification (kind from disclosure; D5 confidence) | OQ-4, OQ-12 |
| OQ-3 sufficiency checks; privacy screen | OQ-3, DEC-003 §6 |
| Business-identity validation / normalization of source-supplied domain | OQ-7 |
| Opportunity transformation via the existing pipeline | OQ-9, E1 |
| Qualification concepts (intent qualification; existing Research / D3 / D4; decay) | OQ-6, OQ-9, D3, D4 |
| Deduplication as already governed (append-only evidence; client-level consolidation; in-batch dedup) | OQ-5, OD-12 |
| Source abstraction / provider-neutral core; multi-adapter support | R-4.1–R-4.3, R-13.9–R-13.12, R-13.24–R-13.26 |
| Approval boundaries | OQ-10 |
| Provider adapter contract at the conceptual level (§6) | R-4.2, R-13.11 |

| Provider-dependent (requires an authorized source / provider) | Basis |
|---|---|
| Retrieving live source signals; live ingestion | R-5.1, R-9.1 items 2, 6, 7 |
| Authentication; credentials / keys | R-9.1 item 3 |
| Provider-specific API / feed access and limits | R-4.2, R-9.1 item 2 |
| Provider-specific attribution / display obligations | OQ-8 (per provider) |
| Provider-specific retention / deletion handling | OQ-8 (per provider); R-6.2 |
| Mapping a provider's results to a source family | OQ-12 item 2 |
| Provider-specific freshness (expressed / observed time) | OQ-6 item 4 |
| Provider-specific validation | R-9.1 item 9 |

"Provider-independent" means only that live provider access is not a prerequisite. Implementing any of these items
still requires separate implementation authorization (R-9.2; R-13.13), and testing still requires validation
authorization.

## §9 Remaining decisions (unresolved; unranked; not answered here)

| ID | Decision | Related | Affects |
|---|---|---|---|
| PD-1 | Whether to authorize implementation of any part of the provider-neutral core (and its scope) | R-9.2; R-13.13 | Core |
| PD-2 | How the three evidence classes, especially inferred business need, are represented relative to the existing signal kinds | AMD1-DEP-3; OQ-3; OQ-12 | Core |
| PD-3 | Whether a defined service-category vocabulary / requested-service matching beyond D3 is required | OQ-3 limitation; R-1.3 | Core |
| PD-4 | Whether any business-identification capability beyond source-supplied domain is wanted. This would require a separate record and could not reopen OQ-7 implicitly. | OQ-7; OQ-11 | Core |
| PD-5 | How signals from pull-style sources are bound to a user's Search | OQ-9 limitation; GA-Q12; IG-5 | Core / provider |
| PD-6 | Whether "expressed" vs "observed" time must be distinguished | R-3.1; OQ-6 limitation | Core |
| PD-7 | Whether and when search intent can contribute to an opportunity | AMD1-DEP-2; OQ-3 | Core |
| PD-8 | Whether a new source family is needed for professional / social or marketplace / RFP sources | OQ-12 item 2; C-1 | Provider-specific |
| PD-9 | Which provider(s), if any, to authorize under R-9.1 (selection ≠ authorization) | OQ-1; R-9.1 | Provider-specific |
| PD-10 | Google Ads disposition | GA-Q0..GA-Q15 | Provider-specific |
| PD-11 | Reconciling provider retention terms with R-6.1 provenance and OQ-6 "evidence never deleted" | OQ-8; R-6.1; OQ-6 | Provider-specific |
| PD-12 | Persistence-level / replay deduplication | OQ-5; OD-12; C-6 | Core (accepted limitation today) |

## §10 Remaining evidence gaps

Not filled here:

1. Every R-2B.1 item for Google Search Console, Reddit, Anthropic / Claude, Microsoft / Bing, marketplaces / RFP,
   public web / community and other providers (PROVIDER-FINALIZATION-DEC-001 §7).
2. Google Search: any route supplying business-attributable need statements; access for new customers.
3. OpenAI: Terms (X1); ads pages (X2, X3).
4. LinkedIn: lead-response retention under S14; Marketing API terms; eligibility.
5. Google Ads: quotas, pricing, lead-data retention; GA-Q0.
6. All providers: pricing / quotas (except S1), retention compatibility with provenance, and whether business website
   identity is supplied (OQ-7 limitation).
7. SESSION-PREP-001 §5 conflicts C-1, C-2, C-3, C-4, C-6 and C-8 (carried forward, unresolved).

## §11 Blockers

A provider being unavailable is **not** listed as a core blocker. The core does not depend on any single provider
(R-13.12, R-13.24).

| Blocker | Provider-neutral core affected? | Provider-specific? | Existing decision? | Additional PO decision needed? | Execution authority needed? |
|---|---|---|---|---|---|
| No implementation authorization for the core | Yes | No | No (R-9.2; R-13.13 grant none) | Yes (PD-1) | Yes — implementation |
| No validation authority (testing) | Yes | No | No | Yes | Yes — validation |
| Inferred-business-need representation undecided | Yes | No | Partial (OQ-3 excludes it as evidence) | Yes (PD-2) | Yes, once decided |
| Pull-source Search binding undecided | Yes (for pull sources) | Partly | No (OQ-9 limitation) | Yes (PD-5) | Yes |
| Expressed vs observed time | Partly (R-3.1 completeness) | Partly | No (OQ-6 limitation) | Yes (PD-6) | Yes |
| Service-category matching beyond D3 | Partly; D3 path exists | No | D3 exists; beyond D3 not decided | Yes (PD-3) | Yes |
| No authorized source for live signals | No (core can be defined without it) | Yes | OQ-1 = consideration only | Yes (PD-9) | Yes — provider access, credentials, calls, wiring |
| No source family for professional / social / marketplace | No | Yes | OQ-12 (requires separate decision) | Yes (PD-8) | Yes |
| Google Ads GA-Q0 pending | No | Yes | GA-REQ PENDING | Yes (PD-10) | Yes |
| Provider retention vs provenance | No | Yes | OQ-8 statuses adopted; reconciliation not decided | Yes (PD-11) | — |
| Outreach approval gate (C-5) not enforceable; PHASE_22 / PHASE_23 status | Outreach stage only | No | OQ-10 DECIDED (policy) | Resolution of C-2 / C-4 | Yes — outreach / contact |
| Replay / persistence duplicates | No (accepted limitation) | No | OD-12 accepted | Optional (PD-12) | Yes, if pursued |
| Clients without a usable website cannot be ingested | No (coverage limitation) | Evidence-dependent | OQ-7 DECIDED | Only via a separate record (PD-4) | — |

## §12 Execution authority state

```text
Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Production provider access: NONE
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

Providers authorized by this record: NONE. Provider selection: UNCHANGED. OQ-1 / OQ-2 / OQ-8: UNCHANGED.

## §13 Verification

**Pre-write:** see §1. Canonical sha256 computed `ccf88646…`; all §2 record hashes recomputed and equal to the
values listed; 0 staged files.

**Execution counters (this record):**

```text
Files created: 1 (this record)
Existing records modified: 0
Canonical requirement modified: 0
Production code changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Provider calls: 0
External HTTP requests: 0
Credentials used: 0
Database connections: 0
Database writes: 0
Runtime wiring changes: 0
Scraping/browser automation: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
Pushes: 0
```

Post-write verification results are reported with the task output and are not recorded here, to avoid the record
referencing its own hash.
