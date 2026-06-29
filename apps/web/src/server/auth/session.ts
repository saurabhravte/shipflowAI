import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * Wraps Better Auth's getSession with the Next.js request headers so it can
 * be called from any server component, route handler, or tRPC context
 * without each caller re-importing `headers()` themselves.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session; // { user, session } | null
}
