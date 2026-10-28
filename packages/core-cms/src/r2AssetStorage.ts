import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as defaultGetSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { AssetStorage, DownloadAuthorization, StoredObjectMetadata, UploadAuthorization } from './assetStorage';

// CMS-PO-010(R2) -- the Cloudflare R2 AssetStorage adapter.
// -----------------------------------------------------------------------
// The only file in this package that imports an R2/S3 SDK. Everything
// else (assetValidation.ts, assetIngestionService.ts,
// contentReplacementTransaction.ts) depends only on the provider-agnostic
// AssetStorage interface (assetStorage.ts) and is unaffected by this file
// existing. R2 exposes an S3-compatible API, so this is built on
// @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner pointed at R2's
// S3-compatible endpoint (https://<accountId>.r2.cloudflarestorage.com,
// region "auto") -- no Cloudflare-specific SDK is needed.
//
// Mirrors createAnthropicResearchModel's (anthropicModel.ts) shape:
// config is passed in explicitly, never read from process.env by this
// module -- the caller supplies loadEnv().R2_* -- and a `client`/`signUrl`
// can be injected to make this fully testable without real credentials.
// -----------------------------------------------------------------------

/** Thrown for missing/blank R2 configuration -- a wiring fault, never an attacker's doing. Never includes a credential VALUE, only the names of the missing fields. */
export class R2ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'R2ConfigError';
  }
}

/** Admin direct-upload URL lifetime. Not fixed by a PO decision (unlike the 1-hour customer download below) -- an engineering default for "the admin is actively uploading right now," short enough to limit a leaked URL's usefulness. */
export const UPLOAD_AUTHORIZATION_TTL_SECONDS = 15 * 60;

/** Customer download signed-URL lifetime (CMS-PO-010(R2)-B / Secondary Decision: "exactly 1 hour"). Fixed at the provider boundary rather than left to whatever a caller passes, so the approved security property holds regardless of what a future HTTP layer requests. */
export const DOWNLOAD_AUTHORIZATION_TTL_SECONDS = 60 * 60;

export interface R2AssetStorageConfig {
  /** Cloudflare account id -- builds the R2 S3-compatible endpoint. Required unless `client` is supplied. */
  accountId?: string;
  /** R2 API token access key id. Required unless `client` is supplied. Secret. */
  accessKeyId?: string;
  /** R2 API token secret. Required unless `client` is supplied. Secret. */
  secretAccessKey?: string;
  /** R2 bucket name. Always required -- the bucket is supplied per-request to the S3-compatible API, not baked into the client, so an injected `client` does not make this optional. */
  bucketName: string;
  /** Injected S3Client for tests. When omitted, one is constructed from accountId/accessKeyId/secretAccessKey. */
  client?: S3Client;
  /** Injected signer for tests (defaults to @aws-sdk/s3-request-presigner's getSignedUrl). Never used to reach a real network in a unit test. */
  signUrl?: (
    client: S3Client,
    command: PutObjectCommand | GetObjectCommand,
    options: { expiresIn: number },
  ) => Promise<string>;
}

type RequiredConfigKey = 'accountId' | 'accessKeyId' | 'secretAccessKey';

/** The env var each required-unless-client field corresponds to -- surfaced in R2ConfigError so the message tells a deployer exactly what to set, matching loadEnv()'s "KEY NAMES only, never values" convention (packages/config/src/env.ts). */
const ENV_VAR_NAMES: Record<RequiredConfigKey, string> = {
  accountId: 'R2_ACCOUNT_ID',
  accessKeyId: 'R2_ACCESS_KEY_ID',
  secretAccessKey: 'R2_SECRET_ACCESS_KEY',
};

function requireConfigValue(config: R2AssetStorageConfig, key: RequiredConfigKey): string {
  const value = config[key];
  if (!value || !value.trim()) {
    throw new R2ConfigError(
      `createR2AssetStorage needs ${ENV_VAR_NAMES[key]} (pass loadEnv().${ENV_VAR_NAMES[key]}) ` +
        'or an injected client. It will not read the ambient environment. Values are deliberately not shown.',
    );
  }
  return value.trim();
}

