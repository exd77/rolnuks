import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatIDR } from "@/lib/utils";
import { getAdminOrderDetail } from "@/server/services/admin-order";
import { FulfillForm } from "./fulfill-form";

export const metadata: Metadata = {
  title: "Detail Pesanan — Admin",
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

const FULFILLMENT_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock3 className="text-muted-foreground size-4" />,
  IN_PROGRESS: <Package className="text-info size-4" />,
  DELIVERED: <Truck className="text-success size-4" />,
  CONFIRMED: <CheckCircle2 className="text-success size-4" />,
  AUTO_RELEASED: <CheckCircle2 className="text-success size-4" />,
  DISPUTED: <XCircle className="text-destructive size-4" />,
};

export default async function AdminOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const order = await getAdminOrderDetail(id);

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
          <Link href="/admin/orders">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {order.orderNumber}
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
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant} className="text-sm">
            {statusInfo.label}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <a
              href={`/api/invoice/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="size-4" />
              Invoice
            </a>
          </Button>
        </div>
      </header>

      {/* Buyer info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Buyer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Nama:</span>{" "}
            <span className="font-medium">{order.buyer.name ?? "-"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{order.buyer.email}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Roblox:</span>{" "}
            <span className="font-medium">
              {order.buyer.robloxUsername ?? "-"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Telepon:</span>{" "}
            <span className="font-medium">{order.buyer.phone ?? "-"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Order Items + Fulfillment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Item Pesanan & Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {order.items.map((item) => {
            const canFulfill =
              item.fulfillmentStatus === "IN_PROGRESS" ||
              item.fulfillmentStatus === "PENDING";
            const isDelivered =
              item.fulfillmentStatus === "DELIVERED" ||
              item.fulfillmentStatus === "CONFIRMED" ||
              item.fulfillmentStatus === "AUTO_RELEASED";

            return (
              <div
                key={item.id}
                className="border-border space-y-3 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-medium">{item.productTitle}</div>
                    <div className="text-muted-foreground text-sm">
                      {formatIDR(item.unitPrice.toString())} x {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {FULFILLMENT_ICON[item.fulfillmentStatus]}
                    <span className="capitalize">
                      {item.fulfillmentStatus.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Delivery info */}
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  {item.robloxUsernameTarget && (
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground text-xs">
                        Username Roblox:
                      </span>
                      <div className="font-mono font-medium">
                        {item.robloxUsernameTarget}
                      </div>
                    </div>
                  )}
                  {item.gamepassLink && (
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground text-xs">
                        Gamepass Link:
                      </span>
                      <div>
                        <a
                          href={item.gamepassLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        >
                          Buka <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fulfillment notes */}
                {item.fulfillmentNotes && (
                  <div className="text-muted-foreground text-xs">
                    Catatan fulfillment: {item.fulfillmentNotes}
                  </div>
                )}
                {item.fulfilledAt && item.fulfilledBy && (
                  <div className="text-success text-xs">
                    Dikirim oleh{" "}
                    {item.fulfilledBy.name ?? item.fulfilledBy.email} pada{" "}
                    {new Date(item.fulfilledAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}

                {/* Fulfill action */}
                {canFulfill && (
                  <>
                    <Separator />
                    <FulfillForm orderItemId={item.id} />
                  </>
                )}

                {isDelivered && (
                  <div className="text-success flex items-center gap-2 text-xs">
                    <CheckCircle2 className="size-3" />
                    Item sudah dikirim
                    {item.autoReleaseAt && (
                      <span className="text-muted-foreground">
                        {" "}
                        (auto-release:{" "}
                        {new Date(item.autoReleaseAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                        )
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Payment info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
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
            <div className="text-muted-foreground space-y-1 pt-2 text-xs">
              <div>
                Status: <Badge variant="muted">{order.payment.status}</Badge>
              </div>
              {order.payment.paymentType && (
                <div>
                  Metode: {order.payment.paymentType.replace(/_/g, " ")}
                </div>
              )}
              {order.payment.transactionId && (
                <div>Transaksi ID: {order.payment.transactionId}</div>
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

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catatan Buyer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-line">
              {order.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
