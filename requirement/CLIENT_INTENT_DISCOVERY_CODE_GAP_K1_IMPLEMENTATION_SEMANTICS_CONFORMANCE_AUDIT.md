# CLIENT INTENT DISCOVERY — CODE-GAP K-1 IMPLEMENTATION SEMANTICS DECISIONS — CONFORMANCE AUDIT

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-DEC-CONFORMANCE-AUDIT-001
**Date:** 2026-10-02
**Type:** READ-ONLY conformance audit. Not a decision record, not an implementation plan, not an implementation
authorization.
**Audited record:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-001
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_SEMANTICS_PRODUCT_OWNER_DECISION.md`, "K1I-DEC").
**Author role:** governance auditor / conformance reviewer.

> **This audit modifies no decision, makes no Product Owner decision, and resolves no open question.** Where a
> decision or rationale is not supported by a cited record, that is recorded as a finding. K1-I1..K1-I6 stand as
> recorded.

**Classification vocabulary:**

| Term | Meaning |
|---|---|
| EXISTING RULE | Text of a governing decision predating K1I-DEC |
| IMPLEMENTATION FACT | Code or implementation-record text; no governance status |
| NEW PO POLICY | A rule first made in K1I-DEC |
| INTERPRETATION | A reading of existing text supplied by K1I-DEC |
| ENGINEERING-ONLY | Left to an engineering specification |
| UNRESOLVED | Not settled by K1I-DEC or any cited record |

**Abbreviations:** K1I-Q = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-QUESTIONNAIRE-001; K1I-PREP =
CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-PREP-001; K1-DEC = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001;
K1-AUDIT = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-DEC-CONFORMANCE-AUDIT-001; PO-DEC =
CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 (K1-B); OQ-DEC = OQ-PO-DEC-001; DEC-003 = INTENT-INTAKE-PO-DEC-003;
CONTRACT-REC = INTENT-SOURCE-PROVIDER-CONTRACT-REC-001; ADAPTER-REC = INTENT-SOURCE-ADAPTER-IMPL-REC-001; REQ-001 =
canonical requirement.

---

## §1 Scope

K1-I1, K1-I2, K1-I3, K1-I4, K1-I5 and K1-I6 as recorded in K1I-DEC §3–§8, plus K1I-DEC §9 (cross-question consistency)
and §10 (engineering boundary). Nothing else.

## §2 Baseline (verified before writing)

| Item | Value | Matches K1I-DEC §2 |
|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | Yes |
| Staged files | 0 | Yes |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (pre-existing; hash unchanged); untracked records under `requirement/` only | Yes (plus K1I-DEC itself) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) | Yes |

| Record | sha256 (verified) | Matches recorded value |
|---|---|---|
| K1I-DEC | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` | n/a (audited record) |
| K1I-Q | `5660c18e0347e94de7320940ded55025ef9db92e256a2878b129a220a59324e4` | Yes |
| K1I-PREP | `73b60186fa621392c149cfd49f3334422221cff4f851949e791080492c61b831` | Yes |
| K1-DEC | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| K1-AUDIT | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` | Yes |
| K1-Q (residual questionnaire) | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` | Yes |
| PO-DEC | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| REQ-001 | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |

Code read (unmodified; covered by the empty fingerprint): `packages/core-research/src/intentSourceProviderContract.ts`,
`packages/core-research/src/intentSignal.ts`, `packages/core-discovery/src/normalize.ts`.

**Baseline: PASS.**

**Recording accuracy.**
- K1I-DEC answers exactly K1-I1..K1-I6 and no other question.
- Option mappings are stated correctly against K1I-Q:
  - I1 adopts the subdomain limb of K1-I1-b and the parent-host limb shared by K1-I1-a/b, and rejects K1-I1-c.
  - I2 = K1-I2-a; I4 = K1-I4-a; I5 rule 1 = K1-I5-a plus a prose field set (permitted by K1I-Q); I6 = K1-I6-a.
- Each answer is labelled "PO POLICY (this record)".

**Recording accuracy: PASS.**

