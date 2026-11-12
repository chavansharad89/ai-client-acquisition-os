import { createAnthropicResearchModel } from './anthropicModel';
import { createGeminiResearchModel } from './geminiModel';
import { createOpenAIResearchModel } from './openAIModel';
import type { ResearchModel } from './researcher';

// Provider + model selection (requirement/
// MULTI_MODEL_RESEARCH_PROVIDER_DECISION_REVIEW.md Decision 1/§8).
// -----------------------------------------------------------------------
// This is the ONE place in the codebase allowed to branch on provider
// identity. Everything above this file — researchLead(), schema.ts,
// provenance.ts, ResearchProvider, and every downstream package — stays
// completely unaware of which provider produced a ResearchModel; they
// only ever see the ResearchModel interface. Provider selection happens
// once, at construction time, by choosing which concrete adapter to
// build — never as a runtime check inside shared orchestration or
// business logic.
// -----------------------------------------------------------------------

export const RESEARCH_PROVIDER_NAMES = ['anthropic', 'openai', 'gemini'] as const;
export type ResearchProviderName = (typeof RESEARCH_PROVIDER_NAMES)[number];

export function isResearchProviderName(value: string): value is ResearchProviderName {
  return (RESEARCH_PROVIDER_NAMES as readonly string[]).includes(value);
}

/** An unrecognized provider name was selected — a configuration fault, never an attacker's doing. */
export class UnknownResearchProviderError extends Error {
  constructor(readonly provider: string) {
    super(
      `unknown research provider "${provider}" — expected one of: ${RESEARCH_PROVIDER_NAMES.join(', ')}`,
    );
    this.name = 'UnknownResearchProviderError';
  }
}

/**
 * The selected provider's credential was not supplied. Thrown when that
 * specific provider is actually instantiated — never at environment/boot
 * validation for a provider nobody selected (see
 * requirement/MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md §9): an
 * Anthropic-only deployment must keep booting with OPENAI_API_KEY/
 * GEMINI_API_KEY absent.
 */
export class MissingResearchProviderCredentialError extends Error {
  constructor(
    readonly provider: ResearchProviderName,
    readonly envVar: string,
  ) {
    super(
      `research provider "${provider}" was selected but its credential (${envVar}) was not ` +
        'supplied. Set it, or select a different RESEARCH_PROVIDER/RESEARCH_FALLBACK_PROVIDER.',
    );
    this.name = 'MissingResearchProviderCredentialError';
  }
}

/**
 * OpenAI/Gemini require an explicit model identifier — unlike Anthropic,
 * no default is assumed (requirement/MULTI_MODEL_RESEARCH_PROVIDER_REQUIREMENT.md
 * §7: exact model identifiers are deliberately not prescribed without an
 * authoritative source).
 */
export class MissingResearchModelError extends Error {
  constructor(readonly provider: ResearchProviderName) {
    super(
      `research provider "${provider}" was selected but no model was supplied — set ` +
        'RESEARCH_MODEL (or RESEARCH_FALLBACK_MODEL for a fallback selection); no default is assumed for this provider.',
    );
    this.name = 'MissingResearchModelError';
  }
}

/**
 * Selection + credential configuration. Every field is optional except
 * `provider` — the caller (apps/worker's boot wiring) supplies only the
 * credentials it actually has; a credential for a provider that was not
 * selected is simply unused, never validated.
 */
export interface ResearchModelConfig {
  provider: ResearchProviderName;
  /** Provider-specific model identifier. Falls back to each adapter's own default (Anthropic only — OpenAI/Gemini require one explicitly, see their own modules). */
  model?: string;
  anthropicApiKey?: string;
  openAIApiKey?: string;
  geminiApiKey?: string;
}

/**
 * Builds the ResearchModel for one selected provider. This function, and
 * only this function, knows that "anthropic" | "openai" | "gemini" map to
 * concrete adapters — everything it returns is the same provider-neutral
 * `ResearchModel` interface.
 */
export function createResearchModel(config: ResearchModelConfig): ResearchModel {
  switch (config.provider) {
    case 'anthropic': {
      if (!config.anthropicApiKey?.trim()) {
        throw new MissingResearchProviderCredentialError('anthropic', 'ANTHROPIC_API_KEY');
      }
      return createAnthropicResearchModel({
        apiKey: config.anthropicApiKey,
        ...(config.model ? { model: config.model } : {}),
      });
    }
    case 'openai': {
      if (!config.openAIApiKey?.trim()) {
        throw new MissingResearchProviderCredentialError('openai', 'OPENAI_API_KEY');
      }
      if (!config.model?.trim()) {
        throw new MissingResearchModelError('openai');
      }
      return createOpenAIResearchModel({ apiKey: config.openAIApiKey, model: config.model });
    }
    case 'gemini': {
      if (!config.geminiApiKey?.trim()) {
        throw new MissingResearchProviderCredentialError('gemini', 'GEMINI_API_KEY');
      }
      if (!config.model?.trim()) {
        throw new MissingResearchModelError('gemini');
      }
      return createGeminiResearchModel({ apiKey: config.geminiApiKey, model: config.model });
    }
    default: {
      // Exhaustiveness guard: config.provider is typed to
      // ResearchProviderName, but a caller resolving it from untyped
      // config (e.g. env parsing gone wrong) reaches this branch.
      throw new UnknownResearchProviderError(config.provider as string);
    }
  }
}
