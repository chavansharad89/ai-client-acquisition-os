# INTENT INTAKE MVP

## Decision Preparation — `FIRST_PARTY_CONSENT_POLICY` label after OD-1 to OD-13

**Item ID:** DP-1 (raised by IA-OD-WRITER-001 implementation, 2026-09-30)
**Status:** **PENDING — PRODUCT OWNER DECISION REQUIRED**
**Type:** decision preparation only. It authorizes nothing and changes no code.

## 1. Finding [FACT]

- `packages/core-research/src/intentSourceProviderContract.ts` exports
  `FIRST_PARTY_CONSENT_POLICY = 'PENDING_PRODUCT_OWNER_DECISION'`.
- `normalizeProviderResult` returns it as `notes.firstPartyConsentPolicy` on every `NORMALIZED` outcome whose event
  carries FIRST_PARTY signals.
- Its original doc comment said that the layer "never evaluates or enforces" FIRST_PARTY authorization. After the
  IA-OD-WRITER-001 implementation, OD-1 to OD-6 are enforced: every FIRST_PARTY result that normalizes carries complete,
  validated, GRANTED evidence.
- The value therefore still reads "pending" for something that has now been decided and enforced.
  `notes.authorization` (`PRESENT` / `MISSING` / `NOT_APPLICABLE`) is also unchanged, and for SUPPLIED_TO_US results it
  can now only be `PRESENT`.

## 2. Why this was not resolved in code

OD-1 to OD-13 do not mention this label or `notes.authorization`. Changing, renaming or removing either would be a new
decision (§5 and §6.4–6.5 of IA-OD-WRITER-001). The implementation left the value unchanged. It only corrected the doc
comment so that the comment no longer contradicts the enforced behavior, and the comment points to this item.

## 3. Options (for the Product Owner)

- **A. Keep as-is.** The label keeps its current value. It is informational only and has no runtime consumer (no
  runtime caller exists, F1 / OD-13).
- **B. Replace the value** with one that names the decided rule. This needs a chosen value and an update to the one
  test that asserts the current value.
- **C. Remove the label** (and optionally `notes.authorization` for SUPPLIED_TO_US results) from
  `ProviderContractNotes`.

No option is recommended here. None of them affects persistence, the evidence columns or any gate.

## 4. Execution counters (this document)

```text
Files written: 1 (this document)
Production code changes: 0
Database connections: 0
Provider calls: 0
External HTTP requests: 0
Commits: 0
```