---

## §3 Individual findings

### K1-I1 — Subdomain and parent-domain relationship

**Test cases** (applying K1I-DEC §3 text only; no algorithm assumed):

| Website (normalized per OQ-7 / F-1) | Email domain | K1I-DEC result | Rule |
|---|---|---|---|
| `acme.com` | `mail.acme.com` | Business | 2 (subdomain) |
| `shop.acme.com` | `acme.com` | Personal | 3 (parent) |
| `shop.acme.com` | `mail.shop.acme.com` | Business | 2 (subdomain, depth 2 from `acme.com`, depth 1 from website) |
| `a.acme.com` | `b.acme.com` | Personal | 4 (sibling) |
| `acme.com` | `acme.co.in` | Personal | 4 ("any other host"); also K1-I2 |
| `www.acme.com` → `acme.com` | `acme.com` | Business | 1 (OQ-7 normalization strips `www.`) |

Every case resolves to exactly one outcome. **The rule is internally precise at policy level.**

**I1-F1 — Policy vs engineering.** "Lies below / above" is a policy relationship. The decision does not specify how it
is computed (label boundaries, IDN form, canonical case), and leaves this to E-1. The statement that E-11 is "not
required" follows from rule 5, so it is a consequence of the policy, not an engineering choice. **Classification:
NEW PO POLICY; no engineering decided.**

**I1-F2 — Textual tension with K1-R1 rule 3 (recorded, not resolved).**
- K1-R1 rule 3 classifies "addresses at any domain other than the attributed organization's normalized
  business-website domain" as personal. Read literally, a subdomain is "a domain other than" the website domain.
- K1-I1 rule 2 makes subdomains business, so it qualifies rule 3's literal scope.
- K1I-DEC §1 justifies this by the K1-DEC §3 reservation, which expressly left "subdomains" undecided. That reservation
  supports reading K1-I1 as filling a reserved item rather than amending rule 3.
- Whether the qualification amends K1-R1 is an **INTERPRETATION**. The two texts are reconcilable only by reading
  K1-R1 rule 3 subject to its own §3 reservation.
- **Finding: no conflict if the reservation reading is accepted. The literal wording of K1-R1 rule 3 is now
  qualified.**

**I1-F3 — Rationale support.**
- The rationale says a subdomain "is wholly contained within that supplied host" and that recognizing it is "not an
  inference".
- No cited record establishes that addresses at a subdomain belong to, or are controlled by, the organization. OQ-7
  item 1 anchors identity, not control of subordinate hosts.
- **Finding: K1-I1 rule 2 is a Product Owner policy choice; the cited records do not independently establish the
  rule.**
- The parent-host reasoning ("No record establishes that the parent of a supplied host belongs to the organization")
  is accurate as a statement of absence.

**I1-F4 — OQ-7 unaffected.** K1I-DEC §3 states that website identity, normalization, unification and
`findOrCreateByDomain` are unchanged, and that the rule is used for K1-B classification only. No text alters OQ-7.
**PASS.**

**I1-F5 — Acknowledged consequence.** An organization whose source-supplied website is a non-`www` subdomain (e.g.
`shop.acme.com`) has its parent-domain addresses classified personal. K1I-DEC gives this exact example. Acknowledged.

**K1-I1: FINDINGS** (I1-F2 textual qualification of K1-R1 rule 3 via reservation; I1-F3 rationale not record-established).

### K1-I2 — Different domains of the same or related organization

1. **New PO policy?** Yes. Labelled "PO POLICY (this record)". It states that K1-R1 rule 3 "already points this way"
   and does not claim pre-existing governance. **PASS.**
2. **Contradiction with a provider-contract rule?** None. CONTRACT-REC §2 carries one `business.website` (F-2) and
   contains no rule about additional domains. **PASS.**
3. **Conflict with K1-I1?** None. K1-I2 applies only to domains "neither the … website host nor a subdomain of it". The
   two decisions partition all domains (see §4). **PASS.**
