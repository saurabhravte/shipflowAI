import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { eq, and } from "drizzle-orm";
import { member, workspace } from "@shipflow/db";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;

/** No auth required. Use sparingly — most of the app is workspace-scoped. */
export const publicProcedure = t.procedure;

/** Requires a signed-in user, but no workspace context yet (e.g. workspace.create, workspace.list). */
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // narrows ctx.user from `User | null` to `User` for downstream procedures
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * THE tenancy enforcement point referenced throughout ARCHITECTURE.md
 * Section 2. Every domain router (project, featureRequest, prd, task,
 * pullRequest, review, approval, github, billing) builds its procedures
 * from this, never from `protectedProcedure` directly, so workspace
 * membership is checked exactly once, in exactly one place.
 *
 * Resolution order for "which workspace":
 *   1. explicit `workspaceId` in the procedure input (if the router's input
 *      schema includes it) — set by the `.workspace(id)` helper below
 *   2. the user's `session.activeWorkspaceId` (set when they switch workspace
 *      in the UI)
 * If neither resolves to a workspace the caller is actually a member of,
 * this throws FORBIDDEN — it never silently falls back to "first workspace
 * found," since that would leak cross-tenant data on a buggy client.
 */
const isWorkspaceMember = middleware(async ({ ctx, next, getRawInput }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." });
  }

  const rawInput = (await getRawInput().catch(() => undefined)) as
    | { workspaceId?: unknown }
    | undefined;

  const requestedWorkspaceId =
    typeof rawInput?.workspaceId === "string" ? rawInput.workspaceId : undefined;

  const workspaceId = requestedWorkspaceId ?? ctx.session?.activeWorkspaceId ?? undefined;

  if (!workspaceId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active workspace. Select a workspace first.",
    });
  }

  const membership = await ctx.db.query.member.findFirst({
    where: and(eq(member.workspaceId, workspaceId), eq(member.userId, ctx.user.id)),
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this workspace.",
    });
  }

  const ws = await ctx.db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
  });

  if (!ws) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      workspaceId: ws.id,
      workspace: ws,
      membership,
    },
  });
});

export const workspaceProcedure = t.procedure.use(isWorkspaceMember);

/** The context shape after `isWorkspaceMember` has run. */
export type WorkspaceContext = TRPCContext & {
  user: NonNullable<TRPCContext["user"]>;
  workspaceId: string;
  workspace: typeof workspace.$inferSelect;
  membership: typeof member.$inferSelect;
};

function isWorkspaceContext(ctx: object): ctx is WorkspaceContext {
  return "membership" in ctx && "workspaceId" in ctx;
}

/**
 * Narrows the role required on top of workspaceProcedure (e.g. only
 * owner/admin can invite members).
 * Usage: `workspaceProcedure.use(requireRole("owner", "admin"))` — only
 * meaningful chained after workspaceProcedure; throws INTERNAL_SERVER_ERROR
 * (a developer error, not a user-facing one) if used standalone, since that
 * means the procedure chain itself is wired wrong.
 */
export function requireRole(...roles: Array<"owner" | "admin" | "member">) {
  return t.middleware(async ({ ctx, next }) => {
    if (!isWorkspaceContext(ctx)) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "requireRole() must be chained after workspaceProcedure.",
      });
    }
    if (!roles.includes(ctx.membership.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient role for this action." });
    }
    return next({ ctx });
  });
}
