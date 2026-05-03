import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ORBLOX — Marketplace Roblox: Robux & Item Game",
    template: "%s · ORBLOX",
  },
  description:
    "Beli Robux Gamepass, Robux Instan, dan Item Game Roblox dengan aman, cepat, dan harga terbaik. Pembayaran lengkap (VA, e-wallet, QRIS) via Midtrans.",
  applicationName: "ORBLOX",
  keywords: [
    "Robux",
    "Robux Gamepass",
    "Robux Instan",
    "Roblox",
    "Item Game Roblox",
    "Marketplace Roblox",
    "ORBLOX",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
