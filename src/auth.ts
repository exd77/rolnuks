import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "./auth.config";
import { LoginSchema } from "./lib/validators/auth";
import { prisma } from "./lib/db";

/**
 * Full Auth.js configuration including the Credentials provider that hits the
 * database. This file MUST only be imported from server-only contexts (Server
 * Components, Server Actions, Route Handlers). Middleware uses
 * `auth.config.ts` instead.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = LoginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            role: true,
            bannedAt: true,
          },
        });

        if (!user || !user.password) return null;
        if (user.bannedAt) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // Best-effort lastLoginAt update (don't block sign-in on failure)
        prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => undefined);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});
