import { NextResponse } from 'next/server';

import { prisma } from '@acos/db';

// GET /api/ready — READINESS.
// -----------------------------------------------------------------------
// "Can this process actually serve a request that matters?" Every route
// worth routing traffic to needs the database, so readiness is: can we
// reach it?
//
// A failure here should remove the container from the load balancer, not
// restart it — see /api/health for why the two must stay separate.
//
// `SELECT 1` and nothing more: it proves a connection can be acquired and
// a round trip completes, which is what readiness means, without reading
// a row anybody owns.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Bounds the probe, so a hung connection fails the check instead of hanging it. */
const PROBE_TIMEOUT_MS = 2_000;

export async function GET(): Promise<NextResponse> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error('readiness probe timed out')), PROBE_TIMEOUT_MS).unref?.(),
      ),
    ]);
    return NextResponse.json({ status: 'ready' }, { status: 200 });
  } catch {
    // No error detail in the body. This endpoint is publicly reachable
    // and a database error message names hosts, databases and users.
    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }
}
