# CLIENT INTENT DISCOVERY

## Code-Gap Questions K-1, K-2, K-4, K-5, K-6/A1, K-7 — Product Owner Decision (Questionnaire Answers)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001
**Date:** 2026-10-01
**Type:** Product Owner decision record (governance only). Not an implementation authorization.
**Source questionnaire:** CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-QUESTIONNAIRE-001
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_PO_QUESTIONNAIRE.md`, "QUESTIONNAIRE-001").
**Source preparation record:** CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-PREP-001
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_PO_DECISION_PREPARATION.md`, "PREP-001").
**Decision maker:** Claude Code acted as Product Owner for this decision round, under explicit delegation from the
repository owner in session on 2026-10-01. The delegation covers Product Owner decisions on K-1 to K-7 only and grants
no implementation authority.

> **These decisions authorize no implementation work.** No code, test, schema, migration, configuration, API, UI,
> provider integration or runtime wiring change follows from this record without a separate, explicit authorization.

> **No existing governing decision is reopened, amended, superseded or reinterpreted.** OQ-1..OQ-12, D1–D5, E1/E2,
> DEC-003, OD-1..OD-13, Option B, Alternative I, X1, C-1, GA-REQ / GA-Q0..GA-Q15, Amendment 2 and READINESS-001
> PD-1..PD-12 stand as recorded. No answer option was invented; every selection is an option listed in
> QUESTIONNAIRE-001 (or, for K-7 Part 2, a direct answer to the yes / no question QUESTIONNAIRE-001 poses).

---

## §1 Baseline (verified before deciding)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty; code = HEAD; equal to QUESTIONNAIRE-001 §1) |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md`; untracked records under `requirement/` only — as at QUESTIONNAIRE-001 creation |
| Target file / record ID pre-existence | Neither existed |

