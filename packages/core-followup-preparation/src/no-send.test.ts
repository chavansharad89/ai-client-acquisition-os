import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { hashAccessToken } from '@acos/core-entitlements';
import { type IdentityRepository, type StoredSessionToken } from '@acos/core-identity';
import { type OpportunityRepository, type StoredOpportunity } from '@acos/core-opportunity';
import type { OutreachPreparationRepository, StoredOutreachPreparation } from '@acos/core-outreach-preparation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FOLLOW_UP_PREPARATION_STATES } from './types';
import { prepareOpportunityFollowUp, type FollowUpPreparationDeps } from './service';
import { fakeFollowUpPreparationRepository } from './testSupport';

// R-68 — THE NO-SEND / NO-SCHEDULE / NO-DELIVERY SAFETY GATE. The most
// important test in this package, mirroring
// @acos/core-outreach-preparation's own no-send.test.ts (R-58) exactly.
// Two independent proofs:
//
//   1. STRUCTURAL: no source file in this package imports a transport
//      library, calls a global transport function, or references a
//      send/schedule-implying name. Verified by reading this package's
//      own committed source, not by trusting the import graph indirectly.
//   2. RUNTIME: the full token-authenticated service path (generate ->
//      persist -> return) is exercised end-to-end with `globalThis.fetch`
//      replaced by a poisoned stub that throws if invoked. The path
//      completes successfully and the stub is never called.
// -----------------------------------------------------------------------

const NOW = new Date('2026-09-01T00:00:00.000Z');

const SRC_DIR = dirname(fileURLToPath(import.meta.url));

