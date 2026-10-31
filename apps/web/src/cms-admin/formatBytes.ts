// Extracted from ContentInspector.tsx (Phase 1H) so the read-only
// CustomerRoadmapView can reuse the exact same formatting without
// duplicating it.
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
