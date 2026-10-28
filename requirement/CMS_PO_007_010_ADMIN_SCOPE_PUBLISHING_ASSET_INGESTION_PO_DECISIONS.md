# Governance Record: CMS Administrator Management, Scope, Publishing Workflow, and Asset Ingestion (CMS-PO-007 .. 010)

**Identifier-collision notice (read first):** `CMS-PO-007` was already used in `requirement/PLUS_PRO_CMS_PO_001_007_GOVERNANCE_AUDIT.md` for a *different* decision (Plus/Pro independent purchasability), there disambiguated as `CMS-PO-007(R1)`. That file is **not rewritten**. Per the same disambiguation convention `CMS_PO_006_ADMINISTRATOR_AUTHORIZATION_PO_DECISION.md` already established for its own collision, this round's decision is referred to as **`CMS-PO-007(R3)`** anywhere precision matters, and as `CMS-PO-007` only where the Product Owner's own words are quoted verbatim. `CMS-PO-008` and `CMS-PO-009` have no existing collision as of this record. `CMS-PO-010` was first recorded in this same document as a DEFERRED placeholder (no collision with another document either) and has since been resolved by a dedicated decision round within this document; it is disambiguated here as `CMS-PO-010(R1)` (superseded, deferred) and `CMS-PO-010(R2)` (the current, approved decision set) — both rounds live in this one file, so there is no cross-document collision, only an intra-document round history that this notice records explicitly rather than silently overwriting. A third round, `CMS-PO-010(R3)`, was later recorded in this same file, resolving a narrower question `CMS-PO-010(R2)-G` itself left open (the physical-retention treatment of an ordinary, non-replacement archive); `R3` clarifies `R2`'s scope and does not supersede or amend it. `PLUS_PRO_MAX_CMS_PO_001_005_FINAL_GOVERNANCE_AUDIT.md`'s own header note separately suggested `CMS-PO-008..012` as candidate renumbered IDs for a future R1/R2 housekeeping pass that has not happened — this record's use of `008`/`009`/`010` for genuinely new decisions is flagged here as a second, related numbering tension, not silently resolved. A future housekeeping pass should assign all of CMS-PO-001 through CMS-PO-010 (across all rounds) non-colliding IDs once.

**Scope:** Record four Product Owner decisions narrowing the scope of the CMS admin authorization foundation (CMS-PO-006(R3), implemented in commit `f03b233`) before any CMS admin HTTP API is built, **plus** a later decision round (`CMS-PO-010(R2)`) resolving the asset-ingestion model that `CMS-PO-010(R1)` originally deferred, **plus** a still-later round (`CMS-PO-010(R3)`) resolving the physical-retention treatment of ordinary (non-replacement) archiving, a question `CMS-PO-010(R2)-G` left open. **No implementation, migration, `cms_admins` row, admin API route, storage bucket, R2 resource, or other infrastructure results from this record.**

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

## CMS-PO-010(R1) — CMS Asset Ingestion — SUPERSEDED

**Original decision (preserved for history):** CMS asset ingestion/upload is **NOT yet specified** and must **NOT** be implemented as part of the current CMS admin API phase. The existing `content_items.storage_key` field and `createAsset()` service do not constitute a file-upload/storage system — `createAsset()` accepts any caller-supplied `storageKey` string and validates only that it is non-blank; nothing confirms a file actually exists at that key. No assumption is made about local filesystem storage, S3/object storage, a CDN, direct browser uploads, server-side multipart upload, pre-signed URLs, or an external uploader — none of these is designed or approved by this record. A production CMS `createAsset` HTTP endpoint must not be exposed until the asset storage/ingestion model has been explicitly designed and approved in a future decision. The existing `createAsset()` domain capability may remain available internally (e.g. for future server-side/operator tooling, or once an ingestion model is approved) but no HTTP upload/asset-ingestion workflow is to be invented now.

**Relationship to existing governance (as originally recorded):** Directly restates CMS Phase 4 survey §4.E's finding verbatim as a formal decision, rather than leaving it as an open survey note. Consistent with the existing, unrelated `contentStore.ts` local-disk adapter (which serves the hardcoded `DEC-012`/`DEC-013` ₹99 bundle and has no upload path of its own) remaining untouched and out of scope.

**Status:** SUPERSEDED by `CMS-PO-010(R2)` below. The deferral itself has now been resolved by a dedicated Product Owner decision round; this entry is retained only for audit history and must not be read as the current decision.

**Implementation changed:** NO (at the time this R1 entry was recorded).

---

## CMS-PO-010(R2) — CMS Asset Ingestion

