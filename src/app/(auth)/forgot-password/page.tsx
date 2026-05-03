import type { Metadata } from "next";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Lupa Password",
  description:
    "Reset password akun ORBLOX kamu (fitur akan tersedia di Phase 2).",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Lupa password?</h1>
        <p className="text-muted-foreground text-sm">
          Kami sedang menyiapkan fitur reset password.
        </p>
      </div>

      <Alert variant="info">
        <AlertTitle>Belum tersedia di MVP</AlertTitle>
        <AlertDescription>
          Sementara ini, hubungi admin via tiket support setelah login. Fitur
          reset password mandiri akan dirilis di Phase 2.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-2">
        <Button asChild>
          <Link href="/login">Kembali ke login</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/kontak">Hubungi admin</Link>
        </Button>
      </div>
    </div>
  );
}
