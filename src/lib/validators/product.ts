import { z } from "zod";

export const DeliveryMethodEnum = z.enum([
  "GAMEPASS",
  "GROUP_PAYOUT",
  "TRADE",
  "MANUAL_ITEM",
]);

export const ProductStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "REJECTED",
]);

export const CreateProductSchema = z.object({
  title: z
    .string()
    .min(3, "Judul minimal 3 karakter")
    .max(200, "Judul maksimal 200 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  description: z
    .string()
    .max(5000, "Deskripsi maksimal 5000 karakter")
    .optional()
    .transform((v) => v || undefined),
  basePrice: z
    .string()
    .min(1, "Harga wajib diisi")
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d+$/, "Harga harus angka"))
    .transform(Number)
    .pipe(z.number().min(1000, "Harga minimal Rp 1.000")),
  stock: z
    .string()
    .default("-1")
    .transform((v) => (v === "" ? -1 : parseInt(v, 10)))
    .pipe(z.number().int().min(-1, "Stock minimal -1 (unlimited)")),
  robuxAmount: z
    .string()
    .optional()
    .transform((v) => (v && v !== "" ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive("Jumlah Robux harus positif").optional()),
  includesPremium: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  deliveryMethod: DeliveryMethodEnum,
  status: ProductStatusEnum.default("DRAFT"),
  featured: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.extend({
  id: z.string().min(1, "ID produk tidak valid"),
});

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export const DeleteProductSchema = z.object({
  id: z.string().min(1, "ID produk tidak valid"),
});
