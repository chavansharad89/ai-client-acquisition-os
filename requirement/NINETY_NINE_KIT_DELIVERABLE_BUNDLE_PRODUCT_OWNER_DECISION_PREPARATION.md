# ₹99 Kit — Downloadable Asset Bundle (Candidates #4–#11) — Product Owner Decision Preparation

## 1. Record metadata

| Field | Value |
|---|---|
| Type | Decision **preparation** — a questionnaire for the Product Owner to answer. Not itself a decision record. |
| Precedes | A future `DEC-013`-equivalent decision record, to be written only after the Product Owner answers this. |
| Builds on | `DEC-012` (`requirement/NINETY_NINE_KIT_DELIVERABLE_SCOPE_AMENDMENT_PRODUCT_OWNER_DECISION.md`) — already decided: ≥10 downloadable assets, web-tool out of scope for ₹99 launch, existing 3 assets retained. Not reopened here. |
| Status | Awaiting Product Owner answers in §4 (Decision B) and §6 (Decision C). Nothing below is decided. |

## 2. Baseline — assets already confirmed (not subject to this questionnaire)

| # | Title | Status |
|---|---|---|
| 1 | Prompt library: the ten highest-demand AI tasks | Existing, unchanged |
| 2 | Pricing sheet for first-time freelancers | Existing, unchanged |
| 3 | Two outreach templates that do not read as templates | Existing, unchanged |

₹499 tier baseline, for the overlap columns below (existing, unchanged, from `packages/catalog/src/deliverables.ts`):

| Title | Covers |
|---|---|
| The outreach sequence, including the follow-ups most people skip | Outreach + follow-up |
| Scope and pricing playbook for fixed-fee projects | Scope/pricing |
| Proposal template that survives a procurement review | Proposals |

## 3. Candidate assets #4–#11 — analyst detail (recommendation only, nothing decided)

### Candidate 4
1. **Title:** "Where to find your first 20 clients" — prospect-source checklist
2. **Buyer outcome:** buyer has a concrete list of places/channels to look for prospects, instead of staring at a blank search bar.
3. **Problem solved:** "I don't know where to even start looking."
4. **Why ₹99:** DISCOVER-stage, pre-tool, no system dependency — fits the tier's "what can I do with AI" framing.
5. **Overlap with existing 3:** none — the existing assets assume a prospect already exists; this precedes them.
6. **Overlap with ₹499:** low — ₹499's outreach sequence assumes a found prospect; this is upstream of it.
7. **Recommended format:** PDF.
8. **Analyst recommendation:** KEEP.
9. **Rationale:** Fills a genuine gap (no "finding clients" asset exists today) with low risk of duplicating anything else.

### Candidate 5
1. **Title:** Prospect research worksheet (what to check before you pitch)
2. **Buyer outcome:** buyer can look credible on a first outreach by knowing 3–5 real facts about the prospect.
3. **Problem solved:** generic, obviously-templated outreach that gets ignored.
4. **Why ₹99:** a worksheet/checklist, not a tool — stays within "downloadable file," no engine dependency.
5. **Overlap with existing 3:** mild — the existing outreach templates already instruct "don't read as templates"; this worksheet is the *input* to writing a non-templated message, so it's complementary rather than redundant.
6. **Overlap with ₹499:** low.
7. **Recommended format:** PDF.
8. **Analyst recommendation:** KEEP.
9. **Rationale:** Directly supports the existing outreach-templates asset rather than duplicating it.

### Candidate 6
1. **Title:** Opportunity qualification checklist
2. **Buyer outcome:** buyer can tell, before spending time, whether a prospect is worth pursuing.
3. **Problem solved:** wasted effort chasing unqualified leads.
4. **Why ₹99:** a static checklist — the ₹1,499 tier's engine does this algorithmically; this is the manual, no-tool version appropriate to DISCOVER.
5. **Overlap with existing 3:** none.
6. **Overlap with ₹499:** **possible** — ₹499's "scope and pricing playbook" may already touch qualification-adjacent scoping; flagged for PO judgment, not resolved here (see Decision C).
7. **Recommended format:** PDF.
8. **Analyst recommendation:** KEEP, with the ₹499 boundary flagged.
9. **Rationale:** Useful and distinct in principle, but the ₹499 overlap should be the PO's call.

