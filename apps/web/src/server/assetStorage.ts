import { loadEnv } from '@acos/config';
import { createR2AssetStorage, type AssetStorage } from '@acos/core-cms';

// Shared R2-backed AssetStorage singleton for the CMS admin asset-upload
// HTTP routes (apps/web/app/api/cms/admin/assets/**).
// -----------------------------------------------------------------------
// Mirrors db.ts's lazy-singleton shape exactly: not constructed until
// first called, so a deployment with no R2_* configured still boots --
// createR2AssetStorage() (@acos/core-cms) only throws R2ConfigError the
// first time an admin actually calls an upload route, matching every
// other optional-provider credential in this app (RESEND_API_KEY etc.).
// -----------------------------------------------------------------------

let storage: AssetStorage | null = null;

export function getAssetStorage(): AssetStorage {
  if (!storage) {
    const env = loadEnv();
    storage = createR2AssetStorage({
      bucketName: env.R2_BUCKET_NAME ?? '',
      ...(env.R2_ACCOUNT_ID !== undefined ? { accountId: env.R2_ACCOUNT_ID } : {}),
      ...(env.R2_ACCESS_KEY_ID !== undefined ? { accessKeyId: env.R2_ACCESS_KEY_ID } : {}),
      ...(env.R2_SECRET_ACCESS_KEY !== undefined ? { secretAccessKey: env.R2_SECRET_ACCESS_KEY } : {}),
    });
  }
  return storage;
}

/** Test seam. Not exported from any route. */
export function __setAssetStorageForTests(next: AssetStorage | null): void {
  storage = next;
}
