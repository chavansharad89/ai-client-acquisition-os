# CLIENT INTENT DISCOVERY — CODE-GAP K-1 RESIDUAL QUESTIONS — PRODUCT OWNER DECISION QUESTIONNAIRE

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-QUESTIONNAIRE-001
**Date:** 2026-10-01
**Type:** Product Owner **decision questionnaire** (governance preparation). Not a decision record, not an
implementation plan, not an implementation authorization.
**Direct source:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-PREP-001
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_RESIDUAL_PO_DECISION_PREPARATION.md`, "K1-PREP").
**Author role:** governance analyst / decision-preparation author.

> **This questionnaire answers, recommends, ranks and selects nothing, and infers no Product Owner preference.** No
> governing or preparation record establishes answer options for K1-R1, K1-R2 or K1-R3 (K1-PREP §E). None is invented
> here. Each question is presented for an open Product Owner answer.

Labels used throughout:

| Label | Meaning |
|---|---|
| **DECIDED** | Text of an existing governing decision, quoted. |
| **IMPLEMENTATION FACT** | Current code behavior or an implementation-record statement, cited. Its governance status is not implied. |
| **AUDIT OBSERVATION** | A statement from CODE-GAP-AUDIT-001 or CONFORMANCE-AUDIT. |
| **ANALYST PROPOSAL — NOT A DECISION** | An option previously prepared by an analyst. |
| **EVIDENCE GAP** | Not establishable from the repository. |

Abbreviations:

| Short form | Record ID |
|---|---|
| PO-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 |
| QUESTIONNAIRE-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-QUESTIONNAIRE-001 |
| PREP-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-PREP-001 |
| CONFORMANCE-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-CONFORMANCE-AUDIT-001 |
| RECON-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-RECON-001 |
| CODE-GAP-AUDIT-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-AUDIT-001 |

---

## §1 Scope

This questionnaire covers only:

- **K1-R1** — the boundary between personal and business / professional contact identifiers, for applying K1-B.
- **K1-R2** — the treatment of names appearing inside otherwise verbatim evidence quotes.
- **K1-R3** — the relationship between K1-B and the "existing privacy screen" referenced by OQ-3 item 4.

**Out of scope:**
- PD-1, which is referenced only as a dependency (§6).
- K1-B itself, which is DECIDED and is not reconsidered.
- K-2, K-4, K-5, K-6/A1 and K-7.
- OQ-8 status, reconciled clerically in RECON-001.
- Any provider question.

## §2 Baseline (verified before writing)

| Item | Value |
|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) |
| Target file / record ID pre-existence | Neither existed |

| Record | sha256 (verified) |
|---|---|
| K1-PREP | `4a12683500d6fc2e5f4c81670d15c034e444e5605dab21edd45db40000c1f2b4` |
| RECON-001 | `192df548aa8d71ffdb033648301a1ebd1fb727ba4a928cfb5028d9baa3b84939` |
| CONFORMANCE-AUDIT | `2697ac30b550e8f4f300f0d92310f87b9212e110b676155533577d48a93db93a` |
| PO-DEC | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` |
| QUESTIONNAIRE-001 | `a121911994ed695917bf2fcea726a236cb3434acec6f0b1692d3af21c6b20751` |
| PREP-001 | `5d7efc67dfc10788a227e4abe82ebd236d595ead6bf3232777ebd721d97d430a` |
| CODE-GAP-AUDIT-001 | `803e25b83ac460c42cd275ddb285fe44ae010871c83b6e28234822d4188b157b` |
| REQ-001 (canonical) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` |
| OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| OQ-1-2-8-PO-DEC-001 | `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548` |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |

The baseline matches K1-PREP (which cites RECON-001 §1). The canonical requirement hash is unchanged.

### Decided starting point (not reconsidered)

**DECIDED — PO-DEC §2, K-1 selected answer K1-B:** "An evidence item whose free-text quote contains a personal contact
identifier is rejected."

---

## §3 K1-R1 — Personal vs business / professional contact-identifier boundary

### Question

> For applying the decided K1-B rule ("An evidence item whose free-text quote contains a personal contact identifier is
> rejected"), where does the boundary lie between a **personal** contact identifier and a **business / professional**
> contact identifier?

(Question text as in K1-PREP §C.1.) This question does not reconsider K1-B. It asks only for the boundary needed to apply
it.

### Governing evidence

| Type | Source | Text / content | Does NOT establish |
|---|---|---|---|
| DECIDED | DEC-003 §6 | "no personal email / phone harvesting" | What makes an email / phone "personal" rather than business |
| DECIDED | REQ-001 R-13.21 | Amendment 2 does not require "private email addresses; private phone numbers" | That "private" equals "personal"; any boundary |
| DECIDED | OQ-PO-DEC-001 OQ-11 item 1 | Potential clients are organizations, or a sole trader / freelancer "acting in a business capacity and identified by a business website, not by personal identifiers" | How contact identifiers inside quotes are classified |
| DECIDED | PO-DEC §2 (rationale; unresolved items 1–2) | K1-B read against "the personal email / phone that DEC-003 §6 names"; "The boundary between a personal and a business contact identifier … is not defined by this decision" | Any boundary |

### Known constraints

- K1-B is DECIDED and is not reconsidered.
- DEC-003 §6, OQ-11 and OQ-3 are DECIDED and are not reopened.
- **Terminology (K1-PREP §C.1):** the records use "personal" (DEC-003 §6; K1-B), "private" (R-13.21) and "business
  contact" (CONTRACT-REC §6.4; code comment). No record states how these terms relate.

### Implementation facts (current behavior; no governance status implied)

- **CONTRACT-REC §6 item 4** (listed under "Known open questions"):
  - "a public RFP body may quote a business contact email; tested as accepted".
  - A bare digit string under a neutral key cannot be told apart from a numeric identifier.
- **CONTRACT-REC §3:** outside free-text fields, any email / `mailto:` / `tel:` / `sms:` value is rejected, whether
  personal or business.
- **`intentSourceProviderContract.ts:271–272`** (CODE-GAP-AUDIT-001 E9), comment: "Free-text fields may quote a business
  contact".

### Implementation implications (as recorded; not an authorization)

**AUDIT OBSERVATION — CONFORMANCE-AUDIT §7 B-2:** K1-B "cannot be applied deterministically" until this boundary is
defined.

### Existing options

`Options: NONE ESTABLISHED` (K1-PREP §C.1, §E).

**ANALYST PROPOSAL — NOT A DECISION (reference only):**
- PREP-001 §4 K1-D — "Distinguish by identifier type (e.g. business vs personal contact) under a rule the Product Owner
  defines."
- That was an alternative answer to K-1 as a whole. The Product Owner did not select it (PO-DEC §2).
- It is not an option set for this question.

### Answer

Product Owner boundary definition: NONE

`Product Owner answer: NONE`

---

## §4 K1-R2 — Names inside otherwise verbatim evidence quotes

### Question

> How are names of individuals appearing inside an otherwise verbatim free-text evidence quote to be treated?

(Question text as in K1-PREP §C.2.) This is the unanswered part of the original K-1 question, which named "a person's
email, phone or name" (QUESTIONNAIRE-001 §3). Under QUESTIONNAIRE-001 §2 item 5, it remains PENDING.

### Governing evidence

| Type | Source | Text / content | Does NOT establish |
|---|---|---|---|
| DECIDED | OQ-PO-DEC-001 OQ-3 item 1 | "the statement appears verbatim in the source evidence" | Whether a quote containing a name may be retained, altered or rejected |
| DECIDED | OQ-PO-DEC-001 OQ-3 item 3 | Extracted intent traceable to and distinguishable from the original evidence (R-3.2) | Any names rule |
| DECIDED | PO-DEC §2 | K1-B covers personal contact identifiers. Names are "not cover[ed]" by its wording; their "treatment remains unresolved". | Any treatment of names |
| DECIDED | DEC-003 §6 | "no inference that a named individual uses an AI platform" | A rule for names appearing in quotes generally |
| DECIDED | REQ-001 R-3.3; R-3A.3 | Prohibition of "inference about named individuals"; Amendment 1 does not authorize "inference about named individuals where prohibited by existing governance" | Whether retaining a name in a quote is "inference" |
| DECIDED | OQ-PO-DEC-001 OQ-11 | Organizations only; identity "not by personal identifiers" | Whether a name inside a quote is an identity use |
| DECIDED (rationale) | PO-DEC §2, on K1-C | Masking "would alter the verbatim statement, which OQ-3 item 1 (DECIDED) requires … Selecting it would require reopening OQ-3." This concerns K1-C as an answer to K-1. | Whether any particular treatment of names would require reopening OQ-3 |

### Known constraints

- OQ-3 item 1's verbatim-statement requirement is DECIDED and is not reopened.
- K1-B's personal-contact-identifier rule is DECIDED and is not reconsidered.
- No existing record establishes whether names in quotes are allowed, rejected, masked or transformed (PO-DEC §2
  unresolved item 1; K1-PREP §C.2).

### Implementation facts (current behavior; no governance status implied)

- **CONTRACT-REC §3:** "personal names" is a prohibited **key**. Free-text values are not screened (CODE-GAP-AUDIT-001
  E9: `PROVIDER_PROHIBITED_KEYS` includes `personname`, `fullname`, `firstname`, `lastname`; identifier check skipped for
  free-text keys).
- **CODE-GAP-AUDIT-001 E2, E6:** the quote is persisted verbatim as `source_quote`.

### Implementation implications (as recorded; not an authorization)

None is recorded by CONFORMANCE-AUDIT beyond the item remaining PENDING (§5 dependency matrix). No blocker is recorded
for this question.

### Existing options

`Options: NONE ESTABLISHED` (K1-PREP §C.2, §E).

**ANALYST PROPOSAL — NOT A DECISION** (PREP-001 §4 K-1 alternatives, reproduced verbatim for reference only). They were
framed for K-1 as a whole ("personal identifiers"), not for names, and no record establishes them as an option set for
this question. K1-B was selected by the Product Owner for K-1 (PO-DEC §2).

- K1-A — Free-text quotes containing personal identifiers are accepted as-is (the current code behavior).
- K1-B — An evidence item whose free-text quote contains a personal contact identifier is rejected.
- K1-C — Personal identifiers are removed / masked from the quote before persistence (interacts with OQ-3 item 1, R-3.2
  and "rejected, never stripped").
- K1-D — Distinguish by identifier type (e.g. business vs personal contact) under a rule the Product Owner defines.
- K1-E — Other (Product Owner specifies).

### Answer

Product Owner names treatment: NONE

`Product Owner answer: NONE`

---

## §5 K1-R3 — Relationship of K1-B to the OQ-3 item 4 privacy screen

### Question

> Is K1-B part of the existing privacy screen referenced by OQ-3 item 4, or is K1-B a separate rejection condition?

(Equivalent to K1-PREP §C.3: "Does the K1-B rejection condition form part of 'the existing privacy screen (DEC-003 §6;
CONTRACT-REC §3)' referenced by OQ-3 item 4, or is it a separate condition?")

### Governing evidence

| Type | Source | Text / content | Does NOT establish |
|---|---|---|---|
| DECIDED | OQ-PO-DEC-001 OQ-3 item 4 | "the item passes the existing privacy screen (DEC-003 §6; CONTRACT-REC §3)" | Whether a later-decided condition is part of "the existing" screen |
| DECIDED | OQ-PO-DEC-001 OQ-3 (outcome) | "An item failing any condition is not a Client Intent Signal (existing outcomes `NO_INTENT_EVIDENCE`, `UNATTRIBUTED` or `REJECTED` apply)." | Which condition K1-B failure falls under |
| DECIDED (cited constraint) | OQ-PO-DEC-001 OQ-8 | "CONTRACT-REC §3–§4 (privacy screen; …)" listed among "Existing DECIDED constraints that apply to every provider meanwhile" | Whether K1-B extends that screen |
| DECIDED (rationale) | PO-DEC §2 | "an item that fails the privacy condition is not a Client Intent Signal (OQ-3: …)" | An explicit statement that K1-B is, or is not, part of the "existing privacy screen". This is rationale, not the selected answer, and no answer is inferred from it. |
| Readiness (analyst; predates PO-DEC) | READINESS-001 §5, "Privacy-screen outcome" row | "Existing screen. Personal identifiers are rejected." | Anything about free-text fields or K1-B |
| AUDIT OBSERVATION | CONFORMANCE-AUDIT §3 (K-1, O-2) | "No record states whether the K1-B condition operates as part of the 'existing privacy screen' referenced by OQ-3 item 4 or as a separate condition." | The relationship |

### Known constraints

- OQ-3 (all items) is DECIDED and is not reopened.
- K1-B is DECIDED and is not reconsidered.
- The answer must not be inferred from PO-DEC rationale, from implementation behavior, or from terminology alone.

### Implementation facts (current behavior; no governance status implied)

- **CONTRACT-REC §3:** the screen as implemented runs "before mapping, recursively"; "Violations are **rejected, never
  stripped**".
- **CONTRACT-REC §3; §6 item 4:** free-text fields are exempt from the identifier check. The exemption is listed under
  "Known open questions".

### Implementation implications (as recorded; not an authorization)

**AUDIT OBSERVATION — CONFORMANCE-AUDIT §8 item 5:** "Any future implementation-authorization record covering K1-B must
state explicitly how the K1-B condition relates to the OQ-3 item 4 'existing privacy screen' (O-2)."

### Existing options

`Options: NONE ESTABLISHED` (K1-PREP §C.3, §E).

The question itself names two possibilities ("part of the existing privacy screen" / "a separate rejection condition").
They are the terms of the question as posed in K1-PREP §C.3. They are not analyst-ranked options, and neither is a
default.

### Answer

`Product Owner answer: NONE`

---

## §6 Dependency matrix

| Question | Depends on | Status | Source |
|---|---|---|---|
| K1-R1 | K1-B (scope of the boundary) | DECIDED | PO-DEC §2 |
| K1-R1 | DEC-003 §6; OQ-11 (constraints) | DECIDED | OQ-PO-DEC-001; DEC-003 |
| K1-R2 | K1-B / OQ-3 item 1 verbatim-quote requirement | DECIDED constraints | PO-DEC §2; OQ-PO-DEC-001 OQ-3 |
| K1-R3 | OQ-3 item 4 privacy screen | OPEN relationship (OQ-3 itself DECIDED) | OQ-PO-DEC-001 OQ-3; CONFORMANCE-AUDIT O-2 |
| Application of K1-B | K1-R1 | PENDING | K1-PREP §F; CONFORMANCE-AUDIT §7 B-2 |
| Completion of K-1 | K1-R2 | PENDING | K1-PREP §F; QUESTIONNAIRE-001 §2 item 5 |
| Any implementation authorization covering K1-B | Explicit K1-R3 statement | PENDING | K1-PREP §F; CONFORMANCE-AUDIT §8 item 5 |
| Implementation | PD-1 | PENDING | READINESS-001 §9; REQ-001 R-9.2; CONFORMANCE-AUDIT §7 B-1 |
| K1-R1 ↔ K1-R2 ↔ K1-R3 | — | NO ESTABLISHED DEPENDENCY | K1-PREP §F |

> **These K1 residual decisions do not authorize implementation. Implementation authorization remains subject to PD-1
> and all other applicable prerequisites.**

## §7 Evidence gaps (established only)

| # | Gap | Affects | Source | Status |
|---|---|---|---|---|
| EG-1 | Kinds / prevalence of personal data actually present in real source quotes (no live source exists) | K1-R1 (recorded as relevant evidence, not a prerequisite); K1-R2 by the same record's scope ("personal data") | PREP-001 §4; QUESTIONNAIRE-001 §10; PO-DEC §2; CONFORMANCE-AUDIT §5 | OPEN — not filled; no research authorized |
| — | No record states how "personal", "private" and "business contact" relate | K1-R1 | K1-PREP §C.1 terminology observation | OPEN (governance text, not external evidence) |
| — | No record states the K1-B / OQ-3 item 4 relationship | K1-R3 | CONFORMANCE-AUDIT O-2; K1-PREP §C.3 | OPEN (this is the question itself) |

No other evidence gap is established for these questions. EG-5 (LinkedIn S14) concerns K-6/A1 and is out of scope.

## §8 Decision protocol

1. **Product Owner answers only.** Answers are recorded in a separate Product Owner decision record that cites this
   questionnaire. This questionnaire is not edited to hold answers.
2. **No default answers.** Silence, elapsed time and current code behavior answer nothing.
3. **No ranking.** Nothing here orders or weights possible answers. No ranking was requested.
4. **No new substantive options.** The questionnaire author has invented none. Material labelled "ANALYST PROPOSAL —
   NOT A DECISION" is reference material and carries no approval.
5. **Answers do not authorize implementation.** This includes implementation of K1-B.
6. **Existing decisions are not reopened.** K1-B, OQ-3, OQ-6, OQ-11, OQ-12, DEC-003 §6, OQ-1-2-8-PO-DEC-001 and all
   other decided records stand. An answer that would require reopening one of them is outside these questions.
7. **Unresolved evidence remains unresolved.** EG-1 is not filled. No external research is authorized.
8. **Partial answers.** An unanswered question, or an unanswered part of one, remains PENDING.

---

## Closing block

> **This questionnaire prepares decisions only. It grants no implementation, validation, participant-contact,
> provider-call, or deployment authority.**

```text
K1-R1: PENDING — Product Owner answer: NONE
K1-R2: PENDING — Product Owner answer: NONE
K1-R3: PENDING — Product Owner answer: NONE

Product Owner decisions recorded: NONE

Implementation authorization: NONE
Validation authority: NONE
Participant-contact authority: NONE
Provider-call authorization: NONE
External research authorization: NONE
Deployment authority: NONE

Files created: 1 (this record)
Existing records modified: 0
Code / test / schema / migration / configuration changes: 0
Provider calls / external HTTP: 0
Commits / pushes: 0
```
