"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  CreateProductSchema,
  UpdateProductSchema,
  DeleteProductSchema,
} from "@/lib/validators/product";
import { calcGamepassRequiredAmount } from "@/lib/utils";

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

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

/**
 * Create a new Robux product (admin only).
 */
export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await ensureAdmin();

  const parsed = CreateProductSchema.safeParse({
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    basePrice: formData.get("basePrice"),
    stock: formData.get("stock"),
    robuxAmount: formData.get("robuxAmount"),
    includesPremium: formData.get("includesPremium"),
    deliveryMethod: formData.get("deliveryMethod"),
    status: formData.get("status"),
    featured: formData.get("featured"),
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

  // Ensure unique slug
  let slug = baseSlug;
  let counter = 0;
  while (
    await prisma.product.findUnique({ where: { slug }, select: { id: true } })
  ) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const gamepassRequiredAmount = data.robuxAmount
    ? calcGamepassRequiredAmount(data.robuxAmount)
    : undefined;

  await prisma.product.create({
    data: {
      title: data.title,
      slug,
      categoryId: data.categoryId,
      description: data.description,
      basePrice: new Prisma.Decimal(data.basePrice),
      stock: data.stock,
      robuxAmount: data.robuxAmount,
      includesPremium: data.includesPremium,
      gamepassRequiredAmount,
      deliveryMethod: data.deliveryMethod,
      status: data.status,
      featured: data.featured,
      sellerId: null, // Admin product
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "PRODUCT_CREATED",
      targetType: "Product",
      targetId: slug,
      diff: data as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
  redirect("/admin/produk");
}

/**
 * Update an existing product (admin only).
 */
export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await ensureAdmin();

  const parsed = UpdateProductSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    basePrice: formData.get("basePrice"),
    stock: formData.get("stock"),
    robuxAmount: formData.get("robuxAmount"),
    includesPremium: formData.get("includesPremium"),
    deliveryMethod: formData.get("deliveryMethod"),
    status: formData.get("status"),
    featured: formData.get("featured"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali data produk.",
    };
  }

  const data = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id: data.id },
    select: { id: true, slug: true, title: true },
  });

  if (!existing) {
    return { ok: false, message: "Produk tidak ditemukan." };
  }

  // Regenerate slug if title changed
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

  const gamepassRequiredAmount = data.robuxAmount
    ? calcGamepassRequiredAmount(data.robuxAmount)
    : undefined;

  await prisma.product.update({
    where: { id: data.id },
    data: {
      title: data.title,
      slug,
      categoryId: data.categoryId,
      description: data.description,
      basePrice: new Prisma.Decimal(data.basePrice),
      stock: data.stock,
      robuxAmount: data.robuxAmount,
      includesPremium: data.includesPremium,
      gamepassRequiredAmount,
      deliveryMethod: data.deliveryMethod,
      status: data.status,
      featured: data.featured,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "PRODUCT_UPDATED",
      targetType: "Product",
      targetId: data.id,
      diff: data as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
  redirect("/admin/produk");
}

/**
 * Delete a product (admin only).
 */
export async function deleteProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await ensureAdmin();

  const parsed = DeleteProductSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { ok: false, message: "ID produk tidak valid." };
  }

  const { id } = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!existing) {
    return { ok: false, message: "Produk tidak ditemukan." };
  }

  await prisma.product.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "PRODUCT_DELETED",
      targetType: "Product",
      targetId: id,
      diff: { title: existing.title },
    },
  });

  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
  return { ok: true, message: "Produk berhasil dihapus." };
}
