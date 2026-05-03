import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import {
  getSellerDashboardStats,
  getSellerProfile,
} from "@/server/services/seller";

export const metadata: Metadata = {
  title: "Dashboard Seller",
};

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getSellerProfile(session.user.id);
  if (!profile) redirect("/dashboard/seller-apply");

  const stats = await getSellerDashboardStats(profile.id);

  const cards = [
    {
      label: "Saldo Tersedia",
      value: formatIDR(stats.availableBalance.toString()),
      icon: Wallet,
      hint: "Bisa dicairkan",
      tone: "text-success",
    },
    {
      label: "Saldo Pending",
      value: formatIDR(stats.pendingBalance.toString()),
      icon: TrendingUp,
      hint: "Sedang dalam escrow",
      tone: "text-info",
    },
    {
      label: "Pesanan Aktif",
      value: stats.pendingOrders.toString(),
      icon: ShoppingBag,
      hint: "Perlu fulfillment",
      tone: "text-warning",
    },
    {
      label: "Produk Aktif",
      value: `${stats.activeProducts}/${stats.totalProducts}`,
      icon: Package,
      hint: "Listing live",
      tone: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Halo, {profile.storeName}
        </h1>
        <p className="text-muted-foreground text-sm">
          Ringkasan performa toko kamu di ORBLOX.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">{c.label}</p>
                  <p className="text-xl font-bold">{c.value}</p>
                  <p className="text-muted-foreground text-xs">{c.hint}</p>
                </div>
                <div
                  className={`bg-muted grid size-10 shrink-0 place-items-center rounded-lg ${c.tone}`}
                >
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-6">
            <h3 className="font-semibold">Mulai Listing Produk</h3>
            <p className="text-muted-foreground text-sm">
              Tambahkan item game baru untuk dijual ke pelanggan.
            </p>
            <Button asChild>
              <Link href="/dashboard/seller/products/baru">
                Tambah Produk
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h3 className="font-semibold">Cek Pesanan Masuk</h3>
            <p className="text-muted-foreground text-sm">
              {stats.pendingOrders > 0
                ? `${stats.pendingOrders} pesanan menunggu untuk dikirim.`
                : "Tidak ada pesanan yang menunggu."}
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/seller/orders">
                Lihat Pesanan
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
