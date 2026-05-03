import type { Metadata } from "next";
import Link from "next/link";
import { ListOrdered } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { listBuyerOrders } from "@/server/services/order";

export const metadata: Metadata = {
  title: "Pesanan saya",
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
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
  REFUNDED: { label: "Refund", variant: "muted" },
  DISPUTED: { label: "Sengketa", variant: "destructive" },
};

export default async function OrdersPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page ?? "1", 10);
  const { items, total, totalPages } = await listBuyerOrders(session.user.id, {
    page,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Pesanan saya</h1>
        <p className="text-muted-foreground text-sm">
          Riwayat semua transaksi kamu di ORBLOX ({total} pesanan).
        </p>
      </header>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="bg-muted text-muted-foreground mx-auto grid size-12 place-items-center rounded-full">
              <ListOrdered className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Belum ada pesanan</h2>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              Setelah kamu melakukan checkout, riwayat transaksi akan muncul di
              sini.
            </p>
            <Button asChild className="mt-4">
              <Link href="/katalog">Lihat katalog</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((order) => {
            const status = STATUS_BADGE[order.status] ?? {
              label: order.status,
              variant: "muted" as const,
            };
            const firstItem = order.items[0];
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg text-xs font-bold">
                      R$
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {firstItem?.productTitle ?? order.orderNumber}
                        </span>
                        <Badge variant={status.variant} className="shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                        <span>{order.orderNumber}</span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-sm font-semibold">
                      {formatIDR(order.total.toString())}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {page > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/orders?page=${page - 1}`}>
                    Sebelumnya
                  </Link>
                </Button>
              )}
              <span className="text-muted-foreground text-sm">
                Halaman {page} dari {totalPages}
              </span>
              {page < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/orders?page=${page + 1}`}>
                    Selanjutnya
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
