import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listAdminNotifications } from "@/server/services/admin-order";
import { MarkReadButton } from "./mark-read-button";

export const metadata: Metadata = {
  title: "Notifikasi — Admin",
};

export default async function AdminNotificationsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page ?? "1", 10);
  const { items, total, totalPages } = await listAdminNotifications(
    session.user.id,
    { page },
  );

  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          <p className="text-muted-foreground text-sm">{total} notifikasi</p>
        </div>
        {hasUnread && <MarkReadButton />}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="bg-muted text-muted-foreground mx-auto grid size-12 place-items-center rounded-full">
              <Bell className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Belum ada notifikasi</h2>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((notif) => (
            <Link
              key={notif.id}
              href={notif.link ?? "/admin"}
              className="block"
            >
              <Card
                className={`transition-shadow hover:shadow-md ${!notif.readAt ? "border-primary/30 bg-primary/5" : ""}`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full">
                    <Bell className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{notif.title}</span>
                      {!notif.readAt && (
                        <Badge variant="default" className="text-[10px]">
                          Baru
                        </Badge>
                      )}
                    </div>
                    {notif.body && (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {notif.body}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      {new Date(notif.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/notifications?page=${page - 1}`}>
                Sebelumnya
              </Link>
            </Button>
          )}
          <span className="text-muted-foreground text-sm">
            Halaman {page}/{totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/notifications?page=${page + 1}`}>
                Selanjutnya
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
