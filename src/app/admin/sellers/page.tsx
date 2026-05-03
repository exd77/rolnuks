import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";

import { AdminSellerDecisionForm } from "@/components/forms/admin-seller-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listSellerApplications } from "@/server/services/escrow";

export const metadata: Metadata = { title: "Verifikasi Seller" };

const STATUS: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "muted" }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  SUSPENDED: { label: "Suspended", variant: "muted" },
};

export default async function AdminSellersPage(props: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number.parseInt(searchParams.page ?? "1", 10);
  const status = searchParams.status ?? "PENDING";
  const { items, total, totalPages } = await listSellerApplications({
    page,
    status,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Verifikasi Seller
          </h1>
          <p className="text-muted-foreground text-sm">
            Review aplikasi seller dari Discord ticket/KYC ({total} aplikasi).
          </p>
        </div>
        <div className="flex gap-2">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <Button
              key={s}
              asChild
              variant={status === s ? "default" : "outline"}
              size="sm"
            >
              <Link href={`/admin/sellers?status=${s}`}>{s}</Link>
            </Button>
          ))}
        </div>
      </header>
      {items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-16 text-center text-sm">
            <Store className="mx-auto mb-2 size-7" />
            Belum ada aplikasi seller.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((seller) => {
            const badge = STATUS[seller.status] ?? {
              label: seller.status,
              variant: "muted" as const,
            };
            return (
              <Card key={seller.id}>
                <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/sellers/${seller.id}`}
                        className="hover:text-primary font-semibold"
                      >
                        {seller.storeName}
                      </Link>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="text-muted-foreground grid gap-1 text-sm sm:grid-cols-2">
                      <span>
                        Owner:{" "}
                        {seller.fullName ??
                          seller.user.name ??
                          seller.user.email}
                      </span>
                      <span>Email: {seller.user.email}</span>
                      <span>
                        Bank: {seller.bankName ?? "-"} •{" "}
                        {seller.bankAccountName ?? "-"}
                      </span>
                      <span>
                        Apply:{" "}
                        {new Date(seller.createdAt).toLocaleString("id-ID")}
                      </span>
                    </div>
                    {seller.rejectedReason && (
                      <p className="text-destructive text-sm">
                        Alasan reject: {seller.rejectedReason}
                      </p>
                    )}
                  </div>
                  {seller.status === "PENDING" ? (
                    <AdminSellerDecisionForm sellerId={seller.id} />
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/sellers/${seller.id}`}>Detail</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {totalPages > 1 && (
        <p className="text-muted-foreground text-center text-sm">
          Halaman {page} dari {totalPages}
        </p>
      )}
    </div>
  );
}
