import "server-only";
import { getInstallationOctokit } from "./app";

/**
 * Named, single-purpose wrappers around Octokit calls — this is the
 * "GitHub tool layer" called out in the PRD (IN-2: analyzePR, searchCode,
 * getFileContent, postReviewComment, submitReview, getRepoTree, etc).
 * Pass 3 implements the repo-management subset; Pass 4 adds the
 * review-specific ones (getPRDiff, postReviewComment, submitReview).
 */

export async function listInstallationRepositories(installationId: number) {
  const octokit = await getInstallationOctokit(installationId);
  const repos = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, {
    per_page: 100,
  });
  return repos.map((r) => ({
    githubRepoId: r.id,
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    defaultBranch: r.default_branch,
    isPrivate: r.private,
  }));
}

export async function getFileContent(
  installationId: number,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path, ref });
  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`${path} is not a file`);
  }
  return Buffer.from(data.content, "base64").toString("utf-8");
}

// ---- Review-pipeline-specific tools (Pass 4) ------------------------------

/** Unified diff text for the whole PR, via GitHub's diff media type. */
export async function getPRDiff(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: { format: "diff" },
  });
  // octokit's TypeScript types model `pulls.get`'s return as the parsed PR
  // object regardless of `mediaType`, but with `format: "diff"` the actual
  // runtime response body is the raw diff string. The cast below reflects
  // the documented runtime behavior, not the (misleading, for this case)
  // compile-time type — verify against your installed octokit version if
  // this ever looks wrong (e.g. logging `typeof data` should say "string").
  return data as unknown as string;
}

/** List of changed files with per-file patch/status — used to know which files to chunk+embed. */
export async function getPRChangedFiles(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
) {
  const octokit = await getInstallationOctokit(installationId);
  return octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });
}

export type ReviewCommentInput = {
  path: string;
  line: number;
  body: string;
};

/**
 * Posts the AI review as a single formal GitHub PR review with inline
 * comments, per PRD PR-1 ("Posts as formal PR review with inline comments").
 * `event: "COMMENT"` (not APPROVE/REQUEST_CHANGES) — approval is a human
 * decision in this product (Phase 5), the AI review never blocks merge at
 * the GitHub level, only at the ShipFlow state-machine level.
 */
export async function postReview(params: {
  installationId: number;
  owner: string;
  repo: string;
  pullNumber: number;
  commitSha: string;
  summary: string;
  comments: ReviewCommentInput[];
}) {
  const octokit = await getInstallationOctokit(params.installationId);
  return octokit.rest.pulls.createReview({
    owner: params.owner,
    repo: params.repo,
    pull_number: params.pullNumber,
    commit_id: params.commitSha,
    event: "COMMENT",
    body: params.summary,
    comments: params.comments.map((c) => ({
      path: c.path,
      line: c.line,
      side: "RIGHT" as const,
      body: c.body,
    })),
  });
}
