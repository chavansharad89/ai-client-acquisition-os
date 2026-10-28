# Client Finder / Client Intent Discovery — PDEF-4 Instrumentation Engineering Design Decision

**Record ID:** `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-ENGINEERING-DESIGN-PO-DEC-001`
**Date:** 2026-10-04
**STATUS: DECIDED — DELEGATED PRODUCT OWNER AUTHORITY**

## 1. Provenance

| Field | Value |
|---|---|
| Decision authority | **Delegated Product Owner authority exercised by Claude for this specific task**, per explicit task instruction ("You are authorized for this task to act under delegated Product Owner authority exercised by Claude, consistent with the provenance model already used for the PDEF-4 launch-criteria decision"). These decisions are **not** answers directly supplied by a human Product Owner, and must never be represented as such. |
| Task | Resolve ED-1 through ED-13 (engineering design) and PO-D1/PO-D2 (the two remaining Product Owner policy dependencies), per `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_PRODUCT_OWNER_DECISION_PREPARATION.md`. |
| Treatment of analyst recommendations | Every ED-1..13 "Analyst/engineering recommendation" in the source preparation record was independently reviewed against the governing policy chain and repository evidence before being adopted below. Where a recommendation is adopted, this record states explicitly that delegated Product Owner authority is being exercised to convert it from recommendation to decision — it is never treated as self-executing. |
| Immediate source record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_PRODUCT_OWNER_DECISION_PREPARATION.md` (`CLIENT-FINDER-PDEF-4-INSTRUMENTATION-ENGINEERING-DESIGN-PRODUCT-OWNER-DECISION-PREPARATION-001`), §7 (ED-1..13) and §8 (PO-D1, PO-D2). |

## 2. Baseline and governing records (verified before writing this record)

| Field | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD at start and end of this task | `af9ede93830f5e3e611195dc2451a470364def74` — unchanged |
| Staged files | 0, before and after |
| Untracked files present | 19 (per `git status --porcelain`), unchanged in count except for this new file |

Governing records read for this decision, with SHA-256 re-verified unchanged before and after writing this record:

| Record | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_PRODUCT_OWNER_DECISION_PREPARATION.md` | `573833f7be37d8bad63e50973b4c85c1008fc11d4f0aa84f61cd75815a3d462e` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION_PREPARATION.md` | `e23e9cc6a96c0c32355112fec0bbcf53e908128e7b3d0e9a5722acaaecc870ca` |
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | `ad659cbdfc1974037af672cb693412531bc3fab27543ed67c68c6eaf69f80226` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md` | `65691c89c31f8fe5e4068dfb10077f4f306acaad2c0c355ceab5db890abe9449` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` | `b3d2d2ae99b1a61810274ad043101c73d28daab7377b07ded7e9433b6b87598e` |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` |
| `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` | `6503c7787ea8737b01c154c9b203184dcbded2b42265a7c3e31a8b778f9ffd97` |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |
| `requirement/MVP_SCOPE_BOUNDARY.md` | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |

None of the above is modified, reopened, or superseded by this record. No commercial policy already decided (PDEF-2, entitlement stacking, PDEF-3 thresholds, PDEF-4 blocker/monitoring split, Q-1..Q-12) is altered below; no contradiction with any of them was found.

---

## 3. ED-1 through ED-13 — engineering design decisions

Each item below adopts one option from the preparation record's §7, under delegated authority. Rationale and repository evidence are carried forward from the preparation record (independently re-verified there against unchanged HEAD) and restated concisely; nothing here reopens the governing policy decisions each ED item is scoped under.

