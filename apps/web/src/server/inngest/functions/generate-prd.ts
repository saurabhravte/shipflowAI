import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { db, featureRequest, clarifyingExchange, prd } from "@shipflow/db";
import { inngest } from "../client";
import { models } from "@/lib/ai/models";
import { prdGenerationSchema } from "@/lib/ai/schemas";
import { prdGenerationPrompt } from "@/lib/ai/prompts";
import { transitionFeatureRequest } from "@/server/workflows/state-machine";
import { assertWithinLimit, incrementUsage, UsageLimitExceededError } from "@/lib/billing/usage";

export const generatePrd = inngest.createFunction(
  { id: "generate-prd", retries: 2 },
  { event: "feature_request/prd_requested" },
  async ({ event, step }) => {
    const { featureRequestId } = event.data;

    const fr = await step.run("load-feature-request", async () => {
      const row = await db.query.featureRequest.findFirst({
        where: eq(featureRequest.id, featureRequestId),
      });
      if (!row) throw new Error(`FeatureRequest ${featureRequestId} not found`);
      return row;
    });

    const withinLimit = await step.run("check-usage-limit", async () => {
      try {
        await assertWithinLimit(fr.workspaceId, "prdGenerationsPerMonth");
        return true;
      } catch (err) {
        if (err instanceof UsageLimitExceededError) return false;
        throw err;
      }
    });

    if (!withinLimit) {
      // Leave the feature request in prd_generating with no PRD row — the
      // UI's "AI is working on this" state would otherwise spin forever, so
      // surface a clear signal instead. A toast-on-poll pattern in the
      // frontend (Pass 5) reads this via a dedicated `error` field; for v1,
      // logging plus leaving status unchanged is the documented gap — see
      // README "Known gaps" for the follow-up.
      console.warn(`[generate-prd] usage limit exceeded for workspace ${fr.workspaceId}`);
      return { skipped: true as const, reason: "usage_limit_exceeded" };
    }

    const qas = await step.run("load-clarifying-exchanges", async () => {
      return db.query.clarifyingExchange.findMany({
        where: eq(clarifyingExchange.featureRequestId, featureRequestId),
        orderBy: (t, { asc }) => asc(t.order),
      });
    });

    const generated = await step.run("generate-prd-content", async () => {
      const { object } = await generateObject({
        model: models.fast,
        schema: prdGenerationSchema,
        prompt: prdGenerationPrompt({
          title: fr.title,
          rawRequest: fr.rawRequest,
          clarifyingQAs: qas.map((q) => ({ question: q.question, answer: q.answer })),
        }),
      });
      return object;
    });

    await step.run("persist-prd-and-transition", async () => {
      await db
        .insert(prd)
        .values({
          featureRequestId,
          problemStatement: generated.problemStatement,
          goals: generated.goals,
          nonGoals: generated.nonGoals,
          userStories: generated.userStories.map((s, i) => ({ id: `us_${i}`, ...s })),
          acceptanceCriteria: generated.acceptanceCriteria.map((c, i) => ({
            id: `ac_${i}`,
            description: c.description,
          })),
          edgeCases: generated.edgeCases,
          successMetrics: generated.successMetrics.map((m, i) => ({ id: `sm_${i}`, ...m })),
        })
        .onConflictDoUpdate({
          target: prd.featureRequestId,
          set: {
            problemStatement: generated.problemStatement,
            goals: generated.goals,
            nonGoals: generated.nonGoals,
            userStories: generated.userStories.map((s, i) => ({ id: `us_${i}`, ...s })),
            acceptanceCriteria: generated.acceptanceCriteria.map((c, i) => ({
              id: `ac_${i}`,
              description: c.description,
            })),
            edgeCases: generated.edgeCases,
            successMetrics: generated.successMetrics.map((m, i) => ({ id: `sm_${i}`, ...m })),
          },
        });

      await transitionFeatureRequest(featureRequestId, "prd_review");
      await incrementUsage(fr.workspaceId, "prdGenerationsPerMonth");
    });

    return { ok: true };
  },
);
