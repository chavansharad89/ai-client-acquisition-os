# CLIENT FINDER — SERVICE CATALOGUE SCOPE — PRODUCT OWNER DECISION

**Decision ID:** CF-SERVICE-CATALOG-PO-DEC-001
**Related decisions:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md) (staged discovery architecture), [CF-DISCOVERY-ARCH-002-Q1..Q6/S5/S6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md) (deterministic opportunity signals, website-observable scope), [CF-DISCOVERY-ARCH-002 Item #9](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md) (strong-signal bypass principle)
**Decision title:** Client Finder is a general freelancer client-discovery system with a 17-family service catalogue; results are presented by top-level service
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Governance-only. Defines the product's service scope and the service-catalogue → result-presentation rule. Does **not** decide, change, or reinterpret any deterministic signal, scoring, weight, threshold, ranking rule, AI-escalation mechanism, data source, or provider/model choice.

## Context

All deterministic-opportunity-layer work decided to date (`CF-DISCOVERY-ARCH-002` Q1–Q6, S5, S6, and the parent questionnaire) was scoped and worded in terms of **website-observable signals** for businesses discovered as prospects. That work did not itself assert that Client Finder is limited to website-related services — it scoped *the currently-authorized deterministic signal set*, not the product's service boundary. However, because every example and all signal language in that line of work concerned website presence/reachability/technical quality, the governance record as written could be misread as implying Client Finder is a website-lead-finder product.

The PO has now made a new, separate decision clarifying the product's actual service scope.

## PO decision

**Client Finder is a GENERAL FREELANCER CLIENT-DISCOVERY SYSTEM, NOT A WEBSITE-LEAD FINDER.**

### 1. Service catalogue (17 top-level service families)

The Client Finder service catalogue contains the following 17 top-level service families, each with the listed sub-services as catalogue metadata:

1. **Web & Software Development** — Website development; Website redesign; Landing pages; E-commerce development; WordPress development; Shopify development; Web applications; Mobile apps; SaaS development; Custom software; API development/integration; Database development; Bug fixing; Website maintenance; Performance optimization; Technical consulting.
2. **AI & Automation** — AI chatbot development; AI agents; AI automation; Workflow automation; Business process automation; CRM automation; AI integration; Custom AI tools; Prompt engineering; AI consulting; RAG/knowledge-base systems; AI content workflows.
3. **Video & Reels** — Reel creation; Short-form video; YouTube video editing; Long-form video editing; Podcast editing; Video ads; Product videos; Explainer videos; Motion graphics; Animation; Video subtitles/captions; Video repurposing; YouTube channel editing.
4. **Graphic & Visual Design** — Logo design; Brand identity; Brochure design; Poster design; Social-media creatives; Ad creatives; Presentation design; Infographics; Packaging design; UI design; UX design; Illustration; Thumbnail design; Print design.
5. **Branding** — Brand strategy; Brand identity; Rebranding; Naming; Brand guidelines; Positioning; Visual identity; Personal branding; Employer branding.
6. **Digital Marketing** — Social-media marketing; Social-media management; SEO; Local SEO; Google Business Profile optimization; Performance marketing; Google Ads; Meta Ads; LinkedIn Ads; YouTube Ads; Email marketing; WhatsApp marketing; Influencer marketing; Affiliate marketing; Lead generation; Marketing automation; Conversion-rate optimization.
7. **Content & Copywriting** — Website copy; Blog writing; SEO content; Ad copy; Social-media content; Product descriptions; Email copy; Newsletter writing; Script writing; YouTube scripts; Case studies; Technical writing; Ghostwriting.
8. **Photography** — Product photography; Food photography; Fashion photography; Corporate photography; Event photography; Real-estate photography; E-commerce photography; Photo editing; Background removal; Image retouching.
9. **Audio** — Podcast production; Audio editing; Voice-over; Dubbing; Sound design; Music production; Jingles; Audio cleanup; Audiobook production.
10. **E-commerce Services** — Shopify services; WooCommerce; Amazon seller services; Flipkart seller services; Product listing; Product photography; Store design; Store optimization; Marketplace management; E-commerce SEO; Conversion optimization.
11. **Business & Operations** — Virtual assistant; Data entry; Research; Lead generation; CRM management; Customer support; Appointment setting; Bookkeeping; Business analysis; Project management; Operations consulting.
12. **Sales & Lead Generation** — B2B lead generation; Prospect research; Cold email; LinkedIn outreach; Appointment setting; Sales development; Sales copywriting; CRM setup; Sales automation; Outbound sales.
13. **Translation & Language** — Translation; Localization; Transcription; Subtitling; Proofreading; Editing; Language tutoring; Multilingual content.
14. **Architecture / Engineering / 3D** — Architecture drawings; 3D modelling; 3D rendering; Interior design; CAD; Product design; Engineering drawings; BIM; Visualization; 3D animation.
15. **Finance / Professional Services** — Financial modelling; Excel/Google Sheets; Data analysis; Power BI; Business plans; Market research; Accounting support; Tax preparation support; Financial reporting; Consulting.
16. **Education & Expertise** — Online tutoring; Course creation; Corporate training; Technical training; Interview coaching; Career coaching; Skill coaching; Educational content.
17. **Specialized Professional Services** — Legal-document support; HR/recruitment; Resume/CV writing; Recruitment sourcing; Compliance support; Grant writing; Research assistance; Technical consulting; Industry-specific consulting.

### 2. Authoritative product rules

1. All 17 service families above are part of the current Client Finder service catalogue.
2. A freelancer/user can select any top-level service.
3. A freelancer/user may select multiple top-level services where appropriate.
4. Sub-services are catalogue metadata/supporting classification. They do **not** create separate result categories.
5. **Top-level-result rule:** Client Finder results must be presented according to the selected TOP-LEVEL SERVICE, not according to individual sub-services. Example: if the user selects "Digital Marketing," results are presented as Digital Marketing opportunities. The system may internally determine that a particular opportunity is especially relevant to SEO, Meta Ads, social-media management, etc., but that does not create a separate search/result category.
6. Sub-services MAY be used internally for: research; qualification; opportunity detection; ranking; personalization; recommended offer generation.
7. Client Finder is therefore **NOT** a website-lead finder. It is a general freelancer client-discovery system.
8. The deterministic opportunity layer must ultimately be **service-aware**. Applicable opportunity signals may differ by selected top-level service (for example: Web development may use no-website/broken-website signals; Video/Reels may use signals relevant to video/content needs; Digital Marketing may use signals relevant to digital-marketing opportunities; Branding may use signals relevant to branding opportunities). This decision does **not** invent or authorize any concrete signal for any non-web-development service family — see §4 below.

## Exact authoritative wording

> Client Finder is a GENERAL FREELANCER CLIENT-DISCOVERY SYSTEM, NOT A WEBSITE-LEAD FINDER.
>
> The Client Finder service catalogue shall contain [the] 17 top-level service families and [the listed] sub-services [exactly as enumerated above].
>
> 1. All 17 service families above are part of the current Client Finder service catalogue.
> 2. A freelancer/user can select any top-level service.
> 3. A freelancer/user may select multiple top-level services where appropriate.
> 4. Sub-services are catalogue metadata/supporting classification. They do NOT create separate result categories.
> 5. Client Finder results must be presented according to the selected TOP-LEVEL SERVICE, not according to individual sub-services.
> 6. Sub-services MAY be used internally for research, qualification, opportunity detection, ranking, personalization, recommended offer generation.
> 7. Client Finder is therefore NOT a website-lead finder. It is a general freelancer client-discovery system.
> 8. The deterministic opportunity layer must ultimately be SERVICE-AWARE. Applicable opportunity signals may differ by selected top-level service. Do NOT invent or authorize concrete signals for these services in this task.
> 9. This decision does NOT authorize implementation.
> 10. This decision does NOT yet decide: exact service-specific deterministic signals; scoring; weights; thresholds; ranking algorithm; AI escalation mechanism; strong-signal classifications; data sources; public-intent sources; provider/model selection; cost limits; technical implementation.
> 11. Do NOT silently reinterpret existing deterministic-layer decisions. Where the new product-wide service-aware scope conflicts with a narrower website-specific interpretation, document the governance clarification and identify the affected open question rather than changing code or making an engineering decision.
> 12. The catalogue is the CURRENT agreed catalogue, not a claim that it exhaustively covers every possible freelance service. Future additions require a separate PO decision.
> 13. Inclusion of regulated/professional categories in the catalogue does NOT by itself authorize unrestricted execution of regulated professional work. Any necessary eligibility/safety/product constraints remain separate future decisions.

## Governance clarification — relationship to the website-observable deterministic-signal decisions (per directive §12 above)

This is a clarification, not a reinterpretation or reopening, of `CF-DISCOVERY-ARCH-002`:

- **The PRODUCT is general/service-aware.** Client Finder's service scope spans all 17 families above, not website-related services only.
- **The currently authorized/decided deterministic signal scope remains exactly what was actually decided**, i.e. `CF-DISCOVERY-ARCH-002-Q3`'s scoping to **website-observable signals**, and the specific signals addressed by Q1/Q2/Q4/Q5/Q6/S5/S6 — all of which were implicitly evaluated in the context of a prospect's website, which in practice corresponds most directly to service family #1 (Web & Software Development).
- **Service-specific deterministic signals for the other 16 service families are future governance/engineering work.** No signal, scoring rule, threshold, or escalation mechanism exists today, nor is any authorized by this decision, for Video & Reels, Digital Marketing, Branding, or any other non-web-development family.
- The affected open question this clarifies: `CF-DISCOVERY-ARCH-002` parent questionnaire **Item #3** ("Deterministic signal set (final list)") and its framing throughout Q1–Q6/S5/S6 should be read as having decided the website-observable signal set **for the web-development-type case**, not as a product-wide limitation of Client Finder to website-related services. The questionnaire has been updated (see below) to state this explicitly.

## Mandatory boundaries on this decision

1. This is a governance/product-scope decision only.
2. No code, configuration, `.env`, database schema, or data change is authorized by this decision.
3. No deterministic signal, scoring rule, weight, threshold, ranking algorithm, or AI-escalation mechanism is authorized, changed, or reinterpreted by this decision, for any service family — including Web & Software Development.
4. No discovery/research behavior is changed by this decision.
5. This decision does not resolve, close, or answer any open item in `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` or in `CF-DISCOVERY-ARCH-002` Q1–Q6/S5/S6/Item #9. All of those remain exactly as open or decided as they were before this record.

## Explicit non-decisions

This record does **not** decide or authorize:

- Any concrete deterministic signal for any service family other than the website-observable set already scoped under `CF-DISCOVERY-ARCH-002-Q3`.
- Scoring, weights, thresholds, or ranking algorithm for any service family (ties to questionnaire items #4–#7).
- The AI-escalation mechanism, strong-signal classifications, or the Top-N/threshold/hybrid choice (questionnaire items #8–#10; Item #9's principle-only status is unchanged).
- Any data source or public-intent source for any service family (ties to `CF-DISCOVERY-ARCH-002-Q4`).
- Any provider/model selection or cost ceiling (ties to `CF-DISCOVERY-ARCH-001`).
- Any technical implementation, code, configuration, schema, or data change.
- Eligibility/safety/compliance constraints on regulated or professional-service categories within the catalogue (service families #15, #17 in particular) — these remain separate future decisions per directive §13.
- Exhaustiveness of the catalogue — future service additions require a separate PO decision per directive §12.

## Consequences

- The product's service scope is now explicitly 17 top-level families, each carrying sub-service metadata used only internally (research, qualification, opportunity detection, ranking, personalization, offer generation) — never as a separate result category.
- Any future search-configuration, result-presentation, or opportunity-layer engineering work must organize results by top-level service family, not by sub-service.
- Any future deterministic-signal, scoring, or escalation work for a non-web-development service family requires its own PO decision(s) following the same pattern already used for Web & Software Development (`CF-DISCOVERY-ARCH-002`), before implementation.

## What remains to be decided

- Service-specific deterministic signals, scoring, weights, thresholds, ranking, and AI-escalation mechanisms for each of the 16 non-web-development service families.
- Whether/how the existing website-observable signal set (`CF-DISCOVERY-ARCH-002`) maps onto Web & Software Development specifically versus remaining a cross-cutting technical check.
- Data sources and public-intent investigation for any non-web-development service family.
- Provider/model selection and cost ceilings (unchanged, still open per `CF-DISCOVERY-ARCH-001`).
- Eligibility/safety/compliance constraints for regulated categories in the catalogue.
- All items already open in `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` remain open, unaffected by this decision except for the clarification recorded above.

## Forward cross-reference (added 2026-10-16)

`CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001` (`CLIENT_FINDER_PHASE_7B_SUBSERVICE_RELEVANCE_AUTHORIZATION_PO_DECISION.md`) authorizes implementation of a specific, narrow use of this catalogue's subservice metadata — deterministic matching of an Opportunity's relevant predefined subservices, for internal/presentation purposes only, per `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001` item #6. That decision does not change the 17-family catalogue or any subservice enumeration recorded above, and this record's "implementation not authorized" status is otherwise unchanged for everything other than that one narrow, now-separately-authorized use.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED**, except for the narrow Phase 7B subservice-relevance use authorized by `CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001` (see forward cross-reference above). No other code, configuration, `.env`, database schema, or data change is authorized by this record. Nothing has been committed or pushed.
