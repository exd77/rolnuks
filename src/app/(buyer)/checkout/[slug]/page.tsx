import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { formatIDR } from "@/lib/utils";
import { getProductBySlug } from "@/server/services/catalog";
import { CheckoutForm } from "@/components/forms/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  const price = formatIDR(product.basePrice.toString());
  const isGamepass = product.deliveryMethod === "GAMEPASS";

  return (
    <>
      <SiteHeader />
      <main className="bg-muted/30 flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground mb-4 -ml-2"
          >
            <Link href={`/produk/${product.slug}`}>
              <ArrowLeft className="size-4" />
              Kembali ke produk
            </Link>
          </Button>

          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-muted-foreground text-sm">
            Lengkapi informasi untuk memproses pesanan.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
            {/* Form Section */}
            <div>
              <CheckoutForm
                productSlug={product.slug}
                deliveryMethod={product.deliveryMethod}
                gamepassRequiredAmount={product.gamepassRequiredAmount}
                robuxAmount={product.robuxAmount}
              />
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 grid size-12 shrink-0 place-items-center rounded-lg">
                      <span className="text-primary text-sm font-bold">
                        {product.robuxAmount ? `${product.robuxAmount}` : "R$"}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{product.title}</div>
                      <Badge variant="muted" className="mt-1">
                        {product.category.name}
                      </Badge>
                    </div>
                  </div>

                  <div className="border-border border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{price}</span>
                    </div>
                    <div className="mt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{price}</span>
                    </div>
                  </div>

                  {isGamepass && product.gamepassRequiredAmount && (
                    <div className="bg-info/5 text-info rounded-md p-3 text-xs">
                      Pastikan gamepass kamu sudah diset dengan harga{" "}
                      <strong>
                        {product.gamepassRequiredAmount.toLocaleString("id-ID")}{" "}
                        R$
                      </strong>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <ShieldCheck className="text-success size-4" />
                Pembayaran diproses aman via Midtrans
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
