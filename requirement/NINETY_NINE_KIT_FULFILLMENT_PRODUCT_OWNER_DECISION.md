# ₹99 Kit — Post-Purchase Fulfillment & Identity Model — Product Owner Decision

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `DEC-010` (continues the architecture decision log in `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md`, §"ARCHITECTURE & IMPLEMENTATION TRUTH", whose last entry is `DEC-009`) |
| Date | 2026-10-06 |
| Type | Governance decision record — recording only. **Not an implementation, schema, migration, validation, deployment, or release authorization** (see §9). |
| Decision status | **DECIDED.** The Product Owner has supplied explicit, concrete selections for all seven items below, in response to the read-only fulfillment audit delivered earlier in this session. |

## 2. Decision authority

**Product Owner.** The decisions in §6 were supplied directly by the Product Owner and are recorded here verbatim, without improvement, reinterpretation, or added mechanics beyond what was explicitly stated.

## 3. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `769f0710d99fe4124f0070ab3348ac672cf73883` (unchanged by this record) |
| Working tree before this record | Untracked `requirement/*.md` governance files from prior sessions (unrelated tracks), plus a modified `apps/web/tsconfig.tsbuildinfo` (build artifact, unrelated) |
| File created by this record | this file only — no other file created or modified |

## 4. Governing sources (hashes verified at baseline, unchanged by this record)

| Record | SHA-256 | Role |
|---|---|---|
| `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` | `ab849ebc2391f9820025858bb4813e933c281781326b2a273af44ec1bbfb68b7` | Source of the global `DEC-NNN` sequence (`DEC-002` identity≠entitlement≠payment, `DEC-003` server-bound identity), R-01/R-02 (both tracked `NOT IMPLEMENTED`), the ACCESS TOKEN RULE. Not reopened, not changed. |
| `requirement/INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` | `c089858cd32704ff28c64a89a88b9f963bd7d8762ab1c5abb53bbb5fbe7deb83` | ₹99/₹499/₹1,499 independent-purchase pricing rule. Not reopened, not changed. |
| `packages/db/prisma/migrations/0004_entitlements/migration.sql` | `07fbd7422c53e726b6b644ec06c8e3196864be4c3f2622c6067d3cda7478b619` | `entitlements`/`access_tokens` schema, keyed on `customer_email`. Not reopened, not changed. |
| `packages/db/prisma/migrations/0012_user_identity/migration.sql` | `ad3a43bc4ab303bdb1a8df6b72d1a3e105d233ce1f351e4fdf71c8ccd986e181` | `users` table (id/email/created_at only — no password field), `access_tokens.user_id` linkage, built for Client Finder (`DEC-002`/`DEC-003`). Not reopened, not changed. |
| `packages/core-identity/src/session.ts` | `d75be878cb96ae7479423121acd93dfd1f96b97291dcf1fa5168e0bc873bc0be` | `requireUser`/`resolveSession`/`mintUserSession` — session primitives, provisioning-out-of-band only. Not reopened, not changed. |
| `apps/web/app/api/auth/session/route.ts` | `5b2989f3c77b37b33d07b4dd8bc17ac37c5c7d40f73bed19a1c837b2b377fea0` | Existing `/api/auth/session` route — mints a session for an *existing* user only; explicitly 404s if no `users` row exists; deliberately does not create one. Not reopened, not changed. |
| `packages/catalog/src/deliverables.ts` | `3dc6fcac750306668e9c89a4e90b2c049a36a2c93348e00995641b81df84b576` | ₹99 kit (`ai_income_99`) file manifest — three downloadable files, no "web-based workflow/tool" entity. Not reopened, not changed. |
| `apps/web/src/server/access.ts` | `d76b63e4ea93faf9ee69291dfa938ebe272e1fd17e71d8108e1c0887a1fe579e` | `currentAccess()` — hardcoded `ANONYMOUS`, explicit comment stating the webhook→token wiring is unimplemented. Not reopened, not changed. |
| `apps/worker/src/dispatchers/deliveryDispatcher.ts` | `7c9f66777953f1c466744b792f5c9344354b0e45af2fad569299e37707bde98d` | Throws unconditionally; comment defers to a pending architecture decision — this record resolves that decision (§6 item 1). Not changed by this record. |
| `apps/worker/src/index.ts` | `5e4d73ccf72afaab20d0e32b385b8db29097a38c9fd128507b0f08d68d876954` | Worker `main()` — runs only two poll loops (search, gate evaluation); no reconciliation loop. Not reopened, not changed. |
| `packages/core-reconciliation/src/reconcile.ts` | `206a30c7ea0df32f494aba9270e1cbe9e55163083a9a74458ef4496d2b0c6d7b` | Existing reconciliation package — detects *duplicate* idempotency records only; not a missing-webhook mechanism. Not reopened, not changed. |

All hashes above were verified immediately before writing this record. None of these records is modified by this decision record.

## 5. Relationship to prior decisions — explicitly not reopened

