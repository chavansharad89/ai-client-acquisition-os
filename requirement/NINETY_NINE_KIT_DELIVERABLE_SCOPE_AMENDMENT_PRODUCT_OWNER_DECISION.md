# ₹99 Kit — Deliverable Scope Amendment (10+ Downloadable Files; Web Workflow/Tool Deferred) — Product Owner Decision

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `DEC-012` (continues the register; last entry before this is `DEC-011`) |
| Date | 2026-10-06 |
| Type | Governance decision record — recording only. **Not an implementation, schema, migration, validation, deployment, or release authorization.** |
| Decision status | **DECIDED** for the scope-boundary change in §4. **NOT DECIDED** for the specific 10-file bundle contents — see §6 and the accompanying analyst report delivered in this session. |
| Amends | `DEC-010` (`requirement/NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md`) item 3 only. All other `DEC-010` items (1, 2, 4–7) and all of `DEC-011` are unchanged and not reopened. |

## 2. Decision authority

**Product Owner.** The scope change in §4 was supplied directly by the Product Owner in this session.

## 3. What this record preserves (history, not rewritten)

`DEC-010` §6 item 3 originally read:

> "**DECIDED: BOTH.** The kit includes (a) downloadable files and (b) a web-based workflow/tool, accessible from the in-app library. (What the workflow/tool concretely does is not specified by this record — see §10, engineering design dependency.)"

This text is **preserved verbatim above and in `DEC-010` itself, unmodified**. This record does not delete, overwrite, or silently contradict it. It records a **subsequent, explicit Product Owner amendment** narrowing launch scope, per §4.

## 4. DECIDED — amendment to `DEC-010` item 3, for launch only

1. The ₹99 kit's launch deliverable set is **downloadable files only** — **at least 10** distinct downloadable assets.
2. The web-based workflow/tool referenced in `DEC-010` item 3(b) is **explicitly excluded from ₹99 launch scope**. It is not cancelled as a future possibility — it is deferred, exactly as `DEC-010`'s own §10 already treated it as an open engineering/product-design dependency, not yet specified.
3. In-app library delivery (`DEC-010` item 1) is unchanged — the ≥10 files are delivered through the library, not email.
4. This amendment changes only *what* is delivered at launch. It does not change *how* it is delivered, *who* may access it, or any of `DEC-010` items 1, 2, 4, 5, 6, 7, or any of `DEC-011`.

## 5. What is NOT decided by this record

- The **exact list of ≥10 files** — their titles, contents, and purposes. This record sets a *minimum count and a category boundary* (files only, no tool); it does not select the files. See the accompanying analyst report for a candidate bundle marked as recommendation only, and §6 below for the minimum PO input still required.
- Whether the deferred web-based workflow/tool will ever ship for ₹99, or at what tier — untouched, unresolved, not this record's concern.

## 6. Smallest further Product Owner input still required

A short confirmation (not a full questionnaire) of which candidate assets from the analyst's proposed bundle are approved for inclusion, OR an explicit Product Owner-supplied list of ≥10 titles/purposes, is needed before the catalog manifest (`packages/catalog/src/deliverables.ts`) can be authoritatively extended. Nothing else in this record is blocked on that — the scope boundary (≥10 files, no tool) is final as of §4.

## 7. Relationship to other decisions — explicitly not reopened

- `DEC-010` items 1, 2, 4, 5, 6, 7 — unchanged.
- `DEC-011` — unchanged, not reopened.
- ED-2, ED-3, Q10 — unrelated, not touched.
- Pricing (`INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`) — unchanged; this record does not alter the ₹99 price or the independent-purchase rule.

## 8. NOT AUTHORIZED

This record does not authorize: any code, schema, migration, test, or configuration change; creation of the actual file assets; any commit or push; any change to `DEC-010`'s other items or to `DEC-011`.
