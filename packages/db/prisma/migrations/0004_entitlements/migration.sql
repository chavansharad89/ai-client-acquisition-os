-- 0004_entitlements
-- =======================================================================
-- The backend entitlement model. There was none: the schema stored
-- customer and product data denormalised on `orders` and stopped there,
-- so nothing recorded WHO MAY ACCESS WHAT.
--
-- IDENTITY: there is no users table and no authentication in this system,
-- and adding either is a much larger decision than this funnel needs. The
-- subject of an entitlement is therefore the CUSTOMER EMAIL, which is
-- already collected at checkout, already validated, and already the
-- address the product is delivered to.
--
-- Email is an identifier, not a credential — knowing an address must not
-- grant access. Proof of ownership is an opaque access token (see
-- access_tokens below) that is emailed to the buyer and exchanged for a
-- cookie. Access is therefore never decided by anything the browser
-- stores about itself.
-- =======================================================================


-- ---- entitlements ----------------------------------------------------
--
-- One row per (customer, product) that the customer may use.
--
-- The unique index is what makes DUPLICATE PURCHASE safe: granting twice
-- for the same customer and product is a no-op rather than a second row,
-- so a replayed webhook, a second order, or a retried grant all converge
-- on one entitlement.

CREATE TABLE "entitlements" (
    "id"             TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "product_slug"   TEXT NOT NULL,

    -- Provenance: which order paid for this. Kept so support can answer
    -- "why does this person have access?" without guesswork.
    "order_id"       TEXT NOT NULL,

    "granted_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Revocation sets a timestamp rather than deleting the row:
    -- entitlement history is audit-relevant (refunds, chargebacks).
    "revoked_at"     TIMESTAMP(3),
    "revoked_reason" TEXT,

    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id"),
    -- createOrder lowercases the email via Zod; this makes that an
    -- invariant of the table rather than a habit of one code path, so
    -- "Buyer@x.com" can never become a second, separate customer.
    CONSTRAINT "entitlements_email_lowercase" CHECK ("customer_email" = lower("customer_email")),
    CONSTRAINT "entitlements_revoked_after_granted"
        CHECK ("revoked_at" IS NULL OR "revoked_at" >= "granted_at")
);

CREATE UNIQUE INDEX "entitlements_customer_product_key"
    ON "entitlements"("customer_email", "product_slug");
CREATE INDEX "entitlements_order_id_idx" ON "entitlements"("order_id");
CREATE INDEX "entitlements_customer_email_idx" ON "entitlements"("customer_email");

ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- An entitlement may not exist without money actually taken, for the same
-- reason a Meta Purchase may not (migration 0003). The webhook handler is
-- not written yet; this holds whatever it eventually does.

CREATE OR REPLACE FUNCTION enforce_entitlement_requires_capture()
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
      'entitlement_requires_captured_payment: order % has no CAPTURED payment',
      NEW.order_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entitlements_require_capture ON entitlements;
CREATE TRIGGER entitlements_require_capture
  BEFORE INSERT OR UPDATE OF order_id ON entitlements
  FOR EACH ROW EXECUTE FUNCTION enforce_entitlement_requires_capture();


-- The granted entitlement must be for the product that was actually
-- bought on that order. Without this, a bug in the handler could sell the
-- 99-rupee kit and grant the 1499-rupee one.

CREATE OR REPLACE FUNCTION enforce_entitlement_matches_order_product()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ordered_slug TEXT;
  ordered_email TEXT;
BEGIN
  SELECT product_slug, lower(customer_email) INTO ordered_slug, ordered_email
    FROM orders WHERE id = NEW.order_id;

  IF NEW.product_slug <> ordered_slug THEN
    RAISE EXCEPTION
      'entitlement_matches_order_product: entitlement % does not match order product % on order %',
      NEW.product_slug, ordered_slug, NEW.order_id
      USING ERRCODE = '23514';
  END IF;

  IF NEW.customer_email <> ordered_email THEN
    RAISE EXCEPTION
      'entitlement_matches_order_customer: entitlement customer % does not match order customer on order %',
      NEW.customer_email, NEW.order_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entitlements_match_order ON entitlements;
CREATE TRIGGER entitlements_match_order
  BEFORE INSERT OR UPDATE OF product_slug, customer_email, order_id ON entitlements
  FOR EACH ROW EXECUTE FUNCTION enforce_entitlement_matches_order_product();


-- ---- access_tokens ---------------------------------------------------
--
-- Proof that the person at the keyboard is the customer.
--
-- Only the SHA-256 of the token is stored. A database leak therefore
-- discloses no usable access token, exactly as with a password digest —
-- and unlike a password, these are high-entropy and never reused, so a
-- plain digest without a work factor is the right trade.

CREATE TABLE "access_tokens" (
    "id"             TEXT NOT NULL,
    "token_hash"     TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,

    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"     TIMESTAMP(3) NOT NULL,
    "last_used_at"   TIMESTAMP(3),
    "revoked_at"     TIMESTAMP(3),

    CONSTRAINT "access_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "access_tokens_email_lowercase" CHECK ("customer_email" = lower("customer_email")),
    CONSTRAINT "access_tokens_expiry_after_creation" CHECK ("expires_at" > "created_at")
);

CREATE UNIQUE INDEX "access_tokens_token_hash_key" ON "access_tokens"("token_hash");
CREATE INDEX "access_tokens_customer_email_idx" ON "access_tokens"("customer_email");
CREATE INDEX "access_tokens_expires_at_idx" ON "access_tokens"("expires_at");
