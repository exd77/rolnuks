import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// SiteHeader calls auth() (reads cookies) and child pages query the database,
// so every page under this layout is inherently dynamic. Declaring it
// explicitly prevents Next.js from attempting a static prerender during build,
// which would fail when the database is unreachable in CI.
export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
