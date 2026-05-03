"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProcessPayoutSchema } from "@/lib/validators/seller";

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

export async function processPayoutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await ensureAdmin();
  const parsed = ProcessPayoutSchema.safeParse({
    payoutId: formData.get("payoutId"),
    action: formData.get("action"),
    notes: formData.get("notes"),
    rejectedReason: formData.get("rejectedReason"),
    proofImage: formData.get("proofImage"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Data payout tidak valid.",
    };
  }

  const { payoutId, action, notes, rejectedReason, proofImage } = parsed.data;
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: {
      id: true,
      payoutNumber: true,
      status: true,
      amount: true,
      sellerId: true,
      seller: { select: { userId: true, storeName: true } },
    },
  });

  if (!payout) return { ok: false, message: "Payout tidak ditemukan." };
  if (payout.status === "COMPLETED" || payout.status === "REJECTED") {
    return { ok: false, message: "Payout sudah final." };
  }

  if (action === "APPROVE") {
    if (payout.status !== "REQUESTED") {
      return {
        ok: false,
        message: "Hanya payout REQUESTED yang bisa di-approve.",
      };
    }
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: "APPROVED",
        notes,
        processedById: admin.id,
        processedAt: new Date(),
      },
    });
  }

  if (action === "COMPLETE") {
    if (payout.status !== "APPROVED" && payout.status !== "REQUESTED") {
      return {
        ok: false,
        message: "Payout harus REQUESTED/APPROVED sebelum completed.",
      };
    }
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: "COMPLETED",
        notes,
        proofImage,
        processedById: admin.id,
        processedAt: new Date(),
      },
    });
  }

  if (action === "REJECT") {
    if (!rejectedReason) {
      return {
        ok: false,
        errors: { rejectedReason: ["Alasan reject wajib diisi."] },
        message: "Alasan reject wajib diisi.",
      };
    }
    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: "REJECTED",
          rejectedReason,
          notes,
          processedById: admin.id,
          processedAt: new Date(),
        },
      }),
      prisma.sellerProfile.update({
        where: { id: payout.sellerId },
        data: { availableBalance: { increment: payout.amount } },
      }),
    ]);
  }

  await prisma.notification.create({
    data: {
      userId: payout.seller.userId,
      type:
        action === "REJECT"
          ? "PAYOUT_REJECTED"
          : action === "APPROVE"
            ? "PAYOUT_APPROVED"
            : "PAYOUT_APPROVED",
      title:
        action === "REJECT"
          ? "Payout ditolak"
          : action === "APPROVE"
            ? "Payout disetujui"
            : "Payout selesai",
      body: `Payout ${payout.payoutNumber} sebesar Rp ${Number(payout.amount).toLocaleString("id-ID")} ${action.toLowerCase()}.`,
      link: "/dashboard/seller/earnings",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: `PAYOUT_${action}`,
      targetType: "Payout",
      targetId: payout.id,
      diff: {
        payoutNumber: payout.payoutNumber,
        notes,
        rejectedReason,
        proofImage,
      } as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/payouts/${payout.id}`);
  revalidatePath("/dashboard/seller/earnings");
  return { ok: true, message: `Payout berhasil diproses (${action}).` };
}
