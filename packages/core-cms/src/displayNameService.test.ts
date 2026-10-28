import { PRODUCT_CATALOG } from '@acos/catalog';
import { describe, expect, it } from 'vitest';

import { resolveDisplayName } from './displayName';
import { setDisplayNameOverride } from './displayNameService';
import { fakePlanDisplayNameRepository } from './testing/fakePlanDisplayNameRepository';

describe('setDisplayNameOverride', () => {
  it('sets a CMS override for an eligible product', async () => {
    const repo = fakePlanDisplayNameRepository();
    const deps = { planDisplayNames: repo };

    await setDisplayNameOverride(deps, 'ai_income_99', 'Plus', 'admin-1');

    expect(await resolveDisplayName(deps, 'ai_income_99')).toBe('Plus');
  });

  it('updates an existing override (no caching of the stale name)', async () => {
    const repo = fakePlanDisplayNameRepository();
    const deps = { planDisplayNames: repo };

    await setDisplayNameOverride(deps, 'ai_income_99', 'Plus', 'admin-1');
    await setDisplayNameOverride(deps, 'ai_income_99', 'Starter', 'admin-1');

    expect(await resolveDisplayName(deps, 'ai_income_99')).toBe('Starter');
  });

  it('rejects a blank display name', async () => {
    const repo = fakePlanDisplayNameRepository();
    const deps = { planDisplayNames: repo };

    await expect(setDisplayNameOverride(deps, 'ai_income_99', '   ', 'admin-1')).rejects.toThrow(
      /must not be blank/,
    );
  });

  it('rejects a non-CMS-eligible product', async () => {
    const repo = fakePlanDisplayNameRepository();
    const deps = { planDisplayNames: repo };

    // ai_client_acquisition_1499 (one-time, retired) is a real ProductId
    // but not one of the three CMS plans -- it must never get a CMS
    // display-name override.
    await expect(
      setDisplayNameOverride(deps, 'ai_client_acquisition_1499', 'Max', 'admin-1'),
    ).rejects.toThrow(/not a CMS-eligible product/);
  });

  it('does not alter the underlying catalog entry or ProductId', async () => {
    const repo = fakePlanDisplayNameRepository();
    const deps = { planDisplayNames: repo };

    await setDisplayNameOverride(deps, 'ai_income_99', 'Plus', 'admin-1');

    expect(PRODUCT_CATALOG.ai_income_99.id).toBe('ai_income_99');
    expect(PRODUCT_CATALOG.ai_income_99.name).not.toBe('Plus');
  });
});
