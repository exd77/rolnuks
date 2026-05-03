import type { Metadata } from "next";
import Link from "next/link";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const [productCount, orderCount, userCount, pendingOrders] =
    await Promise.all([
      prisma.product.count({ where: { sellerId: null } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.count({ where: { status: "PAID" } }),
    ]);

  const stats = [
    {
      label: "Produk Robux",
      value: productCount,
      icon: Package,
      href: "/admin/produk",
    },
    {
      label: "Total Pesanan",
      value: orderCount,
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      label: "Pengguna",
      value: userCount,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Perlu Diproses",
      value: pendingOrders,
      icon: DollarSign,
      href: "/admin/orders?status=PAID",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground text-sm">
          Selamat datang di panel administrasi ORBLOX.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <Icon className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
