import { describe, expect, it, vi } from 'vitest';

// The route as shipped: empty registrations, so it is not live for any
// integration. No database pool may be touched.

const getPool = vi.fn(() => {
  throw new Error('getPool must not be called');
});
vi.mock('../../../../src/server/db', () => ({ getPool }));

const { POST, runtime } = await import('./route');

describe('POST /api/intent-sources/push (not live)', () => {
  it('runs on the Node runtime', () => {
    expect(runtime).toBe('nodejs');
  });

  it('refuses every push with a generic 401 and never reaches the database', async () => {
    const response = await POST(
      new Request('http://localhost/api/intent-sources/push', {
        method: 'POST',
        headers: {
          'x-acos-integration-id': 'any-integration',
          'x-acos-key-id': 'any-key',
          'x-acos-signature': `${'A'.repeat(86)}==`,
        },
        body: '{"version":1}',
      }),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid signature' });
    expect(getPool).not.toHaveBeenCalled();
  });
});
