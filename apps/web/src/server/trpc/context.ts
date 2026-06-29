import "server-only";
import { db } from "@shipflow/db";
import { getServerSession } from "@/server/auth/session";

/**
 * Built once per request. Kept deliberately thin — auth-aware procedures
 * derive workspace membership themselves (see trpc.ts `workspaceProcedure`)
 * rather than this function doing DB lookups that some procedures won't need.
 */
export async function createTRPCContext() {
  const authSession = await getServerSession();

  return {
    db,
    user: authSession?.user ?? null,
    session: authSession?.session ?? null,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
