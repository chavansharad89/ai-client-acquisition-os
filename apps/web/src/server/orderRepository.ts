import { createPrismaOrderRepository, type OrderRepository } from '@acos/core-payments';
import { prisma } from '@acos/db';

// Shared OrderRepository for routes outside create-order's own module
// scope (payment-status, claim-token) — same lazy-singleton and `as
// never` cast rationale as apps/web/app/api/payments/create-order's own
// getDeps(): `prisma generate` must not run at `next build` time, and
// this sandbox's generated client is a stale template regardless (see
// orderRepository.ts's own doc comment in @acos/core-payments).
let orders: OrderRepository | null = null;

export function getOrderRepository(): OrderRepository {
  orders ??= createPrismaOrderRepository(prisma as never);
  return orders;
}

/** Test seam, mirroring src/server/db.ts's __setPoolForTests. Not exported from any route. */
export function __setOrderRepositoryForTests(next: OrderRepository | null): void {
  orders = next;
}
