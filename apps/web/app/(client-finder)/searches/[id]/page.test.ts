import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// UNIT render test (fakes only — no database, no network) for the
// completed-Search "View opportunities" link. B2
// (CF-OPPORTUNITIES-SEARCH-FIRST-PO-DEC-001) requires this link to open
// this Search's own results, not the cumulative workspace.

const state = vi.hoisted(() => ({
  token: 'tok-a' as string | undefined,
  repos: {} as Record<string, unknown>,
  search: null as unknown,
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  // SearchStatusPoller (a client component) calls useRouter() during
  // render; only router.refresh() is ever invoked, and only from
  // useEffect, which renderToStaticMarkup never runs.
  useRouter: () => ({ refresh: () => {} }),
}));

vi.mock('../../../../src/server/session', () => ({
  readSessionTokenFromServerComponent: () => state.token,
}));

vi.mock('../../../../src/server/clientFinderRepositories', () => ({
  clientFinderRepositories: () => state.repos,
}));

vi.mock('@acos/core-search', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-search')>()),
  getSearch: async () => state.search,
}));

(globalThis as { React?: typeof React }).React = React;
const { default: SearchStatusPage } = await import('./page');

function fixtureSearch(status: string) {
  return {
    id: 'search_abc',
    userId: 'user_a',
    serviceProfileId: 'profile_a',
    status,
    parameters: {
      service: 'Web & Software Development',
      targetCustomer: 'anyone',
      geography: 'Mumbai',
    },
    attempts: 1,
    lastError: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    idempotencyKey: null,
    createdAt: new Date('2026-10-24T00:00:00.000Z'),
    updatedAt: new Date('2026-10-24T00:05:00.000Z'),
  };
}

beforeEach(() => {
  state.token = 'tok-a';
  state.repos = {};
});

async function renderPage(): Promise<string> {
  return renderToStaticMarkup(await SearchStatusPage({ params: { id: 'search_abc' } }));
}

describe('Search status page — B2 "View opportunities" link (CF-OPPORTUNITIES-SEARCH-FIRST-PO-DEC-001)', () => {
  it('links to /opportunities?searchId=<this search\'s id> once the Search is COMPLETE', async () => {
    state.search = fixtureSearch('COMPLETE');
    const html = await renderPage();
    expect(html).toContain('href="/opportunities?searchId=search_abc"');
  });

  it('shows no "View opportunities" link while the Search is still RUNNING', async () => {
    state.search = fixtureSearch('RUNNING');
    const html = await renderPage();
    expect(html).not.toContain('View opportunities');
  });
});
