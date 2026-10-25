# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: Q5 VERIFICATION-SUFFICIENCY PO DECISION PREPARATION AUDIT

**Status: READ-ONLY. NO PO DECISION MADE. NO CODE/SCHEMA/DB CHANGED.**

---

## 1. Executive Summary

This audit re-verified the repository specifically on the mechanics of `OBSERVED` and found a more precise picture than the prior Q5 audit's framing. **`OBSERVED` is not a bare self-report.** A hard, deterministic, pre-persistence gate (`packages/core-research/src/provenance.ts`, enforced by `researcher.ts`'s retry loop, which **throws and persists nothing** if verification never passes) guarantees that every `OBSERVED` claim that ever reaches `research_signals` carries a quote that is (a) ≥12 characters, (b) cited to a URL that was genuinely among the documents supplied to the model, and (c) a real, verbatim (modulo cosmetic Unicode/whitespace normalization) substring of that specific document's fetched text. **This closes the "fabricated citation" risk entirely** — a model cannot get an invented quote or a mismatched URL into the database.

**What remains open, precisely:** this mechanism verifies that the *quote* is real and correctly sourced. It does **not** verify that the *value* text — the actual stored `companySummary`/`businessModel` sentence, which is always a model-composed paraphrase, never the quote itself — is a faithful, non-overreaching restatement of what that quote actually says. No deterministic, LLM-based, or human check of quote-to-value entailment exists anywhere in the repository. This is the one genuine remaining gap, and it is narrower and more specific than "OBSERVED could be anything the model wants."

The originally-proposed Option B ("OBSERVED + source URL" as distinct from Option C, "OBSERVED + URL + quote") **does not correspond to any realizable state in the current schema** — `evidenceSchema` requires `quote`, `sourceUrl`, and `sourceLabel` jointly on every evidence entry; a URL can never be stored without an already-verified quote. This narrows the real decision to fewer, more precisely-defined options than originally framed (see §10).

## 2. Exact Q5 Clarification Question

> If the Product Owner chooses "cross-freelancer reuse is allowed only for `companySummary`/`businessModel` values that are `OBSERVED` and supported by verified evidence," what exactly must "supported by verified evidence" mean?

This document does not answer it. It establishes precisely what the repository already guarantees, what it does not, and what options follow from that.

## 3. Repository Evidence

Re-verified directly in this pass, not assumed from the prior audit.

| Item | Current state | Citation |
|---|---|---|
| `companySummary` / `businessModel` | `observationSchema` instances, identical to all 9 fields | `packages/core-research/src/schema.ts:287-290` |
| `basis` | Free-text, required only for `INFERRED`, forbidden otherwise; `nullable().default(null)` | `schema.ts:88` |
| `OBSERVED` | Requires `value` non-null AND `evidence.length > 0` (Zod `.superRefine`) | `schema.ts:92-105` |
| `INFERRED` | Requires `value` non-null AND `basis` present AND `evidence.length === 0` AND `confidence ≤ 80` | `schema.ts:107-136` |
| Source URL | Part of a **mandatory three-field evidence object** (`quote`, `sourceUrl`, `sourceLabel`) — never stored independently of a quote | `schema.ts:31-57` |
| Source quote | Must be verbatim, ≥12 normalized characters, verified against the actual cited document's fetched text — **hard pre-persistence gate** | `packages/core-research/src/provenance.ts:45,149-223`; gate enforcement: `packages/core-research/src/researcher.ts:267,302-313` |
| `observedAt` | Stored on `research_signals.observed_at` | confirmed in `packages/db/prisma/migrations/0016_research_signals/migration.sql` |
| Provider | **Not stored** — no column records which model/provider produced a row | confirmed absent, all migrations through 0049 |
| Confidence | Stored, `research_signals.confidence`, 0-100 | same migration |
| Research signal identity | `research_signals.id`, append-only, one row per `Observation` | `packages/core-research/src/mapping.ts:16-27`, `pgRepository.ts` |
| Provenance | `research_signal_sources(signal_id, source_url, source_quote, source_label)` — **only populated for evidence that passed the gate below; zero rows for an `INFERRED` claim** | `pgRepository.ts:104` |
| Cache | `research_signal_cache_index`, per-user only, no verification-status dimension | `packages/db/prisma/migrations/0045_research_signal_cache_index/migration.sql` |