**Scope of this round:** Formal Product Owner decision round resolving the deferral recorded in `CMS-PO-010(R1)` above. This round records **decisions only**. It does **not** authorize or perform implementation: no migration, code, API route, storage bucket, Cloudflare R2 resource, or other infrastructure results from this record. The next implementation step (building the asset-ingestion system against these decisions) is a separate, future phase.

### CMS-PO-010(R2)-A — Physical asset storage

**Decision:** Option B — Object Storage. CMS-managed physical assets are stored in dedicated object storage. The production application filesystem must NOT be the canonical asset store. The CMS database retains the logical asset metadata/reference, including `storage_key`. The selected provider is Cloudflare R2 (see Secondary Decision 1).

**Relationship to existing governance:** Narrows `CMS-PO-010(R1)`'s open "local filesystem storage, S3/object storage, a CDN" question to object storage specifically, and further to Cloudflare R2. Consistent with `content_items.storage_key` (established under `CMS-PO-006(R1)`/implemented in commit `f03b233`) continuing to hold the logical reference; this decision does not change that column's shape.

**Status:** APPROVED / RECORDED.

### CMS-PO-010(R2)-B — Customer asset delivery

**Decision:** Option B — Temporary signed URL. Customer asset access must follow: (1) authenticate the customer; (2) verify the customer has the required active entitlement/content-plan access; (3) verify the CMS content is currently `PUBLISHED`; (4) generate a temporary signed URL; (5) deliver the asset directly from object storage. Permanent public asset URLs are not permitted. A signed URL is a temporary delivery credential and does NOT replace entitlement authorization.

**Relationship to existing governance:** Step 2 reaffirms the existing, unmodified `permittedContentPlans`/`subscription_periods`-based customer entitlement model (`CMS-PO-002(R2)`/`CMS-PO-003(R2)`/`CMS-PO-005(R2)`); step 3 reaffirms the `CMS-PO-004(R2)` DRAFT→PUBLISHED→ARCHIVED lifecycle. Neither is altered by this decision.

**Status:** APPROVED / RECORDED.

### CMS-PO-010(R2)-C — Admin asset ingestion

**Decision:** Option B — Pre-signed direct upload. CMS admin uploads use a direct-to-object-storage upload model: (1) authenticate the user; (2) verify CMS-admin authorization; (3) authorize the upload; (4) generate temporary upload authorization; (5) browser uploads directly to object storage; (6) CMS records/associates the resulting storage reference and metadata. The application must not proxy the entire asset through the web server as the normal production upload path.

**Relationship to existing governance:** Step 2 reaffirms the existing `requireCmsAdmin`/`cms_admins` authorization foundation (`CMS-PO-006(R3)`) and its global scope (`CMS-PO-008`); this decision does not alter that authorization model, only the upload transport built on top of it.

**Status:** APPROVED / RECORDED.

### CMS-PO-010(R2)-D — Asset types

**Decision:** Option B — Documents + downloadable videos. The initial CMS asset allowlist is: PDF, DOCX, XLSX, PPTX, ZIP, JPG/JPEG, PNG, WEBP, MP4. Arbitrary file types are NOT allowed. Videos are downloadable assets.

**Status:** APPROVED / RECORDED.

### CMS-PO-010(R2)-E — Video handling

**Decision:** Option B — Download + browser playback. Video assets must remain downloadable, must also support browser playback, and use the same object-storage foundation. Dedicated video-streaming infrastructure is NOT required for the initial implementation. Transcoding, adaptive streaming, DRM, and a dedicated video platform are not introduced unless separately approved (see Deferred list below).

**Status:** APPROVED / RECORDED.

### CMS-PO-010(R2)-F — Asset lifecycle/versioning

**Decision:** Option A — Replace existing asset in place. A CMS asset retains its logical identity when its physical file is replaced. The current physical `storage_key` may change to point to the replacement object. Full CMS-level version history is NOT required. The old physical object must not be immediately destroyed solely because it was replaced; it follows the approved retention policy (CMS-PO-010(R2)-G).

**Status:** APPROVED / RECORDED.

### CMS-PO-010(R2)-G — Physical asset deletion/retention

**Decision:** Option B — Delete old physical assets after a retention period. When a real CMS asset is archived or replaced: its obsolete physical object is NOT immediately deleted; it is retained temporarily; after the approved retention period it becomes eligible for physical deletion; cleanup must verify the object is not referenced by a current CMS asset before deletion. The approved retention duration is **30 days**.

**Relationship to existing governance:** This 30-day *physical object retention* period is a distinct concept from the ₹1,499 customer *entitlement* period, which is also 30 days under `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` — the two must not be collapsed; see "Important distinctions" below.

