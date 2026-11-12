# CLIENT FINDER — DETERMINISTIC OPPORTUNITY SIGNALS — Q4 PARTIAL PO DECISION: PUBLIC-INTENT-SOURCE INVESTIGATION AUTHORIZATION

**Decision ID:** CF-DISCOVERY-ARCH-002-Q4
**Parent questionnaire:** [CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md), §4 Q4
**Parent architecture decision:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md)
**Related partial decisions:** [CF-DISCOVERY-ARCH-002-Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md), [CF-DISCOVERY-ARCH-002-Q2](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q2_REACHABILITY_PERSISTENCE_PO_DECISION.md), [CF-DISCOVERY-ARCH-002-Q3](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q3_SCOPE_PO_DECISION.md)
**Decision title:** Authorization to investigate (not implement) a data source for signal #30, "public request for website/web-development help"
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Answers Q4 only. This is an **investigation authorization**, not an implementation authorization, and not a source selection. Q5, Q6, the signal-combination rule (§5), and the AI-escalation boundary (§6) of the parent questionnaire remain open and unanswered. The investigation itself has not been performed as part of recording this authorization — it is authorized to occur as separate, subsequent work.

## Context

Signal #30 in the parent questionnaire ("public request for website/web-development help, found via a general-purpose web/search API — not platform scraping") was rated the closest of the "intent" signals to being architecture-ready: `publicWebSearchAdapter` ([intentSourceAdapters.ts](packages/core-research/src/intentSourceAdapters.ts)) already defines the mapping shape, but no live, authorized data source is wired to it. Q4 asked whether the PO would authorize investigating a specific, compliant data source for this signal, separate from authorizing its use.

## PO decision

**YES — investigation authorized.** Client Finder may investigate whether a specific, compliant, and practically usable data source exists for signal #30. This is an investigation authorization only.

## Exact authoritative wording

> Client Finder may investigate whether there is a specific compliant and practically usable data source for signal #30: "Public request for website/web-development help."
>
> However, this is an INVESTIGATION AUTHORIZATION ONLY.

## What this authorization does NOT permit

1. Production integration.
2. Scraping.
3. Automated collection.
4. Use of any particular platform (none is pre-selected).
5. Bypassing authentication or access controls.
6. Violating a platform's Terms of Service.
7. Use of private user content.
8. Use of private messages.
9. Use of private AI conversations.
10. Purchasing a data provider.
11. Code changes.
12. Configuration changes.
13. `.env` changes.
14. Implementation of any kind.

## Required scope of the investigation (when conducted)

For any proposed source, the investigation must identify:

1. Exact source/provider.
2. What public data is actually available.
3. Whether an official API exists.
4. Whether commercial lead discovery is permitted.
5. Applicable Terms of Service / usage restrictions.
6. Whether automated collection is permitted.
7. Authentication requirements.
8. Cost.
9. Data freshness.
10. Expected lead quality.
11. Geographic relevance, especially India/Mumbai.
12. Whether the source can provide evidence of genuine intent.
13. Privacy/data-protection considerations.
14. Whether the source is technically feasible for this product.

The investigation must keep three questions distinct for every candidate source, and must not collapse them into one conclusion:

- **TECHNICALLY POSSIBLE**
- **POLICY/TERMS PERMITTED**
- **PRODUCT-AUTHORIZED**

A source being technically possible does not imply it is policy-permitted; a source being policy-permitted does not imply it is product-authorized (that remains a separate, future PO decision).

## Explicit non-decisions

This record does **not** decide or authorize:

- Any specific source, platform, or provider for signal #30 — none is selected here.
- Production use, integration, or implementation of any source, even one found to be technically possible and policy-permitted.
- Q5 (which vague signals to drop vs. decompose) — open.
- Q6 (WHOIS/RDAP-based signals #24/#34) — open.
- The signal-combination rule (parent questionnaire §5, options A–E) — open.
- The AI-escalation boundary (parent questionnaire §6, options A–D) — open.
- Any code, configuration, or `.env` change.
- The business-activity signals deferred under [CF-DISCOVERY-ARCH-002-Q3](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q3_SCOPE_PO_DECISION.md) — unaffected by this record.

## Consequences

- A future investigation (separate piece of work, not performed as part of recording this authorization) may now be initiated to evaluate candidate sources for signal #30 against the 14-point scope and the three-way TECHNICALLY POSSIBLE / POLICY-PERMITTED / PRODUCT-AUTHORIZED distinction above.
- Findings from that investigation would feed a future, separate PO decision on whether to authorize any specific source for product use — this record does not pre-commit to that outcome either way.

## What remains to be decided

- Q5, Q6, the signal-combination rule, and the AI-escalation boundary — still open.
- Whether to conduct the authorized investigation now or later, and who evaluates its findings.
- Any eventual source selection and production-use authorization for signal #30, which requires its own future PO decision regardless of investigation findings.

## Implementation authorization status

**NOT AUTHORIZED.** No code, configuration, `.env`, or data has been changed. No investigation has been performed as part of recording this authorization — only the authorization and its scope have been recorded.
