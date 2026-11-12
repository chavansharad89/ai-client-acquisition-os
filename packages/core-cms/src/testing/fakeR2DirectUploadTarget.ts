import { createHash } from 'node:crypto';

import type { R2DirectUploadTarget, R2ObjectMetadata } from '../legacyAssetR2Migration';

// In-memory R2DirectUploadTarget fake, mirroring fakeAssetStorage.ts's
// shape: a seedable, mutable in-memory store behind the same interface
// the real R2 adapter implements -- including a real MD5-based `etag`,
// computed from the actual bytes passed to `putObject`, so a test can
// genuinely exercise the content-checksum comparison
// (`migratePlusLegacyAssetsToR2`'s `isIdentical`/`describeMismatch`)
// rather than only its size/content-type fields.
//
// This fake does NOT itself simulate the conditional-write race
// (`PreconditionFailedError`) -- that needs a *sequence* (headObject
// sees absent, then something else writes, then putObject runs), which
// a plain map can't represent without a hook. Tests that need to
// exercise that path override `target.putObject`/`target.headObject`
// directly (see legacyAssetR2Migration.test.ts).

function md5Hex(body: Buffer): string {
  return createHash('md5').update(body).digest('hex');
}

export function fakeR2DirectUploadTarget(
  seed: Readonly<Record<string, R2ObjectMetadata>> = {},
): R2DirectUploadTarget {
  const objects = new Map(Object.entries(seed));

  return {
    async headObject(key) {
      return objects.get(key) ?? null;
    },

    async putObject(key, body, contentType) {
      objects.set(key, { bytes: body.length, contentType, etag: md5Hex(body) });
    },
  };
}
