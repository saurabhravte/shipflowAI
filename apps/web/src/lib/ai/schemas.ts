import { z } from "zod";

/** Output of the clarifying-questions step. */
export const clarifyingQuestionsSchema = z.object({
  /**
   * Empty array means the AI judged the request as already clear enough to
   * go straight to PRD generation — see ARCHITECTURE.md / PRD Phase 1:
   * "Not every request requires it to be built [clarified]."
   */
  questions: z.array(z.string()).max(5),
  /** Non-null if the AI believes this duplicates existing functionality — surfaced to the human, doesn't block. */
  possibleDuplicateNote: z.string().nullable(),
});
export type ClarifyingQuestionsOutput = z.infer<typeof clarifyingQuestionsSchema>;

/** Output of PRD generation — mirrors the `prd` Drizzle table's structured fields exactly. */
export const prdGenerationSchema = z.object({
  problemStatement: z.string(),
  goals: z.array(z.string()),
  nonGoals: z.array(z.string()),
  userStories: z.array(
    z.object({
      asA: z.string(),
      iWant: z.string(),
      soThat: z.string(),
    }),
  ),
  acceptanceCriteria: z.array(z.object({ description: z.string() })),
  edgeCases: z.array(z.string()),
  successMetrics: z.array(z.object({ metric: z.string(), target: z.string() })),
});
export type PrdGenerationOutput = z.infer<typeof prdGenerationSchema>;

/** Output of task breakdown generation. */
export const taskGenerationSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["low", "medium", "high", "urgent"]),
    }),
  ),
});
export type TaskGenerationOutput = z.infer<typeof taskGenerationSchema>;

/**
 * Output of the AI code review step. Mirrors the `reviewFinding` table.
 * `severity` drives the FIX_NEEDED vs HUMAN_APPROVAL transition — see
 * ARCHITECTURE.md Section 3 — so the model is instructed (in the prompt,
 * not just the schema) to reserve "blocking" for things that actually must
 * be fixed before merge, not general nitpicks.
 */
export const reviewFindingsSchema = z.object({
  summary: z.string(),
  findings: z.array(
    z.object({
      category: z.enum([
        "requirements",
        "acceptance_criteria",
        "security",
        "performance",
        "edge_case",
        "code_quality",
      ]),
      severity: z.enum(["blocking", "non_blocking"]),
      filePath: z.string().nullable(),
      startLine: z.number().nullable(),
      endLine: z.number().nullable(),
      message: z.string(),
      rationale: z.string(),
      suggestion: z.string().nullable(),
    }),
  ),
  /** True if the AI judged the PR ready to move to human approval (no blocking findings AND requirements appear satisfied). */
  readyForApproval: z.boolean(),
});
export type ReviewFindingsOutput = z.infer<typeof reviewFindingsSchema>;
