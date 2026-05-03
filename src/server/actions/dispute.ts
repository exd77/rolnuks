"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  OpenDisputeSchema,
  ResolveDisputeSchema,
} from "@/lib/validators/seller";
import { refundEscrow, releaseEscrow } from "@/server/services/escrow";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

async function ensureAuthed() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

/**
 * Buyer opens a dispute on an order.
 */
export async function openDisputeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await ensureAuthed();

  const parsed = OpenDisputeSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali data sengketa.",
    };
  }

  const { orderId, reason, description } = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      dispute: { select: { id: true } },
      items: { select: { id: true, fulfillmentStatus: true } },
    },
  });

  if (!order) return { ok: false, message: "Pesanan tidak ditemukan." };
  if (order.dispute) {
    return { ok: false, message: "Pesanan ini sudah punya sengketa terbuka." };
  }
  if (
    order.status !== "PAID" &&
    order.status !== "PROCESSING" &&
    order.status !== "DELIVERED"
  ) {
    return {
      ok: false,
      message: "Sengketa hanya bisa dibuka untuk pesanan yang sudah dibayar.",
    };
  }

  await prisma.$transaction([
    prisma.dispute.create({
      data: {
        orderId,
        openedById: user.id,
        reason,
        description,
        status: "OPEN",
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "DISPUTED" },
    }),
    prisma.orderItem.updateMany({
      where: { orderId, fulfillmentStatus: { not: "CONFIRMED" } },
      data: { fulfillmentStatus: "DISPUTED" },
    }),
  ]);

  // Notify admins
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "DISPUTE_OPENED" as const,
        title: "Sengketa baru dibuka",
        body: `Pesanan ${order.orderNumber}: ${reason}`,
        link: "/admin/disputes",
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "DISPUTE_OPENED",
      targetType: "Order",
      targetId: orderId,
      diff: { reason },
    },
  });

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/admin/disputes");
  return {
    ok: true,
    message: "Sengketa berhasil dibuka. Admin akan meninjau.",
  };
}

/**
 * Admin resolves a dispute — either in favor of buyer (refund) or seller (release).
 */
export async function resolveDisputeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await ensureAdmin();

  const parsed = ResolveDisputeSchema.safeParse({
    disputeId: formData.get("disputeId"),
    resolution: formData.get("resolution"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Data tidak valid.",
    };
  }

  const { disputeId, resolution, notes } = parsed.data;

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    select: {
      id: true,
      status: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          buyerId: true,
          items: {
            select: { id: true, sellerId: true, fulfillmentStatus: true },
          },
        },
      },
    },
  });

  if (!dispute) return { ok: false, message: "Sengketa tidak ditemukan." };
  if (
    dispute.status === "RESOLVED_BUYER" ||
    dispute.status === "RESOLVED_SELLER" ||
    dispute.status === "CLOSED"
  ) {
    return { ok: false, message: "Sengketa sudah diselesaikan." };
  }

  // Update dispute + order status
  await prisma.$transaction([
    prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: resolution,
        resolution: notes,
        resolvedAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: dispute.order.id },
      data: {
        status: resolution === "RESOLVED_BUYER" ? "REFUNDED" : "COMPLETED",
      },
    }),
  ]);

  // Apply escrow effects per item
  for (const item of dispute.order.items) {
    if (!item.sellerId) continue;
    if (resolution === "RESOLVED_BUYER") {
      // Refund: decrement seller's pendingBalance (no payout to seller)
      try {
        await refundEscrow(item.id);
      } catch {
        // ignore — likely already adjusted
      }
    } else {
      // Release: pay seller (deduct commission)
      // Force fulfillmentStatus to AUTO_RELEASED-like first so releaseEscrow allows it.
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { fulfillmentStatus: "AUTO_RELEASED" },
      });
      try {
        await releaseEscrow(item.id);
      } catch {
        // ignore — already released
      }
    }
  }

  // Notify buyer
  await prisma.notification.create({
    data: {
      userId: dispute.order.buyerId,
      type: "DISPUTE_RESOLVED",
      title: "Sengketa diselesaikan",
      body:
        resolution === "RESOLVED_BUYER"
          ? `Sengketa pesanan ${dispute.order.orderNumber} dimenangkan kamu — refund sedang diproses.`
          : `Sengketa pesanan ${dispute.order.orderNumber} ditutup, dana dilepas ke seller.`,
      link: `/dashboard/orders/${dispute.order.id}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "DISPUTE_RESOLVED",
      targetType: "Dispute",
      targetId: disputeId,
      diff: { resolution, notes },
    },
  });

  revalidatePath("/admin/disputes");
  revalidatePath(`/admin/disputes/${disputeId}`);
  revalidatePath(`/dashboard/orders/${dispute.order.id}`);
  return { ok: true, message: "Sengketa berhasil diselesaikan." };
}
