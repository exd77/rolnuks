import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-border from-primary/5 via-background to-background border-b bg-gradient-to-b">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:py-28">
          <div className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium">
            <Star className="fill-primary text-primary h-3.5 w-3.5" />
            Marketplace Roblox terpercaya di Indonesia
          </div>

          <h1 className="max-w-3xl text-4xl leading-tight font-extrabold tracking-tight text-balance md:text-6xl">
            Robux & Item Game <span className="text-primary">Lebih Mudah</span>{" "}
            dengan ORBLOX
          </h1>

          <p className="text-muted-foreground max-w-2xl text-base text-balance md:text-lg">
            Beli Robux Gamepass, Robux Instan, dan Item Game pilihan dengan
            harga terbaik. Pembayaran lengkap via Midtrans — VA, GoPay, OVO,
            QRIS, kartu kredit. Aman dan otomatis.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/katalog/robux-gamepass">
                Beli Robux Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/katalog/item-game">Lihat Item Game</Link>
            </Button>
          </div>

          <ul className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs">
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="text-success h-4 w-4" />
              Pembayaran Aman (Midtrans)
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="text-warning h-4 w-4" />
              Proses Cepat & Manual Verified
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Star className="text-primary h-4 w-4" />
              Harga Termurah
            </li>
          </ul>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Kategori Produk</h2>
          <p className="text-muted-foreground mt-2">
            Pilih kategori sesuai kebutuhan kamu
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <CategoryCard
            href="/katalog/robux-gamepass"
            title="Robux Gamepass"
            description="100, 500, 1.000, 5.000, hingga 10.000 Robux. Mulai Rp 12.000."
            badge="Termurah"
          />
          <CategoryCard
            href="/katalog/robux-instan"
            title="Robux Instan"
            description="Proses lebih cepat. Tersedia paket reguler & paket + Premium."
            badge="Tercepat"
          />
          <CategoryCard
            href="/katalog/item-game"
            title="Item Game"
            description="Item Adopt Me, Blox Fruits, Grow a Garden, dan lainnya. Dari seller terverifikasi."
            badge="Multi-seller"
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-border bg-muted/30 border-y">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
          <TrustItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Aman & Terpercaya"
            description="Pembayaran terenkripsi via Midtrans. Riwayat order tersimpan di akun kamu."
          />
          <TrustItem
            icon={<Zap className="h-5 w-5" />}
            title="Proses Cepat"
            description="Order otomatis masuk ke admin. Robux dikirim dalam menit."
          />
          <TrustItem
            icon={<Star className="h-5 w-5" />}
            title="Harga Bersaing"
            description="Mulai Rp 120/Robux untuk Gamepass. Tanpa biaya tersembunyi."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h3 className="text-3xl font-bold tracking-tight">Siap mulai?</h3>
        <p className="text-muted-foreground mx-auto mt-2 max-w-xl">
          Buat akun gratis, isi profil Roblox kamu, dan checkout dalam hitungan
          menit.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Daftar Gratis</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Masuk</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function CategoryCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group focus-visible:ring-ring rounded-xl transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Card className="group-hover:border-primary/40 h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {badge && (
              <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                {badge}
              </span>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
          <div className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium">
            Lihat katalog
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="bg-primary/10 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-md">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
    </div>
  );
}
