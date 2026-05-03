import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ListOrdered,
  ShoppingBag,
} from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatIDR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardHomePage() {
  const session = await auth();
  // Layout already enforces auth; non-null assertion safe here.
  const userId = session!.user.id;

  const [user, totals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        robloxUsername: true,
        balance: true,
        createdAt: true,
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { buyerId: userId },
      _count: { _all: true },
    }),
  ]);

  if (!user) {
    return null;
  }

  const totalsMap = new Map(totals.map((t) => [t.status, t._count._all]));
  const orderCount = totals.reduce((acc, t) => acc + t._count._all, 0);
  const completedCount = totalsMap.get("COMPLETED") ?? 0;
  const pendingCount =
    (totalsMap.get("PENDING_PAYMENT") ?? 0) +
    (totalsMap.get("PAID") ?? 0) +
    (totalsMap.get("PROCESSING") ?? 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Halo, {user.name ?? "buyer"} 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          Selamat datang di dashboard ORBLOX kamu.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total pesanan"
          value={orderCount.toLocaleString("id-ID")}
          icon={<ListOrdered className="size-5" />}
        />
        <StatCard
          label="Sedang diproses"
          value={pendingCount.toLocaleString("id-ID")}
          icon={<Clock3 className="size-5" />}
          accent="warning"
        />
        <StatCard
          label="Selesai"
          value={completedCount.toLocaleString("id-ID")}
          icon={<CheckCircle2 className="size-5" />}
          accent="success"
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Profil Roblox kamu</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {user.robloxUsername ? (
                <>
                  Username:{" "}
                  <span className="text-foreground font-medium">
                    {user.robloxUsername}
                  </span>
                </>
              ) : (
                "Belum diisi — lengkapi agar checkout lebih cepat."
              )}
            </p>
          </div>
          <Button asChild variant={user.robloxUsername ? "outline" : "default"}>
            <Link href="/dashboard/profile">
              {user.robloxUsername ? "Edit profil" : "Lengkapi profil"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-md">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Belum ada pesanan?</h2>
              <p className="text-muted-foreground text-sm">
                Mulai dari Robux Gamepass termurah Rp 12.000 atau jelajahi item
                game pilihan.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/katalog">Belanja sekarang</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-6">
          <h2 className="text-lg font-semibold">Saldo akun</h2>
          <p className="text-primary text-3xl font-bold">
            {formatIDR(user.balance.toString())}
          </p>
          <p className="text-muted-foreground text-xs">
            Saldo dapat dipakai sebagai metode pembayaran (akan tersedia di
            Phase 2).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "default" | "success" | "warning";
}) {
  const accentClasses: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning-foreground",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`grid size-10 shrink-0 place-items-center rounded-md ${accentClasses[accent]}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-muted-foreground text-xs">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
