import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

export const ADMIN_ROLES: readonly Role[] = ["ADMIN", "STAFF"];

/**
 * Edge-safe Auth.js config (no database imports). Used by middleware.
 * The full config with the Credentials provider lives in `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/admin/login" },
  // Vercel and our local `next start` both set the Host header correctly.
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        const role = auth?.user?.role;
        return !!role && ADMIN_ROLES.includes(role);
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
