# CLIENT INTENT DISCOVERY — CODE-GAP QUESTIONS — PRODUCT OWNER DECISION QUESTIONNAIRE

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-QUESTIONNAIRE-001
**Date:** 2026-10-01
**Type:** Product Owner **decision questionnaire** (governance preparation). Not a decision record, not an
implementation plan, not an implementation authorization.
**Prepared from:** CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-PREP-001 (`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_PO_DECISION_PREPARATION.md`,
"PREP-001") and CLIENT-INTENT-DISCOVERY-CODE-GAP-AUDIT-001 (`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_AUDIT.md`,
"AUDIT-001"). Neither record is modified.
**Author role:** governance recorder.

> **This questionnaire answers, recommends, ranks, scores and selects nothing, and infers no Product Owner preference.
> Every question is PENDING. Alternatives are reproduced from PREP-001 in its presentational order, which carries no
> priority.**

Labels used throughout:

- **AUDIT FINDING** — quoted verbatim from AUDIT-001 §9.
- **AUDIT INTERPRETATION** — a reading offered by AUDIT-001 or PREP-001; not a fact and not a decision.
- **ESTABLISHED FACT** — repository code or record text, as cited in AUDIT-001 / PREP-001.
- **GOVERNANCE** — quoted verbatim from an existing decision / requirement record.
- **IMPLEMENTATION-RECORD STATEMENT** — quoted from ADAPTER-REC or CONTRACT-REC; its governance status is not decided
  here.
- **EVIDENCE GAP** — not establishable from the repository.
- **ALTERNATIVE** — a possible Product Owner answer, unranked.

---

## §1 Scope and source integrity (verified before writing)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty; code = HEAD, identical to the AUDIT-001 and PREP-001 baseline) |
| Target file / record ID pre-existence | Neither existed (checked by path and search of `requirement/`) |
| Task type | **READ-ONLY governance preparation.** One new record created; no existing file modified. |

| Record | ID | sha256 (verified) |
|---|---|---|
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | CLIENT-INTENT-DISCOVERY-REQ-001 (**canonical**, post-Amendment-2) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| `CLIENT_INTENT_DISCOVERY_CODE_GAP_AUDIT.md` | CLIENT-INTENT-DISCOVERY-CODE-GAP-AUDIT-001 | `803e25b83ac460c42cd275ddb285fe44ae010871c83b6e28234822d4188b157b` |
| `CLIENT_INTENT_DISCOVERY_CODE_GAP_PO_DECISION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-PREP-001 | `5d7efc67dfc10788a227e4abe82ebd236d595ead6bf3232777ebd721d97d430a` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md` | READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| `CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md` | OQ-1-2-8-PO-DEC-001 | `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | PROVIDER-EVIDENCE-001 | `2387838ff125c35a8f6bf19e88eab4e8f91ef43a5665aecd2c0d18ad7be31647` |
| `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | INTENT-INTAKE-PO-DEC-001 (D1–D5) | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | INTENT-INTAKE-PO-DEC-003 (DEC-003) | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-ADAPTER-IMPL-REC-001 (ADAPTER-REC) | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 (CONTRACT-REC) | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | GA-REQ | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |

All governing-record hashes equal those recorded in PREP-001 §2. The verbatim quotations below were re-checked against
DEC-003, CONTRACT-REC, ADAPTER-REC, PROVIDER-EVIDENCE-001, OQ-1-2-8-PO-DEC-001 and READINESS-001 before writing.

## §2 Decision protocol

1. **Product Owner decisions only.** Only the Product Owner may answer a question in this record. An answer is recorded
   only in a separate Product Owner decision record that cites this questionnaire; this record is not edited to hold
   answers.
2. **No analyst recommendation.** Nothing in this record recommends an answer.
3. **No ranking.** Alternatives are listed in PREP-001's presentational order; order, labelling (A, B, C …) and position
   carry no priority, preference or weight.
4. **No default answer.** No alternative applies by default, by silence or by elapsed time. Where an alternative is
   annotated "(the current code behavior)" or "(current code behavior)", that annotation is an ESTABLISHED FACT about
   HEAD, reproduced from PREP-001; it does not make the alternative a default.
