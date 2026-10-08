# Client Finder / Client Intent Discovery — PDEF-2 Product Definition Decision Preparation

**Record ID:** CLIENT-FINDER-PDEF-2-PRODUCT-DEFINITION-DECISION-PREPARATION-001
**Date:** 2026-10-04
**Type:** read-only decision preparation record. **Not a decision record. Not a Product Owner decision. Grants no
authorization of any kind** (see §16).

---

## 1. Purpose

To assemble, from existing governing repository records only, the facts, conflicts, dependencies and open questions
needed for the Product Owner to decide **PDEF-2**: where Client Finder / Client Intent Discovery belongs in the
₹99 → ₹499 → ₹1,499 commercial product ladder. This record prepares that decision. It does not make it.

## 2. Scope

**In scope:** reading and citing existing governing records (PRD versions, `PROJECT_MASTER_CHECKLIST.md`, the K1
requirement/governance chain, the `packages/catalog` code) and organizing their content into a decision-ready format.

**Out of scope (not performed by this record):** deciding PDEF-2; recommending an option; changing the PRD, catalog,
pricing, or deliverables; implementing commercial gates; modifying K1; authorizing deployment or launch; any provider
call, external research, or participant contact.

## 3. Baseline

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD at start of Phase 2 | `af9ede93830f5e3e611195dc2451a470364def74` (commit made in Phase 1 of this task, containing only the pre-existing, already-completed K1 implementation + governance chain) |
| Working tree before writing this record | clean (no staged, unstaged, or untracked files) |
| Files created by this record | this file only |
| Files modified by this record | none |

## 4. Governing records

| Record | Role |
|---|---|
| `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` | Current PRD version. §6 defines the commercial ladder; "Open Questions" §OQ-3 states Client Finder tier gating is undecided. |
| `requirement/AI Client Acquisition OS — Product Requirements Document V2.1.md` | Prior PRD version. Same ladder table and same OQ-3 wording as V2.2 — no conflict, V2.2 continues it. |
| `requirement/AI Client Acquisition OS — Product Requirements Document V2.0.md` | Original PRD version. More detailed per-tier narrative (§6.1–§6.4), which V2.2 states is "Preserved from V2.0." Predates OQ-3 (OQ-3 does not exist in V2.0; it first appears in V2.1). No conflict — see §11. |
| `requirement/PROJECT_MASTER_CHECKLIST.md` (Record ID `PROJECT-MASTER-CHECKLIST-001`) | Restates the PRD ladder with code product-IDs; records PDEF-1..6 status; records proposed (non-governing) commercial gates PCG-1..6; records K1 status; explicitly states it grants no authorization and that a governing record wins over it in any conflict. |
| `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (incl. Amendment 1 and Amendment 2) | Defines Client Intent Discovery as a product requirement. Contains no statement about tier, pricing, or commercial placement, and its authority-boundary block does not include any commercial/pricing authority category. |
| `packages/catalog/src/products.ts`, `ladder.ts`, `deliverables.ts` | Code-level fact (not a governing decision): the three paid tiers as currently implemented are static digital-download products with no reference to Client Finder / Client Intent Discovery anywhere in the package. |
| K1 governance chain (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_*`, committed in this session's Phase 1) | Establishes K1 engineering completion/validation status only. None of these records address commercial or tier placement (confirmed by grep across all ~200 `requirement/` files). |

## 5. ₹99 current definition

