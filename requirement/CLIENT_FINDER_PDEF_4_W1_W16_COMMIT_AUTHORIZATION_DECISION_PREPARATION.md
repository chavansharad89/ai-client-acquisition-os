# Client Finder / PDEF-4 — W-1–W-16 Commit-Authorization Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-W1-W16-COMMIT-AUTH-PREP-001`
**Date:** 2026-10-05
**Type:** Preparation record only. Contains analyst findings and a recommended file boundary. **Makes no
decision.** Prepared under the same read-only, no-mutation discipline as the preceding lockfile-reconciliation
and governance-scope audits; nothing in the working tree was staged, committed, pushed, or regenerated while
producing this record.

**Why this record exists:** `PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-DEC-001` (Pattern B) authorizes implementing the
gate-evaluation worker wiring but explicitly excludes touching `packages/core-launch-gates/**` and
`packages/core-qualification-equivalence/**`, and the broader record that actually created those packages
(`CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-DEC-001`, workstreams W-1–W-16) explicitly states **"Commit
or push authority — this task performs neither"** (§8). No record anywhere authorizes committing W-1–W-16's
implementation. Pattern B cannot produce a CI-valid commit (`pnpm install --frozen-lockfile`) without
`core-launch-gates` existing in the committed tree, so this gap blocks Pattern B too. This record prepares — but
does not make — the missing commit-authorization decision.

---

## 1. Scope

**What this decision would cover, if made:** whether the already-implemented, already-tested W-1–W-16
workstream (migrations 0031–0035; `core-funnel-events`, `core-qualification-equivalence`, `core-launch-gates`,
`core-launch-gates-validation`; the visitor-cookie/middleware/order/webhook/upsell/opportunity-page code that
instruments PCG-1–PCG-6; the Phase-9 real-Postgres fixture suite) may now be **committed to git** for the first
time, as a distinct commit from Pattern B.

**What this decision would NOT cover (explicitly out of scope, carried forward unchanged):**
- Any new implementation work. Everything in scope here already exists on disk, per
  `CLIENT-FINDER-PDEF-4-IMPLEMENTATION-CONFORMANCE-001`.
- Any change to PCG-1..6 semantics, thresholds, or blocker/monitoring classification.
- Any new migration beyond 0031–0035 (already written, not newly authored by this decision).
- ED-3 (bot/internal allowlist) — remains a documented, unimplemented gap (`IMPLEMENTATION_CONFORMANCE_RECORD.md`
  §3A). Not built, not authorized to be built, by this decision.
- Pattern B's gate-evaluation operational wiring — remains governed solely by
  `PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-DEC-001`, unchanged, unexpanded.
- Any deployment, release, launch, or rollout. `K1-10` remains a separate, unauthorized gate.
- The PCG-4 TARGET_CUSTOMER_MATCH / real-research end-to-end test workstream (see §3, "excluded" row) — a
  distinct, still-undecided thread with its own preparation documents.

---

## 2. Evidence (from the existing conformance record; not re-derived or re-tested here)

Per `CLIENT-FINDER-PDEF-4-IMPLEMENTATION-CONFORMANCE-001` §5/§5A/§6A — **not independently re-run for this
preparation record**; cited as-is, dated 2026-10-05:

