# Monetization

> **This is a model, not implemented code.** No tier, quota, metering, overage or subscription exists in the repository — and neither does the user identity such a system would meter. The one-time funnel is real (see [PAYMENTS.md](PAYMENTS.md)); everything below is arithmetic.

## The finding

**The SaaS tiers as originally specified lose money at every price point.** With generous AI allowances on a free-forever tier, blended gross margin is ₹122 per paying user against a free-tier drag of ₹583 — a net of **−₹461 per paying user per month**, before spending anything on acquisition. No CAC recovers that, because the loss grows with every customer.

Three changes make it work: free becomes a 14-day trial plus a permanently-free **CRM without AI**; research runs on Haiku on every tier; allowances grow sub-linearly with price. That clears **₹194 per paying user per month** at a **33% gross margin**, with breakeven at about **82 paying users**.

## Cost per operation

Token counts measured from the actual prompts and schemas in `core-research`, `core-outreach` and `core-proposal`. Output includes thinking tokens, which bill as output. A repair multiplier is applied because the generators retry on validation failure.

| Operation | Input tok | Output tok | Opus 5 | Sonnet 5 | Haiku 4.5 |
|---|---:|---:|---:|---:|---:|
| Research a lead | 10,400 | 3,500 | ₹15.96 | ₹6.38 | ₹3.19 |
| Generate outreach (4 channels) | 2,400 | 2,300 | ₹7.64 | ₹3.06 | ₹1.53 |
| Generate a proposal | 2,800 | 4,300 | ₹13.36 | ₹5.35 | ₹2.67 |

**Research decides the shape of the business.** It runs on every lead and carries whole source documents as input. On Opus 5, researching 200 leads costs ₹3,192 — four times the entire ₹799 subscription.

So research runs on **Haiku 4.5 on every tier, including the top one**. This is not a downgrade sold as a feature: research is extraction under a strict schema — pull claims from supplied text, classify each as observed or inferred, cite the quote. The schema rejects unevidenced claims regardless of which model produced them, so the guardrail does the work a larger model would otherwise be paid for. Model tier rises only for proposals, where judgement shows and volume is low.

## Why free-forever breaks it

An active free user costs money every month, forever, whether or not they convert.

| Free tier shape | Cost/user/mo | At 3% convert | At 10% convert |
|---|---:|---:|---:|
| 10 research, 20 outreach, 1 proposal | ₹75 | ₹7,290 | ₹2,187 |
| 5 research, 15 outreach, 1 proposal | ₹56 | ₹5,400 | ₹1,620 |
| 3 research, 10 outreach, 1 proposal | ₹44 | ₹4,230 | ₹1,269 |
| **14-day trial, full allowance** | one-off | **₹360** | **₹180** |

Even a miserly free tier costs ₹4,230 in AI per paying customer at a realistic 3% conversion — fourteen months of Starter revenue spent before the first payment. The problem is not the size of the allowance; it is that **the cost recurs and the revenue does not**.

The permanently-free tier therefore keeps everything that costs nothing to run: store leads, track the pipeline, schedule follow-ups, write and send your own messages, see your own numbers. That is a genuinely useful CRM rather than a crippled demo, and it is honest — the thing being metered is the thing that actually costs money. The 14-day trial gives full AI access, so the value is felt before the wall, at one-off rather than perpetual cost.

## The tiers

| | Free | Starter ₹299 | Professional ₹799 | Studio ₹1,499 |
|---|---|---|---|---|
| Leads stored | 500 | 2,000 | 10,000 | Unlimited |
| AI research /mo | 0 | 30 | 80 | 160 |
| AI outreach /mo | 0 | 80 | 200 | 400 |
| AI proposals /mo | 0 | 3 | 10 | 24 |
| | Manual outreach unlimited; full pipeline & follow-up | Sequences, manual send; conversion analytics | Auto-draft on schedule; full analytics & export | Opus-tier proposals; API access |
| **Cost** | ≈₹2 | ₹175 | ₹547 | ₹1,084 |
| **Margin** | — | ₹124 (42%) | ₹252 (32%) | ₹415 (28%) |

Allowances grow **sub-linearly** with price. Linear scaling inverted the margins in the first model — Starter at 50%, Studio at 18% — which would have made every upgrade a worse deal for the business than the plan below it.

### Overage is required, not optional

Without it, a Professional user who consumes their whole allowance costs ₹1,233 against ₹799 of revenue — a **₹434 loss on your best customers**. Metered at cost plus 60% (₹5.11 per research, ₹4.89 per outreach set, ₹21.38 per proposal), heavy use becomes profitable instead of dangerous, and nobody is cut off mid-campaign.

