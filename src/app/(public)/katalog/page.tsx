import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listActiveCategories } from "@/server/services/catalog";

export const metadata: Metadata = {
  title: "Katalog",
  description:
    "Jelajahi semua kategori produk ORBLOX: Robux Gamepass, Robux Instan, dan Item Game.",
};

export default async function KatalogIndexPage() {
  const categories = await listActiveCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8 max-w-2xl">
        <Badge variant="muted">Katalog</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Pilih kategori produk
        </h1>
        <p className="text-muted-foreground mt-2">
          Kami menyediakan Robux dengan dua metode pengiriman dan ribuan item
          dari game Roblox populer.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/katalog/${cat.slug}`}
            className="group focus-visible:ring-ring rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <Card className="group-hover:border-primary/40 h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{cat.name}</CardTitle>
                  <Badge variant="muted">{cat.productCount} produk</Badge>
                </div>
                <CardDescription>{cat.description}</CardDescription>
                <div className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium">
                  Lihat produk
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