| Workstream | Implemented | Tested | Real-Postgres evidence | Independently validated | Known gaps |
|---|---|---|---|---|---|
| W-1/W-2 (PCG-1 evidence, visitor identity) | Yes | Yes | Via Phase 9 suite | N/A | Cookie consent/privacy review flagged, not blocking |
| W-3/W-4 (PCG-3A/3B exposure) | Yes | Yes | Via Phase 9 suite | N/A | None recorded |
| W-5 (`completed_at`) | Yes | Yes | Yes (`search-worker.integration.test.ts`) | N/A | None recorded |
| W-6 (refund events) | Yes | Yes | Yes (`refund.integration.test.ts`) | N/A | Webhook wiring to live Razorpay event out of re-verification scope |
| W-7 (reviewed event) | Yes | Yes | Via Phase 9 suite | N/A | None recorded |
| W-8 (qualification-equivalence evaluator) | Yes | Yes (8/8) | N/A (pure function) | N/A | "not-satisfied" vs "indeterminate" distinction open, non-blocking |
| W-9/W-10/W-11 (gate computation, PCG-4/6, windowing) | Yes | Yes (16/16) | Yes (Phase 9) | **Yes** (diff full match) | **PCG-4 structurally NOT YET EVALUABLE** (TARGET_CUSTOMER_MATCH unresolved at W-8/W-9 level — see §3 below) |
| W-12/W-13/W-14 (independent validation, cross-check, evidence) | Yes | Yes (6/6 + Phase 9) | Yes | Yes | None recorded |
| W-15 (migrations 0031–0035) | Yes | Yes (every integration suite applies the chain) | Yes | N/A | None recorded |
| W-16 (tests) | Yes | Yes | Yes | N/A | 5 pre-existing, unrelated integration-test failures documented, not caused by W-1–W-16 |
| ED-3 (bot/internal allowlist) | **No** | N/A | N/A | N/A | Documented implementation gap, needs an operational input (allowlist contents), not a new PO decision |
| "Operationally integrated" (any gate route/job calling `evaluateAllGates`) | **No**, for every gate workstream | — | — | — | This is exactly what Pattern B (a separate authorization) now fills in |

**Conclusion carried forward, not re-litigated:** W-1–W-16 is implementation-complete and tested to the standard
its own authorization required. PCG-4's NOT YET EVALUABLE status and ED-3's gap are known, already-documented,
non-blocking-for-commit conditions — they describe what the code correctly does/doesn't do, not a defect in the
code as committed-candidate.

---

## 3. Proposed commit boundary

### 3.1 — Files belonging to W-1–W-16 (the commit this decision would authorize)

