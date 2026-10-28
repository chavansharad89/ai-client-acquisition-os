# PATH 2 — CATEGORY PLAUSIBILITY

## Template Search-ID Mapping — Product Owner Decision Record

**Decision ID:** TPL-SEARCH-ID-PO-DEC-001 (with the related Service-definition block ruling, §4)
**Status:** **DECIDED** (2026-09-29)
**Previous status:** TPL-SEARCH-ID-PO-DEC-001 — PENDING PRODUCT OWNER DECISION
**Selected option:** **B — Combined template, neutral literal `MULTI`**
**Authority granted by this record:** the recording rule for the template's single "Search ID" field
and "Service definition used → Service" field only (see §6)
**Preparation record:** `PATH_2_CATEGORY_PLAUSIBILITY_TEMPLATE_SEARCH_ID_MAPPING_PRODUCT_OWNER_DECISION_PREPARATION.md`
(sha256 `3ff9ddc01f3795bff0d48001c33ce9dda227c12de4590e2d1d39f7c08d37af4a`), kept unchanged for traceability
**Parent record:** VS-READY-PO-DEC-001 (§4.2, §8.5, §9)
**Product Owner:** Product Owner, by explicit selections given in the working session on 2026-09-29,
recorded here under that authorization
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`

**Revision history**

| Revision | Date | Change |
|---|---|---|
| 1 | 2026-09-29 | Search-ID option B selected (literal not supplied); Service-definition block option B selected (text not supplied). Recorded as PENDING in VS-READY-PO-DEC-001 §8.5; no record created. |
| 2 | 2026-09-29 | Product Owner supplied the literal `MULTI` and the combined service text. This record created. |

```text
TPL-SEARCH-ID-PO-DEC-001 .. DECIDED — OPTION B, LITERAL `MULTI`
SERVICE-DEFINITION BLOCK .. DECIDED — OPTION B, ONE COMBINED TEXT (Service field only; §4.3)
TEMPLATE .................. NOT MODIFIED
VALIDATION SESSION ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

This record decides how two fields of a session copy of the participant template are completed. It
changes no code, test, schema, migration, configuration, dependency or existing governance record,
and it does not modify `MVP_REAL_USER_VALIDATION_TEMPLATE.md`.

---

## 1. Decision question

As prepared (preparation record §1): under R-7c (detail pages opened only after all responses) and
R-7f (one answer per list row), the participant reviews a combined list that may contain
Opportunities from both Searches, while the template has one Search ID field. What exact Search ID is
recorded for each answer/template copy?

## 2. Ruling — Search ID field

| Field | Value |
|---|---|
| Selected option | **B — Combined, neutral literal** |
| Template copies | One combined template copy for the session |
| Exact literal for the template "Search reviewed → Search ID" field | `MULTI` |
| Authoritative per-answer Search ID | The Search ID recorded in Companion §2 for the answer's Opportunity ID |

The literal is recorded exactly as supplied. It is not a Search ID and does not identify either
Search.

## 3. Consequences

- **Linkage (unchanged):** each answer is keyed by Opportunity ID in the template's per-opportunity
  block and joined through D11-H §19 and Companion §2, whose row carries Session ID, Opportunity ID,
  Search ID, Prospect ID and determination identifier (D11 §9; A-12 facilitator-record decision §7.3;
  P8-PO-DEC-001 §4).
- **R-7c / R-7f:** consistent with both as recorded (one combined list; one answer per list row; all
  answers before any detail page). R-7f option C (one copy per Search) remains not selected.
- **D11 §4 item 9:** one copy = one participant, one session, as written; no new interpretation is
  made.

## 4. Related ruling — "Service definition used" block

### 4.1 Question

The template's "Service definition used (§3 stage 1 — as entered by the participant, not assumed)"
block has one set of fields, while VS-READY-PO-DEC-001 R-3 records two different service definitions
and R-8 (block) = B has the facilitator record the planned inputs there with a preplanned note.

### 4.2 Ruling

| Field | Value |
|---|---|
| Selected option | **B — One combined text** |
| Exact PO-approved text for the block's "Service" field | "Provision of end-to-end digital solutions spanning custom website and mobile application engineering alongside full-funnel digital marketing, performance media, and search engine optimization strategy." |

The text is recorded exactly as supplied. The Search-specific services remain as recorded in
VS-READY-PO-DEC-001 §3 R-3 (`Custom Website & Mobile App Development`; `Full-Funnel Digital
Marketing & SEO Strategy`) and are the values entered in the Search form. R-8 (block) = B
(facilitator records with a preplanned note) is unchanged.

### 4.3 Recorded, not resolved

The block has four fields: Service, Target customer, Geography, Minimum project value. The ruling
supplies text for the **Service** field only. How the Target customer, Geography and Minimum project
value fields are completed, given the two different R-3 values for each, is not stated by any record
or by this ruling.

## 5. Implementation impact

```text
Application implementation required = NO
Template change required ........... = NO
Schema change required ............. = NO
Migration required ................. = NO
New dependency required ............ = NO
New AI agent required .............. = NO
```

## 6. Authority boundary

This record authorizes only the completion rule for the two template fields above, applied during a
separately authorized session. It does **not** authorize: a validation session; participant contact;
provider/API, Anthropic, Google Search or Google Places calls; retries; live fetching; database access
or SQL; migrations; determinations; Session ID generation; browser validation; code, schema,
configuration or dependency changes; or any edit to the template, D11, D11-H, the Companion Record,
the Gate Audit, VS-PO-DEC-001, P8-PO-DEC-001, SESSION-ID-PO-DEC-001 or VS-READY-PO-DEC-001's
preparation record.

## 7. Status

```text
TPL-SEARCH-ID-PO-DEC-001 .. DECIDED — B, `MULTI`
Service block (Service) ... DECIDED — B, combined text (§4.2)
Service block (other) ..... OPEN — Target customer / Geography / Minimum project value (§4.3)
Validation session ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

## STOP
