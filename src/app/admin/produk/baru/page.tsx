import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ProductForm } from "@/components/forms/product-form";
import { getProductCategories } from "@/server/services/admin-product";

export const metadata: Metadata = {
  title: "Tambah Produk Robux",
};

export default async function AdminCreateProductPage() {
  const categories = await getProductCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/produk"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Kembali
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Tambah Produk Robux</h1>
        <p className="text-muted-foreground text-sm">
          Buat produk Robux Gamepass atau Robux Instan baru.
        </p>
      </div>

      <div className="border-border bg-card rounded-lg border p-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