**Does the repository already distinguish "the model says this is observed" from "the underlying public source actually supports this statement"?** **Partially, and more strongly than the prior audit characterized.** It fully verifies that the cited *quote* is real and correctly sourced (not merely "the model says so" — this is independently checked against the actual fetched document, deterministically, as a hard gate). It does **not** verify that the *paraphrased value sentence built on top of that quote* is itself a faithful restatement — that link is "the model says so" and nothing else.

## 4. Meaning of OBSERVED

Answering each sub-question directly, from code:

- **Is it generated by the LLM?** Yes — the `classification` field itself is part of the model's structured output (`schema.ts:68-73`).
- **Is it validated deterministically?** Yes, in two layers: (1) Zod's `.superRefine` enforces the OBSERVED/INFERRED/UNKNOWN *shape* rules (evidence required iff OBSERVED, etc.) — a purely structural check; (2) `provenance.ts`'s `verifyProvenance()` enforces that every OBSERVED claim's evidence is *real* (quote exists verbatim in the correctly-cited document) — a content check, also deterministic (exact substring match, not fuzzy, not LLM-based).
- **Is it assigned by application code?** No — the classification label itself is always the model's choice; application code only *validates* it, never *assigns* OBSERVED/INFERRED/UNKNOWN itself.
- **Is it based on presence of a quote?** The *shape* rule requires a quote to exist for OBSERVED (schema). The *content* rule (provenance.ts) requires that quote to be real.
- **Is it based on presence of a URL?** Same — required by shape, verified for correctness by content check.
- **Is there any source-to-statement verification?** **No.** There is source-to-*quote* verification (the quote is real and correctly sourced). There is no quote-to-*statement*(`value`) verification — see §6/§8 for the precise gap this leaves.
- **Can the model output OBSERVED without evidence?** No — Zod rejects this immediately (`schema.ts:97-104`), and even if it somehow reached `verifyProvenance()`, that function independently re-flags the same condition (`provenance.ts:159-167`, its own defensive double-check).
- **Can it output INFERRED with evidence?** No — Zod explicitly rejects INFERRED with non-empty evidence (`schema.ts:118-125`: "INFERRED must not cite evidence — evidence means you observed it").
- **Can it output OBSERVED while the source does not actually support the generated sentence?** **This is the precise, narrow question, and the answer is nuanced, not a flat yes or no:**
  - It **cannot** cite a quote that doesn't exist in the cited document, or cite the wrong document — `verifyProvenance()` is a hard gate; failing this causes a targeted repair request, and if repair never succeeds within `maxAttempts` (default 3), the entire research run **throws** (`researcher.ts:313`) and **nothing is persisted** for that prospect's research — not even unrelated fields that were fine. There is no code path that persists a row whose cited quote failed verification.
  - It **can**, however, cite a real, correctly-sourced quote and then write a `value` sentence that paraphrases, generalizes, or adds an unverified qualifier beyond what that specific quote states (see Case 2 in §8). Nothing in the repository checks this. **NOT ESTABLISHED BY CURRENT REPOSITORY EVIDENCE that the stored `value` text is always a faithful restatement of its own cited quote** — the mechanism that would establish this (quote-to-value entailment checking) does not exist, confirmed by a repository-wide search for any semantic/entailment/factuality check connecting evidence to its claim (none found beyond the unrelated uses of "semantic" in `targetCustomerMatch.ts`/`worker.ts` comments, which concern unrelated category-matching and budget-accounting logic, not this gap).

## 5. Source URL Analysis

**Is a source URL alone sufficient?** This question, as originally framed, does not describe a state that can exist in the current data: `evidenceSchema` makes `quote`, `sourceUrl`, and `sourceLabel` all mandatory, non-optional fields of one object (`schema.ts:31-57`) — there is no way for a persisted evidence row to carry a URL without a quote, or vice versa. **Correction to the framing in the originating audit's Option B: "OBSERVED + source URL" is not a distinct, weaker tier than "OBSERVED + URL + quote" in this codebase — they are the same state.**

