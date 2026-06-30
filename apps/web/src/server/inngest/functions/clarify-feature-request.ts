import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { db, featureRequest, clarifyingExchange } from "@shipflow/db";
import { inngest } from "../client";
import { getModelsForWorkspace } from "@/lib/ai/models";
import { clarifyingQuestionsSchema } from "@/lib/ai/schemas";
import { clarifyingQuestionsPrompt } from "@/lib/ai/prompts";
import { transitionFeatureRequest } from "@/server/workflows/state-machine";

/**
 * Triggered right after a feature request is created. Decides whether to
 * ask clarifying questions or go straight to PRD generation — per the PRD's
 * Phase 1: "Not every request requires it to be build[clarified]."
 */
export const clarifyFeatureRequest = inngest.createFunction(
  { id: "clarify-feature-request", retries: 2 },
  { event: "feature_request/clarify_requested" },
  async ({ event, step }) => {
    const { featureRequestId } = event.data;

    const fr = await step.run("load-feature-request", async () => {
      const row = await db.query.featureRequest.findFirst({
        where: eq(featureRequest.id, featureRequestId),
      });
      if (!row) throw new Error(`FeatureRequest ${featureRequestId} not found`);
      return row;
    });

    const result = await step.run("generate-clarifying-questions", async () => {
      const models = await getModelsForWorkspace(fr.workspaceId);
      const { object } = await generateObject({
        model: models.fast,
        schema: clarifyingQuestionsSchema,
        prompt: clarifyingQuestionsPrompt({
          rawRequest: fr.rawRequest,
          sourceChannel: fr.sourceChannel,
        }),
      });
      return object;
    });

    const { questionsAsked } = await step.run("persist-result", async () => {
      if (result.questions.length > 0) {
        await db.insert(clarifyingExchange).values(
          result.questions.map((q, i) => ({
            featureRequestId,
            question: q,
            order: i,
          })),
        );
      }

      if (result.possibleDuplicateNote) {
        await db
          .update(featureRequest)
          .set({ duplicateOfNote: result.possibleDuplicateNote })
          .where(eq(featureRequest.id, featureRequestId));
      }

      // No questions needed -> the human never sees a "clarifying" step;
      // go straight to PRD generation. Otherwise sit in "clarifying" until
      // the human answers (UI calls featureRequest.submitClarifyingAnswers,
      // which transitions to prd_generating itself — see Pass 5 router).
      if (result.questions.length === 0) {
        await transitionFeatureRequest(featureRequestId, "prd_generating");
      } else {
        await transitionFeatureRequest(featureRequestId, "clarifying");
      }

      return { questionsAsked: result.questions.length };
    });

    if (questionsAsked === 0) {
      await step.sendEvent("trigger-prd-generation", {
        name: "feature_request/prd_requested",
        data: { featureRequestId },
      });
    }

    return { questionsAsked };
  },
);
