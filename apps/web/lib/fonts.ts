import { Inter } from 'next/font/google';

// Scoped to the Tailwind v4/shadcn foundation only (see
// styles/tailwind-foundation.css's --font-sans). Apply `inter.variable`
// on the wrapping element of a route group that imports that
// stylesheet — next/font scopes the resulting CSS variable to that
// element's subtree, so existing plain-CSS routes are unaffected.
export const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
