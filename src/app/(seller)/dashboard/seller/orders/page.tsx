import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageCheck } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactSellerMarkDeliveredButton } from "@/components/forms/seller-order-actions";
import { formatIDR } from "@/lib/utils";
import { getSellerProfile, listSellerOrders } from "@/server/services/seller";

export const metadata: Metadata = { title: "Pesanan Masuk" };

const FULFILLMENT_BADGE: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "muted" | "info";
  }
> = {
  PENDING: { label: "Perlu Diproses", variant: "warning" },
  IN_PROGRESS: { label: "Diproses", variant: "info" },
  DELIVERED: { label: "Terkirim", variant: "info" },
  CONFIRMED: { label: "Dikonfirmasi", variant: "success" },
  AUTO_RELEASED: { label: "Auto Release", variant: "success" },
  DISPUTED: { label: "Dispute", variant: "destructive" },
};

export default async function SellerOrdersPage(props: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await getSellerProfile(session.user.id);
  if (!profile || profile.status !== "APPROVED")
    redirect("/dashboard/seller-apply");

  const searchParams = await props.searchParams;
  const page = Number.parseInt(searchParams.page ?? "1", 10);
  const status = searchParams.status;
  const { items, total, totalPages } = await listSellerOrders(profile.id, {
    page,
    status,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Pesanan Masuk</h1>
        <p className="text-muted-foreground text-sm">
          Semua item order yang harus diproses seller ({total} item).
        </p>
      </header>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="bg-muted text-muted-foreground mx-auto grid size-12 place-items-center rounded-full">
              <PackageCheck className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              Belum ada pesanan masuk
            </h2>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              Pesanan seller akan tampil setelah buyer membayar produk ITEM_GAME
              kamu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const badge = FULFILLMENT_BADGE[item.fulfillmentStatus] ?? {
              label: item.fulfillmentStatus,
              variant: "muted" as const,
            };
            const canDeliver =
              item.fulfillmentStatus === "PENDING" ||
              item.fulfillmentStatus === "IN_PROGRESS";
            return (
              <Card key={item.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <Link
                    href={`/dashboard/seller/orders/${item.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {item.productTitle}
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span>{item.order.orderNumber}</span>
                      <span>
                        Buyer: {item.order.buyer.name ?? item.order.buyer.email}
                      </span>
                      {item.robloxUsernameTarget && (
                        <span>Roblox: {item.robloxUsernameTarget}</span>
                      )}
                    </div>
                  </Link>
                  <div className="font-mono text-sm font-semibold">
                    {formatIDR(item.subtotal.toString())}
                  </div>
                  {canDeliver ? (
                    <CompactSellerMarkDeliveredButton orderItemId={item.id} />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
          {totalPages > 1 && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 pt-4 text-sm">
              {page > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/seller/orders?page=${page - 1}`}>
                    Sebelumnya
                  </Link>
                </Button>
              )}
              <span>
                Halaman {page} dari {totalPages}
              </span>
              {page < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/seller/orders?page=${page + 1}`}>
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
