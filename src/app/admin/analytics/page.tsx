import type { Metadata } from "next";
import {
  BarChart3,
  CircleDollarSign,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { getAdminAnalytics } from "@/server/services/admin-analytics";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const data = await getAdminAnalytics();
  const stats = [
    {
      label: "Revenue 30 Hari",
      value: formatIDR(data.grossRevenue30.toString()),
      icon: CircleDollarSign,
    },
    {
      label: "Paid Orders 30 Hari",
      value: data.paidOrders30.toLocaleString("id-ID"),
      icon: ShoppingCart,
    },
    {
      label: "AOV 30 Hari",
      value: formatIDR(String(Math.round(data.averageOrderValue30))),
      icon: BarChart3,
    },
    {
      label: "User Baru",
      value: data.newUsers30.toLocaleString("id-ID"),
      icon: Users,
    },
    {
      label: "Seller Aktif",
      value: data.activeSellers.toLocaleString("id-ID"),
      icon: Store,
    },
    {
      label: "Pending Payout",
      value: formatIDR(data.pendingPayoutAmount.toString()),
      icon: Wallet,
    },
  ];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Ringkasan revenue, order, seller, payout, dan funnel 7/30 hari.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-muted-foreground text-sm">
                  {s.label}
                </CardTitle>
                <Icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue 7 Hari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.daily.map((d) => (
              <div
                key={d.date}
                className="border-border flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <span>
                  {new Date(d.date).toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="text-muted-foreground">{d.orders} order</span>
                <span className="font-mono font-semibold">
                  {formatIDR(d.revenue.toString())}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Produk 30 Hari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Belum ada penjualan.
              </p>
            ) : (
              data.topProducts.map((p) => (
                <div
                  key={p.productTitle}
                  className="border-border flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.productTitle}</div>
                    <div className="text-muted-foreground text-xs">
                      {p._count} order • qty {p._sum.quantity ?? 0}
                    </div>
                  </div>
                  <div className="font-mono font-semibold">
                    {formatIDR((p._sum.subtotal ?? 0).toString())}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seller Balance Health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-4">
          <div>
            Seller earnings:{" "}
            <strong>{formatIDR(data.sellerEarnings.toString())}</strong>
          </div>
          <div>
            Pending escrow:{" "}
            <strong>{formatIDR(data.sellerPending.toString())}</strong>
          </div>
          <div>
            Available:{" "}
            <strong>{formatIDR(data.sellerAvailable.toString())}</strong>
          </div>
          <div>
            Open disputes: <strong>{data.openDisputes}</strong>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
