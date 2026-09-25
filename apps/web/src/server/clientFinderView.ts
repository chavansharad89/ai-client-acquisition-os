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
}

export async function resolveBusinessIdentity(
  repos: ClientFinderRepositories,
  userId: string,
  prospectId: string,
): Promise<BusinessIdentity> {
  const prospect = await repos.prospects.getById(userId, prospectId);
  if (!prospect) return { companyName: null, searchId: null };
  const company = await repos.companies.getById(userId, prospect.companyId);
  return { companyName: company?.name ?? null, searchId: prospect.searchId };
}
