# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-PCG4-TARGET-CUSTOMER-MATCH-DECISION-PREPARATION-001`
**Date:** 2026-10-05
**Type:** Read-only preparation record. **No implementation, instrumentation, validation, deployment, release, or
launch authority of any kind is granted by this document.** **No Product Owner decision is created, implied,
inferred, or authorized.** Every open item below is marked `PENDING PRODUCT OWNER DECISION`. This record selects
no option.

Raised during implementation of
`requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` (Record ID
`CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001`, SHA-256
`af13cb82f3a34dc3be86f2be79080de54dad57291ea4fcbdf66ecdc754f4b4f2`), Phase 7/8 (`@acos/core-qualification-equivalence`,
`@acos/core-launch-gates`'s `evaluatePcg4`). Per that authorization's own stop rules (#3 "implementation requires
inventing a threshold" and #9 "independent validation requires a policy decision not already authorized"),
implementation stopped on this specific point and continued on every other authorized workstream, per the
Product Owner's explicit ruling of 2026-10-05.

---

## 1. Baseline (verified at the time this record was written)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` (unchanged by this record) |
| Governing authorization record | `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`, SHA-256 `af13cb82f3a34dc3be86f2be79080de54dad57291ea4fcbdf66ecdc754f4b4f2` |
| Related engineering-blocker record | `requirement/CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md`, SHA-256 `b587a0de43f3bcae8ccb8bcb25df9c634751848dc00d9760721bdaf18b22e148` |
| Related instrumentation engineering-design record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`, SHA-256 `8ddf7d0410ae4023a109e2712e6b4c86b9007df80d2f2880d6d28f720deadde9` |
| Related instrumentation Product Owner record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`, SHA-256 `ad659cbdfc1974037af672cb693412531bc3fab27543ed67c68c6eaf69f80226` |
| File created by this record | this file only |

This record does not reopen or restate the full PDEF-4 gate policy (PCG-1..6 definitions, launch-blocker status,
window/immutability rules) — see the governing records above. It isolates exactly one unresolved point: the data
source for the `TARGET_CUSTOMER_MATCH` criterion inside PCG-4's qualification-equivalence evaluator.

---

## 2. Governing facts (from the authorization record — not reinterpreted here)

Quoted/paraphrased directly from `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`:

- PCG-4 numerator: "reviewed-event population satisfying `feedback.useful` AND qualification-equivalence evaluator
  match."
- Qualification evaluator: "new standalone evaluator... must evaluate whether the opportunity satisfies the
  user's configured: service/product criteria, **target customer criteria**, minimum project/value criteria... do
  NOT reuse `core-qualification` semantics."
- B-3: "Qualification input: search snapshot only, structured per-criterion output, pure/deterministic, fail-soft."
- ED-10: "standalone qualification-equivalence evaluator; pure/deterministic; search-snapshot inputs; structured
  per-criterion result; fail-soft."
- B-7: "Useful outcome is conjunctive: `feedback.useful AND qualification_match`."
- Explicit instruction present in this session's governance-authorization pasted content (Product Owner ruling,
  2026-10-05): "Do not treat `TARGET_CUSTOMER_MATCH` as trivially satisfied. Do not remove `TARGET_CUSTOMER_MATCH`
  from the qualification evaluator... `TARGET_CUSTOMER_MATCH = UNKNOWN` when no authorized source can establish
  the criterion. Therefore the PCG-4 numerator must not manufacture a passing match. PCG-4 is NOT YET EVALUABLE
  until an authorized source/derivation for target-customer matching is defined."

**No governing record defines what data establishes `TARGET_CUSTOMER_MATCH` for a specific Opportunity.** The
authorization record names the criterion by category ("target customer criteria") but does not name a field,
table, or derivation that satisfies it. This is the exact gap this record exists to surface.

---

## 3. Current evaluator behavior (repository fact, verified by reading the code and by test)

`packages/core-qualification-equivalence/src/evaluator.ts` + `rules.ts`:

- `evaluateQualificationEquivalence(snapshot, subject)` is pure/deterministic/fail-soft, per ED-10/B-3.
- Three independent criteria: `SERVICE_MATCH`, `TARGET_CUSTOMER_MATCH`, `MINIMUM_VALUE_MATCH`.
- `TARGET_CUSTOMER_MATCH`'s rule (`evaluateTargetCustomerMatch`, `rules.ts`) compares
  `subject.observedTargetCustomer` against `snapshot.targetCustomer`. If `subject.observedTargetCustomer === null`,
  the criterion resolves to `satisfied: 'UNKNOWN'` — it never throws and never guesses.
- Overall `match` precedence (`evaluator.ts`): `anyFalse ? false : anyUnknown ? 'UNKNOWN' : true`. A `false` on any
  criterion outranks an `'UNKNOWN'` on another; but an `'UNKNOWN'` on any criterion outranks an otherwise-all-`true`
  result — `match` can therefore never be a clean `true` while `TARGET_CUSTOMER_MATCH` is `'UNKNOWN'`.
- `packages/core-launch-gates/src/pcg4.ts` is the only production caller and always passes
  `observedTargetCustomer: null` (see its own in-file comment and `requirement/...` cross-reference added
  2026-10-05) — there is currently no code path that populates this field with anything else.
- Verified by test: `packages/core-qualification-equivalence/src/evaluator.test.ts` ("TARGET_CUSTOMER_MATCH alone
  being UNKNOWN keeps the overall match from ever being true...") and
  `packages/core-launch-gates/src/pcg4.test.ts` (seven cases, all passing, documenting that PCG-4's numerator is
  structurally `0` under current wiring even when service and value criteria are satisfied).

**Consequence (repository fact, not policy):** as implemented today, `evaluatePcg4` can return `numerator: 0` for
every closed window regardless of actual service/value match quality, because the third criterion can never clear.
This is the deliberate, fail-soft, tested behavior — not a defect to be patched silently.

---

## 4. Search snapshot fields currently available (repository fact)

`packages/core-search`'s `searches` table / `StoredSearch.parameters` (`ServiceProfileFields`, immutable snapshot
taken at Search creation, migration `0014_searches`):

| Field | Type | Notes |
|---|---|---|
| `service` | text | Used by `SERVICE_MATCH` |
| `targetCustomer` | text | The field this decision concerns |
| `geography` | text | Not currently used by any criterion |
| `minProjectValuePaise` | integer | Used by `MINIMUM_VALUE_MATCH` |
| `triggers` | text[] | Not currently used by any criterion |
| `keywords` | text[] | Not currently used by any criterion |
| `rationale` | text | Not currently used by any criterion |

`targetCustomer` here is the **Search owner's stated criterion at Search-creation time** — e.g. "Restaurants." It
is not, by itself, a statement about any specific discovered business.

---

## 5. Opportunity fields currently available (repository fact)

`opportunities` table (migration `0017_opportunities`):

| Field | Type | Notes |
|---|---|---|
| `id`, `user_id`, `prospect_id` | — | Identity/ownership |
| `state` | text | `NEW` \| `RESEARCHED` |
| `need_detected` | boolean | Need/offer presence |
| `recommended_service` | text, nullable | Used by `SERVICE_MATCH` (via `offerService`) |
| `offer_rationale` | text, nullable | Not used by any criterion |
| `offer_estimated_value_paise` | integer, nullable | Used by `MINIMUM_VALUE_MATCH` (via `offerEstimatedValuePaise`) |
| `offer_fit` | integer, nullable | Not used by any criterion |
| `offer_based_on` | text[] | Evidence-signal ids; not used by any criterion |

**There is no `target_customer`, `observed_target_customer`, or equivalent column on `opportunities`, `prospects`,
or `companies`.** Nothing in the Opportunity/Prospect/Company schema independently records what kind of customer a
specific discovered business actually is, as distinct from the Search's own stated criterion.

---

## 6. Why category-plausibility cannot be substituted (governing fact, restated — not reinterpreted)

`@acos/core-research`'s category-plausibility determination (`getCategoryPlausibilityDetermination`,
`StoredCategoryPlausibilityDetermination`) is the only existing repository mechanism that evaluates a prospect
against a target-customer-like concept (`targetSegments`, `segmentResults`, `aggregateResult`). The PDEF-4
authorization record explicitly excludes it: "do NOT use category-plausibility as a substitute; B-3 explicitly
excludes that," and separately, `core-qualification`'s own `CATEGORY_PLAUSIBLE` criterion is named by the
authorization record as exactly the kind of semantics the new evaluator must NOT reuse ("do NOT reuse
`core-qualification` semantics merely because that module already exists"). This record does not argue with that
exclusion; it only confirms, by reading the code, that category-plausibility is the one mechanism that otherwise
would be the obvious source, and that it is foreclosed.

---

## 7. Open questions — `PENDING PRODUCT OWNER DECISION`

### 7.1 Can Search configuration alone establish target-customer match?

`PENDING PRODUCT OWNER DECISION.` Every Opportunity's Prospect was discovered under a Search whose `targetCustomer`
is already fixed — one reading is that "discovered under this Search" already IS the target-customer match, by
construction, since Discovery (`@acos/core-discovery`) filtered to that Search's criteria. A different reading is
that Discovery's filter is a *candidate* filter (it decides who to research), not a *confirmed-match* determination
— i.e., a discovered business might still turn out, on inspection, not to actually be the stated target customer,
which is arguably part of what category-plausibility exists to check (and is excluded here). **This record takes
no position on which reading is correct** — the Product Owner's 2026-10-05 ruling explicitly directs that this not
be inferred ("Do not infer that because a Search has a target-customer configuration, every resulting Opportunity
necessarily matches that target customer").

### 7.2 Is a new Opportunity-level `observed_target_customer` field required?

`PENDING PRODUCT OWNER DECISION.` If 7.1 is answered "no" (Search configuration alone is insufficient), some new,
authorized, non-category-plausibility signal would be needed — e.g., a dedicated field populated by some other
stage of the pipeline — but no such stage currently exists, and this record does not propose designing one without
authorization to do so.

### 7.3 Does any existing authorized signal already satisfy the criterion?

`PENDING PRODUCT OWNER DECISION.` Candidates surveyed and their status:

| Candidate | Status |
|---|---|
| Category-plausibility determination | Excluded by B-3 (§6 above) |
| Research signals (`@acos/core-research`'s `StoredResearchSignal`) | Not excluded by name, but B-3 restricts evaluator input to "search snapshot only" — whether a research signal counts as part of "the search snapshot" or is excluded the same way category-plausibility is, is itself unresolved. This record does **not** use research signals, per the 2026-10-05 ruling's explicit instruction not to use them "unless an existing governing decision explicitly permits them" — no such permission has been identified. |
| `Prospect`/`Company` fields | Reviewed in §5 — none exist that record a target-customer-like attribute. |
| `Opportunity.offer_rationale` (free text) | Exists, but is prose generated by `suggestOffers()`, not a structured target-customer field; using it would require new parsing/derivation logic this record does not propose. |

---

## 8. Minimal schema/data change required, per illustrative option (no option selected)

Presented for completeness only — **selecting an option is a Product Owner act, not performed by this record**:

| Illustrative option | Minimal schema/data change | Who would decide this is correct |
|---|---|---|
| A — Search-membership implies match | None (no schema change; evaluator would treat snapshot.targetCustomer as self-satisfied for any Opportunity under that Search) | Product Owner — this record's author takes no position, and the 2026-10-05 ruling bars choosing this silently |
| B — New Opportunity-level observed field | New nullable column (e.g. on `opportunities` or a new table), a new migration, and a new write path populated by some pipeline stage not yet specified | Product Owner + Engineering (new ED needed) |
| C — Permit a named existing signal (e.g. a specific research-signal field) | No schema change; evaluator subject-construction in `pcg4.ts` would read that signal | Product Owner (must explicitly permit; not inferred here) |
| D — Leave `TARGET_CUSTOMER_MATCH` permanently `UNKNOWN`, accept PCG-4 stays effectively non-evaluable | None | Product Owner (an explicit acceptance, not a default) |

---

## 9. Effect of each option on PCG-4 numerator/denominator (illustrative, no option selected)

- **Denominator** (users with ≥1 COMPLETE Search in window) is unaffected by any option — it does not depend on
  `TARGET_CUSTOMER_MATCH` at all (§3, confirmed by `pcg4.test.ts`'s denominator-only tests).
- **Option A**: `TARGET_CUSTOMER_MATCH` becomes trivially `true` for every row; numerator becomes
  `SERVICE_MATCH AND MINIMUM_VALUE_MATCH` only (effectively a two-criterion gate).
- **Option B**: numerator becomes a genuine three-criterion conjunction once the new field is populated; before
  that, still `UNKNOWN`/`0` for any Opportunity predating the field's introduction.
- **Option C**: numerator becomes a genuine three-criterion conjunction immediately, bounded by how reliable the
  permitted signal is for this purpose (a question this record does not evaluate).
- **Option D**: numerator remains structurally `0` for every window, indefinitely — PCG-4 would report
  `NOT_YET_EVALUABLE`-in-effect forever, which is a real, if unappealing, decision outcome.

---

## 10. Effect on independent validation (ED-12)

PCG-4 is a **monitoring gate**, not one of the four blocker gates requiring independent pre-launch validation
(PCG-1, PCG-2, PCG-3A, PCG-3B — see `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`).
`@acos/core-launch-gates-validation`'s `recompute.ts` therefore does not and need not recompute PCG-4, and nothing
in this decision affects the independent-validation scope already implemented for the four blocker gates. Whichever
option is eventually chosen, it changes only `@acos/core-qualification-equivalence`/`pcg4.ts`'s production path.

---

## 11. Whether each option changes an existing Product Owner decision

- **Option A** would effectively narrow PCG-4's "qualification-equivalence evaluator match" (an existing,
  authorized term) to a two-criterion check in practice — this record flags that as a potential, not confirmed,
  conflict with the authorization record's explicit three-criterion description ("service/product criteria, target
  customer criteria, minimum project/value criteria"). Choosing Option A may itself require amending the
  authorization record, not merely implementing against it.
- **Option B** does not change any existing decision; it adds new scope (a new field + write path) requiring its
  own engineering-design authorization, analogous to how ED-1 through ED-13 were each separately authorized.
- **Option C** does not change any existing decision IF the named signal is genuinely "part of the search snapshot"
  as B-3 intends; it MAY require clarifying B-3's boundary if the signal is research-derived, which could be read
  as reopening B-3.
- **Option D** changes no decision; it is a deferral, not a resolution.

---

## 12. Clear options for Product Owner selection

- [ ] **Option A** — Search-membership (the fact that an Opportunity's Prospect was discovered under a Search with
  a given `targetCustomer`) is itself sufficient to satisfy `TARGET_CUSTOMER_MATCH`. (Flagged in §11 as a possible
  authorization-record amendment, not a pure implementation choice.)
- [ ] **Option B** — Authorize a new Opportunity-level (or equivalent) `observed_target_customer` field, its
  migration, and the pipeline stage that would populate it, as new engineering scope requiring its own ED/B-series
  decision.
- [ ] **Option C** — Name a specific existing signal (state which one) that may be used for this criterion, and
  confirm it is within B-3's "search snapshot only" boundary (or amend B-3 to permit it explicitly).
- [ ] **Option D** — Accept that `TARGET_CUSTOMER_MATCH` remains `UNKNOWN` and PCG-4's numerator remains
  structurally non-positive until a future decision; no further engineering action required for this gate now.
- [ ] **Other** (specify): _______________________________________________

## 13. Product Owner selection

**Selected option:** _______________________________________________

**Date:** _______________________________________________

**Rationale (optional):** _______________________________________________

---

## 14. Classification of statements in this record

- **Governing facts** — §2, §6, §10 (quoted/derived directly from already-authorized records; not reopened).
- **Repository facts** — §3, §4, §5 (verified by reading code/schema and by the passing test suites named in §3).
- **Engineering observations** — §7.3's candidate survey, §8's illustrative schema-change sketches, §9's
  numerator/denominator mechanics — these describe consequences of options, not recommendations between them.
- **Analyst recommendations** — none. This record deliberately offers none, per its own stated scope.
- **Unresolved Product Owner decisions** — §7.1, §7.2, §7.3 (whether a candidate is usable), and the final
  selection in §12–§13.

---

## 15. Authority and status

This record carries no authority beyond documenting the gap. It does not authorize Option A, B, C, or D. Until
§13 is completed by the Product Owner, `evaluatePcg4` continues to run exactly as implemented (fail-soft,
`TARGET_CUSTOMER_MATCH` always `UNKNOWN` under current wiring, numerator structurally non-positive), and this is
the correct, intended behavior — not a bug awaiting a hotfix.

**Decision status: PENDING — Product Owner selection required.**
