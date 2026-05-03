import Link from "next/link";
import { ArrowRight, Crown, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import type { ProductCard as ProductCardData } from "@/server/services/catalog";

interface ProductCardProps {
  product: ProductCardData;
}

export function ProductCard({ product }: ProductCardProps) {
  const price = formatIDR(product.basePrice.toString());
  const isGamepass = product.deliveryMethod === "GAMEPASS";
  const robuxLabel = product.robuxAmount
    ? `${product.robuxAmount.toLocaleString("id-ID")} Robux`
    : null;

  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group focus-visible:ring-ring rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Card className="group-hover:border-primary/40 flex h-full flex-col overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        {/* Image / Visual */}
        <div className="from-primary/10 via-secondary/40 to-primary/5 relative aspect-square w-full bg-gradient-to-br">
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              {robuxLabel && (
                <div className="text-primary text-2xl font-extrabold tracking-tight md:text-3xl">
                  {robuxLabel}
                </div>
              )}
              {product.includesPremium && (
                <div className="text-warning-foreground mt-1 inline-flex items-center gap-1 text-xs font-medium">
                  <Crown className="text-warning h-3.5 w-3.5" />+ Roblox Premium
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {product.featured && (
              <Badge variant="default" className="text-[10px]">
                Pilihan
              </Badge>
            )}
            {isGamepass && (
              <Badge variant="muted" className="text-[10px]">
                Gamepass
              </Badge>
            )}
            {product.deliveryMethod === "GROUP_PAYOUT" && (
              <Badge variant="info" className="text-[10px]">
                <Zap className="h-3 w-3" /> Instan
              </Badge>
            )}
            {product.deliveryMethod === "MANUAL_ITEM" &&
              product.includesPremium && (
                <Badge variant="warning" className="text-[10px]">
                  <Crown className="h-3 w-3" /> + Premium
                </Badge>
              )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="text-sm leading-snug font-semibold">
            {product.title}
          </h3>
          {product.seller?.storeName && (
            <p className="text-muted-foreground text-xs">
              by {product.seller.storeName}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-foreground text-base font-bold">{price}</span>
            <span className="text-primary inline-flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              Beli
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
