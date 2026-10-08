# CLIENT_FINDER_PDEF_4_PCG4_GOVERNANCE_RECONCILIATION_PREPARATION

**STATUS: PREPARATION ONLY — NO DECISION.**

This record reconciles an apparent contradiction flagged by `requirement/CLIENT_FINDER_PDEF_4_PCG4_REAL_RESEARCH_E2E_TEST_AUTHORIZATION_DECISION_PREPARATION.md` between `PDEF4-PCG4-PO-DEC-001` and the later PCG-4/TARGET_CUSTOMER_MATCH decision chain. It is read-only governance analysis. It does not modify source code, tests, migrations, schema, or production wiring; does not create a new implementation authorization; does not commit or push; and does not silently resolve the contradiction without citing the governing text.

## §1 Baseline

- **HEAD:** `1898d8180d35909f5a2465061d8d8b4c5539d152`
- **Branch:** `feature/client-intent-discovery-complete`
- **Upstream:** `origin/feature/client-intent-discovery-complete`, confirmed at the same SHA.
- **Working tree:** 112 changed entries before this record was written (111 pre-existing + the previous preparation record); this task adds exactly one new file. No tracked file is touched.

## §2 Governing chronology

Filesystem mtimes on these (currently untracked, uncommitted) records establish a strictly increasing creation order consistent with the chain's own stated dependencies — all dated "2026-10-05" in text, but distinguishable by mtime:

| Time (mtime) | Record | Self-classification |
|---|---|---|
| 13:09:28 | `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md` | Conformance record (top-level, pre-dates PCG-4 sub-chain); records PCG-4 as NOT YET EVALUABLE |
| 13:22:14 | `..._PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md` | Preparation — no authority, selects no option |
| 13:33:12 | `..._PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` — **PDEF4-PCG4-PO-DEC-001** | Decision — delegated PO authority |
| 13:40:21 / 13:48:37 | ED preparation / questionnaire | Preparation |
| 14:00:58 | `..._ENGINEERING_DESIGN_DECISION.md` — **PDEF4-PCG4-ED-DEC-001** | Decision — delegated authority, design only |
| 14:07:45 / 14:11:51 | Mechanism preparation / questionnaire | Preparation |
| 14:21:04 | `..._EVALUATION_MECHANISM_PRODUCT_OWNER_DECISION.md` — **PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001** | Decision — delegated authority, policy/design only |
| 14:36:11 / 14:41:16 | Technical design preparation / questionnaire | Preparation |
| 14:46:50 | `..._TECHNICAL_DESIGN_DECISION.md` — **PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001** | Decision — delegated engineering authority, design only |
| 14:53:42 | Implementation-authorization preparation | Preparation |
| 14:57:32 | `..._IMPLEMENTATION_AUTHORIZATION_DECISION.md` — **PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001** | Decision — delegated authority; authorizes code/schema/migrations/tests |
| 15:43:13 / 15:46:02 | Production-wiring preparation / questionnaire | Preparation |
| 15:47:08 | `..._PRODUCTION_WIRING_DECISION.md` — **PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001** | Decision — authorizes only DI wiring |
| 16:11:25 | `CLIENT_FINDER_PDEF_4_POST_COMMIT_IMPLEMENTATION_STATUS_AUDIT_PREPARATION.md` | Preparation — post-commit audit |
| 16:18:01 | `..._PCG4_REAL_RESEARCH_E2E_TEST_AUTHORIZATION_DECISION_PREPARATION.md` | Preparation — flags this contradiction |

