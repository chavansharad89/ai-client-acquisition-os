# Security

An audit of the payments surface found **14 issues**. Every one listed here was **re-verified as still open** while writing this document — none have been fixed. The two most dangerous are also the cheapest: both are missing ignore files.

## Open findings

### CRITICAL — C-1: the Docker build bakes `.env` into an image layer

`apps/web/Dockerfile:17` and `apps/worker/Dockerfile:18` both run `COPY . .`, and **no `.dockerignore` exists**. The entire working tree — including `.env`, `.git` and `node_modules` — enters the build stage. Layers are permanent; a later stage that doesn't carry the file forward does not remove it.

An image built on a developer machine (where `scripts/setup.sh` has already copied `.env.example` to `.env`) and pushed to a registry hands `RAZORPAY_WEBHOOK_SECRET` to anyone with pull access via `docker save`. That secret forges `payment.captured` events — which this architecture defines as the single source of payment truth.

**Fix:** one new file at the repo root.

```
.env
.env.*
!.env.example
node_modules
.git
.next
dist
coverage
```

### HIGH — H-1: `.gitignore` misses `.env.production`

`.gitignore:12–14` covers `.env`, `.env.local`, `.env.*.local`. A file named `.env.production` — the convention Next.js itself encourages — matches none of them and is committed silently. **Fix:** replace those three lines with `.env*` plus `!.env.example`.

### HIGH — H-2: order creation is unauthenticated and unthrottled

`POST /api/payments/create-order` has no session, no CAPTCHA and no rate limit; a repo-wide grep for `rateLimit`/`throttle`/middleware returns nothing. Every accepted request makes a real Razorpay Orders API call and commits a row. Scripted, it exhausts the provider quota so genuine customers cannot check out. **Fix:** an IP fixed-window limiter (~5/min) in the route, before `createOrder` — keeping `core-payments` a pure domain module.

### HIGH — H-3: the signature verifier is complete and never called

`verifyRazorpayWebhookSignature` is careful work — timing-safe comparison, strict 64-hex guard, a type signature that makes passing a parsed body a compile error. It has **zero production call sites**. The route that should call it returns 501.

Not exploitable today, because the endpoint grants nothing. The risk is at implementation time: the verifier lives in a different directory, and nothing fails if the future handler forgets it. From that moment any host on the internet can POST a `payment.captured` body and be believed. **Fix now, not later:** add a test asserting that an invalid `X-Razorpay-Signature` produces no database write, and let it stand against the stub.

### MEDIUM

| ID | Issue | Fix |
|---|---|---|
| M-1 | The `Idempotency-Key` header is client-chosen and matched **globally** — a guessed key returns another customer's `orderId` and `razorpayOrderId`. Held at Medium only because the response body leaks no PII. | Match on `(idempotencyKey, customerEmail, productSlug)` |
| M-2 | Reconciliation snapshots use `json_agg(to_jsonb(w))`, copying the verbatim webhook `payload` — email, phone, payment method — into an operational audit table with no retention policy or redaction | Explicit column list omitting `payload` |

### LOW

| ID | Issue | Fix |
|---|---|---|
| L-1 | `META_PIXEL_ID` is interpolated into the CAPI URL path with only a non-empty check. Not attacker-reachable (it comes from env, not requests) and cannot change the host — a misconfiguration risk, not SSRF | Tighten to `/^\d+$/` |
| L-2 | The index-deploy script prints duplicate values — real `razorpay_payment_id`s — to stdout, i.e. into CI logs | Counts by default, values behind `--show-values` |
| L-3 | `InvalidProductError` echoes the rejected `productId` back to the client. Not XSS (JSON API, Zod-trimmed, JSON-escaped) — a reflection primitive | Return a static message |

## Webhook payload retention