- **`DEC-002`/`DEC-003`** (identity ≠ entitlement ≠ payment; server-bound user identity) — **not reopened.** The `users` table and `requireUser()` session gate continue to exist exactly as before. This record does not change what those decisions established; it decides a *new, narrower* question those decisions left open — whether the ₹99 entitlement (keyed on `customer_email`) may be bound to a `users` row (keyed on `email`) for library access, and how that binding is established at account setup. Both tables already enforce the same lowercase-email invariant, so this is a join on an existing shared key, not a change to either table's ownership model.
- **ED-2** (Client Finder's deferred visitor-id↔authenticated-user merge, `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` §ED-2) — **not reopened, and not triggered.** ED-2 concerns binding an anonymous *funnel analytics* visitor id to a Client Finder user. The ₹99 fulfillment identity question is unrelated: it binds a *paid entitlement* (by email) to a new account (by email), with no dependency on `funnel_events.visitor_id` or Client Finder's analytics merge. See §8 of this record (Phase 2 finding C-1) for the narrow new decision this does require.
- **R-02 / "self-service signup is FUTURE"** (`packages/core-identity/src/session.ts` doc comment; PRD R-02, `NOT IMPLEMENTED`) — this record's item 2 (§6) is what activates self-service signup, but **only for the ₹99 (and by extension, other kit) post-purchase flow.** It does not retroactively authorize self-service signup for Client Finder or any other feature; that remains R-02's existing scope, undecided by this record.
- **Q10 / K1** — unrelated tracks, not touched.

## 6. DECIDED

### 1 — Primary delivery model
**DECIDED: IN-APP LIBRARY.** The ₹99 kit is delivered through an authenticated in-app library, not primarily through email.

### 2 — Buyer identity after purchase
**DECIDED: ACCOUNT WITH USERNAME AND PASSWORD.** After a successful ₹99 purchase, the buyer sets up a username and password. The resulting account/session is the identity used to access the purchased entitlement. This is the mechanism that authorizes access — not the entitlement's `customer_email` alone, and not an emailed token.

### 3 — ₹99 kit contents
**DECIDED: BOTH.** The kit includes (a) downloadable files and (b) a web-based workflow/tool, accessible from the in-app library. (What the workflow/tool concretely does is not specified by this record — see §10, engineering design dependency.)

### 4 — Email
**DECIDED: NOT A LAUNCH DEPENDENCY.** Email delivery (confirmation email, access-link email, etc.) is not required for ₹99 launch. It may be implemented in a later phase. No part of the launch-critical path may depend on an email being sent or received.

### 5 — Lost-access recovery
**DECIDED: ACCOUNT LOGIN IS THE RECOVERY MECHANISM.** A buyer who loses access recovers it by logging into their account. Email-based recovery (e.g., "forgot password" email, magic-link resend) is explicitly **not** a launch dependency.

### 6 — Webhook failure/reconciliation
**DECIDED: REQUIRED BEFORE ₹99 VALIDATION.** A reconciliation/recovery mechanism for a successful Razorpay payment whose webhook is missing or late is a **launch-blocking requirement** for ₹99 validation — unlike items 4 and 5, this is not deferrable.

### 7 — Refund/cancellation
**DECIDED: NOT ALLOWED.** No refund or cancellation capability exists for the ₹99 product. No refund/cancellation behavior may be introduced unless a future, separate Product Owner decision changes this.

## 7. STILL PENDING

Only matters not explicitly decided above (see §10/§F of the accompanying audit report for the full list):

- The concrete design of username/password account setup (hashing mechanism, session-cookie binding, how it reuses or replaces the existing `access_tokens`/`users` primitives) — engineering design, not decided here.
- The concrete design of how a post-purchase account becomes associated with the pre-existing `entitlements` row (matching key, duplicate-email handling, what happens if the account email differs from the purchase email) — a new, narrowly scoped identity-linking decision; see §8.
- The concrete functional definition of the "web-based workflow/tool" deliverable (item 3) — content/product-design question, not decided here.
- The concrete design of the webhook-missing reconciliation mechanism (polling cadence, Razorpay API calls used, idempotency guarantee) — engineering design, not decided here.
- Any password-reset/account-recovery flow beyond "login recovers access" (item 5) is explicitly out of scope until a future decision.
- Any refund/cancellation behavior (item 7) is explicitly out of scope until a future decision.

## 8. New narrowly-scoped identity-linking decision this record identifies (not itself decided here)

This record's item 2 creates a **new linkage requirement** distinct from ED-2: *payment identity → account identity.* Both `entitlements.customer_email` and `users.email` already enforce the same lowercase-email invariant, so the natural join key exists today without schema change. The open question this record does **not** resolve is the exact account-setup matching rule (e.g., "account email must equal the purchase email" vs. "buyer may set up an account under a different email and claim the entitlement some other way"). This is flagged as an engineering design dependency (§10) rather than decided here, since the Product Owner was not asked this specific sub-question.

## 9. NOT AUTHORIZED

This record does not authorize, and nothing in it should be read as authorizing:

- Any change to `DEC-002`, `DEC-003`, R-01, R-02, ED-2, Q10, or K1.
- Any code, test, schema, migration, configuration, dependency change.
- Selection of a specific password-hashing library or session-cookie mechanism.
- Any provider/API call (including any Razorpay reconciliation call).
- Validation, deployment, release, or launch of any kind.
- Any commit or push.

## 10. No authorization statement (restated)

**This record grants no implementation, schema/migration, authentication-library-selection, reconciliation-implementation, validation, deployment, release, or launch authority of any kind.** It records the Product Owner's explicit decisions on items 1–7 (§6) and the matters those decisions leave open (§7–§8). It does not modify the PRD, `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`, any Client Finder governance record, or any code, test, schema, migration, or configuration. It is not committed or pushed.

**Next governance action:** none required to proceed with engineering *design* work (not implementation) on the items classified "purely engineering" in the accompanying audit's Phase 4 boundary. The narrow identity-linking question in §8, and the functional definition of the web-based workflow/tool (§7), are the only items that may warrant a short follow-up Product Owner or engineering-design clarification before implementation begins — see the audit's §G recommended design-review scope.
