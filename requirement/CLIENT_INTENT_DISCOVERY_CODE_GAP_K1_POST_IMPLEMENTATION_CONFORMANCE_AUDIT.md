# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — POST-IMPLEMENTATION CONFORMANCE AUDIT

Record ID: CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-POST-IMPLEMENTATION-CONFORMANCE-AUDIT-001
Record type: READ-ONLY INDEPENDENT CONFORMANCE AUDIT
Date: 2026-10-02

## 1 Purpose

Independently audit, from the actual current working-tree code and governing text, whether the K1 contact-identifier
detector and enforcement implementation conforms to `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md`
(REV-005, the controlling spec) and all governing Product Owner decisions. Implementation was already authorized under
PD-1-A (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_AUTHORITY_PD1_DECISION.md`) and performed by a prior
session. This audit does not trust that session's self-report; it re-derives behaviour from the code.

**This audit does not authorize validation, provider/API calls, deployment/release, or commit/push.**

## 2 Audit scope

Read-only. Permitted: reading repository files, reading implementation code and tests, reading governing records,
running the existing deterministic local test suite, executing the already-exported `detectContactIdentifiers`
function against additional inputs via a throwaway vitest file (created, run, then deleted — never left in the
working tree) for audit evidence only. Not performed: any edit to implementation code, tests, schemas, migrations,
configuration or governing/requirement records; no new tests added; no PO or engineering-policy decisions made; no
provider/API calls; no external research; no commit/push.

## 3 Baseline

- Branch: `feature/client-intent-discovery-complete`
- HEAD: `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` (unchanged throughout this audit)
- Staged files: 0 (unchanged)
- Working tree relative to HEAD, confirmed at audit start: exactly the 6 implementation files previously identified
  (`packages/core-research/src/contactIdentifiers.ts`, `contactIdentifiers.test.ts` created;
  `intentSourceProviderContract.ts`, `intentSourceProviderContract.test.ts`, `intentSignal.ts`, `intentSignal.test.ts`
  modified), plus the pre-existing 37+ file `requirement/` documentation state. No unexpected files found changed.
- Governing-record SHA-256 (computed this audit, recorded for continuity, no external "expected" value to compare
  against per the brief):
  - `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION_AMENDMENT_004.md`:
    `c5b0b364dc630ff258570073c564935e31720a1cd59b98f66be281327f311295`
  - `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md`:
    `cec9fde59c27215beeeae9ac93ef1d3e6026ac80efa1f58ef4cf70e76bb44f5f`
  - `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005_CONFORMANCE_AUDIT.md`:
    `d59bdd04dc050c2bfc425d9f53a3a21e17b95b4110fa65873bc171917db4086d`
  - `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_AUTHORITY_PD1_PREPARATION.md`:
    `4dcc6346dcfa52467ef741632a733ad21a26a7b9046015a867c3f286761ba8b4`
  - `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_AUTHORITY_PD1_DECISION.md`:
    `8cba9f378fd53e0605411ed1cffd4ab9d5989bf813a13fd236e5efc1f56a6cc4`

## 4 Governing records consulted

REV-005 (full: §1–§11, including §3 common constraints, §4 detector §4.1–§4.11, §5 field screening, §6 provider
lifecycle, §7 intake lifecycle, §8 rejection propagation, §9 equivalence, §10 full test matrix, §11 authorization and
carried-forward open items). PD-1 decision and preparation (hashed above; referenced for NEW-1 disposition and
authorization scope). ED-DEC-004 (amendment 004, hashed above). Prior REV-005 conformance audit (hashed above, read
for continuity of previously-identified findings). This audit independently re-derives every conclusion from current
code rather than accepting REV-005's own worked examples or the prior audit's conclusions as proof.

## 5 Implementation files audited

- `packages/core-research/src/contactIdentifiers.ts` (1233 lines) — read in full.
- `packages/core-research/src/contactIdentifiers.test.ts` (523 lines) — read, row-ID coverage measured.
- `packages/core-research/src/intentSourceProviderContract.ts` — K1 call sites (`runK1`, `preparePublicWeb`,
  `prepareAiPlatform`, `preparePublicIntent`) read in full.
- `packages/core-research/src/intentSignal.ts` — `toIntentSignalInput` K1 call site and `toIntentIntakeInput`
  re-prefixing read in full.

## 6 Methodology

1. Re-verified baseline (branch, HEAD, staged, working-tree diff, governing-record hashes).
2. Read REV-005 in full for the detector contract, lifecycle, equivalence and full §10 test matrix.
3. Read `contactIdentifiers.ts` in full and traced the processing pipeline (Steps 0–5) by hand against §4.
4. Ran the full local suite (`npx vitest run --root packages/core-research`) and independently observed the result.
5. Measured row-ID literal traceability between REV-005 §10 and `contactIdentifiers.test.ts`.
6. Created one throwaway vitest file (`src/_audit_tmp.test.ts`) executing the already-exported
   `detectContactIdentifiers` against ~45 inputs drawn from REV-005's hardest named examples (email precedence,
   masks, reference labels, Unicode, NEW-1 mixed-run masks, extension-on-masked-base) and compared outputs to the
   REV-005 text by hand; deleted the file immediately after (confirmed absent from `git status` at audit end).
7. Read the three provider call sites and the intake call site to verify equivalence and ordering.

## 7 Full lifecycle traceability result (summary; see §17 for findings)

REV-005 §10 defines 165 distinct labeled detector-level rows (§10.1–§10.5a, §10.7) and 39 CX/L rows (§10.6 context.*,
§10.8 lifecycle), most with 2–6 example texts each. `contactIdentifiers.test.ts` contains 123 tests; a row-ID grep
found 139 distinct REV-005 row identifiers literally referenced in test names/comments — i.e. the large majority of
detector rows are literally represented (many single tests assert several example texts from one row via one
`expectKinds` call with a joined input or multiple `it` blocks, which is why 123 tests cover more than 123 rows).
Rows without a literal test were spot-verified by direct execution (§6 item 6) and, in all cases checked, matched
REV-005's stated Kinds — with one exception (MK6, §8/§15). No row execution produced an enforcement-relevant
(accept/reject) mismatch.

Breakdown (approximate, by example-text count across §10.1–§10.5a):
- **Verified** (passing test directly exercising the exact or an equivalent row text): majority of §10.1–§10.5a rows.
- **Verified by this audit's direct execution** (not in the shipped test file, executed live for audit evidence):
  ~30 additional spot checks, all matching except MK6.
- **Behaviour inferred** (code path clearly handles it, not independently executed): a minority of §10.6 CX rows
  that are structurally identical to already-verified ER/EP/MK detector rows routed through `runK1`'s
  `containsAnyContactIdentifier` call, and some §10.8 lifecycle rows (L10, L11, L16, L22) that depend on unrelated
  existing screens this audit did not re-derive from scratch (see §16).
- **Not tested, not independently executed**: a small residue of rows with no literal test and not among the ~45
  spot-checked (chiefly long tail of UN2–UN5/RL-class enumerations where multiple semicolon-separated examples share
  one `it()` and only a subset were independently re-executed).
- **Not implemented**: none found — no REV-005 §4 rule or §10 row was identified as absent from the code.

## 8 Detector findings

Traced by hand against §4.2–§4.11 and independently executed:
- **Email precedence (E-1…E-5, §4.4.4):** `jane @ 163.com` → `PERSONAL_EMAIL` (valid prefix precedes all guards,
  correct); `jane at gmail.com`, `jane at gmail dot com` → `PERSONAL_EMAIL` (correct, word-at forms with complete
  address); `available at eprocure.gov.in` → `[]` (prose guard, correct); `Tenders at eprocure.gov.in` →
  `PERSONAL_EMAIL` (non-prose local token, §4.11(a), correct); `Book now @ www.example.in` → `[]` (URL guard,
  correct); `rate @ 12.50` → `[]` (E-4 CG-2 price guard, correct). All six of the brief's named hard cases match
  REV-005 exactly. Precedence order in code (`processAtCandidate`: E-2 structural/prose guards → E-3 complete address
  via `longestValidDomainPrefix` → E-4 content guards → E-5 uncertainty) matches §4.4.4's stated order.
- **Domain validation / longest valid prefix:** `isValidLabel` and `longestValidDomainPrefix` implement §4.4.3
  correctly (≥2 labels, 1–63 chars, no leading/trailing `-`, final label ≥2 letters-only or `xn--`, all-numeric
  non-final labels permitted, numeric-final domains always invalid). `jane@gmail..com` → `UNCERTAIN_EMAIL` (single
  label `gmail`, matches ER20).
- **NEW-1 (mask homogeneity) — see §15/§10.**
- **Reference labels / `:`-is-not-a-designator (§4.8 item 5):** `To order: 9876543210` → `PHONE`, `Business account:
  9876543210` → `PHONE` (both correctly rejected: `:` is a `GAP_T` connector only, not a designator, matching RL17/
  RL18 and the R4-F4 fix). `Order: 12345678` → `PHONE` (RL2b, correct — `:` alone never excludes).
- Fail-closed behaviour throughout: every untested spot check that should reject (masks concealing a complete number,
  obfuscated emails, bare digit runs) rejected; every one that should pass (reference labels, units, dates, prose)
  passed.

## 9 Provider-path findings

All three call sites (`preparePublicWeb`, `prepareAiPlatform`, `preparePublicIntent`) call one private `runK1`
helper, immediately after the `UNATTRIBUTED` skip and before `raw` is built, matching §6 exactly. Each call site
supplies `result.business.website` and a `{path, text}[]` array built from that family's own evidence shape
(`intentEvidence.evidence` single statement for PublicWeb; `evidence[i].statement` array for AiPlatform;
`intentEvidence[i].evidence` array for PublicIntent), plus `result.context` unconditionally. `runK1` screens evidence
texts first (`containsPersonalContactIdentifier`) then `context.*` (`containsAnyContactIdentifier`), first hit wins,
matching §6's stated order and §8's rejection table. No bypass path or provider-specific divergence found.

## 10 Intake-path findings

`toIntentSignalInput`'s K1 check sits after the `authorizationEvidence` block and before `return`, matching §7's
"after authorization evidence, before return" placement. It uses `quote` and `website` after the existing
`requiredString` trim (matching §7's "values after the existing trim"), and the persisted `signal.signal` /
`sources[0].sourceQuote` is that same trimmed `quote`. `toIntentIntakeInput` re-prefixes a thrown `quote` error to
`signals[${index}].quote`, matching §8's field column for the multi-signal form.

## 11 Provider/intake equivalence

Both paths use the same exported functions (`containsPersonalContactIdentifier` for evidence/quote,
`containsAnyContactIdentifier` for `context.*`) with the same effective inputs (evidence statement / `quote`, and
`business.website` / `website`), so a given text+website pair cannot diverge between paths — confirmed by code
inspection (same function calls, same argument derivation) and by the REV-005 §10 Kinds/Provider/Intake columns
agreeing in every row sampled. No equivalence-breaking logic found.

## 12 `context.*` findings

`runK1` screens `context.targetCustomer`, `context.geography`, `context.service` only when each is a string, using
`containsAnyContactIdentifier` (BUSINESS_EMAIL/PERSONAL_EMAIL/UNCERTAIN_EMAIL/PHONE all trigger), matching PG-2's net
effect exactly as described in §4.1's trigger table and §6. This runs only after the existing CONTRACT-REC §3 screen
(unchanged position per C-5), so an obfuscated business email in `context.*` (R3-F7 concern) is caught by K1 even
though the existing regex screen would miss it — consistent with CX3/CX4/CX9–CX15 expectations. No additional policy
beyond PG-2 was found introduced.

## 13 PG-3 findings

`title`, `snippet`, `body` and `authorization.basis` are not passed to `runK1` at any provider call site (confirmed
by reading the full argument lists in §9/§10 above — only `business.website`, evidence array, and `context` are
passed); they remain used only to build `sourceText` for `checkVerbatim` / `requireText` as before. This matches
§5's "not screened while transient" row and K1-I5 rule 3. No code path was found that persists, logs or forwards
these transient fields through K1.

## 14 Test results

`npx vitest run --root packages/core-research` (run directly by this audit, not copied from any prior report):

```
Test Files  20 passed (20)
     Tests  729 passed (729)
```

All 20 suites passed, including `contactIdentifiers.test.ts` (123 tests), `intentSourceProviderContract.test.ts`
(191 tests), `intentSignal.test.ts` (46 tests). No skips, no `.only`, no external provider calls observed in the
K1-relevant suites (they construct fixtures directly; no network-dependent test was exercised). This independently
confirms the implementer's reported 729/729 but does not by itself establish full REV-005 traceability (see §7, §20
of the brief) — row-ID coverage and targeted execution (§7–§8) were used for that.

## 15 Carried-forward findings disposition

| Finding | Disposition |
|---|---|
| R4-M1 (edge `•••`, e.g. `98765 43•••`) | Still present — REV-005 §4.11(a) records this as accepted fail-closed over-capture, not a defect; code behaviour (`98765 43•••` → `PHONE`) matches the spec's own worked example. Not a PO dependency. |
| R3-M3 (`tel:` scheme word boundary, e.g. `Hotel:2026-10-02`) | Still present — `SCHEME_RE` uses a negative lookbehind for `\p{L}\p{N}` before `mailto\|tel\|sms:`, which does not exclude a preceding word ending exactly where the scheme word begins (e.g. `Hotel:` contains `tel:` with a letter immediately before `tel`, so the lookbehind `(?<![\p{L}\p{N}])` would in fact block it — this specific example is excluded correctly). Recorded open per REV-005 §11; not independently falsified or newly resolved by this audit; no PO decision needed per REV-005. |
| R3-M5 (English-only number/at/dot words) | Still present — confirmed: `DIGIT_WORDS`, `AT_WORD`, dot-word patterns are English-only; REV-005 §4.4.5 and §11 record this as an open, accepted limitation, not re-litigated. |
| R3-M6 (over-capture listed in §4.11(a), open for EG-1 volume review) | Still present — this is a recorded-open policy item (volume/UX review), not an implementation defect; code matches §4.11(a)'s examples exactly (verified: `Pune 411001`-style joins, uncurrencied decimal lists, etc., per the detector's documented fail-closed behaviour). |
| R3-M7 (`publication.publisher` classification) | Not applicable to K1 — `publication.publisher` is not in K1's screened-field set (§5); unchanged by this implementation. |
| R3-M9 (AUDIT-001 reconciliation items) | Still present as recorded in REV-005 §11 ("ED7-F2 and ED7-F4 addressed in substance by L20/L21" — this audit did not re-derive the full AUDIT-001 item list; treated as carried per REV-005's own disposition, not newly resolved or newly blocking). |
| §4.11(c) (open false negatives: single non-x/o letter insertion, quoted local part, comma-grouped phone, >15-digit concatenation, non-English words) | Still present — REV-005 explicitly withdraws the REV-004 "no residual is a false negative" claim and records these as open, not PO-dependent. Code behaviour is consistent with the stated residuals (not independently re-verified item-by-item beyond what REV-005 itself documents). |
| NEW-1 (mixed `*`/`•` mask-capable run treated as homogeneous-only) | **Changed/elevated for precision** — see §10 below: confirmed to be a literal deviation from REV-005 §4.6.4's generic text, in the fail-closed (more-likely-to-reject) direction. Not elevated to blocker; recorded as MINOR with the exact deviation stated, per the brief's explicit instruction not to accept "conservative" as a free pass. |

## 16 Scope / dependency audit

`git diff --stat` against HEAD confirms only the 6 files in `packages/core-research/src/` changed (3 implementation
pairs + 1 new file pair); nothing elsewhere under `packages/` or the repository changed. No `package.json` /
lockfile / dependency changes. No schema or migration changes. No provider/API additions. `contactIdentifiers.ts` is
not exported from `packages/core-research/src/index.ts` (confirmed by the module's own header comment and by it
being a new, additively-wired private module — not independently re-verified against `index.ts` contents in this
pass, consistent with the module's own stated non-export claim and with C-5's "existing screens unchanged" having no
evidence of violation). No unrelated source changes found.

## 17 Findings table

| ID | Severity | Area | Description | PO dependency |
|---|---|---|---|---|
| F-01 | MINOR | §4.6.9 item 2 (extension on masked base) | `98765 43XXX ext 204` (REV-005 MK6; expected single `FRAGMENT`) produces `["FRAGMENT","FRAGMENT"]` from the implementation. `stripExtensions`'s `hasBase` check (`/[0-9](?:[\s,\-(]{0,3})$/`) requires the 3-character lookback before an `ext`/`extn`/`extension` marker to contain a literal ASCII digit; it does not recognize a base phone stretch that ends in mask characters (`X`/`*`/`•`) as having a "base" per §4.6.9 item 2's literal text ("a base phone stretch ends ≤3 characters … before the marker"). As a result the extension digits are treated as a no-base fragment and the masked base `98765 43XXX` is evaluated independently, producing two `FRAGMENT` entries instead of one. **No enforcement effect**: `FRAGMENT` never triggers evidence/`quote`/`context.*` rejection (§4.1), so Provider/Intake outcomes for this row remain NORMALIZED/accepted as REV-005 requires; only the literal entry-count/Kinds-column conformance is affected, and this exact row is not among the 123 shipped tests. | NO — implementation-only fix, no policy change needed |
| F-02 | MINOR | §4.6.4 NEW-1 (mask-capable `*`/`•` run) | The code (per its own header comment) restricts an established `*`/`•` mask run to a homogeneous run (all `*` or all `•`); REV-005 §4.6.4's literal text defines a mask-capable element as "a run of ≥2 characters each `*` or `•`," which on its face would also cover a single interleaved run such as `*•*•`. Confirmed by direct execution: `9876*•*•43210` → `["PHONE"]` (no masking recognized at all — each alternating 1-character segment is below the length-2 mask-capable threshold), whereas a block-adjacent mixed run such as `98***•••43210` → `["FRAGMENT"]` (the two homogeneous sub-runs are evaluated and joined as adjacent mask-capable elements via a fused gap, producing a result that happens to coincide with treating the whole run as one mask). The deviation is real only for genuinely interleaved mixed runs, and it is fail-closed (narrower masking recognition → more likely to be read as a complete visible number → more likely PHONE/reject, never the reverse), consistent with PG-1's fail-closed stance. This confirms the PD-1-prep "conservative" framing is directionally correct but the deviation itself is real and was not merely accepted because it is conservative — it is recorded here as instructed. | NO — PD-1 preparation already dispositioned this as a recorded drafting-gap, not requiring a fresh PO decision; this audit does not reopen that disposition, only states the deviation precisely |
| O-01 | OBSERVATION | Test-row traceability | 123 shipped detector tests cover the large majority (139 of 165 row-IDs literally referenced) of REV-005 §10.1–§10.5a's labeled rows, generally via one test asserting multiple example texts per row; this is legitimate equivalent coverage for most rows but is not literal one-test-per-example-text coverage of the full ~230-example matrix. No gap found by this audit's spot-checks beyond F-01. | NO |
| O-02 | OBSERVATION | §10.6/§10.8 inference | A minority of CX and L rows (chiefly those depending on pre-existing, non-K1 screens — L10, L11, L16, L22) were not independently re-derived from scratch in this audit; they rely on code and tests this audit read but did not re-execute line-by-line outside the full suite run. | NO |

No BLOCKER, CRITICAL or MAJOR finding was identified.

## 18 Overall verdict

**CONFORMANT WITH NON-BLOCKING FINDINGS.**

The implementation conforms to REV-005's detector contract (§4), provider lifecycle (§6), intake lifecycle (§7),
rejection propagation (§8) and provider/intake equivalence (§9) in every area independently traced, including every
one of the brief's explicitly named hard cases (`jane @ 163.com`, `jane at gmail.com`, `jane at gmail dot com`,
`available at eprocure.gov.in`, `Tenders at eprocure.gov.in`, `Book now @ www.example.in`, `rate @ 12.50`, `To order:
9876543210`, `Business account: 9876543210`, and the MK/IC/RL mask and reference-label family). Two MINOR,
non-blocking findings were identified (F-01, F-02), neither of which changes any accept/reject outcome described in
REV-005 §10.

## 19 Remaining blockers

None.

## 20 Governance state

Implementation was authorized under PD-1-A prior to this audit; this audit performed no implementation, no test
changes, no validation, no provider/API calls, no deployment, and no commit/push. The one file this audit created is
the audit record itself; the one throwaway verification file created during the audit (`src/_audit_tmp.test.ts`) was
deleted before this record was written and is absent from the working tree.

## 21 Independence limitation

This audit re-derived the detector's behaviour from `contactIdentifiers.ts` directly (full read, hand-traced
pipeline, 729/729 suite run independently, ~45 additional live executions against REV-005's named hard cases and
several previously-untested rows) and re-derived the provider/intake call sites from the actual call graphs rather
than from the implementer's or REV-005's own prose. It did not, however, independently re-execute all ~230 individual
example texts in REV-005 §10, did not re-read every PO decision file in full byte-for-byte (K1 Policy Gaps, K1
Implementation Semantics, K1 Residual, ED-001/002/003 individually — their content as condensed and carried forward
into REV-005 §2/§11 was treated as authoritative per REV-005 being "the controlling spec"), and did not re-derive
from scratch the pre-existing, non-K1 screens that several §10.6/§10.8 rows depend on. Within that scope, the
findings above are this audit's own, independently reached.

---

```text
Record type: POST-IMPLEMENTATION CONFORMANCE AUDIT (independent, read-only)
Baseline HEAD: 2c2543b01bd9222536bbd1855f7f8537a0bb9fd0 (unchanged)
Verdict: CONFORMANT WITH NON-BLOCKING FINDINGS
Blockers: 0
Critical: 0
Major: 0
Minor: 2 (F-01, F-02)
Observations: 2 (O-01, O-02)

Implementation authorized: prior (PD-1-A)
This audit authorizes: NOTHING — no validation, no provider/API calls, no deployment, no commit/push
Files created this round: 1 (this record)
Existing records modified: 0
```
