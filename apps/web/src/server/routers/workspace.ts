import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { workspace, member, subscription, session, account } from "@shipflow/db";
import { protectedProcedure, workspaceProcedure, router, requireRole } from "../trpc/trpc";
import { encryptSecret, maskApiKey } from "@/lib/crypto/workspace-secrets";

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

  /** BYOK — whether this workspace has its own OpenRouter key. */
  apiKeyStatus: workspaceProcedure.query(async ({ ctx }) => {
    const ws = await ctx.db.query.workspace.findFirst({
      where: eq(workspace.id, ctx.workspaceId),
      columns: { openrouterApiKeyEnc: true, openrouterApiKeyHint: true },
    });
    const hasWorkspaceKey = !!ws?.openrouterApiKeyEnc;
    const hasPlatformKey = !!process.env.OPENROUTER_API_KEY;
    return {
      configured: hasWorkspaceKey || hasPlatformKey,
      workspaceKeySet: hasWorkspaceKey,
      hint: ws?.openrouterApiKeyHint ?? null,
      source: hasWorkspaceKey ? ("workspace" as const) : hasPlatformKey ? ("platform" as const) : ("none" as const),
    };
  }),

  setApiKey: workspaceProcedure
    .use(requireRole("owner", "admin"))
    .input(z.object({ apiKey: z.string().min(12, "Enter a valid OpenRouter API key") }))
    .mutation(async ({ ctx, input }) => {
      const trimmed = input.apiKey.trim();
      await ctx.db
        .update(workspace)
        .set({
          openrouterApiKeyEnc: encryptSecret(trimmed),
          openrouterApiKeyHint: maskApiKey(trimmed),
        })
        .where(eq(workspace.id, ctx.workspaceId));
      return { ok: true as const, hint: maskApiKey(trimmed) };
    }),

  removeApiKey: workspaceProcedure
    .use(requireRole("owner", "admin"))
    .mutation(async ({ ctx }) => {
      await ctx.db
        .update(workspace)
        .set({ openrouterApiKeyEnc: null, openrouterApiKeyHint: null })
        .where(eq(workspace.id, ctx.workspaceId));
      return { ok: true as const };
    }),

  /** Connected OAuth providers + avatar URLs for the signed-in user. */
  connectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.db.query.account.findMany({
      where: eq(account.userId, ctx.user.id),
      columns: { providerId: true, accountId: true },
    });

    return {
      user: {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        image: ctx.user.image,
      },
      providers: accounts.map((a) => ({
        provider: a.providerId,
        accountId: a.accountId,
        avatarUrl:
          a.providerId === "github"
            ? `https://github.com/${a.accountId}.png`
            : a.providerId === "google"
              ? ctx.user.image
              : null,
      })),
    };
  }),
});
