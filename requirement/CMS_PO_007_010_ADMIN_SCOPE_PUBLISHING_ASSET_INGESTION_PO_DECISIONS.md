# Governance Record: CMS Administrator Management, Scope, Publishing Workflow, and Asset Ingestion (CMS-PO-007 .. 010)

**Identifier-collision notice (read first):** `CMS-PO-007` was already used in `requirement/PLUS_PRO_CMS_PO_001_007_GOVERNANCE_AUDIT.md` for a *different* decision (Plus/Pro independent purchasability), there disambiguated as `CMS-PO-007(R1)`. That file is **not rewritten**. Per the same disambiguation convention `CMS_PO_006_ADMINISTRATOR_AUTHORIZATION_PO_DECISION.md` already established for its own collision, this round's decision is referred to as **`CMS-PO-007(R3)`** anywhere precision matters, and as `CMS-PO-007` only where the Product Owner's own words are quoted verbatim. `CMS-PO-008` through `CMS-PO-010` have no existing collision as of this record, but `PLUS_PRO_MAX_CMS_PO_001_005_FINAL_GOVERNANCE_AUDIT.md`'s own header note suggested `CMS-PO-008..012` as candidate renumbered IDs for a future R1/R2 housekeeping pass that has not happened — this record's use of `008`/`009`/`010` for genuinely new decisions is flagged here as a second, related numbering tension, not silently resolved. A future housekeeping pass should assign all of CMS-PO-001 through CMS-PO-010 (across all rounds: R1, R2, R3) non-colliding IDs once.

**Scope:** Record four Product Owner decisions narrowing the scope of the CMS admin authorization foundation (CMS-PO-006(R3), implemented in commit `f03b233`) before any CMS admin HTTP API is built. **No implementation, migration, `cms_admins` row, or admin API route results from this record.**

---

## CMS-PO-007(R3) — CMS Administrator Management

**Decision:** CMS administrators cannot grant or revoke CMS administrator membership through the application at this stage. `cms_admins` remains an operator-controlled authorization surface. Initial administrator provisioning and administrator revocation are performed through a trusted operator/database operation. No CMS admin-management API is to be built at this stage.

**Rationale:** This avoids introducing a privilege-escalation surface before there is a demonstrated product need for administrators to manage other administrators. If application-level admin management is required later, it requires a separate PO decision and implementation phase.

**Relationship to existing governance:** Directly resolves the open question CMS Phase 4's read-only survey raised in §4.B ("whether admins may grant/revoke other admins via an API") — that survey's own recommendation (defer) is what this decision adopts. Does not modify `CMS-PO-006(R3)`: `cms_admins`'s schema, FK shape, and read-only `CmsAdminRepository` are unchanged and remain exactly as implemented in commit `f03b233`.

**Status:** APPROVED / RECORDED.

**Implementation changed:** NO.

---

## CMS-PO-008 — CMS Administrator Scope

**Decision:** A CMS administrator is a **global** CMS administrator. A valid row in `cms_admins` authorizes management of all three CMS-managed customer products — `ai_income_99` (current Plus display plan), `ai_freelancing_499` (current Pro display plan), and `ai_client_acquisition_1499_subscription` (current Max display plan). There is no per-product administrator scope. No product-specific roles, permission columns, or administrator/product join tables are to be added.

**Important distinction (preserved, not reinterpreted):** This decision governs *administrative* authorization only — who may create/edit/publish/archive CMS content and manage plan display names. It does **not** change customer entitlement rules in any way: customer access to published content remains governed exclusively by the existing, unmodified `permittedContentPlans`/`subscription_periods`-based access model (CMS-PO-002(R2)/CMS-PO-003(R2)/CMS-PO-005(R2)). An administrator's global write authorization and a customer's plan-scoped read authorization are two structurally independent mechanisms; this decision touches only the former.

