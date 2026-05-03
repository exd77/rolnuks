import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  XCircle,
  Package,
  Truck,
} from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConfirmDeliveryButton,
  OpenDisputeForm,
} from "@/components/forms/buyer-order-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatIDR } from "@/lib/utils";
import { getOrderForBuyer } from "@/server/services/order";

export const metadata: Metadata = {
  title: "Detail Pesanan",
};

const ORDER_STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "muted" | "info";
  }
> = {
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", variant: "warning" },
  PAID: { label: "Dibayar", variant: "info" },
  PROCESSING: { label: "Diproses", variant: "info" },
  DELIVERED: { label: "Dikirim", variant: "success" },
  COMPLETED: { label: "Selesai", variant: "success" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
  REFUNDED: { label: "Refund", variant: "muted" },
  DISPUTED: { label: "Sengketa", variant: "destructive" },
};

const FULFILLMENT_STATUS_MAP: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Menunggu",
    icon: <Clock3 className="text-muted-foreground size-4" />,
  },
  IN_PROGRESS: {
    label: "Sedang Diproses",
    icon: <Package className="text-info size-4" />,
  },
  DELIVERED: {
    label: "Terkirim",
    icon: <Truck className="text-success size-4" />,
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    icon: <CheckCircle2 className="text-success size-4" />,
  },
  AUTO_RELEASED: {
    label: "Auto Release",
    icon: <CheckCircle2 className="text-success size-4" />,
  },
  DISPUTED: {
    label: "Sengketa",
    icon: <XCircle className="text-destructive size-4" />,
  },
};

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const { id } = await props.params;
  const order = await getOrderForBuyer(id, session.user.id);

  if (!order) {
    notFound();
  }

  const statusInfo = ORDER_STATUS_MAP[order.status] ?? {
    label: order.status,
    variant: "muted" as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/orders">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pesanan #{order.orderNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            Dibuat{" "}
            {new Date(order.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge variant={statusInfo.variant} className="text-sm">
          {statusInfo.label}
        </Badge>
      </header>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => {
            const fulfillment = FULFILLMENT_STATUS_MAP[
              item.fulfillmentStatus
            ] ?? {
              label: item.fulfillmentStatus,
              icon: null,
            };
            return (
              <div key={item.id} className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-lg text-xs font-bold">
                  R$
                </div>
                <div className="flex-1 space-y-1">
                  <div className="font-medium">{item.productTitle}</div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    {fulfillment.icon}
                    <span>{fulfillment.label}</span>
                  </div>
                  {item.robloxUsernameTarget && (
                    <div className="text-muted-foreground text-xs">
                      Roblox:{" "}
                      <span className="font-medium">
                        {item.robloxUsernameTarget}
                      </span>
                    </div>
                  )}
                  {item.gamepassLink && (
                    <div className="text-muted-foreground text-xs">
                      Gamepass:{" "}
                      <a
                        href={item.gamepassLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Lihat link
                      </a>
                    </div>
                  )}
                  {item.proofScreenshot && (
                    <div className="text-success text-xs">
                      Bukti pengiriman tersedia
                    </div>
                  )}
                  {item.fulfillmentStatus === "DELIVERED" && (
                    <div className="pt-2">
                      <ConfirmDeliveryButton orderItemId={item.id} />
                    </div>
                  )}
                </div>
                <div className="text-right text-sm font-medium">
                  {formatIDR(item.subtotal.toString())}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatIDR(order.subtotal.toString())}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary">
              {formatIDR(order.total.toString())}
            </span>
          </div>
          {order.payment && (
            <div className="text-muted-foreground mt-2 space-y-1 text-xs">
              {order.payment.paymentType && (
                <div>
                  Metode:{" "}
                  <span className="capitalize">
                    {order.payment.paymentType.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              {order.payment.paidAt && (
                <div>
                  Dibayar:{" "}
                  {new Date(order.payment.paidAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status timeline hint */}
      {order.status === "PENDING_PAYMENT" && (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            <Clock3 className="text-warning mx-auto size-6" />
            <p className="mt-2">
              Menunggu pembayaran. Selesaikan pembayaran sebelum expired.
            </p>
          </CardContent>
        </Card>
      )}

      {(order.status === "PAID" || order.status === "PROCESSING") && (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            <Package className="text-info mx-auto size-6" />
            <p className="mt-2">
              Pembayaran berhasil! Seller/admin sedang memproses pesanan kamu.
            </p>
          </CardContent>
        </Card>
      )}

      {["PAID", "PROCESSING", "DELIVERED"].includes(order.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ada masalah?</CardTitle>
          </CardHeader>
          <CardContent>
            <OpenDisputeForm orderId={order.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
