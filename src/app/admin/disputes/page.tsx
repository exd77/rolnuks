import type { Metadata } from "next";
import Link from "next/link";
import { Siren } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { listDisputes } from "@/server/services/escrow";

export const metadata: Metadata = { title: "Disputes" };

const STATUS: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "muted" | "info";
  }
> = {
  OPEN: { label: "Open", variant: "destructive" },
  IN_REVIEW: { label: "In Review", variant: "warning" },
  RESOLVED_BUYER: { label: "Buyer Win", variant: "info" },
  RESOLVED_SELLER: { label: "Seller Win", variant: "success" },
  CLOSED: { label: "Closed", variant: "muted" },
};

export default async function AdminDisputesPage(props: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number.parseInt(searchParams.page ?? "1", 10);
  const { items, total, totalPages } = await listDisputes({
    page,
    status: searchParams.status,
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Disputes</h1>
        <p className="text-muted-foreground text-sm">
          Antrian sengketa buyer-seller ({total} dispute).
        </p>
      </header>
      {items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-16 text-center text-sm">
            <Siren className="mx-auto mb-2 size-7" />
            Belum ada dispute.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((d) => {
            const s = STATUS[d.status] ?? {
              label: d.status,
              variant: "muted" as const,
            };
            return (
              <Link
                key={d.id}
                href={`/admin/disputes/${d.id}`}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{d.reason}</span>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                      <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span>{d.order.orderNumber}</span>
                        <span>{d.openedBy.name ?? d.openedBy.email}</span>
                        <span>
                          {new Date(d.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-sm font-semibold">
                      {formatIDR(d.order.total.toString())}
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
