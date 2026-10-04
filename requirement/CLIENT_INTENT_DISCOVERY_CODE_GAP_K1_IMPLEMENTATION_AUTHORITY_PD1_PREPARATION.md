# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — IMPLEMENTATION AUTHORITY (PD-1) PREPARATION

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPLEMENTATION-AUTHORITY-PD1-PREPARATION-001
**Date:** 2026-10-02
**Type:** Decision-preparation record. Not a Product Owner decision, not an engineering decision, not an audit,
**not an implementation authorization**.
**Author role:** Governance/engineering reviewer preparing the PD-1 evidence package.

---

## 1. Purpose

This record prepares the evidence and decision material the Product Owner needs to decide **PD-1**: whether
implementation of K1 (the personal-contact-identifier detector and its enforcement on the provider and non-provider
intake paths) according to `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md`
("REV-005") is authorized. This record is strictly read-only / preparation work; it grants no authorization and
makes no policy or engineering decision of its own.

---

## 2. Baseline

- Branch: `feature/client-intent-discovery-complete`
- HEAD: `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` (unchanged throughout this review)
- Staged files: 0 (unchanged throughout this review)
- Working tree: only files under `requirement/` are modified/untracked (37 entries at review start and end); no
  source code, test, schema, migration, dependency or configuration file is touched
- Hashes re-verified independently during this review, all MATCH the values supplied and the values REV-005 and its
  audit cite:
  - `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION_AMENDMENT_004.md` →
    `c5b0b364dc630ff258570073c564935e31720a1cd59b98f66be281327f311295`
  - `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md` →
    `cec9fde59c27215beeeae9ac93ef1d3e6026ac80efa1f58ef4cf70e76bb44f5f`
  - `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005_CONFORMANCE_AUDIT.md` →
    `d59bdd04dc050c2bfc425d9f53a3a21e17b95b4110fa65873bc171917db4086d`
- No existing PD-1 preparation/questionnaire record was found under `requirement/` prior to this record (searched
  for `PD1`, `PD-1`, `AUTHORITY` in filenames — none existed).

---

## 3. Governing records (read or cross-checked for this review)

| # | Record | Status |
|---|---|---|
| 1 | `…_K1_POLICY_GAPS_PRODUCT_OWNER_DECISION.md` (PG-1..PG-4) | Located; cross-checked against REV-005 §2/§12 (already independently verified word-for-word by the REV-005 audit) |
| 2 | K1-I1..K1-I6 (in `…_K1_IMPLEMENTATION_SEMANTICS_PRODUCT_OWNER_DECISION.md`) | Located; condensed restatement in REV-005 §2 accepted (audited in AUDIT-005 §12) |
| 3 | PG decision record | Same as #1 |
| 4 | ED-DEC-001 (`…_K1_ENGINEERING_DECISION.md`), ED-DEC-002 (`…_AMENDMENT.md`), ED-DEC-003 (`…_AMENDMENT_003.md`), ED-DEC-004 (`…_AMENDMENT_004.md`) | Located; full lineage chain present, hashes cited in REV-005 §Lineage |
| 5 | REV-005 (`…_K1_ENGINEERING_SPECIFICATION_REVISION_005.md`) | Read in full (925 lines) |
| 6 | REV-005 conformance audit | Read in full (502 lines); verdict READY FOR IMPLEMENTATION-AUTHORITY REVIEW |
| 7 | REV-004 conformance audit, REV-003 conformance audit | Located; REV-005 explicitly carries forward 7 findings from these (R4-M1, R3-M3, R3-M5, R3-M6, R3-M7, R3-M9, §4.11(c)); not re-read in full here, already cross-checked by the REV-005 audit (§13) |
| 8 | DEC-003 | Referenced in REV-005 §2 closing line ("Not changed and not touched: … DEC-003"); not separately re-opened |
| 9 | CONTRACT-REC, ADAPTER-REC, READINESS-001 | CONTRACT-REC is a label used across multiple governing records (e.g. `screenProviderKeys` CONTRACT-REC §3 screen cited in REV-005 §2 PG-2, §5, §10.6); it is not a separate standalone file under `requirement/` but an internal section-reference within the governing contract documentation already incorporated into REV-005. ADAPTER-REC and READINESS-001 were **not located** as distinct governing records under `requirement/` or elsewhere in the repository; noted as not located rather than invented |
| 10 | `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` and related PRD records | Located (currently shown as modified in git status, pre-existing and untouched by this review per REV-005 §1 baseline note) |

