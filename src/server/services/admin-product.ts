import "server-only";

import type { Prisma } from "@prisma/client";

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
 * Fetch paginated admin product list.
 */
export async function getAdminProducts(
  opts: {
    page?: number;
    search?: string;
  } = {},
) {
  await ensureAdmin();

  const page = opts.page ?? 1;
  const take = 20;
  const skip = (page - 1) * take;

  const where: Prisma.ProductWhereInput = {
    sellerId: null, // Only admin (Robux) products
    ...(opts.search
      ? {
          OR: [
            { title: { contains: opts.search, mode: "insensitive" } },
            { sku: { contains: opts.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        basePrice: true,
        stock: true,
        robuxAmount: true,
        includesPremium: true,
        deliveryMethod: true,
        status: true,
        featured: true,
        createdAt: true,
        category: { select: { name: true, type: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / take) };
}

/**
 * Fetch a single product for edit form.
 */
export async function getProductById(id: string) {
  await ensureAdmin();

  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      basePrice: true,
      stock: true,
      robuxAmount: true,
      includesPremium: true,
      gamepassRequiredAmount: true,
      deliveryMethod: true,
      status: true,
      featured: true,
      categoryId: true,
      images: true,
      sku: true,
      category: { select: { id: true, name: true, type: true } },
    },
  });
}

/**
 * Fetch categories for product form dropdowns.
 */
export async function getProductCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true, slug: true },
    orderBy: { sortOrder: "asc" },
  });
}
