import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminPayoutActionForm } from "@/components/forms/admin-payout-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatIDR } from "@/lib/utils";
import { getAdminPayoutById } from "@/server/services/admin-payout";

export const metadata: Metadata = { title: "Detail Payout" };

export default async function AdminPayoutDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const payout = await getAdminPayoutById(id);
  if (!payout) notFound();
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/payouts">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {payout.payoutNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            {payout.seller.storeName} • {payout.seller.user.email}
          </p>
        </div>
        <Badge
          variant={
            payout.status === "COMPLETED"
              ? "success"
              : payout.status === "REJECTED"
                ? "destructive"
                : "warning"
          }
        >
          {payout.status}
        </Badge>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detail Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Jumlah</span>
              <span className="font-mono font-semibold">
                {formatIDR(payout.amount.toString())}
              </span>
            </div>
            <Separator />
            <div className="grid gap-2 sm:grid-cols-2">
              <span>Bank: {payout.bankName}</span>
              <span>No Rek: {payout.bankAccountNo}</span>
              <span>Nama Rek: {payout.bankAccountName}</span>
              <span>
                Request: {new Date(payout.createdAt).toLocaleString("id-ID")}
              </span>
              <span>
                Processed:{" "}
                {payout.processedAt
                  ? new Date(payout.processedAt).toLocaleString("id-ID")
                  : "-"}
              </span>
              <span>
                By:{" "}
                {payout.processedBy?.name ?? payout.processedBy?.email ?? "-"}
              </span>
            </div>
            {payout.rejectedReason && (
              <p className="bg-destructive/10 text-destructive rounded-md p-3">
                Reject: {payout.rejectedReason}
              </p>
            )}
            {payout.proofImage && (
              <a
                className="text-primary underline"
                href={payout.proofImage}
                target="_blank"
                rel="noreferrer"
              >
                Buka bukti transfer
              </a>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aksi Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminPayoutActionForm
              payoutId={payout.id}
              status={payout.status}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