## Full cost breakdown

Per active paying user per month, at 1,000 paying users.

| Line | Starter | Professional | Studio | Basis |
|---|---:|---:|---:|---|
| Price | 299 | 799 | 1,499 | — |
| AI (Anthropic) | 129 | 460 | 925 | Measured tokens × list price, realistic utilisation |
| Email + WhatsApp | 8 | 19 | 38 | SES ₹0.009/email; Meta utility ₹0.78/conversation |
| Database + hosting | 18 | 18 | 18 | ₹18,000/mo fixed, amortised |
| Support | 12 | 30 | 70 | Time cost, rising with complexity |
| Payment fees | 7 | 19 | 35 | Razorpay 2% + 18% GST on the fee |
| **Total cost** | **175** | **547** | **1,084** | |
| **Gross margin** | **124** | **252** | **415** | 42% / 32% / 28% |

Data providers are **deliberately absent**. Lead enrichment at ₹25–300 per user per month would erase Starter's margin entirely. Either pass it through at cost as an add-on, or let users bring their own lists — but do not bundle it silently and discover the hole later.

## The one-time funnel is the profitable half

| Product | Price | Margin | % | = months of SaaS contribution |
|---|---:|---:|---:|---:|
| AI Income Starter Kit | ₹99 | ₹94.70 | 96% | 0.5 |
| AI Freelancing Launch Kit | ₹499 | ₹485.20 | 97% | 2.5 |
| AI Client Acquisition System | ₹1,499 | ₹1,461.60 | 98% | 7.5 |

This reframes the strategy. The funnel is usually described as a lead magnet for the SaaS; the arithmetic says closer to the opposite. **One ₹1,499 sale is worth seven and a half months of blended subscription contribution**, arrives immediately, and carries no ongoing cost.

A buyer who takes the ₹1,499 kit and then subscribes at Professional is worth ₹1,462 up front **plus** ₹252 every month after. That is the customer the machine should be built to produce — which argues for pricing the funnel as the primary acquisition channel rather than discounting it to drive trials. The SaaS is what makes a ₹1,499 customer worth more than ₹1,499, not the other way round.

## What you can afford to pay for a customer

Payback at ₹194 blended net contribution:

| CAC | Payback | Verdict |
|---|---:|---|
| ₹500 | 2.6 mo | Comfortable. Sustainable at volume |
| ₹1,000 | 5.2 mo | Workable if churn is under 5%/month |
| ₹1,500 | 7.7 mo | Tight. Needs a year of retention |
| ₹2,000 | 10.3 mo | Only defensible if the funnel sale came with it |

At 33% gross margin, CAC discipline matters more than in classic software. A typical SaaS at 80% margin can absorb a bad quarter of paid acquisition; at 33% the same spend takes three times as long to recover.

## Assumptions, most likely to be wrong first

1. **Utilisation 45–55%** — the share of their allowance an average user consumes. Untested. **If real users run at 80%, Professional margin falls from ₹252 to about ₹60.**
2. **Token profile** — 10,400 input tokens per research call assumes roughly three source documents. Ten pages doubles it.
3. **Repair overhead 25–30%** — how often generators retry after validation failure. Never measured against a live model.
4. **₹88 per USD** — AI costs are dollar-denominated, revenue is rupee-denominated. A 10% depreciation cuts Studio margin by roughly ₹90.
5. **₹18,000/month fixed** — managed Postgres, hosting, monitoring, email. Below ~100 paying users this dominates: at 100 users it is ₹180 each, at 1,000 it is ₹18.
6. **WhatsApp ₹0.78/conversation** — Meta's India utility rate. Marketing-category conversations cost more.
7. **8:1 free-to-paid** in the rejected model, **20% trial conversion** in the recommended one. Both are guesses until there is data.
8. **No data-provider cost**, as above.

Anthropic list prices as of 2026-06-24. No live API call has been made, so the repair-overhead and token figures are the least tested inputs in the model. Re-run the calculation once a week of real usage exists.

## What would have to be built

None of this is metered today, and the gap is larger than a billing integration:

- **There is no user identity.** No account, session, or tenant — see [SECURITY.md](SECURITY.md). Every per-user limit assumes it.
- No subscription, plan, quota or usage-counter model in the schema.
- No metering at the AI call sites; the generators do not report token usage to anything.
- No overage billing, and Razorpay subscriptions are not integrated — only one-time orders.
