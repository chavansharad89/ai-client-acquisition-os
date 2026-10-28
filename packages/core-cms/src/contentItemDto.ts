import type { ContentItem } from './types';

// HTTP-response shaping for ContentItem -- not a new storage/validation
// abstraction, just the "what is safe to hand to a browser" boundary
// CMS-PO-010(R2)'s admin-upload-completion response and the existing
// customer-facing GET /api/cms/content[/[id]] routes both need.
// `storageKey`/`previousStorageKey` are R2 object keys -- internal
// provider detail, never a client's business, per CMS-PO-010(R2)'s "never
// expose ... raw storage keys" rule (the same rule the R2 adapter itself
// already upholds for credentials).

export type PublicContentItem = Omit<ContentItem, 'storageKey' | 'previousStorageKey'>;

/** Strips the fields above from `item`. The only place either field name may be removed -- every HTTP route returning a ContentItem to a browser should call this instead of returning the repository row directly. */
export function toPublicContentItem(item: ContentItem): PublicContentItem {
  const { storageKey: _storageKey, previousStorageKey: _previousStorageKey, ...rest } = item;
  return rest;
}