### Candidate 7
1. **Title:** Simple prospect scorecard (which leads to pursue first)
2. **Buyer outcome:** buyer can rank 5–10 leads instead of treating them as equally good.
3. **Problem solved:** no prioritization method, so time goes to the easiest-to-reach lead rather than the best one.
4. **Why ₹99:** manual/static version of what the engine (`core-opportunity` scoring) does automatically at higher tiers — appropriate as a simplified, standalone file.
5. **Overlap with existing 3:** none.
6. **Overlap with ₹499/₹1,499:** **meaningful** — this is conceptually the manual precursor to the ₹1,499 system's actual scoring engine. Flagged for PO judgment (Decision C).
7. **Recommended format:** spreadsheet.
8. **Analyst recommendation:** KEEP, with the boundary flagged.
9. **Rationale:** Valuable on its own, but risks previewing (and thereby slightly devaluing) the paid engine at ₹1,499 if not framed carefully.

### Candidate 8
1. **Title:** "Your first AI service" — offer-framing worksheet
2. **Buyer outcome:** buyer can describe what they're selling in one sentence a stranger would understand.
3. **Problem solved:** vague or overly broad service offers that don't convert.
4. **Why ₹99:** directly supports "what can I do with AI" — the tier's own primary question.
5. **Overlap with existing 3:** none.
6. **Overlap with ₹499:** low — ₹499's "primary question" is "what exactly should I sell" (service/customer selection), which is adjacent; flagged lightly for PO judgment.
7. **Recommended format:** PDF.
8. **Analyst recommendation:** KEEP, with light boundary flag.
9. **Rationale:** Strong fit for ₹99's own stated purpose; only a soft overlap with ₹499's "service selection."

### Candidate 9
1. **Title:** Follow-up sequence templates (3-touch)
2. **Buyer outcome:** buyer has something to send when the first message gets no reply.
3. **Problem solved:** one message sent, no reply, buyer gives up.
4. **Why ₹99:** direct companion to the existing outreach-templates asset.
5. **Overlap with existing 3:** mild/complementary, same reasoning as Candidate 5.
6. **Overlap with ₹499:** **direct** — ₹499's outreach sequence is explicitly described as "including the follow-ups most people skip." This candidate risks shipping, at ₹99, the exact thing ₹499 is partly sold on.
7. **Recommended format:** PDF.
8. **Analyst recommendation:** MODIFY or DROP — recommend narrowing to a single, minimal follow-up template (not a full sequence) if kept, to avoid cannibalizing ₹499's named selling point.
9. **Rationale:** Highest-risk candidate for tier cannibalization found in this set.

### Candidate 10
1. **Title:** Discovery-call question list
2. **Buyer outcome:** buyer has questions ready if a prospect actually responds and agrees to talk.
3. **Problem solved:** getting a reply and then not knowing what to say.
4. **Why ₹99:** natural extension of "got a reply, now what" — still DISCOVER-stage, no tool dependency.
5. **Overlap with existing 3:** none.
6. **Overlap with ₹499:** low.
7. **Recommended format:** PDF.
8. **Analyst recommendation:** KEEP.
9. **Rationale:** Fills a real gap, low overlap risk.

### Candidate 11
1. **Title:** Acquisition tracker (simple spreadsheet)
2. **Buyer outcome:** buyer can see, in one place, who they've contacted and what happened.
3. **Problem solved:** losing track of outreach across scattered notes/DMs.
4. **Why ₹99:** a static spreadsheet, not the engine's tracking — appropriate as a manual tool at this tier.
5. **Overlap with existing 3:** none.
6. **Overlap with ₹499/₹1,499:** low-to-moderate — the higher tiers' engine (`core-opportunity`/pipeline tracking) is the automated version of this; same category of concern as Candidate 7 but lower intensity, since a spreadsheet is a much weaker substitute for a real engine than a scorecard is for real scoring.
7. **Recommended format:** spreadsheet.
8. **Analyst recommendation:** KEEP.
9. **Rationale:** Useful, low cannibalization risk — a spreadsheet tracker is a reasonable "starter" version of a capability the paid engine later automates.

