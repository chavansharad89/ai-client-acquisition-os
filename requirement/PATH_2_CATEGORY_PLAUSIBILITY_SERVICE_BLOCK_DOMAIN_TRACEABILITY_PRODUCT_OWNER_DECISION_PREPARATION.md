# PATH 2 — CATEGORY PLAUSIBILITY

## Service-Definition Block, URL-Domain Anonymization and Quote/Evidence Traceability — Product Owner Decision Preparation

**Decision IDs (reserved):**
- SVC-BLOCK-PO-DEC-001 — Question 1 (template Service-definition block, remaining fields)
- URL-DOMAIN-PO-DEC-001 — Question 2 (source URL-domain anonymization)
- EVID-TRACE-PO-DEC-001 — Question 3 (sanitized reference ↔ verbatim quote traceability)

**Status:** **DECIDED** (all three, in round 3; see §10 and the standalone decision records). Earlier status: PENDING (§6, §8).
**Parent records:** `PATH_2_CATEGORY_PLAUSIBILITY_SESSION_READINESS_BLOCKERS_PRODUCT_OWNER_DECISION.md`
(VS-READY-PO-DEC-001, revision 5, §9.3 and §9.7); `PATH_2_CATEGORY_PLAUSIBILITY_TEMPLATE_SEARCH_ID_MAPPING_PRODUCT_OWNER_DECISION.md`
(TPL-SEARCH-ID-PO-DEC-001, §4.3)
**Repository HEAD at drafting:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
THIS RECORD ............... PREPARATION ONLY — NO DECISION, NO EXECUTION AUTHORITY
TEMPLATE .................. NOT MODIFIED
D11 / D11-H / COMPANION ... NOT MODIFIED
GATE AUDIT ................ NOT MODIFIED
```

This record prepares three narrowly scoped questions left open by VS-READY-PO-DEC-001 §9.7 and
TPL-SEARCH-ID-PO-DEC-001 §4.3. It makes no decision, ranks no option and recommends nothing. Option
letters are labels only; their order carries no preference. It does not modify
`MVP_REAL_USER_VALIDATION_TEMPLATE.md`, D11, D11-H, the Companion Record, the Gate Audit,
VS-PO-DEC-001, P8-PO-DEC-001, SESSION-ID-PO-DEC-001, TPL-SEARCH-ID-PO-DEC-001 or VS-READY-PO-DEC-001.

New text in this record uses `Business A` only (VS-READY-PO-DEC-001 §8.4).

---

## 1. Question 1 — Service-definition block: Target customer, Geography, Minimum project value

### 1.1 Gap

The template block "Service definition used (§3 stage 1 — as entered by the participant, not
assumed)" has one set of four fields: Service, Target customer, Geography, Minimum project value
(template l.23–30). The **Service** field is decided (TPL-SEARCH-ID-PO-DEC-001 §4.2, combined PO text).
The other three fields are not: VS-READY-PO-DEC-001 §3 R-3 records two different values for each, and
no record states what is entered in the single field (TPL-SEARCH-ID-PO-DEC-001 §4.3).

### 1.2 What the governing records already establish

| Fact | Source |
|---|---|
| Search 1: Target customer `EdTech platforms; private universities; test-prep institutes`; Geography `Mumbai Metropolitan Region (MMR)`; Minimum project value `₹1,00,000` | VS-READY-PO-DEC-001 §3 R-3 |
| Search 2: Target customer `Boutique hotels; luxury resorts; travel aggregator platforms`; Geography `Pan-India`; Minimum project value `₹50,000` | VS-READY-PO-DEC-001 §3 R-3 |
| The R-3 values are the values entered in the Search form | TPL-SEARCH-ID-PO-DEC-001 §4.2 |
| R-8 (block) = B — facilitator records the planned inputs in the block with a preplanned note | VS-READY-PO-DEC-001 §3 R-8 |
| One combined template copy for the session; Search ID field = `MULTI`; per-answer Search ID from Companion §2 | TPL-SEARCH-ID-PO-DEC-001 §2 |
| Per-Search inputs are traced in D11-H §3 (Search / Prospect Under Observation) | D11-H §3 |
| The template is not modified | D11 §9; VS-PO-DEC-001 §9.10 |

### 1.3 Options (unranked)

| Option | Content | Required value | Consequences |
|---|---|---|---|
| **A** | Each of the three fields holds both Searches' R-3 values in a labelled Search 1 / Search 2 structure. | The exact layout/format of the labelled entry. The R-3 values themselves are already recorded verbatim and are not re-supplied. | Each field is complete and traceable to R-3 without a separate lookup; the fields hold more than one value. |
| **B** | Each of the three fields holds a single PO-approved combined description (as done for the Service field). | Exact PO-approved text for **each** of Target customer, Geography and Minimum project value. | One value per field, consistent with the Service-field ruling; the combined text does not equal either Search's form input. |
| **C** | The three fields are treated as non-authoritative (left with a facilitator note pointing to D11-H §3 / Companion); Search-specific values are recorded only in D11-H §3 / Companion. | The exact facilitator-note wording, if the PO wishes to fix it; otherwise none. | The block is incomplete by design; the authoritative per-Search values sit only in D11-H §3 / Companion. |
| **D — Other** | A treatment stated by the Product Owner. | Whatever exact text/values the treatment needs. | — |

**Implementation:** none under A–C (session-time recording rule only; no template, UI or code change).
**Additional authorization:** none.

---

## 2. Question 2 — Source URL-domain anonymization

### 2.1 Gap

The PO ruling (VS-READY-PO-DEC-001 §9.3) is: "Retain source URL domains and hash-masked deep links with
sanitized, generic descriptive fragments replacing identifying text strings." The label `Business A`
applies to source URLs, evidence/quotes, D11-H, Companion and participant-facing material (§8.4). A
retained first-party domain can itself identify the business. No record states whether the
"retain source URL domains" rule or the `Business A` scope governs in that case (§9.3 recorded item 1).

### 2.2 Options (unranked)

| Option | Content | Required value | Consequences |
|---|---|---|---|
| **A** | Domain may remain visible — retain source URL domains even if they identify the business. | None. | The §9.3 ruling applies as written; a written session surface may identify Business A through its domain. |
| **B** | Domain must be anonymized — replace identifying domains with an approved neutral representation that keeps enough information for traceability. | The exact neutral representation/format (e.g. a fixed literal or pattern stated by the PO). | No written session surface exposes an identifying domain; traceability depends on the representation chosen and on Question 3. |
| **C** | Conditional — retain a domain only when it does not identify Business A; otherwise anonymize it. | The exact representation/format for the anonymized case; and who decides "identifies" (e.g. facilitator judgment) if the PO wishes to fix it. | Non-identifying domains (e.g. third-party directories) stay readable; identifying ones are replaced. A per-URL judgment is made at session time. |
| **D — Other** | A treatment stated by the Product Owner. | Whatever exact text/format the treatment needs. | — |

This preparation did not inspect Business A's website or any domain, and performed no lookup.

**Implementation:** none under A–C (recording rule for written session surfaces only; persisted rows
and the Q-1 response are not altered). **Additional authorization:** none.

---

## 3. Question 3 — Quote / evidence traceability

### 3.1 Gap

Existing constraints (unchanged by this record):

- D11 §6 item 1: every OBSERVED claim underlying a reviewed MATCH/MISMATCH has an `evidence[]` entry
  with a real `sourceUrl` and a verbatim `sourceQuote`.
- D11 §6 item 4 (the "§6.4" spot-check, VS §9.5): a technical reviewer compares the cited quote against
  the actual fetched source document.
- M-2 persists the model-seen source text at the capture point with hash, capture kind, extraction
  method and fetch time; Q-1 is an owner-scoped, read-only reviewer route returning those documents
  (VS-PO-DEC-001 §2 items 3–4; A11-P1 source-capture decision §4 item 5).
- D11-H §12 ("Source URL", "Quote") and Companion §4.x ("Cited evidence (verbatim, as stored)":
  `sourceUrl`, `sourceLabel`, `sourceQuote`) are session surfaces under the `Business A` scope (§8.4).
- PO ruling: identifying text strings are replaced by "sanitized, generic descriptive fragments" (§9.3).
- No new evidence mechanism is authorized.

No record states how a sanitized reference written in D11-H §12 / Companion §4 is matched back to the
persisted real URL and verbatim quote (§9.3 recorded item 2).

### 3.2 Options (unranked)

| Option | Content | Required value | Consequences |
|---|---|---|---|
| **A** | The real source URL and verbatim quote remain only in the owner-scoped persisted evidence/source record (determination `evidence[]` + M-2 rows via Q-1); every written session surface uses sanitized references. | None, unless the PO fixes the wording of the sanitized reference. | The spot-check and §6.3 reading are performed against Q-1; the written records do not themselves carry the verbatim quote. How a sanitized entry is located in Q-1 is left to Det # / Seg idx / Ev # already in the Companion. |
| **B** | Each sanitized entry carries a stable reference to an **existing** identifier — the M-2 source-document ID and/or its content hash, plus the determination/segment/evidence position — linking it to the persisted source and quote, without exposing the real URL/name. | Which existing identifier(s) are written, and the exact format. | Explicit one-to-one trace from each written entry to the persisted record. Uses identifiers M-2 already stores; if the chosen identifier is not exposed by Q-1 or not already stored, that would be an implementation dependency requiring separate authorization (not performed here). |
| **C** | Only the sanitized quote/reference is preserved in written records; the §6.4 spot-check relies on M-2 internally (via Q-1) at session time, and no additional linkage is recorded. | None. | Simplest written record; after the session, the link from a written entry to the verbatim quote is not recorded and must be re-established from the persisted record if needed. |
| **D — Other** | A treatment stated by the Product Owner. | Whatever exact text/format the treatment needs. | — |

Under every option D11 §6.1 and §6.4, Q-1 and M-2 are unchanged, and the persisted rows keep the real
URL and text.

**Implementation:** none under A or C. Under B, none if the identifier chosen is already stored and
readable through Q-1; otherwise a recorded implementation/evidence-mechanism dependency.
**Additional authorization:** none under A or C; possibly under B, as stated.

---

## 4. Authorization boundary

This record authorizes nothing: no validation session, participant contact, provider, Anthropic,
Google Search or Places call, live fetch, database access or SQL, Session ID generation,
determination, Gate §11.8 edit, historical redaction, `Business A` ↔ real-name mapping, template
change or implementation.

## 5. Decision round 1 — outcome (2026-09-29)

One structured Product Owner decision round was held on the options in §1.3, §2.2 and §3.2. Selections
are recorded exactly as made. No required value was supplied for any question, so no decision record
is created and each question stays PENDING (TPL-SEARCH-ID precedent: VS-READY-PO-DEC-001 §8.5).

| Question | PO selection (as made) | Required value supplied? | Status | Required follow-up |
|---|---|---|---|---|
| Q1 — SVC-BLOCK-PO-DEC-001 | **None.** The response contained a task specification, not a selection among A / B / C / D. | — | **PENDING** | Option selection; then the exact value(s) that option requires (§1.3). |
| Q2 — URL-DOMAIN-PO-DEC-001 | **B — Always anonymize** (§2.2 option B) | **No** | **PENDING** — option B selected | Exact neutral representation/format for an identifying domain. |
| Q3 — EVID-TRACE-PO-DEC-001 | **B — Existing-ID link** (§3.2 option B) | **No** | **PENDING** — option B selected | Which existing identifier(s) are written (M-2 source-document ID and/or content hash; Det # / Seg idx / Ev # position) and the exact format. |

**Recorded, not reconciled.** The Q1 response text also restated Q2 and Q3 with different option sets
and letter assignments (Q2: A retain all / B conditional masking / C mask all identifying domains;
Q3: A internal evidence key / B hash-based trace / C dual record / D no sanitized quote). The Q2 and Q3
selections above were made against this record's labels (§2.2, §3.2) and are recorded under those
labels only. No mapping between the two option sets is inferred.

**Dependency recorded (Q3 = B), not performed.** If the identifier(s) the PO later specifies are not
already stored by M-2 and readable through Q-1, an implementation/evidence-mechanism authorization is
required (§3.2). No such check, implementation or authorization is made here.

## 6. Status after round 1 (retained for traceability; superseded by §8)

```text
SVC-BLOCK-PO-DEC-001 ...... PENDING — no option selected
URL-DOMAIN-PO-DEC-001 ..... PENDING — B selected; exact domain representation missing
EVID-TRACE-PO-DEC-001 ..... PENDING — B selected; identifier(s) and format missing
Validation session ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

