import type { DiscoveryProvider } from '@acos/core-discovery';
import type { ResearchProvider } from '@acos/core-research';

// Real, production DiscoveryProvider/ResearchProvider implementations now
// exist (Phase 18: @acos/core-discovery's googlePlacesProvider,
// @acos/core-research's anthropicResearchProvider) and are wired in
// ../index.ts's boot. These stubs remain for an environment without real
// credentials (tests, local dev without API keys): they make that gap
// loud rather than silent — a claimed Search fails visibly, recorded in
// last_error, retried up to the bounded budget, then FAILED — instead of
// a worker fabricating results.

export class ProviderNotConfiguredError extends Error {
  constructor(providerName: string) {
    super(
      `${providerName} is not configured in this environment (see apps/worker/src/index.ts ` +
        `for how the real, production ${providerName} is wired — it needs credentials this ` +
        `process was not given). Supply a real ${providerName} via SearchWorkerDeps to ` +
        `process Searches here.`,
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

/** Shape matches SearchWorkerDeps.researchProvider's per-owner factory (Phase 18). */
export function notConfiguredResearchProviderFactory(): (userId: string) => ResearchProvider {
  return () => ({
    async research() {
      throw new ProviderNotConfiguredError('ResearchProvider');
    },
  });
}
