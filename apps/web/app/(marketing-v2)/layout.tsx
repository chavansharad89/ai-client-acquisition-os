import type { ReactNode } from 'react';

import { inter } from '../../lib/fonts';

import '../../styles/tailwind-foundation.css';

// Isolated Tailwind v4 + shadcn/ui foundation for NEW routes only.
// -----------------------------------------------------------------------
// This route group's CSS is its own bundle chunk, loaded only for pages
// nested under it. Existing routes (checkout, dashboard, client-finder,
// marketing) are untouched and keep rendering from the plain-CSS token
// system in app/globals.css, imported by the root layout, as before.
//
// Background/foreground color is applied to this wrapper rather than to
// `body`, which the root layout owns and every route shares.
export default function MarketingV2Layout({ children }: { children: ReactNode }) {
  return <div className={`${inter.variable} bg-background font-sans text-foreground`}>{children}</div>;
}
