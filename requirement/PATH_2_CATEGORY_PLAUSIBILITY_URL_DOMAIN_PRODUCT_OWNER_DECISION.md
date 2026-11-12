# PATH 2 — CATEGORY PLAUSIBILITY

## Source URL-Domain Anonymization — Product Owner Decision Record

**Decision ID:** URL-DOMAIN-PO-DEC-001
**Status:** **DECIDED** (2026-09-29)
**Previous status:** PENDING PRODUCT OWNER DECISION
**Selected option:** **C — Conditional**
**Authority granted by this record:** the domain-representation rule for source URLs written on
session surfaces only (see §5)
**Preparation record:** `PATH_2_CATEGORY_PLAUSIBILITY_SERVICE_BLOCK_DOMAIN_TRACEABILITY_PRODUCT_OWNER_DECISION_PREPARATION.md`
(§2; rounds §5–§9; sha256 `1e658e1f04b577ff9aecfe03cf2b2c7839517130915caa2b7a384044ad777bfd`), kept unchanged for traceability
**Related records:** VS-READY-PO-DEC-001 §8.4 (label `Business A` and scope), §9.3 (URL/quote rule;
recorded item 1)
**Product Owner:** Product Owner, by explicit selection and values given in the working session on
2026-09-29, recorded here under that authorization
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`

**Revision history**

| Revision | Date | Change |
|---|---|---|
| 1 | 2026-09-29 | Round 1: option B (Always anonymize) selected; representation not supplied (PENDING). Round 2: option C (Conditional) selected, replacing B as the current selection; representation not supplied (PENDING). Recorded in the preparation record only; this record was not created. |
| 2 | 2026-09-29 | Round 3: Product Owner supplied the exact rule and format for option C. This record created. |

```text
URL-DOMAIN-PO-DEC-001 ..... DECIDED — OPTION C, CONDITIONAL
VALIDATION SESSION ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

---

## 1. Decision question

As prepared (preparation record §2.1): a retained first-party domain can itself identify the business.
Does "retain source URL domains" (VS-READY-PO-DEC-001 §9.3) or the `Business A` scope (§8.4) govern in
that case?

## 2. Ruling

**Exact rule (as supplied):**

> Retain non-identifying source URL domains. If a source URL domain identifies Business A, replace the domain with the neutral literal `business-a.example`.

**Exact format (identifying domain):**

```text
https://business-a.example/<hash-masked-deep-link-fragment>
```

**Non-identifying domains:** the original domain is retained.

The rule, literal and format are recorded exactly as supplied.

## 3. Consequences

- **Relationship to §9.3:** the §9.3 rule is unchanged ("hash-masked deep links with sanitized, generic
  descriptive fragments replacing identifying text strings"). This ruling settles only the domain part,
  resolving §9.3 recorded item 1. VS-READY-PO-DEC-001 is not edited.
- **Session-time application:** whether a given domain identifies Business A is decided when the rule
  is applied during a separately authorized session. No domain was inspected, looked up or classified
  in preparing or recording this decision.
- **Persisted evidence (unchanged):** the determination `evidence[]`, the M-2 rows and the Q-1 response
  keep the real URL. The rule governs written session surfaces only (D11-H, Companion, participant-facing
  and facilitator/reviewer notes, per §8.4 scope).
- **Traceability:** a replaced URL is linked to the persisted source through EVID-TRACE-PO-DEC-001.

## 4. Implementation impact

```text
Application implementation required = NO
Schema change required ............. = NO
Migration required ................. = NO
New dependency required ............ = NO
New AI agent required .............. = NO
```

## 5. Authority boundary

This record authorizes only the recording rule above, applied during a separately authorized session.
It does **not** authorize: a validation session; participant contact; URL lookup or live fetching;
provider, Anthropic, Google Search or Google Places calls; database access or SQL; migrations;
determinations; browser validation; code, schema, configuration or dependency changes; creation of the
`Business A` ↔ real-name mapping; the redaction of earlier VS-READY revisions; the Gate §11.8 edit; or
any edit to the template, D11, D11-H, the Companion Record, the Gate Audit or VS-READY-PO-DEC-001.

## 6. Status

```text
URL-DOMAIN-PO-DEC-001 ..... DECIDED — C
Validation session ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

## STOP
