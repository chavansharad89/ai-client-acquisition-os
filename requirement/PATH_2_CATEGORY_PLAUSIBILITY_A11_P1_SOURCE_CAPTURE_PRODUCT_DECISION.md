# Path 2 — Category Plausibility

## A11-P1 Product Owner Decision — Source Capture Method (M-2 Selected)

```text
DECISION ID: A11-P1-PO-DEC-002
SUPERSEDES THE PENDING STATUS OF: A11-P1-PO-DEC-001 (record left unmodified)
DECISION: M-2 SELECTED — PERSIST MODEL-SEEN SOURCE TEXT
A11-P1 .................... DECIDED; IMPLEMENTATION PENDING SEPARATE AUTHORIZATION
A-11 ...................... OPEN
A-12 ...................... CLOSED
F-1 IMPLEMENTATION ........ NOT AUTHORIZED
D11 LIVE VALIDATION ....... NOT READY FOR LIVE VALIDATION
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

---

### §0 Scope

- This decision resolves **A11-P1 only**: the choice between the two source-capture methods documented in `PATH_2_CATEGORY_PLAUSIBILITY_A11_P1_SOURCE_CAPTURE_PRODUCT_DECISION_PENDING.md` (A11-P1-PO-DEC-001).
- It does not close A-11 or change any other item.
- It modifies no existing file. The `_PENDING` record and the A-11 evidence matrix are unchanged.

**Inputs verified for this decision** (HEAD `5992b82`):

| Input | Relevant content |
|---|---|
| A-11 definition (F-1 Consolidated Audit §18) | "Capture of the fetched source for the §6.3 substantive check and the §6.4 spot-check … Fetched text is not persisted … **live-validation prerequisite**". Repository precedent: "None". |
| Gate Audit §11 item 6 | "fetched homepage text is not persisted. The facilitator must save or snapshot the source page at session time so the D11-E manual spot-check is against **the document the model actually saw**." |
| D11 §6.4 (locked) | "comparing the cited quote directly against **the actual fetched source document**" |
| F1-D §8 (§6.3 substantive part) | the facilitator "reads the cited quotes **in their source**" |
| Consolidated Audit §13 | "The live page may drift from what the model saw (A-11)." |
| `packages/core-research/src/sourceDocumentProvider.ts` | Fetches `https://{normalizedDomain}` (line 165). Runs the HTML through JSDOM + Readability. Keeps `textContent`, trimmed with whitespace collapsed (`.replace(/\s+/g, ' ')`, line 142), minimum 200 characters. Returns `[{ label: 'Homepage', url, text }]` (line 181). The HTML and the text are held in memory only. |
| `packages/core-research/src/provenance.ts` | Quote verification runs against `normaliseForMatch(doc.text)` (line 113), i.e. against the extracted text, not the page |
| Migration `0027_category_plausibility_determinations` | Columns: `id`, `search_id`, `prospect_id`, `target_customer`, `target_segments`, `aggregate_result`, `segment_results`, `observed_at`, `superseded_at`, `created_at`. **No source-text column.** |
| Current state | A-11 OPEN (evidence matrix §0); A-12 CLOSED (Companion line 15); F-1 NOT AUTHORIZED; D11 NOT READY FOR LIVE VALIDATION |

---

### §1 Decision

```text
M-2 SELECTED
```

The source text actually supplied to the model shall be persisted by the system and used as
the source for the D11 §6.3 substantive check and the §6.4 spot-check. That text is the
`SourceDocument.text` produced by `sourceDocumentProvider.ts`, together with its `url` and
`label`.

M-1 (facilitator snapshot) is **not** selected as the A-11 capture method.

---

### §2 Rationale

1. **Purpose of A-11.** A-11 exists so that §6.3 and §6.4 can be performed against the source the model used. The governing texts name that target directly:
   - D11 §6.4: "the actual fetched source document";
   - Gate Audit §11.6: "the document the model actually saw".
   - M-2 is the only method that preserves that object. M-1 preserves a different object: the page as it exists at session time.
