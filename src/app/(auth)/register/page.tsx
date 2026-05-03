import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun ORBLOX untuk mulai belanja Robux & item game.",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Buat akun ORBLOX</h1>
        <p className="text-muted-foreground text-sm">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>

      <RegisterForm />

      <p className="text-muted-foreground text-center text-xs">
        Dengan mendaftar, kamu menyetujui{" "}
        <Link href="/terms" className="underline-offset-4 hover:underline">
          Syarat &amp; Ketentuan
        </Link>{" "}
        dan{" "}
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          Kebijakan Privasi
        </Link>{" "}
        ORBLOX.
      </p>
    </div>
  );
}
