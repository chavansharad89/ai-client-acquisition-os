export { runSearchWorkerPollLoop } from './pollLoop';
export type { SearchWorkerPollLoopDeps } from './pollLoop';

export { claimAndProcessNextSearch, DEFAULT_SEARCH_LEASE_DURATION_MS } from './worker';
export type { SearchAttemptOutcome, SearchWorkerDeps } from './worker';

export {
  IntentIntakeSearchNotFoundError,
  recordIntentIntakeForOwner,
  recordIntentSignalForOwner,
} from './intentIntake';
export type { IntentIntakeDeps, IntentIntakeResult, SingleIntentIntakeResult } from './intentIntake';

export {
  notConfiguredDiscoveryProvider,
  notConfiguredResearchProviderFactory,
  ProviderNotConfiguredError,
} from './providers';
