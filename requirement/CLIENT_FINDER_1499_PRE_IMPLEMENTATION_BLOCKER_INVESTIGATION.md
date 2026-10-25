# ₹1,499 Advanced Client Finder Subscription — Pre-Implementation Blocker Investigation

## 0. Document status

**THIS IS AN INVESTIGATION, NOT IMPLEMENTATION.** No application code, schema, migration, test, or requirement file
was modified to produce this document. Nothing was staged, committed, pushed, or deployed. No Product Owner
decision is made or invented here. K1's classification semantics (`ContactIdentifierKind`,
`containsPersonalContactIdentifier`, `containsAnyContactIdentifier`, `detectContactIdentifiers`) are not modified,
and no `BUSINESS_PHONE` kind is introduced. Every conclusion below is labeled **CONFIRMED BY CODE** (traced to an
exact file:line) or **ENGINEERING INFERENCE** (a reasoned conclusion that is not itself a direct code citation).

---

## 1. Executive Summary

**Blocker 1 (contact value) is more nuanced than the original plan stated, in a way that materially changes the
build estimate.** The claim "no code stores the actual email/phone value" is **CONFIRMED BY CODE as narrowly true**
(no dedicated structured field exists), but it is **incomplete**: the repository has **two separate evidence-intake
pipelines**, and they behave completely differently.

- **Path A ("Research" pipeline** — `sourceDocumentProvider.ts` → `researcher.ts` (AI model) → `mapping.ts` →
  `pgRepository.ts`): has **zero K1 screening**. Any email or phone number an AI model surfaces in evidence text is
  stored unconditionally, verbatim, in plain `TEXT` columns.
- **Path B ("Intent Intake" pipeline** — `apps/worker/src/searchWorker/intentIntake.ts` and
  `intentSourceProviderContract.ts`/`intentSignal.ts`): is the **only** path that calls K1, and it calls K1 as a
  **reject-and-discard intake gate**, not a read over stored text. A quote containing a `PHONE` (of any kind —
  K1 draws no business/personal distinction within `PHONE` itself) is rejected **before** anything is persisted.
  A quote containing only a `BUSINESS_EMAIL` is **not** rejected and **is** persisted verbatim.
- **Net effect:** the raw business-email string already exists in storage today for Path-A-sourced evidence (both
  email and phone) and for Path-B-sourced evidence that only ever contained a business email. The raw phone-number
  string is **structurally unreachable** for any evidence that went through Path B's current gate, because such
  evidence is discarded at intake and never reaches storage, the Opportunity, or target-customer-match evaluation
  at all. Path B is also, as of this investigation, not wired to a live provider (fixtures only) — so today's real,
  persisted Opportunities are produced by Path A, which has no such gap.
- **Separately, there is no reliable join from an Opportunity back to the specific evidence row(s) that produced
  it** — `opportunities.offer_based_on` stores copied claim-text strings, not foreign keys.

**Blocker 2 (zero-entitlement access) has a strong, directly-governing signal already on record** — PDEF-2.2
("bundled... not a completely isolated standalone paywall") and PDEF-2.3 ("different access" per tier) — that
**PDEF-2 already decided Client Finder access comes through an applicable ₹499/₹1,499 entitlement, not as a
standalone free product.** This is not phrased as an explicit, granular "zero-entitlement users get zero access"
statement, so this document does not treat it as fully dispositive — but it substantially narrows what new PO
input (if any) is genuinely required, down to a single confirming question (§9).

---

## 2. Blocker 1 — Contact Value Investigation

Answers to the 15 numbered questions, each marked CONFIRMED BY CODE or ENGINEERING INFERENCE.

**1. Where does external source content first enter the system?**
CONFIRMED BY CODE. Two separate entry points exist:
- Path A: `sourceDocumentProvider.ts` (fetches/extracts homepage HTML) → `researcher.ts` (AI model call) →
  `schema.ts`'s `LeadResearch`/`Observation` shape.
- Path B: `apps/worker/src/searchWorker/intentIntake.ts:93` `recordIntentIntakeForOwner()`, fed by one of three
  provider-result contracts in `intentSourceProviderContract.ts` (`PublicWebSearchProviderResult`,
  `AiPlatformProviderSignal`, `PublicIntentProviderNotice`, lines 99-187). Per `intentSourceProviderContract.ts:55`,
  no live provider is wired to Path B yet — "results are supplied by the caller (fixtures today)."

