import { router } from "./trpc";
import { workspaceRouter } from "../routers/workspace";
import { githubRouter } from "../routers/github";
import { projectRouter } from "../routers/project";
import { featureRequestRouter } from "../routers/feature-request";
import { prdRouter } from "../routers/prd";
import { taskRouter } from "../routers/task";
import { pullRequestRouter, reviewRouter } from "../routers/pull-request";
import { approvalRouter } from "../routers/approval";
import { billingRouter } from "../routers/billing";

/** All domain routers mounted — the full core loop plus billing (Pass 6 complete). */
export const appRouter = router({
  workspace: workspaceRouter,
  github: githubRouter,
  project: projectRouter,
  featureRequest: featureRequestRouter,
  prd: prdRouter,
  task: taskRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
  approval: approvalRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
