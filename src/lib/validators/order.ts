import { z } from "zod";

/** Roblox usernames: 3–20 chars, alphanumeric + underscore (no leading underscore). */
const robloxUsernameRegex = /^(?!_)[A-Za-z0-9_]{3,20}$/;

/**
 * Checkout form schema for Robux Gamepass orders.
 * Buyer must provide their Roblox username and gamepass link.
 */
export const CheckoutGamepassSchema = z.object({
  productSlug: z.string().min(1, "Produk tidak valid"),
  robloxUsername: z
    .string()
    .trim()
    .regex(
      robloxUsernameRegex,
      "Username Roblox 3–20 karakter, hanya huruf/angka/underscore",
    ),
  gamepassLink: z
    .string()
    .trim()
    .url("Link gamepass harus berupa URL valid")
    .refine(
      (url) => url.includes("roblox.com") || url.includes("roblox.com"),
      "Link harus dari roblox.com",
    ),
  notes: z
    .string()
    .max(500, "Catatan maksimal 500 karakter")
    .optional()
    .transform((v) => v || undefined),
});

export type CheckoutGamepassInput = z.infer<typeof CheckoutGamepassSchema>;

/**
 * Checkout form schema for Robux Instan / Group Payout / Trade orders.
 * Only requires Roblox username.
 */
export const CheckoutInstanSchema = z.object({
  productSlug: z.string().min(1, "Produk tidak valid"),
  robloxUsername: z
    .string()
    .trim()
    .regex(
      robloxUsernameRegex,
      "Username Roblox 3–20 karakter, hanya huruf/angka/underscore",
    ),
  notes: z
    .string()
    .max(500, "Catatan maksimal 500 karakter")
    .optional()
    .transform((v) => v || undefined),
});

export type CheckoutInstanInput = z.infer<typeof CheckoutInstanSchema>;