4. **Conflict with K1-R1?** None. The decision coincides with rule 3's literal text. **PASS.**
5. **"Whether established or merely claimed" — identity-inference risk?** The phrase makes classification
   **independent** of any relationship. It creates no rule to infer, verify or record a relationship. The text states
   that relatedness "is never determined for K1-B purposes". No identity-inference rule is created. **PASS.**
6. **Does it decide how relationships are verified?** No. Domain discovery, contract fields and storage are listed as
   non-decisions. **PASS.**

**I2-F1 — Rationale overstatement (repeats K1-AUDIT R1-F4 pattern).**
- The rationale says OQ-7 item 3 prohibits matching by "company-name similarity", and that recognizing aliases would be
  "exactly that".
- OQ-7 item 3 governs inference of **prospective-client identity**. Classifying a contact address as business or
  personal is not identity matching.
- **Finding: the decision is a Product Owner policy choice; OQ-7 item 3 does not independently establish it.** The
  OQ-7 item 1 "singular anchor" point and F-2 are accurately cited.

**K1-I2: FINDINGS (rationale only, I2-F1).** The decision itself is consistent.

### K1-I3 — Non-standard renderings

**Consistency checks:**

| Against | Result |
|---|---|
| K1-R1 | Rule 1 "in any form" is given content. Rules 2–3 (domain-based; all phones personal) still govern classification. Not redefined. **PASS** |
| K1-R2 | Names untouched; no masking. **PASS** |
| K1-B | Rejection only for contact identifiers; fragments are excluded as "not a contact identifier". K1-B wording not extended. **PASS** |
| Verbatim (OQ-3 item 1) / reject-never-strip (CONTRACT-REC §3) | No text alters, de-obfuscates or strips quote content. Classification only. **PASS** |

**I3-F1 — Policy rule or detection mechanics?**
- "A rendering that conveys a complete email address or phone number" defines the **target set** by meaning, not by
  method. It imposes a capability requirement (obfuscated forms must be recognized), but chooses no method. Method is
  left to E-2 / E-7.
- **Classification: NEW PO POLICY; detection ENGINEERING-ONLY.**

**I3-F2 — "Complete" is undefined for phone numbers (policy ambiguity, non-blocking).**
- K1-I3 rule 2 excludes fragments "from which no complete … phone number can be read". No record or K1I-DEC text says
  what a complete phone number is. Open cases include a local number without area code, a number without country code,
  and an extension alone.
- Under K1-I3 rule 3 / K1-I4, doubt resolves toward rejection. But an engineering specification that **declares** such
  forms to be fragments would move them out of scope.
- The boundary is therefore set by engineering unless the Product Owner specifies it.
- **Classification: UNRESOLVED (policy-sensitive); not blocking, because K1-I4 supplies a fallback direction.**

**I3-F3 — Rationale.** "DEC-003 §6 prohibits personal email / phone harvesting" is accurately quoted. That an
obfuscated address "is as usable, and as harvestable" is Product Owner reasoning, not record text. Labelled as
rationale; no overstatement of a record found.

**K1-I3: FINDINGS** (I3-F2).

### K1-I4 — Uncertain strings

**I4-F1 — New fail-closed policy.**
- No existing record establishes a rule for uncertain identifier detection.
  - CONTRACT-REC §3 rejects identified violations.
  - CONTRACT-REC §6 item 4 records the bare-digit limitation as an open question.
  - DEC-003 §6, REQ-001 R-3.3 / R-3A.3 / R-13.21 contain no uncertainty rule.
- K1I-DEC labels K1-I4 "PO POLICY (this record)" and "Uncertainty resolves toward privacy".
- **Finding: K1-I4 explicitly creates a NEW fail-closed policy. It does not present it as pre-existing. PASS on
  labelling.**

**I4-F2 — Deeming rule, not redefinition.** An uncertain string is "treated as a **personal** contact identifier". This
deems uncertain strings personal for K1-B. It does not change K1-R1's definition of which actual identifiers are
personal. **New PO policy; no silent redefinition**, but the effective rejection set is now wider than "personal contact
identifiers" proper.

