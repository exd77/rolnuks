import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getAdminAnalytics() {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY_MS);
  const since7 = new Date(now.getTime() - 7 * DAY_MS);

  const [
    grossRevenue,
    paidOrders,
    newUsers30,
    activeSellers,
    pendingPayouts,
    openDisputes,
    sellerEarnings,
    topProducts,
    dailyOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        paidAt: { gte: since30 },
        status: { in: ["PAID", "PROCESSING", "DELIVERED", "COMPLETED"] },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: {
        paidAt: { gte: since30 },
        status: { in: ["PAID", "PROCESSING", "DELIVERED", "COMPLETED"] },
      },
    }),
    prisma.user.count({ where: { createdAt: { gte: since30 } } }),
    prisma.sellerProfile.count({ where: { status: "APPROVED" } }),
    prisma.payout.aggregate({
      where: { status: "REQUESTED" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.sellerProfile.aggregate({
      _sum: {
        totalEarnings: true,
        pendingBalance: true,
        availableBalance: true,
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productTitle"],
      where: {
        order: {
          paidAt: { gte: since30 },
          status: { in: ["PAID", "PROCESSING", "DELIVERED", "COMPLETED"] },
        },
      },
      _sum: { subtotal: true, quantity: true },
      _count: true,
      orderBy: { _sum: { subtotal: "desc" } },
      take: 5,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: since7 } },
      select: { createdAt: true, total: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const buckets = new Map<
    string,
    { date: string; orders: number; revenue: Prisma.Decimal }
  >();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    buckets.set(d, { date: d, orders: 0, revenue: new Prisma.Decimal(0) });
  }
  for (const order of dailyOrders) {
    const d = order.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(d);
    if (!bucket) continue;
    bucket.orders += 1;
    if (
      ["PAID", "PROCESSING", "DELIVERED", "COMPLETED"].includes(order.status)
    ) {
      bucket.revenue = bucket.revenue.add(order.total);
    }
  }

  return {
    grossRevenue30: grossRevenue._sum.total ?? new Prisma.Decimal(0),
    paidOrders30: paidOrders,
    averageOrderValue30:
      paidOrders > 0 ? Number(grossRevenue._sum.total ?? 0) / paidOrders : 0,
    newUsers30,
    activeSellers,
    pendingPayoutAmount: pendingPayouts._sum.amount ?? new Prisma.Decimal(0),
    pendingPayoutCount: pendingPayouts._count,
    openDisputes,
    sellerEarnings: sellerEarnings._sum.totalEarnings ?? new Prisma.Decimal(0),
    sellerPending: sellerEarnings._sum.pendingBalance ?? new Prisma.Decimal(0),
    sellerAvailable:
      sellerEarnings._sum.availableBalance ?? new Prisma.Decimal(0),
    topProducts,
    daily: Array.from(buckets.values()),
  };
}
