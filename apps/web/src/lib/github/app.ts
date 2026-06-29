import "server-only";
import { App } from "octokit";

/**
 * One App instance for the whole process. `app.octokit` authenticates as
 * the App itself (used for installation-management endpoints); per-repo
 * work always goes through `app.getInstallationOctokit(installationId)`
 * instead, which is scoped to exactly what that installation was granted —
 * never use the App-level client to touch repo contents.
 */
export const githubApp = new App({
  appId: process.env.GITHUB_APP_ID as string,
  privateKey: (process.env.GITHUB_APP_PRIVATE_KEY as string)?.replace(/\\n/g, "\n"),
  webhooks: {
    secret: process.env.GITHUB_APP_WEBHOOK_SECRET as string,
  },
});

/** Returns an Octokit instance authenticated as a specific installation (i.e. scoped to one connected org/account). */
export async function getInstallationOctokit(installationId: number) {
  return githubApp.getInstallationOctokit(installationId);
}

/**
 * The URL that starts the "Install GitHub App" flow. `state` round-trips
 * through GitHub and comes back on the setup callback so we know which
 * workspace initiated the install.
 */
export async function getInstallationUrl(state: string) {
  return githubApp.getInstallationUrl({ state });
}