**I4-F3 — "Plausibly" is not policy-defined; a hidden threshold exists.**
- K1I-DEC delegates "plausibly" and "established" to engineering (E-2, E-7) and gives illustrative non-identifiers:
  "evidently a date, price, amount or labelled reference number".
- K1I-PREP K1-I4 anticipated delegating the threshold "with a stated direction"; the direction is stated.
- However, the threshold **materially determines rejection volume**, so the engineering specification carries policy
  weight.
- **Finding: the threshold is correctly left to engineering under K1I-DEC's own terms. Its effect is policy-sensitive,
  and no record requires Product Owner review of that specification.** Recorded, not resolved.

**I4-F4 — Interaction with the bare-digit limitation.**
- CONTRACT-REC §6 item 4 records that a bare digit string "cannot be told apart from a numeric identifier".
- Under K1-I4, a phone-plausible bare digit string within K1-B scope that cannot be shown to be something else leads to
  `REJECTED`. The decision lists EG-CR-4 as an engineering input and acknowledges over-rejection as "bounded" but of
  unknown volume (EG-1).
- **Acknowledged.**

**I4-F5 — Rationale accuracy.**
- "No new outcome" relies on OQ-3's outcome list. CONTRACT-REC also defines `DUPLICATE_IN_BATCH`, so OQ-3's list is
  not the complete set of implementation outcomes. The rationale's point (no new *non-signal* outcome may be added by
  this round) remains accurate as an INTERPRETATION.
