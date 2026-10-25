# Client Finder — Deterministic Opportunity Layer — PO Decision Questionnaire

**Status: PO QUESTIONNAIRE ONLY — IMPLEMENTATION NOT AUTHORIZED.**

> **Governance clarification (2026-10-11) — product scope vs. signal scope.** [`CF-SERVICE-CATALOG-PO-DEC-001`](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) decided that Client Finder is a **general freelancer client-discovery system** spanning 17 top-level service families, **not a website-lead finder**. Everything in this questionnaire — including the "website-observable signals" scoping already decided in `Q3` and item #3 below — was and remains scoped to the website-observable deterministic signal set, which in practice corresponds most directly to the "Web & Software Development" service family. That scoping is **unchanged and still in force**; it is not reinterpreted, widened, or narrowed by the new product-wide decision. Service-specific deterministic signals for the other 16 service families (Video & Reels, Digital Marketing, Branding, etc.) are **future governance/engineering work** — none exist, and none are authorized, today. Every item below remains exactly as open or decided as it was before `CF-SERVICE-CATALOG-PO-DEC-001`.
>
> **Governance clarification (2026-10-11) — single service per search.** [`CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`](CLIENT_FINDER_SINGLE_SERVICE_PER_SEARCH_PO_DECISION.md) decided that each Client Finder search is scoped to exactly one top-level service, which is the authoritative context for that search; a freelancer wanting another service runs another search. This **resolves, within a single search, the multi-service opportunity-representation question and the combined multi-service ranking/escalation question** that a prior governance review had surfaced as emerging from `CF-SERVICE-CATALOG-PO-DEC-001`'s multi-service-selection permission — both are now moot for a single search's scope, since no search ever has more than one service context. It does **not** resolve item 11 below (per-search vs. global evaluation reuse across *different* searches/owners), does not define any service-specific signal, and does not authorize implementation. See item 11's note below for the one point it touches.
>
> **Governance clarification (2026-10-11) — deterministic-first scoring architecture (item #4), principle only.** [`CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_4_DETERMINISTIC_FIRST_SCORING_ARCHITECTURE_PO_DECISION.md`](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_4_DETERMINISTIC_FIRST_SCORING_ARCHITECTURE_PO_DECISION.md) decided, at the principle level only, that Client Finder's opportunity architecture is deterministic-first (discovery → deterministic elimination → deterministic ranking → selective AI escalation), that the deterministic elimination/ranking stages must not use an LLM/AI call, and that this is intended to be reusable, with service-specific variation, across the 17-family service catalogue. It does **not** select Design A/B/C, any weight, threshold, ranking formula, Top-N value, AI-escalation threshold, cost ceiling, or provider/model (items #5–#8, #10 remain fully open), and does **not** authorize implementation. See item 4's own note below.
>
> **Governance clarification (2026-10-11) — items #5, #7, #8, #10 decided at principle level; one new elimination decision; consolidated architecture.** A further PO decision session recorded five more principle-level decisions, none of which select any numeric value or authorize implementation:
> - [Item #5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_5_SIGNAL_WEIGHTING_PO_DECISION.md) — deterministic signal weighting is **service-specific** within one common architecture; exact weights/formula remain open.
> - [`CF-DETERMINISTIC-ELIMINATION-PO-DEC-001`](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_EVIDENCE_BASED_ELIMINATION_PO_DECISION.md) — elimination must be **evidence-based**, not score-based; weak/missing/ambiguous evidence must not eliminate a candidate; this record also **decides item #2's previously-open sub-question 2b** (persistent-unreachable candidates are preserved, not auto-eliminated). **Numbering note:** this was called "Item #6" in the PO's own session, but it does **not** correspond to, and does not resolve, this questionnaire's own item #6 (category-specific thresholds), which remains fully open — see that record's own disambiguation section.
> - [Item #7](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_7_HYBRID_RANKING_PO_DECISION.md) — ranking is a **hybrid**: weighted score primary, supplemented by confidence/freshness safeguards and tie-breaking; exact formula remains open.
> - [Item #8](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_PO_DECISION.md) — AI escalation is **hybrid + adaptive/budgeted** ("Option E"): `DISCOVERY → CACHE/REUSE CHECK → DETERMINISTIC ELIMINATION → DETERMINISTIC RANKING → STRONG-SIGNAL BYPASS → TOP-N/THRESHOLD FRONTIER → ADAPTIVE + BUDGETED AI ESCALATION → AI RESEARCH/QUALIFICATION → STOP WHEN NOT JUSTIFIED`. This is an architectural/governance description only, not an implementation authorization. All numeric values (N, threshold, budget, TTL) and the adaptive formula remain open.
> - [Item #10](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_10_AI_FRONTIER_FORMATION_PO_DECISION.md) — the AI-escalation frontier for normal candidates is a **hybrid Top-N AND threshold** (both required, not either alone), subject to item #9's bypass; N/threshold/budget values remain open.
> - The same session also added a **cache-first principle** addendum to [`CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) (item #11): check for fresh, applicable cached evidence before any new AI call. Cross-freelancer sharing remains explicitly NOT authorized. No freshness/TTL value is decided.

This questionnaire is derived from `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ENGINEERING_PROPOSAL.md`. It contains no new engineering content, no code/config/data changes, and no chosen answers. Each item below is classified:

- **A — PO decision required**: a product-semantics or policy choice with no existing authorization at the concrete level needed to implement.
- **B — Engineering decision**: implementation mechanics that do not change product behavior/semantics; can be decided by engineering without PO sign-off.
- **C — Already decided**: covered by an existing PO decision (`CF-DISCOVERY-ARCH-001`, `CF-DISCOVERY-ARCH-002` Q1–Q6/S5/S6); listed for traceability, not re-litigated.

No option is chosen anywhere in this document.

---

## 1. Concrete definition of "confirmed no website"

**Classification: A — PO decision required.**

1. **Decision/question:** Is "Places API returned no `websiteUri` field" sufficient, by itself, to label a candidate's state as `WEBSITE_ABSENT_CONFIRMED` (a positive opportunity signal per `Q1`), or must that label be withheld/weakened (e.g. "reported absent, unverified") given that Places itself can be wrong or stale about whether a business has a site?

2. **Why it matters:** This is the trigger for the single highest-priority signal in the whole layer — `Q1` already requires that absence-of-evidence not be treated as proof, and the proposal's own evidence table flags that a single third-party API field is not independent confirmation. Whatever counts as "confirmed" here determines how many candidates enter the pipeline as positive-signal opportunities versus how many sit in a weaker, unverified bucket.

3. **Engineering options exactly as proposed** (Proposal §2, §3, state A): only one mechanism was proposed — a single evidence source (`candidate.website == null` from the Places response). No second corroborating source was proposed (investigation of a possible future source is `Q4`, and is explicitly investigation-only, not production-ready).

4. **Advantages/disadvantages:**
   - Treating it as sufficient ("confirmed" as labeled): simplest, zero marginal cost, no additional lookups; risk is that "confirmed" overstates certainty the system doesn't actually have.
   - Treating it as weaker/unconfirmed until further corroboration: more honest about certainty, but there is currently no second source to corroborate against (one is only under investigation per `Q4`), so this option has no concrete implementation path today — it would functionally mean carrying every no-website candidate as permanently "unconfirmed."

5. **Already authorized:** `Q1` — no website must not be treated as proof of absence, and the state must be preserved as distinct and positive. `CF-DISCOVERY-ARCH-001` places this filtering at the deterministic stage.

6. **What remains undecided:** the exact label/semantics and confidence level assigned to this state, and whether the system should represent it as `CONFIRMED` versus some lower-confidence equivalent given the single-source caveat.

7. **What would change in implementation depending on the answer:** the naming/semantics of this state as stored in `research_signals` (or an equivalent record), whether it carries a confidence qualifier, and potentially whether downstream ranking/escalation treats it with full or partial weight (ties to items 4–10 below).

---

## 2. Exact treatment of temporary vs. persistent website failures

**Classification: Mixed — mechanics are largely B/C (per `Q2`); the product-level consequence of a "persistent unreachable" determination is A. STATUS (sub-question 2b): DECIDED.** See [`CF-DETERMINISTIC-ELIMINATION-PO-DEC-001`](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_EVIDENCE_BASED_ELIMINATION_PO_DECISION.md) — `WEBSITE_PERSISTENT_UNREACHABLE` candidates are preserved as potential opportunities, not automatically eliminated. The check-count/time-window mechanics remain engineering-owned per `Q2`.

1. **Decision/question:** Two separable questions: (a) which mechanism determines when repeated failures become "persistent" (Proposal §4, Alternatives 1–3), and (b) once a candidate is determined `WEBSITE_PERSISTENT_UNREACHABLE`, is it eliminated from the opportunity pipeline, or preserved and ranked/escalated as a still-valid lead (a business that exists but whose website is broken is arguably still a sales opportunity)?

2. **Why it matters:** (a) affects how quickly and how reliably the system can tell a blip from a dead site. (b) affects whether a meaningful class of real businesses — those with a broken or abandoned website — are silently dropped or correctly treated as leads, which is a direct product-value question, not a mechanics question.

3. **Engineering options exactly as proposed:**
   - For (a) — Proposal §4: **Alt 1** fixed schedule (e.g. 3 checks over ~36–48h); **Alt 2** rolling window (K-of-N failures over T hours); **Alt 3** single check + one fixed-delay confirmation (~24h).
   - For (b) — Proposal §2 signal table for `WEBSITE_PERSISTENT_UNREACHABLE`: flagged as "candidate for elimination (with care)" **or** "possibly" still escalated, explicitly left open.

4. **Advantages/disadvantages:**
   - Alt 1: moderate robustness to flakiness, moderate latency to a decision.
   - Alt 2: highest robustness to flakiness (tolerates an isolated recovery), typically longer/variable time-to-decision.
   - Alt 3: fastest decision, lowest robustness (one lucky recovery resets all evidence).
   - Eliminating persistent-unreachable candidates: keeps the pipeline focused on currently-evaluable sites, but risks discarding genuinely good leads (broken site = unmet need).
   - Preserving them as opportunities: aligns with the spirit of `Q1` (absence/failure of web presence is not proof of no opportunity) and could be a strong signal in itself, but means the deterministic layer cannot run its website-content-based checks (mobile/SEO/technical/contact) against that candidate at all.

5. **Already authorized:** `Q2` — repeated checks are required before declaring persistence; **the exact check count and time window are already explicitly assigned to engineering**, not PO. `Q1` strongly implies (by analogy — "no website" is explicitly a positive signal) that outright elimination of a website-having-but-unreachable business deserves PO scrutiny, but `Q1` does not literally cover this case.

6. **What remains undecided:** whether `WEBSITE_PERSISTENT_UNREACHABLE` eliminates or preserves-as-opportunity the candidate (this is the actual open PO question); the choice among Alt 1/2/3 is engineering per `Q2`'s existing delegation, though the PO may still want visibility into the resulting time-to-decision since it affects how fast a lead becomes actionable.

7. **What would change in implementation:** if preserved, the opportunity-creation path (`core-opportunity/src/service.ts`) needs a path for candidates with no evaluable homepage content at all, bypassing every content-based signal in §2; if eliminated, no such path is needed and `normalize.ts`-equivalent discard logic simply runs later (after the persistence check) instead of immediately.

---

## 3. Deterministic signal set (final list)

**Classification: A — PO decision required.**

> **Governance clarification:** this item's signal set is, and remains, scoped to **website-observable signals** per `Q3` — that scoping is unchanged. Per `CF-SERVICE-CATALOG-PO-DEC-001`, that scope corresponds to the "Web & Software Development" service family within Client Finder's broader 17-family catalogue; it is not a claim that Client Finder itself is limited to website-related services. Deterministic signals for the other 16 service families are not addressed by this item and remain undecided future work.

1. **Decision/question:** Which of the objective, decomposed signals proposed in Proposal §2 (website presence, security, mobile, performance, technical quality, SEO, contact/conversion) are actually included in the live signal set used for elimination/ranking/escalation?

2. **Why it matters:** The signal set is the entire evidentiary basis for every downstream decision (elimination, ranking, escalation). Including or excluding a category changes what kinds of businesses look like opportunities, and `Q5` already requires that every signal here be objectively testable before it can even be considered — but testability alone doesn't mean a signal should be adopted (e.g., a technically well-formed but commercially irrelevant signal could still be rejected).

3. **Engineering options exactly as proposed (Proposal §2):** Presence (`WEBSITE_ABSENT_CONFIRMED`, `WEBSITE_REACHABLE`, `WEBSITE_TEMPORARY_FAILURE`, `WEBSITE_PERSISTENT_UNREACHABLE`, `WEBSITE_STATUS_UNKNOWN_AMBIGUOUS`); Security (`HTTPS_ENABLED`, `CERT_VALID`/`CERT_INVALID_OR_EXPIRED`); Mobile (`VIEWPORT_META_PRESENT`, `RESPONSIVE_MEDIA_QUERY_PRESENT`); Performance (`FETCH_LATENCY_MS`, `PAGE_WEIGHT_BYTES`); Technical quality (`DOCTYPE_PRESENT`, `HTML_PARSE_ERROR_COUNT`); SEO (`TITLE_TAG_PRESENT`/`TITLE_LENGTH`, `META_DESCRIPTION_PRESENT`, `H1_COUNT`, `CANONICAL_TAG_PRESENT`); Contact/conversion (`CONTACT_LINK_PRESENT`, `PHONE_PATTERN_ON_HOMEPAGE`, `EMAIL_PATTERN_ON_HOMEPAGE`, `FORM_ELEMENT_PRESENT`).

4. **Advantages/disadvantages:** adopting the full set gives the richest evidence base but the most governance surface area (every signal needs a weight/threshold decision downstream) and, for two signals (`VIEWPORT_META_PRESENT`, `DOCTYPE_PRESENT`, and media-query/`HTML_PARSE_ERROR_COUNT`), requires an architecture change to retain raw HTML (Proposal §8) that a narrower set would avoid. Adopting a smaller subset (e.g. presence + security + contact only) reduces governance and engineering surface but discards potentially useful evidence (mobile/SEO/technical quality) that could help distinguish stronger opportunities.

5. **Already authorized:** `Q3` scopes signals to website-observable only (already excludes business-activity #24–#29); `Q5` requires every signal to be objectively decomposed (already satisfied by the proposed definitions, which is a precondition, not an adoption decision); `Q6` excludes WHOIS/RDAP; `Q4` permits investigation only of the public-intent source (signal #30), not adoption.

6. **What remains undecided:** the actual adopted subset of the proposed signals; whether any signal is deferred pending the raw-HTML architecture change; whether additional signals beyond what's proposed should be requested.

7. **What would change in implementation:** the scope of the new deterministic-checks module, whether `sourceDocumentProvider.ts` needs the raw-HTML retention change at all (only needed if any of the mobile/technical signals requiring raw HTML are adopted), and the size of the governance table in items 5–6 below (fewer adopted signals → fewer weights/thresholds to decide).

---

## 4. Scoring architecture — Design A / B / C

**Classification: A — PO decision required. STATUS: PRINCIPLE DECIDED (concrete scoring mechanism still open).** See `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_4_DETERMINISTIC_FIRST_SCORING_ARCHITECTURE_PO_DECISION.md` — the PO authorized, at the principle level, a deterministic-first architecture (discovery → deterministic elimination → deterministic ranking → selective AI escalation), that the deterministic elimination/ranking stages must not use an LLM/AI call, and that this is intended to be reusable (with service-specific variation) across the Client Finder service catalogue. That decision explicitly does **not** select which of Design A/B/C below is adopted, nor any weight, threshold, ranking formula, Top-N value, AI-escalation threshold, cost ceiling, or provider/model — all of that remains open below and requires a separate, concrete engineering proposal and governance review before implementation.

1. **Decision/question:** Which of the three proposed scoring architectures governs how signals combine into an elimination/ranking outcome?

2. **Why it matters:** This is the structural core of the entire layer — it determines whether the system produces one opaque number, a per-category explainable profile, or a two-stage gate-then-rank pipeline, each with different false-positive risk and governance cost.

3. **Engineering options exactly as proposed (Proposal §5):**
   - **Design A — simple weighted score:** one number, `score = Σ(signal_i.points × present_i)`, compared to one threshold.
   - **Design B — category-specific thresholds:** each category evaluated independently to its own pass/fail bar; output is a per-category vector, not one number.
   - **Design C — two-stage:** a binary elimination gate, then a ranking function (which could itself borrow Design A's or B's math) applied only to survivors.

4. **Advantages/disadvantages:**
   - A: simplest, has a direct precedent in this codebase (`core-acquisition/prospectScore.ts`'s seven-factor model); but a single number obscures *why* a candidate scored well, and several weak signals can sum past a threshold with no single load-bearing problem.
   - B: matches `S5` most directly (different thresholds per category already explicitly permitted); most explainable; but a multi-dimensional output still needs its own aggregation rule to produce one escalation queue, and needs a threshold decision per category instead of one set of weights.
   - C: matches `S6` most directly (stage may both eliminate and rank, as two distinct steps); limits the blast radius of an aggressive composite score to ranking only, not elimination; aligns with the existing code split between `createOpportunityForOwner` and `scoreOpportunityForOwner`; but needs two sets of decisions (gate criteria *and* ranking formula) instead of one, and more implementation surface.

5. **Already authorized:** `S5` — different signal categories may have different thresholds (consistent with B, and with C's second stage if it uses B's math); no numeric values of any kind are approved. `S6` — the deterministic stage may both eliminate and rank (consistent specifically with C's two-step structure, though A/B could still technically serve both roles within one number/vector).

6. **What remains undecided:** which architecture is adopted; if C, whether its ranking stage reuses A's or B's math.

7. **What would change in implementation:** the shape of the scoring module's output type (single score vs. vector vs. gate+score), where in `core-opportunity/src/service.ts` the check is inserted (before `createOpportunityForOwner` only, for C's gate; or wrapped around both creation and scoring, for A/B), and what data needs to be persisted per candidate for audit (one number, a vector, or both a gate result and a score).

---

## 5. Signal weights (if applicable)

**Classification: A — PO decision required (conditional on Design A or C-with-A-style-ranking being chosen in item 4). STATUS: PRINCIPLE DECIDED (service-specific weighting), exact weights/formula still open.** See [`CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_5_SIGNAL_WEIGHTING_PO_DECISION.md`](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_5_SIGNAL_WEIGHTING_PO_DECISION.md) — weighting may differ by top-level service because commercial relevance differs by service; signal strength/confidence is distinct from service-specific weight. No numeric weight or formula is decided.

1. **Decision/question:** If a weighted-sum design (A, or C's ranking stage using A's math) is adopted, what numeric point value does each adopted signal (item 3) carry?

2. **Why it matters:** Weights directly determine which businesses rank as opportunities. A miscalibrated weight (e.g. over-weighting a cosmetic SEO signal relative to website-absence) could systematically misrank genuinely strong leads.

3. **Engineering options exactly as proposed:** none — Proposal §5 explicitly states "no numerical scores, weights, or thresholds have been approved" and proposes only the formula shape, not values. The existing `core-acquisition/prospectScore.ts` seven-factor model (weights summing to 100) is cited only as a structural precedent, not as a proposed value set for this layer.

4. **Advantages/disadvantages:** not applicable — no concrete values exist to compare; this item exists purely to flag that *if* a weighted design is chosen, values must still be separately authorized before implementation.

5. **Already authorized:** `S5` explicitly withholds numeric weights/thresholds. Nothing authorizes any value.

6. **What remains undecided:** every weight value, for every adopted signal — in full.

7. **What would change in implementation:** direct — the constants table inside the scoring module; no structural code change, since the shape of "a weight per signal" is already implied by Design A/C regardless of the actual numbers.

---

## 6. Category-specific thresholds

**Classification: A — PO decision required for the numeric values; the structural permission to use category-specific thresholds at all is already C (decided). STATUS: fully OPEN — not decided.**

> **Disambiguation note (2026-10-11):** a separate 2026-10-11 PO decision ([`CF-DETERMINISTIC-ELIMINATION-PO-DEC-001`](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_EVIDENCE_BASED_ELIMINATION_PO_DECISION.md)) was labeled "Item #6" in the PO's own session numbering. That record is about **evidence-based elimination**, not category-specific thresholds, and does **not** resolve this item. This item (category-specific threshold values) remains exactly as open as before.

1. **Decision/question:** For Design B (or C's elimination gate, if it is organized per-category), what is the pass/fail bar for each signal category (presence, security, mobile, performance, technical, SEO, contact)?

2. **Why it matters:** Each category's bar determines, independently, whether a candidate is treated as viable in that dimension; too strict a bar in any one category could systematically eliminate candidates that are otherwise strong leads.

3. **Engineering options exactly as proposed:** none with concrete values — Proposal §5 proposes the *structure* (independent per-category bars) but, consistent with `S5`, proposes no numbers.

4. **Advantages/disadvantages:** not applicable at this stage — no values exist yet to weigh against each other.

5. **Already authorized:** `S5` — "different signal categories may have different thresholds" is already decided as *permissible*. No specific threshold value is authorized.

6. **What remains undecided:** every per-category threshold value, and whether all seven proposed categories even need independent thresholds or only a subset (ties to item 3).

7. **What would change in implementation:** the category-threshold constants table and the per-category evaluation logic inside the scoring module (only relevant if Design B or a category-organized version of Design C's gate is chosen in item 4).

---

## 7. Candidate ranking mechanism

**Classification: A — PO decision required. STATUS: PRINCIPLE DECIDED (hybrid ranking), exact formula still open.** See [`CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_7_HYBRID_RANKING_PO_DECISION.md`](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_7_HYBRID_RANKING_PO_DECISION.md) — weighted score is the primary ranking signal, supplemented by confidence/freshness safeguards and tie-breaking rules; no LLM required. Design A/B/C (item 4), exact formula, normalization, confidence/freshness rules, and tie-breakers remain open.

1. **Decision/question:** Once candidates survive elimination (or in a design without a separate elimination step), what function orders them for AI escalation priority?

2. **Why it matters:** The ranking order directly determines which candidates are researched/qualified by AI first (and, under a capped escalation rule, which are researched at all) — this is the mechanism that actually realizes any LLM-call savings.

3. **Engineering options exactly as proposed (Proposal §5, §6):** the ranking function itself follows from whichever scoring architecture (item 4) is chosen — Design A's weighted sum, Design B's category vector (requiring its own aggregation rule to become a single ordering), or Design C's dedicated post-gate ranking step.

4. **Advantages/disadvantages:** see item 4's advantages/disadvantages — they carry through directly, since ranking is not an independent mechanism but a consequence of the scoring architecture choice.

5. **Already authorized:** `S6` — the deterministic stage may rank remaining candidates for AI escalation; the concrete mechanism is explicitly unapproved.

6. **What remains undecided:** the actual ranking function, which cannot be fixed independently of item 4's answer.

7. **What would change in implementation:** `core-opportunity/src/service.ts`'s existing `rankOpportunities`/comparator pattern would need a new, earlier-stage input (today it only sorts already-persisted opportunity scores); depending on the architecture, this could reuse that existing sort pattern or need a new one for pre-opportunity candidates.

---

## 8. AI escalation mechanism

**Classification: A — PO decision required. STATUS: PRINCIPLE DECIDED (Hybrid + Adaptive/Budgeted, "Option E"), concrete mechanism and all numeric values still open.** See [`CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_PO_DECISION.md`](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_PO_DECISION.md) — AI is not run for every candidate; cache/reuse is checked first; deterministic elimination/ranking/bypass precede escalation; escalation combines candidate-selection controls with adaptive/budget controls and should stop when further AI work is not justified. Top-N, threshold, budget, adaptive formula, cache TTL, provider/model, cross-freelancer sharing, and call-combination strategy all remain open (see item #10 for the frontier-formation sub-decision).

1. **Decision/question:** What rule actually decides which ranked candidates proceed to the two existing LLM calls (`researcher.ts`'s `researchLead()` and `targetCustomerMatch.ts`)?

2. **Why it matters:** This is the mechanism that converts deterministic filtering into real LLM-call savings; it is also the point where a badly chosen rule could silently drop good candidates (false negative on recall) or fail to control cost (if too permissive).

3. **Engineering options exactly as proposed (Proposal §6):** score threshold; Top-N per search; score threshold + Top-N cap (hybrid); strong-signal immediate escalation; category-specific escalation rules.

4. **Advantages/disadvantages:**
   - Score threshold: unpredictable aggregate cost (depends how many candidates clear the bar); quality tied directly to threshold choice.
   - Top-N per search: deterministic cost ceiling; can miss strong candidates in a crowded search or waste calls in a sparse one.
   - Threshold + Top-N cap: balances a quality floor with a cost ceiling; needs two decisions instead of one.
   - Strong-signal immediate escalation: protects specific PO-flagged signal types from being buried by a generic rule; unbounded cost unless combined with a cap elsewhere.
   - Category-specific escalation: richest and most targeted; hardest to govern, ties directly to Design B.

5. **Already authorized:** none of these mechanisms are addressed by any existing PO decision; `CF-DISCOVERY-ARCH-001` authorizes that a "selective AI" stage exists, not how selection works.

6. **What remains undecided:** the entire mechanism — this is a fully open decision.

7. **What would change in implementation:** `apps/worker/src/searchWorker/worker.ts`'s per-prospect loop (`worker.ts:400-432`), which today calls `researchProspectForOwner` unconditionally for every normalized candidate, would need a conditional gate inserted before that call — the exact shape of the gate depends entirely on which mechanism is chosen.

---

## 9. Whether a strong signal may bypass normal ranking

**Classification: A — PO decision required. STATUS: PRINCIPLE DECIDED (concrete mechanism still open).** See `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md` — the PO authorized the *principle* that a sufficiently strong, sufficiently reliable deterministic signal may trigger AI escalation without first satisfying the general ranking threshold, in order to preserve the practical meaning of `Q1`. That decision explicitly does **not** yet define which signal(s) qualify as "strong" (including whether `WEBSITE_ABSENT_CONFIRMED` itself qualifies), any confidence threshold, any numeric score/weight, or how many candidates may use the bypass — all of that remains open below and requires a separate, concrete engineering proposal and governance review before implementation.

1. **Decision/question:** Should a specific signal (most notably `WEBSITE_ABSENT_CONFIRMED`, item 1) be allowed to escalate a candidate to AI research/qualification regardless of where it would otherwise fall in the ranking/threshold order?

2. **Why it matters:** `Q1` already establishes that no-website is a positive signal that must not be discarded — but it does not say that signal must *always* reach AI review irrespective of everything else. Without an explicit bypass rule, a confirmed-no-website candidate could still be ranked low (e.g. by a weighted score that penalizes it on unrelated categories it cannot even be evaluated against, since it has no content to check) and never escalate in practice, which would quietly undermine the intent of `Q1` even though no rule technically "discarded" it.

3. **Engineering options exactly as proposed (Proposal §6, §10):** a bypass/"strong-signal immediate escalation" mechanism was proposed as part of the recommended design, specifically to protect `Q1`-flagged candidates from this exact outcome; the alternative (no bypass — strong signals are just one more input to the normal ranking function) was not separately spelled out as its own option but is the implicit default if this item is answered "no."

4. **Advantages/disadvantages:** a bypass guarantees `Q1`'s intent is honored in practice, not just in theory, but is unbounded in cost unless paired with a cap elsewhere (item 10) and raises the question of which other signals, if any, should carry the same bypass privilege. No bypass keeps the escalation mechanism simpler and uniform, but risks the exact "silently buried" outcome described above.

5. **Already authorized:** `Q1` decided the *signal* must be preserved and positive; it did not decide that the signal must guarantee escalation. This is a genuine gap between an existing decision's intent and a new mechanism needed to realize it in practice.

6. **What remains undecided:** whether any bypass exists at all, and if so, which signal(s) qualify for it.

7. **What would change in implementation:** the escalation gate (item 8) would need a pre-check for bypass-qualifying signals, evaluated before the normal ranking/threshold logic, rather than a single uniform rule.

---

## 10. Top-N vs. score threshold vs. hybrid escalation

**Classification: A — PO decision required. (This is the same decision as item 8, restated at the specific three-way choice the task calls out; kept separate here for traceability to the prioritized list.) STATUS: PRINCIPLE DECIDED (hybrid, AND-combined), numeric values still open.** See [`CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_10_AI_FRONTIER_FORMATION_PO_DECISION.md`](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_10_AI_FRONTIER_FORMATION_PO_DECISION.md) — a normal candidate must satisfy both a minimum deterministic quality threshold AND fall within a bounded Top-N, subject to item #9's strong-signal bypass. N, threshold, budget, whether bypass candidates count toward N/budget, adaptive stopping criteria, and service-specific policies remain open.

1. **Decision/question:** Among the threshold-based mechanisms specifically, is escalation governed by a score threshold alone, a fixed Top-N per search alone, or a hybrid of both?

2. **Why it matters:** This is the dimension that most directly trades off cost predictability (Top-N gives a hard ceiling) against adaptive quality (a threshold scales with how many good candidates actually exist in a given search).

3. **Engineering options exactly as proposed (Proposal §6):** score threshold; Top-N per search; score threshold + Top-N cap (hybrid).

4. **Advantages/disadvantages:** as in item 8 — threshold alone has unpredictable aggregate cost; Top-N alone has a hard cost ceiling but can over- or under-escalate depending on how a given search's candidate pool is distributed; the hybrid bounds cost while preserving a quality floor, at the cost of needing two numbers (a threshold value and an N) instead of one.

5. **Already authorized:** none — open, as in item 8.

6. **What remains undecided:** the choice itself, and if threshold and/or N are involved, their numeric values (which would be a further, separate decision once the mechanism is chosen).

7. **What would change in implementation:** same insertion point as item 8; a pure Top-N design requires the full candidate set for a search to be ranked before any escalation decision is made (i.e., cannot escalate incrementally as candidates are discovered), while a pure threshold design could, in principle, escalate as soon as each candidate's score is known.

---

## 11. Whether deterministic filtering happens per search or globally

**Classification: A — PO decision required. PARTIALLY DECIDED (same-owner slice only).**

> **Governance note (2026-10-11):** `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001` establishes that every search has exactly one service context, which removes any *within-one-search* multi-service nesting concern for this item. It does **not** resolve the question below — whether evaluation evidence for the same business is reused *across different searches* (by the same owner, by different owners, or, now, potentially across different single-service searches for the same business) remains exactly as open as before.
>
> **Governance note (2026-10-11) — same-freelancer evidence reuse decided.** [`CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) decides the **same-owner** slice of this item: **YES**, a freelancer may reuse their own previously collected factual evidence about a business across their own different searches/selected services, provided it is still applicable and fresh. Service-specific opportunity evaluation (the derived score/rank/opportunity conclusion) remains separate per search/service and is never satisfied by reusing another service's evaluation result. That decision explicitly does **not** resolve the cross-owner/global slice of this item (reuse across *different* freelancers' searches), which remains exactly as open as before and is named a separate future governance question. Exact freshness/TTL values, caching implementation, and evidence storage architecture are also explicitly not decided by that record and remain open (see items #12, #13 below).
>
> **Governance note (2026-10-11) — cache-first principle added.** The same record now also carries a cache-first architectural principle (added as an addendum): before a new AI call, the system should check for sufficiently fresh, applicable cached evidence and avoid unnecessary repeat AI research if it exists. This is a principle only — not implemented, and no freshness/TTL value, cache key, or storage mechanism is decided. Cross-freelancer sharing remains explicitly NOT authorized.

1. **Decision/question:** Is a candidate's deterministic evaluation (presence/reachability/signal checks, and any derived score or rank) computed fresh for each search that surfaces it, or computed once per unique business/domain and reused across different searches — potentially across different owners/users?

2. **Why it matters:** This is not addressed anywhere in the engineering proposal, but surfaces directly from the audit underlying it: `research_signals` today has no `user_id` column and is scoped to a Prospect, which is itself owned by a single user (`prospect_id → prospects.user_id`) — i.e., evidence is currently siloed per owner, not shared globally. If the deterministic layer evaluates per-search/per-owner only, cost savings are limited to what's achievable within one owner's searches; if it evaluates globally (one evaluation per unique domain, shared across owners), the same evidence could be reused across many users' searches for the same real-world business, multiplying the cost savings — but this also means one owner's search could be influenced by evaluation history they have no visibility into, and raises data-boundary questions this proposal did not analyze.

3. **Engineering options exactly as proposed:** not proposed as an explicit choice in the document — this questionnaire surfaces it as a gap the proposal did not resolve, derived from the existing per-owner data-ownership pattern observed in `research_signals`.

4. **Advantages/disadvantages:** per-search/per-owner evaluation preserves today's existing ownership boundary with no new design questions, at the cost of re-doing identical web checks for the same business every time a different owner's search happens to surface it. Global evaluation maximizes cost savings and consistency, but requires a new cross-owner data model and a policy decision about whether/how evidence about a third party's website can be shared across unrelated owners' accounts.

5. **Already authorized:** nothing in `CF-DISCOVERY-ARCH-001`/`002` addresses this dimension at all.

6. **What remains undecided:** the entire question — scope of evaluation, and if global, the data-sharing/ownership policy that would need to accompany it.

7. **What would change in implementation:** if per-search/owner, the new signals simply extend the existing `research_signals` (owner-scoped) pattern with no new boundary question. If global, a new, explicitly cross-owner-shared store would be needed — a materially larger architecture change than anything else in the proposal, and one with its own data-governance implications that would likely need separate review beyond this questionnaire.

---

## 12. Whether signal evidence is persisted

**Classification: Mixed — persistence of repeated-check history is effectively forced (C/B, required by `Q2`'s repeated-check mandate); persistence of the remaining signal categories as auditable evidence is A.**

1. **Decision/question:** Beyond the reachability-history signals that must be persisted for the repeated-check mechanism (item 2) to function at all, should the other proposed signal categories (security, mobile, performance, technical, SEO, contact) be persisted as auditable `research_signals`-style records, or computed at read time each cycle with no durable record?

2. **Why it matters:** Every existing signal in the system today is persisted (append-only, `research_signals`), giving a stable, explainable record of "why this candidate looked like an opportunity." Read-time-only computation is cheaper to build and avoids schema growth, but means the same site re-evaluated later (e.g. after it changes) silently produces a different, unrecorded answer, and there is no durable evidence trail to show a user (or an auditor) why a candidate was or wasn't escalated.

3. **Engineering options exactly as proposed (Proposal §8):** persist as new `research_signals` rows (possibly needing a new `kind` value, as happened historically for `PUBLIC_INTENT`/`FIRST_PARTY`); or compute at read time with no durable record, for the categories where a fetch is already happening anyway (HTTPS, latency, byte size) and no historical trend needs to be tracked.

4. **Advantages/disadvantages:** persisting preserves the existing precedent, gives explainability/audit, and is required regardless for reachability history; it also grows the schema and the volume of rows written per candidate. Read-time-only is cheaper and simpler for the categories where no historical trend matters, but breaks from the existing pattern and gives no durable explanation for a scoring/ranking outcome if the user or PO later asks "why was this ranked this way."

5. **Already authorized:** `Q2` already requires repeated-check history to exist in some persisted form (it cannot evaluate "persistent" without memory of past checks) — that part is effectively forced, not optional. Nothing authorizes a position on the remaining categories.

6. **What remains undecided:** whether the non-reachability signal categories get a durable evidentiary record or not.

7. **What would change in implementation:** persisting needs either a new `research_signals` `kind` (schema/enum change, akin to the `0029_research_signal_intent_kinds` precedent) or reuse of an existing kind; read-time-only needs no schema change but also provides nothing for any future audit or user-facing "why this lead" explanation feature.

---

## 13. Caching policy, where it materially changes product behavior

**Classification: Mixed — the policy ceiling (how stale evaluation evidence may be before it must be refreshed, and whether it may be reused across owners) is A; the cache's internal implementation is B.**

1. **Decision/question:** If item 11 allows any reuse of a prior evaluation (within one owner's searches over time, or globally), how stale can that cached evaluation be before it must be re-checked, and does that staleness window differ by signal type (e.g. reachability history has its own window per item 2; a one-time check like `DOCTYPE_PRESENT` might be treated as valid indefinitely, or might need periodic refresh since websites change)?

2. **Why it matters:** This only becomes a product question (rather than a pure performance optimization) once staleness could cause a candidate to be ranked or escalated based on evidence that no longer reflects the real website — e.g. a business that fixed its site last month still being treated as a weak opportunity because of a stale check.

3. **Engineering options exactly as proposed:** not proposed with concrete values in the document — the proposal only notes, in the context of §4's reachability alternatives, that each alternative already implies its own natural "freshness window" for that one signal; it does not address caching for the other signal categories at all.

4. **Advantages/disadvantages:** a short/no staleness tolerance (always re-check) maximizes accuracy at maximum cost; a long staleness tolerance (cache aggressively) minimizes cost but risks acting on outdated evidence; a per-signal-type policy (ties to item 3's adopted set) could tailor tolerance to how often each category of evidence actually changes in practice, at the cost of more decisions to make.

5. **Already authorized:** nothing — this is unaddressed by any existing PO decision, and only partially addressed by the proposal (for reachability only, via item 2/§4).

6. **What remains undecided:** the staleness policy, if any, for every signal category other than reachability; whether it interacts with item 11's per-search-vs-global scope decision.

7. **What would change in implementation:** purely mechanical caching (e.g. an in-process memoization within a single search run) is engineering and does not need PO input; a cache that persists across searches/time and could cause a materially stale decision to be acted on does need a PO-set ceiling before engineering implements the mechanism.

---

## 14. Batching policy, where it materially changes product behavior

**Classification: B — Engineering decision, with one flagged exception.**

1. **Decision/question:** Does batching how deterministic checks are executed (e.g. evaluating a search's candidates together rather than one at a time) change any product-visible outcome, as opposed to being a pure performance/cost optimization?

2. **Why it matters:** Deterministic checks are, by construction, order-independent and depend only on each candidate's own website — batching the underlying HTTP fetches or computations should not change *which* candidates are eliminated, ranked, or escalated, only how fast/cheaply the result is produced. The one exception: any ranking/escalation rule that needs the *whole* search's candidate set before it can decide (e.g. Top-N, item 10) already requires waiting for the full batch to be evaluated — but that is a consequence of the chosen escalation mechanism (item 8/10), not an independent "batching" decision.

3. **Engineering options exactly as proposed:** not proposed with specific batching strategies in the document; this item is included per the task's prioritized list and addressed here for completeness.

4. **Advantages/disadvantages:** not applicable at the product level under normal batching; see item 2 for the one case (Top-N) where the *escalation mechanism's* requirements, not batching itself, create a product-visible ordering dependency.

5. **Already authorized:** not addressed by any existing PO decision; not believed to need any, per the reasoning above.

6. **What remains undecided:** nothing at the PO level is believed to be open here, conditional on the answer to items 8/10 (if a progressive/incremental escalation rule were ever desired — allowing users to see early results before a whole search's batch completes — that would become a genuine product/UX decision, but it is outside anything proposed in the engineering document and is flagged here only for completeness, not raised as an active question).

7. **What would change in implementation:** purely an engineering concern — how the deterministic-checks module schedules and executes its HTTP fetches/computations across a search's candidate set.

---

## 15. Change required to `normalize.ts` so no-website candidates survive discovery

**Classification: Mixed — the requirement that they survive is C (already decided via `Q1`); the specific mechanics of how `normalize.ts` is restructured, and what identity key a website-less candidate uses, are B.**

1. **Decision/question:** Separately from *whether* no-website candidates must survive discovery (already decided), what should serve as the deterministic identity/dedup key for a candidate that has no domain to normalize via the existing PFR-10 domain-key logic (`normalize.ts`'s `normalizeDomain()`), given that key is currently the sole identity mechanism for every candidate that becomes a Prospect?

2. **Why it matters:** Without *some* stable identity key, a website-less business could be re-discovered and re-created as a duplicate candidate/Prospect across different searches, which would be a data-quality problem visible to the end user as duplicate leads — but this is a question with an evident technical answer (Google Places already provides a stable `place_id` per business) rather than a product-policy question.

3. **Engineering options exactly as proposed:** the proposal identifies the structural gap (`normalize.ts:43-52` currently discards any candidate with no website, which directly conflicts with `Q1`) but does not propose or select a replacement identity-key mechanism — this is flagged in the proposal (§1, §8, §9) as a required change, not a design choice with alternatives.

4. **Advantages/disadvantages:** not applicable — no alternative identity-key designs were proposed to compare; this is noted here only because the task's prioritized list calls for it to be addressed explicitly.

5. **Already authorized:** `Q1` already requires the outcome (no-website candidates preserved, not discarded) — this item is downstream mechanics of an already-decided requirement, not a new policy question.

6. **What remains undecided:** nothing at the PO level; the specific replacement identity-key mechanism (e.g. Places' `place_id`) is an engineering implementation detail of fulfilling an already-decided requirement.

7. **What would change in implementation:** `normalize.ts`'s `normalizeCandidate()` would need a second code path for `website == null` candidates that produces a Prospect-eligible record using a non-domain identity key instead of returning `null`; `service.ts`'s `skipped`-counting logic (`service.ts:113-118`) would no longer count these candidates as skipped.

---

## Summary table

| # | Item | Classification |
|---|---|---|
| 1 | Definition of "confirmed no website" | A |
| 2a | Reachability check mechanism (Alt 1/2/3, exact count/window) | B/C (per `Q2`) |
| 2b | Product treatment of confirmed-persistent-unreachable (eliminate vs. preserve) | A — **DECIDED**: preserved, not auto-eliminated (`CF-DETERMINISTIC-ELIMINATION-PO-DEC-001`) |
| 3 | Final deterministic signal set | A |
| 4 | Scoring architecture (Design A/B/C) | A — principle DECIDED (deterministic-first, no LLM for deterministic scoring), Design A/B/C choice still open |
| 5 | Signal weights | A — principle DECIDED (service-specific weighting), exact weights/formula still open (conditional on item 4's Design choice) |
| 6 | Category-specific threshold values | A (structure already C per `S5`) — fully OPEN; not resolved by the 2026-10-11 elimination decision (see disambiguation note above) |
| 7 | Candidate ranking mechanism | A — principle DECIDED (hybrid: weighted score + confidence/freshness + tie-breakers), exact formula still open |
| 8 | AI escalation mechanism | A — principle DECIDED (Hybrid + Adaptive/Budgeted, "Option E"), concrete mechanism and numeric values still open |
| 9 | Strong-signal bypass of ranking | A — principle DECIDED, mechanism still open |
| 10 | Top-N vs. threshold vs. hybrid | A — principle DECIDED (hybrid, AND-combined: threshold AND Top-N), numeric values still open |
| 11 | Per-search vs. global evaluation scope | A — same-owner slice DECIDED + cache-first principle added (`CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`); cross-owner/global slice remains OPEN |
| 12 | Signal evidence persistence (non-reachability categories) | A (reachability history itself: B/C, forced by `Q2`) |
| 13 | Caching staleness/sharing policy | A (mechanics: B) |
| 14 | Batching policy | B |
| 15 | `normalize.ts` no-website survival mechanics | B (requirement itself: C, per `Q1`) |

No option in any item above has been selected. No code, configuration, dependency, schema, or data change has been made.

**PO QUESTIONNAIRE ONLY — IMPLEMENTATION NOT AUTHORIZED.**
