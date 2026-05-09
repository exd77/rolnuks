import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";

import { auth } from "@/auth";
import { AdminNav } from "@/components/layout/admin-nav";
import { getAdminUnreadNotifications } from "@/server/services/admin-order";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

// Auth + DB queries in every child page — force dynamic to skip prerender.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    redirect("/login?callbackUrl=/admin");
  }

  const unreadCount = await getAdminUnreadNotifications(session.user.id);

  return (
    <div className="flex min-h-screen">
      <aside className="border-border bg-card sticky top-0 hidden h-screen w-64 shrink-0 border-r lg:block">
        <div className="border-border flex h-14 items-center border-b px-4">
          <span className="text-primary text-lg font-bold">ORBLOX</span>
          <span className="text-muted-foreground ml-2 text-xs">Admin</span>
        </div>
        <div className="p-4">
          <AdminNav />
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top bar */}
        <header className="border-border bg-card sticky top-0 z-30 flex h-14 items-center justify-between border-b px-6">
          <div className="text-muted-foreground text-sm font-medium">
            {session.user.name ?? session.user.email}
          </div>
          <Link
            href="/admin/notifications"
            className="text-muted-foreground hover:bg-muted hover:text-foreground relative rounded-md p-2 transition-colors"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full text-[10px] font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </header>
        <main className="flex-1">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
