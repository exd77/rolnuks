import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Info,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatIDR } from "@/lib/utils";
import {
  getProductBySlug,
  type ProductDetail,
} from "@/server/services/catalog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produk tidak ditemukan" };
  return {
    title: product.metaTitle ?? product.title,
    description:
      product.metaDescription ??
      product.description ??
      `Beli ${product.title} dengan harga ${formatIDR(product.basePrice.toString())} di ORBLOX.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  const session = await auth();
  const price = formatIDR(product.basePrice.toString());

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="text-muted-foreground mb-4 -ml-2"
      >
        <Link href={`/katalog/${product.category.slug}`}>
          <ArrowLeft className="size-4" />
          Kembali ke {product.category.name}
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Visual */}
        <div className="border-border from-primary/10 via-secondary/40 to-primary/5 relative aspect-square w-full overflow-hidden rounded-2xl border bg-gradient-to-br">
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              {product.robuxAmount && (
                <div className="text-primary text-5xl font-extrabold tracking-tight md:text-6xl">
                  {product.robuxAmount.toLocaleString("id-ID")}
                </div>
              )}
              {product.robuxAmount && (
                <div className="text-muted-foreground mt-1 text-sm font-semibold tracking-wider uppercase">
                  Robux
                </div>
              )}
              {product.includesPremium && (
                <div className="bg-warning/15 text-warning-foreground mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                  <Crown className="text-warning size-3.5" />+ Roblox Premium
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-3 left-3 flex gap-1">
            {product.featured && <Badge>Pilihan</Badge>}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <Badge variant="muted">{product.category.name}</Badge>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {product.title}
            </h1>
            {product.seller?.storeName && (
              <p className="text-muted-foreground mt-2 text-sm">
                Dijual oleh{" "}
                <span className="font-medium">{product.seller.storeName}</span>
              </p>
            )}
          </div>

          <div className="border-border bg-card rounded-xl border p-5">
            <div className="text-primary text-3xl font-extrabold">{price}</div>
            <div className="text-muted-foreground mt-1 text-xs">
              Harga sudah final, tidak ada biaya tambahan.
            </div>
          </div>

          <DeliveryHighlights product={product} />

          {/* CTA */}
          {session?.user ? (
            <Button asChild size="lg" className="w-full">
              <Link href={`/checkout/${product.slug}`}>
                Beli sekarang
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild size="lg" className="w-full">
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(
                    `/produk/${product.slug}`,
                  )}`}
                >
                  Masuk untuk membeli
                </Link>
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  Daftar gratis
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description + Instructions */}
      <Separator className="my-10" />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold">Deskripsi</h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-line">
            {product.description ?? "Belum ada deskripsi."}
          </p>
        </div>

        <div className="space-y-4">
          <DeliveryInstructionsCard product={product} />
        </div>
      </div>
    </div>
  );
}

function DeliveryHighlights({ product }: { product: ProductDetail }) {
  const items: Array<{ icon: React.ReactNode; label: string }> = [];
  if (product.deliveryMethod === "GAMEPASS") {
    items.push({
      icon: <Info className="text-info size-4" />,
      label: "Buyer membuat gamepass, admin yang membeli",
    });
  } else if (product.deliveryMethod === "GROUP_PAYOUT") {
    items.push({
      icon: <Zap className="text-warning size-4" />,
      label: "Robux dikirim instan via group payout",
    });
  } else if (product.deliveryMethod === "MANUAL_ITEM") {
    items.push({
      icon: <Crown className="text-warning size-4" />,
      label: "Bundle Robux + Roblox Premium (manual)",
    });
  } else if (product.deliveryMethod === "TRADE") {
    items.push({
      icon: <Zap className="text-warning size-4" />,
      label: "Pengiriman via trade Roblox",
    });
  }
  items.push({
    icon: <ShieldCheck className="text-success size-4" />,
    label: "Pembayaran aman via Midtrans",
  });

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-center gap-2">
          {item.icon}
          <span className="text-muted-foreground">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function DeliveryInstructionsCard({ product }: { product: ProductDetail }) {
  if (product.deliveryMethod === "GAMEPASS" && product.gamepassRequiredAmount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cara order Gamepass</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="text-muted-foreground ml-4 list-decimal space-y-2">
            <li>
              Buat <strong>gamepass</strong> di akun Roblox kamu dengan harga{" "}
              <strong className="text-foreground">
                {product.gamepassRequiredAmount.toLocaleString("id-ID")} R$
              </strong>{" "}
              (sudah memperhitungkan tax 30% Roblox).
            </li>
            <li>Pastikan gamepass terlihat publik (tidak private).</li>
            <li>
              Lanjutkan checkout, masukkan <strong>username Roblox</strong> dan{" "}
              <strong>link gamepass</strong> kamu.
            </li>
            <li>Setelah pembayaran sukses, admin akan beli gamepass kamu.</li>
            <li>
              Kamu akan menerima{" "}
              <strong>
                {product.robuxAmount?.toLocaleString("id-ID")} Robux
              </strong>{" "}
              setelah dipotong tax 30%.
            </li>
          </ol>
        </CardContent>
      </Card>
    );
  }

  if (product.deliveryMethod === "GROUP_PAYOUT") {
    return (
      <Alert variant="info">
        <Info className="size-4" />
        <AlertTitle>Wajib join group toko</AlertTitle>
        <AlertDescription>
          Pastikan kamu sudah join group ORBLOX di Roblox. Robux baru bisa
          dikirim setelah 14 hari bergabung (ketentuan Roblox group payout).
        </AlertDescription>
      </Alert>
    );
  }

  if (product.deliveryMethod === "MANUAL_ITEM" && product.includesPremium) {
    return (
      <Alert>
        <Crown className="size-4" />
        <AlertTitle>Bundle + Premium</AlertTitle>
        <AlertDescription>
          Pesanan ini termasuk Robux dan Roblox Premium. Admin akan menghubungi
          kamu via dashboard untuk konfirmasi proses.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