The deeper question — does the system prove the URL's *document* actually supports the *specific statement* made — is answered precisely in §4 above: the URL is proven to be one of the documents the model was actually given (not an invented or arbitrary URL), and the paired quote is proven to be real text from that specific document. The system does **not** prove that the document, beyond the quoted span, supports the broader `value` sentence.

What the system stores, confirmed exhaustively against the requested checklist:
- Source URL: **yes**, always paired with a quote.
- Source URL + quote: **yes**, always, for every OBSERVED claim — not optional, not separable.
- Source document (full extracted text): **no**, not for this pipeline — a full-document-plus-hash capture mechanism exists (`categoryPlausibilityRepository.ts`, `targetCustomerMatchRepository.ts`) but is wired only to category-plausibility/target-customer-match persistence, confirmed not connected to `companySummary`/`businessModel`'s save path (re-confirmed this pass: `mapping.ts:16-27` takes only `research: LeadResearch` as input, with no source-document parameter at all).
- Source field: implicit only — a `research_signal_sources` row's `signal_id` FK ties it to one specific `research_signals` row (one specific Observation), so the pairing is structurally correct, just not independently re-derivable without the original fetch.
- Extracted source text: not persisted as its own retrievable artifact for this pipeline.
- Source timestamp: `observed_at` is stored; the fetched document's own timestamp (when the homepage was retrieved) is not separately persisted for this pipeline (it IS captured, as `fetchedAt`, for the parallel category-plausibility/target-customer-match capture — again, not wired here).
- Provenance linking source → generated field: yes, for the *quote*, via the FK; not for the *value* sentence's fidelity to that quote.

## 6. Source Quote Analysis

