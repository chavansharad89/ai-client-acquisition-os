# Client Finder / Client Intent Discovery — PDEF-2 Product Definition Decision

## 1. Decision ID

`CLIENT-FINDER-PDEF-2-PRODUCT-DEFINITION-PO-DEC-001`

## 2. Decision status

**DECIDED.**

This record resolves PDEF-2 as tracked in `requirement/PROJECT_MASTER_CHECKLIST.md` §4.1/§8 and PRD V2.2's OQ-3. It
is a **product/commercial decision record only**. It grants **no implementation, billing, entitlement, checkout,
UI, API, schema, credit-accounting, usage-enforcement, outreach, contact-export, deployment, or release authority**
(§13).

## 3. Decision authority

**Product Owner.** The five decisions in §7–§11 were supplied directly and explicitly by the Product Owner and are
recorded here verbatim, with their stated rationale, without modification or extrapolation.

## 4. Preparation record reference

| Field | Value |
|---|---|
| Record | `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION_PREPARATION.md` |
| Record ID | `CLIENT-FINDER-PDEF-2-PRODUCT-DEFINITION-DECISION-PREPARATION-001` |
| SHA-256 at time of this decision | `93b8fcdb7c39feb1f5d6f18edec024fbd52e093319b2348723555394b413b6d1` |
| Status | Not modified by this decision record. This decision record closes the five Product Owner questions the preparation record raised (§15 of that record); it does not edit that record's text. |

## 5. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` (the K1 implementation + governance-chain commit; not amended, not rewritten) |
| Staged files | 0 |
| Working tree before this record | 1 untracked file: the PDEF-2 preparation record (hash matches §4) |
| K1 implementation files (`contactIdentifiers.ts`, `intentSourceProviderContract.ts`, `intentSignal.ts`, their tests, K1 audit/validation records, `PROJECT_MASTER_CHECKLIST.md`) | Unmodified by this task. No pre-existing governance process was found that requires any of these to be updated as a consequence of recording PDEF-2; if that changes, it is a follow-up task (§19), not performed here. |

## 6. Governing sources

