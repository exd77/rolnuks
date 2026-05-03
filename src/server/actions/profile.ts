"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UpdateProfileSchema } from "@/lib/validators/profile";

export type ProfileActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export const initialProfileState: ProfileActionState = {};

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Sesi habis. Silakan login ulang." };
  }

  const parsed = UpdateProfileSchema.safeParse({
    name: formData.get("name"),
    robloxUsername: formData.get("robloxUsername") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali data profil kamu.",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      robloxUsername: parsed.data.robloxUsername ?? null,
      phone: parsed.data.phone ?? null,
    },
  });

  // Refresh dashboard pages so the new values appear.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");

  return { ok: true, message: "Profil berhasil diperbarui." };
}
