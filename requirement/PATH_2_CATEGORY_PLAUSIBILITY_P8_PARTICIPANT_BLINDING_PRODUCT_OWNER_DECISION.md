# PATH 2 — CATEGORY PLAUSIBILITY

## P8 — Participant Blinding and Session Design — Product Owner Decision Record

**Decision ID:** P8-PO-DEC-001
**Status:** **DECIDED** (2026-09-28; see §3)
**Option selected:** **A — Procedure only**
**Authority granted by this record:** NONE beyond recording the choices in §3 (see §7)
**Parent record:** `PATH_2_CATEGORY_PLAUSIBILITY_VALIDATION_SESSION_PRODUCT_OWNER_DECISION.md` (VS-PO-DEC-001), §9.3(b)5 (P8) and §9.6 (P7)
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
D11 ....................... READY FOR LIVE VALIDATION (unchanged)
VS-PO-DEC-001 ............. OPTION C — ONE BOUNDED VALIDATION SESSION AUTHORIZED (unchanged)
VALIDATION SESSION ........ NOT YET PERFORMED
P8 PARTICIPANT SURFACE .... DECIDED — OPTION A, PROCEDURE ONLY
SESSION ID MECHANISM ...... OPEN — separate Product Owner clarification required
GATE §11.8 WORDING ........ OPEN — separate governance clarification required
```

This record decides the P8 participant-blinding / session-design questions only. It does not
perform, schedule or expand the validation session, and it changes no other record.
VS-PO-DEC-001 is not edited by this record. No equivalent P8 participant-blinding decision
record existed before this one.

---

## 1. Decision question

> What participant-facing surface and sequencing should be used so that the participant answers
> the validation question without seeing the system's category-plausibility determination first,
> while preserving the existing evidence-capture mechanism?

Secondary questions carried with it: Search-input ownership, the Session ID mechanism, and
`ai_usage_events` capture under Gate §11.8.

## 2. Governing requirements (unchanged)

| Requirement | Source |
|---|---|
| The participant answers "Would you actually contact this business?" exactly as written, unprimed, plus the useful/not-useful judgment and verbatim feedback | D11 §5; `MVP_REAL_USER_VALIDATION_TEMPLATE.md` |
| The aggregate/per-segment result, evidence and Qualification outcome are recorded by the facilitator and **not shown to the participant before they answer**; the comparison is computed afterward by the facilitator | D11 §5; D11-C |
| The participant-facing template is not modified; category-plausibility observations are recorded in the separate facilitator-side record (D11-H + Companion) | D11 §9; A-12 decision §5 |
| The determination is shown only on the Opportunity detail page and never on the ranked Opportunities list | D10 §3; D10-F |
| Direct human database queries are not authorized | VS-PO-DEC-001 §9.4 |

Repository facts relied on (P8 preparation, read-only):

- The ranked list (`apps/web/app/(client-finder)/opportunities/page.tsx`) shows company name,
  rank, score/band and recommended offer, and no category-plausibility label.
- The Opportunity detail page (`apps/web/app/(client-finder)/opportunities/[id]/page.tsx`) shows
  the aggregate label, per-segment results, the `CATEGORY_PLAUSIBLE` Qualification row
  (`packages/core-qualification/src/rules.ts`, whose reason names MATCH/MISMATCH), the overall
  Qualification state and the AI usage section.
- No role-based, redacted or participant-safe view exists.

## 3. Product Owner decision

| Field | Value |
|---|---|
| Option selected | **OPTION A — PROCEDURE ONLY** |
| Product Owner | Product Owner, by explicit decision given in the working session on 2026-09-28, recorded here under that authorization |
| Date | 2026-09-28 |

Option B (a participant-safe view) is not selected. No UI change is authorized.

### 3.1 Participant surface and sequence

The participant uses the existing label-free ranked Opportunities surface and/or
facilitator-presented information before answering. The detailed Opportunity page is opened only
after the participant response has been captured.

```text
1. Participant receives the permitted label-free ranked Opportunities
   presentation / facilitator-presented information.

2. Participant answers the validation question without seeing the
   system's category-plausibility determination.

3. Facilitator records/captures the participant response.

4. Only after the response is captured may the facilitator/reviewer
   open the detailed Opportunity/evidence surface.

5. Required evidence is then captured through the already-authorized
   application/session mechanisms.

6. Participant response remains associated with the relevant
   Opportunity/Determination through the existing session records.
