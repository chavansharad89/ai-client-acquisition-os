# Client Finder — Deterministic Opportunity Layer — Item #9 PO Decision: Strong-Signal AI-Escalation Bypass (Principle Only)

**Status: PRINCIPLE DECIDED. Concrete mechanism NOT YET DEFINED. IMPLEMENTATION NOT AUTHORIZED.**

**Source:** Item #9 of `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` ("Whether a strong signal may bypass normal ranking").

## Decision

**YES — a strong-signal AI-escalation bypass principle is authorized.**

A deterministic signal that is explicitly classified as sufficiently strong and sufficiently reliable may trigger AI escalation without first satisfying the general candidate-ranking threshold.

## Rationale

This preserves the practical meaning of `CF-DISCOVERY-ARCH-002-Q1` ("no website" is a positive opportunity signal). A positive signal that a ranking system could consistently place below the AI-escalation threshold would be positive only in name — the bypass principle exists so high-confidence, high-value deterministic evidence cannot be systematically suppressed by a generic ranking threshold.

## Explicit boundaries — what this decision does NOT do

1. Does not declare every positive signal to be a strong signal.
2. Does not declare "no website" (`WEBSITE_ABSENT_CONFIRMED`) to be an automatic bypass signal yet — that remains a separate, future decision.
3. Does not define which signal(s) qualify as "strong."
4. Does not define confidence thresholds.
5. Does not define numerical scores or weights.
6. Does not define how many candidates may bypass ranking via this mechanism.
7. Does not authorize any code, configuration, or `.env` change.

## What happens next

- Engineering must propose the concrete strong-signal classification and bypass mechanism (which signal(s) qualify, how confidence/reliability is assessed, how the bypass interacts with escalation volume/cost controls such as Top-N — Item #10 of the questionnaire).
- That concrete proposal requires its own governance review and a separate PO decision before any implementation.
- Implementation remains not authorized until that separate decision is made.

## Effect on the questionnaire

Only Item #9 is resolved, and only at the principle level. All other items in `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` — including Item #10 (Top-N vs. threshold vs. hybrid), Item #1 (definition of "confirmed no website"), and Item #3 (final signal set), which the eventual concrete bypass mechanism will depend on — remain open.

## Forward cross-reference (added 2026-10-13)

`CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001` resolves, at the architecture-mechanism level, the open question of whether a bypass candidate counts toward Top-N or consumes the AI budget: **yes to both**. Bypass changes admission *order* and admission *criteria* only (admitted ahead of normally-ranked candidates, skipping the rank/threshold test) — it does not exempt a candidate from the shared escalation cap, and does not make the bypass path unbounded. This record's principle-level bypass authorization (above) is unmodified; which signal(s) qualify as "strong" remains a separate, future decision exactly as stated.

**IMPLEMENTATION NOT AUTHORIZED.**
