import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/catalog/product-card";
import {
  getCategoryBySlug,
  listProductsByCategorySlug,
} from "@/server/services/catalog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori tidak ditemukan" };
  return {
    title: category.name,
    description:
      category.description ?? `Lihat semua produk ${category.name} di ORBLOX.`,
  };
}

const CATEGORY_THEMES: Record<string, { tagline: string; ribbon: string }> = {
  ROBUX_GAMEPASS: {
    tagline: "Harga termurah, mulai Rp 12.000",
    ribbon: "Rp 120 / Robux",
  },
  ROBUX_INSTANT: {
    tagline: "Pengiriman lebih cepat via group payout / trade",
    ribbon: "Cepat & Praktis",
  },
  ITEM_GAME: {
    tagline: "Item dari berbagai game Roblox populer",
    ribbon: "Multi-seller",
  },
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category || !category.isActive) {
    notFound();
  }

  const { items, total } = await listProductsByCategorySlug(slug);
  const theme = CATEGORY_THEMES[category.type];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="text-muted-foreground mb-4 -ml-2"
      >
        <Link href="/katalog">
          <ArrowLeft className="size-4" />
          Semua kategori
        </Link>
      </Button>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {theme && <Badge variant="muted">{theme.ribbon}</Badge>}
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-muted-foreground mt-2">{category.description}</p>
          )}
          {theme && (
            <p className="text-muted-foreground mt-1 text-sm">
              {theme.tagline}
            </p>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString("id-ID")} produk
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState categoryName={category.name} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ categoryName }: { categoryName: string }) {
  return (
    <div className="border-border rounded-xl border border-dashed py-16 text-center">
      <PackageX className="text-muted-foreground mx-auto size-10" />
      <h2 className="mt-4 text-lg font-semibold">
        Belum ada produk di {categoryName}
      </h2>
      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
        Stok sedang ditambahkan. Silakan cek kategori lain atau kembali nanti.
      </p>
      <div className="mt-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/katalog">Lihat kategori lain</Link>
        </Button>
      </div>
    </div>
  );
}
