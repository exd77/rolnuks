import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { listAdminPayouts } from "@/server/services/admin-payout";

export const metadata: Metadata = { title: "Payout Seller" };

const STATUS: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "muted" | "info";
  }
> = {
  REQUESTED: { label: "Requested", variant: "warning" },
  APPROVED: { label: "Approved", variant: "info" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  COMPLETED: { label: "Completed", variant: "success" },
};

export default async function AdminPayoutsPage(props: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number.parseInt(searchParams.page ?? "1", 10);
  const { items, total, totalPages } = await listAdminPayouts({
    page,
    status: searchParams.status,
  });
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Seller</h1>
          <p className="text-muted-foreground text-sm">
            Manual payout request dari seller ({total} request).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["REQUESTED", "APPROVED", "COMPLETED", "REJECTED"].map((s) => (
            <Button
              key={s}
              asChild
              variant={searchParams.status === s ? "default" : "outline"}
              size="sm"
            >
              <Link href={`/admin/payouts?status=${s}`}>{s}</Link>
            </Button>
          ))}
        </div>
      </header>
      {items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-16 text-center text-sm">
            <Wallet className="mx-auto mb-2 size-7" />
            Belum ada payout.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const s = STATUS[p.status] ?? {
              label: p.status,
              variant: "muted" as const,
            };
            return (
              <Link
                key={p.id}
                href={`/admin/payouts/${p.id}`}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {p.payoutNumber}
                        </span>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                      <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span>{p.seller.storeName}</span>
                        <span>
                          {p.bankName} • {p.bankAccountName}
                        </span>
                        <span>
                          {new Date(p.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-sm font-semibold">
                      {formatIDR(p.amount.toString())}
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