Caveat: these are filesystem mtimes on an untracked working tree, not git-verified timestamps. All these files were bundled into a single commit together with the code (per the post-commit audit's own §2), so `git log` alone does not independently corroborate relative order among them — only the mtimes do, and they are consistent with the chain's own internal dependency citations (each later record cites the earlier ones by ID as already existing).

## §3 Authority matrix

| Record | Authority | Scope | Explicit exclusions | Supersedes? |
|---|---|---|---|---|
| PDEF4-PCG4-PO-DEC-001 | Delegated AI, PO-level | Selects Option B: defines *that* a new Opportunity-level observed-target-customer signal is the eventual path, as new engineering scope | Explicitly does not authorize schema, migration, engineering design, implementation, instrumentation, validation, deployment, release, or launch (§11) | No — §10 states explicitly it does not amend/reopen/weaken/contradict any named prior record |
| PDEF4-PCG4-ED-DEC-001 | Delegated AI, engineering-design-only | Six design decisions (table shape, timing, storage shape, provenance shape, history/recomputation model, derived migration-shape description) | Explicitly does not authorize schema, migrations, code, evaluator changes, worker changes, tests, validation, deployment, release, launch, billing, entitlement changes (§14) | No — cites PO-DEC-001 by ID as binding/read-only context, builds on its §7 semantics, does not alter it |
| PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001 | Delegated AI, policy/design-only | TC-MATCH-1..12: evidence source, verification bar, contradiction handling, metadata, fail-soft, replay, test-fixture categories, owning package | Explicitly: "No implementation authorization is granted by this record" (§6) | No |
| PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001 | Delegated engineering authority, design-only | TD-1..16: model I/O shape, sentinel mechanism, evidence schema, source binding, metadata columns, table/column names, unique index, migration split, retry/idempotency, no change to qualification-equivalence, pcg4.ts query widening, failure handling, test file, acceptance template | Explicitly: "authorizes ENGINEERING DESIGN DECISIONS ONLY... No deployment, release, production rollout, or launch" (§7) | No |
| PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 | Delegated AI authority (explicitly "not a human Product Owner's personal decision") | §2 moves migrations 0036/0037, evaluator, repository, service.ts integration, pcg4.ts join, and Real-Postgres E2E validation from "Not authorized" to **"Authorized"** | Explicitly excludes shared-transaction wrapping (TD-10 Option B) and production deployment/release/launch/rollout (§2) | No — §0: "All five were treated as binding and read-only. None was modified... No prior PO or Engineering decision's substance is restated beyond the minimum needed to cite it; none is altered" |
| PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001 | Delegated AI authority | DI wiring only: `SearchWorkerDeps.targetCustomerMatch` field, its forwarding, the production DI-construction object, two test extensions | Explicitly excludes usage-metering wiring, new env vars beyond existing ones, per-userId factory conversion, any change to the already-implemented evaluator/repository/service.ts block/pcg4.ts/migrations, and deployment/release/launch/rollout (§0, §7) | No — cites four prior decisions by ID, "treated as binding and read-only. None was modified" |
| CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md | Delegated AI, record-of-fact | Records PCG-4 as NOT YET EVALUABLE as of its own writing (predates the PCG-4 sub-chain by mtime) | N/A — descriptive, not authorizing | N/A |
| Post-Commit Implementation Status Audit Preparation | Preparation | Audits what exists after commit `1898d818` | No authority granted | N/A |
| Real-Research E2E Test Authorization Decision Preparation | Preparation | Flags the contradiction this record reconciles; separately finds the E2E test question Outcome B (ambiguous) | No authority granted | N/A |

No record in the sub-chain uses the words "supersede," "replace," or "amend" applied to another record. Several records contain explicit **non**-amendment language (PO-DEC-001 §10; IMPL-AUTH-DEC-001 §0; PRODWIRING-DEC-001 §0). **There is no explicit supersession mechanism anywhere in this chain** — each record instead states it adds a narrowly-scoped authorization on top of prior records treated as "binding and read-only," without altering their substance.

## §4 Contradiction analysis

The flagged tension rests on two quotations from `PDEF4-PCG4-PO-DEC-001`:

> §3, "Option B (new field)": *"Confirmed: no schema change, migration, or pipeline stage currently exists that would populate an Opportunity-level observed-target-customer signal. This is new, unauthorized-until-now engineering scope, consistent with the preparation record's own framing."*

> §8, "Effect on PCG-4": *"PCG-4 remains `NOT_YET_EVALUABLE`... [it] will remain `UNKNOWN`/structurally zero until the Option-B signal described in §9 is actually designed, migrated, implemented, and wired into `packages/core-launch-gates/src/pcg4.ts`'s subject construction — none of which is performed, authorized to be designed, or scheduled by this record."*

Read in isolation, these two passages could be mistaken for a standing prohibition: "this engineering scope is not authorized." But both passages are explicitly self-referential to *this record*: §3 describes the state of the repository *at the time PO-DEC-001 was written* ("no schema change... currently exists"), and §8's closing clause is qualified twice — "none of which is... scheduled **by this record**" — meaning PO-DEC-001 is stating what *it itself* does not do, not what no future record may do.

PO-DEC-001's own §9 and §5 make the forward path explicit:

> §5 (selected option): *"Option B — authorize the product-semantic definition of a new, future, Opportunity-level observed-target-customer signal, as new engineering scope **requiring its own subsequent engineering-design (ED) and implementation-authorization decisions.** This decision does not itself design, migrate, implement, or populate that signal."*

> §9 (closing line): *"This is new engineering scope requiring its own ED-series and implementation-authorization decisions before any code, schema, or migration work begins."*

This is not a prohibition — it is a **specification of the exact decision process** required before implementation could legitimately proceed: an ED-series decision, then an implementation-authorization decision. The subsequent chain followed exactly that specification, in order:
- `PDEF4-PCG4-ED-DEC-001` is the ED-series decision §9 called for (and self-limits to design only, per §14).
- `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` and `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001` are further design-only decisions, each self-limiting and each citing the prior records as binding.
- `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` is the implementation-authorization decision §9 called for — and its own §0 explicitly lists `PDEF4-PCG4-PO-DEC-001` as governing-chain context "treated as binding and read-only," with "none is altered."

**Reconciliation:** the contradiction is apparent, not real. PO-DEC-001 did not freeze the engineering scope or forbid its future authorization — it declined to grant that authorization *itself*, named the two decision types that would need to grant it, and the chain then produced exactly those two decision types, each citing PO-DEC-001 without altering it. No supersession, amendment, or override of PO-DEC-001 occurred or was needed, because PO-DEC-001 never claimed authority over whether later records could authorize the work — only over whether *it itself* did. §8's "remains NOT_YET_EVALUABLE" is a description of system state as of PO-DEC-001's writing, not a constraint that binds the system state as of later records; once ED-DEC-001 through IMPL-AUTH-DEC-001 actually designed, authorized, and (per the post-commit audit) implemented and wired the signal, §8's description became stale by the ordinary passage of events, not contradicted.

This reconciliation is this record's own interpretive reading of the governing text, offered with full citation; it is not itself a new Product Owner or Engineering decision, and it does not change what any record authorizes.

## §5 Product semantics status

**Decided**, by `PDEF4-PCG4-PO-DEC-001` (Option B: what the Opportunity-level observed-target-customer signal means, and that defining it is new engineering scope) and `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` (TC-MATCH-1..12: evidence source = Research-time source documents; MATCH/NO_MATCH verified-quote bar; contradiction → `NOT_YET_OBSERVED`; confidence never gates; no freshness expiry; fail-soft uniformly; replay via persisted artifacts). Not contradicted by anything later in the chain.

## §6 Engineering-design status

**Decided**, by `PDEF4-PCG4-ED-DEC-001` (ED-TC-1/3/4/6/8/9: signal keying by `search_id`+`prospect_id`, timing, storage shape, provenance shape, history/recomputation model, derived migration-shape description) and `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001` (TD-1..16: model I/O schema, NO_MATCH sentinel mechanism, evidence schema, source-document binding, metadata columns, exact table/column names, DB-enforced partial unique index, two-migration split, non-transactional insertion pattern, retry/idempotency, no change to `core-qualification-equivalence`, `pcg4.ts` query widening, failure handling, dedicated test file, acceptance-criteria template). Both explicitly design-only and both cite prior records as binding/unaltered.

## §7 Implementation authorization status

**Authorized**, by `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §2: migrations 0036/0037, the `targetCustomerMatch.ts` evaluator, the repository, the `service.ts` integration, the `pcg4.ts` join, and "Real-Postgres end-to-end validation (PCG-4 numerator/denominator over real rows)" are all marked "Authorized." Explicitly **not** authorized by that record: shared-transaction wrapping of signals/categoryPlausibility/targetCustomerMatch writes (TD-10 Option B, "remains a separate undecided question") and production deployment/release/launch/rollout.

`PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001` separately authorizes only the dependency-injection wiring (the `SearchWorkerDeps` field, its forwarding, the production DI-construction object, two test extensions) — explicitly treating the IMPL-AUTH-DEC-001-authorized code as "already implemented and tested" and out of its own scope to re-touch.

Per §4 above, this authorization chain is not undermined by the PO-DEC-001 passages — it is the legitimate fulfillment of the process PO-DEC-001's own §9 specified.

## §8 Validation/E2E authorization status

Actually covered: `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §5's "Real-Postgres E2E" acceptance line ("a full `evaluatePcg4` run over seeded rows including a `MATCH` determination produces a non-structurally-zero numerator") is satisfied, read literally, by the existing direct-repository-seed test at `tests/integration/target-customer-match.integration.test.ts:261-290`.

Ambiguous (per the prior preparation record, not re-litigated here): whether that same acceptance line also covers — and therefore pre-authorizes — a *stricter* variant that runs a MATCH-producing fake model through the real worker claim loop before persisting and reading the numerator. No record in this chain names that specific combined scenario. This narrow ambiguity is unaffected by the §4 reconciliation above: resolving the PO-DEC-001-vs-chain tension does not resolve the separate, narrower "seeded rows" wording question.

## §9 Determination

**The proposed stricter E2E test remains classified B — Ambiguous.**

This reconciliation confirms the broader implementation (the evaluator, repository, service.ts integration, pcg4.ts join, and the literal "seeded rows" E2E acceptance criterion) is validly authorized and not undermined by the PO-DEC-001 passages. But the exact combined chain — fake MATCH-producing model → real worker claim loop → persistence → `pcg4.ts` → non-zero numerator — is not named by any record's text. `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §5 speaks only of "seeded rows," without using the words "worker," "claim loop," or "model call." That specific combined scenario is therefore not clearly covered by existing authorization, nor clearly excluded — hence Outcome B, consistent with (and now on firmer footing than) the prior preparation record's finding.

## §10 Required next governance action

A narrow scope clarification only — not a new Product Owner or Engineering Design decision on product or engineering substance, since none of the underlying semantics, design, or implementation authorization is in question. The clarification needed: **does `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §5's "seeded rows" acceptance line include a pipeline-level (fake-model-through-worker) seeding method, or only a direct-repository-seed method (already satisfied)?** This record does not create that clarification; it is reserved for a future decision record, at the discretion of whoever holds that authority.

## §11 Explicit non-actions

- No implementation was performed.
- No code or test file was changed.
- No migration was created or changed.
- No commit was made.
- No push was made.
- No deployment, release, or rollout occurred or was authorized.
- No new Product Owner decision was made.
- No new Engineering Design decision was made.
- No existing decision was amended, superseded, or reinterpreted — only read and cited.

## Verification

- HEAD unchanged: `1898d8180d35909f5a2465061d8d8b4c5539d152`.
- Upstream unchanged: `origin/feature/client-intent-discovery-complete` at the same SHA.
- All 112 pre-existing working-tree entries unchanged by this task.
- No source, test, schema, or migration file changed.
- Only this preparation record was newly created.
- SHA-256 and final `git status` are reported in this task's final message (not embedded here, to avoid a self-referential hash).

---

**GOVERNANCE RECONCILIATION PREPARATION ONLY — NO NEW DECISION OR IMPLEMENTATION AUTHORIZED.**
