import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SellerProductForm } from "@/components/forms/seller-product-form";
import {
  getGames,
  getItemGameCategories,
  getSellerProfile,
} from "@/server/services/seller";

export const metadata: Metadata = {
  title: "Tambah Produk",
};

export default async function SellerProductCreatePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await getSellerProfile(session.user.id);
  if (!profile || profile.status !== "APPROVED") {
    redirect("/dashboard/seller-apply");
  }

  const [categories, games] = await Promise.all([
    getItemGameCategories(),
    getGames(),
  ]);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/seller/products">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Produk</h1>
        <p className="text-muted-foreground text-sm">
          Buat listing item game baru di toko kamu.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <SellerProductForm
            mode="create"
            categories={categories}
            games={games}
          />
        </CardContent>
      </Card>
    </div>
  );
}
