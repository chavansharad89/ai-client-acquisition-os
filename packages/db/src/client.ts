import { PrismaClient } from '@prisma/client';

// Standard Next.js/Node singleton pattern to avoid exhausting DB
// connections from hot-reload in dev. This is infrastructure
// boilerplate only — no query/business logic belongs in this file.
declare global {
  // eslint-disable-next-line no-var
  var __acosPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__acosPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__acosPrisma = prisma;
}
