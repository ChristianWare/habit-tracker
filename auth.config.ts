// auth.config.ts — the part of the login setup that middleware can run
// (no database). auth.ts adds the password check.
import type { NextAuthConfig } from "next-auth";

const authConfig = {
  providers: [],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
