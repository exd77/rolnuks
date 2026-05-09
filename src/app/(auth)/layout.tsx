import Link from "next/link";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SiteLogo } from "@/components/layout/site-logo";

// auth() reads cookies — skip prerender during build.
export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Already authenticated users skip the auth pages.
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      {/* Form column */}
      <div className="flex flex-col px-6 py-8 lg:px-12">
        <SiteLogo className="mb-8" />
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-muted-foreground mt-8 text-center text-xs">
          &copy; {new Date().getFullYear()} ORBLOX. Tidak berafiliasi dengan
          Roblox Corporation.{" "}
          <Link href="/" className="underline-offset-4 hover:underline">
            Kembali ke beranda
          </Link>
        </p>
      </div>

      {/* Brand column (hidden on mobile) */}
      <div className="from-primary via-primary/90 to-primary/70 relative hidden overflow-hidden bg-gradient-to-br lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_60%)]" />
        <div className="text-primary-foreground relative flex h-full flex-col justify-end p-12">
          <h2 className="max-w-md text-3xl leading-tight font-bold text-balance">
            Marketplace Roblox terpercaya di Indonesia.
          </h2>
          <p className="text-primary-foreground/80 mt-3 max-w-md text-sm">
            Robux Gamepass mulai Rp 12.000. Item game dari seller terverifikasi.
            Pembayaran lengkap via Midtrans.
          </p>
        </div>
      </div>
    </div>
  );
}
