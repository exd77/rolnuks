import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminResolveDisputeForm } from "@/components/forms/admin-dispute-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { getDisputeById } from "@/server/services/escrow";

export const metadata: Metadata = { title: "Detail Dispute" };

export default async function AdminDisputeDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const dispute = await getDisputeById(id);
  if (!dispute) notFound();
  const isResolved = ["RESOLVED_BUYER", "RESOLVED_SELLER", "CLOSED"].includes(
    dispute.status,
  );
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/disputes">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dispute {dispute.order.orderNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            Dibuka oleh {dispute.openedBy.name ?? dispute.openedBy.email}
          </p>
        </div>
        <Badge variant={isResolved ? "success" : "destructive"}>
          {dispute.status}
        </Badge>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kronologi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">Alasan:</span> {dispute.reason}
            </p>
            <p className="bg-muted text-muted-foreground rounded-md p-3">
              {dispute.description ?? "Tidak ada deskripsi tambahan."}
            </p>
            <div className="space-y-2">
              {dispute.order.items.map((item) => (
                <div
                  key={item.id}
                  className="border-border flex justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{item.productTitle}</div>
                    <div className="text-muted-foreground text-xs">
                      Seller: {item.seller?.storeName ?? "Admin"} •{" "}
                      {item.fulfillmentStatus}
                    </div>
                  </div>
                  <div className="font-mono">
                    {formatIDR(item.subtotal.toString())}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolusi</CardTitle>
          </CardHeader>
          <CardContent>
            {isResolved ? (
              <p className="text-muted-foreground text-sm">
                Sudah diselesaikan: {dispute.resolution ?? dispute.status}
              </p>
            ) : (
              <AdminResolveDisputeForm disputeId={dispute.id} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
