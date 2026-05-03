import { z } from "zod";

// Seller application form
export const SellerApplySchema = z.object({
  storeName: z
    .string()
    .min(3, "Nama toko minimal 3 karakter")
    .max(50, "Nama toko maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9\s]+$/, "Nama toko hanya boleh huruf, angka, dan spasi"),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .transform((v) => v || undefined),
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter").max(100),
  ktpNumber: z.string().regex(/^\d{16}$/, "Nomor KTP harus 16 digit"),
  bankName: z.string().min(1, "Nama bank wajib diisi").max(50),
  bankAccountNo: z
    .string()
    .min(5, "Nomor rekening minimal 5 digit")
    .max(25, "Nomor rekening maksimal 25 digit")
    .regex(/^\d+$/, "Nomor rekening hanya angka"),
  bankAccountName: z
    .string()
    .min(3, "Nama pemilik rekening minimal 3 karakter")
    .max(100),
  phone: z
    .string()
    .regex(/^(\+62|08)\d{8,12}$/, "Nomor telepon tidak valid")
    .optional()
    .transform((v) => v || undefined),
});

export type SellerApplyInput = z.infer<typeof SellerApplySchema>;

// Seller item game product listing
export const SellerProductSchema = z.object({
  title: z
    .string()
    .min(3, "Judul minimal 3 karakter")
    .max(200, "Judul maksimal 200 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  gameId: z.string().min(1, "Game wajib dipilih"),
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
    .default("1")
    .transform((v) => (v === "" ? 1 : parseInt(v, 10)))
    .pipe(z.number().int().min(1, "Stock minimal 1")),
  deliveryMethod: z.enum(["TRADE", "MANUAL_ITEM"]),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
});

export type SellerProductInput = z.infer<typeof SellerProductSchema>;

export const UpdateSellerProductSchema = SellerProductSchema.extend({
  id: z.string().min(1, "ID produk tidak valid"),
});

export type UpdateSellerProductInput = z.infer<
  typeof UpdateSellerProductSchema
>;

// Admin seller verification
export const VerifySellerSchema = z.object({
  sellerId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectedReason: z
    .string()
    .max(500)
    .optional()
    .transform((v) => v || undefined),
});

// Dispute schema
export const OpenDisputeSchema = z.object({
  orderId: z.string().min(1),
  reason: z
    .string()
    .min(10, "Alasan minimal 10 karakter")
    .max(200, "Alasan maksimal 200 karakter"),
  description: z
    .string()
    .max(2000, "Deskripsi maksimal 2000 karakter")
    .optional()
    .transform((v) => v || undefined),
});

export const ResolveDisputeSchema = z.object({
  disputeId: z.string().min(1),
  resolution: z.enum(["RESOLVED_BUYER", "RESOLVED_SELLER"]),
  notes: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => v || undefined),
});

// Payout request schema
export const RequestPayoutSchema = z.object({
  amount: z
    .string()
    .min(1, "Jumlah wajib diisi")
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d+$/, "Jumlah harus angka"))
    .transform(Number)
    .pipe(z.number().min(10000, "Minimal payout Rp 10.000")),
});

// Admin payout processing
export const ProcessPayoutSchema = z.object({
  payoutId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT", "COMPLETE"]),
  notes: z
    .string()
    .max(1000)
    .optional()
    .transform((v) => v || undefined),
  rejectedReason: z
    .string()
    .max(500)
    .optional()
    .transform((v) => v || undefined),
  proofImage: z
    .string()
    .url("URL bukti transfer tidak valid")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

// Buyer confirm delivery
export const ConfirmDeliverySchema = z.object({
  orderItemId: z.string().min(1),
});
