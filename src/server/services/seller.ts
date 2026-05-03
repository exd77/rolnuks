import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Get seller profile for a user.
 */
export async function getSellerProfile(userId: string) {
  return prisma.sellerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      description: true,
      status: true,
      fullName: true,
      bankName: true,
      bankAccountNo: true,
      bankAccountName: true,
      commissionRate: true,
      totalEarnings: true,
      availableBalance: true,
      pendingBalance: true,
      totalOrders: true,
      rating: true,
      approvedAt: true,
      rejectedReason: true,
      createdAt: true,
    },
  });
}

/**
 * List seller's own products with pagination.
 */
export async function listSellerProducts(
  sellerId: string,
  opts: { page?: number } = {},
) {
  const page = opts.page ?? 1;
  const take = 20;
  const skip = (page - 1) * take;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId },
      select: {
        id: true,
        title: true,
        slug: true,
        basePrice: true,
        stock: true,
        status: true,
        deliveryMethod: true,
        createdAt: true,
        category: { select: { name: true } },
        game: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.product.count({ where: { sellerId } }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / take) };
}

/**
 * Get a single product owned by this seller (for edit form).
 */
export async function getSellerProductById(
  productId: string,
  sellerId: string,
) {
  return prisma.product.findFirst({
    where: { id: productId, sellerId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      basePrice: true,
      stock: true,
      categoryId: true,
      gameId: true,
      deliveryMethod: true,
      status: true,
      images: true,
    },
  });
}

/**
 * List orders containing items sold by this seller.
 */
export async function listSellerOrders(
  sellerId: string,
  opts: { page?: number; status?: string } = {},
) {
  const page = opts.page ?? 1;
  const take = 20;
  const skip = (page - 1) * take;

  const where: Prisma.OrderItemWhereInput = {
    sellerId,
    order: {
      status: {
        in: ["PAID", "PROCESSING", "DELIVERED", "COMPLETED", "DISPUTED"],
      },
    },
    ...(opts.status
      ? {
          fulfillmentStatus: opts.status as
            | "PENDING"
            | "IN_PROGRESS"
            | "DELIVERED"
            | "CONFIRMED"
            | "AUTO_RELEASED"
            | "DISPUTED",
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.orderItem.findMany({
      where,
      select: {
        id: true,
        productTitle: true,
        unitPrice: true,
        quantity: true,
        subtotal: true,
        robloxUsernameTarget: true,
        fulfillmentStatus: true,
        fulfilledAt: true,
        buyerConfirmedAt: true,
        autoReleaseAt: true,
        commissionAmount: true,
        sellerEarning: true,
        createdAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            buyer: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.orderItem.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / take) };
}

/**
 * Get a single order item belonging to this seller (for the seller's order detail view).
 */
export async function getSellerOrderItem(
  orderItemId: string,
  sellerId: string,
) {
  return prisma.orderItem.findFirst({
    where: { id: orderItemId, sellerId },
    select: {
      id: true,
      productTitle: true,
      productImage: true,
      unitPrice: true,
      quantity: true,
      subtotal: true,
      robloxUsernameTarget: true,
      gamepassLink: true,
      fulfillmentNotes: true,
      fulfillmentStatus: true,
      proofScreenshot: true,
      fulfilledAt: true,
      buyerConfirmedAt: true,
      autoReleaseAt: true,
      commissionRate: true,
      commissionAmount: true,
      sellerEarning: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
          buyer: { select: { name: true, email: true } },
        },
      },
    },
  });
}

/**
 * Get seller earnings summary.
 */
export async function getSellerEarnings(sellerId: string) {
  return prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    select: {
      totalEarnings: true,
      availableBalance: true,
      pendingBalance: true,
      bankName: true,
      bankAccountNo: true,
      bankAccountName: true,
    },
  });
}

/**
 * List seller payout history.
 */
export async function listSellerPayouts(
  sellerId: string,
  opts: { page?: number } = {},
) {
  const page = opts.page ?? 1;
  const take = 10;
  const skip = (page - 1) * take;

  const [items, total] = await Promise.all([
    prisma.payout.findMany({
      where: { sellerId },
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
        processedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.payout.count({ where: { sellerId } }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / take) };
}

/**
 * List ITEM_GAME categories (for seller product form).
 */
export async function getItemGameCategories() {
  return prisma.category.findMany({
    where: { isActive: true, type: "ITEM_GAME" },
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * List available games (for seller product form).
 */
export async function getGames() {
  return prisma.game.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Get seller dashboard stats.
 */
export async function getSellerDashboardStats(sellerId: string) {
  const [profile, pendingOrders, totalProducts, activeProducts] =
    await Promise.all([
      prisma.sellerProfile.findUnique({
        where: { id: sellerId },
        select: {
          totalEarnings: true,
          availableBalance: true,
          pendingBalance: true,
          totalOrders: true,
        },
      }),
      prisma.orderItem.count({
        where: {
          sellerId,
          fulfillmentStatus: { in: ["PENDING", "IN_PROGRESS"] },
          order: { status: { in: ["PAID", "PROCESSING"] } },
        },
      }),
      prisma.product.count({ where: { sellerId } }),
      prisma.product.count({ where: { sellerId, status: "ACTIVE" } }),
    ]);

  return {
    totalEarnings: profile?.totalEarnings ?? 0,
    availableBalance: profile?.availableBalance ?? 0,
    pendingBalance: profile?.pendingBalance ?? 0,
    totalOrders: profile?.totalOrders ?? 0,
    pendingOrders,
    totalProducts,
    activeProducts,
  };
}
