import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { githubInstallation, repository, project } from "@shipflow/db";
import { workspaceProcedure, router } from "../trpc/trpc";
import { listInstallationRepositories } from "@/lib/github/tools";

export const githubRouter = router({
  installation: workspaceProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.query.githubInstallation.findFirst({
      where: eq(githubInstallation.workspaceId, ctx.workspaceId),
    });
    if (!row) return null;
    return {
      ...row,
      avatarUrl: `https://github.com/${row.accountLogin}.png`,
    };
  }),

  /** Repos visible to the workspace's installation that aren't linked to a project yet, plus already-linked ones. */
  listInstallableRepos: workspaceProcedure.query(async ({ ctx }) => {
    const installation = await ctx.db.query.githubInstallation.findFirst({
      where: eq(githubInstallation.workspaceId, ctx.workspaceId),
    });
    if (!installation) {
      return { connected: false as const, repos: [] };
    }

    const ghRepos = await listInstallationRepositories(installation.installationId);
    const linked = await ctx.db.query.repository.findMany({
      where: eq(repository.workspaceId, ctx.workspaceId),
    });
    const linkedByGithubId = new Map(linked.map((r) => [r.githubRepoId, r]));

    return {
      connected: true as const,
      installation: {
        ...installation,
        avatarUrl: `https://github.com/${installation.accountLogin}.png`,
      },
      repos: ghRepos.map((r) => ({
        ...r,
        linkedRepositoryId: linkedByGithubId.get(r.githubRepoId)?.id ?? null,
        projectId: linkedByGithubId.get(r.githubRepoId)?.projectId ?? null,
      })),
    };
  }),

  /** All repositories linked to projects in this workspace. */
  listLinkedRepos: workspaceProcedure.query(async ({ ctx }) => {
    const repos = await ctx.db.query.repository.findMany({
      where: eq(repository.workspaceId, ctx.workspaceId),
      with: { project: true },
      orderBy: (t, { desc }) => desc(t.updatedAt),
    });
    return repos.map((r) => ({
      ...r,
      avatarUrl: `https://github.com/${r.owner}.png`,
    }));
  }),

  /** Creates (or re-links) a `repository` row for a GitHub repo and attaches it to a project. */
  linkRepository: workspaceProcedure
    .input(
      z.object({
        githubRepoId: z.number(),
        owner: z.string(),
        name: z.string(),
        fullName: z.string(),
        defaultBranch: z.string(),
        isPrivate: z.boolean(),
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const installation = await ctx.db.query.githubInstallation.findFirst({
        where: eq(githubInstallation.workspaceId, ctx.workspaceId),
      });
      if (!installation) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No GitHub installation connected." });
      }

      const proj = await ctx.db.query.project.findFirst({
        where: and(eq(project.id, input.projectId), eq(project.workspaceId, ctx.workspaceId)),
      });
      if (!proj) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace." });
      }

      const [repo] = await ctx.db
        .insert(repository)
        .values({
          workspaceId: ctx.workspaceId,
          installationId: installation.id,
          githubRepoId: input.githubRepoId,
          owner: input.owner,
          name: input.name,
          fullName: input.fullName,
          defaultBranch: input.defaultBranch,
          isPrivate: input.isPrivate,
          projectId: input.projectId,
        })
        .onConflictDoUpdate({
          target: [repository.workspaceId, repository.githubRepoId],
          set: { projectId: input.projectId, fullName: input.fullName },
        })
        .returning();

      return repo;
    }),
});
