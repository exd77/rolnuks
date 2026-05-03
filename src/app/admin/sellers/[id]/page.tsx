import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminSellerDecisionForm } from "@/components/forms/admin-seller-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSellerApplicationById } from "@/server/services/escrow";

export const metadata: Metadata = { title: "Detail Seller" };

export default async function AdminSellerDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const seller = await getSellerApplicationById(id);
  if (!seller) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/sellers">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {seller.storeName}
          </h1>
          <p className="text-muted-foreground text-sm">
            /{seller.storeSlug} • {seller.user.email}
          </p>
        </div>
        <Badge
          variant={
            seller.status === "APPROVED"
              ? "success"
              : seller.status === "REJECTED"
                ? "destructive"
                : "warning"
          }
        >
          {seller.status}
        </Badge>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Data KYC / Discord Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <span>Nama legal: {seller.fullName ?? "-"}</span>
            <span>KTP: {seller.ktpNumber ?? "-"}</span>
            <span>Phone: {seller.user.phone ?? "-"}</span>
            <span>Role user: {seller.user.role}</span>
            <span>Bank: {seller.bankName ?? "-"}</span>
            <span>
              Rekening: {seller.bankAccountName ?? "-"} •{" "}
              {seller.bankAccountNo ?? "-"}
            </span>
            <span>
              Apply: {new Date(seller.createdAt).toLocaleString("id-ID")}
            </span>
            <span>
              Approved:{" "}
              {seller.approvedAt
                ? new Date(seller.approvedAt).toLocaleString("id-ID")
                : "-"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Keputusan Admin</CardTitle>
          </CardHeader>
          <CardContent>
            {seller.status === "PENDING" ? (
              <AdminSellerDecisionForm sellerId={seller.id} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Aplikasi sudah {seller.status.toLowerCase()}.{" "}
                {seller.rejectedReason
                  ? `Alasan: ${seller.rejectedReason}`
                  : ""}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
