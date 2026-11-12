import Link from 'next/link';

// Minimal cross-page navigation for the Client Finder route group (Phase
// 2, Part 4) — a small, reused link row rather than a new nav framework
// or a shared layout.tsx (neither existed before this change).

export function ClientFinderNav() {
  return (
    <p className="hint">
      <Link href="/opportunities">Opportunities</Link> · <Link href="/searches/new">New search</Link>
    </p>
  );
}
