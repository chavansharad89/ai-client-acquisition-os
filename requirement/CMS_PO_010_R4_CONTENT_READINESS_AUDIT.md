# CMS-PO-010(R4) Plus/Pro Content & R2 Readiness Audit

**Type:** Engineering/product readiness audit (read-only). Not a Product Owner decision record — does not create, amend, or supersede any decision below.

**Status:** DRAFT — awaiting scope approval. No implementation performed. `CMS-PO-010(R4)` is unmodified. The production Plus R2 migration was **not** executed. No migration, backfill, or CLI script was run against R2 or the database.

**Trigger:** Confirmed that all 10 existing Plus deliverables are sample/demo assets, not final customer-ready content. This conflicts with an assumption baked into the already-approved migration path (see §3).

---

## 1. Current-State Findings

### 1.1 Migration implementation — present, untouched, uncommitted

| Artifact | Path | Status |
|---|---|---|
| Migration logic | [legacyAssetR2Migration.ts](packages/core-cms/src/legacyAssetR2Migration.ts) | Untracked (`??`), not committed |
| Migration tests | [legacyAssetR2Migration.test.ts](packages/core-cms/src/legacyAssetR2Migration.test.ts) | Untracked, 15/15 passing (re-run during this audit) |
| R2 fake for tests | [fakeR2DirectUploadTarget.ts](packages/core-cms/src/testing/fakeR2DirectUploadTarget.ts) | Untracked |
| Migration CLI | [migrate-plus-assets-to-r2.ts](scripts/cms/migrate-plus-assets-to-r2.ts) | Untracked, not run |
| content_items backfill logic | [deliverablesBackfill.ts](packages/core-cms/src/deliverablesBackfill.ts) | Untracked, 14/14 passing (re-run during this audit) |
| Backfill CLI | [backfill-content-items-from-deliverables.ts](scripts/cms/backfill-content-items-from-deliverables.ts) | Untracked, not run |

Targeted test run this session: `vitest run src/legacyAssetR2Migration.test.ts src/deliverablesBackfill.test.ts` → **29/29 passed**. No other test suite, lint, or build was run (not warranted for a read-only audit).

Per item 2/3 of scope: neither CLI was invoked. The migration CLI's own refusal gate (`migrate-plus-assets-to-r2.ts:78-91`) independently refuses even `--dry-run` unless `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET_NAME` are all set — this audit did not rely on that gate and did not attempt to trigger it.

### 1.2 Governance already on record (unmodified)

