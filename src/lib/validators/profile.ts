import { z } from "zod";

/** Roblox usernames: 3–20 chars, alphanumeric + underscore (no leading underscore). */
const robloxUsernameRegex = /^(?!_)[A-Za-z0-9_]{3,20}$/;

/** Loose Indonesian phone number sanity check: optional +, 8–15 digits. */
const phoneRegex = /^\+?[0-9]{8,15}$/;

export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama maksimal 80 karakter"),
  robloxUsername: z
    .string()
    .trim()
    .regex(
      robloxUsernameRegex,
      "Username Roblox 3–20 karakter, hanya huruf/angka/underscore",
    )
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ? v : undefined)),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Nomor HP 8–15 digit (boleh diawali +)")
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