| ED | Decision | Selected option | Core rationale |
|---|---|---|---|
| ED-1 | Durable funnel/visitor event storage | **Option A** — new, dedicated generic append-only event table (`event_type`/`payload`, indexed by visitor id + timestamp) | Simplest architecture meeting the "smallest architecture that provides durable evidence, immutable identity, timestamps, dedup, auditability, rolling-window queries, extensibility" bar; defers type-specific optimization until real query patterns exist. `meta_events` (Option B) is purpose-built for Meta CAPI purchase dispatch and reusing it would conflate two different retention/purpose needs. |
| ED-2 | Visitor↔authenticated-user linkage | **Option B** — defer the merge mechanism; reserve a nullable linkage field, build no merge logic now | No decided gate (PCG-1 is pre-purchase/aggregate; PCG-2+ already key off `entitlements.customer_email`) requires this linkage. Building it now would be designing for a hypothetical future requirement, which this project's own engineering discipline (and MVP_SCOPE_BOUNDARY.md's general caution) counsels against. Keeps the door open cheaply without building unused logic. |
| ED-3 | Bot/internal-traffic exclusion | **Option B** — narrow, known-identifier allowlist (internal IPs, known QA/test accounts) | The only mechanism that cannot, by construction, change who counts as "qualified" under Q-1's decided terms (no eligibility criterion beyond funnel-entry + demonstrated intent). A behavioral heuristic (Option C) risks silently reopening Q-1 by excluding genuine visitors. |
| ED-4 | Event/window immutability mechanics | **Option A** — persist an explicit snapshot (value, denominator, computed-at timestamp) per gate per closed window | Gives a concrete, retrievable "what was computed and when" record for the ED-12 independent-validation requirement, rather than relying on recomputation remaining emergent-stable as event volume grows. |
| ED-5 | Offer-exposure (PCG-3A/3B) persisted event shape | **Option C** — persist `upsell_viewed` under its existing name, extended with a server-resolved (not client-supplied) visitor/session id | Matches the repository's existing pattern of resolving authoritative fields server-side rather than trusting the client; avoids duplicating capture (Option B) while keeping the field PII-free per the existing `assertNoPii()` boundary. |
| ED-6 | Refund webhook ingestion/idempotency | **Option C** — reuse `WebhookEvent.razorpayEventId @unique` for raw dedup; isolate Q-11/Q-12 refund business logic in its own module, not inline in `webhookHandler.ts` | Reuses the one idempotency pattern already proven in this codebase (as Q-12 itself points toward) while keeping refund-specific policy logic separable and testable, avoiding both pattern-duplication (Option B) and an overloaded `webhookHandler.ts` (plain Option A). |
| ED-7 | Rolling 30-day query/window strategy | **Option C** — extract `core-reconciliation`'s half-open-window boundary discipline into a small, shared, reusable boundary utility; leave each gate's population/filter logic bespoke | Boundary-tiling correctness (no double-count, no gap) is the one sub-problem already solved once in this codebase and is the costliest to get subtly wrong six independent times; population logic genuinely differs per gate and gains nothing from forced sharing. |
| ED-8 | Activation/search event mechanism (feeds PO-D1) | **Option A** — query the existing `Search` table directly; no mirrored/denormalized activation event | One source of truth; `Search` already carries the timestamp and tier-linkage fields PCG-4 needs. A mirrored projection (Option B) adds synchronization-drift risk for no offsetting benefit at current scale. |
| ED-9 | Completion event granularity (PCG-6) | **Option C** — a new, dedicated "opportunity reviewed" event, logged at the moment the review/action UI is reached, independent of `SearchStatus` and independent of whether feedback is ultimately submitted | `SearchStatus.COMPLETE` measures job completion, not user review; `feedback` creation conflates "reviewed" with "gave feedback" (a user can review without submitting feedback), which would undercount. A dedicated event is the only option faithful to PDEF-3's actual compound completion definition without silently redefining it to fit existing code. The exact UI call site is **not yet located** and is carried forward as an unresolved implementation detail (§9), not decided here. |
| ED-10 | Qualification-equivalence logic (PCG-4 condition (b)) | **Option A** — a new, standalone evaluator module, structurally separate from `core-qualification`, comparing an opportunity's attributes against the originating search's configured service/customer/value criteria, with a persisted per-opportunity result | `core-qualification` is independently re-confirmed NOT EQUIVALENT (prospect-plausibility criteria, no field for a searching user's own configured criteria). Q-10 already decided that if non-equivalent, new Client-Finder-specific logic is required and `core-qualification` must not be reused as-is; extending it (Option B) would reintroduce exactly the repurposing risk Q-10 was designed to foreclose. Persisting the result (over Option C's inline computation) preserves ED-4/ED-13 auditability. |
| ED-11 | PCG-4 denominator join/computation | **Option A** — a single joined SQL query over `entitlements` × `Search` (filtered per PO-D1 below) × ED-10's persisted qualification-result table, computed at report time | Keeps "why was this user counted" traceable to one query plan, consistent with ED-7's windowing approach and ED-4/ED-13's auditability goal. Multi-step application-code joins (Option B) trade this traceability for incremental testability that is not needed at this scale. |
| ED-12 | Independent-validation architecture (PCG-1/2/3A/3B) | **Option C** — both: (a) an independently-written production cross-check query, run by a party distinct from the implementing engineer, compared against the primary aggregation; and (b) a deterministic fixture/replay test suite covering window boundaries, duplicate events, dual-tier users, refund reversals, and insufficient-sample conditions | PDEF-4 §6.10's bar is independent validation of a hard launch blocker; relying on only production cross-checks (Option A) leaves rare edge cases unverified, and relying on only fixtures (Option B) never validates the real pipeline end-to-end. Required evidence regardless of mechanism: raw source rows for the validated window, the primary value, the independent value, and a match/mismatch record with reasons. **Who performs validation and how results are retained remain open process questions**, explicitly left to a separate, later process definition per PDEF-4 §6.10 — not decided by this record (§9). |
| ED-13 | Audit/evidence reporting mechanism | **Option C** — a reporting layer modeled on `core-reconciliation/src/report.ts`'s pattern (typed report object + pure, side-effect-free formatting functions), applied to PCG results, paired with ED-4's per-evaluation evidence-bundle persistence (source-row ids contributing to each numerator/denominator) | Reuses an already-proven in-repo reporting convention; pairing it with persisted evidence (rather than relying on raw-event re-querying alone, Option B) gives the fastest, most stable answer to "why was this user counted," required for both production use and the ED-12 validation process. |

