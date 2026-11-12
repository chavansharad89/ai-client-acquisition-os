import { PRODUCT_CATALOG } from '@acos/catalog';
import { describe, expect, it } from 'vitest';

import { resolveDisplayName } from './displayName';
import { fakePlanDisplayNameRepository } from './testing/fakePlanDisplayNameRepository';

describe('resolveDisplayName', () => {
  it('falls back to the catalog default when no CMS override exists', async () => {
    const deps = { planDisplayNames: fakePlanDisplayNameRepository() };

    const name = await resolveDisplayName(deps, 'ai_income_99');

    expect(name).toBe(PRODUCT_CATALOG.ai_income_99.name);
  });

  it('returns the CMS override when one has been set', async () => {
    const repo = fakePlanDisplayNameRepository();
    await repo.upsert('ai_income_99', 'Plus', 'admin-1');
    const deps = { planDisplayNames: repo };

    const name = await resolveDisplayName(deps, 'ai_income_99');

    expect(name).toBe('Plus');
  });

  it('resolves each product independently -- renaming one does not affect another', async () => {
    const repo = fakePlanDisplayNameRepository();
    await repo.upsert('ai_income_99', 'Plus', 'admin-1');
    const deps = { planDisplayNames: repo };

    const proName = await resolveDisplayName(deps, 'ai_freelancing_499');
    const maxName = await resolveDisplayName(deps, 'ai_client_acquisition_1499_subscription');

    expect(proName).toBe(PRODUCT_CATALOG.ai_freelancing_499.name);
    expect(maxName).toBe(PRODUCT_CATALOG.ai_client_acquisition_1499_subscription.name);
  });

  it('updating the override does not change the underlying ProductId or catalog entry', async () => {
    const repo = fakePlanDisplayNameRepository();
    const deps = { planDisplayNames: repo };

    await repo.upsert('ai_income_99', 'Plus', 'admin-1');
    await resolveDisplayName(deps, 'ai_income_99');

    // The catalog itself is untouched -- PRODUCT_CATALOG is frozen and
    // this module never writes to it (PO-1: SKU identity is immutable
    // and independent of display name).
    expect(PRODUCT_CATALOG.ai_income_99.id).toBe('ai_income_99');
    expect(PRODUCT_CATALOG.ai_income_99.name).not.toBe('Plus');
  });

  it('a later rename is reflected on the next resolve (no caching of a stale name)', async () => {
    const repo = fakePlanDisplayNameRepository();
    const deps = { planDisplayNames: repo };

    await repo.upsert('ai_income_99', 'Plus', 'admin-1');
    expect(await resolveDisplayName(deps, 'ai_income_99')).toBe('Plus');

    await repo.upsert('ai_income_99', 'Starter', 'admin-1');
    expect(await resolveDisplayName(deps, 'ai_income_99')).toBe('Starter');
  });
});
