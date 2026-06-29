import { serve } from "inngest/next";
import { inngest } from "@/server/inngest/client";
import { clarifyFeatureRequest } from "@/server/inngest/functions/clarify-feature-request";
import { generatePrd } from "@/server/inngest/functions/generate-prd";
import { generateTasks } from "@/server/inngest/functions/generate-tasks";
import { reviewPullRequest } from "@/server/inngest/functions/review-pull-request";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [clarifyFeatureRequest, generatePrd, generateTasks, reviewPullRequest],
});
