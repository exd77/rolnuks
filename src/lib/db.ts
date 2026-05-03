import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires a driver adapter. For PostgreSQL we use @prisma/adapter-pg.
// Singleton pattern to avoid creating multiple connection pools in dev (HMR).
declare global {
  var __prismaClient__: PrismaClient | undefined;
}

function makePrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Define it in .env or your runtime environment.",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });
}

export const prisma: PrismaClient = globalThis.__prismaClient__ ?? makePrisma();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient__ = prisma;
}
