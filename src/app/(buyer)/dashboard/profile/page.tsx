import type { Metadata } from "next";

import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Profil",
};

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: {
      email: true,
      name: true,
      robloxUsername: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-sm">
          Kelola informasi akun & data Roblox kamu.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Informasi akun</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <Field label="Email" value={user.email} />
            <Field
              label="Tipe akun"
              value={
                user.role === "ADMIN"
                  ? "Admin"
                  : user.role === "STAFF"
                    ? "Staff"
                    : user.role === "SELLER"
                      ? "Seller"
                      : "Buyer"
              }
            />
            <Field
              label="Bergabung sejak"
              value={new Intl.DateTimeFormat("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(user.createdAt)}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit profil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaults={{
              name: user.name ?? "",
              robloxUsername: user.robloxUsername ?? "",
              phone: user.phone ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
