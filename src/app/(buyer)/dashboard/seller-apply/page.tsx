import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ShieldX } from "lucide-react";

import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSellerProfile } from "@/server/services/seller";

import { SellerApplyForm } from "./seller-apply-form";

export const metadata: Metadata = {
  title: "Daftar jadi Seller",
};

export default async function SellerApplyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/seller-apply");

  const profile = await getSellerProfile(session.user.id);

  // If already approved, send straight to seller dashboard
  if (profile?.status === "APPROVED") {
    redirect("/dashboard/seller");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Daftar jadi Seller
        </h1>
        <p className="text-muted-foreground text-sm">
          Jual item game di ORBLOX. Fee platform 3% per transaksi yang berhasil.
        </p>
      </header>

      {profile?.status === "PENDING" && (
        <Alert variant="info">
          <Clock3 />
          <AlertTitle>Aplikasi sedang ditinjau</AlertTitle>
          <AlertDescription>
            Aplikasi seller kamu untuk toko{" "}
            <span className="font-semibold">{profile.storeName}</span> sedang
            ditinjau admin. Kami akan kirim notifikasi setelah keputusan dibuat.
          </AlertDescription>
        </Alert>
      )}

      {profile?.status === "REJECTED" && (
        <Alert variant="destructive">
          <ShieldX />
          <AlertTitle>Aplikasi ditolak</AlertTitle>
          <AlertDescription>
            {profile.rejectedReason ?? "Tidak memenuhi syarat."}
            <br />
            Silakan ajukan ulang dengan data yang sudah diperbaiki.
          </AlertDescription>
        </Alert>
      )}

      {profile?.status === "SUSPENDED" && (
        <Alert variant="destructive">
          <ShieldX />
          <AlertTitle>Akun seller ditangguhkan</AlertTitle>
          <AlertDescription>
            Hubungi admin untuk informasi lebih lanjut.
          </AlertDescription>
        </Alert>
      )}

      {profile?.status !== "PENDING" && profile?.status !== "SUSPENDED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Aplikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <SellerApplyForm
              defaults={{
                storeName: profile?.storeName ?? "",
                description: profile?.description ?? "",
                fullName: profile?.fullName ?? "",
                bankName: profile?.bankName ?? "",
                bankAccountNo: profile?.bankAccountNo ?? "",
                bankAccountName: profile?.bankAccountName ?? "",
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle className="text-base">Apa yang akan kamu dapat?</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
            <span>
              Halaman toko sendiri dengan listing item game (Adopt Me, Blox
              Fruits, dll.).
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
            <span>Sistem escrow — dana buyer aman sampai item diterima.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
            <span>
              Payout ke rekening bank kapan saja sesuai saldo tersedia (fee 3%
              dipotong otomatis).
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
            <span>Dukungan admin untuk dispute & sengketa.</span>
          </div>
          <div className="pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/faq">Pelajari FAQ Seller</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