**Delegated-authority statement:** for each ED item above, the source preparation record's "Analyst/engineering recommendation (NOT A DECISION)" is, by this record, explicitly adopted as the engineering design decision, under the delegated Product Owner authority stated in §1. No recommendation is treated as self-adopting; each adoption is a deliberate act of this record.

---

## 4. PO-D1 — PCG-4 denominator: what counts as "performed a search/activation"

**Decision: a defined subset — Option 3, concretely specified — only a `Search` row with `status = 'COMPLETE'` counts as "performed."**

(This is, in effect, the preparation record's Option 2 wording; it is recorded under the "Option 3 — another explicitly defined condition" heading because the preparation record's own Option 2 and the definition adopted here are the same rule, stated explicitly here with its own rationale rather than merely selected by label.)

**Exact operational rule:** PCG-4's denominator counts a ₹499/₹1,499 holder in a given rolling-30-day window if and only if at least one `Search` row attributable to them within that window has `status = 'COMPLETE'`. Rows with status `PENDING`, `RUNNING`, `FAILED`, or `CANCELLED` do not, by themselves, satisfy "performed" for denominator purposes.

**Rationale:** PCG-4 measures the rate of "useful outcome" among holders who had actual opportunity to produce one (Q-9's own rationale: "a holder who never used the product had no opportunity to produce a useful outcome"). That same logic extends one step further: a `Search` row that never finished — because it is still in-flight (`PENDING`/`RUNNING`), errored (`FAILED`), or was aborted (`CANCELLED`) — never delivered a result set to the user, and therefore never created the opportunity for a useful-outcome evaluation (ED-9's "reviewed" event and the `feedback.useful`/ED-10 qualification result both presuppose a completed search with delivered results). Counting an incomplete or failed attempt in the denominator would, by the same reasoning Q-9 used to exclude non-users, conflate "no opportunity existed" with "opportunity existed and was not converted" — diluting the gate's monitoring signal rather than making it more rigorous. `COMPLETE` is also the only status value requiring no exception logic (contrast the rejected "any status except `CANCELLED`" variant, which would still count `FAILED` rows despite those also never delivering results), making it the most auditable and unambiguous choice for a query filter.

**Repository evidence:** `packages/core-search/src/types.ts:9` — `SearchStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'CANCELLED'`. Only `COMPLETE` represents a search that finished and could have delivered a result for the user to act on.

**Engineering consequence:** ED-8's "query `Search` directly" design is finalized with filter `status = 'COMPLETE'`; ED-11's join adds this as the activation-side predicate.

