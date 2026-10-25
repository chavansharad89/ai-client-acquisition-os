# Addendum: COMMERCIAL-PO-08 .. 12 (Cancellation, Renewal-Failure, Old-Data Classification)

**Status:** GOVERNANCE / REQUIREMENTS RECORD ONLY. No application code, database schema, migration, database record, test, or any file outside this document was changed in producing this addendum. Not committed. Not pushed. Not deployed.

**Date:** 2026-10-10
**Scope:** This addendum extends `COMMERCIAL_PO_01_07_THREE_PRODUCT_SUBSCRIPTION_MODEL_GOVERNANCE_AUDIT.md` ("the base record"). It does not re-litigate COMMERCIAL-PO-01 through 05 and 07 — those remain authoritative exactly as recorded in the base record (status reconfirmed in §A below). It records the Product Owner's new COMMERCIAL-PO-06 (revised wording) and COMMERCIAL-PO-08 through 12, and runs the consistency review those new decisions require.

---

## A. AUTHORITATIVE DECISION RECORD

**File:** `requirement/COMMERCIAL_PO_08_12_CANCELLATION_RENEWAL_OLD_DATA_ADDENDUM.md` (this file), extending `requirement/COMMERCIAL_PO_01_07_THREE_PRODUCT_SUBSCRIPTION_MODEL_GOVERNANCE_AUDIT.md`.

**COMMERCIAL-PO-01, 02, 03, 04, 05, 07 — status: ALREADY RECORDED, UNCHANGED.** The Product Owner re-stated these in this round in substantively identical form to the base record. No new decision content; no re-recording needed. See base record §A for verbatim text and §B for their conflict analysis, which stands unmodified.

**COMMERCIAL-PO-06 — REVISED/SHARPENED from the base record.** Original COMMERCIAL-PO-06 instructed an audit-and-classify-only approach (A/B/C classification, no assumption of test-data status). The Product Owner has now **explicitly classified** the one non-obviously-fake record found in that audit:

> **COMMERCIAL-PO-06 (revised).** The product is currently NOT LIVE. The Product Owner has explicitly classified the identified existing old ₹1,499 customer-looking record as TEST/DEVELOPMENT DATA. Therefore: do not migrate it into the new ₹1,499 Client Finder subscription; do not create a new subscription from it; do not treat it as a real customer entitlement; do not use it as evidence of a production customer; do not delete it as part of this governance task. Any cleanup/deletion must be a separate explicitly authorized data-cleanup task. Do not assume all other old records are test data unless repository evidence supports that classification.

This is a **Product Owner policy classification**, not a new fact discovered in the repository — the record's email pattern is unchanged from the base audit. Recorded as directive, not re-derived.

New decisions, recorded verbatim:

> **COMMERCIAL-PO-08 — Existing old ₹1,499 data.** The known old ₹1,499 order/payment/entitlement identified during the audit is classified as DEVELOPMENT/TEST DATA. No production customer migration is required for that record. Do not perform cleanup in this governance task.
>
> **COMMERCIAL-PO-09 — ₹99 cancellation.** The ₹99 subscription supports customer cancellation. Cancellation means: stop future renewal; do NOT immediately terminate access; the already-paid current 30-day period remains active; no refund; no proration; at the end of the current paid period, ₹99 becomes inactive if it has not renewed. This supersedes the previous requirement that the ₹99 product had no cancellation capability.
>
> **COMMERCIAL-PO-10 — ₹499 cancellation.** The ₹499 subscription follows the same cancellation model as ₹99: stop future renewal; current paid 30-day period remains active; no immediate access removal; no refund; no proration; becomes inactive at period end if not renewed.
>
> **COMMERCIAL-PO-11 — ₹1,499 cancellation.** The ₹1,499 Client Finder subscription supports customer cancellation: stop future renewal; current paid period remains active; Client Finder and the complete-package access it grants (₹99, ₹499, Client Finder) remain active during that paid period; no refund; no proration. At the end of the current paid period, if not renewed: ₹1,499 becomes inactive, and the ₹1,499-granted ₹99/₹499 access ends. Independently purchased ₹99 and/or ₹499 subscriptions remain unaffected and continue on their own lifecycle. Cancellation of ₹1,499 must NOT cancel independently purchased ₹99/₹499 subscriptions.
>
> **COMMERCIAL-PO-12 — ₹1,499 renewal payment failure.** If the ₹1,499 renewal payment fails: the current paid 30-day period remains active until its actual expiry; there is NO separate grace period; Client Finder and the complete-package access it grants remain active until that expiry. At expiry without a successful renewal: ₹1,499 becomes inactive, and the ₹1,499-granted ₹99/₹499 access ends — but any independently purchased ₹99/₹499 subscription remains active on its own lifecycle, unaffected by the failed ₹1,499 renewal. No separate activation or billing grace period is created.

