import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { project } from "@shipflow/db";
import { workspaceProcedure, router } from "../trpc/trpc";

export const projectRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.db.query.project.findMany({
      where: eq(project.workspaceId, ctx.workspaceId),
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
  }),

  get: workspaceProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.project.findFirst({
        where: and(eq(project.id, input.projectId), eq(project.workspaceId, ctx.workspaceId)),
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  create: workspaceProcedure
    .input(z.object({ name: z.string().min(1).max(100), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(project)
        .values({
          workspaceId: ctx.workspaceId,
          name: input.name,
          description: input.description,
        })
        .returning();
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create project." });
      return row;
    }),
});
