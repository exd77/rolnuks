import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-muted/30 flex-1">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
          <aside className="md:sticky md:top-20 md:self-start">
            <div className="border-border bg-card rounded-xl border p-3">
              <p className="text-muted-foreground px-3 pt-1 pb-2 text-xs font-semibold tracking-wide uppercase">
                Akun saya
              </p>
              <DashboardNav />
            </div>
          </aside>
          <section>{children}</section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