**Core commercial principle restated by the Product Owner (not a new numbered decision, recorded for traceability):** subscription ownership and access/entitlement are two distinct concepts. An active ₹1,499 subscription grants all three accesses; an active ₹99 subscription alone grants only ₹99 access; an active ₹499 subscription alone grants only ₹499 access; ₹99+₹499 together still do not grant Client Finder. This restates COMMERCIAL-PO-02 and is not itself a new decision.

---

## B. CONSISTENCY REVIEW

| Decision | Current repository state | Classification | Evidence | Required future action |
|---|---|---|---|---|
| COMMERCIAL-PO-06 (revised) / PO-08 — old record classified as test data | Base record's §C/§F left the `chavan.sharad89@gmail.com` order/payment/entitlement for `ai_client_acquisition_1499` as "C. Unknown / requires verification" because no repository evidence proved it fake. | **D. NO CONFLICT** — a PO policy directive resolving a previously open classification question; not contradicted by any written requirement. The record itself is unchanged; only its governance treatment is now settled. | Base record §C row 2, §F Open Question 3; this record's §A. | None for this task. Carry PO-06/08's classification forward if/when a separate, explicitly authorized data-cleanup task is scoped — that task should cite COMMERCIAL-PO-06/08 as its authorization basis, not re-derive the classification. |
| COMMERCIAL-PO-09 — ₹99 cancellation = stop-renewal, no refund | `requirement/NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md:70-71,82`: "DECIDED: NOT ALLOWED. No refund or cancellation capability exists for the ₹99 product... unless a future, separate Product Owner decision changes this." | **A. TRUE REQUIREMENT CONFLICT, now RESOLVED** — COMMERCIAL-PO-09 is explicitly the "future, separate Product Owner decision" that document anticipated, and it says so itself ("This supersedes the previous requirement that the ₹99 product had no cancellation capability."). Resolves base record's Open Question 2. | `requirement/NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md:70-71,82`; this record's §C below. | Mark the cited passage SUPERSEDED (done in §C). No further PO input needed on the *meaning* of "cancel" — it is now settled as stop-renewal-only, not refund. |
| COMMERCIAL-PO-10 — ₹499 cancellation, same model | No existing PO decision document for ₹499 analogous to the ₹99 fulfillment decision was found (targeted search found no `*499*FULFILLMENT*` or equivalent cancellation-policy record). | **D. NO CONFLICT** (nothing to conflict with) | Targeted repository search, no match. | None — this is a fresh decision with no prior position to supersede. |
| COMMERCIAL-PO-11 — ₹1,499 cancellation (stop-renewal, package access continues through paid period, independent ₹99/₹499 unaffected) | `CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` IRL-N/IRL-O (lines 342–382) already decided, for the ₹1,499 subscription alone: "Cancellation (no refund) = no further renewals; the current, already-active period still runs to its own configured expiry." | **D. NO CONFLICT — REINFORCES** existing IRL-N/O timing semantics. What IRL-N/O did **not** cover (because complete-package stacking into ₹99/₹499 did not exist yet) is the cascading effect on package-granted lower-tier access and the non-effect on independently-purchased ₹99/₹499 — that part of PO-11 is new, additive, and not in conflict with anything. | `requirement/CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md:342-382` | None beyond noting IRL-N/O's "credits forfeited" language is stale (see §C note) relative to the later credit-less, pure time-bound `subscription_periods` model actually implemented (migration `0040_subscription_periods`) — the *timing* rule IRL-N/O states is still correct and is what PO-11 reaffirms. |
| COMMERCIAL-PO-12 — ₹1,499 renewal payment failure, no grace period | `CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` IRL-D (lines 108–119): "A failed recurring charge creates no new subscription period and allocates no credits. It has no effect on any currently active period... No separate grace-period mechanism... is introduced." | **D. NO CONFLICT — REINFORCES** IRL-D verbatim, now additionally scoped to cover package-granted ₹99/₹499 access ending alongside ₹1,499 at actual expiry, and independents continuing unaffected. | `requirement/CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md:108-119` | None — PO-12 and IRL-D say the same thing for the core renewal-failure timing rule. |
| PO-09/10/11/12 cancellation/renewal-failure logic vs. current implementation | No cancellation code path exists anywhere in the repository: `packages/core-payments/src/webhookHandler.ts` handles only `subscription.charged` (line 345) and `refund.created`/`refund.processed` (line 386) — no `subscription.cancelled`, `subscription.halted`, or equivalent. No `apps/web/app/api/**/*cancel*` route exists. No cancellation-related column exists on `subscription_periods` (schema: `id, user_id, product_slug, razorpay_subscription_id, razorpay_payment_id, activation_at, duration_days, refunded_at, created_at, updated_at` — no `cancelled_at`/`renew_requested` field). `grep` for "cancel" in `packages/core-subscriptions/src/*.ts` returns nothing. | **B. IMPLEMENTATION GAP** (all four decisions) | `packages/core-payments/src/webhookHandler.ts:345,386`; `packages/db/prisma/migrations/0040_subscription_periods/migration.sql:31-49`; repository-wide grep, no match for `core-subscriptions` cancellation logic or a cancel API route. | Needs: (a) a way to record "renewal declined" per subscription (e.g. a `cancelled_at`/`auto_renew` field, or a Razorpay-side `subscription.cancelled` webhook consumed into one), independently settable per product (₹99/₹499/₹1,499) given each has its own lifecycle (PO-03); (b) access-resolution logic that still returns "active" through the current paid period's `activation_at + duration_days` regardless of cancellation flag, per PO-09/10/11/IRL-N/O; (c) for PO-12, no new code is needed for the "no grace period" rule itself — IRL-D's behavior (a failed charge simply produces no new period) already satisfies it by omission; the gap is only the *access cascade* to package-granted ₹99/₹499 at expiry, which depends on the broader complete-package access-resolution gap already flagged in the base record (§B row 4, §D). |
| PO-09/10 presuppose ₹99/₹499 have a cancellable subscription lifecycle at all | ₹99 (`ai_income_99`) and ₹499 (`ai_freelancing_499`) are tracked only in the one-time `entitlements` table today (per base record §D) — no `subscription_periods` rows, no 30-day period, no renewal concept exists for either yet. | **B. IMPLEMENTATION GAP — foundational, blocks PO-09/10 directly** | Base record §D (first bullet); confirmed again here, no new contradicting evidence found. | This is the same open architecture question as base record's Open Question 4 ("target architecture for ₹99/₹499 subscription lifecycle"), now sharpened: whichever mechanism is chosen must support a cancellation/non-renewal flag from day one, since PO-09/10 make that a day-one requirement rather than a later add-on. Should be resolved together, not sequentially. |

