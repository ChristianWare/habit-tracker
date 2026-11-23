import "server-only";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";

export type Result = { ok: true } | { ok: false; error: string };

/** Every action runs only for the signed-in owner. */
export async function guard() {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in.");
  return session.user;
}

/** Every page reads from the same data, so refresh them all. */
export function refresh() {
  revalidatePath("/", "layout");
}

export function fail(e: unknown): Result {
  if (e && typeof e === "object" && "issues" in e) {
    const issues = (e as { issues: { message: string }[] }).issues;
    return { ok: false, error: issues[0]?.message ?? "Check the form." };
  }
  return {
    ok: false,
    error: e instanceof Error ? e.message : "Something went wrong.",
  };
}
