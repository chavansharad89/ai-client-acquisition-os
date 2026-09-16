/** @type {import('next').NextConfig} */

// Third-party origins this app actually talks to.
// -----------------------------------------------------------------------
// Razorpay Checkout is loaded as a script from checkout.razorpay.com and
// then renders its own payment UI in an iframe served from
// api.razorpay.com — so it needs BOTH script-src and frame-src, and
// blocking either one breaks paying for things.
//
// The Meta origins are here because src/analytics/pixel.ts calls
// `window.fbq`; nothing in this repository loads the Pixel base script
// yet, so today they are inert. Listing them costs nothing and means the
// policy does not have to be rediscovered when the loader lands.
const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com';
const RAZORPAY_FRAME = 'https://api.razorpay.com';
const RAZORPAY_API = 'https://api.razorpay.com https://lumberjack.razorpay.com';
const META_SCRIPT = 'https://connect.facebook.net';
const META_PIXEL = 'https://www.facebook.com';

// Content-Security-Policy, REPORT-ONLY on purpose.
// -----------------------------------------------------------------------
// Next.js injects inline bootstrap scripts and inline styles into every
// page. Enforcing a policy strict enough to be worth having would need
// per-request nonces threaded through the App Router; enforcing one loose
// enough to work today would mean 'unsafe-inline' in script-src, which is
// a policy that permits the attack it exists to stop.
//
// So: report-only, which cannot break checkout, and which produces the
// violation data needed to write the enforcing version. This is the
// decision recorded in docs/SECURITY.md M-4 — "CSP report-only first" —
// not an oversight. Every OTHER header below is enforced.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${RAZORPAY_SCRIPT} ${META_SCRIPT}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${META_PIXEL}`,
  `connect-src 'self' ${RAZORPAY_API} ${META_PIXEL}`,
  `frame-src ${RAZORPAY_FRAME} ${RAZORPAY_SCRIPT}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const SECURITY_HEADERS = [
  // Clickjacking. We frame Razorpay; nobody frames us. A checkout page
  // that can be framed can be overlaid, and the click that says "pay"
  // lands somewhere the customer cannot see.
  { key: 'X-Frame-Options', value: 'DENY' },

  // MIME sniffing. A JSON error body that a browser decides to treat as
  // HTML is a reflected-XSS primitive.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Referrer. Checkout and access URLs carry productId and grant tokens
  // in the path; a full Referer would hand them to every third-party
  // origin the page touches.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Nothing here uses any of these, so nothing here should be able to.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },

  // Ignored over plain HTTP, so it is safe to set unconditionally and
  // safe in local development.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

  { key: 'X-DNS-Prefetch-Control', value: 'off' },

  { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
];

const nextConfig = {
  reactStrictMode: true,

  // Emits a self-contained server bundle with only the dependencies the
  // app actually imports, traced from the entry points. This is what lets
  // the runtime image carry no pnpm, no source, no devDependencies and no
  // workspace tooling — see apps/web/Dockerfile.
  //
  // Not a behaviour change: the same server, started as
  // `node server.js` instead of `next start`.
  output: 'standalone',

  // The monorepo root, so tracing follows workspace packages out of
  // apps/web instead of stopping at its own package boundary and
  // shipping a server that cannot import @acos/*.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,

  // Prisma's query engine is a platform binary selected at runtime, not
  // an import, so dependency tracing cannot see it and the standalone
  // server dies on its first query. Naming it here is the documented
  // remedy.
  experimental: {
    outputFileTracingIncludes: {
      '**': ['../../node_modules/.pnpm/@prisma+client*/**/*.node', '../../packages/db/**/*.node'],
    },
  },

  // Version and stack are free reconnaissance.
  poweredByHeader: false,

  // The webhook route reads the raw request body itself (required for
  // Razorpay HMAC verification — see architecture §6). Body parsing
  // config, if needed for the App Router route segment, is set locally
  // in that route file, not globally here.

  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