| Field | Value | Governing source |
|---|---|---|
| Product name | AI Income Starter Kit (`ai_income_99`) | PRD V2.2 §6; `packages/catalog/src/products.ts` |
| Purpose | DISCOVER — "What can I do with AI?" (primary question, PRD V2.0 §6.1; purpose label preserved in V2.1/V2.2) | PRD V2.0 §6.1; PRD V2.2 §6 |
| Deliverables | Prompt library PDF; pricing-sheet XLSX; outreach-templates PDF | `packages/catalog/src/deliverables.ts`; restated in `PROJECT_MASTER_CHECKLIST.md` §2 |
| Access / functionality | Static digital downloads; no Client Finder reference anywhere in code or PRD | `packages/catalog/src/` (grep: zero matches for "client finder" / "client intent" / "discovery") |
| Current status | PRD V2.2 §6: "Catalogue exists; funnel implemented." `PROJECT_MASTER_CHECKLIST.md` flags the funnel claim itself as "PENDING EVIDENCE | Not verified by this record." | PRD V2.2 §6; `PROJECT_MASTER_CHECKLIST.md` (T99-2) |
| Governing source | PRD V2.2 §6 (ladder table); `packages/catalog` | — |

## 6. ₹499 current definition

| Field | Value | Governing source |
|---|---|---|
| Product name | AI Freelancing Launch Kit (`ai_freelancing_499`) | PRD V2.2 §6; `packages/catalog/src/products.ts` |
| Purpose | BUILD — "What exactly should I sell?" (PRD V2.0 §6.2) | PRD V2.0 §6.2; PRD V2.2 §6 |
| Deliverables | Outreach-system PDF; scope-and-pricing PDF; proposal-template ZIP | `packages/catalog/src/deliverables.ts` |
| Access / functionality | Static digital downloads as currently coded. A **proposal** (not governing) exists to add Client Finder (FIND → RESEARCH → QUALIFY → opportunity) to this tier — see §11 (CX-1) and §12. | `PROJECT_MASTER_CHECKLIST.md` §2.1, T499-2 |
| Current status | PRD V2.2 §6: "Catalogue exists; funnel implemented." | PRD V2.2 §6 |
| Governing source | PRD V2.2 §6; `packages/catalog`. **No governing record places Client Finder in ₹499** — the Client-Finder-in-₹499 idea is recorded only as a non-governing proposal pending PDEF-2. | `PROJECT_MASTER_CHECKLIST.md` §2.1 |

## 7. ₹1,499 current definition

| Field | Value | Governing source |
|---|---|---|
| Product name | AI Client Acquisition System (`ai_client_acquisition_1499`) | PRD V2.2 §6; `packages/catalog/src/products.ts` |
| Purpose | ACQUIRE — "Who should I sell to and how do I approach them?" Core flow: FIND → RESEARCH → QUALIFY → PERSONALIZE → CONTACT → FOLLOW UP → PROPOSE → CLOSE (PRD V2.0 §6.3) | PRD V2.0 §6.3; PRD V2.2 §6 |
| Deliverables | Acquisition-funnel PDF; delivery-workflow ZIP; automation-recipes ZIP; full-system walkthrough MP4 | `packages/catalog/src/deliverables.ts` |
| Access / functionality | Static digital downloads as currently coded. Whether Client Finder is gated behind or included in this tier is the subject of PRD **OQ-3**, explicitly "not decided." | PRD V2.2 OQ-3 |
| Current status | PRD V2.2 §6: "Catalogue exists; engine foundation partial." | PRD V2.2 §6 |
| Governing source | PRD V2.2 §6 + OQ-3; `packages/catalog`. OQ-3 is the only place any governing record even associates Client Finder with this tier, and it does so only as an open, undecided question. | PRD V2.2 OQ-3; `PROJECT_MASTER_CHECKLIST.md` §2.1 |

## 8. Client Finder current definition