- **Is the quote actually captured from the source?** Yes — `verifyProvenance()` checks this directly against `input.sourceDocuments`, the actual text handed to the model in that call, not a reconstruction.
- **Is it linked to the generated field?** Yes, structurally — each `Observation`'s own `evidence` array is checked against that same `Observation` (via `eachObservation()`'s per-path walk, `provenance.ts:117-137`), so a `companySummary`'s evidence cannot silently be checked against, e.g., `websiteIssues`'s own claim.
- **Is it stored verbatim or transformed?** Verbatim, by construction — the entire point of the check (`provenance.ts:25-32`'s own comment: "MATCHING IS EXACT SUBSTRING, NOT FUZZY... deliberately case-sensitive").
- **Can the system establish which source produced it?** Yes, via `source_url`/`source_label`.
- **Does the quote actually support the generated statement?** **Not established by current repository evidence.** The quote is proven to exist; whether it logically supports the specific wording of `value` is never checked.
- **Is quote-to-statement semantic verification performed?** **No.** Confirmed absent by direct reading of `provenance.ts` (its only checks are: minimum length, URL membership, verbatim substring match) and by a repository-wide search for any entailment/semantic/factuality mechanism (none found connecting evidence to its own claim).
- **Is that verification deterministic, LLM-based, or absent?** The verification that *does* exist (quote authenticity) is fully deterministic (exact substring match after fixed, documented Unicode normalization — no LLM call, no fuzziness). The verification that would be needed to confirm quote-to-value support (**absent**, as just established) is neither deterministic nor LLM-based — it simply does not exist.

## 7. D23 Compatibility

**D23, restated, not modified:** "Evidence is verified when a reliable source directly associates the value with the Entity; syntax alone is not verification; verification is separate from freshness; two independent sources are not universally required."

- **Does a model-generated paraphrase (the `value` field) qualify as D23-verified, on its own?** Not established — D23's test is about the *evidence*, and the paraphrase is not itself the evidence; the evidence is the quote.
- **Does source URL alone qualify?** Not a real, separable state in this schema (§5) — moot.
- **Does source quote + URL qualify?** **Yes, for the quote itself** — a quote verified to be real, verbatim text from a document the model actually fetched from the business's own public homepage is "a reliable source directly associating [that specific quoted text] with the Entity," squarely satisfying D23's own stated test, and it is far more than "syntax alone" (D23's explicit floor) — it is a mechanically-confirmed factual association.
- **Does an LLM's own "OBSERVED" label qualify, by itself?** No — and this is not what the repository relies on either; the label alone is never what persists a claim, the quote-verification gate is.

**The scope distinction that matters, stated precisely and without altering D23:** D23 is satisfied **for the evidence (the quote)**. Whether the **derived `value` sentence** — the thing that would actually be reused cross-freelancer under Q5 — inherits that same verification is a question D23 does not speak to, because D23 was written about evidence association generally, not about this specific two-step (quote → model paraphrase) structure this particular producer happens to use. **If Q5 requires that the reused *value* text itself carry the same assurance D23 gives the *quote*, that is an additional Q5-specific reuse safeguard, not a change to D23, and not something D23 currently guarantees by its own terms.** This document does not propose altering D23's wording or test — it only observes that D23's existing test, applied to this producer's actual output shape, cleanly covers the quote and does not, by itself, extend to the paraphrase layered on top of it.

## 8. Public Fact vs Model Paraphrase

**Case 1.** Source: "We offer monthly subscription plans." Model produces: "The company operates on a subscription model."
- Observed fact: yes, if the quoted span is ≥12 characters and classified OBSERVED — guaranteed real per §4/§6.
- Reasonable paraphrase: yes — a tight restatement, not introducing new, unverified content beyond what "monthly subscription plans" already states.
- Inference: minimal to none.
- D23 verification exists: for the quote, yes. For the value sentence specifically: not independently tested, but the paraphrase stays very close to the quote's own content, so the practical risk of overreach is low in this specific case (a qualitative read of the example, not a repository-enforced guarantee).
- Should it be globally reusable under Q5? Not decided here — flagged as the strongest-supported of the three cases.

**Case 2.** Source: "We serve small businesses." Model produces: "The company primarily targets SMBs."
- Observed fact: "We serve small businesses," if quoted — guaranteed real.
- Reasonable paraphrase: partially — "SMBs" generalizes "small businesses" to include "medium" businesses, which the quote does not state.
- Inference: yes, specifically the word **"primarily"** — the quote states that the business serves small businesses; it does not state that this is its *primary* focus (as opposed to one segment among several). This is an unverified editorial addition riding on top of a genuinely verified quote.
- D23 verification exists: for the quote, yes. For "primarily" and the "SMB" generalization specifically: **not established** — this is exactly the gap identified in §4/§6, made concrete.
- Should it be globally reusable under Q5? Not decided here — flagged as the case that most directly demonstrates why "OBSERVED + verified quote" alone does not fully close the accuracy question.

**Case 3.** Source contains only indirect signals (no direct statement). Model produces: "The company likely uses a recurring SaaS revenue model."
- Observed fact: none directly stated.
- Reasonable paraphrase: no — this is not a restatement of any single quoted sentence.
- Inference: yes, explicitly — the hedging language ("likely") is itself a strong signal this should be classified INFERRED, and the schema would force this: if the model attempted to cite OBSERVED here without a genuine verbatim quote supporting it, `verifyProvenance()`'s hard gate would reject the citation (no matching text exists in the source for this claim), triggering repair or, if unresolved, aborting the entire research run — **confirmed, this case is correctly and reliably excluded from the OBSERVED-with-verified-evidence pool by the existing mechanism, with no gap.**
- D23 verification exists: no, and correctly so — if classified INFERRED (as the schema would force), no evidence exists at all, so it would already be excluded by Option C-style filtering.
- Should it be globally reusable under Q5? Not decided here — but this case is the one the existing mechanism already handles correctly, unlike Case 2.

**Summary of this section's finding:** the existing OBSERVED+evidence gate reliably excludes pure inference dressed up as fact (Case 3) — that specific fear is already addressed by code that exists today. The gap this audit identifies is narrower and sits at the margin illustrated by Case 2: a real, verified quote can still have an unverified qualifier or generalization layered onto it in the `value` text, and nothing catches that today.

## 9. Competitive-Intelligence Analysis

**Does source verification alone solve the competitive-intelligence concern? No — and this is a distinct concern from accuracy, not solved by the same fix.**

Scenario: Freelancer A researches Business X (public source); the model produces a source-verified, `OBSERVED` `companySummary`; Freelancer B later receives the same value via a future Entity architecture.

- **Is the value public factual information?** The *quote* behind it is (it exists verbatim on the business's own public homepage). The *value* — the composed sentence — is not "the public fact" itself; it is a synthesis of it.
- **Is it derived intelligence?** Yes, by construction (§7/§8 of the earlier Q5 audit, reconfirmed here): every `value`, OBSERVED or not, is model-composed, never a verbatim copy.
- **Is it sales intelligence?** Potentially — the prompt's own framing is explicitly commercial ("for a freelancer deciding who to approach and what to offer," `prompt.ts:13`), and nothing distinguishes a "summary" field's synthesis from a more overtly sales-angled field's synthesis at the production-mechanism level (re-confirmed, same finding as the prior Q5 audit, now additionally confirmed that even the *verified* subset of these rows carries this property).
- **Is it freelancer-specific research?** The underlying homepage is not freelancer-specific; the act of having an LLM read it, decide what to extract, and phrase it a particular way **is** a specific, one-time synthesis product of that research run — reusing it without the original freelancer's involvement is reusing that synthesis, not merely "the public fact."

**Why source verification does not resolve this:** verifying that a quote is real and correctly sourced (§4-§7) answers "is this claim fabricated?" It does not and cannot answer "is this particular phrasing/synthesis a kind of research output the product intends to treat as freely shareable, versus as part of what a freelancer's research effort produced?" Those are different questions. A fully quote-verified, accurate `companySummary` can still represent exactly the kind of synthesis effort the four already-private fields were kept private to protect — verification closes the *accuracy* gap (partially, per §8), not the *who-should-benefit-from-this-synthesis* gap.

## 10. PO Options

Four options, each specifying a precisely-defined, currently-distinguishable state in the repository (the originally-proposed B/C distinction is collapsed per §5's finding):

**Option 1 — Reuse any row classified `OBSERVED`.** Because of the hard gate already in place (§3/§4), this already means: real, correctly-sourced quote; does not mean: the `value` text is free of unverified additions (Case 2-style risk) or protected from the competitive-intelligence concern (§9).
- *Privacy risk:* Medium — the accuracy/fabrication risk is already closed by existing code; the competitive-intelligence risk is not addressed by this option at all.
- *Evidence quality:* The strongest tier the current schema can natively express (OBSERVED implies a hard-verified quote, by construction).
- *Implementation complexity:* Lowest — a pure read-time filter on an existing column (`classification = 'OBSERVED'`).
- *AI cost:* None (no new calls).
- *Scalability:* High.
- *Historical-data implications:* No backfill needed; applies identically to existing and future rows.
- *Competitive-intelligence risk:* Not reduced by this option — carried over fully from §9.

**Option 2 — Reuse only `OBSERVED` rows whose evidence array is confirmed non-empty at read time** (a defensive re-check beyond trusting the `classification` column alone, in case any future producer code path ever bypasses `saveSignals`'s current pipeline).
- *Privacy risk:* Same as Option 1 in practice today (every OBSERVED row already has evidence, by schema) — this option's value is purely as a forward-looking safeguard against a *future* code change accidentally weakening the guarantee, not a change to today's actual risk.
- *Evidence quality:* Same as Option 1.
- *Implementation complexity:* Marginally higher than Option 1 (one additional join/filter condition); still low.
- *AI cost:* None.
- *Scalability:* High.
- *Historical-data implications:* None.
- *Competitive-intelligence risk:* Same as Option 1 — not addressed.

**Option 3 — Reuse only `OBSERVED` rows, AND require a deterministic, non-AI check that the `value` text's key terms substantially overlap with its own cited quote** (closing the Case-2-style gap with a cheap heuristic — e.g., a minimum shared-word/phrase threshold between `value` and `evidence[].quote` — rather than a new LLM call).
- *Privacy risk:* Lower than Options 1/2 — directly narrows (does not fully eliminate) the "unverified qualifier riding on a real quote" gap identified in §8 Case 2.
- *Evidence quality:* Improved over Options 1/2, though a word-overlap heuristic is a blunt instrument — it would not catch every form of overreach (e.g., "primarily" added to an otherwise overlapping sentence might still pass a naive overlap check), and could also reject some genuinely faithful paraphrases that happen to use different wording.
- *Implementation complexity:* Medium — new, deterministic (non-AI) comparison logic, applied either at read time or at persistence time; no new external dependency.
- *AI cost:* None — this is explicitly a deterministic check, not a new model call, consistent with the instruction to prefer existing mechanisms and avoid over-engineering.
- *Scalability:* High — a deterministic string/token comparison is cheap.
- *Historical-data implications:* Could be applied retroactively (a read-time filter) to existing rows without reprocessing, OR could require a one-time batch pass to tag historical rows — this is a genuine design choice this document does not resolve.
- *Competitive-intelligence risk:* Not addressed — this option is purely about accuracy, not about the separate concern in §9.

**Option 4 — Do not reuse any LLM-generated `companySummary`/`businessModel` value for cross-freelancer purposes, regardless of classification; only separately-captured, non-AI, deterministic producers (mirroring the existing `GOOGLE_PLACES_STATUS`/`PUBLIC_INTENT` precedent) ever become global evidence for Category 1-4 purposes.**
- *Privacy risk:* Lowest — eliminates both the accuracy gap (§8) and the competitive-intelligence gap (§9) entirely, by not reusing this content at all.
- *Evidence quality:* N/A — nothing of this kind is reused.
- *Implementation complexity:* Lowest of all four for this specific question (no filter, no heuristic needed) — though it forecloses any benefit from ever sharing this content, which is itself a product cost, not an engineering one.
- *AI cost:* None.
- *Scalability:* High.
- *Historical-data implications:* None — no existing row needs any treatment.
- *Competitive-intelligence risk:* Eliminated for this content, by construction.

## 11. Analyst Recommendation

**Recommended: Option 3**, as the option that best satisfies the priority order given (preventing false claims; preventing freelancer-specific intelligence leakage; preserving provenance; minimal engineering complexity; D23 compatibility; avoiding unnecessary AI calls; avoiding retroactive processing) — with explicit qualifications:

- It directly targets the one concrete, repository-confirmed gap this audit found (§8 Case 2's "unverified qualifier on a real quote"), using a deterministic, non-AI mechanism — consistent with the instruction not to reach for a new LLM call, human review, or scoring model unless the evidence demonstrates necessity. The evidence here (Case 2) does demonstrate a real, specific gap, but one a cheap deterministic heuristic can at least partially address — it does not demonstrate a need for a full new AI pipeline.
- It is D23-compatible as specified in §7 — it adds a Q5-specific reuse safeguard on top of D23's existing, unmodified test, rather than attempting to redefine what D23 itself requires.
- It does **not** resolve the competitive-intelligence concern (§9) — that is a separate, not purely-technical question this recommendation explicitly does not claim to close, and if the Product Owner weighs that concern heavily, **Option 4 is the more defensible choice**, not Option 3. This recommendation is scoped strictly to the evidence-sufficiency question Q5-A asks (§12) and does not substitute for the Product Owner's own weighing of the competitive-intelligence trade-off, which was already surfaced, unresolved, in the prior Q5 audit.
- Option 1/2 are not recommended as the primary answer because they leave the one concretely-demonstrated gap (Case 2) completely open, even though they correctly reuse the existing hard-gate guarantee for everything else.

This recommendation is kept separate from, and does not substitute for, the Product Owner's actual decision in §13.

## 12. Historical Data Impact

For every option, under every option, the following holds unless a separate, explicit PO authorization changes it:

- No existing `companySummary`/`businessModel` row is deleted, reclassified, or modified by any option described here.
- **Option 1 / Option 2:** No backfill needed — the filter (classification, or classification + evidence presence) is already determinable from existing columns on every historical row.
- **Option 3:** Two sub-choices exist, neither decided here: (a) apply the word-overlap check at read time, against existing rows, with no stored change (no backfill); or (b) run the check once in a batch pass and store its result as a new flag/column. This document does not recommend between (a) and (b) — it is flagged as a decision for whoever implements Option 3, should the PO select it.
- **Option 4:** No historical row is affected at all — these fields simply never enter any reuse path, so there is nothing to backfill, reprocess, or reclassify.
- **No automatic backfill, retroactive public release, reprocessing, or deletion is recommended or authorized by this document under any option.**

## 13. Final PO Questionnaire

### Q5-A — Evidence Sufficiency

> "What minimum evidence must an LLM-generated `companySummary` or `businessModel` value have before it may be reused across freelancers?"

| Option | Requirement | Note |
|---|---|---|
| 1 | `classification = 'OBSERVED'` (which already guarantees a hard-verified, real, correctly-sourced quote exists, per §3/§4) | Fastest; leaves the Case-2-style "unverified qualifier on a real quote" risk fully open |
| 2 | Same as 1, plus a defensive re-check that evidence is actually present at read time | Forward-looking safeguard only; no different from Option 1 against today's actual data |
| 3 | Same as 1, plus a deterministic (non-AI) check that the `value` text's content substantially overlaps with its own cited quote | Narrows (does not eliminate) the accuracy gap; does not address the separate competitive-intelligence concern |
| 4 | Never reuse LLM-generated `companySummary`/`businessModel` for cross-freelancer purposes at all | Eliminates both the accuracy gap and the competitive-intelligence concern, at the cost of never sharing this content |

### Q5-B — Treatment of Existing Historical Values

> "What should happen to existing `companySummary`/`businessModel` values that do not meet the selected evidence standard?"

| Option | Treatment |
|---|---|
| i | Leave them exactly as they are, private, permanently — they simply never qualify for reuse under the selected standard |
| ii | Leave them private for now, with a note that a future, separate PO decision may authorize a one-time re-evaluation pass |
| iii | Flag them for one-time reprocessing under the newly-selected standard (e.g., re-running the word-overlap check once, if Q5-A selects Option 3) — explicitly requires its own separate authorization before any such reprocessing occurs |

### Product Owner Decision

Q5-A selected option: ______

Q5-B selected option: ______

## 14. Implementation Impact

| | Option 1 | Option 2 | Option 3 | Option 4 |
|---|---|---|---|---|
| Schema changes | None | None | Possibly a new flag/column if Q5-B's (iii) batch-tagging approach is chosen; otherwise none | None |
| Prompt changes | None | None | None | None |
| Producer changes | None | None | None | None — these fields simply stop being candidates for the (not-yet-built) reuse read path |
| Provenance changes | None | None | None required for a read-time check; a stored flag if batch-tagged | None |
| Cache changes | None | None | None | None |
| Read-path changes | Filter on `classification` | Filter on `classification` + evidence presence | Filter on `classification` + new overlap check | Exclude these two fields from the reuse read path entirely |
| UI changes | None required | None required | None required | None required |
| Migration/backfill implications | None | None | Open design choice (§12), not resolved here | None |
| Testing implications | Low — assert the filter excludes INFERRED rows | Low — same, plus assert defensive re-check behaves correctly if evidence is ever unexpectedly empty | Medium — needs test cases exercising both a faithful paraphrase (should pass) and an overreaching one like Case 2 (should fail), plus tuning the overlap threshold | Low — assert these two fields never appear in the reuse read path's output |

## 15. Final Status

**READ-ONLY AUDIT ONLY.**
**NO PO DECISION MADE. NO CODE CHANGED. NO SCHEMA CHANGED. NO DATABASE CHANGED. NO MIGRATION CREATED. NO COMMIT. NO PUSH.**

OQ-6, D9, D11, D22, D23, and every other named governance record remain exactly as previously decided. Nothing in this document alters, reinterprets, or supersedes any of them — §7 explicitly frames its finding as an observation about D23's existing scope, not a proposed change to it.
