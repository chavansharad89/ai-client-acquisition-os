import { describe, expect, it } from 'vitest';

import { NotCmsAdminError, requireCmsAdmin } from './cmsAdminAuthorization';
import { fakeCmsAdminRepository } from './testing/fakeCmsAdminRepository';

describe('requireCmsAdmin', () => {
  it('succeeds for a user with cms_admins membership', async () => {
    const cmsAdmins = fakeCmsAdminRepository([
      { userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' },
    ]);

    const admin = await requireCmsAdmin({ cmsAdmins }, 'user-admin');

    expect(admin.userId).toBe('user-admin');
  });

  it('rejects an authenticated user with no cms_admins membership', async () => {
    const cmsAdmins = fakeCmsAdminRepository([
      { userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' },
    ]);

    await expect(requireCmsAdmin({ cmsAdmins }, 'user-customer')).rejects.toBeInstanceOf(
      NotCmsAdminError,
    );
  });

  it('rejects an unknown/nonexistent user', async () => {
    const cmsAdmins = fakeCmsAdminRepository([]);

    await expect(requireCmsAdmin({ cmsAdmins }, 'user-does-not-exist')).rejects.toBeInstanceOf(
      NotCmsAdminError,
    );
  });

  it('checks membership using exactly the server-resolved userId passed in, not any other identifier', async () => {
    const cmsAdmins = fakeCmsAdminRepository([
      { userId: 'user-real-admin', createdAt: new Date(), createdBy: 'operator-1' },
    ]);

    // A caller cannot satisfy the check by supplying a different-looking
    // value (e.g. an email, or a client-claimed id) -- only the exact
    // userId string that findByUserId looks up matters.
    await expect(requireCmsAdmin({ cmsAdmins }, 'admin@example.test')).rejects.toBeInstanceOf(
      NotCmsAdminError,
    );
    await expect(requireCmsAdmin({ cmsAdmins }, 'user-real-admin')).resolves.toMatchObject({
      userId: 'user-real-admin',
    });
  });

  it('no entitlement/subscription/payment state can grant admin access -- the only dependency is cmsAdmins', async () => {
    // CmsAdminAuthorizationDeps has exactly one field. There is no way
    // to pass a subscriptionPeriods/entitlements repository into
    // requireCmsAdmin that would influence its result -- demonstrated
    // here by a user who is NOT in cms_admins still being rejected
    // regardless of any other state the caller might hold.
    const cmsAdmins = fakeCmsAdminRepository([]);

    await expect(requireCmsAdmin({ cmsAdmins }, 'user-with-active-max-subscription')).rejects.toBeInstanceOf(
      NotCmsAdminError,
    );
  });

  it('revoking membership (removing the row) causes a subsequent check to fail -- no caching', async () => {
    const beforeRevocation = fakeCmsAdminRepository([
      { userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' },
    ]);
    await expect(requireCmsAdmin({ cmsAdmins: beforeRevocation }, 'user-admin')).resolves.toBeDefined();

    // Membership revoked (operator deletes the row) -- modeled here as
    // a fresh repository with no seeded row, since the real repository
    // is read-only and revocation happens directly against the
    // database, not through this module. The point under test is that
    // requireCmsAdmin performs a live lookup every call and has nothing
    // of its own to invalidate.
    const afterRevocation = fakeCmsAdminRepository([]);
    await expect(requireCmsAdmin({ cmsAdmins: afterRevocation }, 'user-admin')).rejects.toBeInstanceOf(
      NotCmsAdminError,
    );
  });
});
