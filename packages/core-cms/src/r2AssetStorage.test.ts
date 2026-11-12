import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';

import {
  createR2AssetStorage,
  DOWNLOAD_AUTHORIZATION_TTL_SECONDS,
  R2ConfigError,
  UPLOAD_AUTHORIZATION_TTL_SECONDS,
} from './r2AssetStorage';

// Adapter-level translation tests, mirroring anthropicModel.test.ts's
// approach: a fake `client`/`signUrl` is injected (never a real R2
// credential or network call), and assertions check what this adapter
// actually sends to the S3-compatible API, not the AWS SDK itself.

function fakeStorage(overrides: { send?: ReturnType<typeof vi.fn>; signUrl?: ReturnType<typeof vi.fn> } = {}) {
  const send = overrides.send ?? vi.fn();
  const signUrl = overrides.signUrl ?? vi.fn(async () => 'https://r2.example.test/signed');
  const storage = createR2AssetStorage({
    bucketName: 'cms-assets',
    client: { send } as never,
    signUrl,
  });
  return { storage, send, signUrl };
}

describe('createR2AssetStorage — configuration', () => {
  it('throws R2ConfigError when bucketName is missing, even with a client injected', () => {
    expect(() => createR2AssetStorage({ bucketName: '', client: {} as never })).toThrow(R2ConfigError);
  });

  it('throws R2ConfigError naming the missing env var when no client is injected', () => {
    expect(() => createR2AssetStorage({ bucketName: 'cms-assets' })).toThrow(/R2_ACCOUNT_ID/);
  });

  it('throws for each missing credential field without a client, one at a time', () => {
    expect(() => createR2AssetStorage({ bucketName: 'b', accountId: 'acct' })).toThrow(/R2_ACCESS_KEY_ID/);
    expect(() =>
      createR2AssetStorage({ bucketName: 'b', accountId: 'acct', accessKeyId: 'key' }),
    ).toThrow(/R2_SECRET_ACCESS_KEY/);
  });

  it('never includes a credential value in its error message', () => {
    try {
      createR2AssetStorage({ bucketName: 'b', accountId: 'acct', accessKeyId: 'key', secretAccessKey: '' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(R2ConfigError);
      expect((error as Error).message).not.toContain('acct');
      expect((error as Error).message).not.toContain('key');
    }
  });

  it('does not require accountId/accessKeyId/secretAccessKey when a client is injected', () => {
    expect(() => createR2AssetStorage({ bucketName: 'cms-assets', client: {} as never })).not.toThrow();
  });
});

describe('createR2AssetStorage — createUploadAuthorization', () => {
  it('signs a PutObjectCommand for exactly the given bucket/key/contentType', async () => {
    const { storage, signUrl } = fakeStorage();
    const result = await storage.createUploadAuthorization('cms/prod-1/assets/seg-1.pdf', 'application/pdf', 500 * 1024 * 1024);

    expect(signUrl).toHaveBeenCalledTimes(1);
    const [, command, options] = signUrl.mock.calls[0] as [unknown, PutObjectCommand, { expiresIn: number }];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: 'cms-assets',
      Key: 'cms/prod-1/assets/seg-1.pdf',
      ContentType: 'application/pdf',
    });
    expect(options.expiresIn).toBe(UPLOAD_AUTHORIZATION_TTL_SECONDS);
    expect(result.uploadUrl).toBe('https://r2.example.test/signed');
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns only uploadUrl/expiresAt — no credentials in the DTO', async () => {
    const { storage } = fakeStorage();
    const result = await storage.createUploadAuthorization('cms/p/assets/s.png', 'image/png', 1024);
    expect(Object.keys(result).sort()).toEqual(['expiresAt', 'uploadUrl']);
  });
});

describe('createR2AssetStorage — headObject', () => {
  it('maps a found object\'s actual ContentLength/ContentType', async () => {
    const send = vi.fn(async (_input: unknown) => ({ ContentLength: 2048, ContentType: 'image/webp' }));
    const { storage } = fakeStorage({ send });

    const result = await storage.headObject('cms/p/assets/s.webp');

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0]?.[0] as HeadObjectCommand;
    expect(command).toBeInstanceOf(HeadObjectCommand);
    expect(command.input).toMatchObject({ Bucket: 'cms-assets', Key: 'cms/p/assets/s.webp' });
    expect(result).toEqual({ bytes: 2048, contentType: 'image/webp' });
  });

  it('returns null for a 404 (no object at that key), the normal "not uploaded yet" outcome', async () => {
    const notFound = Object.assign(new Error('not found'), { name: 'NotFound' });
    const send = vi.fn(async () => {
      throw notFound;
    });
    const { storage } = fakeStorage({ send });

    await expect(storage.headObject('cms/p/assets/missing.pdf')).resolves.toBeNull();
  });

  it('returns null for a $metadata.httpStatusCode === 404 shape too', async () => {
    const notFound = Object.assign(new Error('not found'), { $metadata: { httpStatusCode: 404 } });
    const send = vi.fn(async () => {
      throw notFound;
    });
    const { storage } = fakeStorage({ send });

    await expect(storage.headObject('cms/p/assets/missing.pdf')).resolves.toBeNull();
  });

  it('rethrows any other error (e.g. access denied) rather than treating it as "not found"', async () => {
    const denied = Object.assign(new Error('access denied'), { name: 'AccessDenied' });
    const send = vi.fn(async () => {
      throw denied;
    });
    const { storage } = fakeStorage({ send });

    await expect(storage.headObject('cms/p/assets/s.pdf')).rejects.toThrow('access denied');
  });
});

describe('createR2AssetStorage — createDownloadAuthorization', () => {
  it('signs a GetObjectCommand for exactly the given key with a fixed one-hour expiry', async () => {
    const { storage, signUrl } = fakeStorage();
    const result = await storage.createDownloadAuthorization('cms/p/assets/s.pdf', 10);

    expect(signUrl).toHaveBeenCalledTimes(1);
    const [, command, options] = signUrl.mock.calls[0] as [unknown, GetObjectCommand, { expiresIn: number }];
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input).toMatchObject({ Bucket: 'cms-assets', Key: 'cms/p/assets/s.pdf' });
    expect(options.expiresIn).toBe(DOWNLOAD_AUTHORIZATION_TTL_SECONDS);
    expect(DOWNLOAD_AUTHORIZATION_TTL_SECONDS).toBe(3600);
    expect(result.downloadUrl).toBe('https://r2.example.test/signed');
  });

  it('ignores a caller-supplied ttlSeconds — the approved 1-hour expiry is not caller-overridable', async () => {
    const { storage, signUrl } = fakeStorage();
    await storage.createDownloadAuthorization('cms/p/assets/s.pdf', 999999);
    const [, , options] = signUrl.mock.calls[0] as [unknown, GetObjectCommand, { expiresIn: number }];
    expect(options.expiresIn).toBe(3600);
  });

  it('returns only downloadUrl/expiresAt — no credentials in the DTO', async () => {
    const { storage } = fakeStorage();
    const result = await storage.createDownloadAuthorization('cms/p/assets/s.pdf', 3600);
    expect(Object.keys(result).sort()).toEqual(['downloadUrl', 'expiresAt']);
  });
});

describe('createR2AssetStorage — deleteObject', () => {
  it('deletes exactly the given bucket/key, nothing else', async () => {
    const send = vi.fn(async (_input: unknown) => ({}));
    const { storage } = fakeStorage({ send });

    await storage.deleteObject('cms/p/assets/old.pdf');

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0]?.[0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({ Bucket: 'cms-assets', Key: 'cms/p/assets/old.pdf' });
  });
});
