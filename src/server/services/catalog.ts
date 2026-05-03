import "server-only";

import type { CategoryType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Catalog read service.
 *
 * Plain async functions — caching strategy will be layered on top with
 * `'use cache'` once Cache Components stabilize for our pages. For now
 * we rely on Next.js's per-request memoization and short-lived dynamic
 * server rendering, since prices/stock can change.
 */

export const ACTIVE_CATEGORY_TYPES: CategoryType[] = [
  "ROBUX_GAMEPASS",
  "ROBUX_INSTANT",
  "ITEM_GAME",
];

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  description: string | null;
  icon: string | null;
  productCount: number;
};

export async function listActiveCategories(): Promise<CategoryListItem[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      icon: true,
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { sortOrder: "asc" },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    type: c.type,
    description: c.description,
    icon: c.icon,
    productCount: c._count.products,
  }));
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      isActive: true,
    },
  });
}

const PRODUCT_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  basePrice: true,
  images: true,
  robuxAmount: true,
  includesPremium: true,
  gamepassRequiredAmount: true,
  deliveryMethod: true,
  featured: true,
  stock: true,
  category: { select: { name: true, slug: true, type: true } },
  seller: { select: { storeName: true, storeSlug: true } },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{
  select: typeof PRODUCT_CARD_SELECT;
}>;

export async function listProductsByCategorySlug(
  categorySlug: string,
  opts: { skip?: number; take?: number } = {},
): Promise<{ items: ProductCard[]; total: number }> {
  const take = opts.take ?? 24;
  const skip = opts.skip ?? 0;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    category: { slug: categorySlug, isActive: true },
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: PRODUCT_CARD_SELECT,
      orderBy: [
        { featured: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total };
}

const PRODUCT_DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  basePrice: true,
  images: true,
  stock: true,
  sku: true,
  robuxAmount: true,
  includesPremium: true,
  gamepassRequiredAmount: true,
  deliveryMethod: true,
  status: true,
  featured: true,
  metaTitle: true,
  metaDescription: true,
  createdAt: true,
  category: {
    select: { id: true, name: true, slug: true, type: true },
  },
  seller: {
    select: { id: true, storeName: true, storeSlug: true, rating: true },
  },
  game: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

export type ProductDetail = Prisma.ProductGetPayload<{
  select: typeof PRODUCT_DETAIL_SELECT;
}>;

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  return prisma.product.findUnique({
    where: { slug },
    select: PRODUCT_DETAIL_SELECT,
  });
}

export async function listFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { status: "ACTIVE", featured: true },
    select: PRODUCT_CARD_SELECT,
    orderBy: { sortOrder: "asc" },
    take: limit,
  });
}