`webhook_events.payload` stores the Razorpay body verbatim. This section is
the policy for it. Implemented by migration
`0011_webhook_payload_retention`, `packages/core-payments/src/webhookRetention.ts`,
and the tests in `packages/core-payments/src/webhookRetention.test.ts` and
`tests/integration/webhook-retention.integration.test.ts`.

### What is in the column

A Razorpay `payment.captured` body is not a financial record with a name
attached. The payment entity carries, in one JSONB blob:

| Field | What it is |
|---|---|
| `email`, `contact` | the customer's email address and phone number |
| `vpa` | a UPI handle — in practice a person's name and their bank, e.g. `firstname@okhdfcbank` |
| `card` / `card_id` / `token_id` | last four digits, network, issuer, type; and a reusable handle on the instrument |
| `bank`, `wallet` | which financial institutions the customer uses |
| `notes` | arbitrary merchant-set fields; in practice names and delivery addresses |
| `description` | free text that reaches us from checkout |
| `customer_id` | Razorpay's identity join key |
| `acquirer_data` | RRN, UPI transaction id, bank transaction id — trace identifiers that follow a person across systems |

### Why indefinite retention was not needed

**Nothing reads the column.** `payload` is write-only across this
repository: `insertWebhookEvent` writes it and no `SELECT` anywhere reads
it back. `core-reconciliation` goes out of its way to exclude it
(`detection.ts`, and see M-2 above), and `webhookHandler` deliberately
takes the amount from the **order** rather than the payload. Its only real
job is forensic — showing what the provider actually said when a payment
is disputed months later.

**The PII in it is a duplicate.** `orders.customer_email` and
`orders.customer_phone` are the system of record for who bought;
`payments` is the system of record for what was charged. The payload's
copy of the email is a second copy of a fact already stored, kept in the
one place nothing curates. Redaction removes the copy, not the fact.

### The policy

> The verbatim provider body is retained for **180 days** from
> `received_at`. After that it is narrowed to a fixed allowlist of
> non-identifying fields. The row itself is retained **indefinitely** and
> is never deleted.

**Why 180 days.** The number is set by the longest *external* window that
can demand the original, not by what is convenient to store: card networks
allow chargebacks up to roughly 120 days from the transaction, and
answering one takes time after it is raised. Configurable via
`WEBHOOK_PAYLOAD_RETENTION_DAYS` (bounded 30–400). Setting it below 120
forfeits card-dispute forensics — a legitimate choice, but a deliberate
one.

**Allowlist, not denylist.** Redaction *rebuilds* the payload from named
paths rather than deleting known-bad ones. A denylist fails open: Razorpay
ships a new `upi` block, nobody updates the list, and it is retained
forever. An allowlist fails closed — an unrecognised field is dropped by
default, and the cost of that mistake is a missing diagnostic rather than
a retained identifier.

**Nothing is deleted.** Redaction is a narrowing. After it runs the row
still carries:

- **identity** — `razorpay_event_id`, and the payment/order ids inside the payload
- **type** — `event_name`, and the payload's `event`
- **processing status** — `processed_at`, `processing_error`, `signature_valid`
- **linkage** — `order_id`
- **the financial skeleton** — amount, currency, status, method, captured, `amount_refunded`, `refund_status`, fee, tax, error codes
- **the fact of redaction** — `payload_redacted_at`, so a reader can tell a narrowed payload from one that arrived sparse

What it stops carrying is the table above.

### Running it

Redaction is idempotent and bounded, so it is safe at any cadence and safe
to run twice; `payload_redacted_at IS NULL` in the statement's own `WHERE`
clause makes a second pass a no-op. Two equivalent entry points:

- **Application** — `redactExpiredPayloads(createRedactionStore(client), new Date())`
  from `@acos/core-payments`, batched with `FOR UPDATE SKIP LOCKED` so a
  long-untended backlog cannot hold a lock across the webhook ingest path.
- **Database only** — `redact_webhook_payload(payload)`, for `pg_cron`, a
  `psql` cron entry, or a DBA mid-incident.