5. **Unanswered questions remain PENDING.** A partially answered question remains PENDING for its unanswered part.
6. **No reopening.** OQ-1..OQ-12, D1–D5, E1/E2, DEC-003, OD-1..OD-13, Option B, Alternative I, X1, C-1, GA-REQ /
   GA-Q0..GA-Q15, Amendment 2 and READINESS-001 PD-1..PD-12 are cited as they stand; none is reopened, amended,
   superseded or reinterpreted. An answer that would require reopening one of them is outside this questionnaire.
7. **Answer ≠ authorization.** Selecting an answer does not itself authorize implementation, schema / migration change,
   provider access, provider calls, runtime wiring, validation, outreach or deployment. Each requires its own separate
   authorization (§11).
8. **Implementation facts are not decisions.** Code behavior at HEAD and statements in ADAPTER-REC / CONTRACT-REC are
   presented as facts / implementation-record statements; this record does not elevate either to governance.

---

## §3 K-1 questionnaire — personal data inside public quotes / free-text evidence

### Question (verbatim, PREP-001 §4)

> How must personal data (e.g. a person's email, phone or name) appearing **inside** a public verbatim quote or other
> free-text evidence field be treated under the existing privacy boundary?

### Documented evidence

**GOVERNANCE — DEC-003 §6 (verbatim):** "no personal email / phone harvesting; no inference that a named individual uses
an AI platform; no consumer-level behavioural surveillance."

**IMPLEMENTATION-RECORD STATEMENT — CONTRACT-REC §6 item 4 (§6.4, verbatim):** "**Privacy screen limits.** Free-text
fields are not PII-scanned (a public RFP body may quote a business contact email; tested as accepted). A phone number
supplied as a bare digit string under a neutral key cannot be told apart from a numeric identifier; only phone-named
keys and `tel:` references are rejected."

**IMPLEMENTATION-RECORD STATEMENT — CONTRACT-REC §3 (verbatim):** "any string outside the free-text fields (`title`,
`snippet`, `body`, `statement`, `evidence`, `basis`) that is an email address or a `mailto:` / `tel:` / `sms:` reference
is rejected"; "Violations are **rejected, never stripped**."

**AUDIT FINDING — AUDIT-001 §9 K-1 (verbatim):** "Free-text quotes are exempt from personal-identifier screening and are
persisted verbatim as `source_quote` … Whether persisting a public quote that contains a personal identifier is
"harvesting" is not established by any record (G-P1)." AUDIT-001 §4 row 14 status: "NOT ESTABLISHED — free-text fields
are explicitly exempt from the personal-identifier check".

**ESTABLISHED FACTS — code behavior recorded by the audit (AUDIT-001 E9, E2, E6):**
- `intentSourceProviderContract.ts:271–272`: `FREE_TEXT_KEYS = ['title', 'snippet', 'body', 'statement', 'evidence',
  'basis']` — "Free-text fields may quote a business contact"; `:278–295`: identifier check skipped for these keys;
  `:297–303`: personal email / phone rejected in identifier fields only.
- `intentSignal.ts:347` and `pgRepository.ts:103`: the quote is persisted as `source_quote`.

