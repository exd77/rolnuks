import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { snap } from "@/lib/midtrans";

/**
 * Generate a unique order number: ORB-YYYYMMDD-XXXX
 */
function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORB-${date}-${rand}`;
}

/**
 * Look up a seller's current commissionRate (for snapshotting at checkout time).
 */
export async function getSellerCommissionRate(
  sellerId: string,
): Promise<number | null> {
  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    select: { commissionRate: true },
  });
  if (!profile) return null;
  return Number(profile.commissionRate);
}

export type CreateOrderInput = {
  buyerId: string;
  buyerEmail: string;
  buyerName: string | null;
  productId: string;
  productTitle: string;
  productImage: string | null;
  unitPrice: number;
  sellerId?: string | null;
  commissionRate?: number;
  robloxUsername: string;
  gamepassLink?: string;
  notes?: string;
};

export type CreateOrderResult = {
  orderId: string;
  orderNumber: string;
  snapToken: string;
  snapRedirectUrl: string;
};

/**
 * Create an order + payment record and generate a Midtrans Snap token.
 */
export async function createOrderAndSnap(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const orderNumber = generateOrderNumber();
  const midtransOrderId = `${orderNumber}-${Date.now()}`;

  // Create order + order item + payment in a single transaction
  const order = await prisma.order.create({
    data: {
      orderNumber,
      buyerId: input.buyerId,
      status: "PENDING_PAYMENT",
      subtotal: new Prisma.Decimal(input.unitPrice),
      total: new Prisma.Decimal(input.unitPrice),
      midtransOrderId,
      notes: input.notes,
      items: {
        create: {
          productId: input.productId,
          sellerId: input.sellerId ?? null,
          productTitle: input.productTitle,
          productImage: input.productImage,
          unitPrice: new Prisma.Decimal(input.unitPrice),
          quantity: 1,
          subtotal: new Prisma.Decimal(input.unitPrice),
          robloxUsernameTarget: input.robloxUsername,
          gamepassLink: input.gamepassLink,
          fulfillmentStatus: "PENDING",
          ...(input.sellerId && input.commissionRate
            ? {
                commissionRate: new Prisma.Decimal(input.commissionRate),
                commissionAmount: new Prisma.Decimal(
                  Math.round(input.unitPrice * input.commissionRate),
                ),
                sellerEarning: new Prisma.Decimal(
                  input.unitPrice -
                    Math.round(input.unitPrice * input.commissionRate),
                ),
              }
            : {}),
        },
      },
      payment: {
        create: {
          provider: "midtrans",
          amount: new Prisma.Decimal(input.unitPrice),
          status: "PENDING",
        },
      },
    },
    select: { id: true, orderNumber: true },
  });

  // Create Midtrans Snap transaction
  const snapParam = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: input.unitPrice,
    },
    item_details: [
      {
        id: input.productId,
        price: input.unitPrice,
        quantity: 1,
        name: input.productTitle.slice(0, 50),
      },
    ],
    customer_details: {
      email: input.buyerEmail,
      first_name: input.buyerName ?? "Buyer",
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}`,
    },
  };

  const snapResponse = await snap.createTransaction(snapParam);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    snapToken: snapResponse.token,
    snapRedirectUrl: snapResponse.redirect_url,
  };
}

/**
 * Get order details for buyer view.
 */
export async function getOrderForBuyer(orderId: string, buyerId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, buyerId },
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
      items: {
        select: {
          id: true,
          productTitle: true,
          productImage: true,
          unitPrice: true,
          quantity: true,
          subtotal: true,
          robloxUsernameTarget: true,
          gamepassLink: true,
          fulfillmentStatus: true,
          fulfilledAt: true,
          proofScreenshot: true,
        },
      },
      payment: {
        select: {
          status: true,
          paymentType: true,
          paidAt: true,
          transactionId: true,
        },
      },
    },
  });
}

/**
 * List orders for buyer with pagination.
 */
export async function listBuyerOrders(
  buyerId: string,
  opts: { page?: number } = {},
) {
  const page = opts.page ?? 1;
  const take = 10;
  const skip = (page - 1) * take;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            productTitle: true,
            fulfillmentStatus: true,
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.order.count({ where: { buyerId } }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / take) };
}
