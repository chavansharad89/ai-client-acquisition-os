import type { ClientFinderRepositories } from './clientFinderRepositories';

// Business-identity lookup for the results/detail pages.
// -----------------------------------------------------------------------
// No @acos/core-opportunity service function returns a business name —
// StoredOpportunity only carries `prospectId` (PRD V2.1 R-11/R-13's own
// boundary: Opportunity owns need/offer, not business identity).
// Prospect -> Company is @acos/core-discovery's join (R-08), and both
// repositories are exported read-only lookups
// (`ProspectRepository.getById`, `CompanyRepository.getById`), each
// already `userId`-scoped exactly like every other repository in this
// codebase. This composes those two existing, unmodified reads — it
// does not add a new join at the database layer or touch either
// package's persistence.
// -----------------------------------------------------------------------

export interface BusinessIdentity {
  companyName: string | null;
  searchId: string | null;
  /** Reused by contact-value extraction/masking (same field unlockOpportunity() already resolves via this same Prospect -> Company join) to tell a business-domain email from a personal one. */
  normalizedDomain: string | null;
}

export async function resolveBusinessIdentity(
  repos: ClientFinderRepositories,
  userId: string,
  prospectId: string,
): Promise<BusinessIdentity> {
  const prospect = await repos.prospects.getById(userId, prospectId);
  if (!prospect) return { companyName: null, searchId: null, normalizedDomain: null };
  const company = await repos.companies.getById(userId, prospect.companyId);
  return {
    companyName: company?.name ?? null,
    searchId: prospect.searchId,
    normalizedDomain: company?.normalizedDomain ?? null,
  };
}

// "Why found" (C-5/C-7) — a freelancer-facing explanation derived ONLY
// from the structured discovery provenance (`discovery_events`:
// provider, query, discoveredAt) already persisted by Global Entity
// resolution. This is NOT the ranking/ "why contact" explanation
// (OpportunityScore.reasons) — C-7's own text requires the two concepts
// stay separate. No free-text whyFound field exists or is introduced
// here; this composes two already-existing, unmodified reads
// (ProspectRepository.getById, CompanyRepository.getById) with the one
// new read-only EntityRepository.getDiscoveryEvent getter, exactly the
// same join pattern resolveBusinessIdentity above already uses.
// -----------------------------------------------------------------------

/** Maps a persisted provider code to a display label — never invents a provider that was not recorded. */
function describeProvider(provider: string): string {
  const labels: Record<string, string> = { GOOGLE_PLACES: 'Google Places' };
  return labels[provider] ?? provider;
}

/**
 * Returns a compact "Why found" string, or `null` when no DiscoveryEvent
 * row exists for this prospect's (search, entity) pair — e.g. a
 * historical Prospect/Company that predates Global Entity linking, or
 * one whose Company has no `entityId` yet. Callers must render nothing
 * in that case rather than invent an explanation.
 */
export async function resolveWhyFound(
  repos: ClientFinderRepositories,
  userId: string,
  prospectId: string,
): Promise<string | null> {
  const prospect = await repos.prospects.getById(userId, prospectId);
  if (!prospect) return null;
  const company = await repos.companies.getById(userId, prospect.companyId);
  if (!company?.entityId) return null;
  const event = await repos.entities.getDiscoveryEvent(prospect.searchId, company.entityId);
  if (!event) return null;
  return `Found through ${describeProvider(event.provider)} for "${event.query}"`;
}