- R-3A.3 ("does not authorize … personal emails or phone numbers") supports the asymmetry argument. R-13.21 ("does not
  require … private phone numbers") is weaker support. Not overstated as cited.

**K1-I4: FINDINGS** (I4-F3 policy-weighted threshold delegated to engineering; I4-F2 widened effective rejection set).

### K1-I5 — Which text is screened

**I5-F1 — Lifecycle-based scope.**
- K1-I5 defines scope by **data lifecycle**: retained, displayed or passed on vs transient. It does not define scope by
  field type, except for rule 1 (evidence statements) and rule 4 (structured fields).
- The effective field set therefore depends on implementation behavior and could change if persistence changes.
- **Classification: NEW PO POLICY (lifecycle criterion). Its application requires an engineering field-by-field
  mapping, as K1I-DEC states.**

**I5-F2 — Current implementation facts relevant to the lifecycle test** (no governance status):

| Field | Current handling | Source |
|---|---|---|
| `title`, `snippet` (web), `title`, `body` (notice) | Concatenated into `sourceText` for the verbatim check only; not placed in the raw record passed to the adapter | `intentSourceProviderContract.ts:393`, `:417–426`, `:527` |
| `evidence` / `statement` | Carried in the raw record (`excerpt` / `interests[].statement`) and persisted as `source_quote` / `signal` | `:422`, `:498–504`; `intentSignal.ts:340–347` |
| `authorization.basis` | Required (`requireText`) but not among the five carried `AuthorizationEvidence` values | `intentSourceProviderContract.ts:447`; `intentSignal.ts:76–89` |
| `context` | Carried forward; not a free-text key, so already screened by the identifier screen | `:425`, `:505`; CONTRACT-REC §3 |

Under today's code, rule 2 therefore captures no free text beyond the evidence statements. The effective current scope
equals K1-I5-a. This is an implementation fact, not a finding against the decision.

**I5-F3 — "Must not be extracted, stored, displayed or used" vs DEC-003 §6.**
- DEC-003 §6 text: "no personal email / phone harvesting". It does not define harvesting and does not mention display
  or use.
- REQ-001 R-3A.3 ("does not authorize … personal emails or phone numbers") gives broader support for not storing them.
- K1I-DEC states the prohibition "restates DEC-003 §6 … it is not a new rule".
- **Finding:**
  - The "extracted / stored" limbs are a reasonable reading of "harvesting" (INTERPRETATION).
  - The "displayed / used" limbs go beyond DEC-003 §6's text.
  - **The claim that the whole sentence restates DEC-003 §6 is overstated. The display / use limbs are a Product Owner
    policy choice that the cited record does not independently establish.**

**I5-F4 — Internal wording tension ("used").**
- Rule 3 permits transient text to be used "to verify that a statement appears verbatim".
- The following sentence says an identifier in that text "must not be … used".
- The intended reading (the identifier is not used *as an identifier*; the containing text may be used for
  containment) is evident but not stated.
- **UNRESOLVED wording; non-blocking.**

**I5-F5 — Extension beyond K1-B's "quote" wording.**
- Rule 2 can bring non-quote free text (e.g. `basis`, if ever retained) within K1-B.
- K1-B's text is "free-text quote". The extension rests on K1-R1's operational phrase "item's free-text fields" and on
  the DEC-003 §6 purpose.
- **INTERPRETATION by the Product Owner; consistent with K1-R1; not compelled by PO-DEC §2.**

**I5-F6 — Specific fields.**
- Title, snippet, RFP body, `basis` and temporary fetched / source text are each covered by rules 2–3.
- Structured fields are unchanged (rule 4).
- Contact identifiers outside the evidence quote are explicitly addressed (no rejection unless retained).
- **Complete coverage; PASS.**

**K1-I5: FINDINGS** (I5-F3 overstated restatement; I5-F4 wording; I5-F1 lifecycle dependency noted).

### K1-I6 — Rejection scope

**I6-F1 — Terminology across records:**

| Term | Where used | Object denoted (as used) | Defined? |
|---|---|---|---|
| "provider result" | CONTRACT-REC §2 | One `PublicWebSearchProviderResult` / `AiPlatformProviderSignal` / `PublicIntentProviderNotice` | Yes (by type) |
| "event" / "source event" | ADAPTER-REC §4; CONTRACT-REC §2 | One `NormalizedIntentEvent`. Implementation fact: one provider result produces at most one event (`NORMALIZED` carries one `event`) | By type |
| "source item" | OQ-3 ("for the source item itself") | Not defined | **No** |
| "evidence item" | PO-DEC §2 (K1-B); K1-DEC §3 | Not defined (K1I-PREP K1-I6) | **No** (until K1I-DEC) |
| evidence entry | CONTRACT-REC §2.2 / §2.3 (`evidence[]`, `intentEvidence[]`) | One statement / excerpt within a provider result | By type |
| "entry" | ADAPTER-REC §4 ("One invalid entry rejects the whole event") | A signal entry within an event | By context |
| Opportunity | Downstream (D3 / D4 path) | Distinct object; not created from a rejected item | Yes, distinct |

- K1I-DEC equates "evidence item" (for K1-B) = "source item" = "provider result".
- **No record establishes that OQ-3's "source item" is the provider result.** An AI-platform signal's evidence entries
  each carry their own `observedAt` and optional `referenceUrl`, so a reading of "source item" at entry level is not
  excluded by OQ-3's text.
- **Finding: the equation is a Product Owner definition (INTERPRETATION of OQ-3, NEW PO POLICY for K1-B), not an
  established alias.** K1I-DEC states that it defines the term "for K1-B application only". Within that limit,
  "provider result", "source item" and "event" are used as one object, and "evidence entry" and "Opportunity" as
  distinct objects. The decision's usage is consistent.

**I6-F2 — ADAPTER-REC §4.**
- ADAPTER-REC §4 states "One invalid entry rejects the whole event" and "whole event validated before any write", in
  the context of entry validation in `toIntentIntakeInput`, not privacy screening.
- The provider-contract code comment "Any defect rejects the whole result" (`intentSourceProviderContract.ts:439`) is a
  further consistent IMPLEMENTATION FACT.
- K1I-DEC labels the ADAPTER-REC citation "implementation fact, consistent". **Accurately labelled. It does not
  establish the rule.**

**I6-F3 — "Partial acceptance would be stripping."**
- CONTRACT-REC §3 "rejected, never stripped" concerns privacy-violating keys and values within a record.
- Applying it to the exclusion of whole evidence entries is an analogy.
- **Finding: INTERPRETATION; the cited record does not independently establish that entry-level exclusion is
  "stripping".**

**I6-F4 — OQ-3 / K1-R3 / K1-B.**
- OQ-3 conditions apply "for the source item itself". K1-R3 maps K1-B failure to `REJECTED`. `REJECTED` is a
  per-provider-result outcome (CONTRACT-REC §2, F-6).
- The decision is consistent with all three, given I6-F1's definition.

**I6-F5 — Non-spread.** "One bad result never aborts the batch" is accurately quoted from CONTRACT-REC §2. The other
non-spread statements (existing Company / Prospect / Opportunity unaffected; future results independent) are NEW PO
POLICY statements, consistent with existing behavior. **PASS.**

**I6-F6 — Unacknowledged amplification (K1-I4 × K1-I6).**
- A single uncertain, phone-plausible string in one evidence entry (K1-I4) rejects the whole provider result (K1-I6),
  including any other clean entries, and including `FIRST_PARTY` entries in a mixed AI-platform result.
- K1I-DEC acknowledges EG-1 volume uncertainty for K1-I4 and K1-I6 separately. It does not state their combined
  effect.
- **Finding: consequence not explicitly acknowledged.**

**K1-I6: FINDINGS** (I6-F1 definitional choice; I6-F3 analogy; I6-F6 combined effect).

---

## §4 Cross-decision consistency

| Decision | Compatible with K1-R1? | Compatible with K1-R2? | Compatible with K1-R3? | Engineering ambiguity? |
|---|---|---|---|---|
| K1-I1 | Yes, via K1-DEC §3 reservation reading (I1-F2) | Yes | Yes | Comparison mechanics (E-1) |
| K1-I2 | Yes (matches rule 3) | Yes | Yes | None |
| K1-I3 | Yes (gives content to "in any form") | Yes | Yes | Detection (E-2, E-7); phone completeness (I3-F2) |
| K1-I4 | Yes (deeming rule; definition unchanged, I4-F2) | Yes | Yes (`REJECTED`; no new outcome) | Plausibility threshold (I4-F3) |
| K1-I5 | Yes ("item's free-text fields" read through lifecycle) | Yes (no masking) | Yes | Field-by-field lifecycle mapping (I5-F1, I5-F2) |
| K1-I6 | Yes | Yes (no stripping) | Yes (`REJECTED` per source item) | None at policy level |

**I1 + I2.** These partition all domains:
- identical host or subdomain → business (I1);
- parent, sibling or other host → personal (I1 rules 3–4);
- every non-family domain, including related or claimed ones → personal (I2).

`acme.co.in` vs `acme.com` falls under both I1 rule 4 and I2, with the same result. No domain receives conflicting
outcomes. **Consistent.**

**I3 + I4.**
- Complete renderings → in scope (I3 rule 1).
- Determined fragments → not a ground (I3 rule 2).
- Undetermined → I4 (I3 rule 3) → rejection if plausible.

A masked number is a "determined fragment" (no rejection) only if engineering can establish incompleteness; otherwise
it falls to I4. The texts are consistent. The boundary between "determined fragment" and "undetermined" is left to
engineering (I3-F2). **Consistent; boundary engineering-dependent.**

**I5 + I6.** I5 determines which text can trigger K1-B. I6 determines that any trigger rejects the whole provider
result. An identifier only in transient text (I5 rule 3) triggers nothing. Under current code (I5-F2), only evidence
statements can trigger whole-result rejection. **Consistent.** Combined effect with I4: I6-F6.

**Global.**
- "Personal contact identifier" is not silently redefined. I4 adds an explicit deeming rule (I4-F2).
- No decision authorizes implementation (K1I-DEC header, §12).
- **No contradiction between the six decisions found.**

---

## §5 Policy vs engineering classification

| Decision | Clause | Classification |
|---|---|---|
| I1 | Identical host → business | EXISTING RULE (K1-R1 rule 2) |
| I1 | Subdomain → business | NEW PO POLICY (fills K1-DEC §3 reservation; I1-F2, I1-F3) |
| I1 | Parent / sibling / other host → personal | NEW PO POLICY (consistent with K1-R1 rule 3 literal) |
| I1 | No registrable-domain equivalence | NEW PO POLICY |
| I1 | OQ-7 identity unchanged | EXISTING RULE (restated) |
| I1 | How below / above is computed; canonical form | ENGINEERING-ONLY (E-1) |
| I2 | Related / additional / claimed domains → personal | NEW PO POLICY (coincides with K1-R1 rule 3) |
| I2 | Single source-supplied anchor | EXISTING RULE (OQ-7 item 1) + IMPLEMENTATION FACT (F-2) |
| I2 | OQ-7 item 3 compels it | INTERPRETATION, overstated (I2-F1) |
| I2 | Future change needs separate PO record | NEW PO POLICY (procedural) |
| I3 | Complete identifier in any rendering → in scope | NEW PO POLICY (content for K1-R1 "in any form") |
| I3 | Fragments → not a K1-B ground | NEW PO POLICY |
| I3 | Undetermined → K1-I4 | NEW PO POLICY |
| I3 | Meaning of "complete" phone number | UNRESOLVED (I3-F2) |
| I3 | Detection | ENGINEERING-ONLY (E-2, E-7) |
| I4 | Uncertain plausible identifier → treated as personal → `REJECTED` | NEW PO POLICY (fail-closed) |
| I4 | No new outcome / no review state | NEW PO POLICY (consistent with OQ-3) |
| I4 | Meaning of "plausibly" / "established" | ENGINEERING-ONLY by delegation; policy-weighted (I4-F3) |
| I5 | Evidence statements always screened | NEW PO POLICY (consistent with K1-B "quote") |
| I5 | Other free text screened if retained / displayed / passed on | NEW PO POLICY (lifecycle criterion; I5-F1, I5-F5) |
| I5 | Transient text not screened | NEW PO POLICY |
| I5 | Identifier in transient text not extracted / stored | INTERPRETATION of DEC-003 §6 |
| I5 | Identifier in transient text not displayed / used | NEW PO POLICY, mislabelled as restatement (I5-F3) |
| I5 | Structured fields unchanged | EXISTING RULE (CONTRACT-REC §3, IMPLEMENTATION FACT kept by K1-DEC §3) |
| I5 | Which fields meet the lifecycle test | ENGINEERING-ONLY (mapping) |
| I6 | Whole provider result `REJECTED` | NEW PO POLICY |
| I6 | "Evidence item" = source item = provider result (for K1-B) | NEW PO POLICY / INTERPRETATION of OQ-3 (I6-F1) |
| I6 | Batch unaffected | IMPLEMENTATION FACT (CONTRACT-REC §2), adopted |
| I6 | Other objects / future results unaffected | NEW PO POLICY |
| I6 | Partial acceptance = stripping | INTERPRETATION (I6-F3) |

**Accidental engineering decisions:** none found.
- K1I-DEC §10's statements ("E-1 must not broaden …", "E-9 must yield the K1-I6 unit") are constraints derived from
  policy. They make no implementation choice.
- The E-11 "not required" remark is a consequence of I1 rule 5.

---

## §6 Implementation blockers (assessment only; nothing solved)

Assessed as if PD-1 were later granted.

| Issue | Classification | Note |
|---|---|---|
| Domain comparison semantics (identical / subdomain / parent / sibling / other) | **POLICY DECIDED** | K1-I1, K1-I2 |
| Email-domain canonical form, label-boundary comparison, IDN | **ENGINEERING SPEC REQUIRED** | E-1 |
| Related-domain recognition | **POLICY DECIDED** (none recognized) | K1-I2 |
| Identifier detection incl. obfuscated renderings | **ENGINEERING SPEC REQUIRED** | E-2, E-5, E-7, E-8 |
| Meaning of "complete" phone number (local / no country code / extension-only) | **POLICY STILL AMBIGUOUS** (non-blocking) | I3-F2; K1-I4 gives fallback direction |
| Uncertain-string direction | **POLICY DECIDED** | K1-I4 fail-closed |
| Uncertain-string threshold ("plausibly") | **ENGINEERING SPEC REQUIRED** (policy-weighted) | I4-F3 |
| Temporary-text lifecycle criterion | **POLICY DECIDED** | K1-I5 rules 2–3 |
| "Used" wording for identifiers in transient text | **POLICY STILL AMBIGUOUS** (non-blocking) | I5-F4 |
| Field enumeration against the lifecycle test | **ENGINEERING SPEC REQUIRED** | I5-F2 gives current facts |
| Exact rejection object | **POLICY DECIDED** | K1-I6 (provider result), given I6-F1 definition |
| Placement / ordering / messages / tests | **ENGINEERING SPEC REQUIRED** | E-9, E-10, E-13, E-14 |
| Implementation authorization | **DEPENDENCY OPEN** | PD-1 |
| Volume effect (incl. I4 × I6, I6-F6) | **DEPENDENCY OPEN** (evidence) | EG-1, EG-CR-4 |

**Assessment.**
- No blocking policy gap remains for implementing K1-B as decided.
- An engineering specification is required for:
  - comparison canonicalization;
  - detection;
  - the plausibility threshold;
  - field mapping;
  - placement, ordering, messages and tests.
- Two policy ambiguities (I3-F2, I5-F4) are non-blocking. Whether to clarify them is a Product Owner matter.
- **Implementation still cannot proceed: PD-1 is PENDING.**

---

## §7 Remaining governance dependencies

| Item | Status | Changed by K1I-DEC? |
|---|---|---|
| PD-1 implementation scope / authorization | **PENDING** | No |
| PD-2 evidence-class representation | PENDING | No |
| PD-3 service-category vocabulary / matching beyond D3 | PENDING | No |
| PD-6 expressed vs observed time | PENDING | No |
| PD-8 new source family | PENDING | No |
| PD-9 provider authorization | PENDING | No |
| S14 applicability to LinkedIn lead-form responses (EG-5) | OPEN | No |
| EG-1 kinds / prevalence of personal data in real quotes | OPEN EVIDENCE GAP | No |
| EG-CR-4 bare-digit limitation (CONTRACT-REC §6 item 4) | OPEN (implementation) | No |
| K1-B, K1-R1, K1-R2, K1-R3 | DECIDED | Not reopened (K1-R1 rule 3 literal wording qualified via reservation; I1-F2) |

## §8 Independence limitation

The preparation record (K1I-PREP), the questionnaire (K1I-Q), the Product Owner decision (K1I-DEC, made by Claude Code
under delegated Product Owner authority) and this audit were all produced in the same working session. The findings are
evidence-based and cite record and code text, but **this audit is not an independent human review**.

---

## Governance status

- K1-I1..K1-I6 stand exactly as recorded. The findings do not modify, replace or suspend them. Any revision would
  require a separate Product Owner record.
- Rationale overstatements (I2-F1, I5-F3) and interpretations (I1-F2, I1-F3, I5-F5, I6-F1, I6-F3) are recorded for the
  Product Owner. No restatement record is required for the decisions to remain in force.

```text
Audit type: READ-ONLY conformance audit

K1-I1: FINDINGS   K1-I2: FINDINGS (rationale only)   K1-I3: FINDINGS
K1-I4: FINDINGS   K1-I5: FINDINGS                    K1-I6: FINDINGS
Conflicts with prior decisions: NONE (K1-R1 rule 3 literal wording qualified via K1-DEC §3 reservation)
Blocking policy gaps: NONE; non-blocking ambiguities: 2 (I3-F2, I5-F4)

Files created: 1 (this record)
Existing records modified: 0
Production / test / schema / migration / configuration / API / UI changes: 0
Database connections / writes: 0
Provider calls: 0
External HTTP / research: 0
Validation: 0
Participant contact: 0
Deployment: 0
Commits / pushes: 0

Product Owner decisions made or modified: NONE
PD-1: PENDING
Implementation authorization: NONE
Validation authority: NONE
```
