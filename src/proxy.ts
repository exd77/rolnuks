import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/katalog",
  "/produk",
  "/seller",
  "/about",
  "/faq",
  "/terms",
  "/privacy",
];

const ROLE_PROTECTED: Array<{
  prefix: string;
  roles: ReadonlyArray<"ADMIN" | "STAFF" | "SELLER" | "BUYER">;
}> = [
  { prefix: "/admin", roles: ["ADMIN", "STAFF"] },
  { prefix: "/dashboard/seller", roles: ["SELLER", "ADMIN"] },
  { prefix: "/dashboard", roles: ["BUYER", "SELLER", "ADMIN", "STAFF"] },
  { prefix: "/checkout", roles: ["BUYER", "SELLER", "ADMIN", "STAFF"] },
];

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/webhooks")) return true;
  if (pathname.startsWith("/api/checkout")) return true;
  if (pathname.startsWith("/api/monitoring/error")) return true;
  if (pathname.startsWith("/api/invoice")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.match(/\.(svg|png|jpe?g|gif|webp|ico|css|js|map|txt|woff2?)$/))
    return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes
  if (isPublicPath(pathname)) return NextResponse.next();

  // Require auth for everything else
  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Role-based gating
  const role = session.user.role;
  for (const rule of ROLE_PROTECTED) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      if (!rule.roles.includes(role)) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run on every route except internal Next.js assets and API auth handler.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
