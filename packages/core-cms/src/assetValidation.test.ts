import { describe, expect, it } from 'vitest';

import {
  buildAssetStorageKey,
  MAX_ASSET_BYTES,
  parseAssetStorageKey,
  validateAssetCandidate,
} from './assetValidation';

const APPROVED: ReadonlyArray<{ extension: string; contentType: string }> = [
  { extension: 'pdf', contentType: 'application/pdf' },
  { extension: 'docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { extension: 'xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { extension: 'pptx', contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  { extension: 'zip', contentType: 'application/zip' },
  { extension: 'jpg', contentType: 'image/jpeg' },
  { extension: 'jpeg', contentType: 'image/jpeg' },
  { extension: 'png', contentType: 'image/png' },
  { extension: 'webp', contentType: 'image/webp' },
  { extension: 'mp4', contentType: 'video/mp4' },
];

describe('validateAssetCandidate (CMS-PO-010(R2) basic validation)', () => {
  for (const { extension, contentType } of APPROVED) {
    it(`accepts ${extension.toUpperCase()}`, () => {
      expect(() => validateAssetCandidate({ extension, contentType, bytes: 1024 })).not.toThrow();
    });
  }

  it('rejects an unsupported extension', () => {
    expect(() =>
      validateAssetCandidate({ extension: 'exe', contentType: 'application/octet-stream', bytes: 1024 }),
    ).toThrow(/not in the approved allowlist/);
  });

  it('rejects a MIME type that does not match the extension (does not trust extension alone)', () => {
    expect(() => validateAssetCandidate({ extension: 'pdf', contentType: 'image/png', bytes: 1024 })).toThrow(
      /does not match extension/,
    );
  });

  it('accepts a size of exactly 500MB (inclusive boundary)', () => {
    expect(() =>
      validateAssetCandidate({ extension: 'pdf', contentType: 'application/pdf', bytes: MAX_ASSET_BYTES }),
    ).not.toThrow();
  });

  it('rejects a size over 500MB', () => {
    expect(() =>
      validateAssetCandidate({ extension: 'pdf', contentType: 'application/pdf', bytes: MAX_ASSET_BYTES + 1 }),
    ).toThrow(/exceeds/);
  });

  it('rejects a zero size', () => {
    expect(() => validateAssetCandidate({ extension: 'pdf', contentType: 'application/pdf', bytes: 0 })).toThrow(
      /positive integer/,
    );
  });

  it('rejects a negative size', () => {
    expect(() => validateAssetCandidate({ extension: 'pdf', contentType: 'application/pdf', bytes: -5 })).toThrow(
      /positive integer/,
    );
  });

  it('rejects a non-integer size', () => {
    expect(() =>
      validateAssetCandidate({ extension: 'pdf', contentType: 'application/pdf', bytes: 10.5 }),
    ).toThrow(/positive integer/);
  });
});

describe('buildAssetStorageKey / parseAssetStorageKey (CMS-PO-010(R2) Secondary Decision 3)', () => {
  it('builds the approved cms/<product>/assets/<id>.<ext> shape', () => {
    const key = buildAssetStorageKey('ai_income_99', 'session-123', 'PDF');
    expect(key).toBe('cms/ai_income_99/assets/session-123.pdf');
  });

  it('round-trips through parseAssetStorageKey', () => {
    const key = buildAssetStorageKey('ai_freelancing_499', 'abc-def', 'mp4');
    expect(parseAssetStorageKey(key)).toEqual({
      owningProductId: 'ai_freelancing_499',
      segmentId: 'abc-def',
      extension: 'mp4',
    });
  });

  it('returns null for a key not matching the approved shape', () => {
    expect(parseAssetStorageKey('not-a-cms-key.pdf')).toBeNull();
    expect(parseAssetStorageKey('cms/ai_income_99/assets/no-extension')).toBeNull();
    expect(parseAssetStorageKey('cms/ai_income_99/other/x.pdf')).toBeNull();
  });
});