```

No new technical mechanism is introduced.

### 3.2 Blinding requirements

Before the participant response, the participant must not be shown:

```text
MATCH
MISMATCH
UNKNOWN
per-segment classification
confidence
basis/evidence
CATEGORY_PLAUSIBLE qualification reason
AI usage information
other determination-derived evidence
```

The detailed Opportunity page is therefore a **post-response evidence surface**. The page itself
is unchanged.

### 3.3 Search inputs

```text
Search inputs:
The session uses the facilitator-preplanned compound targetCustomer /
Search design already defined by the governing P8 planning records.
```

Those records are Gate Audit §11.4 (the same real business in two Searches; a pre-planned
compound, ≥2-segment `targetCustomer`), D11 §4 items 4 and 7, and VS-PO-DEC-001 §9.3(b)5 and §9.4
(at most 2 Searches).

**Recorded tension, not resolved here:** the participant template's "Service definition used"
block is headed "as entered by the participant, not assumed". The template is not modified
(D11 §9). This decision records that, for this session, the Search inputs are
facilitator-preplanned. It does not decide how that template block is completed, or whether this
session's template copy counts toward the general `MVP_SCOPE_BOUNDARY.md` §9 real-user gate.

### 3.4 Session ID

The governing records do not define a Session ID mechanism:

- D11-H §1 and Companion §1 contain a blank "Session ID" field;
- Gate Audit §6 classifies it as facilitator entry (F);
- VS-PO-DEC-001 §9.7 says values are "taken as observed from the persisted rows", but no
  persisted session entity exists.

```text
SESSION ID = OPEN
```

A separate Product Owner clarification is required. This decision does not invent a Session ID
mechanism, and none may be generated in advance.

### 3.5 `ai_usage_events` / Gate §11.8

Product Owner ruling:

```text
The existing application UI / authorized session mechanism is the
evidence-capture mechanism.

Direct human database queries remain NOT AUTHORIZED.
```

Gate Audit §11.8 reads "plan to query `ai_usage_events` (provider, model, request_kind) per
prospect". Taken literally, that is a database query.

```text
Gate §11.8 wording requires separate governance clarification.
```

Gate §11.8 is not amended by this record.

### 3.6 Not decided by this record

These are outside the choices given and remain unaddressed:

- whether the ranked list alone gives the participant enough information, and what the
  facilitator may present in addition;
- whether "after the response is captured" means after each Opportunity's response or after all
  responses;
- use of the in-app feedback form, which is on the post-response detail page;
- whether the participant may be shown the system result after answering (D11-H §20 has
  reaction/disagreement fields; D11 §9 leaves a label-reaction question to a separate template
  decision);
- how the facilitator maps each answer to its Opportunity ID when the cross-Search design puts
  the same business on the list twice.

## 4. Evidence capture (unchanged)

After the response, the existing owner-scoped application surfaces expose:

- **On the Opportunity detail page:**
  - Determination ID, determination timestamp, Search ID, Prospect ID, and the Opportunity ID
    (in the page URL);
  - `target_segments` with count, and `segment_results`;
  - per-segment classification, confidence and basis (`ABSENT` where a pre-F-1 field is
    missing), and evidence;
  - `ai_usage_events`: provider, model, request_kind and event timestamp, plus the fallback
    indication derived from recorded `request_kind`.
- **Through Q-1:** M-2 source documents
  (`GET /api/category-plausibility/determinations/:id/source-documents`).

The participant's answer is recorded in the template's per-opportunity block by Opportunity ID
and joined to the determination through D11-H §19 and the Companion §2 register
(Opportunity ID ↔ Determination ID). This decision changes none of these mechanisms.

## 5. Database boundary

```text
Direct database queries by facilitator/analyst = NOT AUTHORIZED
Direct database queries by technical reviewer = NOT AUTHORIZED
```

Q-1 remains limited to owner-scoped, read-only M-2 source-document retrieval. P5 Postgres
reachability remains a runtime prerequisite only.

## 6. Session authorization (unchanged)

VS-PO-DEC-001 remains as decided: Option C, Research + homepage + Places (P9), at most 2
Searches, M-2-only spot-check (P10).

This record does **not** authorize:

- additional Searches or sessions;
- additional provider calls, new provider configuration or new API integrations;
- database access;
- participant contact;
- live fetching outside P9;
- code, schema or UI changes, or new evidence mechanisms;
- any change to D11, D11-H, the Companion Record, the participant template, Gate Audit §11.8
  or the A-11 matrix.

## 7. Authority

**Granted:** none beyond recording the §3 choices.

**Withheld:** everything listed in §6. New dependency: NO. AI agent: NO. Architecture change: NO.

## 8. Status after this record

```text
P8 participant surface ...... DECIDED — OPTION A, PROCEDURE ONLY (P8-PO-DEC-001)
Search inputs ............... FACILITATOR-PREPLANNED (Gate §11.4 design)
Session ID .................. OPEN — separate Product Owner clarification required
Gate §11.8 wording .......... OPEN — separate governance clarification required
Validation session .......... AUTHORIZED WITHIN VS-PO-DEC-001 §9 LIMITS — NOT YET PERFORMED
```

## STOP
