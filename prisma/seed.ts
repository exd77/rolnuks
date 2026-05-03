/**
 * ORBLOX seed script.
 * Populates:
 *  - Categories (Robux Gamepass, Robux Instan, Item Game)
 *  - Robux Gamepass products (5 tiers, Rp 120/Robux)
 *  - Robux Instan products (10 paket, includes "+ Premium" bundles)
 *  - 1 admin user (email: admin@orblox.local)
 *
 * Run: `npm run prisma:seed`
 *
 * Source of truth for prices: PLAN.md §5.1 and §5.2.
 */
import { PrismaClient, Prisma, CategoryType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function calcGamepassRequiredAmount(robuxAmount: number): number {
  return Math.ceil(robuxAmount / 0.7);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =====================================================
// Catalog data
// =====================================================

const CATEGORIES: Array<{
  name: string;
  slug: string;
  type: CategoryType;
  description: string;
  sortOrder: number;
}> = [
  {
    name: "Robux Gamepass",
    slug: "robux-gamepass",
    type: "ROBUX_GAMEPASS",
    description:
      "Beli Robux melalui sistem Gamepass — buat gamepass sesuai instruksi, kami beli dan transfer.",
    sortOrder: 1,
  },
  {
    name: "Robux Instan",
    slug: "robux-instan",
    type: "ROBUX_INSTANT",
    description:
      "Robux dikirim lebih cepat via group payout / trade. Tersedia paket reguler dan paket + Premium.",
    sortOrder: 2,
  },
  {
    name: "Item Game",
    slug: "item-game",
    type: "ITEM_GAME",
    description:
      "Item game dari berbagai judul Roblox populer. Dijual oleh seller terverifikasi.",
    sortOrder: 3,
  },
];

const GAMEPASS_TIERS: Array<{ robux: number; price: number }> = [
  { robux: 100, price: 12_000 },
  { robux: 500, price: 60_000 },
  { robux: 1_000, price: 120_000 },
  { robux: 5_000, price: 600_000 },
  { robux: 10_000, price: 1_200_000 },
];

const INSTANT_PACKAGES: Array<{
  robux: number;
  price: number;
  includesPremium: boolean;
}> = [
  { robux: 450, price: 75_000, includesPremium: true },
  { robux: 1_000, price: 145_000, includesPremium: true },
  { robux: 2_200, price: 290_000, includesPremium: true },
  { robux: 500, price: 71_000, includesPremium: false },
  { robux: 820, price: 130_000, includesPremium: false },
  { robux: 1_000, price: 142_000, includesPremium: false },
  { robux: 2_000, price: 285_000, includesPremium: false },
  { robux: 4_400, price: 570_000, includesPremium: false },
  { robux: 5_500, price: 710_000, includesPremium: false },
  { robux: 11_000, price: 1_420_000, includesPremium: false },
];

// =====================================================
// Seed
// =====================================================

async function main() {
  console.log("🌱 Seeding ORBLOX database...");

  // ---- Categories
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        type: c.type,
        description: c.description,
        sortOrder: c.sortOrder,
        isActive: true,
      },
      create: c,
    });
  }
  console.log(`  ✓ Categories: ${CATEGORIES.length}`);

  const gamepassCat = await prisma.category.findUniqueOrThrow({
    where: { slug: "robux-gamepass" },
  });
  const instantCat = await prisma.category.findUniqueOrThrow({
    where: { slug: "robux-instan" },
  });

  // ---- Gamepass products
  for (const tier of GAMEPASS_TIERS) {
    const slug = slugify(`gamepass-${tier.robux}-robux`);
    const sku = `GP-${tier.robux}`;
    const required = calcGamepassRequiredAmount(tier.robux);
    await prisma.product.upsert({
      where: { slug },
      update: {
        title: `${tier.robux.toLocaleString("id-ID")} Robux (Gamepass)`,
        basePrice: new Prisma.Decimal(tier.price),
        robuxAmount: tier.robux,
        gamepassRequiredAmount: required,
        deliveryMethod: "GAMEPASS",
        status: "ACTIVE",
        categoryId: gamepassCat.id,
        sortOrder: tier.robux,
      },
      create: {
        title: `${tier.robux.toLocaleString("id-ID")} Robux (Gamepass)`,
        slug,
        sku,
        description: `Dapatkan ${tier.robux.toLocaleString(
          "id-ID",
        )} Robux dengan metode Gamepass. Kamu akan diminta membuat gamepass dengan nominal ${required.toLocaleString(
          "id-ID",
        )} R$ (sudah memperhitungkan tax 30% Roblox).`,
        images: [],
        basePrice: new Prisma.Decimal(tier.price),
        stock: -1,
        robuxAmount: tier.robux,
        gamepassRequiredAmount: required,
        includesPremium: false,
        deliveryMethod: "GAMEPASS",
        status: "ACTIVE",
        featured: tier.robux >= 1_000,
        sortOrder: tier.robux,
        categoryId: gamepassCat.id,
      },
    });
  }
  console.log(`  ✓ Robux Gamepass products: ${GAMEPASS_TIERS.length}`);

  // ---- Instan products
  for (const pkg of INSTANT_PACKAGES) {
    const suffix = pkg.includesPremium ? "premium" : "robux";
    const slug = slugify(
      `instan-${pkg.robux}${pkg.includesPremium ? "-premium" : ""}-${suffix}`,
    );
    const sku = `IN-${pkg.robux}${pkg.includesPremium ? "P" : ""}`;
    const title = pkg.includesPremium
      ? `${pkg.robux.toLocaleString("id-ID")} Robux + Premium (Instan)`
      : `${pkg.robux.toLocaleString("id-ID")} Robux (Instan)`;
    await prisma.product.upsert({
      where: { slug },
      update: {
        title,
        basePrice: new Prisma.Decimal(pkg.price),
        robuxAmount: pkg.robux,
        includesPremium: pkg.includesPremium,
        deliveryMethod: pkg.includesPremium ? "MANUAL_ITEM" : "GROUP_PAYOUT",
        status: "ACTIVE",
        categoryId: instantCat.id,
        sortOrder: pkg.robux,
      },
      create: {
        title,
        slug,
        sku,
        description: pkg.includesPremium
          ? `Bundle ${pkg.robux.toLocaleString("id-ID")} Robux + Roblox Premium. Diproses manual oleh admin setelah pembayaran berhasil.`
          : `Robux ${pkg.robux.toLocaleString("id-ID")} dikirim instan via group payout / trade. Pastikan sudah join group toko.`,
        images: [],
        basePrice: new Prisma.Decimal(pkg.price),
        stock: -1,
        robuxAmount: pkg.robux,
        includesPremium: pkg.includesPremium,
        gamepassRequiredAmount: null,
        deliveryMethod: pkg.includesPremium ? "MANUAL_ITEM" : "GROUP_PAYOUT",
        status: "ACTIVE",
        featured: pkg.robux >= 1_000,
        sortOrder: pkg.robux,
        categoryId: instantCat.id,
      },
    });
  }
  console.log(`  ✓ Robux Instan products: ${INSTANT_PACKAGES.length}`);

  // ---- Admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@orblox.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      name: "ORBLOX Admin",
    },
    create: {
      email: adminEmail,
      password: adminPasswordHash,
      name: "ORBLOX Admin",
      role: "ADMIN",
    },
  });
  console.log(
    `  ✓ Admin user: ${adminEmail} (default password: ${adminPassword} — CHANGE in production!)`,
  );

  // ---- Site settings (basic defaults)
  const defaults: Array<{ key: string; value: Prisma.InputJsonValue }> = [
    { key: "site.name", value: "ORBLOX" },
    {
      key: "site.tagline",
      value: "Marketplace Roblox terpercaya untuk Robux & Item Game",
    },
    { key: "site.contact.email", value: "support@orblox.local" },
    { key: "platform.commissionRate", value: 0.03 },
    { key: "robux.gamepass.taxRate", value: 0.3 },
    { key: "order.autoReleaseHours", value: 48 },
  ];
  for (const s of defaults) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`  ✓ Site settings: ${defaults.length}`);

  console.log("✅ Seed complete.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
