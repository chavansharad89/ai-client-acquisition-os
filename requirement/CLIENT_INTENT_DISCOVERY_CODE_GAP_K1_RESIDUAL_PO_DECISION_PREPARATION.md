# CLIENT INTENT DISCOVERY — CODE-GAP K-1 RESIDUAL QUESTIONS — PRODUCT OWNER DECISION PREPARATION

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-PREP-001
**Date:** 2026-10-01
**Type:** Product Owner **decision-preparation** record. Not a decision record, not a questionnaire, not an
implementation plan, not an implementation authorization.
**Arises from:** CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-CONFORMANCE-AUDIT-001 ("CONFORMANCE-AUDIT"): §5, §7 B-2, §8
items 2 and 5, observation O-2.
**Companion clerical record:** CLIENT-INTENT-DISCOVERY-CODE-GAP-RECON-001 ("RECON-001"), covering the OQ-8 status and
the LinkedIn evidence addition.
**Author role:** governance analyst / decision-preparation author.

> **This record answers, recommends, ranks and selects nothing, and infers no Product Owner preference.** Every
> question below is `PENDING`. Where no answer options exist in governing or preparation records, it says
> `Options: NONE ESTABLISHED` and invents none.

**Question labels.** The new questions are numbered **K1-R1**, **K1-R2** and **K1-R3**. They are deliberately not
labelled "K1-A" / "K1-B", because those labels already denote K-1 answer alternatives in PREP-001 §4 and QUESTIONNAIRE-001
§3, and K1-B is the selected answer in PO-DEC.

Abbreviations: PO-DEC = CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001; QUESTIONNAIRE-001 =
CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-QUESTIONNAIRE-001; PREP-001 = CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-PREP-001.

## Baseline

Identical to RECON-001 §1:
- HEAD `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0`; 0 staged files.
- Code fingerprint `e3b0c442…b855` (empty).
- All cited record hashes are as listed in RECON-001 §1 and unchanged.

---

## A. Scope

| Item | Handled in |
|---|---|
| OQ-8 clerical reconciliation | RECON-001 §2 (summary in §B below) |
| LinkedIn evidence reconciliation | RECON-001 §3 (summary in §B below) |
| K-1 personal / business contact-identifier boundary | K1-R1 (this record) |
| K-1 names inside quotes | K1-R2 (this record) |
| O-2: relationship of K1-B to the OQ-3 item 4 privacy screen | K1-R3 (this record) |
| PD-1 implementation-authorization prerequisite | §C.4 (this record) |

## B. Existing decided facts (decided by governing records only)

| # | Fact | Source |
|---|---|---|
| B-1 | Privacy boundary: "no personal email / phone harvesting; no inference that a named individual uses an AI platform; no consumer-level behavioural surveillance." | DEC-003 §6 |
| B-2 | Sufficient evidence requires all four conditions. Item 1: "the item contains a statement, expressed by the potential client, of a current need for a service; the statement appears verbatim in the source evidence". Item 4: "the item passes the existing privacy screen (DEC-003 §6; CONTRACT-REC §3)". "An item failing any condition is not a Client Intent Signal (existing outcomes `NO_INTENT_EVIDENCE`, `UNATTRIBUTED` or `REJECTED` apply)." | OQ-PO-DEC-001 OQ-3 |
| B-3 | A potential client "must be an identifiable **organization or business**, represented only by business-level identity supplied by the source (including a sole trader or freelancer acting in a business capacity and identified by a business website, not by personal identifiers)". | OQ-PO-DEC-001 OQ-11 item 1 |
| B-4 | "the existing privacy boundary (DEC-003 §6 and the provider-contract privacy screen) prohibits individual-level AI-conversation access, prompt capture, personal email / phone harvesting, click / advertising / device identifiers and inference about named individuals." | REQ-001 R-3.3 (EXISTING DECISION) |
| B-5 | K-1 selected answer **K1-B**: "An evidence item whose free-text quote contains a personal contact identifier is rejected." | PO-DEC §2 |
| B-6 | K-1 unresolved portions: (1) names in quotes are not covered by the K1-B wording; their treatment "remains unresolved". (2) "The boundary between a personal and a business contact identifier … is not defined by this decision." | PO-DEC §2 |
| B-7 | "A partially answered question remains PENDING for its unanswered part." | QUESTIONNAIRE-001 §2 item 5 (decision protocol) |
| B-8 | "These decisions authorize no implementation work." | PO-DEC header, §10 |
| B-9 | OQ-8 current documented state: DECIDED in OQ-1-2-8-PO-DEC-001 §4. Earlier PENDING statements are historical. | RECON-001 §2 (clerical; citing READINESS-001 §1, REQ-001 R-13.28) |
| B-10 | LinkedIn: OQ-1-2-8-PO-DEC-001 §4 adopts "EST — incl. no prospecting / lead creation from member data (S14)". Applicability to lead-form responses is NOT established. K6-C is unchanged. | RECON-001 §3 |

