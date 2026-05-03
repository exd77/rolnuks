import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, CheckCircle2, Truck, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import {
  listAdminOrders,
  getAdminOrderStats,
} from "@/server/services/admin-order";

export const metadata: Metadata = {
  title: "Pesanan — Admin",
};

const STATUS_BADGE: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "muted" | "info";
  }
> = {
  PENDING_PAYMENT: { label: "Menunggu Bayar", variant: "warning" },
  PAID: { label: "Dibayar", variant: "info" },
  PROCESSING: { label: "Diproses", variant: "info" },
  DELIVERED: { label: "Dikirim", variant: "success" },
  COMPLETED: { label: "Selesai", variant: "success" },
  CANCELLED: { label: "Batal", variant: "destructive" },
  REFUNDED: { label: "Refund", variant: "muted" },
  DISPUTED: { label: "Sengketa", variant: "destructive" },
};

const FULFILLMENT_BADGE: Record<
  string,
  { label: string; variant: "success" | "warning" | "info" | "muted" }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  IN_PROGRESS: { label: "Proses", variant: "info" },
  DELIVERED: { label: "Terkirim", variant: "success" },
  CONFIRMED: { label: "Dikonfirmasi", variant: "success" },
  AUTO_RELEASED: { label: "Auto Release", variant: "muted" },
  DISPUTED: { label: "Dispute", variant: "warning" },
};

type StatusFilter =
  | "ALL"
  | "PAID"
  | "PROCESSING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

const FILTER_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "PAID", label: "Perlu Diproses" },
  { value: "PROCESSING", label: "Sedang Proses" },
  { value: "DELIVERED", label: "Terkirim" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Batal" },
];

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page ?? "1", 10);
  const statusFilter = (searchParams.status ?? "ALL") as StatusFilter;
  const search = searchParams.search;

  const [ordersResult, stats] = await Promise.all([
    listAdminOrders({
      page,
      status: statusFilter === "ALL" ? undefined : (statusFilter as never),
      search,
    }),
    getAdminOrderStats(),
  ]);

  const { items, total, totalPages } = ordersResult;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pesanan</h1>
        <p className="text-muted-foreground text-sm">
          Queue fulfillment Robux — proses pesanan yang sudah dibayar.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Clock3 className="size-4" />}
          label="Perlu Diproses"
          value={stats.paid}
          accent="warning"
        />
        <StatCard
          icon={<Package className="size-4" />}
          label="Sedang Proses"
          value={stats.processing}
          accent="info"
        />
        <StatCard
          icon={<Truck className="size-4" />}
          label="Terkirim"
          value={stats.delivered}
          accent="success"
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          label="Total Order"
          value={stats.total}
          accent="default"
        />
      </div>

      {/* Filter tabs */}
      <div className="border-border flex flex-wrap gap-1 border-b pb-2">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.value}
            asChild
            variant={statusFilter === tab.value ? "default" : "ghost"}
            size="sm"
          >
            <Link
              href={`/admin/orders?status=${tab.value}${search ? `&search=${search}` : ""}`}
            >
              {tab.label}
            </Link>
          </Button>
        ))}
      </div>

      {/* Search */}
      <form method="GET" className="flex max-w-md gap-2">
        <input type="hidden" name="status" value={statusFilter} />
        <input
          type="text"
          name="search"
          placeholder="Cari order ID / username Roblox..."
          defaultValue={search ?? ""}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <Button type="submit" variant="outline" size="sm">
          Cari
        </Button>
      </form>

      {/* Orders table */}
      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Order</th>
              <th className="px-4 py-3 text-left font-medium">Buyer</th>
              <th className="px-4 py-3 text-left font-medium">Item</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Fulfillment</th>
              <th className="px-4 py-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  Tidak ada pesanan ditemukan.
                </td>
              </tr>
            )}
            {items.map((order) => {
              const status =
                STATUS_BADGE[order.status] ?? STATUS_BADGE.PENDING_PAYMENT;
              const firstItem = order.items[0];
              const fulfillment = firstItem
                ? (FULFILLMENT_BADGE[firstItem.fulfillmentStatus] ??
                  FULFILLMENT_BADGE.PENDING)
                : FULFILLMENT_BADGE.PENDING;
              return (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{order.orderNumber}</div>
                    <div className="text-muted-foreground text-xs">
                      {order.paidAt
                        ? new Date(order.paidAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(order.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.buyer.name ?? "-"}</div>
                    <div className="text-muted-foreground text-xs">
                      {order.buyer.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[180px] truncate">
                      {firstItem?.productTitle ?? "-"}
                    </div>
                    {firstItem?.robloxUsernameTarget && (
                      <div className="text-muted-foreground text-xs">
                        @{firstItem.robloxUsernameTarget}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatIDR(order.total.toString())}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={fulfillment.variant}>
                      {fulfillment.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/orders/${order.id}`}>Detail</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/admin/orders?page=${page - 1}&status=${statusFilter}${search ? `&search=${search}` : ""}`}
              >
                Sebelumnya
              </Link>
            </Button>
          )}
          <span className="text-muted-foreground text-sm">
            Halaman {page}/{totalPages} ({total} pesanan)
          </span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/admin/orders?page=${page + 1}&status=${statusFilter}${search ? `&search=${search}` : ""}`}
              >
                Selanjutnya
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "warning" | "info" | "success" | "default";
}) {
  const bgMap = {
    warning: "bg-warning/10 text-warning-foreground",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    default: "bg-muted text-muted-foreground",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`grid size-8 place-items-center rounded-md ${bgMap[accent]}`}
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