The two implementations are asserted byte-identical in the integration
suite, because one rule with two implementations drifts silently.

> **Not scheduled.** `apps/worker/src/index.ts` is still the Phase 2
> placeholder that throws, so nothing invokes this on a timer yet. Until a
> scheduler exists, retention is enforced only when the job is run
> manually. The policy, the redactor and the tests are complete; the cron
> entry is not.

### Never expose the raw payload

`webhook_events_audit` is a view over every column of `webhook_events`
**except** `payload`, plus a `payload_is_redacted` flag. It is the intended
read surface: support tooling, dashboards and reconciliation should read
the view, so that reaching the body requires naming the base table
deliberately. No HTTP route in `apps/web` reads the column — asserted by a
standing test in the retention suite.

## Container hardening

Both production images, and the verification that keeps them that way.
Implemented in `apps/web/Dockerfile`, `apps/worker/Dockerfile`,
`apps/web/next.config.mjs`, and `scripts/verify-images.sh`.

### What the images used to ship

Both Dockerfiles ended with `COPY --from=build /app /app`, which copies
the entire build tree into the runtime image: every source file, every
devDependency (typescript, vitest, eslint, tsx), the build caches, the
test suites, the migration SQL, and pnpm itself — all owned by root and
executed as root. Closes **M-3**.

| | before | after |
|---|---|---|
| `apps/worker` | 140 MB, root, full toolchain | **67 MB**, uid 1000, no compiler or package manager |
| `apps/web` | full build tree, root | **96 MB**, uid 1000, Next standalone trace only |

### What changed

- **Non-root.** `USER node` (uid 1000, already present in `node:20-alpine`).
- **Files owned by root, readable by node.** A process that cannot rewrite
  its own code cannot persist a compromise across a restart. Set with
  `COPY --chown` rather than a later `chown -R`, which would duplicate
  every file into a new layer.
- **Minimal runtime stage.** Both runtime stages start `FROM node:20-alpine`
  rather than from the build base, so corepack and pnpm never enter the
  shipped image.
- **Production-only dependencies.** Web uses Next's `output: 'standalone'`
  trace; worker uses `pnpm deploy --prod`, then strips tests, tsconfigs,
  source maps and migration SQL. Pruning happens in the *build* stage —
  deleting a file in a later layer does not remove it from the image's
  history.
- **Health and readiness.** `/api/health` is liveness and touches nothing;
  `/api/ready` checks the database. They are separate on purpose: a
  liveness probe that checks the database turns a brief database blip into
  a simultaneous restart of every web container, which is an outage caused
  by the health check. Docker's `HEALTHCHECK` uses liveness only.
- **No secrets.** Unchanged and still verified — see C-1 and
  `scripts/check-image-secrets.sh`.

### Security headers

Set in `next.config.mjs` and verified against a running container. Closes
**M-4**.