// Matches actual code constructs (import/require sites, a `fetch(` call),
// never prose — comment lines are stripped before matching (below), so
// this file's own doc comments explaining what is absent (e.g. "no SMTP")
// can never trip it.
const TRANSPORT_PATTERN =
  /\bfetch\s*\(|require\(\s*['"](https?|node:https?)['"]\s*\)|from\s+['"](https?|node:https?)['"]|from\s+['"][^'"]*(nodemailer|smtp|twilio|sendgrid|axios|puppeteer|playwright|aws-sdk|@sendgrid|@aws-sdk|node-cron|bull|bullmq|agenda)[^'"]*['"]/i;
const SEND_FUNCTION_NAME_PATTERN =
  /\bexport\s+(async\s+)?function\s+(send|dispatch|deliver|transmit|schedule)\w*/i;

function sourceFiles(): string[] {
  return readdirSync(SRC_DIR)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map((name) => join(SRC_DIR, name));
}

/** Strips `//` line comments and `/* *\/` block comments so pattern checks below only ever see actual code. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n');
}

describe('R-68: structural no-send/no-schedule proof', () => {
  it('no source file imports or calls a transport- or scheduler-capable dependency', () => {
    for (const file of sourceFiles()) {
      const code = stripComments(readFileSync(file, 'utf8'));
      expect(
        code,
        `${file} must not reference a transport/scheduler library or global fetch`,
      ).not.toMatch(TRANSPORT_PATTERN);
    }
  });

  it('no source file exports a send/dispatch/deliver/transmit/schedule function', () => {
    for (const file of sourceFiles()) {
      const code = stripComments(readFileSync(file, 'utf8'));
      expect(code, `${file} must not export a send/schedule-shaped function`).not.toMatch(
        SEND_FUNCTION_NAME_PATTERN,
      );
    }
  });

  it('the state vocabulary contains only PREPARED and READY_FOR_REVIEW — no SENT/DELIVERED/SCHEDULED', () => {
    expect(FOLLOW_UP_PREPARATION_STATES).toEqual(['PREPARED', 'READY_FOR_REVIEW']);
    expect(FOLLOW_UP_PREPARATION_STATES).not.toContain('SENT');
    expect(FOLLOW_UP_PREPARATION_STATES).not.toContain('DELIVERED');
    expect(FOLLOW_UP_PREPARATION_STATES).not.toContain('SCHEDULED');
  });

  it('package.json declares no transport- or scheduler-capable dependency', () => {
    const pkg = JSON.parse(readFileSync(join(SRC_DIR, '..', 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    const deps = Object.keys(pkg.dependencies);
    expect(deps).toEqual([
      '@acos/core-entitlements',
      '@acos/core-identity',
      '@acos/core-opportunity',
      '@acos/core-outreach-preparation',
      '@acos/core-personalization',
    ]);
  });

  it('does not import packages/core-outreach or packages/core-proposal (pre-existing, unwired sending/CRM infrastructure)', () => {
    for (const file of sourceFiles()) {
      const code = stripComments(readFileSync(file, 'utf8'));
      expect(code, `${file} must not import @acos/core-outreach`).not.toMatch(
        /from\s+['"]@acos\/core-outreach['"]/,
      );
      expect(code, `${file} must not import @acos/core-proposal`).not.toMatch(
        /from\s+['"]@acos\/core-proposal['"]/,
      );
    }
  });
});

describe('R-68: runtime no-send proof', () => {
  let poisonedFetch: ReturnType<typeof vi.fn>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    poisonedFetch = vi.fn(() => {
      throw new Error('no-send boundary violated: fetch was called');
    });
    globalThis.fetch = poisonedFetch as unknown as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function fakeIdentity(sessions: Record<string, StoredSessionToken>): IdentityRepository {
    return {
      async createUser() {
        throw new Error('not used by this test');
      },
      async findUserByEmail() {
        throw new Error('not used by this test');
      },
      async findSessionToken(tokenHash: string) {
        return sessions[tokenHash] ?? null;
      },
      async saveSessionToken() {
        throw new Error('not used by this test');
      },
    };
  }

  function fakeOpportunityRepository(seed: StoredOpportunity[]): OpportunityRepository {
    return {
      async create() {
        throw new Error('not used by this test');
      },
      async getById(userId: string, id: string) {
        return seed.find((row) => row.id === id && row.userId === userId) ?? null;
      },
      async findByProspectId() {
        throw new Error('not used by this test');
      },
      async list() {
        throw new Error('not used by this test');
      },
      async updateStaleness() {
        throw new Error('not used by this test');
      },
    };
  }

  function fakeOutreachPreparationRepository(
    seed: StoredOutreachPreparation[],
  ): OutreachPreparationRepository {
    return {
      async upsert() {
        throw new Error('not used by this test');
      },
      async getByOpportunityId(_userId: string, opportunityId: string) {
        return seed.find((row) => row.opportunityId === opportunityId) ?? null;
      },
      async listByUserId() {
        throw new Error('not used by this test');
      },
    };
  }

  it('generate -> persist -> return completes with zero calls to a poisoned fetch', async () => {
    const opportunity: StoredOpportunity = {
      id: 'opportunity_1',
      userId: 'user_a',
      prospectId: 'prospect_1',
      state: 'NEW',
      needDetected: true,
      offer: {
        service: 'Website development',
        rationale: 'They need a website refresh.',
        estimatedValuePaise: 15_000_000,
        fit: 80,
        basedOn: ['needs a website redesign'],
      },
      staleness: 'FRESH',
      stalenessComputedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    const outreachPreparation: StoredOutreachPreparation = {
      id: 'outreach_preparation_1',
      opportunityId: 'opportunity_1',
      prospectId: 'prospect_1',
      sourcePersonalizationId: 'personalization_1',
      state: 'READY_FOR_REVIEW',
      subjectLine: 'Website development — a quick note',
      messageBody: 'Acme Co — your homepage shows needs a website redesign.',
      callToAction: 'Would you be open to a short conversation about Website development?',
      evidence: [
        {
          signalId: 'signal_1',
          field: 'companySummary',
          kind: 'WEBSITE',
          classification: 'OBSERVED',
          signal: 'needs a website redesign',
          confidence: 88,
          basis: null,
        },
      ],
      generatorVersion: 'outreach-preparation-v1',
      generatedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    };

    const deps: FollowUpPreparationDeps = {
      identity: fakeIdentity({
        [hashAccessToken('token-a')]: {
          userId: 'user_a',
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: null,
        },
      }),
      opportunities: fakeOpportunityRepository([opportunity]),
      outreachPreparations: fakeOutreachPreparationRepository([outreachPreparation]),
      followUpPreparations: fakeFollowUpPreparationRepository([opportunity]),
    };

    const stored = await prepareOpportunityFollowUp(deps, 'token-a', 'opportunity_1', NOW);

    expect(stored).not.toBeNull();
    expect(stored!.state).toBe('READY_FOR_REVIEW');
    expect(poisonedFetch).not.toHaveBeenCalled();
  });
});
