/**
 * Deterministic cover-art selection for the Plus Learning Path catalogue.
 * These covers are decorative presentation only — never CMS content, never
 * stored, never a new field on ContentItem — so the only requirement is
 * that the same content_items.id always maps to the same cover, stably
 * across page loads (a hash of the id, nothing persisted).
 */
export function pickCoverIndex(id: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}