**Downstream effect:** PCG-4 is monitoring-only (PDEF-4 §6.3); this decision affects the monitoring signal, not any launch-blocking gate.

## 5. PO-D2 — numeric sample floor for PCG-3A, PCG-3B, PCG-4, PCG-5

**Decision: four distinct, gate-specific numeric floors, derived from each gate's own already-decided threshold rate via a standard statistical adequacy rule — not inferred from PCG-1's 500 or PCG-2's 50.**

**Method:** the normal-approximation-to-binomial adequacy condition ("rule of ten"): a proportion estimate with true rate `p` is treated as having a large-enough sample once `n · min(p, 1−p) ≥ 10`, i.e. `n ≥ 10 / min(p, 1−p)`. This is a standard, provider-neutral statistical heuristic (not a business judgment call and not derived from any other gate's absolute-count floor), applied to each gate's own PDEF-3/PDEF-4-decided threshold:

| Gate | Decided threshold | `min(p, 1−p)` | Floor = `⌈10 / min(p,1−p)⌉` |
|---|---|---|---|
| PCG-3A | ≥ 10% | 0.10 | **100** |
| PCG-3B | ≥ 5% | 0.05 | **200** |
| PCG-4 | ≥ 60% | 0.40 | **25** |
| PCG-5 | ≤ 8% | 0.08 | **125** |

**Exact operational rule:** for each of PCG-3A, PCG-3B, PCG-4, and PCG-5, if the gate's denominator in a given rolling window is below the floor in the table above, the gate is reported as **NOT YET EVALUABLE** for that window (per Q-8's already-decided principle), regardless of what percentage the available data would otherwise compute to. At or above the floor, the percentage is reported and evaluated normally against the gate's existing threshold.

