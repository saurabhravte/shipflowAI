import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { resolveDefaultWorkspaceId } from "@/server/auth/active-workspace";
import { getInstallationUrl } from "@/lib/github/app";

export async function GET(req: Request) {
  const authSession = await getServerSession();
  if (!authSession) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Prefer the session's active workspace, but fall back to the user's
  // default membership for sessions created before activeWorkspaceId was
  // seeded — otherwise connecting a repo right after login would fail.
  const workspaceId =
    (authSession.session as { activeWorkspaceId?: string }).activeWorkspaceId ??
    (await resolveDefaultWorkspaceId(authSession.user.id));
  if (!workspaceId) {
    return NextResponse.redirect(
      new URL("/dashboard?error=no-active-workspace", req.url),
    );
  }

  const url = await getInstallationUrl(workspaceId);
  return NextResponse.redirect(url);
}