`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
`Strict-Transport-Security` (2 years, preload), `X-DNS-Prefetch-Control: off`,
and `poweredByHeader: false`.

CSP is **report-only**, which is the decision M-4 recorded rather than an
omission. Next injects inline bootstrap scripts and styles into every
page: an enforcing policy strict enough to be worth having needs
per-request nonces threaded through the App Router, and one loose enough
to work today would need `'unsafe-inline'` in `script-src` — a policy that
permits the attack it exists to stop. Report-only cannot break checkout
and produces the violation data needed to write the enforcing version.
The policy allows `checkout.razorpay.com` (script) and `api.razorpay.com`
(frame), because Razorpay Checkout needs both and blocking either one
breaks paying for things.

### Logger redaction

Closes **M-5**. `packages/observability/src/redact.ts` — every `meta`
object passes through `redact()` before it reaches the console.

The fix is deliberately invisible at the call site. The most natural line
anyone will write here is `logger.error('capture failed', { order })`, and
the author of that line should not have to know which of an order's fields
are safe to print. Redaction is **key-based**, not value-based: a field
name is a stable, reviewable contract, whereas scanning values for things
that look like emails misses an unusually formatted phone number and
redacts an order id containing an `@`. Identifiers that correlate a log
line to a transaction (`orderId`, `razorpayPaymentId`, `correlationId`)
are explicitly allowlisted, because a log you cannot correlate is not
worth writing. Output is one JSON line per call, so a `meta` value cannot
smuggle a newline in and forge a second log entry.

### Verification

```bash
scripts/verify-images.sh
```

Builds both images and asserts eleven properties: non-root, files not
writable by the runtime user, no package manager, no devDependencies, no
test or build-config files, no migration SQL, no `.env`, every bundled
workspace package loadable, a declared `HEALTHCHECK`, and — delegated to
`check-image-secrets.sh` — no secrets in any layer.

Every property here was true of these Dockerfiles at some point and then
quietly stopped being true. None of the regressions that broke them would
read as a security change in a diff review.

> **Two known failures, both pre-existing and neither introduced by this
> pass.** See "Gaps that are not findings, but are facts" below.

## What the architecture does get right

These are load-bearing and should not be weakened:

- **The browser has no price authority.** Amounts come from the server catalogue; a tampered client body is rejected, not honoured. See [PAYMENTS.md](PAYMENTS.md).
- **The browser has no entitlement authority.** `currentAccess()` returns anonymous rather than trusting a cookie nothing validates — it fails toward checkout, never toward access. `apps/web/src/server/access.ts`
- **Secrets are validated at boot**, not on first request. `loadEnv()` throws on a missing or malformed variable, so a misconfigured process dies immediately instead of failing a live payment.
- **Raw-body verification is type-enforced.** `rawBody: string | Buffer` makes the intended misuse — passing a parsed object — a compile error.
- **Database-enforced invariants.** One captured payment per order, amount equality between payment and order, frozen order financials, no Meta event without a capture. An application bug cannot write past them.

## Gaps that are not findings, but are facts

- **There is no authentication anywhere in this repository.** No user model, no session, no login. The dashboard at `/` is unauthenticated. Every per-tenant concept in [MONETIZATION.md](MONETIZATION.md) assumes an identity layer that does not exist.
- **The web image cannot be built.** `apps/web/app/page.tsx` and
  `apps/web/app/(dashboard)/page.tsx` both resolve to `/` — a route group
  adds no path segment — so `next build` fails with `Export encountered
  errors on following paths: /(dashboard)/page: /`. Which page owns `/`
  (the public ₹99 funnel entry, or the operator dashboard) is a product
  decision, not a technical one, and it is unmade. The Dockerfile itself
  is verified sound: with the colliding route group set aside, the image
  builds and passes 11/11 checks.
- **The worker's workspace dependencies cannot be loaded by Node.** Every
  `@acos/*` package sets `"main": "src/index.ts"`, so `require('@acos/config')`
  from the compiled worker executes TypeScript as CommonJS and dies with
  `SyntaxError: Unexpected token 'export'`. Today this is latent only
  because `apps/worker/src/index.ts` is a Phase 2 placeholder that imports
  nothing; it becomes a startup crash the moment the poll loop is wired
  up. `apps/web` is unaffected — Next's tracer compiles the workspace
  sources into the standalone bundle. Fixing it means giving those
  packages a build step and pointing `main` at the output, which is a
  packaging change beyond a container pass. `scripts/verify-images.sh`
  now detects it.
- `ANTHROPIC_API_KEY` is not in `packages/config/src/env.ts`, so the boot-time validation that protects every other secret does not cover it.

## Order of work

1. `.dockerignore` and `.gitignore` — minutes, and they are the difference between secrets shipping or not.
2. H-2 rate limit, before the checkout endpoint is publicly reachable.
3. H-3's standing test, before anyone writes the webhook handler.