| Field | Value | Governing source |
|---|---|---|
| What it is | PRD V2.2, line 132: "This is an AI-powered income and client-acquisition operating system, not a lead list and not a Client Finder. Client Finder is where implementation starts; it is not what the product is." | PRD V2.2 |
| Current product definition | No standalone product-tier definition exists for "Client Finder" as a sellable unit. It is referenced only as (a) a PRD open question (OQ-3) about tier gating, and (b) the current engineering release label "Foundation + Client Finder MVP" (an engineering scope marker, independent of commercial tier mapping). | PRD V2.2 OQ-3; `PROJECT_MASTER_CHECKLIST.md` §2.1 |
| Current implementation state | K1 (Client Intent Discovery engineering work): **IMPLEMENTED + VALIDATED — CONFORMANT WITH NON-BLOCKING FINDINGS** per `PROJECT_MASTER_CHECKLIST.md` §5, citing validation report `CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-VALIDATION-001`. All K1 implementation + governance records were, prior to this session's Phase 1, uncommitted; Phase 1 of this task committed them in commit `af9ede9` (implementation + tests only — no deployment, no commercial wiring). | `PROJECT_MASTER_CHECKLIST.md` §5; this session's Phase 1 |
| What K1 actually enables | Per `PROJECT_MASTER_CHECKLIST.md` §5.5: K1's completion unblocks implementation reliance on the intent-signal/provider-contract detector. It explicitly does **not** unblock the tier ↔ feature mapping decision (PDEF-2), commercial gates (PDEF-3), launch criteria (PDEF-4), or K1's own deployment/release (K1-10: **NOT AUTHORIZED**). "K1's completion is an implementation and validation milestone, not a commercial or launch-readiness milestone." | `PROJECT_MASTER_CHECKLIST.md` §5.5 |
| Does any repository record explicitly assign it to a paid tier? | **No.** PRD OQ-3 states tier gating is "not answered anywhere in the repository... Not decided." `packages/catalog` contains zero references to Client Finder / Client Intent Discovery. The only tier-assignment text that exists is the non-governing ₹499 proposal (§6 above, CX-1) and the OQ-3 question itself (association with ₹1,499, unresolved). | PRD V2.2 OQ-3; `packages/catalog`; `PROJECT_MASTER_CHECKLIST.md` §2.1, §9 |
| Governing source | PRD V2.2 (product description, OQ-3); `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (functional requirement only — contains no tier/pricing/commercial statement at all, and its authority-boundary block has no commercial-authority category); `PROJECT_MASTER_CHECKLIST.md` (status tracking, non-authoritative over the PRD). | — |

## 9. K1 dependency / status

K1 (Client Intent Discovery) is **COMPLETE** at the engineering level: implemented, tested (729/729 tests passing in
`@acos/core-research` per Phase 1 verification of this session), validated, and classified CONFORMANT WITH
NON-BLOCKING FINDINGS. Its implementation and governance chain were committed in commit `af9ede9` during Phase 1 of
this task.

K1's completion is a **precondition for PDEF-2 to be decided meaningfully** (there is now a validated implementation
whose scope PDEF-2 can be mapped against) but K1's completion **does not itself answer PDEF-2**, does not authorize
deployment (K1-10: NOT AUTHORIZED), and does not constitute a commercial or launch decision. This record does not
claim otherwise, per the explicit restriction in the governing task instructions and `PROJECT_MASTER_CHECKLIST.md`
§5.5.

## 10. Decided vs. undecided facts

**Decided (governing):**
- Three fixed-price tiers exist — ₹99, ₹499, ₹1,499 — each with a name, purpose label, and a fixed set of static
  digital-download deliverables (§5–§7).
- A FUTURE SaaS rung exists conceptually (REPEAT/SCALE); not yet built.
- Identity, product entitlement, and payment are three separate mechanisms (PRD V2.2 DEC-002); Client Finder feature
  access is conceptually distinct from either, though DEC-002 does not itself decide Client Finder's tier placement.
- K1 (the Client Finder / Client Intent Discovery engineering capability) is implemented and validated.
- No governing record currently wires Client Finder into any tier's entitlement, catalog, or deliverable set.

**Undecided (open — PDEF-2 and related):**
- Whether Client Finder belongs to ₹499 (§12, CX-1).
- Whether Client Finder belongs to ₹1,499 (PRD OQ-3; §12, CX-2).
- Whether access differs between tiers.
- Whether Client Finder is included in the purchase price of a tier or separately gated.
- Whether the three kits are sequential upgrades or independent products — PRD V2.0 §102 states a *build sequencing*
  principle (₹99 → ₹499 → ₹1,499 → validate → automate → SaaS) and `packages/catalog/src/ladder.ts` encodes
  *containment* ("owning a rung grants every lower rung") at the code level, but no governing record states whether a
  buyer's *purchase* path must be sequential or whether rungs are independently purchasable products for commercial
  purposes beyond that containment rule.
- Whether a buyer can purchase ₹1,499 without ₹499 (not addressed by any governing record located; `ladder.ts`
  containment is about entitlement scope on purchase of a rung, not about purchase-path restrictions).
- Whether ₹499 is intended to be static-deliverables-only or includes Client Finder functionality.
- Whether any ongoing Client Finder usage limits exist (not found in any record).
- Whether commercial gates exist before exposing Client Finder (none adopted; see §13).

## 11. PDEF-2 conflict / open question

**Primary open question (PRD V2.2 OQ-3):** "Whether Client Finder access is gated behind the ₹1,499 purchase is not
answered anywhere in the repository. If gated, identity and entitlement converge operationally; if not, they remain
separate. The architecture deliberately does not assume either. **Not decided.**"

**Recorded conflicts between a non-governing proposal and the governing PRD** (per `PROJECT_MASTER_CHECKLIST.md` §9):

| ID | Proposal (not governing) | Governing text | Classification | Precedence |
|---|---|---|---|---|
| CX-1 | Project discussion proposes ₹499 = Client Finder (FIND → RESEARCH → QUALIFY → opportunity) | PRD V2.2 §6 + `packages/catalog`: ₹499 = AI Freelancing Launch Kit, BUILD, static deliverables | Proposal vs. governing definition | PRD V2.2 §6 governs; the ₹499-Client-Finder idea remains PROPOSED, NOT GOVERNING, pending PDEF-2 |
| CX-2 | Project discussion treats ₹1,499 as the full acquisition system including Client Finder | PRD V2.2 OQ-3: gating "Not decided" | Proposal vs. open question | OQ-3 governs; ₹1,499 Client Finder inclusion is SCOPE-DEPENDENT, pending PDEF-2 |
| CX-3 | Proposed commercial gates PCG-1..6 | No governing record (Governing = NONE for each) | Proposal with no governing counterpart | Not launch gates; no consequence until PDEF-3 is decided |

Per the existing hierarchy stated by `PROJECT_MASTER_CHECKLIST.md` itself ("If this checklist conflicts with a
governing record, the governing record wins"), **PRD V2.2 is the governing source and takes precedence over any
proposal recorded in the checklist or in prior project discussion.** No version-to-version PRD conflict exists: V2.0,
V2.1, and V2.2 are compatible (V2.2 explicitly states its ladder is "Preserved from V2.0"; OQ-3 is additive, first
appearing in V2.1, and is not contradicted by V2.0's silence on it). This record resolves no conflict itself; the
Product Owner decision (PDEF-2) is what resolves CX-1 and CX-2.

## 12. Tier-mapping options

Derived neutrally from the repository's own framing (PRD OQ-3; `PROJECT_MASTER_CHECKLIST.md` §2.1, §8). No option is
labeled preferred.

| Option | Exact decision statement | ₹99 | ₹499 | ₹1,499 | Client Finder access | Commercial-gate implications | Downstream dependencies | Unresolved questions | Risks / tradeoffs |
|---|---|---|---|---|---|---|---|---|---|
| A — ₹499 only | Client Finder is included in / gated behind the ₹499 purchase; not included in ₹1,499 beyond containment | Unchanged | Gains Client Finder functionality beyond its current static-deliverable definition | Unchanged (static deliverables only; receives Client Finder only via containment of ₹499 per `ladder.ts`) | Granted to ₹499+ purchasers | PDEF-3 gates, if adopted, would need to attach to the ₹499 purchase/usage event | Requires ₹499 product definition in PRD/catalog to be amended; requires entitlement wiring between K1 and the ₹499 product code | Whether ₹1,499 buyers who skip ₹499 (if purchase-path independence exists) would be excluded; whether usage limits apply | Changes ₹499's current BUILD/static-deliverable identity (CX-1 conflict); may undercut ₹1,499's ACQUIRE positioning if its distinguishing capability moves to a lower tier |
| B — ₹1,499 only | Client Finder is included in / gated behind the ₹1,499 purchase only | Unchanged | Unchanged (remains static-deliverable BUILD kit) | Gains Client Finder as part of its ACQUIRE definition (consistent with OQ-3's framing and V2.0's §6.3 ACQUIRE flow) | Granted to ₹1,499 purchasers only | PDEF-3 gates, if adopted, would attach to the ₹1,499 purchase/usage event | Requires ₹1,499 product definition in PRD/catalog to be made concrete (currently "engine foundation partial"); requires entitlement wiring | Whether ₹499 buyers gain any partial access; whether a buyer can purchase ₹1,499 without ₹499 (open per §10) | Most consistent with OQ-3's original framing and the ACQUIRE purpose label; defers monetizing Client Finder to the highest tier only |
| C — Both ₹499 and ₹1,499 | Client Finder is available at both ₹499 and ₹1,499, possibly with different scope/limits per tier | Unchanged | Gains some Client Finder access/scope | Gains Client Finder access/scope (same or greater than ₹499) | Granted at both tiers, scope to be defined | Requires defining *differentiated* scope or usage limits per tier, which is itself undecided (§10) | Requires both ₹499 and ₹1,499 product/catalog definitions to change | What differentiates the ₹499 vs ₹1,499 Client Finder experience; whether usage limits differ | Highest implementation and definition burden; risks blurring the BUILD vs ACQUIRE purpose distinction between tiers |
| D — Neither | Client Finder is not part of the ₹99/₹499/₹1,499 commercial ladder at all (e.g., remains an internal capability, a future SaaS-rung feature, or a separately-priced product outside the existing ladder) | Unchanged | Unchanged | Unchanged | Not granted via any existing tier purchase | No gate attaches to any existing tier for Client Finder specifically | Requires a separate commercial/product decision (new SKU, SaaS-rung feature, or internal-only) outside PDEF-2's current framing | Where/how Client Finder is monetized or exposed at all, if not via the existing ladder | Leaves K1's validated engineering work without a commercial exposure path; may conflict with PRD's description of "Client Finder is where implementation starts" implying eventual productization |

The repository does not establish additional legitimate options beyond these four; no record proposes, for example,
a Client-Finder-only SKU outside the existing ladder, though Option D is broad enough to cover that possibility
without asserting it as decided or recommended.

## 13. Commercial-gate dependencies

The only commercial-gate figures found anywhere in the repository are the six **proposed, non-governing** figures in
`PROJECT_MASTER_CHECKLIST.md` §3 (PCG-1..6). The checklist states explicitly: "None of these figures appears in any
repository record... They are not launch gates and have no implementation or launch consequence until a Product
Owner decision adopts them."

| ID | Value | Proposed purpose | Applicable tier | Owner | Dependency | Governed? |
|---|---|---|---|---|---|---|
| PCG-1 | 500 qualified visitors | ₹99 → ₹499 gate: minimum sample | ₹99/₹499 | Product Owner | PDEF-3 | **Commercial gate not yet governed.** |
| PCG-2 | ≥ 50 buyers | ₹99 → ₹499 gate: minimum buyers | ₹99/₹499 | Product Owner | PDEF-3 | **Commercial gate not yet governed.** |
| PCG-3 | ≥ 10% conversion | ₹99 visitor→buyer; also proposed ₹99→₹499 and ₹499→₹1,499 | ₹99/₹499/₹1,499 | Product Owner | PDEF-3 | **Commercial gate not yet governed.** |
| PCG-4 | ≥ 60% useful outcome | ₹99 gate: buyers reporting useful outcome | ₹99 | Product Owner | PDEF-3 | **Commercial gate not yet governed.** |
| PCG-5 | ≤ 8% refunds | Refund ceiling per tier gate | all tiers | Product Owner | PDEF-3 | **Commercial gate not yet governed.** |
| PCG-6 | ≥ 70% completion | ₹499 and ₹1,499 progression gates | ₹499/₹1,499 | Product Owner | PDEF-3 | **Commercial gate not yet governed.** |

No gate is specific to Client Finder; all six are tier-to-tier progression gates whose applicability would itself
depend on how PDEF-2 resolves. Terms used by the proposed gates ("qualified visitor," "useful outcome,"
"completion," measurement window, instrumentation) are undefined in any governing record.

## 14. Downstream dependency chain

```
Product definition (PRD V2.2 §6 — DECIDED: 3 static tiers)
        ↓