**Other governance cited by PREP-001 §4 (verbatim, not reinterpreted):** REQ-001 R-3A.3 (Amendment 1 "does not
authorize: … personal emails or phone numbers; … or inference about named individuals where prohibited by existing
governance"); REQ-001 R-13.21 (Amendment 2 does not require "private email addresses; private phone numbers; … or
identity resolution from prohibited / private data"); OQ-3 item 1 (verbatim statement requirement) and item 4 ("the
item passes the existing privacy screen (DEC-003 §6; CONTRACT-REC §3)").

**Unresolved issues (not resolved here):** (a) whether retaining a verbatim public quote containing a personal
identifier is "harvesting" under DEC-003 §6 — no record defines it; (b) whether CONTRACT-REC's "rejected, never
stripped" is a governing rule or an implementation choice (PREP-001 §11 items 1–2).

### Alternatives (unranked; reproduced verbatim from PREP-001 §4)

- [ ] **K1-A** — Free-text quotes containing personal identifiers are accepted as-is (the current code behavior).
- [ ] **K1-B** — An evidence item whose free-text quote contains a personal contact identifier is rejected.
- [ ] **K1-C** — Personal identifiers are removed / masked from the quote before persistence (interacts with OQ-3 item 1,
  R-3.2 and "rejected, never stripped").
- [ ] **K1-D** — Distinguish by identifier type (e.g. business vs personal contact) under a rule the Product Owner
  defines.
- [ ] **K1-E** — Other (Product Owner specifies).

Product Owner specification (K1-D / K1-E only): NONE

`Product Owner answer: NONE`

---

## §4 K-2 questionnaire — source-assigned service-category field vs prohibited classification

### Question (verbatim, PREP-001 §5)

> Does a source / provider assigning the service-category field constitute the "source-assigned … classification" that
> existing governance rejects, or is it permitted source-supplied mapping?

### Source-set service-category behavior (ESTABLISHED FACTS, AUDIT-001 E1, E10)

- `intentSignal.ts:36–43`: six `INTENT_SIGNAL_FIELDS` — `statedRequirement`, `requestedWebsite`, `requestedMobileApp`,
  `requestedRedesign`, `requestedDevelopment`, `requestedFeature`.
- `intentSourceProviderContract.ts:91–94`: `ProviderIntentEvidence.requirement: IntentSignalField` is part of the
  provider result; `:331–335` rejects values outside the six.

### Existing classification restrictions in code (ESTABLISHED FACTS, AUDIT-001 E4, E9, E18)

- `intentSignal.ts:262–270`, `intentSource.ts:202`, `intentSourceProviderContract.ts:270`: the keys `kind`,
  `confidence`, `classification` are rejected when source-supplied; `requirement` / `field` is not among them.
- `intentSignal.ts:343`: system-assigned `classification: 'OBSERVED'`.
- `offer.ts:76–87`: offer matching uses signal **kind** and keyword text, not `field`.

### Audit interpretation

**AUDIT FINDING — AUDIT-001 §9 K-2 (verbatim):** "The service-category `field` (`requirement`) is supplied by the
provider result / adapter … Code's "classification" means OBSERVED / INFERRED; governance does not state whether a
source-assigned requirement field falls under "classification". Ambiguity only."

The statement that code's "classification" means OBSERVED / INFERRED describes the code's usage; it is not a governance
definition of the term.

### Relevant governance wording (verbatim)

- REQ-001 R-3.3: "the existing intake rules derive kind and confidence centrally and reject source-assigned kind /
  confidence / classification (INTENT-SOURCE-ADAPTER-IMPL-REC-001; PO-DEC-001 D5)".
- OQ-4: "Intent confidence is determined **centrally by the system, never by a provider or source** … Any
  provider-supplied confidence, kind or classification is rejected, as today."
- PO-DEC-001 D5: "`PUBLIC_INTENT = 70`, `FIRST_PARTY = 90` (OBSERVED; not caller-overridable)".
- OQ-3 "Unresolved limitations": "How "requested service" is matched against user-defined offerings (R-1.3) beyond D3
  is not decided here."

**Unresolved issue (not resolved here):** none of R-3.3, OQ-4 or D5 defines "classification". Any reading of that term
belongs in a Product Owner record and is not a reinterpretation of OQ-4 / D5 made here (PREP-001 §5, §11 item 3).

### Alternatives (unranked; reproduced verbatim from PREP-001 §5)

- [ ] **K2-A** — The service-category field is not "classification" under R-3.3 / OQ-4; sources may continue to supply it
  from the closed vocabulary (current code behavior).
- [ ] **K2-B** — The field is treated as classification and must be assigned centrally by the system (depends on PD-3).
- [ ] **K2-C** — The source proposes a field and the core validates or overrides it under a central rule (depends on
  PD-3).
- [ ] **K2-D** — Other (Product Owner specifies).

Product Owner specification (K2-D only): NONE

`Product Owner answer: NONE`

---

## §5 K-4 questionnaire — hiring / technology-migration / company-announcement notices

### Question (verbatim, PREP-001 §6)

> When a hiring, technology-migration or company-announcement notice is the source, may the resulting evidence be
> treated as published / self-declared client intent, or only as inferred business need (or does it depend on criteria
> the Product Owner defines)?

### Documented source types (ESTABLISHED FACTS, AUDIT-001 E3)

- `intentSource.ts:40–60`: `HIRING_SIGNAL` and `TECHNOLOGY_MIGRATION` are types in both `PUBLIC_WEB_SEARCH` and
  `PUBLIC_INTENT_NOTICE`; `COMPANY_ANNOUNCEMENT` is a `PUBLIC_INTENT_NOTICE` type.

### Current signal-generation behavior (ESTABLISHED FACTS, AUDIT-001 E3, E10)

- `intentSource.ts:78–82`: both families permit only `PUBLISHED` disclosure, which maps to `PUBLIC_INTENT` (`:73–76`).
- `intentSourceProviderContract.ts:348–354`, `:538–541`: each evidence item must appear verbatim in the notice text and
  use one of the six fields.
- No code representation of "inferred business need" exists (AUDIT-001 §4 row 11).

### Audit interpretation

**AUDIT FINDING — AUDIT-001 §9 K-4 (verbatim):** "HIRING_SIGNAL / TECHNOLOGY_MIGRATION / COMPANY_ANNOUNCEMENT types
produce `PUBLIC_INTENT` signals when a verbatim statement exists … The code distinguishes only by the verbatim-evidence
requirement; whether these types carry client intent or inferred need depends on the statement, not the type. No record
classifies them (PD-2 related)."

**AUDIT INTERPRETATION:** "depends on the statement, not the type" is an audit reading, not an established fact, and is
not adopted here (PREP-001 §6, §11 item 4).

### Existing intent / inferred-business-need distinctions (GOVERNANCE, verbatim)

- REQ-001 §3A, Inferred Business Need: "The system infers that an organization may need a service based on observable
  facts." … "System inference; must **not** automatically be treated as explicit client intent."
- REQ-001 R-3A.1: "The product must preserve the distinction between **observed evidence** and **system inference**, and
  must not relabel one concept as another."
- OQ-3 item 1: "the item contains a statement, expressed by the potential client, of a current need for a service; the
  statement appears verbatim in the source evidence (no inferred, summarized or model-generated need counts as
  evidence)."
- REQ-001 R-13.4: the three evidence classes "must **not** be treated as equivalent, merged or relabelled (R-3A.1)".

This record does not decide whether these notices constitute client intent, inferred business need, or neither.

### Alternatives (unranked; reproduced verbatim from PREP-001 §6)

- [ ] **K4-A** — Such notices may yield published client intent whenever all OQ-3 conditions hold (current code
  behavior).
- [ ] **K4-B** — Such notices are inferred business need only and must not yield `PUBLIC_INTENT` (depends on PD-2).
- [ ] **K4-C** — Treatment differs by type (e.g. some types client intent, others inferred need), as the Product Owner
  specifies.
- [ ] **K4-D** — Additional criteria (beyond OQ-3) must be met for these types to count as client intent, as the Product
  Owner specifies.
- [ ] **K4-E** — Other (Product Owner specifies).

Product Owner specification (K4-C / K4-D / K4-E only): NONE

`Product Owner answer: NONE`

---

## §6 K-5 questionnaire — existing RFP / project-request / procurement / project-posting types vs PD-8

### Question (verbatim, PREP-001 §7)

> For readiness scope, are marketplace / freelance / RFP / tender / project-request sources to be regarded as candidates
> for the existing `PUBLIC_WEB_SEARCH` / `PUBLIC_INTENT_NOTICE` types (subject to per-provider mapping), or does the
> Product Owner require a separate family decision for them?

### Documented evidence

**ESTABLISHED FACTS — existing source families and types (AUDIT-001 E3):**

| Type | Existing family | Citation |
|---|---|---|
| `RFP_NOTICE` (RFP) | `PUBLIC_INTENT_NOTICE` | `intentSource.ts:53–59` |
| `PROJECT_REQUEST` (project request) | `PUBLIC_INTENT_NOTICE` | `intentSource.ts:53–59` |
| `PROCUREMENT_NOTICE` (procurement) | `PUBLIC_WEB_SEARCH` | `intentSource.ts:42–49` |
| `PROJECT_POSTING` (project posting) | `PUBLIC_WEB_SEARCH` | `intentSource.ts:42–49` |

- Three families exist (`PUBLIC_WEB_SEARCH`, `AI_PLATFORM_ACQUISITION`, `PUBLIC_INTENT_NOTICE`); no professional /
  social family exists (`intentSource.ts:40–60`).

**PD-8 (READINESS-001 §9, verbatim, PENDING):** "Whether a new source family is needed for professional / social or
marketplace / RFP sources".

**GOVERNANCE (verbatim):**
- OQ-12 item 2: "**Mapping is per provider.** Each provider integration's own provider-specific requirement and
  authorization states which existing family and source type its results map to. Where no existing family fits (e.g.
  there is currently none for professional / social platforms), a new family requires its own separate decision; none
  is created here."
- REQ-001 R-13.6: category "E. Marketplaces / freelance / RFP / project-request sources".
- REQ-001 R-13.19: "No named marketplace, RFP / tender source or other provider is approved, selected or stated to be
  technically available by this section."

**AUDIT FINDING — AUDIT-001 §9 K-5 (verbatim):** "RFP / project-request / procurement / project-posting types already
exist within existing families … Not a governance conflict (OQ-12 item 2 maps per provider); READINESS-001's framing is
narrower than the code facts."

**AUDIT INTERPRETATION — AUDIT-001 §10 (verbatim):** "READINESS-001 PD-8 (new source family) is narrowed by K-5: RFP /
project-request types exist; a professional / social family does not."

**Unresolved issue (not resolved here):** whether READINESS-001 PD-8 is to be read as narrowed to professional / social
is not decided; READINESS-001 is not edited (PREP-001 §11 item 5). Per OQ-12 item 2, whether any specific provider fits
an existing family is decided in that provider's own record; no answer here can decide any provider's mapping.

### Alternatives (unranked; reproduced verbatim from PREP-001 §7)

- [ ] **K5-A** — Treat marketplace / RFP / project-request sources as covered by existing types, leaving each provider's
  mapping to its own record (OQ-12 item 2); PD-8 then concerns professional / social only.
- [ ] **K5-B** — Require a separate family decision for marketplace / freelance sources regardless of existing types.
- [ ] **K5-C** — Make no generic determination; address each source only in its provider-specific record.
- [ ] **K5-D** — Other (Product Owner specifies).

Product Owner specification (K5-D only): NONE

`Product Owner answer: NONE`

---

## §7 K-6/A1 questionnaire — LinkedIn own-form responses

### Question (verbatim, PREP-001 §8)

> May responses to the product owner's own LinkedIn lead forms be treated as `SUPPLIED_TO_US` (→ `FIRST_PARTY`)
> evidence, as `PUBLISHED` evidence, or as neither?

### What the repository establishes

**ESTABLISHED FACTS (code, AUDIT-001 E3; PREP-001 §8):**
- No LinkedIn intent family, type or adapter exists (`intentSource.ts:40–60`). `LINKEDIN` exists only as an ordinary
  research-source kind with lead-score weight 12 (`scoring.ts:50`).
- `intentSource.ts:78–82`: `SUPPLIED_TO_US` is permitted only for `AI_PLATFORM_ACQUISITION`.
- `intentSignal.ts:319–333`: every `FIRST_PARTY` signal, whatever family, requires validated authorization evidence
  (OD-7).

**ESTABLISHED FACTS (records, verbatim):**
- PROVIDER-EVIDENCE-001 §7: Lead Sync "returns responses to Lead Gen Forms **owned by** the organization or sponsored
  account (`owner`)"; restricted uses: member data "**must not be used for advertising, sales or recruiting use cases,
  including to identify sales or marketing prospects or to create leads**".
- OQ-1-2-8-PO-DEC-001 §3: LinkedIn "NOT ESTABLISHED for third-party intent; partial: own lead-form responses only".

**GOVERNANCE (verbatim):**
- OQ-12 item 3: "**Signal kind continues to derive from disclosure** … PUBLISHED → PUBLIC_INTENT; SUPPLIED_TO_US →
  FIRST_PARTY, and any FIRST_PARTY path is governed by OD-1 to OD-13, Option B, Alternative I, X1 and C-1 unchanged
  (R-8.2)."
- OQ-12 item 2 (quoted in §6): mapping is per provider; no professional / social family exists.
- DEC-003 answer 7: "Same rule for all AI-platform sources." Answer 8: "this decision applies only to FIRST_PARTY;
  PUBLIC_INTENT is unaffected."
- OQ-11 item 1: a potential client "must be an identifiable **organization or business**".
- REQ-001 R-8.2: "If a future provider under this requirement would supply FIRST_PARTY signals, the existing OD-1..OD-13
  rules govern that path unchanged."

### What the audit and readiness records interpreted

- **AUDIT FINDING — AUDIT-001 §9 K-6 (verbatim):** "A1: LinkedIn own-form responses as SUPPLIED_TO_US … No LinkedIn
  intent code … Remains an analyst interpretation; code neither supports nor contradicts it."
- **AUDIT INTERPRETATION — origin of A1, READINESS-001 §7 LinkedIn row (verbatim):** "Own-form responses are
  SUPPLIED_TO_US (OQ-12) → OD-13 path". This is an analyst interpretation, not a decided fact, and is not adopted here.
- **Unresolved repository-governance issue:** DEC-003's authorization-basis answers are stated for AI-platform sources;
  the code enforces authorization evidence for every FIRST_PARTY signal; no record states which authorization basis
  applies to a non-AI-platform FIRST_PARTY source (PREP-001 §8, §11 item 6).

### What remains dependent on external LinkedIn evidence

- **EVIDENCE GAP (external) — PROVIDER-EVIDENCE-001 §7 (verbatim):** "Not established: whether lead-form responses fall
  under S14's member-data storage limits". Whether LinkedIn's restricted-use terms and storage limits apply to lead-form
  responses cannot be established from the repository.
- **Not researched.** No LinkedIn documentation was consulted for this record; LinkedIn research requires separate
  authorization. The policy interpretations below can be presented without it; their feasibility consequences cannot be
  assessed until the gap is closed.

### Possible policy interpretations (unranked; reproduced verbatim from PREP-001 §8)

- [ ] **K6-A** — Own-form responses are `SUPPLIED_TO_US` (FIRST_PARTY), governed by OD-1..OD-13 (requires a family
  decision, PD-8, and an authorization basis for a non-AI-platform source).
- [ ] **K6-B** — Own-form responses are not intent-source evidence for Client Intent Discovery.
- [ ] **K6-C** — No classification until LinkedIn-specific evidence (S14 applicability) is recorded.
- [ ] **K6-D** — Other (Product Owner specifies).

The question also names `PUBLISHED` as a possible treatment; PREP-001 lists no separate alternative for it, and none is
added here. It is available to the Product Owner only through K6-D.

Product Owner specification (K6-D only): NONE

`Product Owner answer: NONE`

---

## §8 K-7 questionnaire — meaning of "system capture time"

### Question (verbatim, PREP-001 §9)

> Does "system capture time" (CONTRACT-REC §3–§4, cited by OQ-8 and OQ-PO-DEC-001) mean database insertion time, the
> integration's / source's capture time, or both — and is the implementation-record definition to be adopted as the
> governing definition?

### Apparent conflict (recorded exactly; not resolved)

| Source | Statement (verbatim) | Record type |
|---|---|---|
| AUDIT-001 §9 K-7 | "`capturedAt` is validated but not persisted; persisted capture time is the database `created_at` … Consistent only if "system capture time" means DB insertion time; not stated." | Read-only audit record |
| ADAPTER-REC §5 (Provenance table) | "\| capturedAt \| yes \| not stored as supplied; `research_signals.created_at` is the system's capture time \|" | Implementation record |
| CONTRACT-REC §4 (Provenance table) | "\| capture time \| yes (`provenance.capturedAt`) \| not stored as supplied; `research_signals.created_at` is the system's capture time (as REC-001 §5) \|" | Implementation record |
| CONTRACT-REC §4 (text) | "The persisted chain (label, URL, quote, observed time, system capture time) is the one REC-001 already accepted." | Implementation record |

AUDIT-001 states the meaning is "not stated"; ADAPTER-REC §5 and CONTRACT-REC §4 state that `research_signals.created_at`
is "the system's capture time". This record does **not** decide whether the ADAPTER-REC / CONTRACT-REC statements are
binding governance, does not treat them as overriding AUDIT-001, and does not amend AUDIT-001, ADAPTER-REC or
CONTRACT-REC. No decision record establishes the governance status of either implementation-record statement
(PREP-001 §9, §11 item 7).

### Related established facts and governance

- **ESTABLISHED FACTS:** `intentSource.ts:29–33`: "externalId, capturedAt and context live on the normalized event only —
  no schema change." `intentIntake.ts:29–30` (header): "each with its source event's own observedAt (created_at stays
  the database's capture time)".
- **IMPLEMENTATION-RECORD STATEMENT — CONTRACT-REC §6 item 3 (verbatim):** "Provider `capturedAt`, `externalId`,
  provider provenance, publication and authorization metadata live on the normalized event / outcome only. Persisting
  them needs a schema change and is not authorized."
- **GOVERNANCE (verbatim):** OQ-PO-DEC-001 OQ-8: "CONTRACT-REC §3–§4 (privacy screen; persisted provenance limited to
  label, URL, quote, observed time, system capture time)". OQ-6 item 1: "Intent age is measured from the signal's
  **observed time** (`observedAt`) as supplied with the source evidence." REQ-001 R-3.1: "Timestamp / freshness — When
  the need was expressed and when it was observed". REQ-001 R-6.2: provenance storage schema is not decided by REQ-001.

