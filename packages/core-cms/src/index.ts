export { resolveDisplayName } from './displayName';
export type { DisplayNameDeps } from './displayName';

export { createPgPlanDisplayNameRepository } from './planDisplayNameRepository';
export type {
  PlanDisplayNameRepository,
  SqlClient as PlanDisplayNameSqlClient,
} from './planDisplayNameRepository';

export type { PlanDisplayName } from './types';

export { fakePlanDisplayNameRepository } from './testing/fakePlanDisplayNameRepository';

export { createPgContentItemRepository } from './contentItemRepository';
export type {
  ContentItemRepository,
  SqlClient as ContentItemSqlClient,
} from './contentItemRepository';

export type {
  ContentItem,
  ContentNodeType,
  ContentLifecycleStatus,
  NewContentItem,
  NewContainerContentItem,
  NewAssetContentItem,
  NewReplacementAssetItem,
} from './types';

export { fakeContentItemRepository } from './testing/fakeContentItemRepository';
export { FakeUniqueViolationError } from './testing/fakeContentItemRepository';

export { publishReplacementTransaction } from './contentReplacementTransaction';
export type { SqlPool, PublishReplacementInput } from './contentReplacementTransaction';

export { createPgObsoleteObjectRepository } from './obsoleteObjectRepository';
export type {
  ObsoleteObjectRepository,
  ObsoleteContentObject,
  NewObsoleteContentObject,
} from './obsoleteObjectRepository';

export { createPgUploadSessionRepository } from './uploadSessionRepository';
export type {
  UploadSessionRepository,
  UploadSession,
  NewUploadSession,
} from './uploadSessionRepository';
export { fakeUploadSessionRepository } from './testing/fakeUploadSessionRepository';

export type { AssetStorage, UploadAuthorization, DownloadAuthorization, StoredObjectMetadata } from './assetStorage';
export { fakeAssetStorage } from './testing/fakeAssetStorage';
export type { FakeAssetStorage } from './testing/fakeAssetStorage';

export {
  createR2AssetStorage,
  R2ConfigError,
  UPLOAD_AUTHORIZATION_TTL_SECONDS,
  DOWNLOAD_AUTHORIZATION_TTL_SECONDS,
} from './r2AssetStorage';
export type { R2AssetStorageConfig } from './r2AssetStorage';

export {
  MAX_ASSET_BYTES,
  validateAssetCandidate,
  buildAssetStorageKey,
  parseAssetStorageKey,
  assetKindForExtension,
  normalizeAssetExtension,
} from './assetValidation';
export type { AssetCandidate, ParsedAssetStorageKey } from './assetValidation';

export { toPublicContentItem } from './contentItemDto';
export type { PublicContentItem } from './contentItemDto';

export {
  requestAssetUploadAuthorization,
  completeAssetUpload,
  publishReplacement,
} from './assetIngestionService';
export type {
  AssetIngestionServiceDeps,
  RequestAssetUploadAuthorizationInput,
  AssetUploadAuthorization,
  CompleteAssetUploadInput,
  CompleteNewAssetInput,
  CompleteReplacementAssetInput,
} from './assetIngestionService';

export { isCmsEligibleProduct } from './cmsEligibility';

export { setDisplayNameOverride } from './displayNameService';
export type { DisplayNameServiceDeps } from './displayNameService';

export {
  createContainer,
  createAsset,
  getContentItem,
  listChildren,
  listRoots,
  listByOwningProduct,
  updateContentMetadata,
  setLifecycleStatus,
  archiveContentItem,
} from './contentService';
export type { ContentServiceDeps } from './contentService';

export {
  listPublishedContentForPlans,
  getPublishedContentItemForPlans,
} from './customerContentService';
export type { CustomerContentServiceDeps } from './customerContentService';

export { createPgCmsAdminRepository } from './cmsAdminRepository';
export type {
  CmsAdminRepository,
  SqlClient as CmsAdminSqlClient,
} from './cmsAdminRepository';
export type { CmsAdmin } from './types';
export { fakeCmsAdminRepository } from './testing/fakeCmsAdminRepository';

export { requireCmsAdmin, NotCmsAdminError } from './cmsAdminAuthorization';
export type { CmsAdminAuthorizationDeps } from './cmsAdminAuthorization';

export { CmsValidationError } from './errors';
export type { CmsValidationReason } from './errors';
