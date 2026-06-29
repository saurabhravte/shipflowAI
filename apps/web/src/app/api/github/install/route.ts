import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { getInstallationUrl } from "@/lib/github/app";

export async function GET(req: Request) {
  const authSession = await getServerSession();
  if (!authSession) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const workspaceId = authSession.session.activeWorkspaceId;
  if (!workspaceId) {
    return NextResponse.redirect(
      new URL("/dashboard?error=no-active-workspace", req.url),
    );
  }

  const url = await getInstallationUrl(workspaceId);
  return NextResponse.redirect(url);
}