**New files:**
- `packages/db/prisma/migrations/0031_funnel_events/migration.sql`
- `packages/db/prisma/migrations/0032_order_visitor_id/migration.sql`
- `packages/db/prisma/migrations/0033_searches_completed_at/migration.sql`
- `packages/db/prisma/migrations/0034_refund_events/migration.sql`
- `packages/db/prisma/migrations/0035_gate_evaluation_snapshots/migration.sql`
- `apps/web/middleware.ts`
- `apps/web/src/server/visitor.ts`
- `packages/core-payments/src/refundEvents.ts`
- `packages/core-funnel-events/**` (package.json, src/*, tsconfig.json, vitest.config.ts)
- `packages/core-qualification-equivalence/**` (same shape)
- `packages/core-launch-gates/**` (same shape)
- `packages/core-launch-gates-validation/**` (same shape)
- `tests/fixtures/launch-gates-fixtures.ts`
- `tests/integration/launch-gates-phase9.integration.test.ts`
- `tests/integration/refund.integration.test.ts`

**Modified files:**
- `packages/db/prisma/schema.prisma` (`Order.visitorId`, `searches.completed_at`)
- `apps/web/app/api/payments/create-order/route.ts`
- `apps/web/app/upsell/[productId]/page.tsx`
- `apps/web/src/components/UpsellTracker.tsx`
- `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` and its `page.test.ts`
- `apps/web/package.json` (adds `@acos/core-funnel-events`)
- `packages/core-payments/src/createOrder.ts`, `createOrder.test.ts`, `orderRepository.ts`, `index.ts`,
  `webhookHandler.ts`, `webhookPgStore.ts`, `webhook.test.ts`
- `packages/core-search/src/pgRepository.ts`, `types.ts`, `testSupport.ts`
- `packages/core-research/src/service.test.ts` (one-line `completedAt: null` fixture update — a ripple from
  W-5's new `Search.completedAt` field onto an unrelated package's test fixture; not a change to
  `core-research`'s production code or TARGET_CUSTOMER_MATCH behavior)
- `tests/integration/search-worker.integration.test.ts`
- `tests/integration/support/pgOrderRepository.ts`
- `tests/fixtures/test-run-context.ts`
- `tests/package.json` (adds `@acos/core-launch-gates`, `@acos/core-launch-gates-validation`)
- `pnpm-lock.yaml` — **only the isolated subset** attributable to the packages above (see §5); **not yet
  regenerated or verified for this exact boundary — see §5's open item**.

### 3.2 — Pattern B's files (separate, already authorized, unaffected by this decision)
`apps/worker/package.json`, `apps/worker/src/index.ts`, `apps/worker/src/gateEvaluation/**`. These remain
governed exclusively by `PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-DEC-001` and are **not** part of this preparation
record's proposed boundary. The sequencing implication (§6) is that Pattern B would be committed *after* this
W-1–W-16 commit, as a small, dependent, second commit.

### 3.3 — Files that must NOT be included in either commit
- `tests/integration/target-customer-match.integration.test.ts` — imports both `@acos/core-launch-gates` (this
  workstream) and `@acos/core-research`'s TARGET_CUSTOMER_MATCH repository (the separately, already-committed
  `1898d81` workstream). It is not listed anywhere in `IMPLEMENTATION_CONFORMANCE_RECORD.md`'s Phase 1–11
  mapping. It belongs to a third, still-undecided thread (`CLIENT_FINDER_PDEF_4_PCG4_REAL_RESEARCH_E2E_TEST_*`
  preparation/scope documents exist; no decision record does). **Excluded from this boundary.**
- `apps/web/tsconfig.tsbuildinfo` — a TypeScript incremental-build cache artifact, already tracked in git
  (modified, not new). Unrelated to any workstream's source content; regenerates automatically. **Should not be
  staged by either commit**, independent of this decision.
- Every `requirement/*.md` file **not** already cited as this workstream's own governing chain (e.g.
  `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION*.md`, `CLIENT_FINDER_PDEF_2_*`, `CLIENT_FINDER_PDEF_3_*`,
  `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA*`, `CLIENT_FINDER_PDEF_4_PCG4_*`, `CLIENT_FINDER_PDEF_4_ANALYST_RECOMMENDATION.md`,
  `CLIENT_FINDER_PDEF_4_FINAL_READINESS_AUDIT.md`, `CLIENT_FINDER_PDEF_4_POST_COMMIT_IMPLEMENTATION_STATUS_AUDIT_PREPARATION.md`,
  `CLIENT_FINDER_PDEF_4_PRODUCT_OWNER_ADOPTION_QUESTIONNAIRE.md`, `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`,
  `CLIENT_FINDER_PDEF_4_ED3_OPERATIONAL_INPUT_DECISION_PREPARATION.md`). These belong to other, separate
  decision threads (some already resolved and committed, some still pending on their own). **Not assumed to ride
  along with this commit** — see the open item in §7/questionnaire.
- Whether this workstream's *own* governing records (`CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`,
  `..._PREPARATION.md`, `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md`,
  `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`,
  `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`,
  `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md` and its questionnaire/preparation/facilitation files)
  should ride along with this code commit — this repository's own precedent (commit `1898d81` bundled its
  governing `requirement/*.md` files with its code) suggests yes, but this is a documentation-commit-boundary
  choice, not an engineering fact, and is left to the questionnaire rather than assumed here.

### 3.4 — Files transitively required for a clean CI checkout
Per the dependency-link mechanics proven in the prior lockfile-reconciliation audit: committing
`apps/web/package.json`'s and `tests/package.json`'s new dependency entries without the corresponding new
package directories (`core-funnel-events`, `core-launch-gates`, `core-launch-gates-validation`,
`core-qualification-equivalence`) present in the same commit would break `pnpm install --frozen-lockfile`
identically to the Pattern B case already audited — a `workspace:*` link to a directory absent from the
checkout. All four new packages are therefore load-bearing for *this* commit's own CI validity, independent of
Pattern B.

---

## 4. Implementation-completeness check (Step 3), summarized

No gaps were found that are specific to *committing* this work (as opposed to its already-documented,
already-flagged functional gaps, carried forward unchanged from §2 above). No new implementation was performed
to "fill" anything for this preparation record, per instruction.

---

## 5. Lockfile implications

The current, fully-dirty `pnpm-lock.yaml` diff (74 insertions, previously audited) decomposes cleanly into two
disjoint subsets:
- **W-1–W-16's own subset:** the `apps/web` importer's `core-funnel-events` entry, the `tests` importer's
  `core-launch-gates`/`core-launch-gates-validation` entries, and the four new packages' own importer blocks
  (`core-funnel-events`, `core-qualification-equivalence`, `core-launch-gates`, `core-launch-gates-validation`).
- **Pattern B's own subset:** the `apps/worker` importer's `core-launch-gates` entry (34 insertions, already
  isolated and proven via the throwaway worktree experiment in the prior audit).

These two subsets are disjoint and additive — together they account for the full 74-insertion diff, with no
remainder and no further unrelated contamination. **This resolves the earlier "mixed lockfile" finding**: the
lockfile was never contaminated by anything outside these two related, legitimate workstreams; it only looked
mixed when evaluated against Pattern B alone.

**Open item, not yet performed (regeneration remains out of scope for this preparation record per instruction):**
isolating and generating *just* the W-1–W-16 subset (i.e., the full dirty lockfile minus the `apps/worker`
3-line block) via the same worktree-overlay method already validated, to produce the exact lockfile this
commit would carry. This is a mechanical step to perform only once this decision is made, not before.

**Sequencing consequence:** if W-1–W-16 is committed first with its own isolated lockfile subset, Pattern B's
subsequent commit becomes trivial — it adds only the `apps/worker` importer entry to an already-correct,
already-committed lockfile, with no risk of re-introducing unrelated entries.

---

## 6. Commit sequencing (recommendation, not a decision)

1. W-1–W-16 commit (this record's subject): migrations, the four new packages, the instrumentation/wiring code,
   the Phase-9 fixture suite, and the isolated lockfile subset.
2. Pattern B commit (already authorized, already audited): `apps/worker/package.json`, the `gateEvaluation/`
   module, `apps/worker/src/index.ts`, and the small incremental lockfile addition.

This sequencing also resolves, as a side effect, the earlier-flagged problem that
`tests/integration/launch-gates-phase9.integration.test.ts` has no git baseline: if it is committed wholesale
as part of step 1 (its genuine origin), step 2's later, separate addition of Pattern B's 3 tests to that
*now-committed* file becomes an ordinary, diffable, baseline-provable change — no reconstruction problem
remains.

---

## 7. Stop conditions for whoever makes this decision

- Any finding that W-1–W-16's implementation is not what `IMPLEMENTATION_CONFORMANCE_RECORD.md` represents it
  to be (not independently re-verified by this preparation record beyond what §2 cites).
- Any attempt to use this decision to also authorize ED-3, PCG-4's TARGET_CUSTOMER_MATCH resolution, Pattern A,
  or any deployment/release/launch action — none of those are in scope here.
- Any attempt to broaden this decision into a new implementation task rather than a commit-authorization
  question for already-existing work.

---

## 8. Git verification

| Field | Value |
|---|---|
| HEAD | `1898d8180d35909f5a2465061d8d8b4c5539d152` |
| Upstream | `1898d8180d35909f5a2465061d8d8b4c5539d152` (matches HEAD) |
| Staged files | 0 |
| Working-tree entries (`git status --porcelain -uall`) | 126 |
| Files created by this task | This record only |
| Code/lockfile/migration files modified by this task | 0 |
| Commit made | No |
| Push made | No |
| Deployment/release/rollout performed | No |
