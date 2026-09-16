-- 0003_payment_integrity_constraints
-- =======================================================================
-- Adversarial-audit remediation. Three cross-table invariants that the
-- existing schema could not express, closing attacks 1, 6 and 7.
--
-- WHY TRIGGERS AND NOT APPLICATION CODE: the webhook handler
-- (core-payments.handleRazorpayWebhook) is not implemented yet. Every one
-- of these attacks is currently "prevented" only by that absence, which
-- is not a security control — it evaporates the moment the handler is
-- written, and it offers nothing if the handler is written incorrectly.
-- Putting the invariant in the database means it holds for ANY handler,
-- for a future admin script, and for a psql session opened by someone
-- with production credentials.
--
-- These are BEFORE triggers so a violating row is never written, and they
-- raise standard constraint-violation SQLSTATEs (23514 check_violation,
-- 23503 foreign_key_violation) so callers can distinguish them from
-- infrastructure errors.
--
-- Safe to apply to a live database: all three are additive, none rewrites
-- a table, and each takes only a brief ACCESS EXCLUSIVE lock to attach.
-- =======================================================================


-- ---- 1. A payment must be for its order's exact amount and currency ----
--
-- CLOSES ATTACK 1 ("buy a 99 rupee product while paying 1 rupee") and the
-- payment half of ATTACK 6.
--
-- createOrder already takes the amount from @acos/catalog and never from
-- the request body, so the ORDER's amount is trustworthy. What was
-- missing is anything tying the PAYMENT to it: a handler that believed
-- the `amount` field in a webhook payload would have written a 100-paise
-- payment against a 9900-paise order and nothing would have objected.
--
-- Applies to every status, not just CAPTURED: a FAILED payment recorded
-- for an amount the customer was never asked for is itself a signal worth
-- refusing, and the products in this catalog are fixed-price.

CREATE OR REPLACE FUNCTION enforce_payment_matches_order()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ordered RECORD;
BEGIN
  -- FOR SHARE is load-bearing, not decoration.
  --
  -- Without it, this read takes no lock, and under READ COMMITTED the
  -- invariant this whole function exists to enforce can be violated by
  -- two ordinary transactions:
  --
  --   T1: UPDATE orders SET amount_paise = 149900 WHERE id = 'o1';
  --       -- permitted: the freeze trigger below cannot see T2's
  --       -- uncommitted payment, so "this order has no payments" is
  --       -- still true from T1's snapshot
  --   T2: INSERT INTO payments (order_id, amount_paise, ...)
  --       VALUES ('o1', 9900, ...);
  --       -- passes: this SELECT reads T1's uncommitted change as the
  --       -- OLD amount, 9900, which matches
  --   both COMMIT -> payment 9900 against order 149900.
  --
  -- Taking a share lock on the order row closes it from both directions.
  -- If T1 got there first, this statement BLOCKS until T1 commits and
  -- then re-reads the new row (READ COMMITTED re-evaluation), so the
  -- mismatch is caught here. If T2 got there first, T1's UPDATE blocks
  -- on this lock until T2 commits, and the freeze trigger below then
  -- sees the payment and rejects the UPDATE. Either way the pair cannot
  -- both succeed.
  --
  -- FOR SHARE and not FOR UPDATE: concurrent payment inserts against the
  -- same order must not serialise against each other — share locks are
  -- mutually compatible, so two payments for one order still proceed in
  -- parallel and remain governed by payments_one_captured_per_order.
  -- It is also strictly stronger than the FOR KEY SHARE that the
  -- payments_order_id_fkey check already takes on this same row, so no
  -- new lock-ordering edge is introduced.
  SELECT amount_paise, currency INTO ordered
    FROM orders WHERE id = NEW.order_id
    FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment references unknown order %', NEW.order_id
      USING ERRCODE = '23503';
  END IF;

  IF NEW.amount_paise <> ordered.amount_paise THEN
    RAISE EXCEPTION
      'payment_amount_matches_order: payment % paise does not match order % paise for order %',
      NEW.amount_paise, ordered.amount_paise, NEW.order_id
      USING ERRCODE = '23514';
  END IF;

  IF NEW.currency <> ordered.currency THEN
    RAISE EXCEPTION
      'payment_currency_matches_order: payment currency % does not match order currency % for order %',
      NEW.currency, ordered.currency, NEW.order_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_match_order ON payments;
CREATE TRIGGER payments_match_order
  BEFORE INSERT OR UPDATE OF amount_paise, currency, order_id ON payments
  FOR EACH ROW EXECUTE FUNCTION enforce_payment_matches_order();


-- ---- 2. An order's financial identity freezes once money is attached ----
--
-- CLOSES ATTACK 6 ("change the product after the Razorpay order exists").
--
-- Production code never updates orders today, but "no code does this" is
-- not a constraint. Without this, anyone able to run an UPDATE — a future
-- admin feature, a support script, a compromised credential — could
-- repoint a paid 99-rupee order at the 1499-rupee product and the
-- entitlement built from product_slug would follow.

CREATE OR REPLACE FUNCTION enforce_order_financials_frozen()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.amount_paise, NEW.currency, NEW.product_slug)
     IS DISTINCT FROM
     (OLD.amount_paise, OLD.currency, OLD.product_slug)
  THEN
    IF EXISTS (SELECT 1 FROM payments WHERE order_id = OLD.id) THEN
      RAISE EXCEPTION
        'order_financials_frozen: order % already has payments; amount, currency and product cannot change',
        OLD.id
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_financials_frozen ON orders;
CREATE TRIGGER orders_financials_frozen
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_order_financials_frozen();


-- ---- 3. A Meta Purchase event requires a captured payment -------------
--
-- CLOSES ATTACK 7 ("create a Meta Purchase without paying").
--
-- meta_events referenced orders only. Nothing required the order to have
-- been paid, so a bug — or an attacker who reached any future write path —
-- could emit Purchase conversions to Meta for unpaid orders: polluting ad
-- optimisation, inflating reported revenue, and costing real budget.
--
-- Deliberately checks for a CAPTURED payment, not merely any payment:
-- AUTHORIZED means the money is held, not taken.

CREATE OR REPLACE FUNCTION enforce_meta_event_requires_capture()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM payments
     WHERE order_id = NEW.order_id
       AND status = 'CAPTURED'
  ) THEN
    RAISE EXCEPTION
      'meta_event_requires_captured_payment: order % has no CAPTURED payment',
      NEW.order_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS meta_events_require_capture ON meta_events;
CREATE TRIGGER meta_events_require_capture
  BEFORE INSERT OR UPDATE OF order_id ON meta_events
  FOR EACH ROW EXECUTE FUNCTION enforce_meta_event_requires_capture();