**2. Where is the source text/quote currently stored?**
CONFIRMED BY CODE. `research_signals.signal` (TEXT, nullable, migration `0016_research_signals/migration.sql:56-95`)
and `research_signal_sources.source_quote` (TEXT NOT NULL, same migration, lines 118-124). Application-level length
cap `INTENT_QUOTE_MAX_LENGTH = 2000` (`intentSignal.ts:49`) — **not enforced at the DB level** (no SQL CHECK on
length). `pgRepository.ts:76-107` confirms both are literal, untransformed INSERTs of the input string.

**3. Where are K1 contact identifiers detected?**
CONFIRMED BY CODE. Exactly `packages/core-research/src/contactIdentifiers.ts` (`detectContactIdentifiers`, line
1218; `containsPersonalContactIdentifier`, lines 1223-1227; `containsAnyContactIdentifier`, lines 1229-1233). Only
three files in the entire repository reference K1 at all: `contactIdentifiers.ts` itself,
`intentSignal.ts`, and `intentSourceProviderContract.ts` — i.e., **Path A never calls K1**.

**4. Does any existing persisted object indirectly contain the actual value even without a dedicated field?**
**CONFIRMED BY CODE — yes, conditionally.** `research_signals.signal` / `research_signal_sources.source_quote` are
plain `TEXT`; whatever substring was in the original quote is stored byte-for-byte. For Path A, this is
unconditional (no screening at all). For Path B, this is true **only** when the quote's sole K1-detected kind is
`BUSINESS_EMAIL` — see §4 below for why `PHONE` can't reach storage via Path B today.

