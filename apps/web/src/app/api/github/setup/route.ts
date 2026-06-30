import { NextResponse } from "next/server";

import { db, githubInstallation } from "@shipflow/db";
import { getServerSession } from "@/server/auth/session";
import { getInstallationOctokit } from "@/lib/github/app";

/**
 * Configured as the GitHub App's "Setup URL" in App settings.
 * GitHub appends ?installation_id=<id>&setup_action=install&state=<state>.
 * `state` is the workspaceId we encoded in /api/github/install.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const installationId = url.searchParams.get("installation_id");
  const workspaceId = url.searchParams.get("state");

  if (!installationId || !workspaceId) {
    return NextResponse.redirect(
      new URL("/dashboard?error=missing-installation-params", req.url),
    );
  }

  const authSession = await getServerSession();
  if (!authSession) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Re-verify the signed-in user is actually a member of the workspace
  // encoded in `state` — `state` is round-tripped through GitHub unsigned,
  // so we don't trust it for authorization, only as a hint of intent.
  const membership = await db.query.member.findFirst({
    where: (m, { eq: e, and: a }) =>
      a(e(m.workspaceId, workspaceId), e(m.userId, authSession.user.id)),
  });
  if (!membership) {
    return NextResponse.redirect(
      new URL("/dashboard?error=forbidden", req.url),
    );
  }

  const installationIdNum = Number(installationId);
  const octokit = await getInstallationOctokit(installationIdNum);
  const { data: installation } = await octokit.request(
    "GET /app/installations/{installation_id}",
    {
      installation_id: installationIdNum,
    },
  );

  await db
    .insert(githubInstallation)
    .values({
      workspaceId,
      installationId: installationIdNum,
      accountLogin:
        installation.account && "login" in installation.account
          ? installation.account.login
          : "unknown",
      accountType: installation.target_type,
    })
    .onConflictDoUpdate({
      target: [githubInstallation.workspaceId],
      set: {
        installationId: installationIdNum,
        accountLogin:
          installation.account && "login" in installation.account
            ? installation.account.login
            : "unknown",
        accountType: installation.target_type,
      },
    });

  return NextResponse.redirect(
    new URL("/dashboard/repositories?connected=true", req.url),
  );
}