**Rationale:** Q-8 decided the floor *principle* but explicitly forbade inferring the *number* from PCG-1/2's absolute-count floors or from any analyst recommendation. A statistically grounded, rate-specific method satisfies both constraints: it does not borrow a number from another gate, and it is derived mechanically from each gate's own already-decided threshold rather than chosen by business judgment, making the four floors mutually consistent in the one dimension that matters (minimum statistical adequacy for a proportion estimate near that gate's own threshold) while differing numerically because the four gates' thresholds genuinely differ (5% needs a larger sample than 60% to be equally reliable).

**Repository evidence:** not applicable — PO-D2 is a pure policy-threshold question; no code or data determines statistical adequacy. The thresholds used (PCG-3A ≥10%, PCG-3B ≥5%, PCG-4 ≥60%, PCG-5 ≤8%) are carried forward unchanged from PDEF-3/PDEF-4 and are not reopened.

**Engineering consequence:** ED-7's windowing utility and ED-11/ED-8's denominator queries must report the raw denominator alongside each percentage (already required by Q-8); the floors above are the first numeric values a NOT-YET-EVALUABLE check can be built against.

**Downstream effect:** PCG-3A/PCG-3B are hard launch blockers — a denominator below 100 (PCG-3A) or 200 (PCG-3B) means that gate cannot be used to qualify or block a launch for that window, it is simply not yet evaluable. PCG-4/PCG-5 are monitoring-only — the floor affects signal reliability, not launch gating.

---

## 6. Consolidated rationale and repository evidence

All rationale and evidence supporting §3–§5 is stated inline with each decision above and is carried forward from, and consistent with, the independently re-verified repository evidence in `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_PRODUCT_OWNER_DECISION_PREPARATION.md` §5 (re-verified there against this record's own unchanged HEAD `af9ede9`). No new repository inspection beyond what that record already performed was required to adopt these decisions; no evidence claim here contradicts anything cited there.

## 7. MVP / out-of-MVP boundaries

Per `MVP_SCOPE_BOUNDARY.md` §6.5/§6.7 (not reopened): every ED-1..13 decision and both PO-D decisions above are scoped strictly to implementing the already-decided PCG-1..6 measurement (counting, windowing, auditing a fixed set of metrics). None of the above constitutes, authorizes, or implies:

- recurring subscriptions, usage-based billing, team workspaces, enterprise accounts, advanced quotas, or subscription plans (§6.5 — OUT OF MVP), or
- revenue optimization, cohort analytics, advanced attribution, or predictive conversion modeling (§6.7 — OUT OF MVP).

ED-9's "opportunity reviewed" event, ED-12's validation architecture, and ED-13's evidence-bundle reporting are explicitly basic PCG measurement/audit mechanisms, not analytics capabilities in the §6.7 sense. ED-2's deferred visitor/user merge is explicitly future scope, reserved but not built.

## 8. Engineering consequences (what this record unblocks, still pending separate implementation authorization)

- A new append-only event table and migration (ED-1), feeding ED-3/ED-5/ED-9's persisted events.
- A reserved-but-unused linkage field (ED-2) — no merge logic built.
- A narrow allowlist exclusion check (ED-3), applied against ED-1's event store.
- A per-window snapshot table (ED-4) plus an evidence-bundle extension (ED-13) recording contributing source-row ids.
- `upsell_viewed` persistence with a server-resolved visitor id (ED-5).
- Refund events added to `SUPPORTED_EVENTS`, reusing `WebhookEvent.razorpayEventId` dedup, with Q-11/Q-12 business logic isolated in its own module (ED-6).
- A shared half-open-window boundary utility, extracted from `core-reconciliation` (ED-7).
- PCG-4's activation query reads `Search` directly, filtered to `status = 'COMPLETE'` (ED-8, PO-D1).
- A new "opportunity reviewed" event, exact UI call site still to be identified (ED-9 — unresolved, see §9).
- A new standalone qualification-equivalence evaluator module, separate from `core-qualification`, with a persisted per-opportunity result (ED-10).
- A single joined query combining `entitlements` × `Search` × ED-10's result table for PCG-4 (ED-11).
- A dual-track validation build: an independent production cross-check plus a deterministic fixture/replay suite (ED-12 — process ownership still to be assigned, see §9).
- A `core-reconciliation`-style reporting layer over PCG results (ED-13).
- Four numeric NOT-YET-EVALUABLE floors (100 / 200 / 25 / 125) available for ED-7/ED-8/ED-11 to enforce (PO-D2).

**None of the above is implemented, scheduled, or authorized for implementation by this record** (see §10).

## 9. Remaining unresolved matters (explicitly not resolved by this record)

1. **ED-9's exact UI call site** for the "opportunity reviewed" event is not yet located in `apps/web/app/(client-finder)/...` and must be identified against the actual UI code before ED-9 can be implemented.
2. **ED-12's validation ownership and retention process** (who performs the independent cross-check, who authors/maintains the fixture suite, and how results are retained) is explicitly left to a separate process definition, per PDEF-4 §6.10 — not an engineering-design or Product-Owner-policy question this record resolves.
3. **Q-10's `core-qualification` equivalence review** (already flagged in the Instrumentation Product Owner Decision, §5 item 8) remains a precondition for finalizing PCG-4's numerator and is unaffected by this record.
4. **The refund payload-shape contract tests** (`tests/contract/razorpay-webhook.contract.test.ts`'s `it.todo` stubs) remain unimplemented; ED-6 depends on them eventually being filled in, not performed here.
5. Implementation sequencing/prioritization across ED-1..13 is not decided here; the dependency notes carried forward from the preparation record (e.g., ED-1 blocks ED-2/ED-3/ED-5/ED-7; PO-D1 blocks ED-8/ED-11's filter) still apply.

## 10. Authorization boundary

**This record grants policy/design-definition authority only.** It does **not** authorize, and nothing above should be read as authorizing, any of the following:

- source-code changes; schema changes; migrations;
- instrumentation implementation;
- billing changes; credit-ledger implementation;
- test implementation or validation execution;
- deployment, release, production traffic, or launch.

Every ED-1..13 adoption and both PO-D decisions in this record are **design/policy decisions only**. Implementation of any of them requires a separate, explicit authorization step, to be sought independently of this record.

**Final verification (performed before reporting completion):**

- HEAD unchanged: `af9ede93830f5e3e611195dc2451a470364def74`.
- 0 staged files, before and after.
- No source, test, schema, config, or dependency file modified.
- Only this decision record created (`requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`).
- All twelve governing-record SHA-256 hashes (§2) unchanged from the source preparation record's own table.
- No commit made. No push made.
