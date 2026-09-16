import { z } from 'zod';

// -----------------------------------------------------------------------
// Input contract for POST /api/payments/create-order.
//
// This is the FIRST line of validation — it checks shape and format
// only ("is this a string that looks like an email"). It deliberately
// does NOT check whether productId refers to a real product; that is a
// distinct concern handled by @acos/catalog.resolveProduct, so that
// "malformed input" and "well-formed but unknown product" are
// distinguishable failure modes with different meanings (400 vs 400 but
// a different error code — see errors.ts).
//
// CRITICAL: there is deliberately no `amount`, `amountPaise`, or `price`
// field anywhere in this schema. If a client includes one in the request
// body anyway, `z.object(...).strict()` below causes Zod to REJECT the
// whole request rather than silently ignoring the extra field — this is
// a deliberate, defense-in-depth choice: a client that sends a price at
// all is treated as a malformed/suspicious request, not humored.
// -----------------------------------------------------------------------

const phoneRegex = /^\+?[1-9]\d{7,14}$/;

export const createOrderRequestSchema = z
  .object({
    productId: z
      .string({ required_error: 'productId is required' })
      .trim()
      .min(1, 'productId must not be empty'),
    customerEmail: z
      .string({ required_error: 'customerEmail is required' })
      .trim()
      .toLowerCase()
      .email('customerEmail must be a valid email address'),
    customerPhone: z
      .string()
      .trim()
      .regex(phoneRegex, 'customerPhone must be a valid phone number (E.164-style, no spaces)')
      .optional(),
  })
  .strict();

export type CreateOrderRequestBody = z.infer<typeof createOrderRequestSchema>;