### Possible Product Owner choices (unranked)

**Part 1 — meaning** (reproduced verbatim from PREP-001 §9):

- [ ] **K7-A** — "System capture time" means database insertion time (`research_signals.created_at`), as stated in
  ADAPTER-REC §5 / CONTRACT-REC §4.
- [ ] **K7-B** — It means the integration's / source's capture time, which would then need to be persisted (schema
  change; separate authorization).
- [ ] **K7-C** — Both are required, each with its own meaning.
- [ ] **K7-D** — Other (Product Owner specifies).

**Part 2 — governing status of the implementation-record definition** ("is the implementation-record definition to be
adopted as the governing definition?"): PREP-001 lists no separate alternatives for this part, and none are invented
here. It remains an open Product Owner question independent of the Part 1 selection; selecting K7-A does not by itself
answer Part 2.

Product Owner specification (K7-D only): NONE
Product Owner answer to Part 2: NONE

`Product Owner answer: NONE`

---

## §9 Cross-question dependency matrix

**Rules applied.** Only three values are used. `PENDING DEPENDENCY` — PREP-001 states a direct dependency on a
still-undecided item (PREP-001 §10 marks it `●`, or §4–§9 states "depends on" / "tied to"). `DECIDED DEPENDENCY` —
PREP-001 §10 lists the decided record as one the question touches (any answer operates within it; the record is not
reopened). `NO ESTABLISHED DEPENDENCY` — every other cell, including cells PREP-001 marks only `○` ("related /
indirect"); `○` relations are noted in the basis column but are not converted into dependencies. No dependency is
created here.

### 9.1 K-question × K-question

| | K-1 | K-2 | K-4 | K-5 | K-6/A1 | K-7 |
|---|---|---|---|---|---|---|
| **K-1** | — | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY |
| **K-2** | NO ESTABLISHED DEPENDENCY | — | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY |
| **K-4** | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | — | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY |
| **K-5** | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | — | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY |
| **K-6/A1** | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | — | NO ESTABLISHED DEPENDENCY |
| **K-7** | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | NO ESTABLISHED DEPENDENCY | — |

No record states a dependency between two K-questions. K-5 and K-6/A1 each have a pending dependency on PD-8 (§9.2);
a shared dependency is not recorded as a K-to-K dependency.

### 9.2 K-question × existing PD questions (READINESS-001 §9; all PD questions PENDING)

| K | PENDING DEPENDENCY | NO ESTABLISHED DEPENDENCY | Basis |
|---|---|---|---|
| K-1 | — | PD-1 … PD-12 | PREP-001 §10: PD-1 `○` only ("none depends on PD-1 to be decided"); no other PD marked. |
| K-2 | PD-3 | PD-1, PD-2, PD-4 … PD-12 | PREP-001 §5 "Tied to READINESS-001 **PD-3**"; K2-B / K2-C "depends on PD-3"; §10 `●`. PD-1 `○` only. |
| K-4 | PD-2 | PD-1, PD-3 … PD-12 | PREP-001 §6 "Depends on READINESS-001 **PD-2**"; §10 `●`. PD-1, PD-3, PD-7 `○` only. |
| K-5 | PD-8 | PD-1 … PD-7, PD-9 … PD-12 | PREP-001 §10 `●` for PD-8. PD-1 and PD-9 `○` only (§7 text: "Touches … **PD-9**"). |
| K-6/A1 | PD-8, PD-9 | PD-1 … PD-7, PD-10 … PD-12 | PREP-001 §10 `●` for PD-8 and PD-9; K6-A "requires a family decision, PD-8". PD-1 `○` only; PD-5 `○` only (conditional on a non-push route nobody has selected). |
| K-7 | — | PD-1 … PD-12 | PREP-001 §9: PD-6 "related … distinct from it (capture ≠ observed ≠ expressed)", `○` only; PD-1 `○` only. |

### 9.3 K-question × existing decided records (not reopened)

| K | DECIDED DEPENDENCY | NO ESTABLISHED DEPENDENCY (among the decided records listed in PREP-001 §10) |
|---|---|---|
| K-1 | DEC-003 §6; OQ-3 items 1, 4; OQ-11 | OQ-4; D5; OQ-6; OQ-8; OQ-12; DEC-003 answers 7–8; OD-1..OD-13; OQ-1-2-8-PO-DEC-001 §3 |
| K-2 | OQ-4; D5; OQ-3 (unresolved-limitation text) | DEC-003; OQ-6; OQ-8; OQ-11; OQ-12; OD-1..OD-13; OQ-1-2-8-PO-DEC-001 §3 |
| K-4 | OQ-3 item 1; OQ-12 item 3 | DEC-003; OQ-4; D5; OQ-6; OQ-8; OQ-11; OD-1..OD-13; OQ-1-2-8-PO-DEC-001 §3 |
| K-5 | OQ-12 item 2 | DEC-003; OQ-3; OQ-4; D5; OQ-6; OQ-8; OQ-11; OD-1..OD-13; OQ-1-2-8-PO-DEC-001 §3 |
| K-6/A1 | OQ-12 items 2–3; DEC-003 answers 7–8; OD-1..OD-13 (with Option B, Alternative I, X1, C-1 per OQ-12 item 3); OQ-11; OQ-1-2-8-PO-DEC-001 §3 | DEC-003 §6; OQ-3; OQ-4; D5; OQ-6; OQ-8 |
| K-7 | OQ-8 (OQ-PO-DEC-001); OQ-6 | DEC-003; OQ-3; OQ-4; D5; OQ-11; OQ-12; OD-1..OD-13; OQ-1-2-8-PO-DEC-001 §3 |

REQ-001 clauses cited per question (R-3.1, R-3.2, R-3.3, §3A, R-3A.1, R-3A.3, R-6.2, R-8.2, R-13.4, R-13.6, R-13.19,
R-13.21) are canonical-requirement text, not OQ decisions; they are quoted in §3–§8 and are not reinterpreted.

## §10 Evidence gaps (only those established by existing records)

| # | Question | Gap | Source of the gap statement | Type |
|---|---|---|---|---|
| EG-1 | K-1 | The proportion / kinds of personal data actually present in real source quotes (no live source exists). | PREP-001 §4 | Real-source data; not in repository |
| EG-2 | K-4 | The governance basis for including hiring / technology-migration / company-announcement types in intent families (the types predate Amendments 1 / 2). | PREP-001 §6 | Within repository records read |
| EG-3 | K-5 | Whether any real marketplace / RFP source's data fits the existing type shapes. | PREP-001 §7; READINESS-001 §10 | Provider evidence; not in repository |
| EG-4 | K-6/A1 | Which authorization basis applies to a non-AI-platform FIRST_PARTY source. | PREP-001 §8 | Repository governance |
| EG-5 | K-6/A1 | **LinkedIn:** "whether lead-form responses fall under S14's member-data storage limits" — NOT ESTABLISHED. | PROVIDER-EVIDENCE-001 §7; PREP-001 §8 | **External LinkedIn evidence; not researched; requires separate authorization** |

No evidence gap is established by the records for K-2 or K-7. The K-7 conflict (§8) is a question of governance status,
not of missing evidence. No gap above is filled from background knowledge.

## §11 Explicit non-authority

This questionnaire grants:

```text
Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Production provider access: NONE
Credential authorization: NONE
Database authority: NONE
Schema/migration authority: NONE
Runtime-wiring authorization: NONE
Integration naming authorization: NONE
Key-registration authority: NONE
Scraping/browser automation authorization: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
```

## §12 Execution counters (this record; verified after writing)

```text
Files created: 1 (this record)
Existing files modified: 0
Production files changed: 0
Test files changed: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Runtime wiring: 0
Scraping/browser automation: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
Pushes: 0
```

## Final state

```text
K-1: PENDING
K-2: PENDING
K-4: PENDING
K-5: PENDING
K-6/A1: PENDING
K-7: PENDING

Product Owner decisions recorded: NONE

Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Database authority: NONE
Runtime-wiring authorization: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
```