## 4. Decision A — final asset count (for Product Owner confirmation)

> The Product Owner must approve **at least 7 additional assets** from §3 (or substitute others), so that the total reaches **at least 10** downloadable assets (3 existing + 7 or more new). The Product Owner is **not required to stop at exactly 10** — approving all 8 candidates (resulting in 11 total) is acceptable, per `DEC-012`'s "at least" wording.

**Product Owner confirmation:** ☐ Confirmed — minimum of 7 additional approvals required, 10+ total, no upper cap imposed by this record.

## 5. Decision B — individual assets (Product Owner fills in; analyst recommendation shown for reference only, not binding)

| # | Candidate | Analyst recommendation (reference only) | **PO decision** |
|---|---|---|---|
| 4 | Prospect-source checklist | KEEP | ☐ APPROVE ☐ MODIFY ☐ REJECT |
| 5 | Prospect research worksheet | KEEP | ☐ APPROVE ☐ MODIFY ☐ REJECT |
| 6 | Opportunity qualification checklist | KEEP (₹499 boundary flagged) | ☐ APPROVE ☐ MODIFY ☐ REJECT |
| 7 | Simple prospect scorecard | KEEP (₹499/₹1,499 boundary flagged) | ☐ APPROVE ☐ MODIFY ☐ REJECT |
| 8 | Offer-framing worksheet | KEEP (light ₹499 boundary flag) | ☐ APPROVE ☐ MODIFY ☐ REJECT |
| 9 | Follow-up sequence templates | MODIFY or DROP (direct ₹499 overlap) | ☐ APPROVE ☐ MODIFY ☐ REJECT |
| 10 | Discovery-call question list | KEEP | ☐ APPROVE ☐ MODIFY ☐ REJECT |
| 11 | Acquisition tracker | KEEP | ☐ APPROVE ☐ MODIFY ☐ REJECT |

If any row is REJECTed and fewer than 7 remain APPROVEd, Decision A requires additional candidates — not invented here; the Product Owner would need to supply or request new ones.

## 6. Decision C — ₹99/₹499 boundary (issue presented, not decided)

Three candidates carry a flagged boundary question. For each, the issue is presented; the choice belongs to the Product Owner.

| Candidate | The issue | Analyst-presented options (not a recommendation to pick one) |
|---|---|---|
| 6 — Qualification checklist | ₹499's "scope and pricing playbook" may already touch qualification-adjacent ground. | (a) Keep as-is, framed narrowly as "is this worth a first message" (DISCOVER-level) to stay distinct from ₹499's scoping content; (b) drop; (c) PO judges no real overlap exists and approves unconditionally. |
| 7 — Prospect scorecard | Conceptually previews the ₹1,499 engine's actual scoring capability. | (a) Keep, explicitly framed as a manual/static exercise with a note that the full product automates this at a higher tier (upsell framing); (b) drop to protect ₹1,499's distinct value; (c) PO judges the preview effect is net-positive (creates upsell desire) and approves unconditionally. |
| 9 — Follow-up sequence templates | ₹499 is explicitly sold partly on "the follow-ups most people skip." | (a) Narrow to one minimal template (analyst's MODIFY suggestion) rather than a full sequence; (b) drop entirely; (c) PO judges a single basic template doesn't meaningfully compete with ₹499's fuller sequence and approves unconditionally. |

**Product Owner decision on each boundary:** ☐ 6: ___  ☐ 7: ___  ☐ 9: ___

## 7. Optional analyst suggestions beyond the identified candidates (clearly marked — not part of the ≥10 count unless separately approved)

None offered in this record. No additional assets beyond candidates #4–#11 are proposed here; if the Product Owner rejects enough candidates to fall below 7 approvals, new candidates would need to be requested or supplied separately, not invented unilaterally by this process.

## 8. Not authorized by this record

No file has been created. No catalog, schema, migration, test, configuration, marketing-page, or application-code change has been made. No storage key has been assigned. No commit or push has occurred. This record becomes a decision only once the Product Owner completes §4–§6; until then it is a questionnaire, not a decision.
