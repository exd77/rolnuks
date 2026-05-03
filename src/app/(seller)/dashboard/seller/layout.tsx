import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SellerNav } from "@/components/layout/seller-nav";
import { getSellerProfile } from "@/server/services/seller";

export const metadata: Metadata = {
  title: "Dashboard Seller",
};

export default async function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/seller");
  }

  // Admins can also access (e.g. for support) but show a banner
  const isAdmin = ["ADMIN", "STAFF"].includes(session.user.role);

  if (!isAdmin) {
    const profile = await getSellerProfile(session.user.id);
    if (!profile || profile.status !== "APPROVED") {
      redirect("/dashboard/seller-apply");
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-muted/30 flex-1">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
          <aside className="md:sticky md:top-20 md:self-start">
            <div className="border-border bg-card rounded-xl border p-3">
              <p className="text-muted-foreground px-3 pt-1 pb-2 text-xs font-semibold tracking-wide uppercase">
                Dashboard Seller
              </p>
              <SellerNav />
            </div>
          </aside>
          <section>{children}</section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
