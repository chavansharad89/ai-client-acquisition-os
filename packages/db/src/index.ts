export { prisma } from './client';
export * from '@prisma/client';

// Repository functions (e.g. findPaymentByRazorpayId, insertOutboxEvent)
// intentionally do NOT exist yet. Per the architecture spec, only
// @acos/core-payments and @acos/core-capi are permitted to write to
// payment-related tables, and they will own their own repository
// wrappers around `prisma` when Phase 1 begins. This package exposes
// only the client + generated types.