- **`CMS-PO-010(R4)`** (`requirement/CMS_PO_007_010_ADMIN_SCOPE_PUBLISHING_ASSET_INGESTION_PO_DECISIONS.md`, ~line 180 on): APPROVED/RECORDED. Amends `PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` §14 points 3 and 8 — a physical file move into R2 **is** required for the Plus legacy migration (the spec's original "no physical file move" assumption was wrong). Everything else in §14 remains in force, including: `storage_key`/asset ids preserved unchanged, rows inserted flat (`parent_id = NULL`), migration is incremental with a parallel-run window, `entitlements` rows untouched.
- **`CMS-PO-009`**: No second-admin approval workflow exists or is planned. Publishing is a direct, immediate admin action through the existing `setLifecycleStatus`/`archiveContentItem` service.
- **`CMS-PO-010(R2)` secondary decision #6**: Uploaded assets always start `DRAFT`; only explicit admin publish makes content customer-visible.

### 1.3 The conflict this audit surfaces

`PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` §14 point 8 (still in force) requires migrated rows to be inserted as `status = 'PUBLISHED'`, "never DRAFT," with the stated rationale: *"these customers already see this content today... the migration is a storage-layer change, not a customer-visible content change."*

[deliverablesBackfill.ts:46,112-113,161](packages/core-cms/src/deliverablesBackfill.ts) implements exactly that: every backfilled row is force-set to `PUBLISHED`, unconditionally, with no DRAFT-first option.

That rationale is **no longer true** for Plus: the confirmed fact driving this audit is that the 10 Plus files are sample/demo placeholders, not the real deliverables customers paid for. Running the backfill as-built today — in any environment where it's pointed at a real customer-facing `content_items` table — would auto-publish placeholder content as if it were the live product. This is a product-readiness gap in the already-approved design, not a bug in the implementation (the implementation correctly does what §14 point 8 says).

### 1.4 Plus/Pro content inventory — source of truth is still the hardcoded catalog, not `content_items`

Both products' deliverables are defined in [packages/catalog/src/deliverables.ts](packages/catalog/src/deliverables.ts) (`MANIFEST`), not yet in `content_items`. The customer-facing download route and `/access/[productId]` page still read from this manifest, per `PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` §14 point 7's parallel-run design — no cutover has happened.

**Plus (`ai_income_99`) — 10 declared items, all 10 present on disk** (`apps/web/content/ai_income_99/`):

| id | storageKey | Local file present | File content |
|---|---|---|---|
| starter-prompt-library | prompt-library.pdf | ✅ (21,305 B, matches manifest) | 8-page real PDF |
| starter-pricing-sheet | pricing-sheet.xlsx | ✅ (13,649 B — **mismatches manifest's declared 48,000 B**) | — |
| starter-outreach-templates | outreach-templates.pdf | ✅ (8,529 B — **mismatches manifest's declared 310,000 B**) | 3-page real PDF |
| starter-prospect-sources | prospect-sources-checklist.pdf | ✅ (8,398 B, matches) | 1-page PDF |
| starter-prospect-research | prospect-research-worksheet.xlsx | ✅ (8,985 B, matches) | — |
| starter-opportunity-qualification | opportunity-qualification-checklist.pdf | ✅ (3,819 B, matches) | 1-page PDF |
| starter-prospect-scorecard | prospect-scorecard.xlsx | ✅ (8,154 B, matches) | — |
| starter-first-ai-service | first-ai-service-worksheet.pdf | ✅ (5,248 B, matches) | 2-page PDF |
| starter-discovery-call-questions | discovery-call-questions.pdf | ✅ (5,744 B, matches) | 2-page PDF |
| starter-acquisition-tracker | acquisition-tracker.xlsx | ✅ (8,982 B, matches) | — |

Two files (`pricing-sheet.xlsx`, `outreach-templates.pdf`) are smaller than the `bytes` value declared in the manifest — a stale-metadata signal consistent with these being early placeholder drafts rather than final files (the manifest's byte counts were set when a larger/different draft existed). All 10 are short, template-style documents consistent with the user's confirmation that these are sample/demo, not final customer deliverables.

**Pro (`ai_freelancing_499`) — 3 declared items, 0 present on disk.** `apps/web/content/ai_freelancing_499/` **does not exist**. The catalog manifest declares `launch-outreach-system` (5.1 MB), `launch-scope-pricing` (3.7 MB), and `launch-proposal-template` (890 KB), but no backing files exist anywhere in the repo. Today, any Pro customer attempting to download would hit `readLocalFile` → ENOENT → a 404/missing-file failure (not a security gap — `findDeliverable`/`readDeliverableFile` fail closed on a missing file — but a real product gap if any Pro entitlement is currently live).

### 1.5 R2 environment configuration — no dev/prod separation exists in code

- `packages/config/src/env.ts:196-199` defines exactly one set of keys — `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` — with no environment-qualified variants (no `R2_BUCKET_NAME_DEV`/`_PROD`, no `NODE_ENV`-based bucket selection, nothing in `apps/web/src/server/assetStorage.ts` or `apps/worker/src/index.ts` that varies bucket by environment).
- `.env`, `apps/web/.env.local`, and `.env.example` all carry the **same four key names**; which bucket/credentials are actually live depends entirely on which `.env` file is loaded at runtime. This repo's local `.env` and `apps/web/.env.local` currently have all four R2 values populated (confirmed present, values not read or printed by this audit).
- **Risk this creates:** nothing in the code, env schema, or CLI prevents a developer running `cms:migrate-plus-assets-to-r2` locally while `.env`/`apps/web/.env.local` happens to hold production R2 credentials (e.g. pulled from a shared secrets store for local debugging). Because the migration intentionally preserves `storage_key` values unchanged (§14 point 4, reaffirmed by R4), a write under those conditions would land at the **same key a real customer asset would use** in production — i.e. a demo/sample file could silently overwrite or sit under a production-shaped key. The migration's own conflict/ETag check (`legacyAssetR2Migration.ts`) protects against overwriting an object that's already there with different content, but does **not** protect against an empty production bucket receiving sample content as its first "real" write, because nothing distinguishes "this is the dev bucket" from "this is the prod bucket" at the config layer.
- No CI/deploy config (`docker-compose.yml`, `docker-compose.test.yml`) sets R2 variables at all — bucket selection is entirely developer/operator-environment-dependent today.

---

## 2. Plus/Pro Content-Readiness Matrix

| Dimension | Plus (`ai_income_99`) | Pro (`ai_freelancing_499`) |
|---|---|---|
| Declared items (catalog manifest) | 10 | 3 |
| Backing files present | 10 / 10 | 0 / 3 |
| Confirmed content status | Sample/demo (user-confirmed) | N/A — no files exist to assess |
| Byte-size metadata accuracy | 8/10 match manifest; 2/10 stale | N/A |
| Migrated into `content_items` | No (manifest is still the live source) | No |
| R2 migration run | No (not executed, per scope) | No (no source files to migrate) |
| Would be marked `PUBLISHED` if backfill ran as-is today | Yes, unconditionally (⚠ wrong given sample status) | N/A — backfill would fail/skip, no local file to upload |
| Blocking issue before any production publish | Content is placeholder, not final | Content does not exist |

---

## 3. CMS Records/Assets Requiring Approval Before Production Publishing

Per `CMS-PO-009` (no second-admin workflow) and `CMS-PO-010(R2)` secondary decision #6 (upload → DRAFT, explicit publish → PUBLISHED), "approval" here is a single explicit CMS-admin publish action, not a multi-party sign-off. The records that must **not** reach that action yet:

1. **All 10 Plus `content_items` rows**, once backfilled — must remain `DRAFT` until each is replaced with a final, customer-ready asset and deliberately published. The current `deliverablesBackfill.ts` behavior (force-`PUBLISHED`) must not run against a real content table until this is resolved (see §5, Task A).
2. **Any Pro `content_items` rows** — cannot be backfilled at all yet; there is no source file for any of the 3 declared Pro deliverables. Running the backfill for Pro today would hit `missing local file`/skip outcomes, not a false publish, but the underlying product gap (no Pro content exists) is the higher-priority issue.
3. **Any R2 object written by the Plus migration CLI** — none exist yet (CLI not run). Once it does run, each uploaded object corresponds 1:1 to a `content_items` row above and inherits the same DRAFT-first requirement.

No `entitlements`, authorization, or payment/webhook records are affected — this audit did not touch and found no issue in `core-entitlements`, Razorpay webhook handling, or `access.ts`, consistent with scope item 10.

---

## 4. Development/Production Environment Gaps

1. **No dedicated development R2 bucket or isolated credentials exist.** One bucket name, one credential set, selected only by whichever `.env` file is loaded — see §1.5.
2. **No environment-qualified config keys** (`R2_BUCKET_NAME_DEV` vs `_PROD`, or equivalent) exist in `packages/config/src/env.ts`'s schema to make the two environments structurally distinguishable at the type/config level.
3. **No safeguard in the CLI or `createR2AssetStorage`/`createR2DirectUploadTarget`** checks which environment a configured bucket belongs to — the refusal gate only checks "are credentials present," not "is this the right bucket for this environment."
4. **Sample/demo files usable for local upload/download testing without touching production:** confirmed safe **only if** a separate dev bucket + dev credentials are used (recommended below) and the migration CLI is pointed at them. Today, because there is only one set of config keys, "testing with sample files" and "writing to whatever bucket `.env` happens to name" are the same operation — there is no built-in isolation.

---

## 5. Recommended Implementation Tasks (not started — for approval)

**Task A — Decouple backfill publish state from "upload succeeded."**
Change `deliverablesBackfill.ts` so the target lifecycle status is a parameter (default `DRAFT`), not hardcoded `PUBLISHED`, OR gate the existing unconditional-`PUBLISHED` behavior behind an explicit `--confirm-content-is-final` flag the operator must pass per product. This requires either a Product Owner decision (if it changes the already-approved §14 point 8 behavior) or confirmation that §14 point 8's rationale was product-content-specific and doesn't bind future runs where that rationale (content already live) doesn't hold. **Flagging for explicit Product Owner input before any code change**, since §14 point 8 and `CMS-PO-010(R4)` are both approved records.

**Task B — Provision a dedicated development R2 bucket + isolated credential set.**
Add environment-qualified config (e.g. `R2_BUCKET_NAME` stays the single runtime key, but document/enforce via deployment config that dev and prod processes each load a distinct bucket name and distinct API token scoped to only that bucket). No application code change is strictly required if deploy-time secrets are simply provisioned separately — but add a startup-time check (e.g. logging/asserting the bucket name, never the credentials) so a misconfigured environment is loud, not silent.

**Task C — Produce real Pro deliverables (3 items) or formally re-scope Pro's launch content.**
No files exist today for `launch-outreach-system`, `launch-scope-pricing`, `launch-proposal-template`. This is a content-production task, not an engineering task, and should be tracked/owned outside this engineering backlog.

**Task D — Replace the 10 Plus sample/demo files with final content, or explicitly decide to ship a subset as final.**
Content-production task; engineering's role is limited to Task A (making sure the pipeline can't auto-publish whatever lands in `apps/web/content/ai_income_99/` without a deliberate step).

**Task E — Add an explicit storage-key/bucket-identity assertion to the migration CLI.**
Have `migrate-plus-assets-to-r2.ts` print (not just use) the configured bucket name and account id before any write, and require an interactive/flag confirmation when not run with `--dry-run`, so an operator with the wrong `.env` loaded gets a clear, pre-write signal of which bucket they're about to write to.

None of these tasks are implemented by this audit. Tasks A and D touch content/publishing policy and require Product Owner input before engineering proceeds (per CLAUDE.md §4.2); Tasks B, C, E are operational/infrastructure and content-production work respectively.

---

## 6. Acceptance Criteria and Release Gates (proposed)

Before the Plus R2 migration may run against production:

- [ ] Task B complete: a distinct dev R2 bucket + credentials exist and are what this audit's upload/download testing actually used (not production credentials).
- [ ] Task A resolved by explicit Product Owner decision: either backfilled rows default to `DRAFT`, or the "always `PUBLISHED`" behavior is reaffirmed with an explicit acknowledgment that current Plus content is sample/demo and will be published as such (unlikely to be the intended decision, but must be an explicit choice, not a default).
- [ ] All 10 Plus `content_items` rows that will go live are backed by final, customer-approved files — not the current sample set — or there is an explicit, documented Product Owner decision to ship the current set as final.
- [ ] Pro content gap (Task C) is either resolved (3 real files exist) or Pro's CMS migration is explicitly descoped/deferred by Product Owner decision, distinct from the Plus migration.
- [ ] Migration CLI run in the dedicated dev bucket first, with `--dry-run`, then live, and its report reviewed (0 conflicts, 0 unexpected missing files) before any production run is authorized.
- [ ] Explicit human approval obtained for the production run itself (CLAUDE.md §3.4/§4.2 — production storage writes are a security/infrastructure-sensitive operation regardless of how small the code change is).

---

## 7. Explicit Non-Actions (confirmed per scope)

- `CMS-PO-010(R4)` was read, not modified.
- The production Plus R2 migration CLI was not invoked (dry-run or otherwise).
- The existing migration/backfill implementation and tests were not changed; only re-run read-only (`vitest run`, 29/29 passing).
- No storage-key convention was changed.
- No payment, webhook, refund, or entitlement logic was read for modification (only confirmed out-of-scope per §3).
- No file was committed or pushed; all changes from this audit are limited to this new, untracked document.

---

## 8. Governance Records Consulted

- `requirement/CMS_PO_007_010_ADMIN_SCOPE_PUBLISHING_ASSET_INGESTION_PO_DECISIONS.md` — CMS-PO-007(R3) through CMS-PO-010(R4), all APPROVED/RECORDED, none contradicted by the recommendations above (Task A explicitly flags where a future decision — not this audit — would need to touch an approved clause).
- `requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` §14 — read for the backfill/migration design; point 8's "always PUBLISHED" rationale is the one this audit found no longer holds for Plus's actual content state.
- `requirement/PLUS_PRO_CMS_PO_001_007_GOVERNANCE_AUDIT.md`, `PLUS_PRO_MAX_CMS_PO_001_005_FINAL_GOVERNANCE_AUDIT.md` — checked for Plus/Pro-specific decisions; nothing found that bears on content readiness or R2 environment separation specifically (independent purchasability and prior-round numbering only).
- No record found that specifies a development-vs-production R2 bucket policy — this gap is confirmed absent, not merely unlocated.