Tier ↔ Client Finder mapping (PDEF-2 — PENDING PRODUCT OWNER DECISION)
        ↓
Commercial gates (PDEF-3 — PENDING; PCG-1..6 proposed only, not governed)
        ↓
Launch criteria per tier (PDEF-4 — NOT STARTED; blocked by PDEF-2 and PDEF-3)
        ↓
Deployment authority for K1 (K1-10 — NOT AUTHORIZED; no governing record couples K1 validation to deployment)
        ↓
Launch — not reached
```

| Stage | Status |
|---|---|
| Product definition | Completed (PRD V2.2 §6) |
| Tier ↔ feature mapping (PDEF-2) | Pending — this record's subject |
| Commercial gates (PDEF-3) | Pending — scope-dependent on PDEF-2 |
| Launch criteria (PDEF-4) | Not yet started — blocked by PDEF-2 and PDEF-3 |
| Deployment authority (K1-10) | Not yet authorized — independent blocker, not resolved by K1 validation or by PDEF-2 |
| Launch | Not authorized at any stage |

K1 validation (completed, Phase 1 of this session) satisfies none of the stages below "Product definition" in this
chain. It does not authorize deployment, and this record does not claim that it does.

## 15. Product Owner questions

The smallest set of decision questions (not engineering questions) needed to close PDEF-2, limited to what governing
records do not already answer:

1. **Does Client Finder / Client Intent Discovery become part of the ₹499 tier, the ₹1,499 tier, both, or neither?**
   (Resolves PRD OQ-3 and CX-1/CX-2.)
2. **If included in a tier, is it included in the purchase price of that tier, or exposed as a separately-gated
   capability layered on top of tier ownership?**
3. **If included in more than one tier, does access or usage scope differ between tiers, and if so, how?**
4. **Is purchase of each tier independent, or does a buyer need to own a lower rung (e.g. ₹499) before purchasing a
   higher rung (e.g. ₹1,499) in order to receive Client Finder access** — as distinct from the existing code-level
   containment rule in `packages/catalog/src/ladder.ts`, which governs entitlement scope on purchase, not purchase
   eligibility?
5. **Should any ongoing usage limit apply to Client Finder once granted**, and if so, at what tier(s)?

Questions already answered by governing records (and therefore excluded here): the existence and names of the three
tiers (§5–§7); the separation of identity/entitlement/payment (DEC-002); K1's engineering completion status (§9);
whether any commercial gate is currently governing (§13 — none are).

## 16. No authorization statement

**This record grants no authorization of any kind.** It does not decide PDEF-2, does not select or recommend an
option, does not change the PRD, catalog, pricing, or deliverables, does not implement or adopt any commercial gate,
does not modify K1, and does not authorize deployment, release, or launch of any tier or capability. It is a
preparation record only, assembled read-only from existing governing repository records, for the Product Owner's use
in deciding PDEF-2.

## 17. Governance status

| Field | Value |
|---|---|
| PDEF-2 decision status | **PENDING PRODUCT OWNER DECISION** (unchanged by this record) |
| This record's authority | NONE |
| Implementation authority | NONE |
| Deployment authority | NONE |
| Commercial-gate authority | NONE |
| Next governance action | Product Owner review and decision of PDEF-2 |
