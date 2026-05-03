import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Bantuan",
};

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Bantuan</h1>
        <p className="text-muted-foreground text-sm">
          Tiket support &amp; chat dengan admin.
        </p>
      </header>

      <Card>
        <CardContent className="py-16 text-center">
          <div className="bg-muted text-muted-foreground mx-auto grid size-12 place-items-center rounded-full">
            <MessageCircle className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Belum tersedia di MVP</h2>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
            Sistem tiket support akan dirilis bersama Phase 2. Sementara ini,
            silakan hubungi admin via channel resmi yang akan diumumkan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
