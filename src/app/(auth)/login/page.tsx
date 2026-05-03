import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke akun ORBLOX kamu untuk mulai belanja Robux & item game.",
};

interface PageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    registered?: string;
  }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Masuk ke ORBLOX</h1>
        <p className="text-muted-foreground text-sm">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>

      {sp.registered === "1" && (
        <div
          className="border-success/40 bg-success/5 text-success rounded-md border px-4 py-3 text-sm"
          role="status"
        >
          Akun berhasil dibuat. Silakan masuk dengan email & password kamu.
        </div>
      )}

      <LoginForm callbackUrl={sp.callbackUrl ?? "/dashboard"} />
    </div>
  );
}