2. **§6.4 needs.** §6.4 confirms that the cited quote occurs verbatim in the fetched source. The model received **Readability-extracted, whitespace-collapsed text**, not the page (`sourceDocumentProvider.ts:142`), and the system's own verification runs against that text (`provenance.ts:113`).
   - A facilitator snapshot, even one taken at the same moment, is a different representation: rendered page, HTML or screenshot.
   - Readability may leave out page content, or keep content the facilitator does not see as one run of text.
   - So a mismatch found against a snapshot cannot be attributed to the model or the pipeline, and a match does not confirm what the model saw.
3. **§6.3 needs.** The substantive check asks whether the verdict depends on a premise **not present in the cited quotes**, read in their source (F1-D §5 b–c, §8). To read that context correctly, the reviewer needs the text around the quotes as the model received it. Under M-1, anything added or removed on the page since the model read it would change that context.
4. **Source fidelity.** M-1's gap has two parts:
   - timing: the page may change between fetch and snapshot (Consolidated Audit §13);
   - representation: a snapshot is not the extracted text (point 2).
   Recording the time gap addresses the first part only. M-2 has neither gap, provided the implementation persists the exact `text` that was supplied (§4).
5. **Auditability.** Under M-2, the capture is created by the same run that produced the determination. It can be linked to that determination and checked later by hash. Under M-1, the capture depends on a manual step at session time and cannot be checked afterwards against the model's input.
6. **Repository constraints.** M-2 requires code and schema changes and so a separate implementation authorization (§5). This is a cost, not a disqualifier:
   - A-11 is already a live-validation prerequisite;
   - live validation is already blocked on F-1, which also needs authorization.
   Selecting M-2 makes A11-P2 in the evidence matrix applicable. It does not authorize it.

**Residual point, recorded rather than resolved.**
- D11 §6.4's rationale is that the spot-check must not rely "solely on whatever automated provenance mechanism the implementation provides".
- Under M-2 the *captured text* comes from the system, but the *comparison* stays manual and must not reuse the verification code's result (§6, criterion 5).
- This decision treats persistence of the input as a capture mechanism, not a provenance-verification mechanism. [PRODUCT-OWNER INTERPRETATION]

---

### §3 Required Capture Contract

The minimum evidence M-2 must ultimately produce, for each source document supplied to a
category-plausibility research run.

- **Existing** = the value already exists in the repository today, in memory or in the persisted row.
- **NEWLY PROPOSED** = required by this decision but with no repository precedent. Its final form is set by the implementation authorization.

