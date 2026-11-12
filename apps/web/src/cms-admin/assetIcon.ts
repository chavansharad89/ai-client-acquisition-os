import { FileText, Film, Wrench } from 'lucide-react';

// Extracted from RoadmapSection.tsx (Phase 1H): RoadmapSection.tsx is
// 'use client', and Next.js's RSC loader turns every export of a
// 'use client' module into a client reference -- including a plain,
// non-component function -- so a Server Component importing assetIcon
// from there gets a reference object, not the function, and calling it
// throws "is not a function" at render time. Lives here instead so both
// RoadmapSection.tsx (client) and the Server Component
// CustomerRoadmapView.tsx can import the real function.
export function assetIcon(assetKind: string | null) {
  if (assetKind === 'VIDEO') return Film;
  if (assetKind === 'PROJECT') return Wrench;
  return FileText;
}
