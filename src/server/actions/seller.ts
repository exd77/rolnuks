"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  ConfirmDeliverySchema,
  RequestPayoutSchema,
  SellerApplySchema,
  SellerProductSchema,
  UpdateSellerProductSchema,
  VerifySellerSchema,
} from "@/lib/validators/seller";
import { releaseEscrow } from "@/server/services/escrow";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

async function ensureAuthed() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function ensureApprovedSeller() {
  const user = await ensureAuthed();
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, status: true, commissionRate: true },
  });
  if (!profile || profile.status !== "APPROVED") {
    throw new Error("Seller belum disetujui.");
  }
  return { user, profile };
}

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

/**
 * User applies to become a seller. Creates a SellerProfile in PENDING state.
 */
export async function applySellerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await ensureAuthed();

  // Block re-application if already a seller
  const existing = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, status: true },
  });
  if (existing && existing.status !== "REJECTED") {
    return {
      ok: false,
      message:
        existing.status === "PENDING"
          ? "Aplikasi kamu sedang ditinjau."
          : existing.status === "APPROVED"
            ? "Kamu sudah menjadi seller terverifikasi."
            : "Akun seller kamu sedang ditangguhkan.",
    };
  }

  const parsed = SellerApplySchema.safeParse({
    storeName: formData.get("storeName"),
    description: formData.get("description"),
    fullName: formData.get("fullName"),
    ktpNumber: formData.get("ktpNumber"),
    bankName: formData.get("bankName"),
    bankAccountNo: formData.get("bankAccountNo"),
    bankAccountName: formData.get("bankAccountName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali data aplikasi.",
    };
  }

  const data = parsed.data;
  const baseSlug = slugify(data.storeName);
  let storeSlug = baseSlug;
  let counter = 0;
  while (
    await prisma.sellerProfile.findUnique({
      where: { storeSlug },
      select: { id: true },
    })
  ) {
    counter++;
    storeSlug = `${baseSlug}-${counter}`;
  }

  // Check storeName uniqueness
  const dupName = await prisma.sellerProfile.findUnique({
    where: { storeName: data.storeName },
    select: { id: true },
  });
  if (dupName) {
    return {
      ok: false,
      errors: { storeName: ["Nama toko sudah dipakai."] },
      message: "Nama toko sudah dipakai.",
    };
  }

  if (existing) {
    // Re-apply after rejection
    await prisma.sellerProfile.update({
      where: { id: existing.id },
      data: {
        storeName: data.storeName,
        storeSlug,
        description: data.description,
        fullName: data.fullName,
        ktpNumber: data.ktpNumber,
        bankName: data.bankName,
        bankAccountNo: data.bankAccountNo,
        bankAccountName: data.bankAccountName,
        status: "PENDING",
        rejectedReason: null,
      },
    });
  } else {
    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        storeName: data.storeName,
        storeSlug,
        description: data.description,
        fullName: data.fullName,
        ktpNumber: data.ktpNumber,
        bankName: data.bankName,
        bankAccountNo: data.bankAccountNo,
        bankAccountName: data.bankAccountName,
        status: "PENDING",
      },
    });
  }

  // Optionally update phone on user
  if (data.phone) {
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: data.phone },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "SELLER_APPLIED",
      targetType: "SellerProfile",
      targetId: user.id,
      diff: { storeName: data.storeName },
    },
  });

  // Notify admins (best-effort: any user with ADMIN role)
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "GENERAL" as const,
        title: "Aplikasi seller baru",
        body: `${user.name ?? user.email} mengajukan menjadi seller (toko: ${data.storeName}).`,
        link: `/admin/sellers`,
      })),
    });
  }

  revalidatePath("/dashboard/seller-apply");
  revalidatePath("/admin/sellers");
  return {
    ok: true,
    message: "Aplikasi berhasil dikirim. Menunggu verifikasi admin.",
  };
}

/**
 * Admin approves or rejects a seller application.
 */
export async function verifySellerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await ensureAdmin();

  const parsed = VerifySellerSchema.safeParse({
    sellerId: formData.get("sellerId"),
    action: formData.get("action"),
    rejectedReason: formData.get("rejectedReason"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Data tidak valid.",
    };
  }

  const { sellerId, action, rejectedReason } = parsed.data;

  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    select: { id: true, userId: true, storeName: true, status: true },
  });
  if (!seller) return { ok: false, message: "Seller tidak ditemukan." };

  if (action === "APPROVE") {
    await prisma.$transaction([
      prisma.sellerProfile.update({
        where: { id: sellerId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: admin.id,
          rejectedReason: null,
        },
      }),
      prisma.user.update({
        where: { id: seller.userId },
        data: { role: "SELLER" },
      }),
      prisma.notification.create({
        data: {
          userId: seller.userId,
          type: "SELLER_APPROVED",
          title: "Aplikasi seller disetujui!",
          body: `Selamat, toko "${seller.storeName}" sudah aktif. Mulai listing produk kamu sekarang.`,
          link: "/dashboard/seller",
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.sellerProfile.update({
        where: { id: sellerId },
        data: {
          status: "REJECTED",
          rejectedReason: rejectedReason ?? "Tidak memenuhi syarat.",
        },
      }),
      prisma.notification.create({
        data: {
          userId: seller.userId,
          type: "SELLER_REJECTED",
          title: "Aplikasi seller ditolak",
          body:
            rejectedReason ??
            "Aplikasi seller kamu ditolak. Silakan periksa kembali data dan ajukan ulang.",
          link: "/dashboard/seller-apply",
        },
      }),
    ]);
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: action === "APPROVE" ? "SELLER_APPROVED" : "SELLER_REJECTED",
      targetType: "SellerProfile",
      targetId: sellerId,
      diff: { rejectedReason },
    },
  });

  revalidatePath("/admin/sellers");
  revalidatePath(`/admin/sellers/${sellerId}`);
  return {
    ok: true,
    message: action === "APPROVE" ? "Seller disetujui." : "Seller ditolak.",
  };
}

