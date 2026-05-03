import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getProductBySlug } from "@/server/services/catalog";
import {
  createOrderAndSnap,
  getSellerCommissionRate,
} from "@/server/services/order";
import {
  CheckoutGamepassSchema,
  CheckoutInstanSchema,
} from "@/lib/validators/order";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { captureError, toErrorMessage, toErrorStack } from "@/lib/monitoring";

export async function POST(req: NextRequest) {
  const session = await auth();
  const ip = getClientIp(req.headers);
  const limited = await rateLimit(`checkout:${session?.user?.id ?? ip}`, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { message: "Terlalu banyak percobaan checkout. Coba lagi nanti." },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  if (!session?.user) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Body request tidak valid." },
      { status: 400 },
    );
  }

  const productSlug = body.productSlug as string;
  if (!productSlug) {
    return NextResponse.json(
      { message: "Produk tidak ditemukan." },
      { status: 400 },
    );
  }

  // Fetch product
  const product = await getProductBySlug(productSlug);
  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json(
      { message: "Produk tidak tersedia." },
      { status: 404 },
    );
  }

  // Check stock
  if (product.stock !== -1 && product.stock <= 0) {
    return NextResponse.json(
      { message: "Stok produk habis." },
      { status: 400 },
    );
  }

  // Validate input based on delivery method
  const isGamepass = product.deliveryMethod === "GAMEPASS";
  const schema = isGamepass ? CheckoutGamepassSchema : CheckoutInstanSchema;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Periksa kembali data yang diisi.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // Resolve seller commissionRate snapshot (item game products are seller-owned)
  let commissionRate: number | undefined;
  if (product.seller?.id) {
    const sellerProfile = await getSellerCommissionRate(product.seller.id);
    commissionRate = sellerProfile ?? 0.03;
  }

  try {
    const result = await createOrderAndSnap({
      buyerId: session.user.id,
      buyerEmail: session.user.email!,
      buyerName: session.user.name ?? null,
      productId: product.id,
      productTitle: product.title,
      productImage: product.images[0] ?? null,
      unitPrice: Number(product.basePrice),
      sellerId: product.seller?.id ?? null,
      commissionRate,
      robloxUsername: data.robloxUsername,
      gamepassLink:
        "gamepassLink" in data
          ? (data as { gamepassLink: string }).gamepassLink
          : undefined,
      notes: data.notes,
    });

    return NextResponse.json({
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      snapToken: result.snapToken,
      snapRedirectUrl: result.snapRedirectUrl,
    });
  } catch (error) {
    await captureError({
      source: "api.checkout",
      message: toErrorMessage(error),
      stack: toErrorStack(error),
      userId: session.user.id,
      metadata: { productSlug, ip },
    });
    return NextResponse.json(
      { message: "Gagal membuat pesanan. Coba lagi nanti." },
      { status: 500 },
    );
  }
}
