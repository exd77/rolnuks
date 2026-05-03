import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Pencil, Plus } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { getSellerProfile, listSellerProducts } from "@/server/services/seller";

import { DeleteSellerProductButton } from "./delete-button";

export const metadata: Metadata = {
  title: "Produk Saya",
};

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "success" | "warning" | "muted" | "destructive" }
> = {
  ACTIVE: { label: "Aktif", variant: "success" },
  DRAFT: { label: "Draft", variant: "muted" },
  PAUSED: { label: "Dijeda", variant: "warning" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
};

export default async function SellerProductsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getSellerProfile(session.user.id);
  if (!profile) redirect("/dashboard/seller-apply");

  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page ?? "1", 10);
  const { items, total, totalPages } = await listSellerProducts(profile.id, {
    page,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produk Saya</h1>
          <p className="text-muted-foreground text-sm">
            Kelola listing item game di toko kamu ({total} produk).
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/seller/products/baru">
            <Plus className="size-4" />
            Tambah Produk
          </Link>
        </Button>
      </header>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="bg-muted text-muted-foreground mx-auto grid size-12 place-items-center rounded-full">
              <Package className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Belum ada produk</h2>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              Tambahkan item game pertama kamu untuk mulai berjualan.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/seller/products/baru">Tambah Produk</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((product) => {
            const status = STATUS_BADGE[product.status] ?? {
              label: product.status,
              variant: "muted" as const,
            };
            return (
              <Card key={product.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg text-xs font-bold">
                    {product.game?.name?.slice(0, 2).toUpperCase() ?? "IT"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {product.title}
                      </span>
                      <Badge variant={status.variant} className="shrink-0">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {product.game?.name && <span>{product.game.name}</span>}
                      <span>{product.category.name}</span>
                      <span>Stok: {product.stock}</span>
                      <span>{product.deliveryMethod}</span>
                    </div>
                  </div>
                  <div className="hidden text-right font-mono text-sm font-semibold sm:block">
                    {formatIDR(product.basePrice.toString())}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={`/dashboard/seller/products/${product.id}/edit`}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                    <DeleteSellerProductButton id={product.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {page > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/seller/products?page=${page - 1}`}>
                    Sebelumnya
                  </Link>
                </Button>
              )}
              <span className="text-muted-foreground text-sm">
                Halaman {page} dari {totalPages}
              </span>
              {page < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/seller/products?page=${page + 1}`}>
                    Selanjutnya
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