/**
 * Seller creates a new item-game product.
 */
export async function createSellerProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, profile } = await ensureApprovedSeller();

  const parsed = SellerProductSchema.safeParse({
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    gameId: formData.get("gameId"),
    description: formData.get("description"),
    basePrice: formData.get("basePrice"),
    stock: formData.get("stock"),
    deliveryMethod: formData.get("deliveryMethod"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali data produk.",
    };
  }

  const data = parsed.data;
  const baseSlug = slugify(data.title);
  let slug = baseSlug;
  let counter = 0;
  while (
    await prisma.product.findUnique({ where: { slug }, select: { id: true } })
  ) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  await prisma.product.create({
    data: {
      sellerId: profile.id,
      categoryId: data.categoryId,
      gameId: data.gameId,
      title: data.title,
      slug,
      description: data.description,
      basePrice: new Prisma.Decimal(data.basePrice),
      stock: data.stock,
      deliveryMethod: data.deliveryMethod,
      status: data.status,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "SELLER_PRODUCT_CREATED",
      targetType: "Product",
      targetId: slug,
      diff: data as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/dashboard/seller/products");
  revalidatePath("/katalog");
  redirect("/dashboard/seller/products");
}

/**
 * Seller updates an item-game product.
 */
export async function updateSellerProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, profile } = await ensureApprovedSeller();

  const parsed = UpdateSellerProductSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    gameId: formData.get("gameId"),
    description: formData.get("description"),
    basePrice: formData.get("basePrice"),
    stock: formData.get("stock"),
    deliveryMethod: formData.get("deliveryMethod"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali data produk.",
    };
  }

  const data = parsed.data;
  const existing = await prisma.product.findFirst({
    where: { id: data.id, sellerId: profile.id },
    select: { id: true, slug: true, title: true },
  });

  if (!existing) {
    return { ok: false, message: "Produk tidak ditemukan." };
  }

  let slug = existing.slug;
  if (existing.title !== data.title) {
    const baseSlug = slugify(data.title);
    slug = baseSlug;
    let counter = 0;
    while (true) {
      const found = await prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!found || found.id === data.id) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  await prisma.product.update({
    where: { id: data.id },
    data: {
      title: data.title,
      slug,
      categoryId: data.categoryId,
      gameId: data.gameId,
      description: data.description,
      basePrice: new Prisma.Decimal(data.basePrice),
      stock: data.stock,
      deliveryMethod: data.deliveryMethod,
      status: data.status,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "SELLER_PRODUCT_UPDATED",
      targetType: "Product",
      targetId: data.id,
      diff: data as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/dashboard/seller/products");
  revalidatePath("/katalog");
  redirect("/dashboard/seller/products");
}

/**
 * Seller deletes one of their products.
 */
export async function deleteSellerProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, profile } = await ensureApprovedSeller();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, message: "ID produk tidak valid." };
  }

  const existing = await prisma.product.findFirst({
    where: { id, sellerId: profile.id },
    select: { id: true, title: true },
  });

  if (!existing) {
    return { ok: false, message: "Produk tidak ditemukan." };
  }

  await prisma.product.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "SELLER_PRODUCT_DELETED",
      targetType: "Product",
      targetId: id,
      diff: { title: existing.title },
    },
  });

  revalidatePath("/dashboard/seller/products");
  revalidatePath("/katalog");
  return { ok: true, message: "Produk berhasil dihapus." };
}

/**
 * Seller marks an order item as delivered (TRADE sent screenshot or similar).
 * Sets autoReleaseAt to 48h from now.
 */
