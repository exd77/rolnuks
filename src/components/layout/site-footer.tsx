import Link from "next/link";

import { SiteLogo } from "@/components/layout/site-logo";

const FOOTER_GROUPS = [
  {
    title: "Produk",
    links: [
      { href: "/katalog/robux-gamepass", label: "Robux Gamepass" },
      { href: "/katalog/robux-instan", label: "Robux Instan" },
      { href: "/katalog/item-game", label: "Item Game" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/cara-beli", label: "Cara Beli" },
      { href: "/kontak", label: "Kontak" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Syarat & Ketentuan" },
      { href: "/privacy", label: "Kebijakan Privasi" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-border bg-muted/30 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3 md:col-span-1">
            <SiteLogo />
            <p className="text-muted-foreground max-w-xs text-sm">
              Marketplace Roblox terpercaya untuk Robux dan item game. Aman,
              cepat, dan harga terbaik.
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <h4 className="text-sm font-semibold">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 md:flex-row">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} ORBLOX. Tidak berafiliasi dengan
            Roblox Corporation.
          </p>
          <p className="text-muted-foreground text-xs">
            Dibuat dengan ❤ untuk komunitas Roblox Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
