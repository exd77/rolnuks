import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminProducts } from "@/server/services/admin-product";
import { formatIDR } from "@/lib/utils";
import { DeleteProductButton } from "./delete-button";

export const metadata: Metadata = {
  title: "Kelola Produk Robux",
};

const STATUS_BADGE = {
  ACTIVE: { label: "Aktif", variant: "success" as const },
  DRAFT: { label: "Draft", variant: "muted" as const },
  PAUSED: { label: "Dijeda", variant: "warning" as const },
  REJECTED: { label: "Ditolak", variant: "destructive" as const },
};

export default async function AdminProductsPage(props: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page ?? "1", 10);
  const search = searchParams.search;

  const { items, total, totalPages } = await getAdminProducts({ page, search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produk Robux</h1>
          <p className="text-muted-foreground text-sm">
            Kelola produk Robux Gamepass & Instan ({total} produk)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/produk/baru">
            <Plus className="size-4" />
            Tambah Produk
          </Link>
        </Button>
      </div>

      {/* Search */}
      <form method="GET" className="flex max-w-sm gap-2">
        <input
          type="text"
          name="search"
          placeholder="Cari produk..."
          defaultValue={search ?? ""}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <Button type="submit" variant="outline" size="sm">
          Cari
        </Button>
      </form>

      {/* Product table */}
      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Produk</th>
              <th className="px-4 py-3 text-left font-medium">Kategori</th>
              <th className="px-4 py-3 text-right font-medium">Harga</th>
              <th className="px-4 py-3 text-right font-medium">Robux</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  Belum ada produk.{" "}
                  <Link
                    href="/admin/produk/baru"
                    className="text-primary underline"
                  >
                    Tambah produk pertama
                  </Link>
                </td>
              </tr>
            )}
            {items.map((product) => {
              const status = STATUS_BADGE[product.status] ?? STATUS_BADGE.DRAFT;
              return (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{product.title}</div>
                    {product.includesPremium && (
                      <span className="text-info text-xs">+ Premium</span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {product.category.name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatIDR(product.basePrice.toString())}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {product.robuxAmount
                      ? `${product.robuxAmount.toLocaleString("id-ID")} R$`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/produk/${product.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                      <DeleteProductButton
                        productId={product.id}
                        productTitle={product.title}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/admin/produk?page=${page - 1}${search ? `&search=${search}` : ""}`}
              >
                Sebelumnya
              </Link>
            </Button>
          )}
          <span className="text-muted-foreground text-sm">
            Halaman {page} dari {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/admin/produk?page=${page + 1}${search ? `&search=${search}` : ""}`}
              >
                Selanjutnya
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
