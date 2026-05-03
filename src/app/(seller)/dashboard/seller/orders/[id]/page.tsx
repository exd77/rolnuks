import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";

import { auth } from "@/auth";
import { SellerMarkDeliveredForm } from "@/components/forms/seller-order-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatIDR } from "@/lib/utils";
import { getSellerOrderItem, getSellerProfile } from "@/server/services/seller";

export const metadata: Metadata = { title: "Detail Pesanan Seller" };

const BADGE: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "muted" | "info";
  }
> = {
  PENDING: { label: "Perlu Diproses", variant: "warning" },
  IN_PROGRESS: { label: "Diproses", variant: "info" },
  DELIVERED: { label: "Terkirim - Menunggu Buyer", variant: "info" },
  CONFIRMED: { label: "Dikonfirmasi Buyer", variant: "success" },
  AUTO_RELEASED: { label: "Auto Released", variant: "success" },
  DISPUTED: { label: "Dispute", variant: "destructive" },
};

export default async function SellerOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await getSellerProfile(session.user.id);
  if (!profile || profile.status !== "APPROVED")
    redirect("/dashboard/seller-apply");
  const { id } = await props.params;
  const item = await getSellerOrderItem(id, profile.id);
  if (!item) notFound();
  const badge = BADGE[item.fulfillmentStatus] ?? {
    label: item.fulfillmentStatus,
    variant: "muted" as const,
  };
  const canDeliver =
    item.fulfillmentStatus === "PENDING" ||
    item.fulfillmentStatus === "IN_PROGRESS";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/seller/orders">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {item.productTitle}
          </h1>
          <p className="text-muted-foreground text-sm">
            Order {item.order.orderNumber} • Buyer{" "}
            {item.order.buyer.name ?? item.order.buyer.email}
          </p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instruksi Fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {item.robloxUsernameTarget && (
              <p>
                Roblox username target:{" "}
                <span className="font-semibold">
                  {item.robloxUsernameTarget}
                </span>
              </p>
            )}
            {item.gamepassLink && (
              <p>
                Gamepass/link buyer:{" "}
                <a
                  className="text-primary underline"
                  href={item.gamepassLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka link
                </a>
              </p>
            )}
            <p className="text-muted-foreground">
              Kirim item via trade/manual sesuai produk. Setelah selesai, tandai
              terkirim supaya escrow masuk masa konfirmasi 48 jam.
            </p>
            {canDeliver ? (
              <SellerMarkDeliveredForm orderItemId={item.id} />
            ) : null}
            {item.fulfillmentNotes && (
              <p className="bg-muted text-muted-foreground rounded-md p-3">
                Catatan seller: {item.fulfillmentNotes}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escrow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatIDR(item.subtotal.toString())}</span>
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>Komisi</span>
              <span>
                {item.commissionAmount
                  ? formatIDR(item.commissionAmount.toString())
                  : "Belum release"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Estimasi diterima</span>
              <span>
                {item.sellerEarning
                  ? formatIDR(item.sellerEarning.toString())
                  : "Saat escrow release"}
              </span>
            </div>
            {item.autoReleaseAt && (
              <p className="bg-info/10 text-info flex gap-2 rounded-md p-3 text-xs">
                <Clock3 className="size-4" /> Auto-release{" "}
                {new Date(item.autoReleaseAt).toLocaleString("id-ID")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
