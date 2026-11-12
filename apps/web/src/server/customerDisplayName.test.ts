import { PRODUCT_CATALOG } from '@acos/catalog';
import { setDisplayNameOverride } from '@acos/core-cms';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./commerceRepositories', () => ({
  commerceRepositories: vi.fn(),
}));

import { commerceRepositories } from './commerceRepositories';
import { getCustomerDisplayName } from './customerDisplayName';

describe('getCustomerDisplayName', () => {
  it('returns the catalog default when no CMS override exists', async () => {
    const rows = new Map<string, { productId: string; displayName: string; updatedAt: Date; updatedBy: string | null }>();
    const planDisplayNames = {
      async findByProductId(productId: string) {
        return rows.get(productId) ?? null;
      },
      async upsert(productId: string, displayName: string, updatedBy: string | null) {
        const row = { productId, displayName, updatedAt: new Date(), updatedBy };
        rows.set(productId, row);
        return row;
      },
    };
    vi.mocked(commerceRepositories).mockReturnValue({ planDisplayNames } as unknown as ReturnType<
      typeof commerceRepositories
    >);

    const name = await getCustomerDisplayName('ai_income_99');

    expect(name).toBe(PRODUCT_CATALOG.ai_income_99.name);
  });

  it('returns the CMS override when one has been set', async () => {
    const rows = new Map<string, { productId: string; displayName: string; updatedAt: Date; updatedBy: string | null }>();
    const planDisplayNames = {
      async findByProductId(productId: string) {
        return rows.get(productId) ?? null;
      },
      async upsert(productId: string, displayName: string, updatedBy: string | null) {
        const row = { productId, displayName, updatedAt: new Date(), updatedBy };
        rows.set(productId, row);
        return row;
      },
    };
    vi.mocked(commerceRepositories).mockReturnValue({ planDisplayNames } as unknown as ReturnType<
      typeof commerceRepositories
    >);
    await setDisplayNameOverride({ planDisplayNames }, 'ai_income_99', 'Plus', 'admin-1');

    const name = await getCustomerDisplayName('ai_income_99');

    expect(name).toBe('Plus');
  });

  it('a later override change is reflected on the next call (no caching)', async () => {
    const rows = new Map<string, { productId: string; displayName: string; updatedAt: Date; updatedBy: string | null }>();
    const planDisplayNames = {
      async findByProductId(productId: string) {
        return rows.get(productId) ?? null;
      },
      async upsert(productId: string, displayName: string, updatedBy: string | null) {
        const row = { productId, displayName, updatedAt: new Date(), updatedBy };
        rows.set(productId, row);
        return row;
      },
    };
    vi.mocked(commerceRepositories).mockReturnValue({ planDisplayNames } as unknown as ReturnType<
      typeof commerceRepositories
    >);

    await setDisplayNameOverride({ planDisplayNames }, 'ai_income_99', 'Plus', 'admin-1');
    expect(await getCustomerDisplayName('ai_income_99')).toBe('Plus');

    await setDisplayNameOverride({ planDisplayNames }, 'ai_income_99', 'Starter', 'admin-1');
    expect(await getCustomerDisplayName('ai_income_99')).toBe('Starter');
  });

  it('a retired, non-CMS-eligible product id still resolves to its catalog default', async () => {
    const planDisplayNames = {
      async findByProductId() {
        return null;
      },
      async upsert(productId: string, displayName: string, updatedBy: string | null) {
        return { productId, displayName, updatedAt: new Date(), updatedBy };
      },
    };
    vi.mocked(commerceRepositories).mockReturnValue({ planDisplayNames } as unknown as ReturnType<
      typeof commerceRepositories
    >);

    const name = await getCustomerDisplayName('ai_client_acquisition_1499');

    expect(name).toBe(PRODUCT_CATALOG.ai_client_acquisition_1499.name);
  });
});