---

## C. SUPERSEDED REQUIREMENTS

In addition to the two items already marked superseded in the base record (§E):

1. `requirement/NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md`, §6 item 7 — "DECIDED: NOT ALLOWED. No refund or cancellation capability exists for the ₹99 product. No refund/cancellation behavior may be introduced unless a future, separate Product Owner decision changes this." **Superseded by COMMERCIAL-PO-09**, exactly as that document itself anticipated. The supersession is narrow: only the *existence* of a cancellation capability is overturned. PO-09 does not introduce a refund capability — "no refund" is retained from the original decision and restated in PO-09 itself.

Not superseded, reinforced instead:

- `requirement/CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` IRL-D, IRL-N, IRL-O (lines 108-119, 342-384) — the core cancellation-timing and failed-renewal rules in COMMERCIAL-PO-11/12 restate these decisions rather than overriding them. The one stale detail inside IRL-N/O — "remaining credits forfeited" on a refunded cancellation — refers to a ledger/credit model that the later-implemented `subscription_periods` schema (migration `0040`) deliberately does not have ("Pure time-bounded access, no credit/balance dimension," per that migration's own header comment). This is a pre-existing documentation/implementation evolution, not something COMMERCIAL-PO-08..12 creates or resolves, and is flagged here only so it is not mistaken for a new conflict.

---

## D. IMPLEMENTATION GAPS (summary, cross-referencing §B)

- **No cancellation mechanism exists for any of the three products** — no webhook handler, no API route, no schema field. This blocks PO-09, PO-10, and the renewal-stop half of PO-11 equally.
- **₹99/₹499 have no subscription/period lifecycle at all today** (one-time `entitlements` rows only) — this blocks PO-09/PO-10 at a more fundamental level than the cancellation mechanism itself; cancellation presupposes something renewable to cancel.
- **Complete-package access cascade (₹1,499 → ₹99/₹499) is not implemented** — already flagged in the base record (§B row 4); PO-11/12's "package-granted access ends when ₹1,499 ends" and "independents are unaffected" both depend on this same unbuilt access-resolution logic existing first.
- **Renewal-failure timing (PO-12) is already satisfied by the current webhook design "by omission"** — `IRL-D`'s decision (failed charge = no new period, no effect on current one) is naturally what happens today if a `subscription.charged` webhook simply never arrives; no grace-period code exists to remove, which is itself the correct state per PO-12. The only real gap here is the access-cascade dependency above, not the failure-handling itself.
- **Retirement of the old one-time ₹1,499 product (PO-05)** — gap already fully described in the base record (§B row 1, §E); unchanged by this addendum.

---

## E. OLD DATA AUDIT (update to base record §C)

| Item | Base record classification | This addendum's classification | Basis |
|---|---|---|---|
| Order/payment/entitlement for `chavan.sharad89@gmail.com`, old SKU `ai_client_acquisition_1499` | C. Unknown / requires verification | **Reclassified: TEST/DEVELOPMENT DATA, per explicit COMMERCIAL-PO-06 (revised)/PO-08 directive** | Product Owner policy decision, not new repository evidence. The record itself was not re-inspected or altered. |
| All other old-SKU records (second order row, subscription-SKU e2e fixtures, test-suite references) | B. Development/test/dummy | **Unchanged** | COMMERCIAL-PO-06/08 does not instruct treating *all* old records as test data absent evidence — these already had clear fixture-pattern evidence in the base record and remain so classified on that basis, not on the new directive. |

No record was modified, migrated, or deleted in producing this reclassification.

---

## F. OPEN PRODUCT OWNER QUESTIONS

Carried forward from the base record, with status updates:

1. **Scope of "retired from new purchases" (COMMERCIAL-PO-05).** — **Still open**, unaffected by this addendum.
2. **Does ₹99 need a true cancellation/refund capability, or just non-renewal?** — **RESOLVED by COMMERCIAL-PO-09**: non-renewal only, no refund, no proration.
3. **Is the `chavan.sharad89@gmail.com` record real or a self-test?** — **RESOLVED by COMMERCIAL-PO-06 (revised)/PO-08**: classified as test/development data by explicit PO directive.
4. **Target architecture for ₹99/₹499 subscription lifecycle** (reuse `subscription_periods`, or add expiry/cancellation fields to `entitlements`?) — **Still open**, and now higher-priority: COMMERCIAL-PO-09/10 make a cancellation capability a stated requirement, not a future nicety, so this architecture choice blocks real implementation work sooner than the base record anticipated.

New question raised by this addendum:

5. **Does ₹499 have any existing commercial commitments (e.g. a published no-refund policy to customers) that COMMERCIAL-PO-10 would need to reconcile with**, the way PO-09 had to explicitly supersede a written ₹99 decision? No such ₹499 document was found in this repository, but the absence of a written decision does not confirm the absence of an external commitment made to customers. Flagged for PO confirmation before implementation, out of caution — not because any repository evidence suggests a conflict.

---

## G. IMPLEMENTATION STATUS

- No application code changed.
- No database migrations changed or created.
- No database records changed, inserted, or deleted (the old-data audit in §E is a reclassification of the base record's prior read-only findings, not a new database query or alteration).
- No tests changed.
- No files outside this governance record (and its companion base record, already committed state notwithstanding — not modified here) were created or changed.
- No commit was made.
- No push was made.
- No deployment was made.

This remains a Product Owner governance record only. COMMERCIAL-PO-08 through 12 have not been implemented. ₹99/₹499/₹1,499 cancellation and renewal-failure behavior remain exactly as they are in the current repository (i.e., largely unbuilt, per §D). The old `ai_client_acquisition_1499` product's data has not been deleted or migrated. No changes were made to K1 or to Razorpay webhook/refund scope.