## C. Open questions

### C.1 K1-R1 — Personal vs business / professional contact-identifier boundary

**Question:** For applying the decided K1-B rule ("An evidence item whose free-text quote contains a personal contact
identifier is rejected"), where does the boundary lie between a **personal** contact identifier and a **business /
professional** contact identifier?

**Preserved:** K1-B is not changed. This question exists only to define the boundary that K1-B requires in order to be
applied (PO-DEC §2 unresolved item 2; CONFORMANCE-AUDIT §7 B-2).

**Evidence (D):**

| Source | Section | Establishes | Does NOT establish |
|---|---|---|---|
| DEC-003 | §6 | Personal email / phone harvesting is prohibited. | What makes an email / phone "personal" rather than business. |
| REQ-001 | R-13.21 | Amendment 2 does not require "private email addresses; private phone numbers". | That "private" equals "personal", or any boundary. |
| OQ-PO-DEC-001 | OQ-11 item 1 | Potential clients are organizations, or persons acting in a business capacity identified by a business website, "not by personal identifiers". | How contact identifiers inside quotes are classified. |
| PO-DEC | §2 (rationale; unresolved items 1–2) | K1-B is read against DEC-003 §6 ("the personal email / phone that DEC-003 §6 names"). The boundary is undefined. K1-D (a PO-defined business-vs-personal rule) was not selected, for lack of EG-1 evidence. | Any boundary. Whether a business-domain address naming an individual is personal or business. |
| CONTRACT-REC (implementation record) | §6 item 4 | Current behavior: "a public RFP body may quote a business contact email; tested as accepted"; a bare digit string under a neutral key cannot be told apart from a numeric identifier. | Governing status of that behavior (listed under "Known open questions"). |
| CONTRACT-REC (implementation record) | §3 | Outside free-text fields, any email / `mailto:` / `tel:` / `sms:` value is rejected, whether personal or business. | Any rule for free-text fields. |
| Code (CODE-GAP-AUDIT-001 E9) | `intentSourceProviderContract.ts:271–272` | Comment: "Free-text fields may quote a business contact". | Governing status. |
| CODE-GAP-AUDIT-001 / PREP-001 | PREP-001 §4 dependencies | EVIDENCE GAP EG-1: kinds / prevalence of personal data in real source quotes is not establishable from the repository. | — |

**Terminology observation:** the records use "personal" (DEC-003 §6; K1-B), "private" (R-13.21) and "business contact"
(CONTRACT-REC §6.4; code comment). No record states how these terms relate.

**Candidate options (E):** `Options: NONE ESTABLISHED`.
- PREP-001 §4 K1-D ("Distinguish by identifier type (e.g. business vs personal contact) under a rule the Product Owner
  defines") was an analyst-prepared alternative answer to K-1 as a whole. The Product Owner did not select it (PO-DEC §2).
- It is not an option set for the boundary and is not reproduced as one.

**Status:** `PENDING` — Product Owner answer: NONE.

### C.2 K1-R2 — Names inside otherwise verbatim evidence quotes

**Question:** How are names of individuals appearing inside an otherwise verbatim free-text evidence quote to be
treated?

**Preserved constraints:**
- OQ-3 item 1 requires the statement to appear verbatim (B-2).
- K1-B concerns personal contact identifiers only (B-5).
- No record decides whether ordinary names in quotes are prohibited, masked, accepted or otherwise handled (B-6 item 1).
- This is the unanswered part of the original K-1 question, which named "a person's email, phone or name"
  (QUESTIONNAIRE-001 §3). It remains PENDING under B-7.

**Evidence (D):**

| Source | Section | Establishes | Does NOT establish |
|---|---|---|---|
| QUESTIONNAIRE-001 | §3 (K-1 question, verbatim from PREP-001 §4) | K-1 asked about "a person's email, phone or name". | — |
| PO-DEC | §2 unresolved item 1 | Names are not covered by K1-B; their treatment is unresolved. | Any treatment. |
| DEC-003 | §6 | "no inference that a named individual uses an AI platform". | A rule for names appearing in quotes generally. |
| REQ-001 | R-3.3; R-3A.3 | Prohibition of "inference about named individuals" (R-3.3); Amendment 1 does not authorize "inference about named individuals where prohibited by existing governance" (R-3A.3). | Whether retaining a name in a quote is "inference". |
| OQ-PO-DEC-001 | OQ-3 item 1; item 3 (traceability, R-3.2) | Verbatim statement; extracted intent traceable to the original evidence. | Whether a quote containing a name may be retained, altered or rejected. |
| PO-DEC | §2 rationale on K1-C | K1-C (masking) "would alter the verbatim statement, which OQ-3 item 1 (DECIDED) requires … Selecting it would require reopening OQ-3." This is a PO-DEC rationale statement concerning K1-C as an answer to K-1. | Whether any treatment of names would require reopening OQ-3. |
| CONTRACT-REC (implementation record) | §3 | "personal names" is a prohibited **key**. Free-text values are not screened. | Any value-level rule for names in free text. |
| OQ-PO-DEC-001 | OQ-11 | Organizations only; identity not by personal identifiers. | Whether a name inside a quote is an identity use. |

**Previously prepared K-1 alternatives** (analyst proposal, PREP-001 §4; reproduced verbatim for reference only; K1-B
was selected by the Product Owner in PO-DEC §2):
- K1-A — Free-text quotes containing personal identifiers are accepted as-is (the current code behavior).
- K1-B — An evidence item whose free-text quote contains a personal contact identifier is rejected.
- K1-C — Personal identifiers are removed / masked from the quote before persistence (interacts with OQ-3 item 1, R-3.2
  and "rejected, never stripped").
- K1-D — Distinguish by identifier type (e.g. business vs personal contact) under a rule the Product Owner defines.
- K1-E — Other (Product Owner specifies).

These were framed for K-1 as a whole ("personal identifiers"). No record establishes them as an option set for names
specifically.

**Candidate options (E):** `Options: NONE ESTABLISHED`.

**Status:** `PENDING` — Product Owner answer: NONE.

### C.3 K1-R3 — Relationship of K1-B to the OQ-3 item 4 "existing privacy screen" (O-2)

**Question:** Does the K1-B rejection condition form part of "the existing privacy screen (DEC-003 §6; CONTRACT-REC §3)"
referenced by OQ-3 item 4, or is it a separate condition?

**Confirmation that it remains unresolved:** no governing record states either relationship explicitly. Neither
inclusion nor separateness is assumed here.

**Evidence (D):**

| Source | Section | Establishes | Does NOT establish |
|---|---|---|---|
| OQ-PO-DEC-001 | OQ-3 item 4 and outcome sentence | Privacy compliance condition references "the existing privacy screen (DEC-003 §6; CONTRACT-REC §3)". Failing items are not Client Intent Signals. | Whether a later-decided condition is part of "the existing" screen. |
| OQ-PO-DEC-001 | OQ-8 (cited DECIDED constraints) | "CONTRACT-REC §3–§4 (privacy screen; …)" is listed among "Existing DECIDED constraints". | Whether K1-B extends that screen. |
| CONTRACT-REC (implementation record) | §3; §6 item 4 | The screen as implemented exempts free-text fields. The exemption is listed under "Known open questions". | Governing status of the exemption. |
| PO-DEC | §2 rationale | "an item that fails the privacy condition is not a Client Intent Signal (OQ-3: …)". This rationale associates K1-B failure with the OQ-3 outcomes. | An explicit statement that K1-B is, or is not, part of the "existing privacy screen" (rationale, not the selected answer). |
| READINESS-001 (readiness record, predates PO-DEC) | §5, "Privacy-screen outcome" row | "Existing screen. Personal identifiers are rejected." (OQ-3 item 4; DEC-003 §6). | Anything about free-text fields or K1-B. |
| CONFORMANCE-AUDIT | §3 K-1 O-2; §8 item 5 | No record states the relationship. Any implementation authorization covering K1-B must state it. | The relationship. |

**Candidate options (E):** `Options: NONE ESTABLISHED`.

**Status:** `PENDING` — Product Owner answer: NONE.

### C.4 PD-1 — Implementation authorization (prerequisite; not prepared for answer here)

- **Text (READINESS-001 §9, verbatim):** "PD-1 \| Whether to authorize implementation of any part of the provider-neutral
  core (and its scope) \| R-9.2; R-13.13 \| Core".
- **Current status:** `PENDING`. No Product Owner record answers PD-1.
- REQ-001 R-9.2: "This requirement itself grants **none** of those authorities."
- PO-DEC: "These decisions authorize no implementation work."
- **Prerequisite:** PD-1 is the Product Owner decision on whether implementation may be authorized at all. Deciding
  K-1..K-7, or K1-R1..K1-R3, does **not** authorize implementation and does not imply that PD-1 is answered
  (CONFORMANCE-AUDIT §7 B-1).
- **Candidate options:** none established in any record. PD-1 is not answered or prepared for answer here.

### C.5 Other directly relevant existing pending items

| Item | Status | Relevance (as recorded) |
|---|---|---|
| EG-1 — kinds / prevalence of personal data in real quotes | OPEN EVIDENCE GAP (PREP-001 §4; QUESTIONNAIRE-001 §10) | Recorded by PO-DEC §2 as the missing evidence for a PO-defined business-vs-personal rule. Recorded by CONFORMANCE-AUDIT §5 as informing the boundary question, "not itself a decision". |
| CONTRACT-REC §6 item 4, bare digit string limitation | Implementation-record open question | Detection-level matter. PO-DEC §2 unresolved item 3 records it as an implementation matter, not authorized. |

## D. Evidence

Evidence is given per question in §C.1–§C.4 (source, section, what it establishes, what it does not establish).
No external or live evidence was consulted.

## E. Candidate options

| Question | Options |
|---|---|
| K1-R1 | `Options: NONE ESTABLISHED` |
| K1-R2 | `Options: NONE ESTABLISHED` (prior K-1 alternatives reproduced for reference only, §C.2) |
| K1-R3 | `Options: NONE ESTABLISHED` |
| PD-1 | `Options: NONE ESTABLISHED` (not prepared for answer here) |

## F. Dependencies

```text
K1-B application                                → requires K1-R1 (PO-DEC §2 unresolved item 2; CONFORMANCE-AUDIT §7 B-2)
K-1 completion                                  → requires K1-R2 (QUESTIONNAIRE-001 §2 item 5; PO-DEC §2 unresolved item 1)
Any implementation authorization covering K1-B  → requires an explicit K1-R3 statement (CONFORMANCE-AUDIT §8 item 5)
Any implementation                              → requires PD-1 (READINESS-001 §9; REQ-001 R-9.2; CONFORMANCE-AUDIT §7 B-1)
K1-R1 ↔ K1-R2 ↔ K1-R3                           → NO ESTABLISHED DEPENDENCY among them
EG-1 → K1-R1                                    → recorded as relevant evidence only (PO-DEC §2; CONFORMANCE-AUDIT §5); no record makes it a prerequisite
```

These lines state existing recorded dependencies. None is a decision.

## G. Decision protocol

1. **Product Owner only.** Only the Product Owner may answer K1-R1, K1-R2, K1-R3 or PD-1, in a separate Product Owner
   decision record. This preparation record is not edited to hold answers.
2. **No default answer.** Silence, elapsed time or current code behavior does not answer any question.
3. **No ranking.** Nothing here orders or weights any possible answer.
4. **No implementation authorization.** Answering any question here authorizes no implementation, schema, test,
   provider, wiring, validation, outreach or deployment work.
5. **No reopening.** K1-B (PO-DEC), OQ-3, OQ-6, OQ-11, OQ-12, DEC-003 §6, OQ-1-2-8-PO-DEC-001 and all other decided
   records stand. An answer that would require reopening one of them is outside the scope of these questions.
6. **Unresolved evidence remains unresolved.** EG-1 and EG-5 (S14 applicability) are not filled. No external research is
   authorized.

## Questionnaire status

No questionnaire is created by this record:
- QUESTIONNAIRE-001 cannot be extended without editing an existing record.
- Its K-1 question is already answered in part (PO-DEC).
- This record is ready for a separate, explicit Product Owner questionnaire-generation step covering K1-R1, K1-R2 and
  K1-R3.

## Authority and execution counters

```text
K1-R1: PENDING
K1-R2: PENDING
K1-R3: PENDING
PD-1:  PENDING

Product Owner decisions made: NONE
Implementation authorization: NONE
Validation authority: NONE
Participant / outreach contact authority: NONE
External research authorization: NONE
Provider-call authorization: NONE
Database / schema / migration authority: NONE
Runtime-wiring authorization: NONE
Deployment authority: NONE

Files created: 1 (this record)
Existing records modified: 0
Production / test / schema / migration / configuration / API / UI changes: 0
Provider calls: 0
External HTTP / live research: 0
Validation: 0
Participant contact: 0
Commits / pushes: 0
```
