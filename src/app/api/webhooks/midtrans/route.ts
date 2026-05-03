import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { verifySignature, type MidtransNotification } from "@/lib/midtrans";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { captureError } from "@/lib/monitoring";
import { holdEscrow } from "@/server/services/escrow";

/**
 * Midtrans Webhook handler.
 *
 * Receives payment notifications from Midtrans. This endpoint is idempotent:
 * it checks the current payment status before updating, so replayed webhooks
 * won't cause double-processing.
 *
 * This route must NOT require auth (Midtrans calls it server-to-server).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limited = await rateLimit(`midtrans:${ip}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { message: "Rate limited" },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  let notification: MidtransNotification;

  try {
    notification = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
    transaction_id,
    payment_type,
  } = notification;

  // Verify signature
  const expectedSignature = verifySignature(
    order_id,
    status_code,
    gross_amount,
  );
  if (signature_key !== expectedSignature) {
    await captureError({
      source: "api.midtrans",
      message: "Invalid Midtrans signature",
      metadata: { order_id, ip },
    });
    return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
  }

  // Find order by midtransOrderId
  const order = await prisma.order.findUnique({
    where: { midtransOrderId: order_id },
    select: {
      id: true,
      status: true,
      payment: { select: { id: true, status: true } },
    },
  });

  if (!order) {
    // Order not found — maybe a different system or stale webhook
    console.warn("[MIDTRANS_WEBHOOK] Order not found:", order_id);
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  // Determine new payment status based on Midtrans notification
  const paymentStatus = resolvePaymentStatus(transaction_status, fraud_status);
  const orderStatus = resolveOrderStatus(transaction_status, fraud_status);

  // Idempotency: skip if already at terminal state
  if (
    order.status === "PAID" ||
    order.status === "PROCESSING" ||
    order.status === "DELIVERED" ||
    order.status === "COMPLETED"
  ) {
    // Already processed — just acknowledge
    return NextResponse.json({ message: "OK (already processed)" });
  }

  // Update payment record
  if (order.payment) {
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: paymentStatus,
        transactionId: transaction_id,
        paymentType: payment_type,
        rawWebhookJson: JSON.parse(JSON.stringify(notification)),
        ...(paymentStatus === "CAPTURED" ? { paidAt: new Date() } : {}),
      },
    });
  }

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: orderStatus,
      ...(orderStatus === "PAID" ? { paidAt: new Date() } : {}),
      ...(orderStatus === "CANCELLED"
        ? {
            cancelledAt: new Date(),
            cancelReason: `Payment ${transaction_status}`,
          }
        : {}),
    },
  });

  // If payment successful, update order items to IN_PROGRESS + hold escrow for seller items
  if (orderStatus === "PAID") {
    await prisma.orderItem.updateMany({
      where: { orderId: order.id, fulfillmentStatus: "PENDING" },
      data: { fulfillmentStatus: "IN_PROGRESS" },
    });

    // Hold escrow on each seller-owned item (admin items have sellerId=null)
    const sellerItems = await prisma.orderItem.findMany({
      where: { orderId: order.id, sellerId: { not: null } },
      select: { id: true },
    });
    for (const item of sellerItems) {
      await holdEscrow(item.id);
    }

    // Notify sellers of incoming orders
    const sellerNotifs = await prisma.orderItem.findMany({
      where: { orderId: order.id, sellerId: { not: null } },
      select: {
        productTitle: true,
        seller: { select: { userId: true } },
      },
    });
    if (sellerNotifs.length > 0) {
      await prisma.notification.createMany({
        data: sellerNotifs
          .filter((s) => s.seller?.userId)
          .map((s) => ({
            userId: s.seller!.userId,
            type: "ORDER_PROCESSING" as const,
            title: "Pesanan baru!",
            body: `Item "${s.productTitle}" telah dibayar buyer. Segera proses.`,
            link: "/dashboard/seller/orders",
          })),
      });
    }

    // Create notification for admin
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] } },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "ORDER_PAID" as const,
          title: "Pesanan baru perlu diproses",
          body: `Order ${order_id} telah dibayar dan siap untuk fulfillment.`,
          link: `/admin/orders`,
        })),
      });
    }

    // Create notification for buyer
    const buyerOrder = await prisma.order.findUnique({
      where: { id: order.id },
      select: { buyerId: true, orderNumber: true },
    });
    if (buyerOrder) {
      await prisma.notification.create({
        data: {
          userId: buyerOrder.buyerId,
          type: "ORDER_PAID",
          title: "Pembayaran berhasil",
          body: `Pesanan ${buyerOrder.orderNumber} berhasil dibayar. Admin akan segera memproses.`,
          link: `/dashboard/orders/${order.id}`,
        },
      });
    }
  }

  return NextResponse.json({ message: "OK" });
}

function resolvePaymentStatus(
  transactionStatus: string,
  fraudStatus?: string,
): "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "CANCELLED" | "EXPIRED" {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" ? "CAPTURED" : "PENDING";
  }
  if (transactionStatus === "settlement") return "CAPTURED";
  if (transactionStatus === "pending") return "PENDING";
  if (transactionStatus === "deny" || transactionStatus === "failure")
    return "FAILED";
  if (transactionStatus === "cancel") return "CANCELLED";
  if (transactionStatus === "expire") return "EXPIRED";
  return "PENDING";
}

function resolveOrderStatus(
  transactionStatus: string,
  fraudStatus?: string,
): "PENDING_PAYMENT" | "PAID" | "CANCELLED" {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" ? "PAID" : "PENDING_PAYMENT";
  }
  if (transactionStatus === "settlement") return "PAID";
  if (
    transactionStatus === "cancel" ||
    transactionStatus === "deny" ||
    transactionStatus === "expire" ||
    transactionStatus === "failure"
  ) {
    return "CANCELLED";
  }
  return "PENDING_PAYMENT";
}
