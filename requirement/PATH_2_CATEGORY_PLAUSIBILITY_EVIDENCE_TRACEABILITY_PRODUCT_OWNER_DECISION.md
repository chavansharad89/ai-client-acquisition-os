# PATH 2 — CATEGORY PLAUSIBILITY

## Quote / Evidence Traceability — Product Owner Decision Record

**Decision ID:** EVID-TRACE-PO-DEC-001
**Status:** **DECIDED** (2026-09-29)
**Previous status:** PENDING PRODUCT OWNER DECISION
**Selected option:** **B — Existing-ID link**
**Authority granted by this record:** the written-reference rule for sanitized evidence entries on
session surfaces only (see §6)
**Preparation record:** `PATH_2_CATEGORY_PLAUSIBILITY_SERVICE_BLOCK_DOMAIN_TRACEABILITY_PRODUCT_OWNER_DECISION_PREPARATION.md`
(§3; rounds §5–§9; sha256 `1e658e1f04b577ff9aecfe03cf2b2c7839517130915caa2b7a384044ad777bfd`), kept unchanged for traceability
**Related records:** D11 §6 items 1 and 4; VS-READY-PO-DEC-001 §8.4, §9.3 (recorded item 2);
VS-PO-DEC-001 §2 items 3–4; URL-DOMAIN-PO-DEC-001
**Product Owner:** Product Owner, by explicit selection and values given in the working session on
2026-09-29, recorded here under that authorization
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`

**Revision history**

| Revision | Date | Change |
|---|---|---|
| 1 | 2026-09-29 | Rounds 1 and 2: option B selected; identifier selection and format not supplied (PENDING). Recorded in the preparation record only; this record was not created. |
| 2 | 2026-09-29 | Round 3: Product Owner supplied the identifiers and exact format. This record created. |

```text
EVID-TRACE-PO-DEC-001 ..... DECIDED — OPTION B, EXISTING-ID LINK
M-2 / Q-1 / D11 §6 ........ NOT MODIFIED
VALIDATION SESSION ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

---

## 1. Decision question

As prepared (preparation record §3.1): how is a sanitized reference written in D11-H §12 / Companion §4
matched back to the persisted real source URL and verbatim quote, without exposing identifying
information and without a new evidence mechanism?

## 2. Ruling

**Existing identifiers used (as supplied):**

1. M-2 source-document ID
2. Content hash
3. Determination ID
4. Segment position
5. Evidence position

**Exact written-reference format:**

```text
SRC=<M-2 source-document ID>; SHA256=<content hash>; DET=<Determination ID>; SEG=<segment position>; EV=<evidence position>
```

**Meaning (PO statement):** the M-2 source-document ID and content hash identify the persisted source;
`DET`, `SEG` and `EV` identify the relevant determination/segment/evidence location.

The identifiers and format are recorded exactly as supplied. No new identifier is created.

## 3. Existing-identifier check (read-only inspection; nothing executed)

| Identifier | Existing source |
|---|---|
| M-2 source-document ID | `id` of the persisted source document, returned by the Q-1 read (`categoryPlausibilityPgRepository.ts:182, 199`) |
| Content hash | `contentSha256`, a SHA-256 hex digest of the stored source text (`categoryPlausibilityPgRepository.ts:62–63, 207`) |
| Determination ID | `determinationId`, returned with each source document (`categoryPlausibilityPgRepository.ts:200`); the Companion §2 determination identifier |
| Segment position | Companion §4.x `Seg idx` |
| Evidence position | Companion §4.x `Ev #` |

The Q-1 route returns the stored objects unchanged
(`apps/web/app/api/category-plausibility/determinations/[id]/source-documents/route.ts:25`). These
files exist as uncommitted working-tree changes (VS-PO-DEC-001 §2 item 7). **Implementation
dependency: none.**

## 4. Consequences

- **D11 §6 item 1 (unchanged):** the real `sourceUrl` and verbatim `sourceQuote` remain in the persisted
  determination `evidence[]` and M-2 rows, readable through Q-1.
- **D11 §6 item 4 / §6.4 spot-check (unchanged):** the reviewer compares the quote against the persisted
  source located by the reference. The reference does not replace the comparison.
- **Written surfaces:** D11-H §12 and Companion §4 entries carry the sanitized fragment
  (VS-READY-PO-DEC-001 §9.3), the URL form of URL-DOMAIN-PO-DEC-001, and this reference.
- **Q-1 (unchanged):** it is owner-scoped, so resolving a reference runs as the account that owns the
  session's determinations (VS-PO-DEC-001 P13).

## 5. Implementation impact

```text
Application implementation required = NO
Evidence-mechanism change required . = NO
Schema change required ............. = NO
Migration required ................. = NO
New dependency required ............ = NO
New AI agent required .............. = NO
```

## 6. Authority boundary

This record authorizes only the written-reference rule above, applied during a separately authorized
session. It does **not** authorize: a validation session; participant contact; database access, SQL or
Q-1 calls; live fetching; provider, Anthropic, Google Search or Google Places calls; migrations;
determinations; creation of identifiers; browser validation; code, schema, configuration or dependency
changes; any change to M-2, Q-1, D11 §6.1 or §6.4; the Gate §11.8 edit; the redaction of earlier
VS-READY revisions; or any edit to the template, D11, D11-H, the Companion Record, the Gate Audit or
VS-READY-PO-DEC-001.

## 7. Status

```text
EVID-TRACE-PO-DEC-001 ..... DECIDED — B
Validation session ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

## STOP
