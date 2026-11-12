import { logger } from '@acos/observability';

import { handleIntentIngress } from '../../../../src/server/intentIngress';
import { createIntentIngressIntake } from '../../../../src/server/intentIngressIntake';
import {
  createIntentIntegrationRegistry,
  INTENT_INTEGRATION_REGISTRATIONS,
  type IntentIntegrationRegistry,
} from '../../../../src/server/intentIntegrationRegistry';

// POST /api/intent-sources/push
// -----------------------------------------------------------------------
// OD-13 push-only ingress for AI-platform intent results
// (INTENT-INTAKE-OD13-INGRESS-DEC-001, Alternative I). A thin adapter over
// handleIntentIngress: raw bytes → P1 verify → P2 normalize → P3 save, in
// this process. See src/server/intentIngress.ts for the ordering.
//
// NOT LIVE: INTENT_INTEGRATION_REGISTRATIONS is empty — no integration is
// named and no key is registered — so every push is refused at P1 with a
// 401 and nothing reaches the database. The OD-13 runtime gate stays in
// force until naming, key registration and runtime wiring are each
// separately authorized.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy: `next build` imports route modules; nothing is built at import.
let registry: IntentIntegrationRegistry | null = null;
let intake: ReturnType<typeof createIntentIngressIntake> | null = null;

export async function POST(request: Request): Promise<Response> {
  registry ??= createIntentIntegrationRegistry(INTENT_INTEGRATION_REGISTRATIONS);
  intake ??= createIntentIngressIntake();
  return handleIntentIngress(request, { registry, intake, logger });
}
