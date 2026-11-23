"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "../../auth";

export async function login(
  _prev: { error?: string; email?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; email?: string }> {
  // The form clears after each try; send the email back so it stays filled in.
  const email = String(formData.get("email") ?? "");
  const next = String(formData.get("next") ?? "");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: safeNext,
    });
    return {};
  } catch (e) {
    if (e instanceof AuthError) {
      const code = (e as AuthError & { code?: string }).code;
      if (code === "locked") {
        return {
          error:
            "Too many wrong passwords. The login is locked for 15 minutes.",
          email,
        };
      }
      return { error: "That email and password don't match.", email };
    }
    throw e; // the redirect after a good login
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
