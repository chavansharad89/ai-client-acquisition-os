-- 0032_order_visitor_id
-- =======================================================================
-- Visitor-identity bridge on orders (B-10), authorized under
-- CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
--
-- PCG-1's demonstrated-intent evidence is the server-authoritative
-- PENDING Order row itself (B-11a/B-11c) — this column is what lets that
-- evidence be tied back to the visitor who created it, via a NEW
-- first-party cookie (never _fbp). No merge with an authenticated user
-- identity happens here (ED-2, deferred); nullable, no FK.
--
-- Additive only.
-- =======================================================================

ALTER TABLE "orders" ADD COLUMN "visitor_id" TEXT;
