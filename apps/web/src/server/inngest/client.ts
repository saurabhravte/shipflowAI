import "server-only";
import { Inngest, EventSchemas } from "inngest";

/**
 * Full event schema for the core loop. Each event corresponds to exactly
 * one Inngest function below (see server/inngest/functions/*.ts) — this is
 * the contract between "something happened" (tRPC mutation or webhook) and
 * "do the slow work" (the actual Inngest function), per
 * ARCHITECTURE.md Section 4.
 */
type Events = {
  /** Sent by featureRequest.startClarification — kicks off the AI clarifying-question step. */
  "feature_request/clarify_requested": {
    data: { featureRequestId: string };
  };
  /** Sent once clarification is done (or skipped) — generates the structured PRD. */
  "feature_request/prd_requested": {
    data: { featureRequestId: string };
  };
  /** Sent when a human approves the PRD — generates the task breakdown. */
  "prd/approved": {
    data: { featureRequestId: string };
  };
  /** Sent by the GitHub webhook handler on PR opened/synchronize/reopened. */
  "github/pull_request.review_requested": {
    data: {
      pullRequestId: string;
      repositoryId: string;
      installationId: number | undefined;
      headSha: string;
    };
  };
};

export const inngest = new Inngest({
  id: "shipflow-ai",
  schemas: new EventSchemas().fromRecord<Events>(),
});
