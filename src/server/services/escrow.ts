import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Release escrow for an order item — move seller earnings from pending to available.
 * Called when buyer confirms delivery OR after 48h auto-release.
 * Deducts 3% platform commission.
 */
export async function releaseEscrow(orderItemId: string) {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: {
      id: true,
      sellerId: true,
      subtotal: true,
      fulfillmentStatus: true,
      commissionRate: true,
      commissionAmount: true,
      sellerEarning: true,
      seller: { select: { commissionRate: true } },
    },
  });

  if (!item || !item.sellerId) {
    throw new Error("Order item or seller not found");
  }

  if (
    item.fulfillmentStatus !== "DELIVERED" &&
    item.fulfillmentStatus !== "CONFIRMED" &&
    item.fulfillmentStatus !== "AUTO_RELEASED"
  ) {
    throw new Error("Item must be in DELIVERED state to release escrow");
  }

  const subtotal = Number(item.subtotal);
  const commissionRate = item.commissionRate
    ? Number(item.commissionRate)
    : item.seller?.commissionRate
      ? Number(item.seller.commissionRate)
      : 0.03;
  const commissionAmount = item.commissionAmount
    ? Number(item.commissionAmount)
    : Math.round(subtotal * commissionRate);
  const sellerEarning = item.sellerEarning
    ? Number(item.sellerEarning)
    : subtotal - commissionAmount;

  await prisma.$transaction([
    prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        commissionRate: new Prisma.Decimal(commissionRate),
        commissionAmount: new Prisma.Decimal(commissionAmount),
        sellerEarning: new Prisma.Decimal(sellerEarning),
      },
    }),
    prisma.sellerProfile.update({
      where: { id: item.sellerId },
      data: {
        availableBalance: { increment: new Prisma.Decimal(sellerEarning) },
        pendingBalance: { decrement: new Prisma.Decimal(subtotal) },
        totalEarnings: { increment: new Prisma.Decimal(sellerEarning) },
        totalOrders: { increment: 1 },
      },
    }),
  ]);

  return { sellerEarning, commissionAmount };
}

/**
 * Hold funds in escrow (add to seller pending balance).
 * Called when order is paid for a seller item.
 */
export async function holdEscrow(orderItemId: string) {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: { sellerId: true, subtotal: true },
  });

  if (!item?.sellerId) return;

  await prisma.sellerProfile.update({
    where: { id: item.sellerId },
    data: {
      pendingBalance: { increment: item.subtotal },
    },
  });
}

/**
 * Refund escrow back to buyer side (decrement seller's pending balance).
 * Used when a dispute is resolved in favor of the buyer.
 */
export async function refundEscrow(orderItemId: string) {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: { sellerId: true, subtotal: true },
  });

  if (!item?.sellerId) return;

  await prisma.sellerProfile.update({
    where: { id: item.sellerId },
    data: {
      pendingBalance: { decrement: item.subtotal },
    },
  });
}

/**
 * Get dispute details for admin.
 */
export async function getDisputeById(disputeId: string) {
  return prisma.dispute.findUnique({
    where: { id: disputeId },
    select: {
      id: true,
      reason: true,
      description: true,
      evidence: true,
      status: true,
      resolution: true,
      resolvedAt: true,
      createdAt: true,
      openedBy: { select: { id: true, name: true, email: true } },
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          buyer: { select: { id: true, name: true, email: true } },
          items: {
            select: {
              id: true,
              productTitle: true,
              subtotal: true,
              sellerId: true,
              fulfillmentStatus: true,
              seller: { select: { id: true, storeName: true, userId: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * List disputes for admin with pagination.
 */
export async function listDisputes(
  opts: { page?: number; status?: string } = {},
) {
  const page = opts.page ?? 1;
  const take = 20;
  const skip = (page - 1) * take;

  const where = opts.status
    ? {
        status: opts.status as
          | "OPEN"
          | "IN_REVIEW"
          | "RESOLVED_BUYER"
          | "RESOLVED_SELLER"
          | "CLOSED",
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        openedBy: { select: { name: true, email: true } },
        order: {
          select: {
            orderNumber: true,
            total: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.dispute.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / take) };
}

/**
 * List pending seller applications for admin.
 */
export async function listSellerApplications(
  opts: { page?: number; status?: string } = {},
) {
  const page = opts.page ?? 1;
  const take = 20;
  const skip = (page - 1) * take;

  const status = opts.status ?? "PENDING";
  const where = {
    status: status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED",
  };

  const [items, total] = await Promise.all([
    prisma.sellerProfile.findMany({
      where,
      select: {
        id: true,
        storeName: true,
        storeSlug: true,
        status: true,
        fullName: true,
        ktpNumber: true,
        bankName: true,
        bankAccountNo: true,
        bankAccountName: true,
        rejectedReason: true,
        createdAt: true,
        approvedAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take,
    }),
    prisma.sellerProfile.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / take) };
}

/**
 * Get a single seller application/profile by id (admin view).
 */
export async function getSellerApplicationById(sellerId: string) {
  return prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      description: true,
      status: true,
      fullName: true,
      ktpNumber: true,
      ktpImageUrl: true,
      selfieImageUrl: true,
      bankName: true,
      bankAccountNo: true,
      bankAccountName: true,
      rejectedReason: true,
      approvedAt: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
    },
  });
}