| Record | SHA-256 at baseline | Role |
|---|---|---|
| `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` | `ab849ebc2391f9820025858bb4813e933c281781326b2a273af44ec1bbfb68b7` | Defines the ₹99/₹499/₹1,499 ladder (§6) and OQ-3 (Client Finder gating, "not decided"). **Resolved by this decision for the Client-Finder-placement question only** — see §14. Not modified by this record. |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` | Tracks PDEF-1..6 status and proposed commercial gates PCG-1..6. Not modified by this record; a checklist update to reflect PDEF-2 as DECIDED is identified as a follow-up (§19), per the task instruction not to silently edit it. |
| `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Functional requirement for Client Intent Discovery; contains no commercial/tier statement and is unaffected by this decision. Not modified. |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION_PREPARATION.md` | see §4 | Preparation record this decision closes. |

## 7. PDEF-2.1 decision — Client Finder pricing/tier placement

**Decision: BOTH TIERS.** Client Finder / Client Intent Discovery belongs in **₹499** and **₹1,499**. It does not
belong exclusively to either tier.

**Product Owner rationale:** Offering both maximizes total addressable market value. The ₹499 tier lowers the
barrier to entry for freelancers or early-stage agencies, while the ₹1,499 tier captures the full value from
high-volume power users.

## 8. PDEF-2.2 decision — Feature gating strategy

**Decision: BUNDLED.** Client Finder is bundled into the applicable ₹499 and ₹1,499 tier entitlements. It is not a
completely isolated standalone paywall.

**Product Owner rationale:** Client Finder should be natively integrated into the existing core product ecosystem
rather than hidden behind a completely isolated, standalone paywall. This enhances the overall perceived value of
the subscription tiers and streamlines the user journey.

**Scope note (binding on this record, not an implementation instruction):** "Bundled" means included in the
applicable tier's product entitlement as a matter of product definition. It does **not** authorize implementation of
billing, entitlement, access-control, or UI changes in this task or by virtue of this record (§13).

## 9. PDEF-2.3 decision — Tier-based access

**Decision: DIFFERENT ACCESS.** The ₹499 and ₹1,499 tiers provide different Client Finder capability levels, at the
product-definition level only:

| Tier | Label | Intended product-level scope |
|---|---|---|
| ₹499 | Basic Client Finder | Basic matching; standard search filters; basic lead data |
| ₹1,499 | Advanced Client Finder | Advanced behavioral filters; direct contact exports; automated outreach triggers |

**Product Owner rationale:** Differentiation drives upgrades. The lower tier offers the basic capability while the
premium tier unlocks advanced capabilities.

**Scope note (binding on this record, not an implementation instruction):** These are product-definition decisions
only. This record does not authorize implementation of any of the listed capabilities, including automated outreach
triggers or direct contact exports (§13).

## 10. PDEF-2.4 decision — Purchase flow

**Decision: INDEPENDENT PURCHASE.** A customer may purchase either applicable tier (₹499 or ₹1,499) independently. A
customer purchasing ₹1,499 does **not** need to have previously purchased ₹499.

**Product Owner rationale:** Users should not be forced into a rigid sequential upgrade path. A high-intent premium
client who needs the advanced feature set immediately should be permitted to buy the ₹1,499 tier directly without
first purchasing or interacting with the ₹499 tier.

**Scope note:** This is recorded as a product/commercial rule only. It does not change checkout, entitlement,
account, or billing code (§13). It is distinct from — and does not alter — the existing code-level containment rule
in `packages/catalog/src/ladder.ts` ("owning a rung grants every lower rung"), which concerns entitlement scope on
purchase of a rung, not purchase-path eligibility; reconciling the two, if needed, is implementation work and is out
of scope here.

## 11. PDEF-2.5 decision — Usage limits

**Decision: STRICT MONTHLY CREDIT CAPS.** Client Finder usage is governed by monthly credits that reset each billing
cycle.

| Tier | Monthly lead-unlock credits |
|---|---|
| ₹499 | 50 |
| ₹1,499 | 300 |

The credits are intended to protect systemic resource consumption and to provide a future path for overage expansion
and custom/enterprise scaling.

**Product Owner rationale:** A clear credit-based system that resets every billing cycle protects systemic resource
consumption and creates a natural path for overage expansion or enterprise scaling.

**Scope note (binding on this record, not an implementation instruction):** The figures 50 and 300 are now part of
the Product Owner decision for PDEF-2. This decision does **not** authorize implementation of credit accounting,
billing-cycle resets, usage counters, overage billing, enterprise plans, payment processing, or enforcement code.
Those require separate implementation planning/authorization (§13, §19).

## 12. Rationale supplied by Product Owner

Reproduced in full under each decision above (§7–§11). No rationale has been added, summarized away, or altered by
this record.

## 13. Explicit distinction — product decision vs. implementation authority

**DECIDED (product/commercial facts, as of this record):**
- Client Finder is included in ₹499.
- Client Finder is included in ₹1,499.
- The tiers have different Client Finder capability levels (₹499 = basic; ₹1,499 = advanced, per §9).
- Either tier can be purchased independently of the other.
- ₹499 carries 50 monthly lead-unlock credits; ₹1,499 carries 300.
- Credits reset each billing cycle.
- Overage/enterprise scaling is a recorded future product direction (not decided in detail; see §18).

**NOT AUTHORIZED by this record:**
implementation of any kind; billing changes; entitlement changes; checkout changes; UI changes; API changes; credit
database/schema changes; usage enforcement; payment integration; overage billing; automated-outreach implementation;
direct-contact-export implementation; deployment; release; production traffic; commit or push of any code or schema
change. These categories are not blurred by this record and are listed again at §22–§23.

## 14. Impact on ₹499

Per product definition only: ₹499 ("AI Freelancing Launch Kit," BUILD) now includes, as a decided product fact,
"Basic Client Finder" — basic matching, standard search filters, basic lead data — bundled into the ₹499 entitlement,
capped at 50 monthly lead-unlock credits. This resolves the CX-1 conflict recorded in the preparation record (§11 of
that record) in favor of including Client Finder in ₹499; the PRD's current static-deliverable definition of ₹499
(PRD V2.2 §6) has not itself been edited by this record (see §19, follow-up).

## 15. Impact on ₹1,499

Per product definition only: ₹1,499 ("AI Client Acquisition System," ACQUIRE) now includes, as a decided product
fact, "Advanced Client Finder" — advanced behavioral filters, direct contact exports, automated outreach triggers —
bundled into the ₹1,499 entitlement, capped at 300 monthly lead-unlock credits. This resolves PRD V2.2's OQ-3 (Client
Finder gating "not decided") in favor of inclusion, independent of ₹499 ownership (§16). The PRD's OQ-3 text itself
has not been edited by this record (see §19, follow-up).

## 16. Independent-purchase rule

A buyer may purchase ₹1,499 without having purchased ₹499, and receives Advanced Client Finder directly. A buyer who
purchases only ₹499 receives Basic Client Finder only. This rule governs purchase eligibility; it does not alter
`packages/catalog/src/ladder.ts`'s existing containment behavior for entitlement scope (§10), and no code change is
made or authorized by this record to reconcile the two.

## 17. Credit-cap rule

| Tier | Monthly lead-unlock credits | Reset |
|---|---|---|
| ₹499 | 50 | Each billing cycle |
| ₹1,499 | 300 | Each billing cycle |

No accounting mechanism, counter, enforcement path, or overage-billing mechanism is defined, implemented, or
authorized by this record. "Overage expansion" and "custom/enterprise scaling" are recorded as a future product
direction only (§18).

## 18. Unresolved downstream decisions

The following remain **explicitly unresolved** by this record and are not decided here:
- **PDEF-3 — commercial gates** (PCG-1..6 in `PROJECT_MASTER_CHECKLIST.md` §3: qualified-visitor, buyer-count,
  conversion, useful-outcome, refund, and completion gates). These remain **PENDING**. PDEF-2 does not decide them.
- Acquisition/visitor gates, buyer-count gates, conversion gates, useful-outcome gates, refund gates, completion
  gates, revenue gates, and retention gates — all remain pending wherever they were already proposed/pending; none
  is adopted, rejected, or altered by this record.
- The exact design of "overage expansion" and "custom/enterprise scaling" referenced in §11's rationale — the
  Product Owner named these as a future direction, not as a decided mechanism.
- PDEF-4 (launch criteria per tier) — remains NOT STARTED and still depends on PDEF-3 in addition to this now-decided
  PDEF-2.
- K1-10 (K1 deployment/release authorization) — remains NOT AUTHORIZED; unaffected by this record.

## 19. Follow-up tasks (not performed by this record)

1. **PRD documentation update.** PRD V2.2 §6 (static ₹499/₹1,499 deliverable definitions) and OQ-3 (currently "not
   decided") should eventually be updated to reflect this PDEF-2 decision. Not performed automatically here, per
   instruction; recorded as a follow-up for whoever owns PRD maintenance.
2. **`PROJECT_MASTER_CHECKLIST.md` update.** PDEF-2's row (§4.1) and the CX-1/CX-2 conflict rows (§9) in that
   checklist should be updated to reflect "DECIDED" status and point to this record. Not performed in this task, per
   instruction to treat any such update as a follow-up rather than a silent edit.
3. **PDEF-3 preparation.** A commercial-gate decision-preparation record should be produced next, using the
   now-decided ₹499/₹1,499 product structure from this record, without implementing it (see §20/Next task).
4. **Implementation planning (separate authorization required).** Any future implementation of credit accounting,
   entitlement bundling, independent-purchase checkout logic, tier-differentiated Client Finder capability gating,
   automated outreach triggers, or direct contact export is out of scope here and requires its own planning and
   explicit authorization.

## 20. Governance statement

This record is a **Product Owner decision record** closing PDEF-2 at the product-definition level only. It:
- Does not implement, authorize implementation of, or modify any code, test, schema, migration, catalog, PRD, UI,
  API, billing, payment, credit-accounting, usage-enforcement, outreach, or contact-export mechanism.
- Does not decide PDEF-3 (commercial gates) or any other downstream decision listed in §18.
- Does not authorize deployment, release, or production traffic of any kind.
- Does not modify, rewrite, or silently resolve the historical wording of PRD V2.2, `PROJECT_MASTER_CHECKLIST.md`, or
  the PDEF-2 preparation record; where those records require updates to reflect this decision, those updates are
  recorded as follow-up tasks (§19), not performed automatically.
- Does not amend, rewrite, or modify commit `af9ede9` or any K1 implementation, test, or governance file.

**Next governance action:** prepare the downstream commercial-gate decision (PDEF-3), using the now-decided
₹499/₹1,499 product structure recorded here, without implementing it. Do not proceed beyond that without further
Product Owner input.
