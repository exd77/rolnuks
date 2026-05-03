"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { LoginSchema, RegisterSchema } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/rate-limit";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const INITIAL_STATE: ActionState = {};

export const initialAuthState = INITIAL_STATE;

/**
 * Login Server Action — designed for `useActionState`.
 * Signature: (prevState, formData) => Promise<ActionState>
 */
export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali data login Anda.",
    };
  }

  const callbackUrl =
    (formData.get("callbackUrl") as string | null) ?? "/dashboard";
  const limited = await rateLimit(
    `login:${parsed.data.email.toLowerCase().trim()}`,
    {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    },
  );
  if (!limited.ok) {
    return {
      ok: false,
      message: `Terlalu banyak percobaan login. Coba lagi ${limited.retryAfter} detik lagi.`,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { ok: false, message: "Email atau password salah." };
        default:
          return { ok: false, message: "Terjadi kesalahan saat login." };
      }
    }
    throw error;
  }

  // signIn() throws a NEXT_REDIRECT internally on success; this line is unreachable.
  return { ok: true };
}

/**
 * Register Server Action — designed for `useActionState`.
 */
export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali data pendaftaran Anda.",
    };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  const limited = await rateLimit(`register:${normalizedEmail}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return {
      ok: false,
      message: `Terlalu banyak pendaftaran. Coba lagi ${limited.retryAfter} detik lagi.`,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      errors: { email: ["Email sudah terdaftar."] },
      message: "Email sudah terdaftar.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      password: passwordHash,
      role: "BUYER",
    },
  });

  // Auto sign-in after register
  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Account created but sign-in failed: redirect to login page
      redirect("/login?registered=1");
    }
    throw error;
  }

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
