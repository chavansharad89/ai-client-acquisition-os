import { PRODUCT_LADDER } from './ladder';
import type { ProductId } from './types';

// What each kit actually contains.
// -----------------------------------------------------------------------
// The catalog owns this for the same reason it owns price: it is the
// authoritative statement of what was sold. A download route resolves an
// asset id through here, so a request can only ever name a file that this
// manifest lists — an id that is not in the manifest cannot be turned
// into a storage path, which is what keeps path traversal impossible by
// construction rather than by sanitising strings.
// -----------------------------------------------------------------------

export type AssetKind = 'pdf' | 'zip' | 'video' | 'sheet';

export interface Deliverable {
  /** Stable, opaque id. Part of the signed download grant. */
  readonly id: string;
  readonly title: string;
  readonly kind: AssetKind;
  /** Key within the content store. Never taken from a request. */
  readonly storageKey: string;
  readonly bytes: number;
}

const MANIFEST = {
  ai_income_99: [
    {
      id: 'starter-prompt-library',
      title: 'Prompt library: the ten highest-demand AI tasks',
      kind: 'pdf',
      storageKey: 'ai_income_99/prompt-library.pdf',
      bytes: 2_400_000,
    },
    {
      id: 'starter-pricing-sheet',
      title: 'Pricing sheet for first-time freelancers',
      kind: 'sheet',
      storageKey: 'ai_income_99/pricing-sheet.xlsx',
      bytes: 48_000,
    },
    {
      id: 'starter-outreach-templates',
      title: 'Two outreach templates that do not read as templates',
      kind: 'pdf',
      storageKey: 'ai_income_99/outreach-templates.pdf',
      bytes: 310_000,
    },
  ],
  ai_freelancing_499: [
    {
      id: 'launch-outreach-system',
      title: 'The outreach sequence, including the follow-ups most people skip',
      kind: 'pdf',
      storageKey: 'ai_freelancing_499/outreach-system.pdf',
      bytes: 5_100_000,
    },
    {
      id: 'launch-scope-pricing',
      title: 'Scope and pricing playbook for fixed-fee projects',
      kind: 'pdf',
      storageKey: 'ai_freelancing_499/scope-and-pricing.pdf',
      bytes: 3_700_000,
    },
    {
      id: 'launch-proposal-template',
      title: 'Proposal template that survives a procurement review',
      kind: 'zip',
      storageKey: 'ai_freelancing_499/proposal-template.zip',
      bytes: 890_000,
    },
  ],
  ai_client_acquisition_1499: [
    {
      id: 'system-acquisition-funnel',
      title: 'The acquisition funnel, end to end',
      kind: 'pdf',
      storageKey: 'ai_client_acquisition_1499/acquisition-funnel.pdf',
      bytes: 9_200_000,
    },
    {
      id: 'system-delivery-workflow',
      title: 'Delivery workflow and client handover checklists',
      kind: 'zip',
      storageKey: 'ai_client_acquisition_1499/delivery-workflow.zip',
      bytes: 4_050_000,
    },
    {
      id: 'system-automation-recipes',
      title: 'Automation recipes for follow-up, invoicing and reporting',
      kind: 'zip',
      storageKey: 'ai_client_acquisition_1499/automation-recipes.zip',
      bytes: 6_600_000,
    },
    {
      id: 'system-walkthrough',
      title: 'Full system walkthrough',
      kind: 'video',
      storageKey: 'ai_client_acquisition_1499/walkthrough.mp4',
      bytes: 412_000_000,
    },
  ],
} as const satisfies Record<ProductId, readonly Deliverable[]>;

export const DELIVERABLES: Record<ProductId, readonly Deliverable[]> = MANIFEST;

/** Everything a product ships. Empty array is never correct — every kit has content. */
export function deliverablesFor(productId: ProductId): readonly Deliverable[] {
  return DELIVERABLES[productId];
}

/**
 * Resolves an asset id WITHIN a product.
 *
 * Returns null for an unknown id rather than throwing, because the id
 * comes from a URL and an unknown one is an ordinary 404, not an
 * exceptional condition.
 */
export function findDeliverable(productId: ProductId, assetId: string): Deliverable | null {
  return DELIVERABLES[productId].find((asset) => asset.id === assetId) ?? null;
}

/** Every deliverable across the ladder, entry-level first. */
export function allDeliverables(): readonly (Deliverable & { productId: ProductId })[] {
  return PRODUCT_LADDER.flatMap((productId) =>
    DELIVERABLES[productId].map((asset) => ({ ...asset, productId })),
  );
}
