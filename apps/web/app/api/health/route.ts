import { NextResponse } from 'next/server';

// GET /api/health — LIVENESS.
// -----------------------------------------------------------------------
// "Is this process alive and serving?" Nothing else. It touches no
// database, no Razorpay, no Meta, and reads no configuration.
//
// That restraint is the entire point. An orchestrator restarts a
// container whose liveness probe fails, so a liveness probe that checks
// the database turns a thirty-second database blip into a full restart of
// every web container at once — and they all come back up and reconnect
// to the database that was already struggling. Degradation becomes an
// outage, caused by the health check. Dependency health belongs in
// /api/ready, which takes a container out of the load balancer without
// killing it.
//
// Also deliberately: no version, no commit SHA, no uptime, no hostname.
// This endpoint is reachable by anyone who can reach the app, and build
// metadata is free reconnaissance.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(): NextResponse {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
