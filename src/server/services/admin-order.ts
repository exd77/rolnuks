import "server-only";

import type { Prisma, OrderStatus, FulfillmentStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

/**
 * List orders for admin fulfillment queue with filters & pagination.
 */
export async function listAdminOrders(
  opts: {
    page?: number;
    status?: OrderStatus;
    fulfillment?: FulfillmentStatus;
    search?: string;
  } = {},
) {
  await ensureAdmin();

  const page = opts.page ?? 1;
  const take = 20;
  const skip = (page - 1) * take;

  const where: Prisma.OrderWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.search
      ? {
          OR: [
            { orderNumber: { contains: opts.search, mode: "insensitive" } },
            {
              items: {
                some: {
                  robloxUsernameTarget: {
                    contains: opts.search,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(opts.fulfillment
      ? { items: { some: { fulfillmentStatus: opts.fulfillment } } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        paidAt: true,
        createdAt: true,
        buyer: { select: { id: true, name: true, email: true } },
        items: {
          select: {
            id: true,
            productTitle: true,
            robloxUsernameTarget: true,
            gamepassLink: true,
            fulfillmentStatus: true,
            unitPrice: true,
            quantity: true,
          },
        },
      },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / take) };
}

/**
 * Get full admin order detail for fulfillment.
 */
export async function getAdminOrderDetail(orderId: string) {
  await ensureAdmin();

  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      subtotal: true,
      total: true,
      midtransOrderId: true,
      notes: true,
      paidAt: true,
      createdAt: true,
      cancelledAt: true,
      cancelReason: true,
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          robloxUsername: true,
          phone: true,
        },
      },
      items: {
        select: {
          id: true,
          productId: true,
          productTitle: true,
          productImage: true,
          unitPrice: true,
          quantity: true,
          subtotal: true,
          robloxUsernameTarget: true,
          gamepassLink: true,
          fulfillmentStatus: true,
          fulfillmentNotes: true,
          proofScreenshot: true,
          fulfilledAt: true,
          fulfilledBy: { select: { name: true, email: true } },
          buyerConfirmedAt: true,
          autoReleaseAt: true,
        },
      },
      payment: {
        select: {
          status: true,
          paymentType: true,
          transactionId: true,
          paidAt: true,
          amount: true,
        },
      },
    },
  });
}

/**
 * Get order fulfillment queue stats (dashboard counters).
 */
export async function getAdminOrderStats() {
  await ensureAdmin();

  const [paid, processing, delivered, total] = await Promise.all([
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count(),
  ]);

  return { paid, processing, delivered, total };
}

/**
 * Count unread notifications for admin user.
 */
export async function getAdminUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

/**
 * List notifications for admin.
 */
export async function listAdminNotifications(
  userId: string,
  opts: { page?: number } = {},
) {
  const page = opts.page ?? 1;
  const take = 20;
  const skip = (page - 1) * take;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / take) };
}

/**
 * Mark all notifications as read for a user.
 */
export async function markNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/**
 * Get order data for invoice generation.
 */
export async function getOrderForInvoice(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      subtotal: true,
      total: true,
      paidAt: true,
      createdAt: true,
      buyer: {
        select: { name: true, email: true, robloxUsername: true },
      },
      items: {
        select: {
          productTitle: true,
          unitPrice: true,
          quantity: true,
          subtotal: true,
          robloxUsernameTarget: true,
        },
      },
      payment: {
        select: { paymentType: true, transactionId: true, paidAt: true },
      },
    },
  });
}
