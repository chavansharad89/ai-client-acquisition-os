import type { DiscoveryCandidate } from './provider';

export interface NormalizedCandidate {
  name: string;
  normalizedDomain: string;
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

/**
 * Converts one provider-shaped candidate into the internal representation
 * (R-07). Returns null — skip, do not persist — for a candidate missing a
 * name or a usable website, rather than guessing an identity for it. Bad
 * provider output must not corrupt the store.
 */
export function normalizeCandidate(candidate: DiscoveryCandidate): NormalizedCandidate | null {
  const name = candidate.name?.trim();
  if (!name) return null;

  if (!candidate.website) return null;
  const normalizedDomain = normalizeDomain(candidate.website);
  if (!normalizedDomain) return null;

  return { name, normalizedDomain };
}