**Classification of dependency status for each item above:** see §8/§9/§10 below.

---

## 4. Current K1 status

- K1 governing policy (K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4) is **DECIDED** and, per REV-005 §2 and the REV-005
  audit §12, not reinterpreted anywhere in the current engineering specification.
- The K1 engineering specification has reached **rev. 5** (REV-005), amended through ED-DEC-001..004, each round
  followed by an independent conformance audit (AUDIT-001, AUDIT-R3, AUDIT-R4, AUDIT-005/REV-005's own audit).
- The REV-005 conformance audit verdict is **READY FOR IMPLEMENTATION-AUTHORITY REVIEW** — no critical or major
  findings, one new minor non-blocking drafting ambiguity (NEW-1, §11 below), 7/7 carried-forward findings preserved
  and accurately described, no Product Owner decision required by the audit.
- **No code implements K1 today.** `grep` (repeated independently in this review, consistent with the REV-005 audit
  §2/§11) confirms no file `packages/core-research/src/contactIdentifiers.ts` exists and no symbol
  `detectContactIdentifiers` / `containsPersonalContactIdentifier` / `containsAnyContactIdentifier` exists anywhere
  under `packages/`. The only contact-identifier screening in current code is the pre-existing
  `isPersonalContactIdentifier` regex-based function in `packages/core-research/src/intentSignal.ts`.
- PD-1 (implementation authorization) is **PENDING**. REV-005 §11 states explicitly: "Implementation authorized:
  NO. Validation authorized: NO. Implementation performed: NO."

---

## 5. Exact PD-1 question

**PD-1 asks exactly:** *Is implementation of K1 (the detector module and its enforcement on the provider-result and
non-provider-intake lifecycles) according to REV-005 authorized?*

PD-1 does **not** ask, and a PD-1-A decision does **not** by itself grant:
- Validation authorization (running the implemented detector against real or sampled data to assess volume/precision
  effects, e.g. the open R3-M6 "EG-1 volume review")
- Provider/API-call authorization
- Participant-contact authorization
- External-research authorization
- Deployment/release authorization
- Commit/push authorization

Each of the above, if needed, requires its own separate authorization step, not implied by PD-1.

---

## 6. Implementation scope (derived from REV-005, factual inventory)

**Detector** (REV-005 §4): new module `packages/core-research/src/contactIdentifiers.ts` (not exported from the
package `index.ts`), exporting `detectContactIdentifiers`, `containsPersonalContactIdentifier`,
`containsAnyContactIdentifier`; return-kind enum `ContactIdentifierKind` = `BUSINESS_EMAIL | PERSONAL_EMAIL |
UNCERTAIN_EMAIL | PHONE | FRAGMENT`. Scope includes: domain canonicalization via existing `normalizeDomain`
(§4.2); business-domain classification (§4.2, no public-suffix/related-domain lookup); email detection incl.
contiguous, `mailto:`, spaced, bracketed and word-form obfuscation (§4.4.1–§4.4.5); phone detection incl. number
words, masks, mask units, extensions, `tel:`/`sms:` URIs (§4.5–§4.6, §4.9); uncertain-identifier handling (K1-I4,
§4.4.4 E-5, §4.6.6 U4); fragment handling (§4.4.4 E-3/E-5, §4.6.6 U1/U3); exclusion recognizers for dates, prices,
units, versions/IPv4 and labelled reference numbers (§4.8); Unicode normalization (NFKC, format-char stripping,
non-ASCII digit mapping, §4.3); masking behaviour is detection-only — no value is masked, stripped or rewritten in
storage (C-1).

**Provider path** (REV-005 §6): a private helper inside `packages/core-research/src/intentSourceProviderContract.ts`,
called once in each of `preparePublicWeb` (source line ~387), `prepareAiPlatform` (source line ~454), and
`preparePublicIntent` (source line ~521) — all three verified present in current source at this review
(`grep -n "function preparePublicWeb\|function prepareAiPlatform\|function preparePublicIntent"`). REV-005 specifies
the K1 call site as immediately after the existing `UNATTRIBUTED` skip and before `raw` is built; this review
confirmed in `preparePublicWeb` (lines 387–428) that the `UNATTRIBUTED` skip (identity check `hasIdentity`) occurs
before the `raw` object is constructed, consistent with REV-005's placement claim. K1 enforcement screens evidence
statements with `containsPersonalContactIdentifier` and `context.targetCustomer` / `context.geography` /
`context.service` with `containsAnyContactIdentifier`; first hit rejects the whole `IntentProviderResult`
(`reject(path, 'not-allowed', message)`).

**Intake path** (REV-005 §7): inline at the end of `toIntentSignalInput` (confirmed present in
`packages/core-research/src/intentSignal.ts`, function declared at source line 257; `quote` extracted via
`requiredString(raw.quote, 'quote', …)` at line 293), after authorization evidence, before `return`. K1 enforcement
throws `IntentSignalValidationError('quote', 'not-allowed', …)` when `containsPersonalContactIdentifier(quote,
website)` is true. `toIntentIntakeInput` (declared at source line 387) re-prefixes the field path for the
multi-signal form.

**Context fields** (REV-005 §5, §6): `context.targetCustomer`, `context.geography`, `context.service` — existing
CONTRACT-REC §3 screen (`screenProviderKeys`) runs first, unweakened; K1's `containsAnyContactIdentifier` then adds a
further screen; net effect — no email (business or personal) or phone may appear in any `context.*` value; not
carried on non-provider intake at all.

**Transient/pushed-result fields** (REV-005 §5, PG-3 scope): `title`, `snippet`, `body`, `authorization.basis` are
explicitly **not screened** by K1 while transient — they build the local `sourceText` used by `checkVerbatim` /
`requireText` only, never enter `raw`, the event, intake or a saved row, and on the pushed path travel only inside
the existing opaque in-memory proof (private `ISSUED` WeakMap) re-read only by the existing X1 re-derivation. If any
of these conditions stops holding for a field, K1-I5 rule 2 requires it to be screened (no implementation discretion
to silently narrow this condition).

**Error/rejection behaviour** (REV-005 §8): rejection unit = whole `IntentProviderResult` (provider path, K1-I6) or
whole intake event (intake path, PG-4); reason = `not-allowed` in all three table rows; `field` = offending evidence
path, `context.<name>`, or `signals[i].quote`/`quote` respectively; messages are fixed strings that never echo the
offending value; **no new enum member, outcome status, or message type is required** — all three representations
(`ProviderResultOutcome.REJECTED`, thrown `IntentSignalValidationError`) already exist in current code.

**Website normalization / business-vs-personal classification** (REV-005 §4.2): obtained via the existing
`normalizeDomain` function (OQ-7 identity normalization, already in code per the REV-005 audit's source read);
`normalizeDomain(website) === null` → `UNCERTAIN_EMAIL`; non-null and the email domain equals or is a subdomain of
the website domain → `BUSINESS_EMAIL`; otherwise → `PERSONAL_EMAIL` (including every email when the website cannot
be normalized). No DNS lookup, public-suffix list or related-domain table is required or permitted.

**Tests** (REV-005 §10): new suite `contactIdentifiers.test.ts` (detector kinds, ~230 rows across §10.1–§10.9:
masking/formatting, inserted characters/extensions, reference labels/prose, separators, email, `context.*`,
normalization, lifecycle, coverage cross-reference); additions to the existing provider-contract test suite
(`intentSourceProviderContract.test.ts`, including retitling — not re-expecting — the line-578 test per L21) and the
existing intent-signal / worker intake test suites. REV-005 §10 is explicit that this is "specification only — no
test written": test authorship is part of the implementation scope, not already done.

---

## 7. Expected change boundary (per REV-005; no speculative refactoring authorized)

| Category | Expected change |
|---|---|
| Source | New file `packages/core-research/src/contactIdentifiers.ts` (not exported from package `index.ts`); edits to `packages/core-research/src/intentSourceProviderContract.ts` (one private helper call added in each of `preparePublicWeb`, `prepareAiPlatform`, `preparePublicIntent`); edits to `packages/core-research/src/intentSignal.ts` (`toIntentSignalInput`, inline check before `return`) |
| Tests | New `contactIdentifiers.test.ts`; additive rows/assertions in `intentSourceProviderContract.test.ts` and existing `intentSignal`/`intentSource`/`providerAuthenticity`/worker-intent-intake/ingress suites (one existing test, line ~578, is retitled per L21 with its expectation unchanged) |
| Dependencies | `NONE REQUIRED BY REV-005` (C-4: no new dependency; ECMAScript regex, `String.prototype.normalize`, existing `normalizeDomain` only) |
| Schema / migrations | `NONE REQUIRED BY REV-005` |
| Configuration | `NONE REQUIRED BY REV-005` |
| Documentation / governance | A future engineering/audit record documenting implementation evidence, code fingerprint and test results (governance completion, §9 below); not authorized or performed by this record |

---

## 8. Dependencies

**A. Already decided and available:** K1 policy (K1-B, K1-R1..R3, K1-I1..I6), PG-1..PG-4, ED-DEC-001..004, REV-005
itself, the existing `normalizeDomain`, `isPersonalContactIdentifier`, `checkIdentifier`, `screenProviderKeys`
(CONTRACT-REC §3) functions REV-005 builds on and leaves unchanged (C-5).

**B. Engineering implementation choices already fixed by REV-005:** the CVN constant (`L_cvn = 10`), plausibility
bounds (`L_min = 6`, `L_max = 15`), the E-1..E-5 email precedence ladder, the gap-class taxonomy
(fused/inserted/tight/loose), the mask-unit/binding arithmetic (U1–U4), the labelled-reference-number grammar, the
prose/designator/unit word lists — all independently re-derived and confirmed consistent by the REV-005 audit (§5–§9).
These are closed; an implementer follows them, does not re-decide them.

**C. Still pending Product Owner decision:** NONE identified. REV-005 §11 states "Product Owner dependencies: NONE
(ED-DEC-004 §9)," and this review found no genuine conflict between REV-005 and any governing Product Owner decision
(consistent with the REV-005 audit §15).

**D. Evidence gaps that do NOT block implementation:** the open items REV-005 §11 carries forward — R4-M1 (edge
`•••` fail-closed capture), R3-M3 (`tel:` scheme word-boundary edge case), R3-M5 (English-only number/at/dot words),
R3-M6 (over-capture listed in §4.11(a), explicitly "open for EG-1 **volume** review" — a validation-phase concern,
not an implementation blocker), R3-M7 (`publication.publisher` classification, structured field, existing screens
only), R3-M9 (AUDIT-001 reconciliation, "addressed in substance" per L20/L21), and the §4.11(c) open false-negative
list (REV-005 explicitly withdraws REV-004's "no residual is a false negative" claim and records these as open,
deferred to a later engineering record — not Product-Owner-blocking while recorded open). NEW-1 (§11 below) is also
classified here.

**E. Items that would block implementation:** NONE identified in REV-005 or its audit. If an implementer encounters
a case where REV-005 is genuinely ambiguous in a way that changes an outcome (not merely a drafting question like
NEW-1) or contradicts a governing Product Owner decision, REV-005 §6 of the full instructions (and this record's §9
below) requires that affected implementation to STOP and the discrepancy to be recorded — not resolved by the
implementer and not treated as implicit Product Owner decision-making.

---

## 9. PD-1 implementation-authority boundary

If PD-1 is granted, it should be understood to authorize exactly: **implementation of the K1 detector and its
enforcement on the provider-result and non-provider-intake paths, exactly as specified in REV-005, including
authoring the tests REV-005 §10 specifies, with no policy change.**

If, during implementation, REV-005 is found to be ambiguous in a way that affects an outcome, or to contradict a
governing Product Owner decision (K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4, OQ-3/7/11, DEC-003): the affected piece of
implementation must STOP, the discrepancy must be recorded, and engineering must not reinterpret policy, silently
change REV-005, or make a new Product Owner decision on its own authority. This boundary is not weakened by any
urgency to finish implementation.

---

## 10. Blockers and non-blocking open items

**Blockers:** NONE identified (§8.E).

**Non-blocking open items (do not require resolution before PD-1 or before implementation begins):** R4-M1, R3-M3,
R3-M5, R3-M6 (volume review deferred to a post-implementation validation step, not implementation itself), R3-M7,
R3-M9, §4.11(c) open false negatives, and NEW-1 (next paragraph).

**NEW-1 disposition** (`§4.6.4 does not state whether a mixed */• mask run is homogeneous-only`): reviewed against
REV-005 §4.6.3 (defines a "`*`-run" for emphasis pairing only, explicitly "not adjacent to a `•`") and §4.6.4
(defines "mask-capable element" for `*`/`•` as "a run of ≥ 2 characters each `*` or `•`," which read literally does
not explicitly exclude a heterogeneous `*•*•` run). This is **not already resolved elsewhere in REV-005** — no
worked example in §4.6.4 or §4.6.10 exercises a mixed run, and the REV-005 audit (§14) independently reached the
same conclusion. It is **genuinely ambiguous but non-blocking**: the condition is narrow (mixing `*` and `•` as one
unbroken phone mask), does not affect any of the ~230 specified test rows (all sampled rows use pure `*`-only or
pure `•`-only runs per the REV-005 audit §14), and does not change any R4-F1..F5 finding or any policy outcome. It
is **not an implementation blocker**: an implementer who encounters this exact literal ambiguity during
implementation should pick one reading (homogeneous-only, by analogy with §4.6.3, is the more conservative reading
since §4.6.3 treats `*` and `•` as never co-occurring in one run), record the choice and the drafting gap for a
later engineering amendment, and must not treat resolving it as license to reinterpret any other part of §4.6.

---

## 11. Acceptance conditions (implementation scope only — not a launch/release decision)

**Engineering completion** (implementation-level, extracted from REV-005; not graded or recommended here):
- `contactIdentifiers.ts` implements all of §4 (detector, domain classification, email/phone detection, exclusions,
  Unicode normalization) exactly as specified, with no undocumented deviation
- The provider-path call sites in `preparePublicWeb`, `prepareAiPlatform`, `preparePublicIntent` enforce K1 at the
  specified point (after `UNATTRIBUTED` skip, before `raw` is built)
- The intake-path call site in `toIntentSignalInput` enforces K1 at the specified point (after authorization
  evidence, before `return`)
- `context.*` fields are enforced per PG-2 (existing CONTRACT-REC §3 screen retained, K1 screen added)
- PG-3 transient-field scope is preserved: `title`, `snippet`, `body`, `authorization.basis` remain unscreened while
  transient and never leak into `raw`, events, intake or saved rows
- The full §10 lifecycle/test matrix (~230 rows) passes, including provider/intake equivalence rows (§9) agreeing in
  every row
- No unauthorized behaviour (new enum member, new outcome status, value masking/rewriting, new dependency, schema or
  config change) is introduced

**Governance completion** (separate from engineering completion):
- Implementation evidence (files changed, code fingerprint, diff) is recorded
- Test results are recorded
- A fresh, independent conformance audit of the implementation is performed before any further governance step
- Product Owner validation authorization (e.g. R3-M6's EG-1 volume review) and release/launch decisions remain
  **separate, later** decisions, not granted by engineering completion

This record does **not** declare K1, or the Client Intent Discovery product generally, ready for launch merely
because an engineering-completion checklist could later be satisfied.

---

## 12. Governance boundaries

- This record is read-only review and decision preparation. It performed no modification to source code, tests,
  schemas, migrations, dependencies, configuration, or any existing `requirement/` governance record.
- It does not reopen K1 policy, PG-1..PG-4, K1-I1..I6, ED-001..004, or REV-005. Where an implementation concern was
  identified (NEW-1), it is recorded as a drafting ambiguity with a recommended-but-not-authorized disposition, not
  resolved as if it were engineering or Product Owner authority.
- It makes no PD-1 decision. PD-1 remains exclusively a Product Owner decision.

---

## 13. Product Owner questionnaire (PD-1)

**PD-1-A — AUTHORIZE.** Authorize implementation of K1 strictly according to REV-005 (detector, provider-path
enforcement, intake-path enforcement, and the §10 test matrix), with no policy change.
*Factual consequence:* Engineering may create `contactIdentifiers.ts`, modify the three provider `prepare*`
functions and `toIntentSignalInput`, and author the specified tests. No other authorization (validation/volume
review, provider/API calls, participant contact, external research, deployment/release, commit/push) is granted by
this option alone; each remains separate.

**PD-1-B — DO NOT AUTHORIZE.** Do not authorize implementation at this time.
*Factual consequence:* No code or test change proceeds. Open items in §10 above remain as recorded. If this option
is chosen, the Product Owner should state what must be resolved first (e.g., further review of NEW-1, a different
disposition for the §4.11(c) open false-negative list, or any other concern) so engineering has a concrete
re-submission target; this record does not supply or presume such a list beyond what is already in §10.

**PD-1-C — AUTHORIZE WITH EXPLICIT BOUNDARY.** Not included as a distinct option. This review found no governing
record that requires a narrower implementation scope than "all of REV-005" (REV-005 §11: "Product Owner
dependencies: NONE"; REV-005 audit §15: "No Product Owner decision required"). A narrower-scope option would have to
be invented rather than derived from the governing records, which the task instructions prohibit. If the Product
Owner wishes to authorize a narrower scope than REV-005 in full (e.g., defer the `context.*` enforcement, or defer
test authorship), that would be a new instruction to state explicitly at decision time, not a pre-built option here.

No option above is recommended, scored or ranked by this record.

---

## 14. Implementation authorization statement

**IMPLEMENTATION AUTHORIZATION: NOT GRANTED BY THIS RECORD.**

This record contains no Product Owner decision. PD-1 remains PENDING until the Product Owner selects and records an
option above (or a substantively equivalent decision) in a separate Product Owner decision record.

```text
Record type: IMPLEMENTATION AUTHORITY (PD-1) PREPARATION

Baseline:                      branch feature/client-intent-discovery-complete, HEAD 2c2543b01bd9222536bbd1855f7f8537a0bb9fd0, 0 staged
Governing hashes:               3/3 re-verified, all MATCH
PD-1 question:                  implementation of K1 per REV-005 — authorized or not
PD-1 does NOT cover:             validation/volume review, provider/API calls, participant contact, external research, deployment/release, commit/push
Implementation scope:           detector (contactIdentifiers.ts, new), provider path (preparePublicWeb/prepareAiPlatform/preparePublicIntent in intentSourceProviderContract.ts), intake path (toIntentSignalInput in intentSignal.ts), context.* fields, PG-3 transient fields, §10 test matrix (~230 rows, none written yet)
Dependencies pending PO decision: NONE
Blockers:                        NONE
Non-blocking open items:         R4-M1, R3-M3, R3-M5, R3-M6, R3-M7, R3-M9, §4.11(c) false negatives, NEW-1
NEW-1 disposition:               genuinely ambiguous, non-blocking, narrow, does not affect any specified test row
Decision options:                PD-1-A (authorize), PD-1-B (do not authorize); PD-1-C not applicable (no governing basis for a narrower scope)

Implementation authorized:      NO
Implementation performed:       NO
Validation authorized:          NO
Provider/API calls:             NO
External research:              NO
Participant contact:            NO
Commit / push:                  NO

Files created this round: 1 (this record)
Existing records modified: 0
```
