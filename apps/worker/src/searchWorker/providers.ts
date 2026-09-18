import type { DiscoveryProvider } from '@acos/core-discovery';
import type { ResearchProvider } from '@acos/core-research';

// No real, production DiscoveryProvider or ResearchProvider exists
// anywhere in this repository — a pre-existing, carried-forward gap, not
// something R-34 introduces or is scoped to fix.
//
// DiscoveryProvider's own doc comment (@acos/core-discovery/src/provider.ts)
// states plainly that a real external provider integration is "not
// required by V2.1 for this phase" (see MVP_SCOPE_BOUNDARY.md).
// ResearchProvider's own doc comment (@acos/core-research/src/provider.ts)
// says its defining phase "only fixes the boundary" — a real
// implementation needs a source-document-gathering capability (see
// core-research's `researchInputSchema.sourceDocuments`) that does not
// exist anywhere in this codebase. Building either is a new
// discovery/research algorithm, not worker orchestration, and is
// explicitly out of R-34's scope (see the Phase 17 scope lock's Pipeline
// Dependency Graph).
//
// These stubs make that gap loud rather than silent: a claimed Search
// fails visibly — recorded in last_error, retried up to the bounded
// budget, then FAILED — instead of a worker fabricating results. When a
// real provider exists, wiring it in requires no change to
// ./worker.ts's orchestration, only supplying it via SearchWorkerDeps.

export class ProviderNotConfiguredError extends Error {
  constructor(providerName: string) {
    super(
      `${providerName} is not configured: no production implementation exists in this ` +
        `repository yet (see requirement/PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md's Pipeline ` +
        `Dependency Graph). Building one is out of R-34's orchestration-only scope. Supply a ` +
        `real ${providerName} via SearchWorkerDeps to process Searches in this environment.`,
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

export function notConfiguredDiscoveryProvider(): DiscoveryProvider {
  return {
    async discover() {
      throw new ProviderNotConfiguredError('DiscoveryProvider');
    },
  };
}

export function notConfiguredResearchProvider(): ResearchProvider {
  return {
    async research() {
      throw new ProviderNotConfiguredError('ResearchProvider');
    },
  };
}