| Field | Status | Purpose |
|---|---|---|
| Source URL (`SourceDocument.url`, as supplied to the model) | Existing (in memory, `sourceDocumentProvider.ts:181`) | Matches cited `sourceUrl` |
| Source label (`SourceDocument.label`, currently `Homepage`) | Existing (in memory) | Matches cited `sourceLabel` |
| Captured content = the exact `SourceDocument.text` supplied to the model, unmodified | Existing in memory only; **persistence NEWLY PROPOSED** | §6.3 context; §6.4 verbatim comparison |
| Search ID, Prospect ID | Existing (`category_plausibility_determinations.search_id`, `prospect_id`) | Traceability |
| Determination ID linkage (the row whose evidence cites this source) | `id` exists; **the link from capture to determination is NEWLY PROPOSED** | Traceability to the Companion §2 register |
| Opportunity ID | **Not stored on the determination row.** It is resolved through the Prospect and recorded in the Companion (§1–§2). No new requirement. | Correlation with D11-H |
| Fetch timestamp | **NEWLY PROPOSED**. The nearest existing value is `observed_at` on the determination. | Ordering; shows the capture belongs to this run |
| Content hash (SHA-256 or equivalent) | **NEWLY PROPOSED** | Later integrity check |
| Capture-kind indicator: `MODEL_SEEN_SOURCE` | **NEWLY PROPOSED** | Separates M-2 captures from any other copy |
| Extraction identity (enough to show the text came from the provider's extraction path) | **NEWLY PROPOSED**; exact form open (Q-2) | Shows it is the model's representation, not a re-extraction |
| Raw HTML | **Not required** by this decision; open (Q-3) | — |

A later independent reviewer must be able to take a Companion row (Determination ID, segment
index, cited evidence), find the persisted text for each cited `sourceUrl`, and perform §6.3
and §6.4 using only that record.

---

### §4 Exactness / Provenance Rule

- M-2 is expected to preserve **the exact text seen by the model**: the `SourceDocument.text` object passed into the research input, not a later re-fetch or re-extraction.
- **The implementation must establish this.** It must persist the same value that was supplied to the provider and show it by test (§6).
- A copy produced by fetching or extracting again, even with the same code, does **not** meet this rule.
- If a run supplies no source document (the provider returns `[]`), there is nothing to capture, and that must be recorded as "no source supplied". No text may be fabricated (`sourceDocumentProvider.ts:20-22`).
- A facilitator snapshot is not an A-11 capture under this decision. A facilitator may still keep one as a working note; it carries no A-11 evidentiary weight.

---

### §5 Implementation Boundary

**Likely implementation surfaces** (identified only; none modified):
- the path from `fetchSourceDocuments` to the research input: `sourceDocumentProvider.ts`, and its callers `anthropicResearchProvider.ts` and `fallbackResearchProvider.ts`, where the supplied documents are available;
- persistence: a new migration after `0027`, and `packages/core-research/src/categoryPlausibilityPgRepository.ts`, the current writer of `category_plausibility_determinations`;
- read access for reviewers (a query or internal read path). No UI is implied;
- tests for the above.

**Implementation requires a separate authorization.** That authorization must also settle:
- retention and access rules (Q-1);
- the exact field forms marked NEWLY PROPOSED in §3.

This decision modifies no implementation file. It does not bundle M-2 with F-1: F-1
implementation remains **NOT AUTHORIZED**, and any M-2 authorization is a separate act.

---

### §6 Acceptance Criteria for Eventual Implementation (read-only)

A later read-only audit shall accept an M-2 implementation only if:

1. **Exactness.** For every source document supplied to a category-plausibility research run, the persisted text is byte-identical to the `text` value passed to the provider. This is shown by a test that compares the supplied value with the persisted value, not with a re-extraction.
2. **§6.4 support.** For a determination with MATCH/MISMATCH evidence, each cited `sourceQuote` can be located verbatim (under the same normalisation the verification uses) in the persisted text for its cited `sourceUrl`. The reviewer does this manually from the persisted record alone.
3. **§6.3 support.** The persisted text is complete enough to read each cited quote in its surrounding context. Nothing is truncated beyond what the model itself received.
4. **Traceability.** Each capture resolves to Search ID, Prospect ID and Determination ID, and via the Companion to Opportunity ID and segment index. A capture that cannot be linked is invalid.
5. **Independent later review.** The persisted record can be read without re-running the research, calling a provider, or using the verification code's result. Its content hash verifies.
6. **No fabrication or alteration.** A run with no supplied document records that fact. Stored text is never edited after capture.
7. **Preservation.** The implementation changes no D11-H, F1-D, D0–D11, participant-facing instrument or A-12 Companion content, and does not change the ResearchSignal meaning of OBSERVED / INFERRED / UNKNOWN.

Meeting these criteria satisfies A11-P2 in the evidence matrix only. A11-E1 to A11-E3 still
require live evidence from an authorized session.

---

### §7 Out-of-Scope D11 Items

The following remain **D11 requirements** and are **not** A-11 closure criteria:
- live MATCH/MISMATCH/UNKNOWN;
- historical Search + Prospect validation;
- participant validation;
- provider neutrality;
- provider credentials/readiness.

### §8 Authority

This decision selects the A11-P1 source-capture method only. It grants no implementation authority, no schema/migration authority, no production-code modification authority, and no live-validation authority.

It also grants no authority to modify D11-H, F1-D, D0–D11, the participant-facing
instrument, the A-12 Companion Record, the `_PENDING` record or the A-11 evidence matrix.

### Open questions (do not block the selection)

| # | Question |
|---|---|
| Q-1 | Retention period and access control for persisted source text (PENDING record §5 Q6) |
| Q-2 | What exactly identifies the extraction path (for example provider version or a code reference) |
| Q-3 | Whether raw HTML should also be kept, as supplementary material only |

### §9 Status

```text
A11-P1 — DECIDED; IMPLEMENTATION PENDING SEPARATE AUTHORIZATION.
A-11 ...................... OPEN
F-1 IMPLEMENTATION ........ NOT AUTHORIZED
D11 LIVE VALIDATION ....... NOT READY FOR LIVE VALIDATION
```

## STOP
