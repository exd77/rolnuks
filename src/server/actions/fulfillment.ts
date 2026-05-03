"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

const FulfillSchema = z.object({
  orderItemId: z.string().min(1),
  notes: z
    .string()
    .max(1000, "Catatan maksimal 1000 karakter")
    .optional()
    .transform((v) => v || undefined),
});

/**
 * Mark an order item as delivered (admin fulfillment action).
 * Updates order item fulfillment status, sets auto-release timer (48h),
 * updates parent order status, and notifies buyer.
 */
export async function markAsDeliveredAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await ensureAdmin();

  const parsed = FulfillSchema.safeParse({
    orderItemId: formData.get("orderItemId"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Data tidak valid.",
    };
  }

  const { orderItemId, notes } = parsed.data;

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: {
      id: true,
      fulfillmentStatus: true,
      orderId: true,
      productTitle: true,
      order: { select: { id: true, buyerId: true, orderNumber: true } },
    },
  });

  if (!item) {
    return { ok: false, message: "Order item tidak ditemukan." };
  }

  if (
    item.fulfillmentStatus === "DELIVERED" ||
    item.fulfillmentStatus === "CONFIRMED"
  ) {
    return { ok: false, message: "Item sudah ditandai terkirim." };
  }

  const autoReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  // Update order item
  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      fulfillmentStatus: "DELIVERED",
      fulfilledAt: new Date(),
      fulfilledById: user.id,
      fulfillmentNotes: notes,
      autoReleaseAt,
    },
  });

  // Check if all items in the order are delivered
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: item.orderId },
    select: { fulfillmentStatus: true },
  });

  const allDelivered = orderItems.every(
    (oi) =>
      oi.fulfillmentStatus === "DELIVERED" ||
      oi.fulfillmentStatus === "CONFIRMED" ||
      oi.fulfillmentStatus === "AUTO_RELEASED",
  );

  if (allDelivered) {
    await prisma.order.update({
      where: { id: item.orderId },
      data: { status: "DELIVERED" },
    });
  } else {
    // At least one item processing — mark order as PROCESSING
    await prisma.order.update({
      where: { id: item.orderId },
      data: { status: "PROCESSING" },
    });
  }

  // Notify buyer
  await prisma.notification.create({
    data: {
      userId: item.order.buyerId,
      type: "ORDER_DELIVERED",
      title: "Pesanan dikirim!",
      body: `Item "${item.productTitle}" dari pesanan ${item.order.orderNumber} telah dikirim. Konfirmasi penerimaan dalam 48 jam.`,
      link: `/dashboard/orders/${item.order.id}`,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "ORDER_ITEM_FULFILLED",
      targetType: "OrderItem",
      targetId: orderItemId,
      diff: { notes, orderId: item.orderId },
    },
  });

  revalidatePath(`/admin/orders/${item.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: "Item berhasil ditandai terkirim." };
}

/**
 * Mark notifications as read for admin.
 */
export async function markNotificationsReadAction(): Promise<ActionState> {
  const user = await ensureAdmin();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin/notifications");
  return { ok: true };
}
