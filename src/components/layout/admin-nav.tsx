"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Shield,
  FileText,
  Siren,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/produk", label: "Produk Robux", icon: Package },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/payouts", label: "Payout", icon: CreditCard },
  { href: "/admin/sellers", label: "Verifikasi Seller", icon: Shield },
  { href: "/admin/disputes", label: "Disputes", icon: Siren },
  { href: "/admin/notifications", label: "Notifikasi", icon: Bell },
  { href: "/admin/audit-log", label: "Audit Log", icon: FileText },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          (item.href === "/admin" && pathname === "/admin") ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
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