## 7. Decision round 2 — outcome (2026-09-29)

A second structured round was held on the option sets in §1.3, §2.2 and §3.2 of this record, and only
those. The round asked for exact values to be supplied with the selection. Selections are recorded
exactly as made. No exact value, text or format was supplied for any question, so no decision record is
created and each question stays PENDING. Round 1 (§5–§6) is not rewritten.

| Question | PO selection (as made) | Required value supplied? | Status | Required follow-up |
|---|---|---|---|---|
| Q1 — SVC-BLOCK-PO-DEC-001 | **B — Combined text** (§1.3 option B) | **No** | **PENDING** — option B selected | Exact PO-approved text for each of: Target customer; Geography; Minimum project value. |
| Q2 — URL-DOMAIN-PO-DEC-001 | **C — Conditional** (§2.2 option C) | **No** | **PENDING** — option C selected | Exact replacement representation and exact format for an identifying domain. |
| Q3 — EVID-TRACE-PO-DEC-001 | **B — Existing-ID link** (§3.2 option B) | **No** | **PENDING** — option B selected | Exact identifier selection (M-2 source-document ID; content hash; Det # / Seg idx / Ev # position; or a stated combination) and exact identifier format. |

**Change of selection recorded, not interpreted.** Q2 was **B — Always anonymize** in round 1 (§5) and
is **C — Conditional** in round 2. The round 2 selection is the current one. No reason was stated, and
none is inferred.

**Dependency (Q3 = B), unchanged from §5:** if the identifier(s) the PO later specifies are not already
stored by M-2 and readable through Q-1, an implementation or evidence-mechanism authorization is
required. No check, implementation or authorization is made here.

**Not executed (unchanged):** the authorized Gate §11.8 edit and the authorized redaction of earlier
VS-READY revisions. The following remain session-time only: P5 runtime checks, P7 participant
arrangement, P8 execution, Session ID assignment, D11-H / Companion live fields, and the session-start
fingerprint re-capture.

## 8. Status after round 2 (retained for traceability; superseded by §10)

```text
SVC-BLOCK-PO-DEC-001 ...... PENDING — B selected; exact text for 3 fields missing
URL-DOMAIN-PO-DEC-001 ..... PENDING — C selected; exact representation + format missing
EVID-TRACE-PO-DEC-001 ..... PENDING — B selected; identifier selection + format missing
Validation session ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

## 9. Decision round 3 — required values supplied (2026-09-29)

The Product Owner supplied the required exact values for the round 2 selections (Q1 = B, Q2 = C,
Q3 = B), which are unchanged. With every required value present, each question is decided in its own
standalone decision record (the TPL-SEARCH-ID precedent). The exact values are recorded verbatim in
those records only, and are not restated here. Rounds 1 and 2 (§5–§8) are not rewritten.

| Question | Selection | Decision record |
|---|---|---|
| Q1 — SVC-BLOCK-PO-DEC-001 | B — Combined text | `PATH_2_CATEGORY_PLAUSIBILITY_SERVICE_BLOCK_PRODUCT_OWNER_DECISION.md` |
| Q2 — URL-DOMAIN-PO-DEC-001 | C — Conditional | `PATH_2_CATEGORY_PLAUSIBILITY_URL_DOMAIN_PRODUCT_OWNER_DECISION.md` |
| Q3 — EVID-TRACE-PO-DEC-001 | B — Existing-ID link | `PATH_2_CATEGORY_PLAUSIBILITY_EVIDENCE_TRACEABILITY_PRODUCT_OWNER_DECISION.md` |

**Q3 dependency (§3.2, §5, §7) — resolved by read-only inspection; no implementation required.** The
M-2 repository read used by Q-1 returns the source-document `id`, `determinationId` and `contentSha256`
(a SHA-256 hex digest) for each persisted document, and the Q-1 route returns those objects unchanged
(`packages/core-research/src/categoryPlausibilityPgRepository.ts:62–63, 177–211`;
`apps/web/app/api/category-plausibility/determinations/[id]/source-documents/route.ts:25`). The segment
and evidence positions are the existing Companion `Seg idx` and `Ev #` positions. No implementation
authorization is needed. These files exist as uncommitted working-tree changes (VS-PO-DEC-001 §2
item 7).

## 10. Status (current)

```text
SVC-BLOCK-PO-DEC-001 ...... DECIDED — B (see decision record)
URL-DOMAIN-PO-DEC-001 ..... DECIDED — C (see decision record)
EVID-TRACE-PO-DEC-001 ..... DECIDED — B (see decision record)
Validation session ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

## STOP