/** AWS SDK v3's shape for a HeadObjectCommand 404 -- distinguishes "no object at this key" (returns null, a normal outcome) from any other failure (rethrown). */
function isObjectNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const name = (error as { name?: unknown }).name;
  if (name === 'NotFound' || name === 'NoSuchKey') return true;
  const statusCode = (error as { $metadata?: { httpStatusCode?: unknown } }).$metadata?.httpStatusCode;
  return statusCode === 404;
}

/**
 * Builds the R2-backed AssetStorage adapter (CMS-PO-010(R2) Phase 3).
 *
 * `bucketName` is always required. `accountId`/`accessKeyId`/`secretAccessKey`
 * are required unless `client` is supplied (tests inject `client` and
 * `signUrl` instead; see r2AssetStorage.test.ts) -- this module never reads
 * process.env itself, matching createAnthropicResearchModel's convention.
 */
export function createR2AssetStorage(config: R2AssetStorageConfig): AssetStorage {
  if (!config.bucketName || !config.bucketName.trim()) {
    throw new R2ConfigError(
      'createR2AssetStorage needs R2_BUCKET_NAME (pass loadEnv().R2_BUCKET_NAME). ' +
        'The bucket is supplied per-request to R2, so an injected client does not make this optional.',
    );
  }
  const bucketName = config.bucketName.trim();

  const client =
    config.client ??
    new S3Client({
      region: 'auto',
      endpoint: `https://${requireConfigValue(config, 'accountId')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireConfigValue(config, 'accessKeyId'),
        secretAccessKey: requireConfigValue(config, 'secretAccessKey'),
      },
    });
  const signUrl = config.signUrl ?? defaultGetSignedUrl;

  return {
    async createUploadAuthorization(key, contentType, _maxBytes): Promise<UploadAuthorization> {
      // _maxBytes is accepted for interface compliance but cannot be
      // enforced by a presigned PUT -- R2/S3 presigned PUT signs a fixed
      // Content-Length, not a ceiling, and a content-length-range
      // condition is only available via presigned POST policies, whose
      // multi-field form shape does not fit this interface's single
      // uploadUrl. The 500MB ceiling is actually gated by
      // validateAssetCandidate() against headObject()'s ACTUAL size at
      // completeAssetUpload() (assetIngestionService.ts) -- the same
      // "provider metadata is authoritative" trust model this interface
      // already establishes.
      const command = new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType });
      const uploadUrl = await signUrl(client, command, { expiresIn: UPLOAD_AUTHORIZATION_TTL_SECONDS });
      return { uploadUrl, expiresAt: new Date(Date.now() + UPLOAD_AUTHORIZATION_TTL_SECONDS * 1000) };
    },

    async headObject(key): Promise<StoredObjectMetadata | null> {
      try {
        const result = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
        return {
          bytes: result.ContentLength ?? 0,
          contentType: result.ContentType ?? '',
        };
      } catch (error) {
        if (isObjectNotFound(error)) return null;
        throw error;
      }
    },

    async createDownloadAuthorization(key, _ttlSeconds): Promise<DownloadAuthorization> {
      // _ttlSeconds is part of the AssetStorage interface (provider-
      // agnostic), but CMS-PO-010(R2)-B fixes the customer download
      // signed-URL lifetime at exactly one hour -- this adapter enforces
      // that itself rather than trusting whatever a future caller passes.
      const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
      const downloadUrl = await signUrl(client, command, { expiresIn: DOWNLOAD_AUTHORIZATION_TTL_SECONDS });
      return { downloadUrl, expiresAt: new Date(Date.now() + DOWNLOAD_AUTHORIZATION_TTL_SECONDS * 1000) };
    },

    async deleteObject(key): Promise<void> {
      await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    },
  };
}