export async function sellerMarkDeliveredAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, profile } = await ensureApprovedSeller();

  const orderItemId = formData.get("orderItemId");
  const notes = formData.get("notes");
  if (typeof orderItemId !== "string" || !orderItemId) {
    return { ok: false, message: "Order item tidak valid." };
  }

  const item = await prisma.orderItem.findFirst({
    where: { id: orderItemId, sellerId: profile.id },
    select: {
      id: true,
      orderId: true,
      productTitle: true,
      fulfillmentStatus: true,
      order: { select: { id: true, buyerId: true, orderNumber: true } },
    },
  });

  if (!item) {
    return { ok: false, message: "Order item tidak ditemukan." };
  }

  if (
    item.fulfillmentStatus !== "PENDING" &&
    item.fulfillmentStatus !== "IN_PROGRESS"
  ) {
    return { ok: false, message: "Item sudah ditandai terkirim." };
  }

  const autoReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      fulfillmentStatus: "DELIVERED",
      fulfilledAt: new Date(),
      fulfilledById: user.id,
      fulfillmentNotes:
        typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
      autoReleaseAt,
    },
  });

  // Update order status
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
  await prisma.order.update({
    where: { id: item.orderId },
    data: { status: allDelivered ? "DELIVERED" : "PROCESSING" },
  });

  await prisma.notification.create({
    data: {
      userId: item.order.buyerId,
      type: "ORDER_DELIVERED",
      title: "Pesanan dikirim!",
      body: `Item "${item.productTitle}" dari pesanan ${item.order.orderNumber} telah dikirim seller. Konfirmasi penerimaan dalam 48 jam.`,
      link: `/dashboard/orders/${item.order.id}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "SELLER_ORDER_FULFILLED",
      targetType: "OrderItem",
      targetId: orderItemId,
    },
  });

  revalidatePath("/dashboard/seller/orders");
  revalidatePath(`/dashboard/seller/orders/${orderItemId}`);
  return { ok: true, message: "Item berhasil ditandai terkirim." };
}

/**
 * Buyer confirms they received the item — releases escrow to seller.
 */
export async function confirmDeliveryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await ensureAuthed();

  const parsed = ConfirmDeliverySchema.safeParse({
    orderItemId: formData.get("orderItemId"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Data tidak valid." };
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: parsed.data.orderItemId },
    select: {
      id: true,
      orderId: true,
      sellerId: true,
      productTitle: true,
      fulfillmentStatus: true,
      order: { select: { id: true, buyerId: true, orderNumber: true } },
    },
  });

  if (!item) return { ok: false, message: "Item tidak ditemukan." };
  if (item.order.buyerId !== user.id) {
    return { ok: false, message: "Tidak berhak." };
  }
  if (item.fulfillmentStatus !== "DELIVERED") {
    return {
      ok: false,
      message: "Item belum dikirim atau sudah dikonfirmasi.",
    };
  }

  await prisma.orderItem.update({
    where: { id: item.id },
    data: {
      fulfillmentStatus: "CONFIRMED",
      buyerConfirmedAt: new Date(),
    },
  });

  // Release escrow if this is a seller item
  if (item.sellerId) {
    await releaseEscrow(item.id);
  }

  // If all items confirmed → mark order COMPLETED
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: item.orderId },
    select: { fulfillmentStatus: true },
  });
  const allDone = orderItems.every(
    (oi) =>
      oi.fulfillmentStatus === "CONFIRMED" ||
      oi.fulfillmentStatus === "AUTO_RELEASED",
  );
  if (allDone) {
    await prisma.order.update({
      where: { id: item.orderId },
      data: { status: "COMPLETED" },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "ORDER_ITEM_CONFIRMED",
      targetType: "OrderItem",
      targetId: item.id,
    },
  });

  revalidatePath(`/dashboard/orders/${item.orderId}`);
  return { ok: true, message: "Terima kasih! Item dikonfirmasi diterima." };
}

/**
 * Seller requests payout from their available balance.
 */
export async function requestPayoutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, profile } = await ensureApprovedSeller();

  const parsed = RequestPayoutSchema.safeParse({
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali jumlah payout.",
    };
  }

  const { amount } = parsed.data;
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: profile.id },
    select: {
      id: true,
      availableBalance: true,
      bankName: true,
      bankAccountNo: true,
      bankAccountName: true,
    },
  });

  if (!seller) return { ok: false, message: "Profil seller tidak ditemukan." };
  if (!seller.bankName || !seller.bankAccountNo || !seller.bankAccountName) {
    return {
      ok: false,
      message: "Lengkapi info rekening bank dulu di profil.",
    };
  }
  if (Number(seller.availableBalance) < amount) {
    return {
      ok: false,
      errors: { amount: ["Saldo tidak cukup."] },
      message: "Saldo tidak cukup.",
    };
  }

  const payoutNumber = `PAY-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(
      /-/g,
      "",
    )}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  await prisma.$transaction([
    prisma.payout.create({
      data: {
        payoutNumber,
        sellerId: profile.id,
        amount: new Prisma.Decimal(amount),
        status: "REQUESTED",
        bankName: seller.bankName,
        bankAccountNo: seller.bankAccountNo,
        bankAccountName: seller.bankAccountName,
      },
    }),
    prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        availableBalance: { decrement: new Prisma.Decimal(amount) },
      },
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
        type: "PAYOUT_REQUESTED" as const,
        title: "Permintaan payout baru",
        body: `Payout ${payoutNumber} sebesar Rp ${amount.toLocaleString("id-ID")}.`,
        link: "/admin/payouts",
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "PAYOUT_REQUESTED",
      targetType: "Payout",
      targetId: payoutNumber,
      diff: { amount },
    },
  });

  revalidatePath("/dashboard/seller/earnings");
  return { ok: true, message: "Permintaan payout berhasil dikirim." };
}
