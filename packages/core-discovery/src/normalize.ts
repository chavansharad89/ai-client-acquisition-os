import type { DiscoveryCandidate } from './provider';

export interface NormalizedCandidate {
  name: string;
  /**
   * Global Entity Architecture (C-1; Q5_CLOSURE §4.3): null for a
   * website-less candidate accepted via `{ requireWebsite: false }` —
   * the `service.ts` discovery path only. Every OTHER caller
   * (`intentIntake.ts`) keeps the default `requireWebsite: true` and
   * therefore never observes a null value here; K1 is unaffected.
   */
  normalizedDomain: string | null;
}

/**
 * Deterministic identity key (PFR-10): lower-cased hostname with
 * protocol, a leading "www.", port, path/query/fragment and a trailing
 * dot stripped. Two different URLs for the same site normalize
 * identically. Returns null for an unusable value (empty, unparsable)
 * rather than persisting a guessed identity.
 */
export function normalizeDomain(rawWebsite: string): string | null {
  const trimmed = rawWebsite.trim();
  if (!trimmed) return null;

  const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let hostname: string;
  try {
    hostname = new URL(withProtocol).hostname;
  } catch {
    return null;
  }

  const normalized = hostname
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/^www\./, '');
  return normalized.length > 0 ? normalized : null;
}

export interface NormalizeCandidateOptions {
  /**
   * Global Entity Architecture (CF-GLOBAL-ENTITY-ARCH-PO-DEC-001 C-1;
   * Q5_CLOSURE §4.3 caller audit). Defaults to `true`, preserving this
   * function's exact original behavior for every caller that does not
   * pass this option — specifically `intentIntake.ts`'s
   * `recordIntentIntakeForOwner()` (the K1-adjacent, authorization-
   * evidence-gated intake path), which must keep throwing
   * `IntentSignalValidationError` for a missing/unparseable website and
   * must NEVER silently start accepting website-less candidates.
   *
   * `service.ts`'s open-discovery path (`runDiscoveryForOwner`) is the
   * ONLY caller authorized to pass `{ requireWebsite: false }` — a
   * missing website there is no longer treated as unusable (C-1:
   * no-website ≠ exclusion). A website that IS present but fails to
   * parse into a usable domain still fails normalization either way —
   * relaxation only ever applies to a wholly ABSENT website, never to a
   * malformed one.
   */
  requireWebsite?: boolean;
}

/**
 * Converts one provider-shaped candidate into the internal representation
 * (R-07). Returns null — skip, do not persist — for a candidate missing a
 * name, or (when `requireWebsite` is true, the default) missing/unusable
 * website. Bad provider output must not corrupt the store.
 *
 * Overloaded so the default/`requireWebsite: true` call site (every
 * caller except service.ts — notably intentIntake.ts) keeps a
 * non-nullable `normalizedDomain: string` in its own type, with no cast
 * required: that invariant is real (this function returns `null`
 * outright whenever a required website is missing/unusable), and the
 * type system can express it precisely once the two call shapes are
 * distinguished.
 */
export function normalizeCandidate(
  candidate: DiscoveryCandidate,
  options?: { requireWebsite?: true },
): { name: string; normalizedDomain: string } | null;
export function normalizeCandidate(
  candidate: DiscoveryCandidate,
  options: { requireWebsite: false },
): { name: string; normalizedDomain: string | null } | null;
export function normalizeCandidate(
  candidate: DiscoveryCandidate,
  options?: NormalizeCandidateOptions,
): NormalizedCandidate | null {
  const name = candidate.name?.trim();
  if (!name) return null;

  const requireWebsite = options?.requireWebsite ?? true;

  if (!candidate.website) {
    if (requireWebsite) return null;
    return { name, normalizedDomain: null };
  }

  const normalizedDomain = normalizeDomain(candidate.website);
  if (!normalizedDomain) {
    // A website that IS present but fails to parse is never accepted,
    // regardless of requireWebsite — only a wholly absent website is
    // relaxed by C-1.
    return null;
  }

  return { name, normalizedDomain };
}
