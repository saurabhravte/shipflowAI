import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { workspace, member, subscription, session } from "@shipflow/db";
import { protectedProcedure, router } from "../trpc/trpc";

export const workspaceRouter = router({
  /** All workspaces the signed-in user belongs to, for the workspace switcher. */
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logoUrl: workspace.logoUrl,
        role: member.role,
      })
      .from(member)
      .innerJoin(workspace, eq(member.workspaceId, workspace.id))
      .where(eq(member.userId, ctx.user.id));

    return rows;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slugBase = input.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
      const slug = `${slugBase || "workspace"}-${crypto.randomUUID().slice(0, 6)}`;

      return ctx.db.transaction(async (tx) => {
        const [ws] = await tx
          .insert(workspace)
          .values({ name: input.name, slug })
          .returning();
        if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await tx.insert(member).values({
          workspaceId: ws.id,
          userId: ctx.user.id,
          role: "owner",
        });

        await tx.insert(subscription).values({
          workspaceId: ws.id,
          plan: "free",
          status: "active",
        });

        return ws;
      });
    }),

  /**
   * Sets the session's activeWorkspaceId so subsequent requests (which carry
   * the same session cookie) resolve to this workspace by default in
   * workspaceProcedure — without the client needing to pass workspaceId on
   * every single call.
   */
  switch: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.query.member.findFirst({
        where: and(
          eq(member.workspaceId, input.workspaceId),
          eq(member.userId, ctx.user.id),
        ),
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of that workspace." });
      }

      if (!ctx.session) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await ctx.db
        .update(session)
        .set({ activeWorkspaceId: input.workspaceId })
        .where(eq(session.id, ctx.session.id));

      return { ok: true as const };
    }),
});
