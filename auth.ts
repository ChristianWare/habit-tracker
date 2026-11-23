// auth.ts — one login: the Owner row made by `npm run set-password`.
// There is no sign-up anywhere. Five wrong passwords lock the login for
// 15 minutes.
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import authConfig from "./auth.config";
import { db } from "@/lib/db";

// A real hash of a random string, for the timing-equal check below.
const DUMMY_HASH =
  "$2b$12$tkKcwrDd9c0aSmbHZG/zYOtBQaTwnV5zUt8YtVOXRL1wVrlzY.GLK";
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export class LockedError extends CredentialsSignin {
  code = "locked";
}

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Password",
      authorize: async (credentials) => {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const owner = await db.owner.findUnique({ where: { email } });
        if (!owner) {
          // Same work as a real check, so timing says nothing.
          await bcryptjs.compare(password, DUMMY_HASH);
          return null;
        }

        if (owner.lockedUntil && owner.lockedUntil > new Date()) {
          throw new LockedError();
        }

        const ok = await bcryptjs.compare(password, owner.passwordHash);
        if (!ok) {
          const attempts = owner.failedAttempts + 1;
          await db.owner.update({
            where: { id: owner.id },
            data:
              attempts >= MAX_ATTEMPTS
                ? {
                    failedAttempts: 0,
                    lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60000),
                  }
                : { failedAttempts: attempts },
          });
          return null;
        }

        if (owner.failedAttempts || owner.lockedUntil) {
          await db.owner.update({
            where: { id: owner.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
        }
        return { id: owner.id, email: owner.email, name: owner.name };
      },
    }),
  ],
});
