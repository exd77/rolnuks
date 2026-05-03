"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard/seller", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/dashboard/seller/products", label: "Produk Saya", icon: Package },
  {
    href: "/dashboard/seller/orders",
    label: "Pesanan Masuk",
    icon: ShoppingBag,
  },
  { href: "/dashboard/seller/earnings", label: "Saldo & Payout", icon: Wallet },
];

export function SellerNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Seller dashboard" className="space-y-1">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard/seller" &&
            pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
