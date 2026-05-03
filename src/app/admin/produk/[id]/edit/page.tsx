import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ProductForm } from "@/components/forms/product-form";
import {
  getProductById,
  getProductCategories,
} from "@/server/services/admin-product";

export const metadata: Metadata = {
  title: "Edit Produk Robux",
};

export default async function AdminEditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [product, categories] = await Promise.all([
    getProductById(id),
    getProductCategories(),
  ]);

  if (!product) {
    notFound();
  }

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
        <h1 className="text-2xl font-bold">Edit Produk</h1>
        <p className="text-muted-foreground text-sm">{product.title}</p>
      </div>

      <div className="border-border bg-card rounded-lg border p-6">
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  );
}