**Status:** APPROVED / RECORDED.

### Secondary Product Owner decisions

1. **Object-storage provider — Decision: Cloudflare R2.** Cloudflare R2 is the selected object-storage provider for CMS assets. Do not substitute another provider without a new PO decision.
2. **Signed URL expiry — Decision: 1 hour.** Customer signed URLs are valid for 1 hour. This does NOT extend or modify the customer's 30-day entitlement. The exact provider-specific signing implementation is an engineering detail.
3. **Storage key / folder structure — Decision: Product + Asset ID.** Use the stable internal ProductId plus the CMS content/asset ID: conceptually `cms/<stable-product-id>/assets/<content-item-id>.<extension>`. Use the stable ProductId — do NOT use configurable plan display names such as "Plus"/"Pro"/"Max" (per `CMS-PO-008`'s display-name/scope separation), and do NOT use customer email, user ID, entitlement ID, or other customer-specific identifiers. Admins do not choose arbitrary storage keys; the system generates the storage key.
4. **Maximum asset size — Decision: 500 MB per asset.** All approved asset types initially use the same 500 MB maximum. Do not create different type-specific limits unless separately approved.
5. **Upload validation/security — Decision: Basic validation only.** Initial validation must include: CMS admin authorization; maximum size <= 500 MB; approved file extension; MIME-type validation. Initial implementation does NOT require malware/virus scanning, deep content inspection, or specialized security scanning. The security decision can be revisited later.
6. **Upload → publication behavior — Decision: Uploaded assets always remain DRAFT.** A successful upload must NOT automatically publish customer content. Flow: Upload → Validate → DRAFT → explicit admin Publish → PUBLISHED. Only explicit publication makes the asset customer-accessible. Consistent with `CMS-PO-009`: once the admin explicitly chooses Publish, publication is immediate.
7. **Replacement of an already-PUBLISHED asset — Decision: Replacement remains DRAFT until explicitly published.** If v1 = PUBLISHED and the admin uploads a replacement, v2 = DRAFT and v1 remains customer-visible. Only when the admin explicitly publishes v2 does v2 become the live asset. After publication, v1 becomes obsolete and v1's physical object enters the 30-day retention period (CMS-PO-010(R2)-G). There must be no silent customer-facing replacement.
8. **Pending replacement behavior — Decision: Replace the existing DRAFT.** There may be at most one currently PUBLISHED version and one pending DRAFT replacement. If a DRAFT replacement already exists and the admin uploads another replacement, replace the existing DRAFT's physical asset/reference — do NOT create multiple competing CMS draft versions. The currently PUBLISHED asset remains untouched until explicit publication.
9. **Archived asset customer access — Decision: Archiving immediately removes customer access.** When a CMS asset becomes `ARCHIVED`, it is immediately excluded from customer-accessible published content; active entitlement does NOT preserve access; archive status takes precedence over customer entitlement for that asset. However, the physical R2 object is NOT immediately deleted — it remains subject to the 30-day physical retention policy (CMS-PO-010(R2)-G). This is a deliberate separation between CMS availability and physical storage retention.
10. **Failed / abandoned upload cleanup — Decision: Automatically clean up abandoned uploads.** Failed or abandoned uploads must not remain indefinitely in R2. The approved cleanup retention is **24 hours**: an upload that never becomes a valid/current CMS asset is eligible for cleanup after 24 hours. This is separate from the 30-day retention policy for obsolete real assets. Cleanup must not delete an object referenced by a current CMS asset.

**Status (secondary decisions 1-10):** APPROVED / RECORDED.

### Important distinctions (preserved, not collapsed)

Four separate time-bounded concepts exist and must not be conflated:

- **Customer entitlement** — Plus/Pro/Max (and the ₹1,499 AI Client Finder subscription) access is **30 days**. Existing decision; unmodified by this record.
- **Signed URL lifetime** — **1 hour**. Secondary Decision 2, above.
- **Obsolete real asset retention** — obsolete/replaced/archived physical asset retention is **30 days**. CMS-PO-010(R2)-G, above.
- **Abandoned upload cleanup** — incomplete/abandoned upload cleanup is **24 hours**. Secondary Decision 10, above.

### Deferred / NOT YET DECIDED

The following remain engineering/implementation questions, explicitly NOT decided by this record, and must not be treated as PO decisions:

exact Cloudflare R2 bucket name; R2 account configuration; exact R2 SDK/API implementation; exact signed URL implementation; exact upload URL implementation; exact storage-key filename convention beyond the approved stable ProductId + Asset ID structure; exact MIME detection library; exact extension/MIME matching implementation; malware scanning; virus scanning; deep content inspection; CDN configuration; video transcoding; adaptive streaming; DRM; backup strategy; disaster recovery; exact cleanup-job implementation; exact mechanism for detecting abandoned uploads; R2 lifecycle-rule implementation; admin UI design; customer UI design.

**Status:** NOT DECIDED. A future PO decision is required before any of these may be designed or implemented.

**Implementation changed (CMS-PO-010(R2), all decisions above):** NO. This round is a governance record only — no migration, code, API route, storage bucket, R2 resource, or other infrastructure was created or modified as part of recording these decisions.

---

## CMS-PO-010(R3) — CMS Asset Archive Physical Retention

**Scope of this round:** Resolves an open structural question surfaced during CMS-PO-010(R2)'s implementation and a subsequent read-only engineering audit: `CMS-PO-010(R2)-G`'s "archived or replaced" phrasing does not, on its own, specify what happens to an ordinarily-archived (not replaced) asset's physical object — archiving, unlike replacement, never hands the asset's `storage_key` off to a new object, so the replacement path's obsolete-object/30-day-retention mechanism has no natural analogue for a plain archive. This round records a decision only; no code, migration, or infrastructure results from this record.

**Decision:** Option A — Archive retains the physical object indefinitely. When a CMS asset is archived:

1. The CMS content item remains in ARCHIVED status.
2. Customer access is immediately removed.
3. The content item remains available to CMS administrators.
4. The existing `storage_key` remains associated with the content item.
5. The physical R2 object is retained indefinitely.
6. No `content_item_obsolete_objects` row is created solely because of ordinary archiving.
7. The 30-day obsolete-object retention/cleanup mechanism applies to physical assets made obsolete by replacement, not to an ordinary reversible archive.
8. An archived asset may be reactivated through the existing CMS lifecycle mechanism, provided its physical object still exists.
9. Archive does NOT mean physical deletion or retirement.
10. No new CMS lifecycle state is introduced.

**Rationale:** Archive is a reversible CMS lifecycle operation whose primary effect is removal from customer-facing availability. Replacement is a separate physical-asset lifecycle operation in which a new object replaces an old object. Keeping these semantics separate preserves the existing CMS administrator workflow and avoids introducing an artificial terminal state, new storage-key semantics, or an undefined recovery mechanism.

**Relationship to existing governance:** Clarifies, and narrows the scope of, `CMS-PO-010(R2)-G`'s "archived or replaced" clause — `CMS-PO-010(R2)-G` is **not** superseded or amended; it continues to govern the replacement path's 30-day retention exactly as originally recorded. This round establishes that ordinary archiving (no replacement in play) sits outside that clause's physical-retention mechanism entirely, rather than being a second instance of it. Consistent with `CMS-PO-004`'s "archived content... remains available to administrators" and with the existing, unmodified `setLifecycleStatus`/`archiveContentItem` implementation (`contentService.ts`), whose own doc comment already asserted "DRAFT → PUBLISHED → ARCHIVED, or back" — reactivation of an archived asset was already the implementation's behavior; this record is what makes that an explicit Product Owner decision rather than an unstated engineering assumption. Does not modify `CMS-PO-006(R1)`'s three-state lifecycle, `CMS-PO-009`'s immediate-transition model, or `CMS-PO-010(R2)-F`'s replace-in-place design. This decision explicitly resolves the open question the engineering audit raised regarding physical retention of archived assets.

**Status:** APPROVED / RECORDED.

**Implementation changed:** NO. No `content_item_obsolete_objects` row creation on archive, no cleanup-semantics change, no `storage_key` nulling, no new lifecycle state, no migration, and no reactivation-behavior change results from this record. Every behavior described above is already what the current, unmodified implementation does — this record's only effect is to make that behavior an explicit, approved decision rather than an audit-flagged open question.

---

## Implementation status

This is a Product Owner governance record only. As of this record: no code was modified, no migration was applied, no `cms_admins` row was inserted, and no CMS admin API route, asset-ingestion code, storage bucket, or R2 resource was created. `CMS-PO-006(R3)` is unmodified. The admin content/display-name API already built under `CMS-PO-008`/`CMS-PO-009` is unaffected. The next implementation step this record authorizes — but does not itself perform — is building the asset-ingestion system (object-storage integration, pre-signed upload/download endpoints, allowlist/size/MIME validation, DRAFT/PUBLISHED asset lifecycle, and retention/cleanup jobs) strictly against the decisions recorded in `CMS-PO-010(R2)` above, with no provider-specific or implementation-level choice beyond what is explicitly decided here.
