# ₹1,499 AI Client Finder — Contact-Value Capture Spike

## 0. Document status

**THIS IS AN INVESTIGATION / DESIGN SPIKE. NO CODE, SCHEMA, MIGRATION, TEST, ROUTE, OR REQUIREMENT FILE WAS
MODIFIED TO PRODUCE IT**, except for a small, clearly-marked, documentation-only correction applied afterward to
`requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md` (§15 below) to keep that plan accurate — no
other file was touched. Nothing was staged, committed, pushed, or deployed. K1, Path A, and Path B were read, not
modified, anywhere in this investigation.

Every conclusion below is tagged:
- **REPOSITORY FACT** — directly observed in the current repository (file:line cited).
- **ENGINEERING INFERENCE** — a conclusion that follows from repository facts but isn't itself a single line of
  code.
- **RECOMMENDATION** — this spike's proposed design choice; not a decision, not authorized for implementation.
- **REMAINING UNKNOWN** — genuinely unresolved; not decided here.

---

## 1. Executive Summary

The primary question — *given an opportunity eligible because at least one contact channel exists, how can the
application reliably retrieve the actual contact value(s)?* — has a concrete answer: **for Path A (and for Path
B's surviving `BUSINESS_EMAIL` evidence), the actual contact value is already sitting, unmodified, in already-
persisted `TEXT` columns** (`research_signals.signal`, `research_signal_sources.source_quote`). No migration or
backfill is needed to make it *available*. What's needed is a new, small, **additive** extraction module — never
touching K1 — that finds a candidate substring and classifies it using K1's own existing, unmodified export, plus
one new, small table to make a reveal **permanent** once a user actually unlocks it (so a later re-research run
can't retroactively erase something already shown, per the already-decided IRL-I permanent-unlock rule).

**The task's own suspicion is confirmed by repository evidence**: `opportunities.offer_based_on` is copied claim
*text*, not a foreign key — and the evidence trail is in fact *stronger* than that single column suggests,
because the `OfferSignal` shape passed into the offer engine doesn't even carry the originating signal's `id`
(`packages/core-opportunity/src/adapters.ts:189-195`), so no FK could be reconstructed from that pipeline even by
refactoring it. The reliable association for this feature's purposes is not `offer_based_on` at all — it is the
`opportunity.prospect_id → research_signals.prospect_id → research_signal_sources.signal_id` FK chain, which
**is** reliable (§6).

**Path B does not block the current launch.** It structurally cannot produce a `PHONE`/`PERSONAL_EMAIL`/
`UNCERTAIN_EMAIL` reveal, because the evidence containing those is rejected *before persistence* — but since
eligibility detection runs over the exact same persisted text that extraction would read, a Path-B-only
opportunity could never have been flagged eligible via one of those three kinds in the first place. This is a
structural non-issue, not a scope gap (§14).

**One real, unresolved edge case remains** (§7, §17.1): K1's presence detector is deliberately more sophisticated
at defeating obfuscation (spelled-out digits, mask runs, NFKC normalization) than any plain-regex value-extractor
needs to be for the common case — meaning a small number of K1-confirmed `PHONE` presences may have no clean,
literal, human-displayable value to extract. This is flagged, not resolved, and does not block the overall
architecture.

---

## 2. Current Product Definition

Restated for traceability, not re-decided here — all already governed before this spike began:

- ₹1,499 = 30 days of AI Client Finder access. No credits, no balance, no fixed lead quantity.
- Opportunity eligibility = at least one of `BUSINESS_EMAIL` / `PERSONAL_EMAIL` / `UNCERTAIN_EMAIL` / `PHONE`
  detected. Target-customer match is a ranking signal only, never a gate.
- Contact-display rule: when multiple channels are available for one opportunity, **all** are shown — no
  precedence rule hides one in favor of another.
- K1 (`ContactIdentifierKind`, `containsPersonalContactIdentifier`, `containsAnyContactIdentifier`,
  `detectContactIdentifiers`) remains completely unmodified by this spike and by its recommendation.

These are carried forward from `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` and
`CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md` (Revision 4) — not re-litigated here.

---

## 3. Path-A Data Flow (live AI-research pipeline)

1. **External source data enters** via `deps.provider.research({...})` inside `runResearchForOwner`
   (`packages/core-research/src/service.ts:149`). **[REPOSITORY FACT]**
2. **Raw source content is mapped**, not via `persist.ts`'s `toResearchRows()` — that adapter is explicitly
   described, in migration `0016_research_signals`'s own header comment, as *"the pre-existing, unintegrated
   toResearchRows() adapter in persist.ts"*, i.e. dead/unused by this path. The live path uses `./mapping`
   (`toNewResearchSignals(research)`, `service.ts:160`). **[REPOSITORY FACT]**
3. **Source quotes are stored** in `research_signal_sources.source_quote` (`TEXT NOT NULL`), one-or-more rows
   per signal (migration `0016_research_signals/migration.sql`). **[REPOSITORY FACT]**
4. **Research signals are created** via `deps.signals.saveSignals(prospect.id, signalInputs, now)`
   (`service.ts:162`) → `packages/core-research/src/pgRepository.ts`'s `createPgResearchSignalRepository` →
   `INSERT INTO research_signals` / `research_signal_sources`. **[REPOSITORY FACT]**
5. **Contact identifiers are detected: nowhere on this path.** Only two files in the entire repository import
   `contactIdentifiers.ts` — `intentSignal.ts` and `intentSourceProviderContract.ts` (confirmed by
   `grep -rln "contactIdentifiers\|ContactIdentifier" packages/core-research/src/*.ts`). `service.ts`, `persist.ts`,
   `mapping.ts`, `researcher.ts`, and `provenance.ts` do not import it. **[REPOSITORY FACT]**
6. **K1 classification: does not occur on this path at ingestion time, at all.** **[REPOSITORY FACT]**
7. **Opportunities are created** by `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:119-150`):
   fetches `deps.signals.listByProspect(userId, prospect.id)` (`:144`), adapts to `OfferSignal[]` via
   `toOfferSignals` (`adapters.ts:175-199`), runs `suggestOffers()`, and persists
   `offer.basedOn = top.basedOn` into `opportunities.offer_based_on TEXT[]`
   (`packages/core-opportunity/src/pgRepository.ts:59`). **[REPOSITORY FACT]**
8. **How an opportunity references its evidence:** only through `prospect_id` — the *shared* FK both
   `opportunities` and `research_signals` carry to the same `prospects` row. `offer_based_on` is **not** a
   reference to anything; see §6. **[REPOSITORY FACT]**
9. **Is the actual contact value still available?** Yes — verbatim, unmodified, in
   `research_signal_sources.source_quote` and/or `research_signals.signal`, for every currently-active
   (`superseded_at IS NULL`) signal of that prospect. These are `TEXT` columns with no masking, redaction, or
   truncation applied anywhere in the write path (Path A has no K1 gate to redact anything, §3.5-3.6).
   **[REPOSITORY FACT]**
10. **Can multiple contact values be recovered?** Yes, in principle — nothing in the schema limits a prospect to
    one signal or one source; multiple rows, each potentially carrying a different value, are the normal shape
    (one-to-many `research_signals` per prospect, one-to-many `research_signal_sources` per signal).
    **[REPOSITORY FACT — schema]**; whether a given extraction approach actually *recovers* all of them is a
    design question, addressed in §7-§8.
11. **Is source text sufficient to reliably associate each value with the correct opportunity?** Yes, at the
    prospect boundary: `companies`/`prospects` are per-user, never globally shared
    (`companies_user_id_normalized_domain_key`, migration `0015_discovery`), and `opportunities_prospect_id_key`
    (migration `0017_opportunities`) makes Opportunity:Prospect exactly 1:1. So "every currently-active signal
    for this prospect" **is**, by construction, "this opportunity's evidence pool" — exactly the same join
    `createOpportunityForOwner` itself already trusts to decide the offer (`service.ts:144`). It is **not**
    reliable at the finer "which *specific* quote justified the offer" level — but that finer precision is not
    what contact-reveal needs (see §6). **[REPOSITORY FACT + ENGINEERING INFERENCE]**

---

## 4. Path-B Data Flow (intent-intake pipeline)

1. **Source data enters** two ways into the same persisted shape: direct intent intake via `intentSignal.ts`'s
   validation (`validateIntentSignalInput`-style flow), and AI-platform/public-web/public-intent provider intake
   via `intentSourceProviderContract.ts`. Both ultimately produce the identical
   `{field, kind, classification, signal, confidence, sources}` shape and are persisted through the **same**
   `pgRepository.ts` into the **same** `research_signals`/`research_signal_sources` tables Path A uses — there is
   no separate intent-specific table. **[REPOSITORY FACT]**
2. **K1 screening occurs** at `intentSignal.ts:338`:
   `if (k1ContainsPersonal(quote, website)) { throw new IntentSignalValidationError(...) }` — and, independently,
   inside `intentSourceProviderContract.ts`'s `runK1()` (`:373-391`), which rejects any evidence statement
   containing a personal identifier, **and additionally** rejects `context.targetCustomer`/`geography`/`service`
   if they contain **any** identifier including `BUSINESS_EMAIL` (that second check is about the search-context
   metadata fields, not the evidence quote). **[REPOSITORY FACT]**
3. **What is rejected:** the **entire intake event** — not a redacted/partial version — if its quote contains
   `PERSONAL_EMAIL`, `UNCERTAIN_EMAIL`, or `PHONE` (`containsPersonalContactIdentifier`,
   `contactIdentifiers.ts:1223-1227`, checks exactly those three kinds, not `BUSINESS_EMAIL`). **[REPOSITORY FACT]**
4. **What is persisted:** any evidence quote that does *not* trip that gate — which may still legitimately
   contain a `BUSINESS_EMAIL`, since the gate never screens for it in the quote itself. **[REPOSITORY FACT]**
5. **Do `BUSINESS_EMAIL` values survive?** Yes, structurally — nothing on this path screens evidence quotes for
   `BUSINESS_EMAIL`. **[REPOSITORY FACT]**
6. **Do `PHONE` values survive?** No — any evidence containing a detected phone number is rejected before a row
   is ever written; there is no row to extract a value from. **[REPOSITORY FACT]**
7. **Can an opportunity reference surviving Path-B evidence?** Yes, via the identical `prospect_id` chain as Path
   A — Path-B signals land in the same tables, and `supersedePrevious()` explicitly *excludes* intent-intake kinds
   from being retired by a later Path-A research run (`repository.ts:14-22`, citing
   `INTENT-INTAKE-PO-DEC-001 C2`), so Path-A and Path-B evidence for the same prospect coexist side by side
   indefinitely. **[REPOSITORY FACT]**

---

## 5. Contact Identifier Analysis (K1)

- **Kinds detected:** `BUSINESS_EMAIL | PERSONAL_EMAIL | UNCERTAIN_EMAIL | PHONE | FRAGMENT`
  (`contactIdentifiers.ts:18-23`). **[REPOSITORY FACT]**
- **Only classification is returned, never the value.** Explicit in the module's own header comment
  (`:8-9`): *"C-2: no value, substring, offset or quote is ever returned — only the ContactIdentifierKind enum
  values."* `detectContactIdentifiers(text, website): readonly ContactIdentifierKind[]` (`:1218`).
  **[REPOSITORY FACT]**
- **Offsets/spans exist internally** (`Span`, `EmailCandidate`, `ConsumedRange` types track start/end indices to
  resolve overlapping matches, e.g. `computeExclusionSpans`) but are **never exposed** in the public API — they
  are private intermediate state only. **[REPOSITORY FACT]**
- **Normalization changes the working text.** `buildC()` (`:42-49`) applies NFKC, strips `\p{Cf}` format
  characters, maps non-ASCII decimal-digit code points to ASCII, and lower-cases — detection runs over this
  normalized string, not the original. Any future exposed offset would be in *normalized*-string coordinates,
  which do not always map 1:1 back onto the original text (NFKC can change code-point counts).
  **[REPOSITORY FACT + ENGINEERING INFERENCE]**
- **Can the original representation be recovered?** Not through K1's existing exports. But `buildC()`'s
  transformations are near-identity for already-clean ASCII business emails/phone numbers — the overwhelmingly
  common real case — so a **separate, simpler** extractor that finds candidate substrings directly in the
  **original** (non-normalized) text with its own plain regex, then classifies each candidate by handing just
  that substring to K1's existing, unmodified `detectContactIdentifiers()`, never needs K1's internal offsets at
  all. **[RECOMMENDATION]**
- **Multiple contacts / duplicates:** `detectInC` (`:1077-1117` and onward) pushes one array entry per matched
  candidate (each comma-separated `mailto:` address, each phone stretch) — so *count* information exists at the
  kind level, but with no value attached, two matches of the same kind are indistinguishable from one another in
  K1's own output. **[REPOSITORY FACT]**
- **Evidence provenance:** K1 takes only `(text, website)` — it has no notion of which `research_signal`/`source`
  row the text came from. Provenance is entirely the caller's responsibility, and is preserved naturally if the
  caller iterates per-row (exactly what §8/§13 recommend). **[REPOSITORY FACT]**

---

## 6. Opportunity-to-Evidence Association

**The FK chain that exists:**
- `opportunities.prospect_id → prospects.id` (CASCADE) — migration `0017_opportunities`.
- `research_signals.prospect_id → prospects.id` (CASCADE) — migration `0016_research_signals`.
- `research_signal_sources.signal_id → research_signals.id` (CASCADE) — migration `0016_research_signals`.

**The non-FK that was suspected, and is now verified:**
`opportunities.offer_based_on TEXT[]` is populated from `top.basedOn` (`core-opportunity/service.ts`), which is
itself `matched.map((s) => s.signal)` in `packages/core-acquisition/src/offer.ts:99` — i.e., the **claim text**
(`research_signals.signal`), never an `id`. This is not merely "unused as an FK today" — it is **structurally
incapable** of being one: the `OfferSignal` shape produced by `toOfferSignals()`
(`packages/core-opportunity/src/adapters.ts:189-195`) carries only `{ kind, signal, confidence, observedAt,
supersededAt }` — the originating row's `id` is dropped before `suggestOffers()` ever sees it. **The task's
suspicion is confirmed: `offer_based_on` is copied text, not a foreign key, and no refactor of the offer-matching
pipeline alone could turn it into one without first threading the signal `id` through an unrelated package
boundary (`core-acquisition`).** **[REPOSITORY FACT — VERIFIED]**

**Where the relationship is, and isn't, reliable:**
- **Reliable, at the prospect level:** "all of this opportunity's prospect's currently-active signals/sources" is
  a sound, FK-backed definition of "this opportunity's evidence" — because Opportunity:Prospect is exactly 1:1
  and Prospect is per-user (§3.11). This is the *exact* join `createOpportunityForOwner` already trusts
  (`deps.signals.listByProspect(userId, prospect.id)`) to decide what offer to recommend in the first place.
  **[ENGINEERING INFERENCE, grounded in §3.7/§3.11 facts]**
- **Not reliable, at the signal level:** there is no way to prove *which specific* `research_signals` row (and
  thus which specific `source_quote`) is "the one `offer_based_on` cited" — that narrower relationship is
  genuinely lost. But contact-reveal does not need that narrower relationship; it only needs "does this value
  belong to this opportunity," which the prospect-level association already answers. **[ENGINEERING INFERENCE]**
- `target_customer_match_determinations` (keyed by `(search_id, prospect_id)`, append-only, per the already-audited
  state recorded in the main engineering plan's §C.5) follows the same prospect-scoped pattern, independently of
  `research_signals`/`offer_based_on` — a parallel structure, not a joinable one, and not load-bearing for contact
  values. Not re-verified line-by-line in this pass; carried forward from the already-confirmed audit in the main
  plan.

---

## 7. Actual Contact-Value Availability

- **Path A: available now**, for every currently-active signal/source, via `listByProspect()`'s existing,
  unmodified output plus a new read-time extractor (§13). No migration required for *availability* — only for
  *permanence* of an already-shown value (§9, §13). **[RECOMMENDATION, grounded in §3's facts]**
- **Path B: available now for `BUSINESS_EMAIL`** where it survived intake; **not available, structurally, for
  `PHONE`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`** — the text containing them was never written (§4.3, §4.6).
  **[REPOSITORY FACT, re-derived from §4]**
- **Proposed mechanism:** a new, additive module (not K1) that (a) finds plain-regex email-shaped and
  phone-shaped candidate substrings directly in the **original**, un-normalized `research_signals.signal` and
  `research_signal_sources.source_quote` text, then (b) classifies each candidate by calling K1's existing,
  unmodified `detectContactIdentifiers(candidateSubstring, website)` on just that small substring — reusing K1's
  classification logic verbatim, without ever editing `contactIdentifiers.ts` or its exports.
  **[RECOMMENDATION]**
- **Edge case (unresolved):** some `PHONE` presences K1 detects are deliberately-obfuscated forms (digit words
  spelled out, mask-character runs, non-ASCII digit blocks) that a plain-regex candidate-finder over the
  *original* text will not isolate as one clean literal substring — even though K1 correctly says "present." For
  those, extraction may legitimately find nothing, despite eligibility being true. **[REMAINING UNKNOWN — §17.1]**

---

## 8. Multiple-Contact Handling

**Recommended approach:** for a given opportunity, fetch `listByProspect(userId, opportunity.prospectId)`
(already-existing, unmodified, already ownership-checked); for every returned signal and every one of its
`sources`, run the §7 extractor over `signal.signal` and each `source.sourceQuote`; collect every
`{ kind, value }` pair found; de-duplicate by `(kind, normalized value)` before returning or persisting.
**[RECOMMENDATION]**

This uniformly handles every combination the product rule requires — one contact, multiple emails, phone + email,
multiple emails + phone — with no special-casing per combination.

- **Cross-opportunity leakage is prevented by construction:** the scan is scoped to exactly one `prospectId`
  (already user- and opportunity-scoped 1:1, §6), so it can never read another prospect's — and therefore never
  another user's or another opportunity's — rows. **[REPOSITORY FACT, by construction of §3.11/§6]**
- **No ranking/precedence is introduced:** every distinct `{kind, value}` found is returned; any stable ordering
  (e.g. by kind, then by discovery order) carries no priority meaning, honoring the task's explicit instruction
  not to invent one. **[per governance, applied — not a new decision]**
- **The same value appearing in multiple evidence rows** (e.g., restated across several research runs before
  being superseded, or repeated within one run's multiple sources) is handled by the same `(kind, normalized
  value)` de-duplication step — one entry per distinct value, however many rows it appeared in.
  **[RECOMMENDATION]**

---

## 9. Historical Data Analysis

- **Can old opportunities reveal contact values immediately?** Yes, for Path A data that already exists — the
  full `source_quote`/`signal` text is already persisted; the §7 extractor runs over it at reveal time with
  nothing missing. **[RECOMMENDATION, grounded in §3/§7 facts]**
- **Does the system need a migration?** Only the small, additive permanence table discussed in §13 — not to make
  extraction *possible*, only to make a shown value *permanent* once unlocked. No existing table is altered.
  **[RECOMMENDATION]**
- **Does it need a one-time backfill?** No — extraction is on-demand, triggered the first time a specific user
  unlocks a specific opportunity, never a batch job over historical rows. **[RECOMMENDATION]**
- **Can extraction safely happen on demand?** Yes — it is a pure, read-only function over already-committed rows;
  the only write is the unlock transaction itself, which the main engineering plan already designs as one atomic
  transaction (§G). **[RECOMMENDATION]**
- **What happens when source evidence has been deleted or is unavailable?** The schema has no standalone
  deletion path for `research_signals`/`research_signal_sources` other than `CASCADE` from a deleted
  `prospect`/`user` row — and that cascade also deletes the `opportunity` itself (`opportunities_prospect_id_fkey
  ... ON DELETE CASCADE`), so "evidence deleted but opportunity still exists" cannot currently happen.
  **[REPOSITORY FACT]** The more realistic case — an opportunity was eligible when listed, was never unlocked, and
  a later re-research run superseded the one signal that carried the contact value, leaving nothing extractable
  at unlock time — is real and unresolved. **[REMAINING UNKNOWN — §17.4]**
- **What happens when an opportunity has multiple source records with conflicting contacts?** Not an error, and
  not resolved by picking one: both are surfaced, per §8's uniform "show every distinct value found" rule. The
  system has no way to know which is "correct," and the task explicitly forbids inventing a precedence rule here.
  **[per governance, applied]**

---

## 10. Authorization/Security Analysis

- **Unauthenticated users:** every opportunity-adjacent code path already requires a resolved session
  (`requireUser`, throughout `core-opportunity/src/service.ts`) — a new reveal/unlock route would follow the same
  convention. Not changed by this spike. **[REPOSITORY FACT, carried from main plan §C.2]**
- **Zero-entitlement users:** per the already-decided access-model record (cited in the main plan's §I scenario
  8), zero-entitlement users may browse/discover but may **not** unlock — raw contact values must never be
  reachable through any route such a user can call. **[already decided — not re-decided here]**
- **Active subscribers:** may reveal, subject only to the eligibility check (a qualifying channel detected) —
  unaffected by this spike.
- **Expired subscribers with previously-unlocked leads:** per IRL-I (main plan §I scenario 7), a permanently
  unlocked lead stays visible regardless of later expiry. This is precisely what motivates persisting the
  revealed value at unlock time (§13) instead of re-deriving it live on every subsequent view — a live
  re-derivation would break this guarantee the moment underlying evidence is superseded.
- **Cross-user access:** `listByProspect(userId, prospectId)` already enforces `userId` via a join to `prospects`
  (`repository.ts:9-11`'s own comment: *"enforces ownership itself by joining to prospects, rather than trusting
  the caller's already-checked Prospect alone"*) — a user cannot trigger extraction over another user's
  prospect's evidence. **[REPOSITORY FACT]**
- **Where the check must occur:** server-side, inside the unlock route handler, before extraction runs — never
  only in a frontend check, consistent with the main plan's existing principle.
- **Should raw source evidence remain hidden even when values are revealed?** Recommended yes — the reveal
  response should return only the extracted `{kind, value}` pairs, never the full `source_quote`/`signal` text,
  which may carry unrelated personal or business detail beyond the contact value itself. **[RECOMMENDATION]**

---

## 11. Privacy/Data Handling

- **Does storing `PERSONAL_EMAIL`/`UNCERTAIN_EMAIL` values already occur?** Not explicitly flagged as such — they
  exist today only as K1-detected *presence* (booleans) and as ordinary, unlabeled `TEXT` within Path-A's
  `research_signal_sources`/`research_signals` rows (Path B structurally excludes them, §4). No column anywhere
  marks a value "this is personal." **[REPOSITORY FACT]**
- **Does extracting them at read time change exposure?** The read itself doesn't create new exposure (the text
  was already stored); but **returning** a personal/uncertain email through an API response for the first time —
  which this feature does, by governed design (§2) — is new product-level exposure the system has never had
  before. This is already authorized by the cited governance, not something this spike is deciding.
  **[REPOSITORY FACT + inference]**
- **Should values be returned only through an authorized API?** Yes, recommended — the extractor itself should
  never be reachable as a generic/debug endpoint; only the unlock route (gated per §10) should ever invoke it.
  **[RECOMMENDATION]**
- **Should raw source text stay inaccessible to clients?** Yes, per §10's "return the value, not the quote"
  recommendation.
- **Must logs avoid contact-value leakage?** Yes — the main plan's §O already commits to this discipline ("no log
  line includes a revealed business email or phone value"); the new extraction module must follow the identical
  rule — a log line may safely carry `{kind, opportunityId, count}`, never the value. **[carried forward,
  reaffirmed, not newly decided]**
- **Could error messages expose contact information?** They must not — any extractor failure path (e.g., "no
  value could be extracted despite eligibility") should log/report a value-free diagnostic only.
  **[RECOMMENDATION]**

---

## 12. Architecture Options

### Option A — Read-time extraction only, nothing new persisted
Data availability: full (Path A), partial (Path B's `BUSINESS_EMAIL`). Correctness: high for clean text, degrades
on the §7 obfuscation edge case. Provenance: preserved naturally (prospect-scoped query). Complexity: low.
Migration: none. Effect on existing data/Path A/Path B: none (read-only). Multi-contact: yes. Cross-opportunity
leakage: prevented by construction. **Fatal flaw for this product:** nothing survives a later re-research run
superseding the evidence — breaks the already-decided permanent-unlock guarantee (IRL-I) the moment evidence
changes after an unlock.

### Option B — Persist normalized contact values at ingestion time, for every signal/source, whether or not ever unlocked
Data availability: full, immediately queryable for all prospects. Complexity: high — requires changing **both**
ingestion paths. Migration: yes, plus a historical backfill decision. **Disqualified**: modifying Path A's
`mapping.ts`/`persist.ts` write path and Path B's `intentSignal.ts`/`intentSourceProviderContract.ts` write path
is exactly what this spike (and the main plan) are instructed not to do — "Do NOT change Path A. Do NOT change
Path B." It also over-persists: it extracts and stores values for prospects nobody has asked to reveal, widening
exposure beyond what any user action has authorized.

### Option C — Persist contact values only at unlock time, scoped to that specific unlock
Data availability: full, from first unlock onward, using the identical Option-A extractor, just captured once.
Provenance: a new, small child table ties each captured value directly to the specific `lead_unlocks` row — an
explicit FK, stronger than anything upstream (`offer_based_on`) provides. Complexity: low — this generalizes the
main plan's own already-proposed `lead_unlocks.revealed_business_email`/`revealed_phone` columns (§E.3) from two
fixed scalar columns into a multi-row table (needed because "multiple business emails" cannot fit one scalar
column). Migration: yes, but additive-only — one new table, no existing table altered. Effect on existing
data/Path A/Path B: none — extraction still only *reads* their existing, unmodified output. Privacy: minimal —
a value is captured only for a specific opportunity a specific authorized user actually unlocked. Multi-contact:
native (one row per value). Cross-opportunity leakage: impossible by construction (keyed to a `lead_unlocks` row,
itself keyed to `(user_id, opportunity_id)`). **Solves Option A's permanence problem exactly.**

### Option D — none better found
Considered and rejected: exposing K1's internal offsets to recover exact original-text spans (unnecessary — the
candidate-regex-then-reclassify approach already avoids needing them, §5/§7); relying on `offer_based_on` for
provenance (rejected per §6 — it isn't FK-capable today, by construction of the pipeline that produces it).

**Recommendation: Option A's extraction logic, executed at unlock time and persisted via Option C's small new
table.** Not Option A alone (fails permanence). Not Option B (forbidden scope, over-persists).

---

## 13. Recommended Minimum Architecture

- **New database table: yes, one.** Proposed `lead_unlock_contacts` — one row per revealed value.
  - Fields: `id` (PK), `lead_unlock_id` (FK → `lead_unlocks.id`, CASCADE), `kind` (TEXT, `CHECK` constrained to
    `BUSINESS_EMAIL | PERSONAL_EMAIL | UNCERTAIN_EMAIL | PHONE` — deliberately excluding `FRAGMENT`, which K1
    itself never treats as a qualifying contact kind), `value` (TEXT, the extracted literal), `created_at`.
  - This **supersedes** the main plan's §E.3 `revealed_business_email`/`revealed_phone` scalar columns, which
    cannot hold more than one value per kind.
- **New foreign key: yes, one** — `lead_unlock_contacts.lead_unlock_id → lead_unlocks.id`. **No new FK is needed
  anywhere in the existing research/opportunity schema** — the existing `prospect_id` chain already suffices for
  the read side (§6).
- **New extraction module: yes, one.** Proposed `packages/core-research/src/contactValueExtraction.ts` — inside
  the *same* package as K1, so it can import `contactIdentifiers.ts` directly without going through the
  package's public `index.ts`, mirroring K1's own "not exported from the package index" placement (REV-005 §4.1).
  Proposed shape: `extractContactValues(signals: readonly StoredResearchSignal[], website: string | null):
  readonly { kind: ContactIdentifierKind; value: string }[]`.
- **New source/evidence association:** none needed for the *read* side (existing `listByProspect` + `prospect_id`
  chain already suffices). One **is** needed for the *persistence* side — exactly the FK above.
- **Migration:** yes, one small, additive-only migration (alongside the main plan's already-planned `lead_unlocks`
  migration) — no `ALTER` of any existing table.
- **Backfill:** no.
- **Can existing data be used?** Yes, immediately, for Path A; for Path B, only the `BUSINESS_EMAIL` subset that
  survived intake (§4, §7).
- **Minimum implementation, in order:** (1) the extraction module; (2) the `lead_unlock_contacts` table +
  migration; (3) wire the extractor into the unlock transaction (main plan §G) between "confirm eligibility" and
  "insert the `lead_unlocks` row" — capturing whatever `{kind, value}` pairs are found at that moment and
  inserting one `lead_unlock_contacts` row per pair in the same transaction.

---

## 14. Path-B Future Scope

- `PHONE`-containing evidence is currently rejected before persistence in Path B (§4.2-4.3, 4.6).
- Therefore Path-B phone reveal is not currently reachable — there is no row to extract from.
- `BUSINESS_EMAIL` may remain reachable where evidence survives (§4.5, §7).
- This is a future ingestion-pipeline question (whether to ever loosen Path B's phone-rejection gate for
  business-context numbers) — already flagged, non-blocking, in the main plan's §Q.8 and the access-model
  decision's §10. Not reopened, and K1/Path B are not changed here.
- **Does this block the current ₹1,499 implementation?** No. Repository evidence shows this is a structural
  non-issue, not a scope gap: eligibility detection and value extraction read the *identical* persisted text. If
  Path B's gate rejected a phone number's evidence, that same absent text could never have made a Path-B-only
  opportunity eligible via `PHONE` in the first place — there is no scenario where an opportunity is "eligible by
  PHONE through Path B" yet "blocked from revealing it." The current implementation does not need Path B's gate
  touched to ship.

---

## 15. Impact on Engineering Implementation Plan

Compared against `requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md` (Revision 4):

- **§E.3 `lead_unlocks`:** the `revealed_business_email`/`revealed_phone` scalar columns are superseded by this
  spike's `lead_unlock_contacts` child table (§13) — needed to support more than one value per kind and all four
  kinds, not just two.
- **§G Lead Unlock Design:** the eligibility step's footnote about "a new read-only query over the new
  contact-value capture store from §Q Risk #1, once it exists" is resolved — eligibility itself needs no new
  store (K1's existing presence check over `listByProspect`'s already-fetched text suffices, unchanged); a new
  store is needed only for the *reveal* step, not eligibility.
- **§K File-by-file:** the placeholder row *"Contact-value capture (Risk #1 — scope not yet finalized) ... a new,
  additive module in packages/core-research/src/ ... Flagged as requiring its own engineering design pass before
  a file list can be finalized"* is resolved by this spike — the file list can now be finalized:
  `packages/core-research/src/contactValueExtraction.ts` (new) and a migration for `lead_unlock_contacts` (new).
- **§Q Risk #1:** downgraded from *"BLOCKER — large and currently unscoped"* to *"ENGINEERING DETAIL — scoped by
  this spike; implementation-sized, not research-sized."* The one still-open piece is the §7/§17.1 obfuscated-
  phone extraction edge case — materially narrower than the original blocker.
- **§R Implementation Gate:** §G (lead-unlock contact-reveal path) can be reclassified as implementation-ready
  once this spike's recommendation is reviewed — this spike does not itself authorize that reclassification; it
  only removes the "unscoped" quality of the former blocker.

A small, documentation-only correction reflecting the above has been applied to the main plan (§E.3, §K, §Q.1,
§R) immediately after this document was created, per this task's own instruction that documentation-only
corrections required to keep the plan accurate are in scope for this spike. No other file was touched.

---

## 16. Implementation Readiness Assessment

**Contact-value capture is now design-ready — not yet implementation-authorized.** The architecture (§13) is
fully determined: one new table, one new module, one new FK, zero changes to Path A, Path B, or K1, zero
migration risk to existing tables, zero backfill. No outstanding Product Owner decision blocks it. One
non-blocking engineering edge case remains open (§17.1) and can reasonably ship with a conservative default
(reveal whichever values extract cleanly; silently log, never surface, the rest) without needing a PO ruling
first — flagged for confirmation, not treated as a blocker.

Implementation itself — the module, the migration, the route wiring — is **not authorized by this document**.
This spike is investigation/design only, exactly as scoped; actual code requires its own, separate, explicit
Product Owner authorization, consistent with the main plan's own §13/§R.

---

## 17. Remaining Unknowns

1. **Obfuscated/spelled-out `PHONE` extraction gap (§7, §17.1).** Behavior when K1 confirms presence but the
   extractor can't isolate a clean literal value. Recommendation given (reveal whatever does extract; don't block
   the whole unlock) but not decided by the Product Owner.
2. **Child table vs. JSONB column** for `lead_unlock_contacts` — an engineering-detail choice, not decided here.
3. **Cross-business-contamination defense reuse.** `core-opportunity/src/adapters.ts:124`'s `hasConflictingSource`
   (R-70, the Goregaon Sports Club defense) is private/unexported and not reused by this spike's recommended
   extractor — meaning a contact value from evidence that self-identifies as a *different* business could
   theoretically be revealed under the current recommendation. Flagged as worth a design decision before
   implementation; not resolved here.
4. **Eligible-at-list-time, nothing-extractable-at-unlock-time race** (§9). Exact user-facing behavior — reject
   with a specific error code, or unlock with an empty reveal — is undecided.
5. **Whether `FRAGMENT`-kind K1 matches should ever surface in any form.** This spike assumes no (excluded from
   `lead_unlock_contacts.kind`'s `CHECK` constraint, consistent with `FRAGMENT` never being an eligibility-
   qualifying kind), but this has not been explicitly re-confirmed by a Product Owner decision.
