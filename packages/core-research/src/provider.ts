import type { LeadResearch } from './schema';

/**
 * What the Research Foundation gives a research provider to work with —
 * deliberately independent of any vendor (R-09): a real implementation
 * may wrap @acos/core-research's existing Anthropic-backed engine
 * (./anthropicModel, ./researcher) or any other source; this phase only
 * fixes the boundary, mirroring @acos/core-discovery's DiscoveryProvider.
 */
export interface ResearchProviderInput {
  prospectId: string;
  companyId: string;
  companyName: string;
  normalizedDomain: string;
}

/**
 * The external research source, behind a provider-independent boundary.
 * Returns the already-schema-validated result shape this package's
 * schema.ts defines (classification, evidence and provenance obligations
 * are that schema's concern, not this boundary's).
 */
export interface ResearchProvider {
  research(input: ResearchProviderInput): Promise<LeadResearch>;
}
