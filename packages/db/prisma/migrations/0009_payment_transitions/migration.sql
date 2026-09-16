-- 0009_payment_transitions
-- =======================================================================
-- Payment status is a state machine. Until now it was a free-text column
-- with an enum type: every transition was legal, in both directions, at
-- any time.
--
-- Three gaps, each reproduced against a real database before this was
-- written:
--
--   1. UPDATE payments SET status='FAILED' on a CAPTURED row succeeded.
--      A captured payment could be silently un-captured.
--   2. UPDATE payments SET order_id=<other> on a CAPTURED row succeeded
--      whenever the other order happened to carry the same amount —
--      payments_match_order compares the payment to its NEW order and is
--      satisfied by any order of the same price.
--   3. Flipping a captured payment to REFUNDED left the order's Meta
--      Purchase event in place, referencing an order with no capture.
--      meta_events_require_capture fires on meta_events, so nothing was
--      watching the payments side of that relationship.
--
-- No application code updates payments today — the webhook only INSERTs.
-- That is exactly why these belong in the database: the first UPDATE this
-- system ever runs will be written by someone who does not have these
-- three facts in their head, probably during an incident.
--
-- WHAT THIS DOES NOT DO: it does not decide what a refund MEANS. The
-- transition CAPTURED -> REFUNDED is permitted because the enum has had
-- the value since 0001 and a state machine that cannot reach it is not a
-- state machine. Whether a refund revokes entitlement, emits a Meta
-- refund event, or reverses reported revenue is business policy that is
-- not frozen, and inventing it here would be worse than leaving it
-- visibly undecided.
-- =======================================================================


-- ---- 1. Legal status transitions --------------------------------------
--
--   AUTHORIZED -> CAPTURED   money held becomes money taken
--   AUTHORIZED -> FAILED     the hold was released or expired
--   CAPTURED   -> REFUNDED   the only way out of CAPTURED
--   FAILED     -> (none)     terminal
--   REFUNDED   -> (none)     terminal
--
-- Notably absent, and deliberately:
--   CAPTURED -> AUTHORIZED / FAILED   money cannot un-take itself
--   FAILED -> CAPTURED                a failed payment does not revive;
--                                     a real retry is a NEW payment id
--   AUTHORIZED -> REFUNDED            nothing was captured to refund
--
-- A no-op update (status unchanged) is always allowed, so an UPDATE that
-- touches other columns does not have to avoid mentioning this one.

CREATE OR REPLACE FUNCTION enforce_payment_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'AUTHORIZED' AND NEW.status IN ('CAPTURED', 'FAILED')) OR
    (OLD.status = 'CAPTURED'   AND NEW.status = 'REFUNDED')
  ) THEN
    RAISE EXCEPTION
      'payment_status_transition: % -> % is not a legal payment transition (payment %). '
      'Legal: AUTHORIZED->CAPTURED, AUTHORIZED->FAILED, CAPTURED->REFUNDED. '
      'Money that has been taken cannot un-take itself, and a failed payment does not '
      'revive — a genuine retry is a new payment id.',
      OLD.status, NEW.status, OLD.id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_status_transition ON payments;
CREATE TRIGGER payments_status_transition
  BEFORE UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION enforce_payment_status_transition();


-- ---- 2. A captured payment's identity is frozen ------------------------
--
-- payments_match_order (0003) already stops an amount drifting away from
-- its order, but it validates the payment against whatever order it now
-- points at — so moving a captured payment to a DIFFERENT order of the
-- same price satisfied it. That is not a mismatch; it is a reassignment,
-- and it silently moves a customer's money to somebody else's order.
--
-- Once money has been taken, the payment's identity stops being editable:
-- which order it paid for, how much, in what currency, and under which
-- provider id.

CREATE OR REPLACE FUNCTION enforce_captured_payment_frozen()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only guards rows that were ALREADY captured. A payment being captured
  -- for the first time (AUTHORIZED -> CAPTURED) may still settle its
  -- fields on the way in.
  IF OLD.status <> 'CAPTURED' THEN
    RETURN NEW;
  END IF;

  IF NEW.order_id IS DISTINCT FROM OLD.order_id THEN
    RAISE EXCEPTION
      'captured_payment_frozen: payment % is CAPTURED against order % and cannot be moved '
      'to order %. Reassigning captured money is not an edit; it is a transfer.',
      OLD.id, OLD.order_id, NEW.order_id
      USING ERRCODE = '23514';
  END IF;

  IF NEW.amount_paise IS DISTINCT FROM OLD.amount_paise
     OR NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION
      'captured_payment_frozen: payment % is CAPTURED; amount and currency are immutable '
      '(% % -> % %).',
      OLD.id, OLD.amount_paise, OLD.currency, NEW.amount_paise, NEW.currency
      USING ERRCODE = '23514';
  END IF;

  IF NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id THEN
    RAISE EXCEPTION
      'captured_payment_frozen: payment % is CAPTURED; its provider payment id is the '
      'evidence the capture happened and cannot be rewritten.',
      OLD.id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_captured_frozen ON payments;
CREATE TRIGGER payments_captured_frozen
  BEFORE UPDATE OF order_id, amount_paise, currency, razorpay_payment_id ON payments
  FOR EACH ROW EXECUTE FUNCTION enforce_captured_payment_frozen();


-- ---- 3. A Meta Purchase cannot be orphaned -----------------------------
--
-- meta_events_require_capture (0003) enforces this relationship from the
-- meta_events side, which covers creating an event without a capture. It
-- cannot see the other direction: removing the capture out from under an
-- event that already exists.
--
-- This is the missing half. It fires on the PAYMENTS side, so the pair
-- together make the invariant hold no matter which table moves.
--
-- Deliberately checks only whether SOME captured payment remains for the
-- order, not this specific one: an order with two payment attempts where
-- one is refunded and another captured still has a genuine capture behind
-- its Purchase event.

CREATE OR REPLACE FUNCTION enforce_meta_event_keeps_capture()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only a row leaving CAPTURED can orphan anything.
  IF OLD.status <> 'CAPTURED' OR NEW.status = 'CAPTURED' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM meta_events WHERE order_id = OLD.order_id)
     AND NOT EXISTS (
       SELECT 1 FROM payments
        WHERE order_id = OLD.order_id
          AND status = 'CAPTURED'
          AND id <> OLD.id
     )
  THEN
    RAISE EXCEPTION
      'meta_event_keeps_capture: order % has a Meta Purchase event, and payment % is its '
      'only CAPTURED payment. Moving it to % would leave a reported conversion with no '
      'payment behind it. Decide what the refund means for the reported conversion first.',
      OLD.order_id, OLD.id, NEW.status
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_keep_meta_capture ON payments;
CREATE TRIGGER payments_keep_meta_capture
  BEFORE UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION enforce_meta_event_keeps_capture();
