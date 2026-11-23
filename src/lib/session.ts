import "server-only";
import { redirect } from "next/navigation";
import { auth } from "../../auth";

/** Every page and action checks this as well as the middleware. */
export async function requireOwner() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}
