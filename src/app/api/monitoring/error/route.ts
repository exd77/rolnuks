import { NextRequest, NextResponse } from "next/server";

import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { captureError } from "@/lib/monitoring";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limited = await rateLimit(`monitoring:${ip}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { message: "Terlalu banyak error report." },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  await captureError({
    source: "client",
    message: String(body.message ?? "Client error"),
    stack: typeof body.stack === "string" ? body.stack : undefined,
    metadata: {
      path: body.path,
      digest: body.digest,
      userAgent: req.headers.get("user-agent"),
      ip,
    },
  });

  return NextResponse.json(
    { ok: true },
    { headers: rateLimitHeaders(limited) },
  );
}
