import "server-only";

import type { PayoutStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function listAdminPayouts(
  opts: { page?: number; status?: string } = {},
) {
  const page = opts.page ?? 1;
  const take = 20;
  const skip = (page - 1) * take;
  const where = opts.status ? { status: opts.status as PayoutStatus } : {};

  const [items, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      select: {
        id: true,
        payoutNumber: true,
        amount: true,
        status: true,
        bankName: true,
        bankAccountNo: true,
        bankAccountName: true,
        notes: true,
        rejectedReason: true,
        proofImage: true,
        processedAt: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            storeName: true,
            user: { select: { name: true, email: true } },
          },
        },
        processedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.payout.count({ where }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / take) };
}

export async function getAdminPayoutById(id: string) {
  return prisma.payout.findUnique({
    where: { id },
    select: {
      id: true,
      payoutNumber: true,
      amount: true,
      status: true,
      bankName: true,
      bankAccountNo: true,
      bankAccountName: true,
      notes: true,
      rejectedReason: true,
      proofImage: true,
      processedAt: true,
      createdAt: true,
      seller: {
        select: {
          id: true,
          storeName: true,
          availableBalance: true,
          pendingBalance: true,
          totalEarnings: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      processedBy: { select: { name: true, email: true } },
    },
  });
}