**5. Is the value transiently available then discarded before persistence?**
CONFIRMED BY CODE, and the answer differs by outcome:
- When K1 **rejects** (quote contains `PHONE`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`): the raw string exists only as a
  local function parameter in `runK1()` (`intentSourceProviderContract.ts:373-377`) and `toIntentSignalInput()`
  (`intentSignal.ts:294,338`); both throw immediately and the string goes out of scope, never persisted, never
  logged. `contactIdentifiers.ts`'s own header (lines 8-10) states this module "never strips, masks or rewrites a
  value... no value, substring, offset or quote is ever returned" — true of K1's own return values, and in practice
  the *caller*'s reject path discards the input string too.
- When K1 **passes** (`BUSINESS_EMAIL` only, or nothing): the string is **not** discarded — it is exactly what
  gets written to `signal`/`sourceQuote` (§2-4). So "discarded after classification" is only true for the rejected
  case.

**6. Inventory of every existing representation:**

| Concept | Type definition | Storage |
|---|---|---|
| `BUSINESS_EMAIL`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/`PHONE`/`FRAGMENT` | `ContactIdentifierKind` (`contactIdentifiers.ts:18-23`) | **None** — return values only; `detectContactIdentifiers` isn't even exported from the package `index.ts` |
| "personal contact identifier" | `isPersonalContactIdentifier()` (`intentSignal.ts:92-97`) — a separate, cruder regex check used only to screen `authorizationEvidence.businessId` | N/A, boolean only |
| source quote/evidence | `ResearchSignalSourceInput.sourceQuote` (`types.ts:14`), `ProviderIntentEvidence.evidence`, `AiPlatformEvidenceItem.statement` | `research_signal_sources.source_quote`, `research_signals.signal` (TEXT) |
| Opportunity → evidence | `DetectedOffer.basedOn: readonly string[]` (`packages/core-opportunity/src/types.ts:31`) | `opportunities.offer_based_on TEXT[]` — **copied claim text**, not an ID (see §8 below) |

**7. Concrete trace:** `"Contact us at sales@acme.com or call 555-1234"` (business website `acme.com`), via Path B:
`preparePublicWeb()` → `runK1()` → `detectContactIdentifiers` classifies `sales@acme.com` as `BUSINESS_EMAIL`
(domain matches `website`) **and** `555-1234` as `PHONE` → because `PHONE` is present,
`containsPersonalContactIdentifier` returns `true` → `IntentSignalValidationError` thrown → **the entire event is
rejected; nothing is persisted, including the email.** A variant without the phone number
(`"Contact us at sales@acme.com for more info"`) passes both K1 checks and **is** persisted verbatim into
`research_signals.signal` and `research_signal_sources.source_quote`.

**8. What would be required to reveal BUSINESS_EMAIL / PHONE on unlock?**
- **BUSINESS_EMAIL, Path-A-sourced opportunity:** a read-time extractor re-running email-matching logic over the
  already-stored `signal`/`sourceQuote` text, plus a reliable join from the Opportunity to that text (currently
  missing — see §8 trace below).
- **BUSINESS_EMAIL, Path-B-sourced opportunity:** same, and the value is guaranteed to exist in storage (if K1
  classified it as present at all, it necessarily passed the gate, since `BUSINESS_EMAIL` alone never triggers
  rejection).
- **PHONE, Path-A-sourced opportunity:** same extractor approach works — Path A never rejected it.
- **PHONE, Path-B-sourced opportunity:** **structurally impossible under current code** — any quote containing a
  phone number was rejected at intake and never reached `research_signals`/`research_signal_sources`, the
  Opportunity, or target-customer-match evaluation at all. There is nothing to re-derive from.

**9. Can the value be safely reconstructed from existing stored text, or must it be explicitly persisted?**
**ENGINEERING INFERENCE, grounded in #4-#8 above:** it can be **reconstructed from existing stored text** for
every case except Path-B-sourced `PHONE`, which has no stored text to reconstruct from under current intake
behavior. No new *capture* infrastructure is needed for the reconstructible cases — only a new, additive,
read-time *extraction* function and a new traceability join (§8, §6).

**10. Privacy/security implications of each option — see §5.**

**11. Would storing the value require changes to K1 / source capture / evidence model / opportunity model /
schema / ingestion pipeline / API responses?**
- **K1 itself (`contactIdentifiers.ts`):** **no change required** for the reconstruction approach — a new,
  additive function can reuse K1's existing internal matching logic without altering any existing export.
- **Source capture / ingestion pipeline:** **no change required** for Path A or for Path-B `BUSINESS_EMAIL` cases.
  **A change would be required** only if Path-B `PHONE` reveal is wanted — see §6 Minimum Recommended Architecture
  and §9's flagged question.
- **Evidence model:** no change to `ResearchSignalSourceInput`/`NewResearchSignalInput` shapes is required to
  *read* the value; a new read path is additive.
- **Opportunity model / schema:** **a new field or junction table is required** to reliably join an Opportunity to
  its underlying evidence row(s) — `offer_based_on`'s text-copy array is not a safe basis for this (see §8).
- **API responses:** new response shape needed for the unlock route (already scoped in the main implementation
  plan, §G/§J).

**12. Confirmed:** no modification to K1 classification semantics, no `BUSINESS_PHONE` introduction, and no
implementation was performed to produce this document.

**13-14. See §6 (Minimum Recommended Architecture) below, with already-supported / missing / recommendation /
PO-decision items clearly separated.**

**15. Is the problem (A) solvable entirely within existing architecture, (B) requires an engineering design
change, (C) requires a new PO decision, or (D) requires another research/validation step?**
**ENGINEERING INFERENCE — it is primarily (B), with a narrow (D)/(C)-flavored carve-out:**
- For `BUSINESS_EMAIL` (both paths) and `PHONE` (Path A only): **(B)** — an engineering design change (new
  extraction function + new Opportunity-to-evidence traceability), not a PO decision, and not solvable with zero
  new code ("entirely within existing architecture" in the strictest sense is not quite accurate, since the
  traceability join doesn't exist yet — but no new *product* decision is needed).
- For `PHONE` via Path B specifically: **(D) and arguably (C)** — this needs further investigation of whether Path
  B is expected to go live before this feature ships (if it never goes live, this gap is moot), and if it is,
  whether loosening the intake-reject gate to admit business-context phone numbers is acceptable — a question with
  privacy-policy texture that this document does not resolve (see §9).

---

## 3. Existing Data Flow

```
Path A (live today, no K1 screening):
  sourceDocumentProvider.ts (homepage fetch)
      -> researcher.ts (AI model call)
      -> schema.ts: LeadResearch / Observation
      -> mapping.ts: toNewResearchSignals()  [observation.value -> signal, evidence.quote -> sourceQuote, UNSCREENED]
      -> pgRepository.ts: saveSignals()
      -> research_signals.signal (TEXT) / research_signal_sources.source_quote (TEXT)   <-- raw value lands here, always

Path B (not yet wired to a live provider; fixtures only):
  PublicWebSearchProviderResult / AiPlatformProviderSignal / PublicIntentProviderNotice
      -> preparePublicWeb() / prepareAiPlatform() / preparePublicIntent()  [intentSourceProviderContract.ts]
      -> runK1(): containsPersonalContactIdentifier(text, website)
           -> PHONE present?            -> REJECT, nothing persisted, event aborted
           -> PERSONAL/UNCERTAIN_EMAIL? -> REJECT, nothing persisted, event aborted
           -> BUSINESS_EMAIL only (or nothing)? -> PASS
      -> normalizeIntentEvent() -> toIntentIntakeInput() -> toIntentSignalInput()
           -> runK1() a second time (same check, redundant) -> PASS
      -> recordIntentIntakeForOwner() -> saveSignals()
      -> research_signals.signal / research_signal_sources.source_quote  <-- raw value lands here, ONLY for
                                                                              BUSINESS_EMAIL-only quotes

Opportunity formation (both paths feed the same downstream):
  research_signals (by prospect_id)
      -> toOfferSignals() / target-customer-match evaluation
      -> StoredOpportunity.offer.basedOn: string[]   <-- COPIES of signal.signal text, not an ID reference
      -> opportunities.offer_based_on TEXT[]          <-- no FK to research_signals.id or research_signal_sources.id
```

**No code anywhere today re-reads `research_signals`/`research_signal_sources` to extract a contact value at
Opportunity-evaluation or unlock time** — this read path does not exist and would be entirely new.

---

## 4. Contact Value Storage Options

| Option | Description | Already supported? |
|---|---|---|
| **1. Re-derive from existing stored quote text** | New, additive extractor re-runs email/phone matching over `research_signals.signal`/`research_signal_sources.source_quote` at unlock time | Storage: yes, for Path A (both kinds) and Path B (`BUSINESS_EMAIL` only). Extractor code and Opportunity→evidence join: **missing**, net-new |
| **2. New dedicated capture field, populated at intake** | Add a structured `business_email`/`phone` column populated alongside existing intake, independent of the free-text quote | Not supported today; would require changes to both ingestion paths' persistence step |
| **3. New dedicated capture field, populated by a backfill/extraction job over existing text** | Batch job extracts values from already-stored quotes into a new structured column | Partially supported (same storage gap as Option 1 re: Path-B phone) |

**Recommendation basis (not a decision):** Option 1 is the smallest change — it treats the already-stored quote
text as the source of truth and adds only a read-time, additive extraction step plus a traceability join, rather
than changing either ingestion pipeline's write path.

---

## 5. Security/Privacy Analysis

- **Path A has zero personal-identifier screening of any kind.** This means personal emails, personal phone
  numbers, or other sensitive text an AI model's research summary happens to surface are **already being stored,
  unconditionally, today** — this is a **pre-existing condition, not caused by or in scope of the ₹1,499 feature**,
  but it is directly relevant to any contact-value-extraction design: an extractor built for this feature must be
  precise about extracting **only** the specific `BUSINESS_EMAIL`/`PHONE` substring it is authorized to reveal
  (per Q-UNLOCK-1B/IRL-J), and must **never** return the surrounding free-text quote verbatim, since that quote may
  contain other, non-qualifying personal information (a `PERSONAL_EMAIL`, a name, or other text) that was never
  screened by anything. **Flagged for separate awareness — not a blocker to this feature, but worth reporting.**
- **Option 1 (re-derive) is more privacy-conservative than Option 2 (new dedicated field populated at intake)** in
  one respect: it creates no new write-time capture surface and stores nothing new until the moment of an
  authorized, paid, user-initiated unlock — at which point only the two specific qualifying kinds are extracted
  and persisted into `lead_unlocks` (per the main plan's §E.3), not the whole quote.
- **Option 1's reliance on Path A's unscreened storage means the underlying `research_signals`/
  `research_signal_sources` rows already contain unscreened raw text regardless of whether this feature is built**
  — this feature does not increase that existing exposure, but also does not reduce it.
- **The Path-B PHONE intake-rejection gap (§2.15) is, from a privacy standpoint, the current system behaving
  conservatively** (refusing to retain phone-adjacent evidence at all) — any change to admit business-context phone
  numbers through that gate would be a deliberate loosening of that conservative posture, which is why §9 treats it
  as needing explicit confirmation rather than treating it as pure engineering.

---

## 6. Minimum Recommended Architecture

**Already supported (no new capture needed):**
- Raw `BUSINESS_EMAIL` text, Path A and Path B.
- Raw `PHONE` text, Path A only.

**Missing (net-new, additive, engineering-only):**
1. A read-time extraction function (proposed location: `packages/core-research/src/contactValueExtraction.ts`, a
   new, separate file — not a modification of `contactIdentifiers.ts`'s existing exports) that, given a quote
   string already classified by K1 as containing `BUSINESS_EMAIL` and/or `PHONE`, returns the specific matched
   substring(s) for those two kinds only. This may reuse the same underlying matching logic K1 already has
   internally (e.g. the `@`-scan and phone-stretch detection), exposed as a new function, not a change to any
   existing one.
2. A reliable Opportunity → evidence-row join. Recommendation: a new column or junction table recording which
   specific `research_signal_sources` row(s) (by id, not by copied text) back a given Opportunity's offer — this is
   a schema addition, not decided or created here, but necessary before extraction can run reliably at unlock time
   (today's `offer_based_on` text-array match is fragile and non-indexed).
3. A read path wired into the lead-unlock service (already scoped in the main implementation plan's §G) that calls
   (1) via (2) at the moment of a successful, paid unlock, and writes only the two qualifying values into the
   `lead_unlocks` row — never the surrounding quote.

**Engineering recommendation:** build items 1-3 above as part of the unlock feature's own scope, rather than as a
separate backfill project — no backfill of historical opportunities is required (consistent with IRL-L's
no-retroactive-benefit principle: unlock, and therefore reveal, only happens going forward for a given opportunity
when a user actually pays for it).

**Potential Product Owner input (not decided here):** whether Path B's phone-number intake-rejection gate should
ever be loosened for business-context phone numbers — relevant only if/when Path B is wired to a live provider.
Until then, this is a documented, non-blocking limitation, not an active gap (see §9).

---

## 7. Blocker 2 — Zero-Entitlement Access Investigation

**1. What does current Client Finder code allow an authenticated user to do?**
CONFIRMED BY CODE (from the main implementation plan's audit): any session-authenticated user may create/list
searches (`apps/web/app/api/searches/route.ts:27-41`) with **no product/entitlement check of any kind** — gating
is session-token presence only.

**2. Which routes require only authentication?** `searches/route.ts` (confirmed). No other Client Finder route
beyond `opportunities/[id]/feedback` currently exists in the API surface (per the main plan's §C.5), and that route
likewise has no entitlement check.

**3. Which capabilities have no entitlement check?** All of them, today — search creation/listing is the only live
Client Finder capability with an API route, and it is session-gated only.

**4. Do any governance records explicitly define free browsing/discovery?** **No explicit statement found.** No
record reviewed (PDEF-2, PDEF-3, ES decisions, `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md`, `MVP_SCOPE_BOUNDARY.md`)
contains language granting Client Finder access to a user holding no entitlement at all.

**5. Do any records define Client Finder as paid-only?** **Strong implicit signal, not an explicit verbatim
statement** — see §8.

**6-7. Do PDEF-2/3/4 or ES decisions answer this?** See §8 — PDEF-2 is the closest, and it speaks at the
tier-differentiation level (₹499 vs ₹1,499), not explicitly to the zero-purchase case. **No record was found that
explicitly and directly answers "what can a user with zero entitlements do in Client Finder."** This is reported,
not resolved.

---

## 8. Existing Governing Evidence

`requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`:

- **§8, PDEF-2.2 (Feature gating strategy) — DECIDED: BUNDLED.** *"Client Finder is bundled into the applicable
  ₹499 and ₹1,499 tier entitlements. It is not a completely isolated standalone paywall."* (lines 60-61).
  **CONFIRMED BY DOCUMENT TEXT.**
- **§9, PDEF-2.3 (Tier-based access) — DECIDED: DIFFERENT ACCESS.** ₹499 = "Basic Client Finder"; ₹1,499 =
  "Advanced Client Finder" (lines 71-82). **CONFIRMED BY DOCUMENT TEXT.**
- Both sections carry an explicit scope note: *"These are product-definition decisions only... does not authorize
  implementation of... access-control... changes"* (lines 67-69, 84-86).

**ENGINEERING INFERENCE drawn from the above (not a verbatim PO statement):** "bundled into the applicable tier
entitlements" and "not a standalone paywall" most naturally reads as: Client Finder access is a *benefit that comes
with* holding ₹499 or ₹1,499 — not a free-standing capability available independent of any purchase. This is a
fairly strong signal against "zero entitlement → full free access," but it is **not** phrased granularly enough to
mechanically answer the exact access boundary needed for engineering (e.g., it does not say whether a zero-
entitlement user should be blocked entirely, shown an upsell with zero functional access, or allowed a limited
preview). `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` §5 confirms PDEF-2 is "already decided
and is not reopened" and treats the 50/300-credit, bundled-access facts as fixed inputs, without adding any further
precision on the zero-entitlement case; §14 of that same record confirms the credit/access **enforcement
mechanism itself "remains explicitly undesigned."**

**Conclusion:** there is **no existing, explicit, granular PO decision** on the zero-entitlement case, but there is
a clear directional signal (PDEF-2.2/2.3) against treating it as "full free access by default." Per the task's
instruction, no decision is invented here.

---

## 9. Exact PO Question, if one is genuinely required

Given §8's directional-but-not-granular evidence, the smallest possible confirming question is:

> **Given PDEF-2.2 ("bundled... not a completely isolated standalone paywall") and PDEF-2.3 ("different access" per
> tier), does a logged-in user holding NO ₹99/₹499/₹1,499 entitlement of any kind have:**
> **(A) no Client Finder access at all (no search, no browsing, no discovery), or**
> **(B) browsing/discovery access only, with commercial actions (lead unlock) additionally requiring an active
> ₹1,499 subscription, or**
> **(C) some other explicit access model not captured by (A) or (B)?**

This document does not select (A), (B), or (C). **This is the only remaining open item from Blocker 2.**

**A second, narrower, Path-B-specific question flagged by Blocker 1 (§6, §9 cross-reference):** if/when Path B's
intent-intake pipeline is wired to a live provider, should its current phone-number intake-rejection gate be
loosened to admit business-context phone numbers (mirroring how `BUSINESS_EMAIL` is already treated), so that
PHONE-based ₹1,499 unlock eligibility/reveal becomes reachable for Path-B-sourced leads? **Not urgent** while Path
B remains fixtures-only, but should be answered before Path B goes live if this feature is expected to work
uniformly across both pipelines.

**GOVERNANCE UPDATE (added — does not reopen this investigation's own findings):** the ₹1,499 opportunity-
eligibility rule this investigation's Blocker-1 analysis was written against has since changed.
`CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` (`CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-PO-
DEC-002`) replaces the old "target-customer match = YES AND (`BUSINESS_EMAIL`/`PHONE`)" rule with "at least one
contact channel available," where `PERSONAL_EMAIL` and `UNCERTAIN_EMAIL` now also qualify and must be revealable.
Two consequences for this document's own scope, noted here without re-investigating:
- This document's Blocker-1 value-capture analysis (§2, Risk #1 in the main plan) was scoped to `BUSINESS_EMAIL`
  and `PHONE` values only. That scope is now **too narrow** — `PERSONAL_EMAIL`/`UNCERTAIN_EMAIL` values must also
  eventually be capturable and revealable. The Path A / Path B findings above (§1–§8) describing *how* values are
  or are not currently captured are unaffected and remain accurate for the kinds they already discuss; they
  simply need to be re-read as applying to a wider set of kinds going forward.
- Target-customer match is no longer part of the eligibility question this investigation partially informs — it
  is now a qualification/ranking signal only. This does not change anything already written in §1–§8.
K1 and Path B's current intake/rejection behavior are unaffected and not reopened by this note.

---

## 10. Razorpay Verification Items

Restated from the main implementation plan (§H, §Q.4) — **not re-investigated here, and not implemented**:

- Exact Razorpay Subscriptions API parameters for `subscriptions.create` (plan id, customer identity shape, total
  count, notify flags).
- Exact webhook event names/payloads for subscription activation, recurring charge capture, failed charge,
  cancellation, and completion — **not invented**; must be confirmed against Razorpay's current API documentation
  or a sandbox call.
- Whether a Razorpay Customer object must be created/reused per user for recurring mandates, as distinct from the
  existing one-time guest-checkout flow.
- The Plan-creation step itself (external dashboard or one-off API call) — an operational prerequisite, not
  application code.

No new Razorpay investigation was performed in this pass beyond what the main plan already identified; this
section exists only to keep the list in one place per the task's instruction.

---

## 11. Implementation Impact

- **Blocker 1 narrows, but does not close, the original plan's §K file list.** The proposed new
  `contactValueExtraction.ts` module (§6) is smaller in scope than originally feared (no new ingestion-pipeline
  capture mechanism needed for the reconstructible cases), but a new Opportunity-to-evidence traceability
  mechanism (schema addition) is now confirmed as a specific, concrete requirement rather than a vague unknown.
- **The Path-B PHONE gap means the unlock feature's test matrix (main plan §L) needs an explicit case:** "lead
  with only a Path-B-sourced PHONE signal" should currently be **untestable/non-existent** in real data, since
  such evidence cannot exist in storage — this should be documented as a known limitation in the test plan rather
  than silently assumed away.
- **Blocker 2's resolution (§9) directly determines the shape of `requireClientFinderAccess`** (main plan §I) —
  specifically whether it denies at the route boundary for every Client Finder action, or only at the unlock
  action — and should be resolved before that gate is implemented.

---

## 12. Final Readiness Assessment

**Files created:** `requirement/CLIENT_FINDER_1499_PRE_IMPLEMENTATION_BLOCKER_INVESTIGATION.md` (this document).

**Files inspected (read-only):**
- `requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md`
- `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`
- `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`
- `requirement/CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md`
- Code (via delegated read-only trace): `packages/core-research/src/contactIdentifiers.ts`,
  `packages/core-research/src/intentSignal.ts`, `packages/core-research/src/intentSourceProviderContract.ts`,
  `packages/core-research/src/intentSource.ts`, `packages/core-research/src/intentSourceAdapters.ts`,
  `packages/core-research/src/types.ts`, `packages/core-research/src/mapping.ts`,
  `packages/core-research/src/pgRepository.ts`, `apps/worker/src/searchWorker/intentIntake.ts`,
  `packages/core-opportunity/src/types.ts`, `packages/core-acquisition/src/offer.ts`,
  `packages/db/prisma/migrations/0016_research_signals/migration.sql`,
  `packages/db/prisma/migrations/0017_opportunities/migration.sql`.

**Was any code modified?** No.
**Was anything staged?** No.
**Was anything committed?** No.
**Was anything pushed?** No.

**Remaining Product Owner decisions, if any:**
1. §9's primary question — zero-entitlement Client Finder access model (A/B/C).
2. §9's secondary, non-urgent question — whether to loosen Path B's phone-intake rejection gate, relevant only if
   Path B is wired to a live provider before this feature ships.

**Is the project now ready for implementation planning/authorization?**
**Not yet, but closer.** Blocker 1 is now scoped precisely enough to estimate and design (§6) rather than being an
open unknown — it no longer requires "another research/validation step" in the open-ended sense the original plan
flagged, except for the narrow Path-B-phone question in §9. Blocker 2 has a single, narrow, answerable PO question
remaining (§9) rather than a wide-open ambiguity. Once §9's primary question is answered, this plan's main
remaining gate before implementation authorization is the Razorpay external verification items in §10 — unchanged
from the original plan.
