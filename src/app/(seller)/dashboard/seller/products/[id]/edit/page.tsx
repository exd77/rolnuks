import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { SellerProductForm } from "@/components/forms/seller-product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getGames,
  getItemGameCategories,
  getSellerProductById,
  getSellerProfile,
} from "@/server/services/seller";

export const metadata: Metadata = { title: "Edit Produk Seller" };

export default async function SellerProductEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await getSellerProfile(session.user.id);
  if (!profile || profile.status !== "APPROVED")
    redirect("/dashboard/seller-apply");
  const { id } = await props.params;
  const product = await getSellerProductById(id, profile.id);
  if (!product) notFound();
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
        <h1 className="text-2xl font-bold tracking-tight">Edit Produk</h1>
        <p className="text-muted-foreground text-sm">
          Perbarui listing item game seller.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <SellerProductForm
            mode="edit"
            categories={categories}
            games={games}
            defaults={{
              ...product,
              basePrice: product.basePrice.toString(),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
