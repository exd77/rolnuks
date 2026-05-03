import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";

import { auth } from "@/auth";
import { PayoutRequestForm } from "@/components/forms/payout-request-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import {
  getSellerEarnings,
  getSellerProfile,
  listSellerPayouts,
} from "@/server/services/seller";

export const metadata: Metadata = { title: "Saldo & Payout" };

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

export default async function SellerEarningsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await getSellerProfile(session.user.id);
  if (!profile || profile.status !== "APPROVED")
    redirect("/dashboard/seller-apply");
  const page = Number.parseInt((await props.searchParams).page ?? "1", 10);
  const [earnings, payouts] = await Promise.all([
    getSellerEarnings(profile.id),
    listSellerPayouts(profile.id, { page }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Saldo & Payout</h1>
        <p className="text-muted-foreground text-sm">
          Dana escrow masuk available balance setelah buyer confirm /
          auto-release.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available</CardTitle>
          </CardHeader>
          <CardContent className="text-success text-2xl font-bold">
            {formatIDR((earnings?.availableBalance ?? 0).toString())}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Escrow</CardTitle>
          </CardHeader>
          <CardContent className="text-warning-foreground text-2xl font-bold">
            {formatIDR((earnings?.pendingBalance ?? 0).toString())}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatIDR((earnings?.totalEarnings ?? 0).toString())}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <PayoutRequestForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Payout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payouts.items.length === 0 ? (
              <div className="text-muted-foreground py-10 text-center text-sm">
                <Wallet className="mx-auto mb-2 size-6" />
                Belum ada payout.
              </div>
            ) : (
              payouts.items.map((p) => {
                const s = STATUS[p.status] ?? {
                  label: p.status,
                  variant: "muted" as const,
                };
                return (
                  <div
                    key={p.id}
                    className="border-border flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{p.payoutNumber}</div>
                      <div className="text-muted-foreground text-xs">
                        {p.bankName} • {p.bankAccountName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold">
                        {formatIDR(p.amount.toString())}
                      </div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
