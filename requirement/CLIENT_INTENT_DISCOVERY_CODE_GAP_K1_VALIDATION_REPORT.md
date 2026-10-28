# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — VALIDATION REPORT

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-VALIDATION-001
**Date:** 2026-10-03
**Type:** Independent validation. Not an implementation, not a Product Owner decision, not a fix.

## A. Authorization

- K1 implementation authorized under PD-1-A: `requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_AUTHORITY_PD1_DECISION.md` (sha256 `8cba9f378fd53e0605411ed1cffd4ab9d5989bf813a13fd236e5efc1f56a6cc4`).
- K1 validation authorized under PD-VA, Option A: `requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_VALIDATION_AUTHORITY_DECISION.md`, record ID `CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-VALIDATION-AUTHORITY-PO-DEC-001`, sha256 `88926ffabe7b8b9dc5e2e1ecc5d6df06f87c86f06ac8bd5fd796b203b2116da9`.
- All 8 governing hashes (ED-004, REV-005, REV-005 conformance audit, PD-1 preparation, PD-1 decision, post-implementation conformance audit, K1 Validation Authority preparation, K1 Validation Authority decision) were re-verified with `shasum -a 256` at task start and again at task end: all 8 matched the stated values both times, with no discrepancy.

## B. Baseline

- Branch: `feature/client-intent-discovery-complete`
- HEAD: `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` (unchanged throughout)
- Staged files: 0 (unchanged throughout)
- Working-tree state at start and end: identical — 4 modified files (`intentSignal.ts`, `intentSignal.test.ts`, `intentSourceProviderContract.ts`, `intentSourceProviderContract.test.ts`), 2 new files (`contactIdentifiers.ts`, `contactIdentifiers.test.ts`), plus the pre-existing modification of `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` and the large set of untracked `requirement/*.md` governance records already present before this session. This validation added exactly one new file: this report. All two throwaway scripts used during validation were deleted before finishing; `git status --short` after cleanup shows no trace of them.
- SHA-256 of the 6 implementation/test files (recorded for post-validation comparison): `contactIdentifiers.ts` = `d0440bae...251ac8f`; `contactIdentifiers.test.ts` = `6b6fe9f0...427baf5`; `intentSignal.ts` = `c36c694f...4606b5`; `intentSignal.test.ts` = `2b106841...e9fdd`; `intentSourceProviderContract.ts` = `3ae90877...45e99ff`; `intentSourceProviderContract.test.ts` = `7128cd7a...a541561`. Identical before and after validation.

## C. Scope

Read-only validation of REV-005 conformance: the detector (`contactIdentifiers.ts`), the provider-result lifecycle (`intentSourceProviderContract.ts`), and the non-provider intake lifecycle (`intentSignal.ts`); the existing test suite run as-is; deterministic re-execution of the detector and of the two pure, exported lifecycle functions (`normalizeProviderResult`, `toIntentSignalInput`) via throwaway scripts; explicit re-check of F-01, F-02 and the 9 carried-forward findings. No source, test, schema, config or dependency file was modified. No provider/API call, external research, participant contact, deployment or commit/push occurred.

## D. Method

- `npx vitest run --root packages/core-research` (full suite, unmodified).
- Two throwaway Vitest files written temporarily under `packages/core-research/src/` (chosen because no `tsx`/`ts-node`/`vite-node` binary is installed in this repo to run a standalone TS script against the package's path-mapped imports; Vitest was the only available deterministic TS runner): `_k1_validation_throwaway.test.ts` (detector-only spot checks via `detectContactIdentifiers`) and `_k1_equivalence_throwaway.test.ts` (provider/intake equivalence via `normalizeProviderResult` + `toIntentSignalInput`, built on the existing `webFixtures` fixture helper). A third, `_k1_carried_throwaway.test.ts`, re-checked carried-forward residuals. All three were deleted immediately after their output was captured; none appears in the final `git status`.
- `shasum -a 256` on the 8 governing records (start and end) and on the 6 implementation/test files (start and end).
- Direct reading of REV-005 in full (926 lines) and of the three implementation files in full.

## E. Test results

`npx vitest run --root packages/core-research`: **20 files, 729 tests, 729 passed, 0 failed, 0 skipped.** Includes `contactIdentifiers.test.ts` (123 tests) and `intentSourceProviderContract.test.ts` (191 tests), both passing unmodified.

## F. REV-005 §10 coverage

The spec's §10.1–§10.8 tables contain 204 distinct row-IDs in total (detector rows §10.1–§10.5a, `context.*` rows §10.6, normalization rows §10.7, lifecycle rows §10.8). A literal grep of the three test files for each row-ID token found **151 of 204 (74%)** referenced by name; the remaining 53 are not referenced by their literal ID (many of these IDs are asserted via example texts grouped under a different test's literal title, which this grep-based count does not credit — so 151 is a conservative floor, not an exact count of covered rows). This is a different count from the prior post-implementation audit's "139/165" because that figure was scoped to §10.1–§10.5a detector rows only; this count spans all of §10.1–§10.8.

