import "server-only";

import { prisma } from "@/lib/db";

type CaptureInput = {
  source: string;
  message: string;
  stack?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

function scrub(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(scrub);
  const redacted = new Set([
    "password",
    "token",
    "secret",
    "authorization",
    "cookie",
    "apiKey",
    "api_key",
  ]);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      redacted.has(key.toLowerCase()) ? "[REDACTED]" : scrub(val),
    ]),
  );
}

export async function captureError(input: CaptureInput) {
  const payload = scrub({
    message: input.message,
    stack: input.stack?.slice(0, 4000),
    metadata: input.metadata,
  });

  console.error(`[ORBLOX_ERROR] ${input.source}: ${input.message}`, payload);

  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.userId ?? undefined,
        action: "ERROR_CAPTURED",
        targetType: input.source,
        diff: payload as object,
      },
    });
  } catch (error) {
    console.error("[ORBLOX_ERROR_CAPTURE_FAILED]", error);
  }
}

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function toErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}