**Relationship to existing governance:** Resolves CMS Phase 4 survey §4.C, which found the current `cms_admins` schema (a bare `user_id` primary key, no scope column) structurally only supports the global model and recommended it for exactly that reason — this decision adopts that recommendation. Consistent with `CMS-PO-002(R2)`'s Max→Plus+Pro+Max customer-content inheritance model existing independently of (and now, explicitly, never conflated with) this administrative scope.

**Status:** APPROVED / RECORDED.

**Implementation changed:** NO. (`cms_admins`'s existing schema — `user_id` PK, no scope column — already matches this decision exactly; no migration is implied or needed by this record.)

---

## CMS-PO-009 — CMS Publishing Workflow

**Decision:** CMS publishing uses a simple, immediate lifecycle model. A CMS administrator may directly change the lifecycle status of CMS content using the existing CMS lifecycle functionality. There is no approval workflow, no second-admin approval, no scheduled publishing, no mandatory publishing confirmation workflow, and no separate CMS audit-log system required at this stage. Existing database lifecycle constraints and existing CMS service validation remain authoritative. Publishing/archive operations must continue through the existing CMS service layer (`setLifecycleStatus`/`archiveContentItem` in `contentService.ts`) and must not bypass its validation or the database's `content_items_status_valid`/`content_items_archived_consistency` constraints.

**Relationship to existing governance:** Resolves CMS Phase 4 survey §4.D ("not yet specified") in the minimal direction: nothing beyond what `contentService.ts`'s already-implemented, already-tested `setLifecycleStatus` provides is required. Reaffirms `CMS-PO-004(R2)`'s DRAFT→PUBLISHED→ARCHIVED model and `CMS-PO-006(R1)`'s original lifecycle decision — no new lifecycle state is introduced, no state is removed.

**Status:** APPROVED / RECORDED.

**Implementation changed:** NO. (`setLifecycleStatus`/`archiveContentItem` already implement exactly this — a single, unconditional, immediate transition — with no changes required.)

---

## CMS-PO-010 — CMS Asset Ingestion

**Decision:** CMS asset ingestion/upload is **NOT yet specified** and must **NOT** be implemented as part of the current CMS admin API phase. The existing `content_items.storage_key` field and `createAsset()` service do not constitute a file-upload/storage system — `createAsset()` accepts any caller-supplied `storageKey` string and validates only that it is non-blank; nothing confirms a file actually exists at that key. No assumption is made about local filesystem storage, S3/object storage, a CDN, direct browser uploads, server-side multipart upload, pre-signed URLs, or an external uploader — none of these is designed or approved by this record. A production CMS `createAsset` HTTP endpoint must not be exposed until the asset storage/ingestion model has been explicitly designed and approved in a future decision. The existing `createAsset()` domain capability may remain available internally (e.g. for future server-side/operator tooling, or once an ingestion model is approved) but no HTTP upload/asset-ingestion workflow is to be invented now.

**Relationship to existing governance:** Directly restates CMS Phase 4 survey §4.E's finding verbatim as a formal decision, rather than leaving it as an open survey note. Consistent with the existing, unrelated `contentStore.ts` local-disk adapter (which serves the hardcoded `DEC-012`/`DEC-013` ₹99 bundle and has no upload path of its own) remaining untouched and out of scope.

**Status:** DEFERRED / REQUIRES FUTURE PO DECISION.

**Implementation changed:** NO. No storage infrastructure, upload route, S3/CDN dependency, or storage credential/configuration has been added or is implied by this record.

---

## Implementation status

This is a Product Owner governance record only. As of this record: no code was modified, no migration was applied, no `cms_admins` row was inserted, and no CMS admin API route or UI was created. `CMS-PO-006(R3)` is unmodified. The next implementation step this record authorizes — but does not itself perform — is building a CMS admin content/display-name API gated by `requireCmsAdmin`, scoped globally (CMS-PO-008), using the existing immediate-lifecycle model (CMS-PO-009), and explicitly excluding any `createAsset`/upload HTTP surface until CMS-PO-010 is resolved.
