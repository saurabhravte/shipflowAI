import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { db, prd, task, featureRequest } from "@shipflow/db";
import { inngest } from "../client";
import { getModelsForWorkspace } from "@/lib/ai/models";
import { taskGenerationSchema } from "@/lib/ai/schemas";
import { taskGenerationPrompt } from "@/lib/ai/prompts";
import { transitionFeatureRequest } from "@/server/workflows/state-machine";

export const generateTasks = inngest.createFunction(
  { id: "generate-tasks", retries: 2 },
  { event: "prd/approved" },
  async ({ event, step }) => {
    const { featureRequestId } = event.data;

    const prdRow = await step.run("load-prd", async () => {
      const row = await db.query.prd.findFirst({
        where: eq(prd.featureRequestId, featureRequestId),
      });
      if (!row)
        throw new Error(`PRD for FeatureRequest ${featureRequestId} not found`);
      return row;
    });

    const fr = await step.run("load-feature-request", async () => {
      const row = await db.query.featureRequest.findFirst({
        where: eq(featureRequest.id, featureRequestId),
      });
      if (!row) throw new Error(`FeatureRequest ${featureRequestId} not found`);
      return row;
    });

    const generated = await step.run("generate-task-list", async () => {
      const models = await getModelsForWorkspace(fr.workspaceId);
      const { object } = await generateObject({
        model: models.fast,
        schema: taskGenerationSchema,
        prompt: taskGenerationPrompt({
          prdSummary: prdRow.problemStatement,
          acceptanceCriteria: prdRow.acceptanceCriteria.map(
            (c) => c.description,
          ),
        }),
      });
      return object;
    });

    await step.run("persist-tasks-and-transition", async () => {
      if (generated.tasks.length > 0) {
        await db.insert(task).values(
          generated.tasks.map((t, i) => ({
            featureRequestId,
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: "backlog" as const,
            position: i,
          })),
        );
      }

      await transitionFeatureRequest(featureRequestId, "tasks_review");
    });

    return { taskCount: generated.tasks.length };
  },
);
