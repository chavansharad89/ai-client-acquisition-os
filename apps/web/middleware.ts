import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { ensureVisitorCookie } from './src/server/visitor';

// Mints the first-party visitor-id cookie (B-10) before any matched page
// or route handler runs. This is the ONLY thing this middleware does —
// no auth, no redirects — because Next.js Server Components cannot write
// cookies during render (see src/server/visitor.ts), and the cookie must
// already exist by the time the upsell page or create-order route reads
// it. Scoped to exactly the paths PCG-1/3A/3B instrumentation touches,
// not every request, since nothing else needs this cookie.
export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  ensureVisitorCookie(request, response);
  return response;
}

export const config = {
  matcher: ['/upsell/:path*', '/api/payments/create-order', '/opportunities/:path*'],
};