| Record | ID | sha256 (verified; unchanged) |
|---|---|---|
| `CLIENT_INTENT_DISCOVERY_CODE_GAP_PO_QUESTIONNAIRE.md` | QUESTIONNAIRE-001 | `a121911994ed695917bf2fcea726a236cb3434acec6f0b1692d3af21c6b20751` |
| `CLIENT_INTENT_DISCOVERY_CODE_GAP_PO_DECISION_PREPARATION.md` | PREP-001 | `5d7efc67dfc10788a227e4abe82ebd236d595ead6bf3232777ebd721d97d430a` |
| `CLIENT_INTENT_DISCOVERY_CODE_GAP_AUDIT.md` | CODE-GAP-AUDIT-001 | `803e25b83ac460c42cd275ddb285fe44ae010871c83b6e28234822d4188b157b` |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | REQ-001 (canonical, post-Amendment-2) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md` | READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| `CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md` | OQ-1-2-8-PO-DEC-001 | `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | PROVIDER-EVIDENCE-001 | `2387838ff125c35a8f6bf19e88eab4e8f91ef43a5665aecd2c0d18ad7be31647` |
| `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | PO-DEC-001 (D1–D5) | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | GA-REQ | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |

**Discrepancy noted (not corrected):** QUESTIONNAIRE-001 §9.3 (following PREP-001 §10) lists "OQ-8 (OQ-PO-DEC-001)" as
a DECIDED DEPENDENCY for K-7. OQ-PO-DEC-001 records OQ-8 itself as `PENDING — external/provider evidence required`
(Selected answer: NONE). What OQ-8 contains is a list of "Existing DECIDED constraints that apply to every provider
meanwhile (cited, not decided here)", which includes "CONTRACT-REC §3–§4 (privacy screen; persisted provenance limited to
label, URL, quote, observed time, system capture time)". The K-7 decision below relies only on that cited constraint,
not on OQ-8 being decided. Neither QUESTIONNAIRE-001 nor PREP-001 is edited.

**Method.** No provider call, external HTTP request or live research was performed. All evidence is repository code and
records as cited in CODE-GAP-AUDIT-001, PREP-001 and QUESTIONNAIRE-001, plus the decided texts of OQ-3, OQ-4, OQ-8,
OQ-11 and OQ-12 (OQ-PO-DEC-001 §2), REQ-001 R-3.3 and ADAPTER-REC (re-read for this round).

---

## §2 K-1 — Personal data inside public quotes / free-text evidence

**Question (QUESTIONNAIRE-001 §3, verbatim):** "How must personal data (e.g. a person's email, phone or name) appearing
**inside** a public verbatim quote or other free-text evidence field be treated under the existing privacy boundary?"

**Selected answer: K1-B** — An evidence item whose free-text quote contains a personal contact identifier is rejected.

**Rationale.**
- DEC-003 §6 (DECIDED) prohibits "personal email / phone harvesting"; OQ-11 (DECIDED) requires identity "not by personal
  identifiers"; REQ-001 R-3A.3 and R-13.21 exclude personal emails / phone numbers. Accepting such identifiers as-is
  (K1-A) would persist them verbatim as `source_quote` (CODE-GAP-AUDIT-001 E2, E6) with no governing basis.
- The free-text exemption is not a settled rule: CONTRACT-REC lists it under §6 "Known open questions", item 4
  ("**Privacy screen limits.**"). No governing record establishes it.
- K1-C would alter the verbatim statement, which OQ-3 item 1 (DECIDED) requires to appear "verbatim in the source
  evidence", and would depart from the existing reject-not-strip behavior (CONTRACT-REC §3). Selecting it would require
  reopening OQ-3.
- K1-D requires a Product Owner–defined business-vs-personal rule; the evidence to ground such a rule (EG-1: kinds and
  prevalence of personal data in real quotes) does not exist in the repository.
- K1-B maintains OQ-3 in full: the quote is never modified, and an item that fails the privacy condition is not a Client
  Intent Signal (OQ-3: "existing outcomes `NO_INTENT_EVIDENCE`, `UNATTRIBUTED` or `REJECTED` apply").

**Governing evidence:** DEC-003 §6; OQ-3 items 1 and 4; OQ-11 item 1; REQ-001 R-3A.3, R-13.21; CONTRACT-REC §3, §6 item 4;
CODE-GAP-AUDIT-001 §9 K-1, E9.

**Unresolved portions (preserved):**
1. K1-B applies to **personal contact identifiers** as worded (the personal email / phone that DEC-003 §6 names). Where
   a person's **name** appears in a quote, the K1-B wording does not cover it, and its treatment remains unresolved.
2. The boundary between a personal and a business contact identifier (for example, CONTRACT-REC §6.4's "business
   contact email" in a public RFP body) is not defined by this decision. K1-D was not selected, and EG-1 remains open.
3. How rejection is detected (including CONTRACT-REC §6.4's note on bare digit strings) is an implementation matter and
   is not authorized.

---

## §3 K-2 — Source-assigned service-category field vs prohibited classification

**Question (QUESTIONNAIRE-001 §4, verbatim):** "Does a source / provider assigning the service-category field
constitute the "source-assigned … classification" that existing governance rejects, or is it permitted source-supplied
mapping?"

**Selected answer: K2-A** — The service-category field is not "classification" under R-3.3 / OQ-4; sources may continue
to supply it from the closed vocabulary.

**Rationale.**
- REQ-001 R-3.3 (EXISTING DECISION) takes its rule from INTENT-SOURCE-ADAPTER-IMPL-REC-001 and PO-DEC-001 D5, which it
  cites by name. That cited source treats `classification` and `field` as distinct items:
  - ADAPTER-REC rejects "A source-assigned `kind`, `confidence` or `classification`" (rule 3).
  - It lists classification as a persisted `research_signals` value ("confidence, classification, kind").
  - It separately states that each source signal "carries disclosure, field, verbatim evidence, `sourceReference` and
    `observedAt`".
  - D5 ties classification to OBSERVED ("OBSERVED; not caller-overridable").
- Reading R-3.3 through the record it cites is not an adoption of ADAPTER-REC as a whole. It identifies the referent of
  a term in a decided clause.
- OQ-4 (DECIDED) concerns confidence; K2-A leaves confidence, kind and classification central and rejected when
  source-supplied, as today.
- The field is constrained to the closed six-value vocabulary (`intentSourceProviderContract.ts:331–335`). It does not
  drive kind, confidence or offer matching (`offer.ts:76–87`, CODE-GAP-AUDIT-001 E18).
- K2-B and K2-C each "depends on PD-3", which is PENDING; selecting either would require PD-3 to be decided first.

**Governing evidence:** REQ-001 R-3.3; OQ-4; PO-DEC-001 D5; ADAPTER-REC (rules 3, provenance table, signal contents);
CODE-GAP-AUDIT-001 §9 K-2, E1, E4, E10, E18.

**Unresolved portions (preserved):** READINESS-001 PD-3 (service-category vocabulary / requested-service matching beyond
D3) remains PENDING and is not decided by K2-A. OQ-3's limitation on matching beyond D3 is unchanged.

---

## §4 K-4 — Hiring / technology-migration / company-announcement notices

**Question (QUESTIONNAIRE-001 §5, verbatim):** "When a hiring, technology-migration or company-announcement notice is the
source, may the resulting evidence be treated as published / self-declared client intent, or only as inferred business
need (or does it depend on criteria the Product Owner defines)?"

**Selected answer: K4-A** — Such notices may yield published client intent whenever all OQ-3 conditions hold.

**Rationale.**
- OQ-3 (DECIDED) is the provider-neutral sufficiency rule. Its rationale is "Applying the same rule to every new source
  class keeps signal meaning provider-neutral".
- OQ-3 item 1 already excludes inference: the item must contain "a statement, expressed by the potential client, of a
  current need for a service … (no inferred, summarized or model-generated need counts as evidence)".
- A notice that only implies a need therefore fails item 1 and is not client intent. This preserves REQ-001 §3A
  ("must **not** automatically be treated as explicit client intent") and R-3A.1 / R-13.4 without any type-specific
  rule.
- OQ-12 item 3 (DECIDED) derives signal kind from disclosure, not from source class. K4-B ("must not yield
  `PUBLIC_INTENT`" by type) depends on PD-2, which is PENDING, and has no representation to land in (CODE-GAP-AUDIT-001
  §4 row 11).
- K4-C and K4-D each require Product Owner–specified criteria. No record supplies evidence for such criteria (EG-2).
- This decision rests on OQ-3. The audit interpretation "depends on the statement, not the type" is not adopted as a
  ruling in its own right.

**Governing evidence:** OQ-3 item 1 and rationale; OQ-12 item 3; REQ-001 §3A, R-3A.1, R-13.4; `intentSource.ts:40–82`;
`intentSourceProviderContract.ts:348–354`, `:538–541`; CODE-GAP-AUDIT-001 §9 K-4.

**Unresolved portions (preserved):**
- READINESS-001 PD-2 (representation of inferred business need) remains PENDING. Evidence from these notices that does
  not meet OQ-3 item 1 has no representation, and none is created.
- EG-2 is closed only prospectively: this record is now the Product Owner basis for these types yielding
  `PUBLIC_INTENT` under OQ-3. No historical basis is asserted.

---

## §5 K-5 — Existing RFP / project-request / procurement / project-posting types vs PD-8

**Question (QUESTIONNAIRE-001 §6, verbatim):** "For readiness scope, are marketplace / freelance / RFP / tender /
project-request sources to be regarded as candidates for the existing `PUBLIC_WEB_SEARCH` / `PUBLIC_INTENT_NOTICE` types
(subject to per-provider mapping), or does the Product Owner require a separate family decision for them?"

**Selected answer: K5-C** — Make no generic determination; address each source only in its provider-specific record.

**Rationale.**
- OQ-12 item 2 (DECIDED): "**Mapping is per provider.** Each provider integration's own provider-specific requirement and
  authorization states which existing family and source type its results map to."
- K5-A would declare these sources generically "covered by existing types". Whether any real marketplace / RFP source's
  data fits the existing type shapes is not established (EG-3; READINESS-001 §10).
- K5-B would require a new family "regardless of existing types". That goes beyond OQ-12 item 2, which conditions a new
  family on "Where no existing family fits".
- REQ-001 R-13.19 approves no marketplace or RFP / tender source. A generic determination would have no specific
  source to apply to.

**Governing evidence:** OQ-12 item 2; REQ-001 R-13.6, R-13.19; `intentSource.ts:42–59`; CODE-GAP-AUDIT-001 §9 K-5, §10;
READINESS-001 §9 PD-8, §10.

**Unresolved portions (preserved):** READINESS-001 PD-8 remains PENDING **as worded** ("professional / social or
marketplace / RFP sources"). The audit interpretation that PD-8 "is narrowed by K-5" is not adopted, and READINESS-001
is not edited. EG-3 remains open per source.

---

## §6 K-6/A1 — LinkedIn own-form responses

**Question (QUESTIONNAIRE-001 §7, verbatim):** "May responses to the product owner's own LinkedIn lead forms be treated
as `SUPPLIED_TO_US` (→ `FIRST_PARTY`) evidence, as `PUBLISHED` evidence, or as neither?"

**Selected answer: K6-C** — No classification until LinkedIn-specific evidence (S14 applicability) is recorded.

**Rationale.**
- PROVIDER-EVIDENCE-001 §7 records restricted uses for LinkedIn member data: "must not be used for advertising, sales
  or recruiting use cases, including to identify sales or marketing prospects or to create leads". It also records
  "Not established: whether lead-form responses fall under S14's member-data storage limits".
- Whether those terms bind own-form responses is therefore an open external fact (EG-5). It was not researched, and no
  research is authorized.
- K6-A depends on three things, none of which is in place:
  - PD-8 (no professional / social family; OQ-12 limitation "LinkedIn has no intent-source path") — PENDING.
  - PD-9 (provider authorization) — PENDING.
  - An authorization basis for a non-AI-platform FIRST_PARTY source, which no record states (EG-4).
- K6-B would rule permanently on a premise the record marks NOT ESTABLISHED.
- K6-C is the listed option that matches the documented evidence dependency.
- READINESS-001's A1 reading ("Own-form responses are SUPPLIED_TO_US") remains an analyst interpretation and is not
  adopted. `PUBLISHED` is not introduced as an option. K6-D is not used.

**Governing evidence:** PROVIDER-EVIDENCE-001 §7; OQ-1-2-8-PO-DEC-001 §3; OQ-12 items 2–3 and limitations; DEC-003
answers 7–8; OQ-11 item 1; REQ-001 R-8.2; `intentSource.ts:78–82`; `intentSignal.ts:319–333`; CODE-GAP-AUDIT-001 §9
K-6.

**Unresolved portions (preserved):**
- Whether own-form responses are `SUPPLIED_TO_US`, `PUBLISHED` or neither is **unresolved by design** until EG-5
  (S14 applicability) is recorded.
- Recording that evidence alone does not classify them. A further Product Owner decision is required.
- That decision is also subject to PD-8, PD-9 and EG-4, which remain open.

---

## §7 K-7 — Meaning of "system capture time"

**Question (QUESTIONNAIRE-001 §8, verbatim):** "Does "system capture time" (CONTRACT-REC §3–§4, cited by OQ-8 and
OQ-PO-DEC-001) mean database insertion time, the integration's / source's capture time, or both — and is the
implementation-record definition to be adopted as the governing definition?"

**Documented conflict (preserved, as recorded in QUESTIONNAIRE-001 §8):**
- CODE-GAP-AUDIT-001 §9 K-7 says the meaning is "not stated".
- ADAPTER-REC §5 and CONTRACT-REC §4 state that "`research_signals.created_at` is the system's capture time".

### Part 1 — meaning

**Selected answer: K7-A** — "System capture time" means database insertion time (`research_signals.created_at`), as
stated in ADAPTER-REC §5 / CONTRACT-REC §4.

### Part 2 — governing status of the implementation-record definition

**Answer: YES, limited.** The definition "`research_signals.created_at` is the system's capture time" (ADAPTER-REC §5;
CONTRACT-REC §4) is adopted as the governing definition of the term "system capture time".
- The adoption covers only that definition.
- No other statement in ADAPTER-REC or CONTRACT-REC is adopted or elevated by this answer.

**Rationale.**
- The only definition of the term anywhere in the repository is the one in ADAPTER-REC §5 and CONTRACT-REC §4. The two
  are mutually consistent, and the code agrees: `intentIntake.ts:29–30` reads "created_at stays the database's capture
  time".
- The integration's own timestamp is a distinct, named field. `capturedAt` is "When the integration captured the result"
  (`intentSourceProviderContract.ts:106–109`), and it is not persisted (`intentSource.ts:29–33`).
- OQ-PO-DEC-001 (a Product Owner record) already lists "CONTRACT-REC §3–§4 (privacy screen; persisted provenance limited
  to label, URL, quote, observed time, system capture time)" among the "Existing DECIDED constraints that apply to every
  provider meanwhile". OQ-3's evidence basis also cites CONTRACT-REC §3–§4.
- Adopting the definition that §4 itself gives is therefore consistent with existing Product Owner records. It is not a
  new elevation of an implementation statement, and QUESTIONNAIRE-001 explicitly asks for this determination.
- K7-B and K7-C would require persisting the integration's `capturedAt`. That needs a schema change (CONTRACT-REC §6
  item 3: "Persisting them needs a schema change and is not authorized"), and it would implicitly decide CONTRACT-REC
  §6.3, which OQ-8 leaves open.
- The CODE-GAP-AUDIT-001 statement "not stated" was accurate for the decision records at audit time. From this record
  onward, the definition is stated by a Product Owner decision. CODE-GAP-AUDIT-001 is not amended.

**Governing evidence:** ADAPTER-REC §5; CONTRACT-REC §4, §6 item 3; OQ-PO-DEC-001 OQ-8 (cited DECIDED constraints) and
OQ-3 evidence basis; `intentSource.ts:29–33`; `intentIntake.ts:29–30`; `intentSourceProviderContract.ts:106–109`;
CODE-GAP-AUDIT-001 §9 K-7.

**Unresolved portions (preserved):**
- The integration's / source's capture time (`capturedAt`) remains unpersisted, and its persistence remains an open
  question (CONTRACT-REC §6.3; OQ-8 limitation).
- READINESS-001 PD-6 (expressed vs observed time) is distinct from this question and remains PENDING. OQ-6 decay
  (from `observedAt`) is unaffected.
- OQ-8 itself remains PENDING.

---

## §8 Out-of-round item

**K-3** (CODE-GAP-AUDIT-001 §9: one timestamp serves as both "published" and "observed") is not part of QUESTIONNAIRE-001.
It is already recorded as an OQ-6 limitation and relates to PD-6. **No decision is made on K-3.**

## §9 Decision summary

```text
K-1:    DECIDED — K1-B (unresolved: names in quotes; personal-vs-business boundary; EG-1)
K-2:    DECIDED — K2-A (PD-3 remains PENDING)
K-3:    NOT IN THIS ROUND — no decision
K-4:    DECIDED — K4-A (PD-2 remains PENDING)
K-5:    DECIDED — K5-C (PD-8 remains PENDING as worded; EG-3 open)
K-6/A1: DECIDED — K6-C (classification deferred pending EG-5; PD-8, PD-9, EG-4 open)
K-7:    DECIDED — Part 1 K7-A; Part 2 YES (definition of the term only)

Existing decisions reopened / amended / superseded / reinterpreted: NONE
New answer options invented: NONE
```

## §10 Authority boundary

```text
These decisions authorize no implementation work.

Implementation authorization: NONE
Production code / test changes: NONE
Schema/migration authority: NONE
Configuration / API / UI changes: NONE
Database authority: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Production provider access: NONE
Credential authorization: NONE
Runtime-wiring authorization: NONE
Integration naming authorization: NONE
Key-registration authority: NONE
Scraping/browser automation authorization: NONE
External / live research authorization (incl. LinkedIn): NONE
Validation authority: NONE
Outreach/contact authority: NONE
Participant contact authority: NONE
Deployment authority: NONE
Commit/push authority: NONE
```

## §11 Execution counters (this record)

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