Independently executed this round (not merely cited from the prior audit), via the throwaway scripts: F-01, F-02 (both variants), MK1, MK4, MK6, MK7, MK15, MK17, MK21, MK29, MK30, MK32, MK33, IC8, IC10, R4-M1, SP14, SP17, EP10a, RL2b, RL5, RL16, HS1, EX4, EX5, UN1, ER1, ER3, ER20, D1, D2, EP8 (31 detector rows), plus 7 representative provider/intake equivalence rows (ER1, ER3, MK1, MK15, F-01, RL1, SP1) via the real exported `normalizeProviderResult` / `toIntentSignalInput` functions, plus 5 carried-forward residual checks (R3-M3, comma-grouped phone, quoted local part, single-letter insertion, >15-digit concatenation). Every executed row's observed Kinds/outcome matched REV-005's stated expectation, **except** the two already-known deviations (F-01, F-02) detailed below. No row I executed contradicted the shipped tests or the prior audit's claims.

**Numbers:** executed = 31 detector rows + 7 equivalence rows + 5 residual checks = 43 directly re-derived by this validation (on top of the 729 passing shipped tests, which independently assert a much larger subset). Unexecuted (not independently re-run by this validation, relying on the shipped-test pass and/or the prior audit's record) = remainder of the 204 row-IDs. Inconclusive = none; everything attempted produced a deterministic result.

## G. Provider path results

`preparePublicWeb`, `prepareAiPlatform`, `preparePublicIntent` each call a private `runK1` exactly once, immediately after the `UNATTRIBUTED` skip and before `raw` is built, matching REV-005 §6's required order (`checkCommon` → type/URL checks → verbatim/evidence → `UNATTRIBUTED` → K1 → mapping). `runK1` screens evidence statements in array order with `containsPersonalContactIdentifier`, then `context.targetCustomer/geography/service` with `containsAnyContactIdentifier`, and rejects via `reject(path, 'not-allowed', message)` on the first hit, exactly per §6 and §8's `ProviderResultOutcome` shape. Confirmed by direct reading of lines 367–396 and 419–605 of `intentSourceProviderContract.ts`, and by execution (ER1 → REJECTED `intentEvidence.evidence`; ER3/MK1/F-01/RL1/SP1-negative cases → NORMALIZED; SP1/MK15 → REJECTED).

## H. Intake path results

`toIntentSignalInput` runs the K1 check inline, immediately after authorization-evidence validation and immediately before `return`, matching REV-005 §7 exactly: `quote` and `website` are the post-trim values, the same `containsPersonalContactIdentifier` detector is used, and a hit throws `IntentSignalValidationError('quote', 'not-allowed', …)` with the exact message text specified in §8. Confirmed by direct reading of lines 336–344 of `intentSignal.ts` and by execution (ER1/MK15/SP1 → thrown `quote`/`not-allowed`; ER3/MK1/F-01/RL1 → accepted).

## I. Provider/intake equivalence results

Executed directly (not cited): 7 rows through both the real `normalizeProviderResult` (provider path, with a fixture satisfying `checkVerbatim`) and the real `toIntentSignalInput` (intake path), same text and same website in both. All 7 agreed: REJECTED↔rejected for ER1, MK15, SP1; NORMALIZED↔accepted for ER3, MK1, F-01 (the two-FRAGMENT-entry deviation is enforcement-neutral — see F-01 below), RL1. No disagreement found. This is consistent with §9's "superset" argument and with REV-005 §10 L20.

## J. Context.* results

`runK1` applies `containsAnyContactIdentifier` (triggers on `BUSINESS_EMAIL`, `PERSONAL_EMAIL`, `UNCERTAIN_EMAIL`, `PHONE` — not `FRAGMENT`) to each of `targetCustomer`, `geography`, `service` only when `context !== undefined`, rejecting with `field = context.<name>` and the PG-2 message text, matching §6/§8 and the CX1–CX16 table. The existing CONTRACT-REC §3 screen (`screenProviderKeys`, unrelated to K1) runs earlier in `prepare`, consistent with §6's "earlier existing rejections keep their field" rule. Not independently re-executed row-by-row this session beyond reading the code path; the shipped test suite (`intentSourceProviderContract.test.ts`, 191 passing tests) is relied on for the CX1–CX16 matrix.

## K. PG-3 results

`title`/`snippet` (web) and `title`/`body` (intent notice) are concatenated only into a local `sourceText` used solely by `checkVerbatim`; `authorization.basis` is checked only by `requireText`. Neither is passed to `runK1`, matches the PG-3/K1-I5-rule-3 "never screened while transient" rule, and neither appears in any screened-field list in `runK1`'s call sites (confirmed by reading all three `prepare*` functions in full). No code path persists, logs or echoes these bytes outside the transient `sourceText`/proof lifecycle described in §5.

## L. F-01 results

Executed directly: `detectContactIdentifiers('98765 43XXX ext 204', 'example.com')` → **`["FRAGMENT","FRAGMENT"]`**. REV-005's MK6 table row states a single `FRAGMENT`. Root cause: `stripExtensions`'s `hasBase` regex (`/[0-9](?:[\s,\-(]{0,3})$/`) requires an ASCII digit within the 3-character lookback before the `ext` marker; here the lookback is `XX ` (mask characters, no digit), so `hasBase` is `false` and the implementation treats "204" as a no-base extension (`FRAGMENT`, digits<6) while separately evaluating the masked base `98765 43XXX` as its own `FRAGMENT` (U3, P=10≤15) — two entries instead of one. **Enforcement is unaffected**: `FRAGMENT` never triggers `containsPersonalContactIdentifier` or `containsAnyContactIdentifier` (§4.1), so both Provider and Intake remain NORMALIZED/accepted for this row exactly as REV-005 requires (confirmed above in §I). This exactly reproduces the finding already on record as F-01 in the post-implementation conformance audit (MINOR, no-fix-required disposition) — independently re-derived here, not merely cited.

## M. F-02 results

Executed directly on the mixed mask input: `detectContactIdentifiers('9876*•*•43210', 'example.com')` → **`["PHONE"]`**. No masking is recognized at all: each `*`/`•` segment in the alternating run is length 1 (below the length-≥2 mask-capable threshold used by this implementation's HOMOGENEOUS-only reading of §4.6.4), so the whole 10-digit run of digits is read as one plausible phone number (6–15 digits) → `PHONE`. Also tested `9876**••43210` (two adjacent homogeneous 2-char runs, `**` then `••`, fused to each other and to digits) → `["FRAGMENT"]` (recognized as masks, joined into one unit). This matches the prior audit's F-02 finding exactly: the code's documented NEW-1 disposition restricts mask-capable runs to homogeneous `*`-only or `•`-only runs, which is narrower than REV-005 §4.6.4's literal text ("a run of ≥2 characters each `*` or `•`") for genuinely interleaved mixed runs. The deviation is fail-closed (narrower masking recognition → more likely `PHONE` → more likely rejected, never the reverse), consistent with PG-1. Enforcement effect: `PHONE` triggers rejection in both paths, so this deviation can only ever cause an extra rejection, never an extra acceptance — it does not create an under-enforcement risk.

## N. Carried-forward findings

| ID | Status | Observed | Conformance/enforcement effect | Disposition |
|---|---|---|---|---|
| R4-M1 (edge `•••`, e.g. `98765 43•••`) | Still present | Executed: `98765 43•••` → `["PHONE"]`, matching REV-005 §4.11(a)'s own worked example | None — spec-documented fail-closed over-capture, not a defect | Not blocking; not reopened |
| R3-M3 (`tel:` word boundary, e.g. `Hotel:2026-10-02`) | Still present | Executed: `Hotel:2026-10-02` → `[]` (no false trigger); the negative lookbehind correctly excludes this specific example | None observed in this check | Not blocking; recorded open per REV-005 §11 |
| R3-M5 (English-only number/at/dot words) | Still present | Confirmed by code reading: `DIGIT_WORDS`, `AT_WORD`, dot-word patterns are English-only | None — accepted open limitation | Not blocking |
| R3-M6 (over-capture in §4.11(a), open for EG-1 volume review) | Still present | Code matches §4.11(a)'s examples; this is a policy/volume question, not a defect | None | Not blocking; PO dependency: NONE per REV-005 |
| R3-M7 (`publication.publisher` classification) | Still present / not applicable | `publication.publisher` is not in K1's screened-field set (§5); unaffected by K1 | None | Not blocking |
| R3-M9 (AUDIT-001 reconciliation items) | Still present as recorded | Not re-derived from AUDIT-001 from scratch this session; carried per REV-005 §11's own disposition | None newly found | Not blocking; not newly resolved |
| §4.11(c) (open false negatives) | Still present | Executed: `"jane.doe"@gmail.com` → `["FRAGMENT"]`; `987,654,3210` → `[]`; `98765a43210` → `[]`; `98765432109876543211` → `[]` — all four match REV-005's documented residuals exactly | None beyond what REV-005 already documents as accepted-open | Not blocking; explicitly not PO-dependent per §11 |
| F-01 (extension on masked base) | Confirmed present, independently re-derived | `["FRAGMENT","FRAGMENT"]` instead of one `FRAGMENT` | None — both entries are non-triggering kinds | Non-blocking per prior audit; this validation does not reopen or escalate it |
| F-02 (mixed `*`/`•` mask run) | Confirmed present, independently re-derived | `9876*•*•43210` → `["PHONE"]` (fail-closed, not a false negative on enforcement) | None adverse — fail-closed direction only | Non-blocking per prior audit; this validation does not reopen or escalate it |

No carried-forward finding was silently closed, newly escalated, or newly downgraded by this validation.

## O. New findings discovered during validation

None. Every deviation this validation found (the F-01 two-entry count, the F-02 homogeneous-mask narrowing) is already on record in the post-implementation conformance audit under those same IDs; this validation independently re-derived both from the live code rather than citing the audit, and both reproduce exactly.

## P. Conformance conclusion

**CONFORMANT WITH NON-BLOCKING FINDINGS.**

Basis: 729/729 shipped tests pass unmodified; the provider and intake lifecycles implement REV-005 §6/§7/§8 exactly as read; provider/intake equivalence held in every row tested; `context.*` and PG-3 transient-field handling match the specified rules; the only two detector-level deviations from REV-005's literal text (F-01, F-02) are the same two already-recorded MINOR, enforcement-neutral/fail-closed findings from the post-implementation conformance audit, independently reproduced here, with no accept/reject outcome in REV-005 §10 changed by either. This is not a deployment or readiness authority — no such authority exists in this record.

## Q. Governance statement

Implementation already authorized under PD-1-A (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_AUTHORITY_PD1_DECISION.md`). This validation authorized under PD-VA, Option A (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_VALIDATION_AUTHORITY_DECISION.md`, record ID `CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-VALIDATION-AUTHORITY-PO-DEC-001`). Provider/API calls: NOT AUTHORIZED and NONE made. External research: NOT AUTHORIZED and NONE performed. Participant contact: NOT AUTHORIZED and NONE made. Deployment/release: NOT AUTHORIZED and NONE occurred. Commit/push: NOT AUTHORIZED and NONE occurred.

```text
Record type: VALIDATION REPORT
Record ID: CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-VALIDATION-001

Implementation authorized: prior (PD-1-A)
Validation authorized: prior (PD-VA, Option A)
Validation performed: YES — read-only + deterministic local execution via throwaway scripts (deleted)
Source/test/schema/config/dependency files modified: NONE
Provider/API calls: NO
External research: NO
Participant contact: NO
Deployment/release: NO
Commit/push: NO

Test suite: 20 files, 729/729 passed, 0 failed, 0 skipped
Conformance conclusion: CONFORMANT WITH NON-BLOCKING FINDINGS (F-01, F-02; both pre-existing, re-derived not newly found)

Files created this round: 1 (this record)
Files deleted this round: 3 throwaway validation scripts (not part of the repository at completion)
Existing records modified: 0
```
