# PATH 2 — CATEGORY PLAUSIBILITY

## Template Search-ID Mapping — Product Owner Decision Preparation

**Decision ID (reserved):** TPL-SEARCH-ID-PO-DEC-001
**Status:** **PENDING PRODUCT OWNER DECISION**
**Parent record:** `PATH_2_CATEGORY_PLAUSIBILITY_SESSION_READINESS_BLOCKERS_PRODUCT_OWNER_DECISION.md`
(VS-READY-PO-DEC-001) §4 item 2
**Repository HEAD at drafting:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
THIS RECORD ............... PREPARATION ONLY — NO DECISION, NO EXECUTION AUTHORITY
TEMPLATE .................. NOT MODIFIED
```

This record prepares one narrowly scoped question. It makes no decision, ranks no option and
recommends nothing. It does not modify `MVP_REAL_USER_VALIDATION_TEMPLATE.md`, D11-H, the Companion
Record, P8-PO-DEC-001 or VS-READY-PO-DEC-001.

---

## 1. Question

> Under R-7c (detail pages opened only after all responses) and R-7f (one answer per list row), the
> participant reviews a combined list that may contain Opportunities from both Searches, while the
> template has one Search ID field. What exact Search ID is recorded for each answer/template copy?

## 2. What the governing records already establish

| Fact | Source |
|---|---|
| One template copy = one real participant, one real session; do not batch participants | Template l.9–10; D11 §4 item 9 |
| The template "Search reviewed" block has a single "Search ID" field and an "Opportunity IDs reviewed" field | Template l.32–37 |
| The per-opportunity block is keyed by Opportunity ID and has no Search ID field | Template l.39–50 |
| Category-plausibility observations are correlated with each template entry **by Opportunity ID** | D11 §9 |
| Opportunity ID is "the D11-H correlation key with the participant template"; every Companion row carries Session ID, Opportunity ID, **Search ID**, Prospect ID and determination identifier | A-12 facilitator-record decision §7.3 |
| The participant's answer is recorded in the per-opportunity block by Opportunity ID and joined to the determination through D11-H §19 and Companion §2 | P8-PO-DEC-001 §4 |
| Under R-7f B the facilitator records each row's Opportunity ID and its Search ID in the Companion | VS-READY-PO-DEC-001 §3 R-7 |
| The template is not modified | D11 §9; VS-PO-DEC-001 §9.10 |

**Conclusion of inspection:** the records specify the per-answer join (Opportunity ID → Companion §2
row carrying Search ID). They do **not** specify what is entered in the template's single
"Search reviewed → Search ID" field when the reviewed list spans two Searches.

## 3. Options (unranked)

| Option | Content | Consequences |
|---|---|---|
| **A** | The single "Search ID" field lists every Search ID whose Opportunities appear in the reviewed list. | The field holds more than one value; per-answer Search attribution still comes from the Companion §2 join. |
| **B** | The single "Search ID" field is left blank with a facilitator note that Search IDs are recorded per Opportunity in Companion §2 / D11-H §3 and §17. | The field is empty; attribution rests entirely on the Opportunity ID join. |
| **Other** | A different rule stated by the Product Owner. | — |

One template copy per Search is not listed: it was R-7f option C, which was not selected
(VS-READY-PO-DEC-001 R-7f = B), and it would also conflict with a single combined list under R-7c.

**Implementation:** none under A or B (no template, UI or code change). **Additional
authorization:** none.

## 4. Related finding (same cause, separable)

The template "Service definition used" block (l.23–30) also has a single set of fields (Service,
Target customer, Geography, Minimum project value). VS-READY-PO-DEC-001 R-8 (block) = B has the
facilitator record "the planned inputs" there, and R-3 records **two** different service
definitions. No record states whether one or both definitions go in that single block. This is
recorded as a finding only; it may be decided with this question or separately, at the Product
Owner's direction.

## 5. Authorization boundary

This record authorizes nothing: no validation session, participant contact, provider or Places call,
live fetch, database access, Session ID generation, template change or implementation.

## STOP
