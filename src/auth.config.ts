import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible Auth.js config.
 *
 * This file is imported by `middleware.ts` (which runs on the Edge runtime),
 * so it MUST NOT import any code that uses Node-only APIs (e.g. Prisma,
 * `bcryptjs` runtime, `pg`, etc.).
 *
 * The full config (with Credentials provider + database access) lives in
 * `src/auth.ts` and extends this base by spreading `authConfig`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  callbacks: {
    /**
     * Token enrichment. Runs on every JWT generation/refresh.
     * The `user` object is only present at sign-in.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "BUYER";
      }
      return token;
    },
    /**
     * Expose enriched fields on the session.user object.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as
          | "BUYER"
          | "SELLER"
          | "ADMIN"
          | "STAFF";
      }
      return session;
    },
  },
  providers: [], // Real providers (Credentials) registered in src/auth.ts
} satisfies NextAuthConfig;
